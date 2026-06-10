'use client'

import React from 'react'
import Link from 'next/link'
import { Users, Edit3, Trash2, ShieldAlert } from 'lucide-react'
import CustomerTypeBadge from './CustomerTypeBadge'
import CustomerStatusBadge from './CustomerStatusBadge'
import SaudiRiyalIcon from '@/components/icons/SaudiRiyalIcon'
import { Button } from '@/components/ui/Button'
import Pagination from '@/components/ui/Pagination'
import type { Customer } from '@/lib/types'

interface CustomerTableProps {
  customers: Customer[]
  isLoading: boolean
  selectedIds: number[]
  onSelectAll: (checked: boolean) => void
  onSelectRow: (id: number, checked: boolean) => void
  onEdit: (customer: Customer) => void
  onDelete: (id: number) => void
  onToggleSuspend: (id: number) => void
  meta?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
  onPageChange: (page: number) => void
}

function SkeletonRow() {
  return (
    <tr className="border-b border-line animate-pulse">
      <td className="py-4 px-6"><div className="w-4 h-4 bg-surface-muted rounded" /></td>
      <td className="py-4 px-4"><div className="w-20 h-4 bg-surface-muted rounded" /></td>
      <td className="py-4 px-4"><div className="w-32 h-4 bg-surface-muted rounded" /></td>
      <td className="py-4 px-4"><div className="w-16 h-5 bg-surface-muted rounded-full" /></td>
      <td className="py-4 px-4"><div className="w-24 h-4 bg-surface-muted rounded" /></td>
      <td className="py-4 px-4"><div className="w-20 h-4 bg-surface-muted rounded" /></td>
      <td className="py-4 px-4"><div className="w-20 h-4 bg-surface-muted rounded" /></td>
      <td className="py-4 px-4"><div className="w-16 h-5 bg-surface-muted rounded-full" /></td>
      <td className="py-4 px-6"><div className="w-20 h-8 bg-surface-muted rounded-lg" /></td>
    </tr>
  )
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="h-5 w-5 rounded bg-surface-muted" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-24 rounded bg-surface-muted" />
            <div className="h-4 w-40 rounded bg-surface-muted" />
            <div className="h-3 w-28 rounded bg-surface-muted" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-6 w-16 rounded-full bg-surface-muted" />
          <div className="h-6 w-20 rounded-full bg-surface-muted" />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="h-14 rounded-xl bg-surface-subtle" />
        <div className="h-14 rounded-xl bg-surface-subtle" />
        <div className="col-span-2 h-14 rounded-xl bg-surface-subtle" />
      </div>
    </div>
  )
}

export default function CustomerTable({
  customers, isLoading, selectedIds, onSelectAll, onSelectRow, onEdit, onDelete, onToggleSuspend, meta, onPageChange
}: CustomerTableProps) {
  if (isLoading) {
    return (
      <>
        <div className="grid grid-cols-1 gap-4 p-4 lg:hidden">
          {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-sm text-right">
            <thead>
              <tr className="border-b border-line text-ink-soft bg-surface-subtle">
                <th className="py-3.5 px-6 w-10" />
                <th className="py-3.5 px-4 font-semibold">كود العميل</th>
                <th className="py-3.5 px-4 font-semibold">الاسم</th>
                <th className="py-3.5 px-4 font-semibold">النوع</th>
                <th className="py-3.5 px-4 font-semibold">الهاتف</th>
                <th className="py-3.5 px-4 font-semibold">الحد الائتماني</th>
                <th className="py-3.5 px-4 font-semibold">الرصيد الحالي</th>
                <th className="py-3.5 px-4 font-semibold">الحالة</th>
                <th className="py-3.5 px-6 text-left font-semibold">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
            </tbody>
          </table>
        </div>
      </>
    )
  }

  if (customers.length === 0) {
    return (
      <div className="m-6 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-line py-20 text-center">
        <Users className="mb-4 h-16 w-16 text-ink-muted" />
        <h3 className="text-lg font-bold text-ink">لا يوجد عملاء مدرجين</h3>
        <p className="mt-1 max-w-sm text-xs text-ink-soft">
          لم يتم العثور على أي عملاء يطابقون الفرز الحالي. قم بإضافة عميل يدويًا أو استورد عبر ملف إكسل.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full text-sm text-right">
          <thead>
            <tr className="border-b border-line text-ink-soft bg-surface-subtle">
              <th className="py-3.5 px-6 w-10">
                <input
                  type="checkbox"
                  className="rounded border-line-strong bg-surface text-action-primary focus:ring-action-primary"
                  checked={selectedIds.length === customers.length && customers.length > 0}
                  onChange={(e) => onSelectAll(e.target.checked)}
                />
              </th>
              <th className="py-3.5 px-4 font-semibold">كود العميل</th>
              <th className="py-3.5 px-4 font-semibold">الاسم</th>
              <th className="py-3.5 px-4 font-semibold">النوع</th>
              <th className="py-3.5 px-4 font-semibold">الهاتف</th>
              <th className="py-3.5 px-4 font-semibold">الحد الائتماني</th>
              <th className="py-3.5 px-4 font-semibold">الرصيد الحالي</th>
              <th className="py-3.5 px-4 font-semibold">الحالة</th>
              <th className="py-3.5 px-6 text-left font-semibold">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {customers.map((customer) => (
              <tr key={customer.id} className="transition-colors hover:bg-surface-subtle">
                <td className="py-4 px-6">
                  <input
                    type="checkbox"
                    className="rounded border-line-strong bg-surface text-action-primary focus:ring-action-primary"
                    checked={selectedIds.includes(customer.id)}
                    onChange={(e) => onSelectRow(customer.id, e.target.checked)}
                  />
                </td>
                <td className="py-4 px-4">
                  <Link href={`/customers/${customer.id}`} className="block max-w-28 truncate font-mono font-semibold text-action-primary hover:underline" title={customer.customer_code}>
                    {customer.customer_code}
                  </Link>
                </td>
                <td className="py-4 px-4">
                  <Link href={`/customers/${customer.id}`} className="block max-w-56">
                    <div className="truncate font-semibold text-ink hover:text-action-primary" title={customer.customer_name}>{customer.customer_name}</div>
                    {customer.company_name && <div className="mt-0.5 truncate text-xs text-ink-muted" title={customer.company_name}>{customer.company_name}</div>}
                  </Link>
                </td>
                <td className="py-4 px-4"><CustomerTypeBadge type={customer.customer_type} /></td>
                <td className="py-4 px-4 text-xs text-ink-soft">{customer.phone1 || '—'}</td>
                <td className="py-4 px-4 font-semibold text-ink">
                  {customer.credit_limit === 0 ? 'بلا حد' : <span>{customer.credit_limit.toLocaleString('en-US')} <SaudiRiyalIcon size={14} className="text-success-strong inline-block align-middle" /></span>}
                </td>
                <td className={`py-4 px-4 font-semibold ${customer.current_balance >= 0 ? 'text-success-strong' : 'text-danger'}`}>
                  {customer.current_balance.toLocaleString('en-US')} <SaudiRiyalIcon size={14} className={`inline-block align-middle ${customer.current_balance >= 0 ? 'text-success-strong' : 'text-danger'}`} />
                </td>
                <td className="py-4 px-4"><CustomerStatusBadge isSuspended={customer.is_suspended} /></td>
                <td className="py-4 px-6 text-left">
                  <div className="flex items-center justify-end gap-2.5">
                    <Button
                      onClick={() => onToggleSuspend(customer.id)}
                      type="button"
                      variant={customer.is_suspended ? 'secondary' : 'outline'}
                      size="icon"
                      aria-label={customer.is_suspended ? 'تنشيط العميل' : 'إيقاف العميل مؤقتا'}
                      title={customer.is_suspended ? 'تنشيط' : 'إيقاف مؤقت'}
                    >
                      <ShieldAlert className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      onClick={() => onEdit(customer)}
                      variant="ghost"
                      size="icon"
                      aria-label="تعديل العميل"
                      title="تعديل"
                    >
                      <Edit3 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      onClick={() => onDelete(customer.id)}
                      variant="danger"
                      size="icon"
                      aria-label="حذف العميل"
                      title="حذف"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 gap-4 p-4 lg:hidden">
        {customers.map((customer) => (
          <article
            key={customer.id}
            className="rounded-2xl border border-line bg-surface p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 rounded border-line-strong bg-surface text-action-primary focus:ring-action-primary"
                  checked={selectedIds.includes(customer.id)}
                  onChange={(e) => onSelectRow(customer.id, e.target.checked)}
                />
                <div className="min-w-0 space-y-1">
                  <Link href={`/customers/${customer.id}`} className="block truncate font-mono text-sm font-bold text-action-primary" title={customer.customer_code}>
                    {customer.customer_code}
                  </Link>
                  <Link href={`/customers/${customer.id}`} className="block truncate text-sm font-semibold text-ink" title={customer.customer_name}>
                    {customer.customer_name}
                  </Link>
                  {customer.company_name ? (
                    <p className="truncate text-xs text-ink-muted" title={customer.company_name}>{customer.company_name}</p>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <CustomerTypeBadge type={customer.customer_type} />
                <CustomerStatusBadge isSuspended={customer.is_suspended} />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-surface-subtle px-3 py-2">
                <span className="block text-xs text-ink-muted">الهاتف</span>
                <span className="font-semibold text-ink-soft">{customer.phone1 || '—'}</span>
              </div>
              <div className="rounded-xl bg-surface-subtle px-3 py-2">
                <span className="block text-xs text-ink-muted">الحد الائتماني</span>
                <span className="font-semibold text-ink">
                  {customer.credit_limit === 0 ? 'بلا حد' : customer.credit_limit.toLocaleString('en-US')}
                </span>
              </div>
              <div className="col-span-2 rounded-xl bg-surface-subtle px-3 py-2">
                <span className="block text-xs text-ink-muted">الرصيد الحالي</span>
                <span className={`font-semibold ${customer.current_balance >= 0 ? 'text-success-strong' : 'text-danger'}`}>
                  {customer.current_balance.toLocaleString('en-US')} <SaudiRiyalIcon size={14} className={`inline-block align-middle ${customer.current_balance >= 0 ? 'text-success-strong' : 'text-danger'}`} />
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Button
                type="button"
                onClick={() => onToggleSuspend(customer.id)}
                variant={customer.is_suspended ? 'secondary' : 'outline'}
                className="flex-1"
                title={customer.is_suspended ? 'تنشيط' : 'إيقاف مؤقت'}
              >
                {customer.is_suspended ? 'تنشيط' : 'إيقاف'}
              </Button>
              <Button
                type="button"
                onClick={() => onEdit(customer)}
                variant="outline"
                className="flex-1"
                title="تعديل"
              >
                تعديل
              </Button>
              <Button
                type="button"
                onClick={() => onDelete(customer.id)}
                variant="danger"
                size="icon"
                aria-label="حذف العميل"
                title="حذف"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </article>
        ))}
      </div>

      {meta && meta.last_page > 1 && (
        <div className="border-t border-line p-4">
          <Pagination currentPage={meta.current_page} lastPage={meta.last_page} onPageChange={onPageChange} />
        </div>
      )}
    </>
  )
}
