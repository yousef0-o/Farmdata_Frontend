'use client'

import React, { useState } from 'react'
import { useFlockAnalytics } from '@/lib/hooks/useFlockAnalytics'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { AnalyticsAxis, AnalyticsAggregation, FlockDetail } from '@/lib/types'
import { Activity, AlertTriangle, Calendar, Layers, PieChart as PieChartIcon } from 'lucide-react'
import { FlockAnalyticsCards } from './FlockAnalyticsCards'

interface FlockAnalyticsDashboardProps {
  flock: FlockDetail
}

export function FlockAnalyticsDashboard({ flock }: FlockAnalyticsDashboardProps) {
  const [axis, setAxis] = useState<AnalyticsAxis>('age')
  const [aggregation, setAggregation] = useState<AnalyticsAggregation>('weekly')

  const { data: analytics, isLoading, error } = useFlockAnalytics({
    flock_id: flock.id,
    axis,
    aggregation,
  })

  if (isLoading) {
    return (
      <div dir="rtl" className="flex h-64 items-center justify-center rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-100 border-b-[#c2410c]" />
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div dir="rtl" className="flex items-center justify-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-6 text-sm font-bold text-red-700">
        <AlertTriangle className="w-5 h-5" />
        <span>حدث خطأ أثناء تحميل البيانات الإحصائية</span>
      </div>
    )
  }

  const isProduction = flock.flock_type === 'production'

  const productionSeries = analytics.series?.points || []
  const breedingSeries = analytics.breeding_series?.points || []

  const currentSeries = isProduction ? productionSeries : breedingSeries

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  const renderCostDistribution = () => {
    if (isProduction) return null
    const { summary } = analytics
    if (!summary?.breeding) return null

    const data = [
      { name: 'قيمة الصيصان', value: summary.breeding.chick_cost },
      { name: 'تكلفة العلف', value: summary.breeding.feed_cost },
      { name: 'تكلفة الأدوية', value: summary.breeding.vet_cost },
      { name: 'مصروفات أخرى', value: summary.breeding.other_cost },
    ].filter(d => d.value > 0)

    if (data.length === 0) return null

    return (
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm col-span-full lg:col-span-1">
        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
          <PieChartIcon className="w-5 h-5 text-farm-blue" />
          توزيع تكاليف الطير
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [
                  `${Number(value ?? 0).toLocaleString()} ريال`,
                  'التكلفة',
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    )
  }

  return (
    <div dir="rtl" className="space-y-6">
      <FlockAnalyticsCards analytics={analytics} />

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#c2410c]" />
          <h3 className="font-bold text-slate-950">تحليلات الأداء</h3>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <div className="flex rounded-xl border border-slate-100 bg-slate-50 p-1">
            <button
              onClick={() => setAxis('age')}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${axis === 'age' ? 'bg-white text-[#c2410c] shadow-sm' : 'text-slate-600 hover:text-slate-950'}`}
            >
              العمر
            </button>
            <button
              onClick={() => setAxis('date')}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${axis === 'date' ? 'bg-white text-[#c2410c] shadow-sm' : 'text-slate-600 hover:text-slate-950'}`}
            >
              التاريخ
            </button>
          </div>

          <div className="flex rounded-xl border border-slate-100 bg-slate-50 p-1">
            <button
              onClick={() => setAggregation('daily')}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${aggregation === 'daily' ? 'bg-white text-[#c2410c] shadow-sm' : 'text-slate-600 hover:text-slate-950'}`}
            >
              يومي
            </button>
            <button
              onClick={() => setAggregation('weekly')}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${aggregation === 'weekly' ? 'bg-white text-[#c2410c] shadow-sm' : 'text-slate-600 hover:text-slate-950'}`}
            >
              أسبوعي
            </button>
            <button
              onClick={() => setAggregation('monthly')}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${aggregation === 'monthly' ? 'bg-white text-[#c2410c] shadow-sm' : 'text-slate-600 hover:text-slate-950'}`}
            >
              شهري
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* رسم بياني للإنتاج (للإنتاج فقط) */}
        {isProduction && (
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm col-span-full">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-500" />
              تطور نسبة الإنتاج (%)
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={currentSeries} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" name="نسبة الإنتاج الفعلي (%)" dataKey="lay_rate" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* رسم بياني للنافق */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm col-span-full lg:col-span-1">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-red-500" />
            النافق التراكمي
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={currentSeries} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar name="النافق (طير)" dataKey="mortality" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* رسم بياني لاستهلاك العلف */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm col-span-full lg:col-span-1">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-yellow-500" />
            استهلاك العلف (كجم)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={currentSeries} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" name="العلف المستهلك (كجم)" dataKey="feed_kg" stroke="#f59e0b" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* توزيع التكاليف للتربية */}
        {renderCostDistribution()}
      </div>

      {/* مصفوفة توزيع أوزان البيض (للإنتاج فقط) */}
      {isProduction && analytics.egg_weight_distribution && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Layers className="w-5 h-5 text-farm-blue" />
            توزيع أوزان البيض (Benchmarks)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600">
                  <th className="p-3 border-b border-gray-100">الحجم</th>
                  <th className="p-3 border-b border-gray-100">الاسم التجاري</th>
                  <th className="p-3 border-b border-gray-100">عدد البيض</th>
                  <th className="p-3 border-b border-gray-100">نسبة التحقيق</th>
                  <th className="p-3 border-b border-gray-100">عدد الكراتين</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {analytics.egg_weight_distribution.rows.map((row) => (
                  <tr key={row.size_code} className="hover:bg-gray-50">
                    <td className="p-3 font-semibold text-gray-800">{row.size_code}</td>
                    <td className="p-3 text-gray-600">{row.label_ar}</td>
                    <td className="p-3 text-gray-800">{row.eggs.toLocaleString()}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="w-12">{row.percentage}%</span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-farm-blue rounded-full" 
                            style={{ width: `${Math.min(100, row.percentage)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-gray-800">{row.cartons}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* حركة الإنتاج السنوية (للإنتاج فقط) */}
      {isProduction && analytics.annual_movement && analytics.annual_movement.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-farm-blue" />
            حركة الإنتاج السنوية
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600">
                  <th className="p-3 border-b border-gray-100">السنة</th>
                  <th className="p-3 border-b border-gray-100">الكراتين المنتجة</th>
                  <th className="p-3 border-b border-gray-100">نسبة الإنتاج</th>
                  <th className="p-3 border-b border-gray-100">المستهدف السنوي (كرتون)</th>
                  <th className="p-3 border-b border-gray-100">الفرق</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {analytics.annual_movement.map((row) => (
                  <tr key={row.year} className="hover:bg-gray-50">
                    <td className="p-3 font-bold text-gray-800">{row.year}</td>
                    <td className="p-3 text-gray-800">{row.cartons_produced.toLocaleString()}</td>
                    <td className="p-3 text-gray-800">{row.production_rate}%</td>
                    <td className="p-3 text-gray-800">{row.annual_target_cartons.toLocaleString()}</td>
                    <td className={`p-3 font-semibold ${row.carton_difference >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {row.carton_difference > 0 ? '+' : ''}{row.carton_difference.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  )
}
