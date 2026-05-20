'use client'

import React from 'react'
import Link from 'next/link'
import { Package, Edit3, Trash2 } from 'lucide-react'
import AssetTypeBadge from './AssetTypeBadge'
import AssetStatusBadge from './AssetStatusBadge'
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
    <tr className="border-b border-gray-100">
      <td className="py-4 px-6"><div className="w-4 h-4 bg-gray-250 rounded animate-pulse" /></td>
      <td className="py-4 px-4"><div className="w-20 h-4 bg-gray-250 rounded animate-pulse" /></td>
      <td className="py-4 px-4"><div className="w-32 h-4 bg-gray-250 rounded animate-pulse" /></td>
      <td className="py-4 px-4"><div className="w-24 h-4 bg-gray-250 rounded animate-pulse" /></td>
      <td className="py-4 px-4"><div className="w-20 h-4 bg-gray-250 rounded animate-pulse" /></td>
      <td className="py-4 px-4"><div className="w-24 h-4 bg-gray-250 rounded animate-pulse" /></td>
      <td className="py-4 px-4"><div className="w-24 h-4 bg-gray-250 rounded animate-pulse" /></td>
      <td className="py-4 px-4"><div className="w-16 h-5 bg-gray-250 rounded-full animate-pulse" /></td>
      <td className="py-4 px-6"><div className="w-16 h-4 bg-gray-250 rounded animate-pulse" /></td>
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
            <tr className="border-b border-gray-100 text-gray-500 bg-gray-50/50">
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
      <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-gray-200 rounded-xl m-6">
        <Package className="w-16 h-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-bold text-gray-800">لا توجد أصول مدرجة</h3>
        <p className="text-xs text-gray-500 mt-1 max-w-sm">
          لم يتم العثور على أي أصول رأسمالية تطابق الفرز الحالي. قم بإضافة أصل يدويًا أو استورد عبر ملف إكسل.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500 bg-gray-50/50">
              <th className="py-3.5 px-6 text-right w-10">
                <input
                  type="checkbox"
                  className="rounded border-gray-350 text-farm-blue focus:ring-farm-blue bg-white"
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
          <tbody className="divide-y divide-gray-100">
            {assets.map((asset) => (
              <tr key={asset.id} className="hover:bg-gray-50/40 transition-colors">
                <td className="py-4 px-6 text-right">
                  <input
                    type="checkbox"
                    className="rounded border-gray-350 text-farm-blue focus:ring-farm-blue bg-white"
                    checked={selectedIds.includes(asset.id)}
                    onChange={(e) => onSelectRow(asset.id, e.target.checked)}
                  />
                </td>
                <td className="py-4 px-4">
                  <Link href={`/assets/${asset.id}`} className="font-mono font-semibold text-farm-blue hover:underline">
                    {asset.asset_code}
                  </Link>
                </td>
                <td className="py-4 px-4">
                  <Link href={`/assets/${asset.id}`} className="block">
                    <div className="font-semibold text-gray-900 hover:text-farm-blue">{asset.name}</div>
                    {asset.name_en && <div className="text-xxs text-gray-400 mt-0.5">{asset.name_en}</div>}
                  </Link>
                </td>
                <td className="py-4 px-4"><AssetTypeBadge category={asset.category} /></td>
                <td className="py-4 px-4 text-gray-600 text-xs">{asset.location_name || '—'}</td>
                <td className="py-4 px-4 font-semibold text-gray-900">
                  {asset.purchase_value.toLocaleString('en-US')} ريال
                </td>
                <td className="py-4 px-4 font-semibold text-farm-blue">
                  {asset.book_value.toLocaleString('en-US')} ريال
                </td>
                <td className="py-4 px-4"><AssetStatusBadge status={asset.status} /></td>
                <td className="py-4 px-6 text-left">
                  <div className="flex items-center justify-end gap-2.5">
                    <button
                      onClick={() => onEdit(asset)}
                      className="p-1.5 bg-gray-100 hover:bg-gray-250 text-gray-600 rounded-lg transition-all"
                      title="تعديل"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(asset.id)}
                      className="p-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-all"
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

      {meta && meta.last_page > 1 && (
        <div className="p-4 border-t border-gray-100">
          <Pagination currentPage={meta.current_page} lastPage={meta.last_page} onPageChange={onPageChange} />
        </div>
      )}
    </>
  )
}
