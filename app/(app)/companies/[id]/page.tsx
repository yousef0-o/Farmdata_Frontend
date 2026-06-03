'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Building2, Sprout, Plus, Loader2, ChevronRight, Trash2, BarChart3 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { organizationApi } from '@/lib/api/organization'
import UnifiedStatsCards from '@/components/statistics/UnifiedStatsCards'
import EntityLedgerTree from '@/components/archive/EntityLedgerTree'

const projectSchema = z.object({
  project_name: z.string().min(1, 'اسم المشروع مطلوب'),
})

export default function CompanyDetailPage() {
  const { id } = useParams()
  const companyId = Number(id)
  const queryClient = useQueryClient()
  const [activeView, setActiveView] = useState<'projects' | 'statistics'>('projects')
  const [showCreate, setShowCreate] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [errors, setErrors] = useState<{ project_name?: string }>({})

  const { data, isLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: () => organizationApi.getCompany(companyId),
  })

  const { data: statsRes, isLoading: isStatsLoading } = useQuery({
    queryKey: ['company-statistics', companyId],
    queryFn: () => organizationApi.getCompanyStatistics(companyId),
    enabled: activeView === 'statistics',
  })

  const createMutation = useMutation({
    mutationFn: organizationApi.createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', companyId] })
      setProjectName('')
      setShowCreate(false)
      setErrors({})
    },
  })

  const deleteMutation = useMutation({
    mutationFn: organizationApi.deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', companyId] })
    },
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    const result = projectSchema.safeParse({ project_name: projectName })
    if (!result.success) {
      const fieldErrors: { project_name?: string } = {}
      result.error.issues.forEach((err) => {
        if (err.path[0] === 'project_name') fieldErrors.project_name = err.message
      })
      setErrors(fieldErrors)
      return
    }
    createMutation.mutate({ company_id: companyId, project_name: projectName })
  }

  const company = data?.data
  const stats = statsRes

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 text-farm-blue animate-spin" />
      </div>
    )
  }

  if (!company) {
    return (
      <div className="text-center py-20 text-gray-500">الشركة غير موجودة.</div>
    )
  }

  const projects = company.projects ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link
            href="/companies"
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Link href="/companies" className="hover:text-gray-600">
                الشركات
              </Link>
              <span>/</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
          </div>
        </div>
        
        {activeView === 'projects' && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            <span>إضافة مشروع</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b-2 border-slate-300 gap-6">
        <button
          onClick={() => setActiveView('projects')}
          className={`pb-4 text-sm font-bold border-b-2 transition-colors ${
            activeView === 'projects'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          مشاريع الشركة ({projects.length})
        </button>
        <button
          onClick={() => setActiveView('statistics')}
          className={`pb-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeView === 'statistics'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>التقرير الإحصائي والمالي</span>
        </button>
      </div>

      {/* Projects view */}
      {activeView === 'projects' && (
        <div className="space-y-6">
          {/* Create Form */}
          {showCreate && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 max-w-lg">
              <h2 className="text-lg font-bold mb-4 text-gray-800">
                إضافة مشروع جديد
              </h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder="اسم المشروع"
                    className={`w-full border rounded-xl px-4 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      errors.project_name ? 'border-red-500' : 'border-gray-200'
                    }`}
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    autoFocus
                  />
                  {errors.project_name && (
                    <p className="text-xs text-red-600 mt-1 mr-1">
                      {errors.project_name}
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl font-medium disabled:opacity-50"
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

          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
              <Sprout className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600">
                لا توجد مشاريع حالياً
              </h3>
              <p className="text-gray-500 mt-2">
                قم بإضافة مشروع للبدء بإدارة أعمال الشركة.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div key={project.id} className="relative group">
                  <Link href={`/projects/${project.id}`}>
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-colors duration-300 cursor-pointer">
                      <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                        <Sprout className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                        {project.project_name}
                      </h3>
                    </div>
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      if (window.confirm('هل أنت متأكد من حذف هذا المشروع؟')) {
                        deleteMutation.mutate(project.id)
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
              <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
            </div>
          ) : stats ? (
            <>
              {/* Unified Stats Cards */}
              <UnifiedStatsCards stats={stats} title={company?.name} />

              {/* Entity Ledger Tree */}
              <EntityLedgerTree
                entityType="company"
                entityId={companyId}
                companyProjectIds={projects.map((p) => p.id)}
                annualMovement={stats?.annual_movement}
              />
            </>
          ) : (
            <div className="text-center py-10 text-slate-500">فشل في تحميل التقارير الإحصائية.</div>
          )}
        </div>
      )}
    </div>
  )
}
