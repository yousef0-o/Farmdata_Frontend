'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Building2, Plus, Loader2, Trash2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { organizationApi } from '@/lib/api/organization'

const companySchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
})

export default function CompaniesPage() {
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [errors, setErrors] = useState<{ name?: string }>({})

  const { data, isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: organizationApi.listCompanies,
  })

  const createMutation = useMutation({
    mutationFn: organizationApi.createCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      setName('')
      setShowCreate(false)
      setErrors({})
    },
  })

  const deleteMutation = useMutation({
    mutationFn: organizationApi.deleteCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
    },
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    const result = companySchema.safeParse({ name })
    if (!result.success) {
      const fieldErrors: { name?: string } = {}
      result.error.issues.forEach((err) => {
        if (err.path[0] === 'name') fieldErrors.name = err.message
      })
      setErrors(fieldErrors)
      return
    }
    createMutation.mutate({ name })
  }

  const companies = data?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إدارة الشركات</h1>
            <p className="text-sm text-gray-500 mt-1">تصفح وإضافة الشركات</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-farm-blue hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة شركة</span>
        </button>
      </div>

      {showCreate && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 max-w-lg">
          <h2 className="text-lg font-bold mb-4 text-gray-800">
            إضافة شركة جديدة
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="اسم الشركة"
                className={`w-full border rounded-xl px-4 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-farm-blue ${
                  errors.name ? 'border-red-500' : 'border-gray-200'
                }`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
              {errors.name && (
                <p className="text-xs text-red-600 mt-1 mr-1">{errors.name}</p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="bg-farm-green hover:bg-green-700 text-white px-6 py-2 rounded-xl font-medium transition-colors disabled:opacity-50"
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
                className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-xl font-medium transition-colors"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 text-farm-blue animate-spin" />
        </div>
      ) : companies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
          <Building2 className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-600">
            لا توجد شركات حالياً
          </h3>
          <p className="text-gray-500 mt-2">قم بإضافة شركة جديدة للبدء.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => (
            <div key={company.id} className="relative group">
              <Link href={`/companies/${company.id}`}>
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-colors duration-300 cursor-pointer">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                    <Building2 className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-farm-blue transition-colors">
                    {company.name}
                  </h3>
                </div>
              </Link>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  if (window.confirm('هل أنت متأكد من حذف هذه الشركة؟')) {
                    deleteMutation.mutate(company.id)
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
