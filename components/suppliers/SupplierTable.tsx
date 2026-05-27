'use client'

import React from 'react'
import Link from 'next/link'
import { Truck, Edit3, Trash2, ShieldAlert } from 'lucide-react'
import SupplierStatusBadge from './SupplierStatusBadge'
import SaudiRiyalIcon from '@/components/icons/SaudiRiyalIcon'
import Pagination from '@/components/ui/Pagination'
import type { Supplier } from '@/lib/types'

interface SupplierTableProps {
  suppliers: Supplier[]
  isLoading: boolean
  selectedIds: number[]
  onSelectAll: (checked: boolean) => void
  onSelectRow: (id: number, checked: boolean) => void
  onEdit: (supplier: Supplier) => void
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
      <td className="py-4 px-4"><div className="w-24 h-4 bg-surface-muted rounded" /></td>
      <td className="py-4 px-4"><div className="w-20 h-4 bg-surface-muted rounded" /></td>
      <td className="py-4 px-4"><div className="w-20 h-4 bg-surface-muted rounded" /></td>
      <td className="py-4 px-4"><div className="w-16 h-5 bg-surface-muted rounded-full" /></td>
      <td className="py-4 px-6"><div className="w-20 h-8 bg-surface-muted rounded-lg" /></td>
    </tr>
  )
}

export default function SupplierTable({
  suppliers, isLoading, selectedIds, onSelectAll, onSelectRow, onEdit, onDelete, onToggleSuspend, meta, onPageChange
}: SupplierTableProps) {
  if (isLoading) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-right">
          <thead>
            <tr className="border-b border-line bg-surface-subtle text-ink-soft">
              <th className="py-3.5 px-6 w-10" />
              <th className="py-3.5 px-4 font-semibold">كود المورد</th>
              <th className="py-3.5 px-4 font-semibold">الاسم</th>
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
    )
  }

  if (suppliers.length === 0) {
    return (
      <div className="m-6 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-line py-20 text-center">
        <Truck className="mb-4 h-16 w-16 text-ink-muted" />
        <h3 className="text-lg font-bold text-ink">لا يوجد موردين مدرجين</h3>
        <p className="mt-1 max-w-sm text-xs text-ink-soft">
          لم يتم العثور على أي موردين يطابقون الفرز الحالي. قم بإضافة مورد يدويًا أو استورد عبر ملف إكسل.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full text-sm text-right">
          <thead>
            <tr className="border-b border-line bg-surface-subtle text-ink-soft">
              <th className="py-3.5 px-6 w-10">
                <input
                  type="checkbox"
                  className="rounded border-line-strong bg-surface text-action-primary focus:ring-action-primary"
                  checked={selectedIds.length === suppliers.length && suppliers.length > 0}
                  onChange={(e) => onSelectAll(e.target.checked)}
                />
              </th>
              <th className="py-3.5 px-4 font-semibold">كود المورد</th>
              <th className="py-3.5 px-4 font-semibold">الاسم</th>
              <th className="py-3.5 px-4 font-semibold">الهاتف</th>
              <th className="py-3.5 px-4 font-semibold">الحد الائتماني</th>
              <th className="py-3.5 px-4 font-semibold">الرصيد الحالي</th>
              <th className="py-3.5 px-4 font-semibold">الحالة</th>
              <th className="py-3.5 px-6 text-left font-semibold">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {suppliers.map((supplier) => (
              <tr key={supplier.id} className="transition-colors hover:bg-surface-subtle">
                <td className="py-4 px-6">
                  <input
                    type="checkbox"
                    className="rounded border-line-strong bg-surface text-action-primary focus:ring-action-primary"
                    checked={selectedIds.includes(supplier.id)}
                    onChange={(e) => onSelectRow(supplier.id, e.target.checked)}
                  />
                </td>
                <td className="py-4 px-4">
                  <Link href={`/suppliers/${supplier.id}`} className="font-mono font-semibold text-action-primary hover:underline">
                    {supplier.supplier_code}
                  </Link>
                </td>
                <td className="py-4 px-4 font-semibold text-ink">
                  <Link href={`/suppliers/${supplier.id}`} className="hover:text-action-primary">
                    {supplier.supplier_name}
                  </Link>
                </td>
                <td className="py-4 px-4 text-xs text-ink-soft">{supplier.phone1 || '—'}</td>
                <td className="py-4 px-4 font-semibold text-ink">
                  {supplier.credit_limit === 0 ? 'بلا حد' : <span>{supplier.credit_limit.toLocaleString('en-US')} <SaudiRiyalIcon size={14} className="text-success-strong inline-block align-middle" /></span>}
                </td>
                <td className={`py-4 px-4 font-semibold ${supplier.current_balance >= 0 ? 'text-success-strong' : 'text-danger'}`}>
                  {supplier.current_balance.toLocaleString('en-US')} <SaudiRiyalIcon size={14} className={`inline-block align-middle ${supplier.current_balance >= 0 ? 'text-success-strong' : 'text-danger'}`} />
                </td>
                <td className="py-4 px-4"><SupplierStatusBadge isSuspended={supplier.is_suspended} /></td>
                <td className="py-4 px-6 text-left">
                  <div className="flex items-center justify-end gap-2.5">
                    <button
                      onClick={() => onToggleSuspend(supplier.id)}
                      className={`rounded-lg p-1.5 transition-colors ${
                        supplier.is_suspended
                          ? 'bg-success-soft hover:bg-success-soft text-success'
                          : 'bg-warning-soft hover:bg-warning-soft text-warning'
                      }`}
                      title={supplier.is_suspended ? 'تنشيط' : 'إيقاف مؤقت'}
                    >
                      <ShieldAlert className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit(supplier)}
                      className="rounded-lg bg-surface-muted p-1.5 text-ink-soft transition-colors hover:bg-surface-subtle"
                      title="تعديل"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(supplier.id)}
                      className="rounded-lg bg-danger-soft p-1.5 text-danger transition-colors hover:bg-danger-soft"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 gap-4 p-4 lg:hidden">
        {suppliers.map((supplier) => (
          <article
            key={supplier.id}
            className="rounded-2xl border border-line bg-surface p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 rounded border-line-strong bg-surface text-action-primary focus:ring-action-primary"
                  checked={selectedIds.includes(supplier.id)}
                  onChange={(e) => onSelectRow(supplier.id, e.target.checked)}
                />
                <div className="space-y-1">
                  <Link href={`/suppliers/${supplier.id}`} className="font-mono text-sm font-bold text-action-primary">
                    {supplier.supplier_code}
                  </Link>
                  <Link href={`/suppliers/${supplier.id}`} className="block text-sm font-semibold text-ink">
                    {supplier.supplier_name}
                  </Link>
                  <p className="text-xs text-ink-muted">{supplier.phone1 || '—'}</p>
                </div>
              </div>
              <SupplierStatusBadge isSuspended={supplier.is_suspended} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-surface-subtle px-3 py-2">
                <span className="block text-xs text-ink-muted">الحد الائتماني</span>
                <span className="font-semibold text-ink">
                  {supplier.credit_limit === 0 ? 'بلا حد' : supplier.credit_limit.toLocaleString('en-US')}
                </span>
              </div>
              <div className="rounded-xl bg-surface-subtle px-3 py-2">
                <span className="block text-xs text-ink-muted">الرصيد الحالي</span>
                <span className={`font-semibold ${supplier.current_balance >= 0 ? 'text-success-strong' : 'text-danger'}`}>
                  {supplier.current_balance.toLocaleString('en-US')} <SaudiRiyalIcon size={14} className={`inline-block align-middle ${supplier.current_balance >= 0 ? 'text-success-strong' : 'text-danger'}`} />
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => onToggleSuspend(supplier.id)}
                className={`flex min-h-11 flex-1 items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold ${
                  supplier.is_suspended
                    ? 'bg-success-soft text-success'
                    : 'bg-warning-soft text-warning'
                }`}
                title={supplier.is_suspended ? 'تنشيط' : 'إيقاف مؤقت'}
              >
                {supplier.is_suspended ? 'تنشيط' : 'إيقاف'}
              </button>
              <button
                onClick={() => onEdit(supplier)}
                className="flex min-h-11 flex-1 items-center justify-center rounded-xl border border-info-soft bg-info-soft px-4 py-2 text-sm font-semibold text-action-primary"
                title="تعديل"
              >
                تعديل
              </button>
              <button
                onClick={() => onDelete(supplier.id)}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-danger-soft bg-danger-soft px-4 py-2 text-danger"
                title="حذف"
              >
                <Trash2 className="h-4 w-4" />
              </button>
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
