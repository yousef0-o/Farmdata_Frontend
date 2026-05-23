'use client'

import React, { useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, AlertCircle } from 'lucide-react'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { organizationApi } from '@/lib/api/organization'
import { useCreateFlock } from '@/lib/hooks/useFlock'
import { FlockTypeBadge } from '@/components/flock/FlockTypeBadge'
import Link from 'next/link'

const createFlockSchema = z.object({
  entry_date: z.string().min(1, 'تاريخ الدخول مطلوب'),
  entry_birds: z.coerce.number().int().min(1, 'عدد الطيور يجب أن يكون أكبر من صفر'),
  chick_unit_cost: z.coerce.number().min(0).optional(),
  breed: z.string().optional(),
  supplier: z.string().optional(),
})

export default function CreateFlockPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const barnId = searchParams.get('barn_id')
  const createFlock = useCreateFlock()

  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10))
  const [entryBirds, setEntryBirds] = useState('')
  const [chickUnitCost, setChickUnitCost] = useState('')
  const [breed, setBreed] = useState('')
  const [supplier, setSupplier] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: barnData, isLoading: barnLoading } = useQuery({
    queryKey: ['barn', Number(barnId)],
    queryFn: () => organizationApi.getBarn(Number(barnId)),
    enabled: !!barnId,
  })

  const barn = barnData?.data

  if (!barnId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <AlertCircle className="w-12 h-12 text-gray-300 mb-4" />
        <p className="text-lg">لم يتم تحديد العنبر</p>
      </div>
    )
  }

  if (barnLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 text-farm-blue animate-spin" />
      </div>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const result = createFlockSchema.safeParse({ entry_date: entryDate, entry_birds: entryBirds, chick_unit_cost: chickUnitCost, breed, supplier })
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as string
        if (!fieldErrors[key]) fieldErrors[key] = issue.message
      })
      setErrors(fieldErrors)
      return
    }

    createFlock.mutate(
      {
        barn_id: Number(barnId),
        entry_date: entryDate,
        entry_birds: Number(entryBirds),
        chick_unit_cost: chickUnitCost ? Number(chickUnitCost) : undefined,
        breed: breed || undefined,
        supplier: supplier || undefined,
      },
      {
        onSuccess: (res) => {
          const flock = res.data
          router.push(`/flocks/${flock.id}`)
        },
      }
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/companies" className="hover:text-gray-700">
            الشركات
          </Link>
          <span>/</span>
          {barn && barn.section_id && (
            <>
              <Link href={`/sections/${barn.section_id}`} className="hover:text-gray-700">
                القسم
              </Link>
              <span>/</span>
            </>
          )}
          <Link href={`/barns/${barnId}`} className="hover:text-gray-700">
            {barn?.barn_name ?? 'العنبر'}
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">إضافة فوج</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">إضافة فوج جديد</h1>
      </div>

      {/* Barn info */}
      {barn && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm text-gray-500">العنبر</p>
              <p className="text-lg font-bold text-gray-900">{barn.barn_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">نوع الفوج</p>
              <FlockTypeBadge type={barn.barn_type} />
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-5">
        {createFlock.error && (
          <div className="p-4 bg-red-50 border-r-4 border-red-500 text-red-700 flex items-start gap-3 rounded-md">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm">
              {(createFlock.error as { message?: string })?.message ??
                'حدث خطأ أثناء إنشاء الفوج'}
            </p>
          </div>
        )}

        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1">
            تاريخ الدخول
          </label>
          <input
            type="date"
            max={new Date().toISOString().slice(0, 10)}
            className={`w-full border rounded-xl px-4 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-farm-blue ${errors.entry_date ? 'border-red-500' : 'border-gray-200'}`}
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
          />
          {errors.entry_date && (
            <p className="text-xs text-red-600 mt-1 mr-1">{errors.entry_date}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1">
            عدد الطيور عند الدخول
          </label>
          <input
            type="number"
            min="1"
            className={`w-full border rounded-xl px-4 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-farm-blue ${errors.entry_birds ? 'border-red-500' : 'border-gray-200'}`}
            value={entryBirds}
            onChange={(e) => setEntryBirds(e.target.value)}
          />
          {errors.entry_birds && (
            <p className="text-xs text-red-600 mt-1 mr-1">{errors.entry_birds}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1">
            تكلفة الكتكوت (للوحدة) - اختياري
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-farm-blue"
            value={chickUnitCost}
            onChange={(e) => setChickUnitCost(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">
              السلالة - اختياري
            </label>
            <input
              type="text"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-farm-blue"
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">
              المورد - اختياري
            </label>
            <input
              type="text"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-farm-blue"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
          <Link
            href={`/barns/${barnId}`}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-medium transition-colors"
          >
            إلغاء
          </Link>
          <button
            type="submit"
            disabled={createFlock.isPending}
            className="px-6 py-2 bg-farm-green hover:bg-green-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {createFlock.isPending && (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
            إنشاء الفوج
          </button>
        </div>
      </form>
    </div>
  )
}
