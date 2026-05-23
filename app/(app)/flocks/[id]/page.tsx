'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Loader2, BarChart3, TrendingUp, TrendingDown } from 'lucide-react'
import { useFlock, useFlockSummary } from '@/lib/hooks/useFlock'
import { FlockStatusBadge } from '@/components/flock/FlockStatusBadge'
import { FlockTypeBadge } from '@/components/flock/FlockTypeBadge'
import CloseFlockDialog from '@/components/flock/CloseFlockDialog'
import ProductionEntriesTable from '@/components/daily/ProductionEntriesTable'
import BreedingEntriesTable from '@/components/daily/BreedingEntriesTable'

export default function FlockDetailPage() {
  const { id } = useParams()
  const flockId = Number(id)
  const [showCloseDialog, setShowCloseDialog] = useState(false)

  const { data: flockData, isLoading: flockLoading } = useFlock(flockId)
  const { data: summary, isLoading: summaryLoading } = useFlockSummary(flockId)

  const flock = flockData?.data
  const isProduction = flock?.flock_type === 'production'
  const isLoading = flockLoading || summaryLoading

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 text-farm-blue animate-spin" />
      </div>
    )
  }

  if (!flock) {
    return (
      <div className="text-center py-20 text-gray-500">الفوج غير موجود.</div>
    )
  }

  const barn = flock.barn
  const section = barn?.section

  return (
    <div className="space-y-6">
      {/* Breadcrumb + Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/companies" className="hover:text-gray-700">
            الشركات
          </Link>
          {section && (
            <>
              <span>/</span>
              <Link href={`/projects/${section.project_id}`} className="hover:text-gray-700">
                المشروع
              </Link>
              <span>/</span>
              <Link href={`/sections/${section.id}`} className="hover:text-gray-700">
                {section.section_name}
              </Link>
            </>
          )}
          {barn && (
            <>
              <span>/</span>
              <Link href={`/barns/${barn.id}`} className="hover:text-gray-700">
                {barn.barn_name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-gray-900 font-medium">
            {isProduction ? 'فوج إنتاج' : 'فوج تربية'} #{flockId}
          </span>
        </div>

        <div className="flex items-center gap-3 mt-2">
          <h1 className="text-2xl font-bold text-gray-900">
            {isProduction ? 'فوج إنتاج' : 'فوج تربية'}
          </h1>
          <FlockStatusBadge status={flock.status} />
          <FlockTypeBadge type={flock.flock_type} />
        </div>

        <div className="flex items-center gap-6 mt-2 text-sm text-gray-600">
          <span>تاريخ الدخول: {flock.entry_date}</span>
          <span>العدد المدخل: {flock.entry_birds.toLocaleString()}</span>
          <span>العدد الحالي: {flock.current_count.toLocaleString()}</span>
          {flock.breed && <span>السلالة: {flock.breed}</span>}
          {flock.supplier && <span>المورد: {flock.supplier}</span>}
        </div>
      </div>

      {/* KPI Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiCard
            label="العدد المدخل"
            value={summary.entry_birds.toLocaleString()}
          />
          <KpiCard
            label="العدد الحالي"
            value={summary.current_count.toLocaleString()}
          />
          <KpiCard
            label="إجمالي العلف (كجم)"
            value={summary.total_feed_kg.toLocaleString(undefined, {
              minimumFractionDigits: 1,
            })}
          />
          <KpiCard
            label="معدل النفوق (%)"
            value={`${summary.mortality_rate}%`}
            icon={
              summary.mortality_rate > 5 ? (
                <TrendingUp className="w-4 h-4 text-red-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-green-500" />
              )
            }
          />
          <KpiCard label="أيام التسجيل" value={String(summary.days_recorded)} />

          {isProduction && summary.total_eggs !== undefined && (
            <>
              <KpiCard
                label="إجمالي البيض"
                value={summary.total_eggs.toLocaleString()}
              />
              <KpiCard
                label="معدل الإنتاج (%)"
                value={`${summary.average_production_rate}%`}
              />
              <KpiCard
                label="FCR"
                value={summary.fcr !== null && summary.fcr !== undefined ? summary.fcr.toFixed(3) : '—'}
              />
            </>
          )}

          {!isProduction && summary.latest_week_number !== undefined && (
            <KpiCard
              label="الأسبوع الحالي"
              value={String(summary.latest_week_number)}
            />
          )}
        </div>
      )}

      {/* Action Buttons — only for active flocks */}
      {flock.status === 'active' && (
        <div className="flex gap-3">
          <Link
            href={`/flocks/${flockId}/daily/new`}
            className="flex items-center gap-2 bg-farm-green hover:bg-green-700 text-white px-5 py-2.5 rounded-xl transition-all font-medium"
          >
            <BarChart3 className="w-5 h-5" />
            تسجيل يومي
          </Link>
          <button
            onClick={() => setShowCloseDialog(true)}
            className="flex items-center gap-2 bg-farm-blue hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl transition-all font-medium"
          >
            إغلاق الفوج
          </button>
          <Link
            href={`/flocks/${flockId}/edit`}
            className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-xl transition-all font-medium"
          >
            تعديل بيانات الفوج
          </Link>
        </div>
      )}

      {/* Daily Records */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4">السجلات اليومية</h2>
        {isProduction ? (
          <ProductionEntriesTable flockId={flockId} isActive={flock.status === 'active'} />
        ) : (
          <BreedingEntriesTable flockId={flockId} isActive={flock.status === 'active'} />
        )}
      </div>

      {/* Closing Allocations — only for completed flocks */}
      {flock.status === 'completed' && flock.closing_allocations && flock.closing_allocations.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">توزيع الإغلاق</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500">
                  <th className="text-right py-2 px-3 font-medium">الوجهة</th>
                  <th className="text-right py-2 px-3 font-medium">عدد الطيور</th>
                  <th className="text-right py-2 px-3 font-medium">النسبة %</th>
                  <th className="text-right py-2 px-3 font-medium">القيمة</th>
                </tr>
              </thead>
              <tbody>
                {flock.closing_allocations.map((alloc) => (
                  <tr key={alloc.id} className="border-b border-gray-50">
                    <td className="py-2 px-3 font-medium text-gray-900">
                      {alloc.allocation_label}
                    </td>
                    <td className="py-2 px-3">{alloc.bird_count.toLocaleString()}</td>
                    <td className="py-2 px-3">{Number(alloc.percentage).toFixed(3)}%</td>
                    <td className="py-2 px-3">
                      {alloc.value !== null && alloc.value !== undefined
                        ? Number(alloc.value).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Close Flock Dialog */}
      <CloseFlockDialog
        flockId={flockId}
        currentCount={flock.current_count}
        open={showCloseDialog}
        onOpenChange={setShowCloseDialog}
      />
    </div>
  )
}

function KpiCard({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon?: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-gray-900">{value}</span>
        {icon}
      </div>
    </div>
  )
}
