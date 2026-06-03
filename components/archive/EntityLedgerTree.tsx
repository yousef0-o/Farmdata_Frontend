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
  Calendar,
  Layers,
  Scale,
  BarChart3
} from 'lucide-react'
import { useAccountingAccounts, useRecordSheets } from '@/lib/hooks/useArchive'
import { organizationApi } from '@/lib/api/organization'
import AppDialog from '@/components/ui/AppDialog'
import type { AccountingAccount, RecordSheet } from '@/lib/types'

interface EntityLedgerTreeProps {
  entityType: 'company' | 'project'
  entityId: number
  companyId?: number // Required for project type to resolve distributed company sheets
  companyProjectIds?: number[] // For company view, to map project sheets
  annualMovement?: any[] // Egg production statistics per year
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
  const [detailsAccount, setDetailsAccount] = useState<any | null>(null)

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
    return annualMovement.reduce((sum: number, m: any) => sum + (m.eggs_produced || 0), 0)
  }, [annualMovement])

  const companyAllTimeEggs = useMemo(() => {
    const compMovement = companyStatsRes?.annual_movement
    if (!compMovement) return 0
    return compMovement.reduce((sum: number, m: any) => sum + (m.eggs_produced || 0), 0)
  }, [companyStatsRes])

  const shareRatio = useMemo(() => {
    if (companyAllTimeEggs === 0) return 0
    return projectAllTimeEggs / companyAllTimeEggs
  }, [projectAllTimeEggs, companyAllTimeEggs])

  // 4. Build and rollup the accounts tree
  const accountsTree = useMemo(() => {
    if (!accountsRes?.data || !sheetsRes?.data) return []

    const rawAccounts = accountsRes.data
    const rawSheets = sheetsRes.data

    // Step A: Initialize Map
    const map: Record<number, any> = {}
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

    // Step B: Aggregate Sheet totals into Accounts with scale
    for (const sheet of rawSheets) {
      const folder = sheet.folder
      const meta = folder?.meta
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
    const roots: any[] = []
    for (const id in map) {
      const acc = map[id]
      if (acc.parent_id === null) {
        roots.push(acc)
      } else if (map[acc.parent_id]) {
        map[acc.parent_id].children.push(acc)
      }
    }

    // Sort function by account code
    const sortAccounts = (list: any[]) => {
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
  const matchesSearch = (account: any, query: string): boolean => {
    if (!query) return true
    const normalizedQuery = query.toLowerCase()
    const nameMatches = account.name.toLowerCase().includes(normalizedQuery)
    const codeMatches = account.code.toLowerCase().includes(normalizedQuery)
    if (nameMatches || codeMatches) return true
    return account.children?.some((child: any) => matchesSearch(child, query)) ?? false
  }

  // Helper to check if node or descendants have non-zero data
  const hasActiveData = (account: any): boolean => {
    if (account.TotalDebit !== 0 || account.TotalCredit !== 0 || account.is_linked) {
      return true
    }
    return account.children?.some((child: any) => hasActiveData(child)) ?? false
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
  const getSubAccountIds = (account: any): number[] => {
    const ids = [account.id]
    if (account.children) {
      for (const child of account.children) {
        ids.push(...getSubAccountIds(child))
      }
    }
    return ids
  }

  const accountYearlyStats = useMemo(() => {
    if (!detailsAccount || !sheetsRes?.data) return []
    const subAccountIds = getSubAccountIds(detailsAccount)
    const rawSheets = sheetsRes.data
    const yearlyData: Record<number, { Year: number; TotalDebit: number; TotalCredit: number; TotalEggs: number }> = {}

    for (const sheet of rawSheets) {
      if (!subAccountIds.includes(sheet.account_id)) continue

      const folder = sheet.folder
      const meta = folder?.meta
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
      for (const m of annualMovement) {
        const year = Number(m.year)
        if (yearlyData[year]) {
          yearlyData[year].TotalEggs = m.eggs_produced || 0
        }
      }
    }

    return Object.values(yearlyData).sort((a, b) => b.Year - a.Year)
  }, [detailsAccount, sheetsRes, entityType, entityId, companyId, companyProjectIds, shareRatio, annualMovement])

  // 6. Compute Entity Yearly Statistics (all folders combined)
  const entityYearlyStats = useMemo(() => {
    if (!sheetsRes?.data) return []
    const rawSheets = sheetsRes.data
    const yearlyData: Record<number, { Year: number; TotalDebit: number; TotalCredit: number; TotalEggs: number }> = {}

    for (const sheet of rawSheets) {
      const folder = sheet.folder
      const meta = folder?.meta
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
      for (const m of annualMovement) {
        const year = Number(m.year)
        if (yearlyData[year]) {
          yearlyData[year].TotalEggs = m.eggs_produced || 0
        }
      }
    }

    return Object.values(yearlyData).sort((a, b) => b.Year - a.Year)
  }, [sheetsRes, entityType, entityId, companyId, companyProjectIds, shareRatio, annualMovement])

  // Helper to format currency
  const formatNum = (num: number) => {
    return new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num)
  }

  // 7. Recursive render row function
  const renderAccountRow = (account: any, level: number = 0): React.ReactNode => {
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
                <button
                  type="button"
                  onClick={() => toggleCollapse(account.id)}
                  className="p-1 rounded hover:bg-slate-100 text-slate-500 transition-colors"
                >
                  {isCollapsed ? (
                    <ChevronRight className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
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
              <button
                type="button"
                onClick={() => setDetailsAccount(account)}
                className="mr-auto flex items-center gap-1 text-[10px] bg-sky-50 text-sky-700 hover:bg-sky-100 hover:text-sky-800 px-2 py-1 rounded-md transition-colors"
              >
                <Eye className="w-3 h-3" />
                <span>تفاصيل</span>
              </button>
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
                className={`text-[10px] font-bold px-1 rounded ${
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
        {hasChildren && !isCollapsed && account.children.map((child: any) => renderAccountRow(child, level + 1))}
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
            <p className="text-[11px] text-slate-500 mt-1 mr-10">
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
              className="w-full pl-3 pr-9 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700"
            />
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
          </div>
        </div>

        {/* Tree Table */}
        <div className="overflow-x-auto">
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
          <p className="text-[11px] text-slate-500 mt-1 mr-10">
            ملخص الحركات المالية والإنتاجية مع احتساب التكاليف لكل كرتونة وطبق طبقاً لإجمالي السجلات.
          </p>
        </div>

        <div className="p-6">
          {entityYearlyStats.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400 bg-slate-50 rounded-2xl">
              لا توجد حركة مالية سنوية مسجلة.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
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
                          {formatNum(absNet)} <span className="text-[10px] font-bold mr-1">({netType})</span>
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
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
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
                            {formatNum(absNet)} <span className="text-[10px] font-bold mr-1">({netType})</span>
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
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setDetailsAccount(null)}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      </AppDialog>
    </div>
  )
}
