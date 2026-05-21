'use client'

import React from 'react'
import Link from 'next/link'
import { Users, Edit3, Trash2, ShieldAlert } from 'lucide-react'
import CustomerTypeBadge from './CustomerTypeBadge'
import CustomerStatusBadge from './CustomerStatusBadge'
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
    <tr className="border-b border-gray-100 animate-pulse">
      <td className="py-4 px-6"><div className="w-4 h-4 bg-gray-200 rounded" /></td>
      <td className="py-4 px-4"><div className="w-20 h-4 bg-gray-200 rounded" /></td>
      <td className="py-4 px-4"><div className="w-32 h-4 bg-gray-200 rounded" /></td>
      <td className="py-4 px-4"><div className="w-16 h-5 bg-gray-200 rounded-full" /></td>
      <td className="py-4 px-4"><div className="w-24 h-4 bg-gray-200 rounded" /></td>
      <td className="py-4 px-4"><div className="w-20 h-4 bg-gray-200 rounded" /></td>
      <td className="py-4 px-4"><div className="w-20 h-4 bg-gray-200 rounded" /></td>
      <td className="py-4 px-4"><div className="w-16 h-5 bg-gray-200 rounded-full" /></td>
      <td className="py-4 px-6"><div className="w-20 h-8 bg-gray-200 rounded-lg" /></td>
    </tr>
  )
}

export default function CustomerTable({
  customers, isLoading, selectedIds, onSelectAll, onSelectRow, onEdit, onDelete, onToggleSuspend, meta, onPageChange
}: CustomerTableProps) {
  if (isLoading) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-right">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500 bg-gray-50/50">
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
    )
  }

  if (customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-gray-200 rounded-xl m-6">
        <Users className="w-16 h-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-bold text-gray-800">لا يوجد عملاء مدرجين</h3>
        <p className="text-xs text-gray-500 mt-1 max-w-sm">
          لم يتم العثور على أي عملاء يطابقون الفرز الحالي. قم بإضافة عميل يدويًا أو استورد عبر ملف إكسل.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-right">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500 bg-gray-50/50">
              <th className="py-3.5 px-6 w-10">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-farm-blue focus:ring-farm-blue bg-white"
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
          <tbody className="divide-y divide-gray-100">
            {customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-gray-50/40 transition-colors">
                <td className="py-4 px-6">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-farm-blue focus:ring-farm-blue bg-white"
                    checked={selectedIds.includes(customer.id)}
                    onChange={(e) => onSelectRow(customer.id, e.target.checked)}
                  />
                </td>
                <td className="py-4 px-4">
                  <Link href={`/customers/${customer.id}`} className="font-mono font-semibold text-farm-blue hover:underline">
                    {customer.customer_code}
                  </Link>
                </td>
                <td className="py-4 px-4">
                  <Link href={`/customers/${customer.id}`} className="block">
                    <div className="font-semibold text-gray-900 hover:text-farm-blue">{customer.customer_name}</div>
                    {customer.company_name && <div className="text-xxs text-gray-400 mt-0.5">{customer.company_name}</div>}
                  </Link>
                </td>
                <td className="py-4 px-4"><CustomerTypeBadge type={customer.customer_type} /></td>
                <td className="py-4 px-4 text-gray-600 text-xs">{customer.phone1 || '—'}</td>
                <td className="py-4 px-4 font-semibold text-gray-900">
                  {customer.credit_limit === 0 ? 'بلا حد' : `${customer.credit_limit.toLocaleString('en-US')} ريال`}
                </td>
                <td className={`py-4 px-4 font-semibold ${customer.current_balance >= 0 ? 'text-emerald-700' : 'text-red-650'}`}>
                  {customer.current_balance.toLocaleString('en-US')} ريال
                </td>
                <td className="py-4 px-4"><CustomerStatusBadge isSuspended={customer.is_suspended} /></td>
                <td className="py-4 px-6 text-left">
                  <div className="flex items-center justify-end gap-2.5">
                    <button
                      onClick={() => onToggleSuspend(customer.id)}
                      className={`p-1.5 rounded-lg transition-all ${
                        customer.is_suspended
                          ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600'
                          : 'bg-amber-50 hover:bg-amber-100 text-amber-600'
                      }`}
                      title={customer.is_suspended ? 'تنشيط' : 'إيقاف مؤقت'}
                    >
                      <ShieldAlert className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit(customer)}
                      className="p-1.5 bg-gray-100 hover:bg-gray-250 text-gray-600 rounded-lg transition-all"
                      title="تعديل"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(customer.id)}
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
