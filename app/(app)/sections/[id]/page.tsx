'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Sprout, Plus, Loader2, ChevronRight, Trash2, BarChart3 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { organizationApi } from '@/lib/api/organization'
import UnifiedStatsCards from '@/components/statistics/UnifiedStatsCards'
import AnnualProductionTable from '@/components/statistics/AnnualProductionTable'
import LedgerSummaryCard from '@/components/statistics/LedgerSummaryCard'

const barnSchema = z.object({
  barn_name: z.string().min(1, 'اسم العنبر مطلوب'),
  capacity: z.number().optional(),
})

const typeLabels: Record<string, string> = {
  production: 'إنتاج',
  breeding: 'تربية',
}

export default function SectionDetailPage() {
  const { id } = useParams()
  const sectionId = Number(id)
  const queryClient = useQueryClient()
  const [activeView, setActiveView] = useState<'barns' | 'statistics'>('barns')
  const [showCreate, setShowCreate] = useState(false)
  const [barnName, setBarnName] = useState('')
  const [capacity, setCapacity] = useState('')
  const [errors, setErrors] = useState<{ barn_name?: string }>({})

  const { data, isLoading } = useQuery({
    queryKey: ['section', sectionId],
    queryFn: () => organizationApi.getSection(sectionId),
  })

  const { data: statsRes, isLoading: isStatsLoading } = useQuery({
    queryKey: ['section-statistics', sectionId],
    queryFn: () => organizationApi.getSectionStatistics(sectionId),
    enabled: activeView === 'statistics',
  })

  const createMutation = useMutation({
    mutationFn: organizationApi.createBarn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['section', sectionId] })
      setBarnName('')
      setCapacity('')
      setShowCreate(false)
      setErrors({})
    },
  })

  const deleteMutation = useMutation({
    mutationFn: organizationApi.deleteBarn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['section', sectionId] })
    },
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    const result = barnSchema.safeParse({
      barn_name: barnName,
      capacity: capacity ? Number(capacity) : undefined,
    })
    if (!result.success) {
      const fieldErrors: { barn_name?: string } = {}
      result.error.issues.forEach((err) => {
        if (err.path[0] === 'barn_name') fieldErrors.barn_name = err.message
      })
      setErrors(fieldErrors)
      return
    }
    createMutation.mutate({
      section_id: sectionId,
      barn_name: barnName,
      capacity: capacity ? Number(capacity) : undefined,
    })
  }

  const section = data?.data
  const stats = statsRes

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 text-farm-blue animate-spin" />
      </div>
    )
  }

  if (!section) {
    return (
      <div className="text-center py-20 text-gray-500">القسم غير موجود.</div>
    )
  }

  const barns = section.barns ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link
            href={`/projects/${section.project_id}`}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </Link>
          <div
            className={`p-3 rounded-xl ${
              section.section_type === 'production'
                ? 'bg-green-50 text-green-600'
                : 'bg-blue-50 text-blue-600'
            }`}
          >
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {section.section_name}
              </h1>
              <span
                className={`text-xs font-bold px-2 py-1 rounded-full ${
                  section.section_type === 'production'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {typeLabels[section.section_type]}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              نوع القسم:{' '}
              {section.section_type === 'production'
                ? 'إنتاج (سيتم توريثه تلقائياً للعنابر)'
                : 'تربية (سيتم توريثه تلقائياً للعنابر)'}
            </p>
          </div>
        </div>
        
        {activeView === 'barns' && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-farm-blue hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl transition-all font-medium"
          >
            <Plus className="w-5 h-5" />
            <span>إضافة عنبر</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b-2 border-slate-300 gap-6">
        <button
          onClick={() => setActiveView('barns')}
          className={`pb-4 text-sm font-bold border-b-2 transition-all ${
            activeView === 'barns'
              ? 'border-farm-blue text-farm-blue'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          عنابر القسم ({barns.length})
        </button>
        <button
          onClick={() => setActiveView('statistics')}
          className={`pb-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeView === 'statistics'
              ? 'border-farm-blue text-farm-blue'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>التقرير الإحصائي والمالي للقسم</span>
        </button>
      </div>

      {/* Barns view */}
      {activeView === 'barns' && (
        <div className="space-y-6">
          {/* Create Form */}
          {showCreate && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 max-w-lg">
              <h2 className="text-lg font-bold mb-4 text-gray-800">
                إضافة عنبر جديد
              </h2>
              <div className="mb-4 p-3 bg-gray-50 rounded-xl text-sm text-gray-600">
                نوع العنبر (موروث من القسم):{' '}
                <span className="font-bold">{typeLabels[section.section_type]}</span>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder="اسم العنبر"
                    className={`w-full border rounded-xl px-4 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-farm-blue ${
                      errors.barn_name ? 'border-red-500' : 'border-gray-200'
                    }`}
                    value={barnName}
                    onChange={(e) => setBarnName(e.target.value)}
                    autoFocus
                  />
                  {errors.barn_name && (
                    <p className="text-xs text-red-600 mt-1 mr-1">
                      {errors.barn_name}
                    </p>
                  )}
                </div>
                <div>
                  <input
                    type="number"
                    placeholder="السعة (اختياري)"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-farm-blue"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="bg-farm-green hover:bg-green-700 text-white px-6 py-2 rounded-xl font-medium disabled:opacity-50"
                  >
                    {createMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'حفظ'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-xl font-medium"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          )}

          {barns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
              <Sprout className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600">
                لا توجد عنابر حالياً
              </h3>
              <p className="text-gray-500 mt-2">قم بإضافة عنبر للبدء.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {barns.map((barn) => (
                <div key={barn.id} className="relative group">
                  <Link href={`/barns/${barn.id}`}>
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            barn.barn_type === 'production'
                              ? 'bg-green-50 text-green-600'
                              : 'bg-blue-50 text-blue-600'
                          }`}
                        >
                          <Sprout className="w-6 h-6" />
                        </div>
                        <span
                          className={`text-xs font-bold px-2 py-1 rounded-full ${
                            barn.barn_type === 'production'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {typeLabels[barn.barn_type]}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {barn.barn_name}
                      </h3>
                      {barn.capacity && (
                        <p className="text-sm text-gray-500 mt-1">
                          السعة: {barn.capacity}
                        </p>
                      )}
                    </div>
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      if (window.confirm('هل أنت متأكد من حذف هذا العنبر؟')) {
                        deleteMutation.mutate(barn.id)
                      }
                    }}
                    className="absolute top-4 left-4 p-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Statistics view */}
      {activeView === 'statistics' && (
        <div className="space-y-8">
          {isStatsLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-10 h-10 text-farm-blue animate-spin" />
            </div>
          ) : stats ? (
            <>
              {/* Unified Stats Cards */}
              <UnifiedStatsCards stats={stats} />

              {/* Ledger Summary */}
              <LedgerSummaryCard ledger={stats.ledger_summary} />

              {/* Annual Production */}
              <AnnualProductionTable data={stats.annual_production} />
            </>
          ) : (
            <div className="text-center py-10 text-slate-500">فشل في تحميل التقارير الإحصائية للقسم.</div>
          )}
        </div>
      )}
    </div>
  )
}
