'use client'

import React from 'react'
import Link from 'next/link'
import { Package, Edit3, Trash2 } from 'lucide-react'
import AssetTypeBadge from './AssetTypeBadge'
import AssetStatusBadge from './AssetStatusBadge'
import SaudiRiyalIcon from '@/components/icons/SaudiRiyalIcon'
import Pagination from '@/components/ui/Pagination'
import type { Asset } from '@/lib/types'

interface AssetTableProps {
  assets: Asset[]
  isLoading: boolean
  selectedIds: number[]
  onSelectAll: (checked: boolean) => void
  onSelectRow: (id: number, checked: boolean) => void
  onEdit: (asset: Asset) => void
  onDelete: (id: number) => void
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
    <tr className="border-b border-line">
      <td className="py-4 px-6"><div className="w-4 h-4 bg-surface-muted rounded animate-pulse" /></td>
      <td className="py-4 px-4"><div className="w-20 h-4 bg-surface-muted rounded animate-pulse" /></td>
      <td className="py-4 px-4"><div className="w-32 h-4 bg-surface-muted rounded animate-pulse" /></td>
      <td className="py-4 px-4"><div className="w-24 h-4 bg-surface-muted rounded animate-pulse" /></td>
      <td className="py-4 px-4"><div className="w-20 h-4 bg-surface-muted rounded animate-pulse" /></td>
      <td className="py-4 px-4"><div className="w-24 h-4 bg-surface-muted rounded animate-pulse" /></td>
      <td className="py-4 px-4"><div className="w-24 h-4 bg-surface-muted rounded animate-pulse" /></td>
      <td className="py-4 px-4"><div className="w-16 h-5 bg-surface-muted rounded-full animate-pulse" /></td>
      <td className="py-4 px-6"><div className="w-16 h-4 bg-surface-muted rounded animate-pulse" /></td>
    </tr>
  )
}

export default function AssetTable({
  assets, isLoading, selectedIds, onSelectAll, onSelectRow, onEdit, onDelete, meta, onPageChange
}: AssetTableProps) {
  if (isLoading) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-subtle text-ink-soft">
              <th className="py-3.5 px-6 text-right w-10" />
              <th className="py-3.5 px-4 text-right font-semibold">كود الأصل</th>
              <th className="py-3.5 px-4 text-right font-semibold">الاسم</th>
              <th className="py-3.5 px-4 text-right font-semibold">النوع</th>
              <th className="py-3.5 px-4 text-right font-semibold">الموقع</th>
              <th className="py-3.5 px-4 text-right font-semibold">قيمة الشراء</th>
              <th className="py-3.5 px-4 text-right font-semibold">القيمة الدفترية</th>
              <th className="py-3.5 px-4 text-right font-semibold">الحالة</th>
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

  if (assets.length === 0) {
    return (
      <div className="m-6 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-line py-20 text-center">
        <Package className="mb-4 h-16 w-16 text-ink-muted" />
        <h3 className="text-lg font-bold text-ink">لا توجد أصول مدرجة</h3>
        <p className="mt-1 max-w-sm text-xs text-ink-soft">
          لم يتم العثور على أي أصول رأسمالية تطابق الفرز الحالي. قم بإضافة أصل يدويًا أو استورد عبر ملف إكسل.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-subtle text-ink-soft">
              <th className="py-3.5 px-6 text-right w-10">
                <input
                  type="checkbox"
                  className="rounded border-line-strong bg-surface text-action-primary focus:ring-action-primary"
                  checked={selectedIds.length === assets.length && assets.length > 0}
                  onChange={(e) => onSelectAll(e.target.checked)}
                />
              </th>
              <th className="py-3.5 px-4 text-right font-semibold">كود الأصل</th>
              <th className="py-3.5 px-4 text-right font-semibold">الاسم</th>
              <th className="py-3.5 px-4 text-right font-semibold">النوع</th>
              <th className="py-3.5 px-4 text-right font-semibold">الموقع</th>
              <th className="py-3.5 px-4 text-right font-semibold">قيمة الشراء</th>
              <th className="py-3.5 px-4 text-right font-semibold">القيمة الدفترية</th>
              <th className="py-3.5 px-4 text-right font-semibold">الحالة</th>
              <th className="py-3.5 px-6 text-left font-semibold">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {assets.map((asset) => (
              <tr key={asset.id} className="transition-colors hover:bg-surface-subtle">
                <td className="py-4 px-6 text-right">
                  <input
                    type="checkbox"
                    className="rounded border-line-strong bg-surface text-action-primary focus:ring-action-primary"
                    checked={selectedIds.includes(asset.id)}
                    onChange={(e) => onSelectRow(asset.id, e.target.checked)}
                  />
                </td>
                <td className="py-4 px-4">
                  <Link href={`/assets/${asset.id}`} className="font-mono font-semibold text-action-primary hover:underline">
                    {asset.asset_code}
                  </Link>
                </td>
                <td className="py-4 px-4">
                  <Link href={`/assets/${asset.id}`} className="block">
                    <div className="font-semibold text-ink hover:text-action-primary">{asset.name}</div>
                    {asset.name_en && <div className="mt-0.5 text-xs text-ink-muted">{asset.name_en}</div>}
                  </Link>
                </td>
                <td className="py-4 px-4"><AssetTypeBadge category={asset.category} /></td>
                <td className="py-4 px-4 text-xs text-ink-soft">{asset.location_name || '—'}</td>
                <td className="py-4 px-4 font-semibold text-ink">
                  {asset.purchase_value.toLocaleString('en-US')} <SaudiRiyalIcon size={14} className="text-success-strong inline-block align-middle ml-1" />
                </td>
                <td className="py-4 px-4 font-semibold text-action-primary">
                  {asset.book_value.toLocaleString('en-US')} <SaudiRiyalIcon size={14} className="text-success-strong inline-block align-middle ml-1" />
                </td>
                <td className="py-4 px-4"><AssetStatusBadge status={asset.status} /></td>
                <td className="py-4 px-6 text-left">
                  <div className="flex items-center justify-end gap-2.5">
                    <button
                      onClick={() => onEdit(asset)}
                      className="rounded-lg bg-surface-muted p-1.5 text-ink-soft transition-colors hover:bg-surface-subtle"
                      title="تعديل"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(asset.id)}
                      className="rounded-lg bg-danger-soft p-1.5 text-danger transition-colors hover:bg-red-200"
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
        {assets.map((asset) => (
          <article
            key={asset.id}
            className="rounded-2xl border border-line bg-surface p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 rounded border-line-strong bg-surface text-action-primary focus:ring-action-primary"
                  checked={selectedIds.includes(asset.id)}
                  onChange={(e) => onSelectRow(asset.id, e.target.checked)}
                />
                <div className="space-y-1">
                  <Link href={`/assets/${asset.id}`} className="font-mono text-sm font-bold text-action-primary">
                    {asset.asset_code}
                  </Link>
                  <Link href={`/assets/${asset.id}`} className="block text-sm font-semibold text-ink">
                    {asset.name}
                  </Link>
                  {asset.name_en ? <p className="text-xs text-ink-muted">{asset.name_en}</p> : null}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <AssetTypeBadge category={asset.category} />
                <AssetStatusBadge status={asset.status} />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-surface-subtle px-3 py-2">
                <span className="block text-xs text-ink-muted">الموقع</span>
                <span className="font-semibold text-ink-soft">{asset.location_name || '—'}</span>
              </div>
              <div className="rounded-xl bg-surface-subtle px-3 py-2">
                <span className="block text-xs text-ink-muted">قيمة الشراء</span>
                <span className="font-semibold text-ink">
                  {asset.purchase_value.toLocaleString('en-US')} <SaudiRiyalIcon size={14} className="ml-1 inline-block align-middle text-success-strong" />
                </span>
              </div>
              <div className="col-span-2 rounded-xl bg-surface-subtle px-3 py-2">
                <span className="block text-xs text-ink-muted">القيمة الدفترية</span>
                <span className="font-semibold text-action-primary">
                  {asset.book_value.toLocaleString('en-US')} <SaudiRiyalIcon size={14} className="ml-1 inline-block align-middle text-success-strong" />
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => onEdit(asset)}
                className="flex min-h-11 flex-1 items-center justify-center rounded-xl border border-info-soft bg-info-soft px-4 py-2 text-sm font-semibold text-action-primary"
                title="تعديل"
              >
                تعديل
              </button>
              <button
                onClick={() => onDelete(asset.id)}
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
