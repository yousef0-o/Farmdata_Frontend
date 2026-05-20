'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react'
import { z } from 'zod'
import { useFlock, useUpdateFlock } from '@/lib/hooks/useFlock'
import { FlockStatusBadge } from '@/components/flock/FlockStatusBadge'
import { FlockTypeBadge } from '@/components/flock/FlockTypeBadge'

const editFlockSchema = z.object({
  breed:           z.string().optional(),
  supplier:        z.string().optional(),
  chick_unit_cost: z.coerce.number().min(0).optional(),
})

export default function EditFlockMetadataPage() {
  const { id } = useParams()
  const router = useRouter()
  const flockId = Number(id)

  const { data: flockData, isLoading: isFlockLoading, error: flockError } = useFlock(flockId)
  const updateFlock = useUpdateFlock(flockId)

  const flock = flockData?.data

  // Form states
  const [breed, setBreed] = useState('')
  const [supplier, setSupplier] = useState('')
  const [chickUnitCost, setChickUnitCost] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Prefill form
  useEffect(() => {
    if (flock) {
      setBreed(flock.breed ?? '')
      setSupplier(flock.supplier ?? '')
      setChickUnitCost(flock.chick_unit_cost?.toString() ?? '')
    }
  }, [flock])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const result = editFlockSchema.safeParse({
      breed: breed || undefined,
      supplier: supplier || undefined,
      chick_unit_cost: chickUnitCost === '' ? undefined : chickUnitCost,
    })

    if (!result.success) {
      const fe: Record<string, string> = {}
      result.error.issues.forEach((i) => {
        const k = i.path[0] as string
        if (!fe[k]) fe[k] = i.message
      })
      setErrors(fe)
      return
    }

    const payload: z.infer<typeof editFlockSchema> = {}
    if (result.data.breed !== undefined) payload.breed = result.data.breed
    if (result.data.supplier !== undefined) payload.supplier = result.data.supplier
    if (result.data.chick_unit_cost !== undefined) payload.chick_unit_cost = result.data.chick_unit_cost

    updateFlock.mutate(payload, {
      onSuccess: () => {
        router.push(`/flocks/${flockId}`)
      },
    })
  }

  if (isFlockLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 text-farm-blue animate-spin" />
      </div>
    )
  }

  if (!flock || flockError) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-2xl p-8 border border-gray-200 shadow-sm text-center" dir="rtl">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">القطيع غير موجود</h2>
        <p className="text-gray-600 mb-6">نأسف، لم نتمكن من العثور على القطيع المطلوب أو أنك تحاول الوصول لبيانات غير صحيحة.</p>
        <button
          onClick={() => router.push('/flocks')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-farm-blue text-white rounded-xl hover:bg-farm-blue/90 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          العودة لقائمة الأقطاع
        </button>
      </div>
    )
  }

  const barn = flock.barn
  const section = barn?.section

  const ic = (f: string) =>
    `w-full border rounded-xl px-4 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-farm-blue ${errors[f] ? 'border-red-500' : 'border-gray-200'}`

  return (
    <div className="max-w-3xl mx-auto space-y-6" dir="rtl">
      {/* Breadcrumb */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/companies" className="hover:text-gray-700">الشركات</Link>
          {section && (
            <>
              <span>/</span>
              <Link href={`/sections/${section.id}`} className="hover:text-gray-700">{section.section_name}</Link>
            </>
          )}
          {barn && (
            <>
              <span>/</span>
              <Link href={`/barns/${barn.id}`} className="hover:text-gray-700">{barn.barn_name}</Link>
            </>
          )}
          <span>/</span>
          <Link href={`/flocks/${flockId}`} className="hover:text-gray-700">
            قطيع #{flockId}
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">تعديل بيانات القطيع</span>
        </div>

        <div className="flex items-center gap-3 mt-2">
          <h1 className="text-2xl font-bold text-gray-900 font-outfit">تعديل بيانات القطيع #{flockId}</h1>
          <FlockStatusBadge status={flock.status} />
          <FlockTypeBadge type={flock.flock_type} />
        </div>
      </div>

      {/* Read Only Details Card */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-gray-800 mb-3 border-b pb-2 border-gray-100">معلومات غير قابلة للتعديل</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">نوع القطيع</p>
            <FlockTypeBadge type={flock.flock_type} />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">الحالة</p>
            <FlockStatusBadge status={flock.status} />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">عدد الطيور عند الدخول</p>
            <p className="font-bold text-gray-900">{flock.entry_birds.toLocaleString('en-US')}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">تاريخ الدخول</p>
            <p className="font-bold text-gray-900 font-outfit">{flock.entry_date}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6">
        {updateFlock.error && (
          <div className="p-4 bg-red-50 border-r-4 border-red-500 text-red-700 flex items-start gap-3 rounded-md">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p>{(updateFlock.error as { message?: string })?.message ?? 'حدث خطأ أثناء تحديث القطيع'}</p>
              {(updateFlock.error as { errors?: Record<string, string[]> })?.errors && (
                <ul className="mt-2 list-disc pr-4">
                  {Object.entries((updateFlock.error as unknown as { errors: Record<string, string[]> }).errors).map(([f, m]) => (
                    <li key={f}>{f}: {m.join(', ')}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="breed" className="text-sm font-semibold text-gray-700 block mb-1">السلالة (breed)</label>
            <input
              id="breed"
              type="text"
              className={ic('breed')}
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              placeholder="مثال: لومان، هبرد..."
            />
            {errors.breed && <p className="text-xs text-red-600 mt-1 mr-1">{errors.breed}</p>}
          </div>

          <div>
            <label htmlFor="supplier" className="text-sm font-semibold text-gray-700 block mb-1">المورد (supplier)</label>
            <input
              id="supplier"
              type="text"
              className={ic('supplier')}
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="اسم المورد أو الشركة..."
            />
            {errors.supplier && <p className="text-xs text-red-600 mt-1 mr-1">{errors.supplier}</p>}
          </div>

          <div>
            <label htmlFor="chick_unit_cost" className="text-sm font-semibold text-gray-700 block mb-1">تكلفة الكتكوت للوحدة (chick_unit_cost)</label>
            <input
              id="chick_unit_cost"
              type="number"
              min="0"
              step="0.01"
              className={ic('chick_unit_cost')}
              value={chickUnitCost}
              onChange={(e) => setChickUnitCost(e.target.value)}
              placeholder="0.00"
            />
            {errors.chick_unit_cost && <p className="text-xs text-red-600 mt-1 mr-1">{errors.chick_unit_cost}</p>}
          </div>
        </div>

        {/* أزرار الإجراءات */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => router.push(`/flocks/${flockId}`)}
            disabled={updateFlock.isPending}
            className="px-5 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={updateFlock.isPending}
            className="px-5 py-2.5 bg-farm-blue text-white rounded-xl hover:bg-farm-blue/90 font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {updateFlock.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              'حفظ التغييرات'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
