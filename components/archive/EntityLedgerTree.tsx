'use client'

import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Loader2,
  ChevronDown,
  ChevronRight,
  Eye,
  Search,
  BookOpen,
  Scale,
  BarChart3
} from 'lucide-react'
import { useAccountingAccounts, useRecordSheets } from '@/lib/hooks/useArchive'
import { organizationApi } from '@/lib/api/organization'
import AppDialog from '@/components/ui/AppDialog'
import { Button } from '@/components/ui/Button'
import type { AccountingAccount, RecordSheet } from '@/lib/types'

interface EntityLedgerTreeProps {
  entityType: 'company' | 'project'
  entityId: number
  companyId?: number // Required for project type to resolve distributed company sheets
  companyProjectIds?: number[] // For company view, to map project sheets
  annualMovement?: AnnualMovementEntry[] // Egg production statistics per year
}

type AnnualMovementEntry = {
  year: number | string
  eggs_produced?: number
}

type YearlyStat = {
  Year: number
  TotalDebit: number
  TotalCredit: number
  TotalEggs: number
}

type LedgerMeta = {
  link_type?: string
  company_id?: number | string
  project_id?: number | string
  distribute_by_production?: boolean | number | string
}

type AccountNode = Pick<AccountingAccount, 'id' | 'parent_id' | 'code' | 'name' | 'type'> & {
  children: AccountNode[]
  TotalDebit: number
  TotalCredit: number
  is_linked: boolean
}

function getSubAccountIds(account: AccountNode): number[] {
  const ids = [account.id]
  if (account.children) {
    for (const child of account.children) {
      ids.push(...getSubAccountIds(child))
    }
  }
  return ids
}

export default function EntityLedgerTree({
  entityType,
  entityId,
  companyId,
  companyProjectIds = [],
  annualMovement = []
}: EntityLedgerTreeProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [collapsedStates, setCollapsedStates] = useState<Record<number, boolean>>({})
  const [detailsAccount, setDetailsAccount] = useState<AccountNode | null>(null)

  const toggleCollapse = (id: number) => {
    setCollapsedStates(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  // 1. Fetch all accounts and record sheets
  const { data: accountsRes, isLoading: loadingAccounts } = useAccountingAccounts()
  const { data: sheetsRes, isLoading: loadingSheets } = useRecordSheets()

  // 2. If viewing a project, query company statistics to calculate egg production ratio
  const { data: companyStatsRes, isLoading: loadingCompanyStats } = useQuery({
    queryKey: ['company-statistics', companyId],
    queryFn: () => organizationApi.getCompanyStatistics(companyId!),
    enabled: entityType === 'project' && !!companyId,
  })

  // 3. Compute Project production share ratio (all-time eggs)
  const projectAllTimeEggs = useMemo(() => {
    if (!annualMovement) return 0
    return annualMovement.reduce((sum, movement) => sum + (movement.eggs_produced || 0), 0)
  }, [annualMovement])

  const companyAllTimeEggs = useMemo(() => {
    const compMovement = companyStatsRes?.annual_movement as AnnualMovementEntry[] | undefined
    if (!compMovement) return 0
    return compMovement.reduce((sum, movement) => sum + (movement.eggs_produced || 0), 0)
  }, [companyStatsRes])

  const shareRatio = useMemo(() => {
    if (companyAllTimeEggs === 0) return 0
    return projectAllTimeEggs / companyAllTimeEggs
  }, [projectAllTimeEggs, companyAllTimeEggs])

  // 4. Build and rollup the accounts tree
  const accountsTree = useMemo(() => {
    if (!accountsRes?.data || !sheetsRes?.data) return []

    const rawAccounts = accountsRes.data as AccountingAccount[]
    const rawSheets = sheetsRes.data as RecordSheet[]

    // Step A: Initialize Map
    const map: Record<number, AccountNode> = {}
    for (const acc of rawAccounts) {
      map[acc.id] = {
        id: acc.id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        parent_id: acc.parent_id,
        children: [],
        TotalDebit: 0,
        TotalCredit: 0,
        is_linked: false,
      }
    }

    const getMeta = (sheet: RecordSheet): LedgerMeta | undefined => sheet.folder?.meta as LedgerMeta | undefined

    // Step B: Aggregate Sheet totals into Accounts with scale
    for (const sheet of rawSheets) {
      const folder = sheet.folder
      const meta = getMeta(sheet)
      if (!folder || !meta) continue

      let isIncluded = false
      let scale = 1

      if (entityType === 'company') {
        const isDirectCompany = meta.link_type === 'company' && Number(meta.company_id) === entityId
        const isUnderCompanyProject = meta.link_type === 'project' && companyProjectIds.includes(Number(meta.project_id))
        if (isDirectCompany || isUnderCompanyProject) {
          isIncluded = true
        }
      } else if (entityType === 'project') {
        const isDirectProject = meta.link_type === 'project' && Number(meta.project_id) === entityId
        const isDistributedCompany = meta.link_type === 'company' && Number(meta.company_id) === companyId && (meta.distribute_by_production === true || meta.distribute_by_production === 1 || meta.distribute_by_production === '1')

        if (isDirectProject) {
          isIncluded = true
        } else if (isDistributedCompany) {
          isIncluded = true
          scale = shareRatio
        }
      }

      if (isIncluded) {
        const accId = sheet.account_id
        if (map[accId]) {
          const debit = parseFloat(sheet.total_debit?.toString() || '0')
          const credit = parseFloat(sheet.total_credit?.toString() || '0')
          map[accId].TotalDebit += debit * scale
          map[accId].TotalCredit += credit * scale
          map[accId].is_linked = true
        }
      }
    }

    // Step C: Roll up balances recursively (bottom-up)
    // We sort accounts by depth or parent-child hierarchy to ensure proper rollup,
    // but a simple walk-up-to-root loop per node is highly effective and works for any depth.
    for (const id in map) {
      const acc = map[id]
      if (acc.TotalDebit > 0 || acc.TotalCredit > 0) {
        let parentId = acc.parent_id
        while (parentId !== null && map[parentId]) {
          map[parentId].TotalDebit += acc.TotalDebit
          map[parentId].TotalCredit += acc.TotalCredit
          parentId = map[parentId].parent_id
        }
      }
    }

    // Step D: Construct Roots and sort
    const roots: AccountNode[] = []
    for (const id in map) {
      const acc = map[id]
      if (acc.parent_id === null) {
        roots.push(acc)
      } else if (map[acc.parent_id]) {
        map[acc.parent_id].children.push(acc)
      }
    }

    // Sort function by account code
    const sortAccounts = (list: AccountNode[]) => {
      list.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
      for (const item of list) {
        if (item.children.length > 0) {
          sortAccounts(item.children)
        }
      }
    }
    sortAccounts(roots)

    return roots
  }, [accountsRes, sheetsRes, entityType, entityId, companyId, companyProjectIds, shareRatio])

  // Helper to determine if node or descendants match search query
  const matchesSearch = (account: AccountNode, query: string): boolean => {
    if (!query) return true
    const normalizedQuery = query.toLowerCase()
    const nameMatches = account.name.toLowerCase().includes(normalizedQuery)
    const codeMatches = account.code.toLowerCase().includes(normalizedQuery)
    if (nameMatches || codeMatches) return true
    return account.children?.some((child) => matchesSearch(child, query)) ?? false
  }

  // Helper to check if node or descendants have non-zero data
  const hasActiveData = (account: AccountNode): boolean => {
    if (account.TotalDebit !== 0 || account.TotalCredit !== 0 || account.is_linked) {
      return true
    }
    return account.children?.some((child) => hasActiveData(child)) ?? false
  }

  // Helper to compute account balance
  const getBalanceInfo = (debit: number, credit: number, type: string) => {
    let balance = 0
    let label = ''
    let isPositive = true

    if (['liability', 'equity', 'revenue'].includes(type)) {
      balance = credit - debit
      label = balance >= 0 ? 'دائن' : 'مدين'
      isPositive = balance >= 0
    } else {
      balance = debit - credit
      label = balance >= 0 ? 'مدين' : 'دائن'
      isPositive = balance >= 0
    }

    return {
      absBalance: Math.abs(balance),
      label,
      isPositive,
    }
  }

  // 5. Compute Yearly Statistics of specific Account and its child accounts
  const accountYearlyStats = useMemo(() => {
    if (!detailsAccount || !sheetsRes?.data) return []
    const subAccountIds = getSubAccountIds(detailsAccount)
    const rawSheets = sheetsRes.data as RecordSheet[]
    const yearlyData: Record<number, YearlyStat> = {}

    for (const sheet of rawSheets) {
      if (!subAccountIds.includes(sheet.account_id)) continue

      const folder = sheet.folder
      const meta = folder?.meta as LedgerMeta | undefined
      if (!folder || !meta) continue

      let isIncluded = false
      let scale = 1

      if (entityType === 'company') {
        const isDirectCompany = meta.link_type === 'company' && Number(meta.company_id) === entityId
        const isUnderCompanyProject = meta.link_type === 'project' && companyProjectIds.includes(Number(meta.project_id))
        if (isDirectCompany || isUnderCompanyProject) {
          isIncluded = true
        }
      } else if (entityType === 'project') {
        const isDirectProject = meta.link_type === 'project' && Number(meta.project_id) === entityId
        const isDistributedCompany = meta.link_type === 'company' && Number(meta.company_id) === companyId && (meta.distribute_by_production === true || meta.distribute_by_production === 1 || meta.distribute_by_production === '1')

        if (isDirectProject) {
          isIncluded = true
        } else if (isDistributedCompany) {
          isIncluded = true
          scale = shareRatio
        }
      }

      if (isIncluded) {
        const year = new Date(sheet.period_start).getFullYear()
        if (!yearlyData[year]) {
          yearlyData[year] = { Year: year, TotalDebit: 0, TotalCredit: 0, TotalEggs: 0 }
        }
        yearlyData[year].TotalDebit += parseFloat(sheet.total_debit?.toString() || '0') * scale
        yearlyData[year].TotalCredit += parseFloat(sheet.total_credit?.toString() || '0') * scale
      }
    }

    if (annualMovement) {
      for (const movement of annualMovement) {
        const year = Number(movement.year)
        if (yearlyData[year]) {
          yearlyData[year].TotalEggs = movement.eggs_produced || 0
        }
      }
    }

    return Object.values(yearlyData).sort((a, b) => b.Year - a.Year)
  }, [detailsAccount, sheetsRes, entityType, entityId, companyId, companyProjectIds, shareRatio, annualMovement])

  // 6. Compute Entity Yearly Statistics (all folders combined)
  const entityYearlyStats = useMemo(() => {
    if (!sheetsRes?.data) return []
    const rawSheets = sheetsRes.data as RecordSheet[]
    const yearlyData: Record<number, YearlyStat> = {}

    for (const sheet of rawSheets) {
      const folder = sheet.folder
      const meta = folder?.meta as LedgerMeta | undefined
      if (!folder || !meta) continue

      let isIncluded = false
      let scale = 1

      if (entityType === 'company') {
        const isDirectCompany = meta.link_type === 'company' && Number(meta.company_id) === entityId
        const isUnderCompanyProject = meta.link_type === 'project' && companyProjectIds.includes(Number(meta.project_id))
        if (isDirectCompany || isUnderCompanyProject) {
          isIncluded = true
        }
      } else if (entityType === 'project') {
        const isDirectProject = meta.link_type === 'project' && Number(meta.project_id) === entityId
        const isDistributedCompany = meta.link_type === 'company' && Number(meta.company_id) === companyId && (meta.distribute_by_production === true || meta.distribute_by_production === 1 || meta.distribute_by_production === '1')

        if (isDirectProject) {
          isIncluded = true
        } else if (isDistributedCompany) {
          isIncluded = true
          scale = shareRatio
        }
      }

      if (isIncluded) {
        const year = new Date(sheet.period_start).getFullYear()
        if (!yearlyData[year]) {
          yearlyData[year] = { Year: year, TotalDebit: 0, TotalCredit: 0, TotalEggs: 0 }
        }
        yearlyData[year].TotalDebit += parseFloat(sheet.total_debit?.toString() || '0') * scale
        yearlyData[year].TotalCredit += parseFloat(sheet.total_credit?.toString() || '0') * scale
      }
    }

    if (annualMovement) {
      for (const movement of annualMovement) {
        const year = Number(movement.year)
        if (yearlyData[year]) {
          yearlyData[year].TotalEggs = movement.eggs_produced || 0
        }
      }
    }

    return Object.values(yearlyData).sort((a, b) => b.Year - a.Year)
  }, [sheetsRes, entityType, entityId, companyId, companyProjectIds, shareRatio, annualMovement])

  // Helper to format currency
  const formatNum = (num: number) => {
    return new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num)
  }

  const renderYearlyStatCards = (rows: YearlyStat[]) => (
    <div className="grid grid-cols-1 gap-4 lg:hidden">
      {rows.map((row) => {
        const net = row.TotalDebit - row.TotalCredit
        const netType = net >= 0 ? 'مدين' : 'دائن'
        const absNet = Math.abs(net)

        const eggs = row.TotalEggs
        const plates = eggs / 30
        const cartons = eggs / 360

        const cartonCost = cartons > 0 ? absNet / cartons : 0
        const plateCost = plates > 0 ? absNet / plates : 0
        const eggCost = eggs > 0 ? absNet / eggs : 0

        return (
          <article key={row.Year} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-slate-500">السنة</p>
                <h3 className="text-lg font-bold text-slate-800">{row.Year}</h3>
              </div>
              <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${net >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                {netType}
              </span>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-slate-50 px-3 py-2">
                <dt className="text-xs font-semibold text-slate-500">إجمالي مدين</dt>
                <dd className="mt-1 break-words font-mono font-semibold text-slate-700">{formatNum(row.TotalDebit)}</dd>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2">
                <dt className="text-xs font-semibold text-slate-500">إجمالي دائن</dt>
                <dd className="mt-1 break-words font-mono font-semibold text-slate-700">{formatNum(row.TotalCredit)}</dd>
              </div>
              <div className="col-span-2 rounded-xl bg-slate-50 px-3 py-2">
                <dt className="text-xs font-semibold text-slate-500">الصافي</dt>
                <dd className={`mt-1 break-words font-mono font-bold ${net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatNum(absNet)} ر.س
                </dd>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2">
                <dt className="text-xs font-semibold text-slate-500">عدد الكرتون</dt>
                <dd className="mt-1 break-words font-mono font-semibold text-slate-700">{formatNum(cartons)}</dd>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2">
                <dt className="text-xs font-semibold text-slate-500">ت.الكرتون</dt>
                <dd className="mt-1 break-words font-mono font-semibold text-slate-700">{cartons > 0 ? `${formatNum(cartonCost)} ر.س` : '-'}</dd>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2">
                <dt className="text-xs font-semibold text-slate-500">عدد الطبق</dt>
                <dd className="mt-1 break-words font-mono font-semibold text-slate-700">{formatNum(plates)}</dd>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2">
                <dt className="text-xs font-semibold text-slate-500">ت.الطبق</dt>
                <dd className="mt-1 break-words font-mono font-semibold text-slate-700">{plates > 0 ? `${formatNum(plateCost)} ر.س` : '-'}</dd>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2">
                <dt className="text-xs font-semibold text-slate-500">عدد البيض</dt>
                <dd className="mt-1 break-words font-mono font-semibold text-slate-700">{formatNum(eggs)}</dd>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2">
                <dt className="text-xs font-semibold text-slate-500">ت.البيضة</dt>
                <dd className="mt-1 break-words font-mono font-semibold text-slate-700">{eggs > 0 ? `${formatNum(eggCost)} ر.س` : '-'}</dd>
              </div>
            </dl>
          </article>
        )
      })}
    </div>
  )

  // 7. Recursive render row function
  const renderAccountRow = (account: AccountNode, level: number = 0): React.ReactNode => {
    // Skip if search pattern does not match this branch or if it has no data
    if (!matchesSearch(account, searchQuery)) return null
    if (!hasActiveData(account)) return null

    const hasChildren = account.children && account.children.length > 0
    const isCollapsed = collapsedStates[account.id] ?? false
    const balInfo = getBalanceInfo(account.TotalDebit, account.TotalCredit, account.type)

    return (
      <React.Fragment key={account.id}>
        <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
          <td className="p-3 text-right">
            <div
              className="flex items-center gap-2"
              style={{ paddingRight: `${level * 24}px` }}
            >
              {hasChildren ? (
                <Button
                  type="button"
                  onClick={() => toggleCollapse(account.id)}
                  variant="ghost"
                  size="icon"
                  className="h-9 min-h-9 w-9 rounded-md"
                  aria-label={isCollapsed ? 'توسيع الحساب' : 'طي الحساب'}
                >
                  {isCollapsed ? (
                    <ChevronRight className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </Button>
              ) : (
                <span className="w-5.5" />
              )}
              <span className="font-mono text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-bold">
                {account.code}
              </span>
              <strong className="text-slate-800 text-xs">{account.name}</strong>
              {account.is_linked && (
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" title="حساب مباشر" />
              )}
              <Button
                type="button"
                onClick={() => setDetailsAccount(account)}
                variant="outline"
                size="sm"
                className="mr-auto h-9 min-h-9 rounded-md px-2 py-1 text-xs"
                leftIcon={<Eye className="w-3 h-3" />}
              >
                <span>تفاصيل</span>
              </Button>
            </div>
          </td>
          <td className="p-3 text-left font-mono text-xs text-slate-700">
            {formatNum(account.TotalDebit)}
          </td>
          <td className="p-3 text-left font-mono text-xs text-slate-700">
            {formatNum(account.TotalCredit)}
          </td>
          <td className="p-3 text-left">
            <div className="flex flex-col items-end">
              <span className="font-mono text-xs font-bold text-slate-900">
                {formatNum(balInfo.absBalance)} ر.س
              </span>
              <span
                className={`text-xs font-bold px-1 rounded ${
                  balInfo.isPositive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-rose-50 text-rose-700'
                }`}
              >
                {balInfo.label}
              </span>
            </div>
          </td>
        </tr>
        {hasChildren && !isCollapsed && account.children.map((child) => renderAccountRow(child, level + 1))}
      </React.Fragment>
    )
  }

  const renderAccountCard = (account: AccountNode, level: number = 0): React.ReactNode => {
    if (!matchesSearch(account, searchQuery)) return null
    if (!hasActiveData(account)) return null

    const hasChildren = account.children && account.children.length > 0
    const isCollapsed = collapsedStates[account.id] ?? false
    const balInfo = getBalanceInfo(account.TotalDebit, account.TotalCredit, account.type)

    return (
      <React.Fragment key={account.id}>
        <article
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          style={{ marginRight: `${Math.min(level * 12, 48)}px` }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-2">
              {hasChildren ? (
                <Button
                  type="button"
                  onClick={() => toggleCollapse(account.id)}
                  variant="ghost"
                  size="icon"
                  aria-label={isCollapsed ? 'توسيع الحساب' : 'طي الحساب'}
                >
                  {isCollapsed ? (
                    <ChevronRight className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              ) : null}
              <div className="min-w-0 space-y-1">
                <span className="inline-flex rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-bold text-slate-500">
                  {account.code}
                </span>
                <div className="flex min-w-0 items-center gap-2">
                  <strong className="truncate text-sm font-bold text-slate-800">{account.name}</strong>
                  {account.is_linked && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" title="حساب مباشر" />
                  )}
                </div>
              </div>
            </div>
            <Button
              type="button"
              onClick={() => setDetailsAccount(account)}
              variant="outline"
              size="sm"
              className="shrink-0"
              leftIcon={<Eye className="w-4 h-4" />}
            >
              تفاصيل
            </Button>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-slate-50 px-3 py-2">
              <dt className="text-xs font-semibold text-slate-500">إجمالي مدين</dt>
              <dd className="mt-1 break-words font-mono font-semibold text-slate-700">{formatNum(account.TotalDebit)}</dd>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2">
              <dt className="text-xs font-semibold text-slate-500">إجمالي دائن</dt>
              <dd className="mt-1 break-words font-mono font-semibold text-slate-700">{formatNum(account.TotalCredit)}</dd>
            </div>
            <div className="col-span-2 rounded-xl bg-slate-50 px-3 py-2">
              <dt className="text-xs font-semibold text-slate-500">الرصيد النهائي</dt>
              <dd className="mt-1 flex flex-wrap items-center gap-2">
                <span className="break-words font-mono text-sm font-bold text-slate-900">
                  {formatNum(balInfo.absBalance)} ر.س
                </span>
                <span
                  className={`rounded px-1.5 py-0.5 text-xs font-bold ${
                    balInfo.isPositive
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {balInfo.label}
                </span>
              </dd>
            </div>
          </dl>
        </article>
        {hasChildren && !isCollapsed && account.children.map((child) => renderAccountCard(child, level + 1))}
      </React.Fragment>
    )
  }

  const isLoading = loadingAccounts || loadingSheets || (entityType === 'project' && loadingCompanyStats)

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
        <p className="text-xs text-slate-500">جاري تحميل شجرة الحسابات والترصيد المالي...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* 1. Account Tree Card */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        {/* Card Header */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <BookOpen className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-800">قسم الدفاتر والسجلات الحسابية</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 mr-10">
              {entityType === 'company'
                ? 'عرض شجرة الحسابات والدفاتر المرتبطة بالشركة وفروع مشاريعها.'
                : 'عرض شجرة الحسابات والدفاتر المرتبطة بالمشروع والأقسام الموزعة.'}
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="بحث في شجرة الحسابات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-100 py-2 pl-3 pr-9 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:min-h-10 sm:text-xs"
            />
            <Search className="absolute right-3 top-3.5 w-4 h-4 text-slate-400 sm:top-3" />
          </div>
        </div>

        {/* Tree Table */}
        <div className="grid grid-cols-1 gap-3 p-4 lg:hidden">
          {accountsTree.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-6 text-center text-xs text-slate-400">
              لا توجد حسابات أو حركات مالية مسجلة لهذا الكيان.
            </div>
          ) : (
            accountsTree.map((root) => renderAccountCard(root, 0))
          )}
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-100/50 border-b border-slate-100 text-slate-500 text-xs font-bold">
                <th className="p-3 text-right" style={{ width: '45%' }}>شجرة الحسابات</th>
                <th className="p-3 text-left" style={{ width: '15%' }}>إجمالي مدين</th>
                <th className="p-3 text-left" style={{ width: '15%' }}>إجمالي دائن</th>
                <th className="p-3 text-left" style={{ width: '25%' }}>الرصيد النهائي</th>
              </tr>
            </thead>
            <tbody>
              {accountsTree.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-xs text-slate-400">
                    لا توجد حسابات أو حركات مالية مسجلة لهذا الكيان.
                  </td>
                </tr>
              ) : (
                accountsTree.map((root) => renderAccountRow(root, 0))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Global Yearly Summary Card */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-800">نظرة عامة سنوية (إجمالي الكيان)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 mr-10">
            ملخص الحركات المالية والإنتاجية مع احتساب التكاليف لكل كرتونة وطبق طبقاً لإجمالي السجلات.
          </p>
        </div>

        <div className="p-6">
          {entityYearlyStats.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400 bg-slate-50 rounded-2xl">
              لا توجد حركة مالية سنوية مسجلة.
            </div>
          ) : (
            <>
              {renderYearlyStatCards(entityYearlyStats)}
              <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 lg:block">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <th className="p-3 text-right">السنة</th>
                    <th className="p-3 text-left">إجمالي مدين</th>
                    <th className="p-3 text-left">إجمالي دائن</th>
                    <th className="p-3 text-left">الصافي</th>
                    <th className="p-3 text-left">عدد الكرتون</th>
                    <th className="p-3 text-left">ت.الكرتون</th>
                    <th className="p-3 text-left">عدد الطبق</th>
                    <th className="p-3 text-left">ت.الطبق</th>
                    <th className="p-3 text-left">عدد البيض</th>
                    <th className="p-3 text-left">ت.البيضة</th>
                  </tr>
                </thead>
                <tbody>
                  {entityYearlyStats.map((row) => {
                    const net = row.TotalDebit - row.TotalCredit
                    const netType = net >= 0 ? 'مدين' : 'دائن'
                    const absNet = Math.abs(net)

                    const eggs = row.TotalEggs
                    const plates = eggs / 30
                    const cartons = eggs / 360

                    const cartonCost = cartons > 0 ? absNet / cartons : 0
                    const plateCost = plates > 0 ? absNet / plates : 0
                    const eggCost = eggs > 0 ? absNet / eggs : 0

                    return (
                      <tr key={row.Year} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-bold text-slate-700">{row.Year}</td>
                        <td className="p-3 text-left font-mono">{formatNum(row.TotalDebit)}</td>
                        <td className="p-3 text-left font-mono">{formatNum(row.TotalCredit)}</td>
                        <td className={`p-3 text-left font-bold font-mono ${net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {formatNum(absNet)} <span className="text-xs font-bold mr-1">({netType})</span>
                        </td>
                        <td className="p-3 text-left font-mono">{formatNum(cartons)}</td>
                        <td className="p-3 text-left font-mono">{cartons > 0 ? `${formatNum(cartonCost)} ر.س` : '-'}</td>
                        <td className="p-3 text-left font-mono">{formatNum(plates)}</td>
                        <td className="p-3 text-left font-mono">{plates > 0 ? `${formatNum(plateCost)} ر.س` : '-'}</td>
                        <td className="p-3 text-left font-mono">{formatNum(eggs)}</td>
                        <td className="p-3 text-left font-mono">{eggs > 0 ? `${formatNum(eggCost)} ر.س` : '-'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 3. Account Yearly Details Dialog */}
      <AppDialog
        open={!!detailsAccount}
        onClose={() => setDetailsAccount(null)}
        panelClassName="max-w-6xl animate-fade-in"
      >
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
          <div className="bg-emerald-600 text-white p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-xl">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">الحركة المالية السنوية وتفاصيل الإنتاج</h3>
                <p className="text-xs text-white/80 mt-1">
                  الحساب: {detailsAccount?.code} - {detailsAccount?.name}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {accountYearlyStats.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400 bg-slate-50 rounded-2xl">
                لا توجد حركة مالية مسجلة لهذا الحساب عبر السنوات المالية.
              </div>
            ) : (
              <>
                {renderYearlyStatCards(accountYearlyStats)}
                <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 lg:block">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                      <th className="p-3 text-right">السنة</th>
                      <th className="p-3 text-left">إجمالي مدين</th>
                      <th className="p-3 text-left">إجمالي دائن</th>
                      <th className="p-3 text-left">الصافي</th>
                      <th className="p-3 text-left">عدد الكرتون</th>
                      <th className="p-3 text-left">ت.الكرتون</th>
                      <th className="p-3 text-left">عدد الطبق</th>
                      <th className="p-3 text-left">ت.الطبق</th>
                      <th className="p-3 text-left">عدد البيض</th>
                      <th className="p-3 text-left">ت.البيضة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accountYearlyStats.map((row) => {
                      const net = row.TotalDebit - row.TotalCredit
                      const netType = net >= 0 ? 'مدين' : 'دائن'
                      const absNet = Math.abs(net)

                      const eggs = row.TotalEggs
                      const plates = eggs / 30
                      const cartons = eggs / 360

                      const cartonCost = cartons > 0 ? absNet / cartons : 0
                      const plateCost = plates > 0 ? absNet / plates : 0
                      const eggCost = eggs > 0 ? absNet / eggs : 0

                      return (
                        <tr key={row.Year} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-bold text-slate-700">{row.Year}</td>
                          <td className="p-3 text-left font-mono">{formatNum(row.TotalDebit)}</td>
                          <td className="p-3 text-left font-mono">{formatNum(row.TotalCredit)}</td>
                          <td className={`p-3 text-left font-bold font-mono ${net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {formatNum(absNet)} <span className="text-xs font-bold mr-1">({netType})</span>
                          </td>
                          <td className="p-3 text-left font-mono">{formatNum(cartons)}</td>
                          <td className="p-3 text-left font-mono">{cartons > 0 ? `${formatNum(cartonCost)} ر.س` : '-'}</td>
                          <td className="p-3 text-left font-mono">{formatNum(plates)}</td>
                          <td className="p-3 text-left font-mono">{plates > 0 ? `${formatNum(plateCost)} ر.س` : '-'}</td>
                          <td className="p-3 text-left font-mono">{formatNum(eggs)}</td>
                          <td className="p-3 text-left font-mono">{eggs > 0 ? `${formatNum(eggCost)} ر.س` : '-'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                </div>
              </>
            )}

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                onClick={() => setDetailsAccount(null)}
                variant="outline"
              >
                إغلاق
              </Button>
            </div>
          </div>
        </div>
      </AppDialog>
    </div>
  )
}
