'use client'

import React, { useState } from 'react'
import { EntityStatistics } from '@/lib/types'
import {
  TrendingUp,
  Percent,
  Egg,
  Scale,
  Activity,
  Briefcase,
  Users,
} from 'lucide-react'
import SaudiRiyalIcon from '@/components/icons/SaudiRiyalIcon'

interface UnifiedStatsCardsProps {
  stats: EntityStatistics
}

export default function UnifiedStatsCards({ stats }: UnifiedStatsCardsProps) {
  const [activeTab, setActiveTab] = useState<'breeding' | 'production'>(
    stats.section_type === 'production'
      ? 'production'
      : 'breeding'
  )

  const showSwitcher = stats.level !== 'section' || stats.section_type === null

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2,
    }).format(num)
  }

  const renderCurrency = (num: number, colorClass = 'text-emerald-700') => {
    return (
      <span className="inline-flex items-center gap-2 font-black text-2xl">
        <span>{formatNumber(num)}</span>
        <SaudiRiyalIcon size={24} className={colorClass} />
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Switcher Tab */}
      {showSwitcher && (
        <div className="flex bg-slate-100 p-2 rounded-2xl w-fit border-2 border-slate-400 shadow-md">
          <button
            onClick={() => setActiveTab('breeding')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all duration-300 ${
              activeTab === 'breeding'
                ? 'bg-white text-farm-blue shadow border-2 border-slate-400 scale-102'
                : 'text-slate-650 hover:text-slate-900'
            }`}
          >
            <Activity className="w-5 h-5 text-farm-blue" />
            <span>مؤشرات مرحلة التربية</span>
          </button>
          <button
            onClick={() => setActiveTab('production')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all duration-300 ${
              activeTab === 'production'
                ? 'bg-white text-farm-green shadow border-2 border-slate-400 scale-102'
                : 'text-slate-650 hover:text-slate-900'
            }`}
          >
            <Egg className="w-5 h-5 text-farm-green" />
            <span>مؤشرات مرحلة الإنتاج</span>
          </button>
        </div>
      )}

      {/* Breeding Stats View */}
      {activeTab === 'breeding' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Entry Birds */}
            <div className="relative group overflow-hidden bg-white rounded-3xl p-6 border-2 border-slate-400 shadow-md hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/40 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
                <div className="p-3 bg-blue-50 text-farm-blue rounded-2xl border-2 border-blue-300">
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-xs font-black text-blue-900 bg-blue-150 border-2 border-blue-300 px-3 py-1 rounded-full">
                  العدد الابتدائي
                </span>
              </div>
              <h3 className="text-3xl font-black text-slate-800">
                {formatNumber(stats.breeding_stats.entry_birds)} طير
              </h3>
              <p className="text-xs text-slate-650 mt-2 font-bold">إجمالي الصيصان المدخلة للتربية</p>
            </div>

            {/* Exit Birds */}
            <div className="relative group overflow-hidden bg-white rounded-3xl p-6 border-2 border-slate-400 shadow-md hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/40 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl border-2 border-emerald-300">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <span className="text-xs font-black text-emerald-900 bg-emerald-150 border-2 border-emerald-300 px-3 py-1 rounded-full">
                  العدد الحالي
                </span>
              </div>
              <h3 className="text-3xl font-black text-slate-800">
                {formatNumber(stats.breeding_stats.exit_birds)} طير
              </h3>
              <p className="text-xs text-slate-655 mt-2 font-bold">عدد الطيور الحية المتبقية/الخارجة</p>
            </div>

            {/* Mortality Breeding */}
            <div className="relative group overflow-hidden bg-white rounded-3xl p-6 border-2 border-slate-400 shadow-md hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50/40 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
                <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl border-2 border-rose-300">
                  <Activity className="w-6 h-6" />
                </div>
                <span className="text-xs font-black text-rose-900 bg-rose-150 border-2 border-rose-300 px-3 py-1 rounded-full">
                  النافق الإجمالي
                </span>
              </div>
              <h3 className="text-3xl font-black text-rose-600">
                {formatNumber(stats.breeding_stats.mortality_breeding)} طير
              </h3>
              <p className="text-xs text-slate-655 mt-2 font-bold">
                نسبة النافق:{' '}
                <span className="font-black text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                  {stats.breeding_stats.mortality_rate}%
                </span>
              </p>
            </div>

            {/* Mortality Value */}
            <div className="relative group overflow-hidden bg-white rounded-3xl p-6 border-2 border-slate-400 shadow-md hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50/40 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border-2 border-amber-300">
                  <SaudiRiyalIcon size={24} className="text-amber-600" />
                </div>
                <span className="text-xs font-black text-amber-900 bg-amber-150 border-2 border-amber-300 px-3 py-1 rounded-full">
                  قيمة النافق الدفترية
                </span>
              </div>
              <h3 className="text-3xl font-black text-amber-700 flex items-center gap-1.5">
                {renderCurrency(stats.breeding_stats.mortality_value, 'text-amber-600')}
              </h3>
              <p className="text-xs text-slate-655 mt-2 font-bold">الخسائر التقديرية بسبب نفوق الطيور</p>
            </div>
          </div>

          {/* Detailed Costs Box */}
          <div className="bg-white rounded-3xl p-8 border-2 border-slate-400 shadow-md">
            <h4 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2 pb-3 border-b-2 border-slate-300">
              <Briefcase className="w-6 h-6 text-farm-blue" />
              <span>تفاصيل وتحليل التكلفة التشغيلية لمرحلة التربية</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {/* Chicks Cost */}
              <div className="bg-slate-50 rounded-2xl p-5 border-2 border-slate-300">
                <p className="text-xs text-slate-550 font-black mb-2">تكلفة الصيصان (الكتكوت)</p>
                <div className="text-xl font-black text-slate-900">
                  {renderCurrency(stats.breeding_stats.chick_cost, 'text-slate-600')}
                </div>
              </div>

              {/* Feed Cost */}
              <div className="bg-slate-50 rounded-2xl p-5 border-2 border-slate-300">
                <p className="text-xs text-slate-550 font-black mb-2">تكلفة الأعلاف</p>
                <div className="text-xl font-black text-slate-900">
                  {renderCurrency(stats.breeding_stats.feed_cost, 'text-slate-600')}
                </div>
              </div>

              {/* Vet Cost */}
              <div className="bg-slate-50 rounded-2xl p-5 border-2 border-slate-300">
                <p className="text-xs text-slate-550 font-black mb-2">التكلفة البيطرية (الأدوية)</p>
                <div className="text-xl font-black text-slate-900">
                  {renderCurrency(stats.breeding_stats.vet_cost, 'text-slate-600')}
                </div>
              </div>

              {/* Other Cost */}
              <div className="bg-slate-50 rounded-2xl p-5 border-2 border-slate-300">
                <p className="text-xs text-slate-550 font-black mb-2">المصروفات النثرية والعمومية</p>
                <div className="text-xl font-black text-slate-900">
                  {renderCurrency(stats.breeding_stats.other_cost, 'text-slate-600')}
                </div>
              </div>

              {/* Total Cost */}
              <div className="bg-emerald-50 text-emerald-950 rounded-2xl p-5 border-2 border-emerald-400 shadow flex flex-col justify-between">
                <p className="text-xs text-emerald-900 font-black mb-2">إجمالي تكلفة الأفواج</p>
                <div className="text-2xl font-black text-emerald-800">
                  {renderCurrency(stats.breeding_stats.total_value, 'text-emerald-800')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Production Stats View */}
      {activeTab === 'production' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Egg Cartons */}
          <div className="relative group overflow-hidden bg-white rounded-3xl p-6 border-2 border-slate-400 shadow-md hover:shadow-lg transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/40 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
              <div className="p-3 bg-emerald-50 text-farm-green rounded-2xl border-2 border-emerald-300">
                <Egg className="w-6 h-6" />
              </div>
              <span className="text-xs font-black text-emerald-900 bg-emerald-150 border-2 border-emerald-300 px-3 py-1 rounded-full">
                الكرتون المنتج
              </span>
            </div>
            <h3 className="text-3xl font-black text-slate-800">
              {formatNumber(stats.production_stats.cartons_produced)} كرتون
            </h3>
            <p className="text-xs text-slate-655 mt-2 font-bold">
              عدد البيض الكلي: {formatNumber(stats.production_stats.total_eggs)} بيضة
            </p>
          </div>

          {/* Feed Consumed */}
          <div className="relative group overflow-hidden bg-white rounded-3xl p-6 border-2 border-slate-400 shadow-md hover:shadow-lg transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50/40 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border-2 border-amber-300">
                <Scale className="w-6 h-6" />
              </div>
              <span className="text-xs font-black text-amber-900 bg-amber-150 border-2 border-amber-300 px-3 py-1 rounded-full">
                الأعلاف المستهلكة
              </span>
            </div>
            <h3 className="text-3xl font-black text-slate-800">
              {formatNumber(stats.production_stats.feed_consumed_ton)} طن
            </h3>
            <p className="text-xs text-slate-655 mt-2 font-bold">إجمالي الأعلاف الموزعة طوال الإنتاج</p>
          </div>

          {/* Production Rate */}
          <div className="relative group overflow-hidden bg-white rounded-3xl p-6 border-2 border-slate-400 shadow-md hover:shadow-lg transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/40 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border-2 border-indigo-300">
                <Percent className="w-6 h-6" />
              </div>
              <span className="text-xs font-black text-indigo-900 bg-indigo-150 border-2 border-indigo-300 px-3 py-1 rounded-full">
                معدل الإنتاج
              </span>
            </div>
            <h3 className="text-3xl font-black text-slate-800">
              {stats.production_stats.average_production_rate}%
            </h3>
            <p className="text-xs text-slate-655 mt-2 font-bold">متوسط نسبة إنتاج البيض اليومية الكلية</p>
          </div>

          {/* Mortality Production */}
          <div className="relative group overflow-hidden bg-white rounded-3xl p-6 border-2 border-slate-400 shadow-md hover:shadow-lg transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50/40 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl border-2 border-rose-300">
                <Activity className="w-6 h-6" />
              </div>
              <span className="text-xs font-black text-rose-900 bg-rose-150 border-2 border-rose-300 px-3 py-1 rounded-full">
                النافق في الإنتاج
              </span>
            </div>
            <h3 className="text-3xl font-black text-rose-600">
              {formatNumber(stats.production_stats.mortality_production)} طير
            </h3>
            <p className="text-xs text-slate-655 mt-2 font-bold">
              نسبة النافق:{' '}
              <span className="font-black text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                {stats.production_stats.mortality_rate}%
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
