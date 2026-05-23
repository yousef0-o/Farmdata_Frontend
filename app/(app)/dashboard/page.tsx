'use client'

import React from 'react'
import { Bird, Building2, Egg, TrendingUp, ArrowLeftRight, Warehouse, PlusCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { useDashboardStats } from '@/lib/hooks/useDashboard'
import { StatCard } from '@/components/dashboard/StatCard'
import { ActiveFlocksTable } from '@/components/dashboard/ActiveFlocksTable'
import { StatCardSkeleton } from '@/components/ui/Skeleton'
import Link from 'next/link'

export default function DashboardPage() {
  const { data: stats, isLoading, isError, refetch } = useDashboardStats()

  const currentTimeArabic = new Date().toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  })

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-red-100 shadow-sm space-y-4" dir="rtl">
        <div className="p-4 bg-red-50 text-red-600 rounded-full">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold text-gray-800">تعذر تحميل البيانات</h3>
        <p className="text-gray-500 text-sm">يرجى التحقق من الاتصال بالخادم والمحاولة مرة أخرى.</p>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 bg-farm-blue hover:bg-blue-800 text-white px-6 py-2.5 rounded-xl transition-all font-semibold shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          <span>إعادة المحاولة</span>
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8" dir="rtl">
      {/* Row 1 — Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dash-heading">لوحة التحكم</h1>
          <p className="text-sm text-gray-500 mt-1">
            مرحباً بك في نظام إدارة مزارع الدواجن
          </p>
        </div>
        <div className="text-xs text-gray-400 font-medium bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
          <span>آخر تحديث: {currentTimeArabic}</span>
        </div>
      </div>

      {/* Row 2 — KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="الأفواج النشطة"
              value={stats?.activeFlockCount ?? 0}
              subtitle="فوج نشط حالياً"
              icon={<Bird className="w-6 h-6 text-green-600" />}
            />
            <StatCard
              title="إجمالي الشركات"
              value={stats?.totalCompanies ?? 0}
              subtitle="شركة مسجلة"
              icon={<Building2 className="w-6 h-6 text-blue-600" />}
            />
            <StatCard
              title="إجمالي البيض اليوم"
              value="—"
              subtitle="سيتوفر قريباً"
              icon={<Egg className="w-6 h-6 text-amber-500" />}
            />
            <StatCard
              title="متوسط معدل الإنتاج"
              value="—"
              subtitle="سيتوفر قريباً"
              icon={<TrendingUp className="w-6 h-6 text-purple-600" />}
            />
          </>
        )}
      </div>

      {/* Row 3 — Active Flocks Table */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-dash-heading">الأفواج النشطة</h2>
          {!isLoading && stats && stats.flocks.length > 0 && (
            <Link
              href="/flocks"
              className="text-sm font-semibold text-farm-blue hover:underline"
            >
              عرض جميع الأفواج
            </Link>
          )}
        </div>
        <ActiveFlocksTable flocks={stats?.flocks ?? []} loading={isLoading} />
      </div>

      {/* Row 4 — Quick Links */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-dash-heading">روابط سريعة</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/companies"
            className="flex items-center justify-between p-5 bg-surface border border-border rounded-2xl shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-quick-blue-bg text-quick-blue-text rounded-xl transition-colors">
                <PlusCircle className="w-6 h-6" />
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">إضافة شركة جديدة</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">إضافة وإدارة الشركات والمنشآت</p>
              </div>
            </div>
            <span className="text-gray-400 group-hover:translate-x-[-4px] transition-transform">←</span>
          </Link>

          <Link
            href="/warehouses"
            className="flex items-center justify-between p-5 bg-surface border border-border rounded-2xl shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-quick-green-bg text-quick-green-text rounded-xl transition-colors">
                <Warehouse className="w-6 h-6" />
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">إدارة المستودعات</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">عرض ومراقبة أرصدة المخازن</p>
              </div>
            </div>
            <span className="text-gray-400 group-hover:translate-x-[-4px] transition-transform">←</span>
          </Link>

          <Link
            href="/inventory/movements"
            className="flex items-center justify-between p-5 bg-surface border border-border rounded-2xl shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-quick-purple-bg text-quick-purple-text rounded-xl transition-colors">
                <ArrowLeftRight className="w-6 h-6" />
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">حركة المخزون</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">تتبع الوارد والمنصرف من الأعلاف والبيض</p>
              </div>
            </div>
            <span className="text-gray-400 group-hover:translate-x-[-4px] transition-transform">←</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
