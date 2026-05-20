'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Sprout, Plus, Loader2, ChevronRight, Trash2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { organizationApi } from '@/lib/api/organization'

const sectionSchema = z.object({
  section_name: z.string().min(1, 'اسم القسم مطلوب'),
  section_type: z.enum(['production', 'breeding'], {
    error: 'نوع القسم مطلوب',
  }),
})

const typeLabels: Record<string, string> = {
  production: 'إنتاج',
  breeding: 'تربية',
}

export default function ProjectDetailPage() {
  const { id } = useParams()
  const projectId = Number(id)
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [sectionName, setSectionName] = useState('')
  const [sectionType, setSectionType] = useState<'production' | 'breeding'>('production')
  const [errors, setErrors] = useState<{ section_name?: string; section_type?: string }>({})

  const { data, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => organizationApi.getProject(projectId),
  })

  const createMutation = useMutation({
    mutationFn: organizationApi.createSection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      setSectionName('')
      setShowCreate(false)
      setErrors({})
    },
  })

  const deleteMutation = useMutation({
    mutationFn: organizationApi.deleteSection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
    },
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    const result = sectionSchema.safeParse({
      section_name: sectionName,
      section_type: sectionType,
    })
    if (!result.success) {
      const fieldErrors: { section_name?: string; section_type?: string } = {}
      result.error.issues.forEach((err) => {
        const field = err.path[0] as 'section_name' | 'section_type'
        if (!fieldErrors[field]) fieldErrors[field] = err.message
      })
      setErrors(fieldErrors)
      return
    }
    createMutation.mutate({
      project_id: projectId,
      section_name: sectionName,
      section_type: sectionType,
    })
  }

  const project = data?.data

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 text-farm-blue animate-spin" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-20 text-gray-500">المشروع غير موجود.</div>
    )
  }

  const sections = project.sections ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link
            href={`/companies/${project.company_id}`}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Link href="/companies" className="hover:text-gray-600">
                الشركات
              </Link>
              <span>/</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {project.project_name}
            </h1>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-farm-blue hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl transition-all font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة قسم</span>
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 max-w-lg">
          <h2 className="text-lg font-bold mb-4 text-gray-800">
            إضافة قسم جديد
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="اسم القسم"
                className={`w-full border rounded-xl px-4 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-farm-blue ${
                  errors.section_name ? 'border-red-500' : 'border-gray-200'
                }`}
                value={sectionName}
                onChange={(e) => setSectionName(e.target.value)}
                autoFocus
              />
              {errors.section_name && (
                <p className="text-xs text-red-600 mt-1 mr-1">
                  {errors.section_name}
                </p>
              )}
            </div>
            <div>
              <select
                className={`w-full border rounded-xl px-4 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-farm-blue ${
                  errors.section_type ? 'border-red-500' : 'border-gray-200'
                }`}
                value={sectionType}
                onChange={(e) =>
                  setSectionType(e.target.value as 'production' | 'breeding')
                }
              >
                <option value="production">إنتاج</option>
                <option value="breeding">تربية</option>
              </select>
              {errors.section_type && (
                <p className="text-xs text-red-600 mt-1 mr-1">
                  {errors.section_type}
                </p>
              )}
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

      {/* Sections */}
      <h2 className="text-xl font-bold text-gray-800">أقسام المشروع</h2>
      {sections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
          <Sprout className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-600">
            لا توجد أقسام حالياً
          </h3>
          <p className="text-gray-500 mt-2">قم بإضافة قسم للبدء.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sections.map((section) => (
            <div key={section.id} className="relative group">
              <Link href={`/sections/${section.id}`}>
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        section.section_type === 'production'
                          ? 'bg-green-50 text-green-600'
                          : 'bg-blue-50 text-blue-600'
                      }`}
                    >
                      <Sprout className="w-6 h-6" />
                    </div>
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
                  <h3 className="text-xl font-bold text-gray-900">
                    {section.section_name}
                  </h3>
                </div>
              </Link>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  if (window.confirm('هل أنت متأكد من حذف هذا القسم؟')) {
                    deleteMutation.mutate(section.id)
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
  )
}
