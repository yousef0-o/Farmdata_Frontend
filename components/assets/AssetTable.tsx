'use client'

import React from 'react'
import Link from 'next/link'
import { Package, Edit3, Trash2 } from 'lucide-react'
import AssetTypeBadge from './AssetTypeBadge'
import AssetStatusBadge from './AssetStatusBadge'
import SaudiRiyalIcon from '@/components/icons/SaudiRiyalIcon'
import { Button } from '@/components/ui/Button'
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

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="h-5 w-5 rounded bg-surface-muted" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-24 rounded bg-surface-muted" />
            <div className="h-4 w-40 rounded bg-surface-muted" />
            <div className="h-3 w-32 rounded bg-surface-muted" />
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

export default function AssetTable({
  assets, isLoading, selectedIds, onSelectAll, onSelectRow, onEdit, onDelete, meta, onPageChange
}: AssetTableProps) {
  if (isLoading) {
    return (
      <>
        <div className="grid grid-cols-1 gap-4 p-4 lg:hidden">
          {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="hidden overflow-x-auto lg:block">
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
      </>
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
                  <Link href={`/assets/${asset.id}`} className="block max-w-28 truncate font-mono font-semibold text-action-primary hover:underline" title={asset.asset_code}>
                    {asset.asset_code}
                  </Link>
                </td>
                <td className="py-4 px-4">
                  <Link href={`/assets/${asset.id}`} className="block max-w-56">
                    <div className="truncate font-semibold text-ink hover:text-action-primary" title={asset.name}>{asset.name}</div>
                    {asset.name_en && <div className="mt-0.5 truncate text-xs text-ink-muted" title={asset.name_en}>{asset.name_en}</div>}
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
                    <Button
                      type="button"
                      onClick={() => onEdit(asset)}
                      variant="ghost"
                      size="icon"
                      aria-label="تعديل الأصل"
                      title="تعديل"
                    >
                      <Edit3 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      onClick={() => onDelete(asset.id)}
                      variant="danger"
                      size="icon"
                      aria-label="حذف الأصل"
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
        {assets.map((asset) => (
          <article
            key={asset.id}
            className="rounded-2xl border border-line bg-surface p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 rounded border-line-strong bg-surface text-action-primary focus:ring-action-primary"
                  checked={selectedIds.includes(asset.id)}
                  onChange={(e) => onSelectRow(asset.id, e.target.checked)}
                />
                <div className="min-w-0 space-y-1">
                  <Link href={`/assets/${asset.id}`} className="block truncate font-mono text-sm font-bold text-action-primary" title={asset.asset_code}>
                    {asset.asset_code}
                  </Link>
                  <Link href={`/assets/${asset.id}`} className="block truncate text-sm font-semibold text-ink" title={asset.name}>
                    {asset.name}
                  </Link>
                  {asset.name_en ? <p className="truncate text-xs text-ink-muted" title={asset.name_en}>{asset.name_en}</p> : null}
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
              <Button
                type="button"
                onClick={() => onEdit(asset)}
                variant="outline"
                className="flex-1"
                title="تعديل"
              >
                تعديل
              </Button>
              <Button
                type="button"
                onClick={() => onDelete(asset.id)}
                variant="danger"
                size="icon"
                aria-label="حذف الأصل"
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
