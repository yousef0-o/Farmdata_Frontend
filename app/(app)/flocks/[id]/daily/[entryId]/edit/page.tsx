'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, AlertCircle, ArrowLeft, Egg } from 'lucide-react'
import { z } from 'zod'
import { useFlock } from '@/lib/hooks/useFlock'
import { useProductionEntry, useUpdateProductionEntry } from '@/lib/hooks/useDailyOps'
import { useItems } from '@/lib/hooks/useInventory'
import { FlockStatusBadge } from '@/components/flock/FlockStatusBadge'
import { FlockTypeBadge } from '@/components/flock/FlockTypeBadge'
import { EntryReadOnlyInfo } from '@/components/daily/EntryReadOnlyInfo'

const productionEntrySchema = z.object({
  mortality:        z.coerce.number().int().min(0).default(0),
  feed_quantity_kg: z.coerce.number().min(0.001, 'كمية العلف مطلوبة'),
  ai_observation:   z.string().optional(),
})

export default function ProductionEntryEditPage() {
  const { id, entryId } = useParams()
  const router = useRouter()
  const flockId = Number(id)
  const entryIdNum = Number(entryId)

  const { data: flockData, isLoading: isFlockLoading } = useFlock(flockId)
  const { data: entryData, isLoading: isEntryLoading, error: entryError } = useProductionEntry(flockId, entryIdNum)
  const updateEntry = useUpdateProductionEntry(flockId)
  const { data: itemsData, isLoading: isLoadingItems } = useItems()

  const flock = flockData?.data
  const entry = entryData?.data

  const items = Array.isArray(itemsData) ? itemsData : (itemsData as any)?.data || []
  const eggItems = useMemo(() => {
    return items.filter((it: any) => it.category === 'بيض منتج')
  }, [items])

  // Form states
  const [mortality, setMortality] = useState('')
  const [eggQuantities, setEggQuantities] = useState<Record<number, string>>({})
  const [feedQty, setFeedQty] = useState('')
  const [aiObs, setAiObs] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const setEggQty = (itemId: number, value: string) => {
    setEggQuantities(prev => ({ ...prev, [itemId]: value }))
  }

  // Prefill form
  useEffect(() => {
    if (entry) {
      setMortality(entry.mortality?.toString() ?? '')
      setFeedQty(entry.feed_quantity_kg?.toString() ?? '')
      setAiObs(entry.ai_observation ?? '')
      if (Array.isArray(entry.egg_items) && entry.egg_items.length > 0) {
        const q: Record<number, string> = {}
        entry.egg_items.forEach((ei: any) => {
          q[ei.item_id] = ei.quantity?.toString() ?? ''
        })
        setEggQuantities(q)
      }
    }
  }, [entry])

  const totalEggs = useMemo(() => {
    return Object.values(eggQuantities).reduce((sum, val) => sum + (Number(val) || 0), 0)
  }, [eggQuantities])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const result = productionEntrySchema.safeParse({
      mortality,
      feed_quantity_kg: feedQty,
      ai_observation: aiObs || undefined,
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

    // Build egg_items array
    const eggItemsPayload = eggItems
      .map((item: any) => ({
        item_id: item.id,
        quantity: Number(eggQuantities[item.id] || 0),
      }))
      .filter((ei: { item_id: number; quantity: number }) => ei.quantity > 0)

    const d = result.data
    updateEntry.mutate({
      entryId: entryIdNum,
      data: {
        mortality: d.mortality,
        egg_items: eggItemsPayload,
        feed_quantity_kg: d.feed_quantity_kg,
        ai_observation: d.ai_observation,
      } as any,
    }, {
      onSuccess: () => {
        router.push(`/flocks/${flockId}`)
      },
    })
  }

  const isLoading = isFlockLoading || isEntryLoading

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 text-farm-blue animate-spin" />
      </div>
    )
  }

  if (!flock || !entry || entryError) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-2xl p-8 border border-gray-200 shadow-sm text-center" dir="rtl">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">التسجيل غير موجود</h2>
        <p className="text-gray-600 mb-6">نأسف، لم نتمكن من العثور على التسجيل اليومي المطلوبة أو أنك تحاول الوصول لبيانات غير صحيحة.</p>
        <button
          onClick={() => router.push(`/flocks/${flockId}`)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-farm-blue text-white rounded-xl hover:bg-farm-blue/90 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          العودة للفوج
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
            فوج إنتاج #{flockId}
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">تعديل تسجيل يومي</span>
        </div>

        <div className="flex items-center gap-3 mt-2">
          <h1 className="text-2xl font-bold text-gray-900 font-outfit">تعديل تسجيل يومي</h1>
          <FlockStatusBadge status={flock.status} />
          <FlockTypeBadge type={flock.flock_type} />
        </div>
      </div>

      {/* Read Only Stats */}
      <EntryReadOnlyInfo
        recordDate={entry.record_date}
        ageDays={entry.age_days}
        birdCount={entry.bird_count}
      />

      {/* Closed Flock Guard */}
      {flock.status !== 'active' && (
        <div className="bg-amber-50 border-r-4 border-amber-500 text-amber-800 p-4 rounded-md text-sm flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>هذا الفوج غير نشط. التعديل متاح فقط للأغراض التدقيقية وتجنب الإجراءات التلقائية.</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6">
        {updateEntry.error && (
          <div className="p-4 bg-red-50 border-r-4 border-red-500 text-red-700 flex items-start gap-3 rounded-md">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p>{(updateEntry.error as { message?: string })?.message ?? 'حدث خطأ أثناء تحديث التسجيل'}</p>
              {(updateEntry.error as { errors?: Record<string, string[]> })?.errors && (
                <ul className="mt-2 list-disc pr-4">
                  {Object.entries((updateEntry.error as unknown as { errors: Record<string, string[]> }).errors).map(([f, m]) => (
                    <li key={f}>{f}: {m.join(', ')}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* النفوق */}
        <div>
          <h3 className="text-sm font-bold text-gray-800 mb-3 border-b pb-2 border-gray-100">النفوق</h3>
          <div className="max-w-xs">
            <label htmlFor="mortality" className="text-sm font-semibold text-gray-700 block mb-1">عدد النفوق اليومي</label>
            <input
              id="mortality"
              type="number"
              min="0"
              className={ic('mortality')}
              value={mortality}
              onChange={(e) => setMortality(e.target.value)}
              placeholder="0"
            />
            {errors.mortality && <p className="text-xs text-red-600 mt-1 mr-1">{errors.mortality}</p>}
          </div>
        </div>

        {/* البيض — ديناميكي */}
        <div>
          <h3 className="text-sm font-bold text-gray-800 mb-3 border-b pb-2 border-gray-100">إنتاج البيض</h3>
          
          {/* Show previous total from legacy data */}
          {entry.total_eggs > 0 && totalEggs === 0 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
              <p className="font-semibold">الإجمالي السابق: {entry.total_eggs.toLocaleString()} بيضة</p>
              <p className="mt-1 text-xs">يرجى إعادة توزيع الكميات على الأصناف أدناه.</p>
            </div>
          )}

          {isLoadingItems ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              <span className="text-sm text-gray-400 mr-2">جاري تحميل الأصناف...</span>
            </div>
          ) : eggItems.length === 0 ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
              <p className="font-semibold">لا توجد أصناف بيض مُعرّفة</p>
              <p className="mt-1">يرجى إضافة أصناف من فئة "بيض منتج" في صفحة الأصناف أولاً.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {eggItems.map((item: any) => (
                  <div key={item.id}>
                    <label className="text-sm font-semibold text-gray-700 block mb-1 flex items-center gap-1.5">
                      <Egg className="w-3.5 h-3.5 text-amber-500" />
                      {item.name}
                    </label>
                    <input 
                      type="number" 
                      min="0" 
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-farm-blue transition-all"
                      value={eggQuantities[item.id] || ''} 
                      onChange={(e) => setEggQty(item.id, e.target.value)} 
                      placeholder="0" 
                    />
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-gray-50 rounded-xl flex items-center justify-between text-sm">
                <span className="font-semibold text-gray-600">إجمالي البيض المحسوب:</span>
                <span className="font-bold text-gray-950 text-lg">{totalEggs.toLocaleString('en-US')} بيضة</span>
              </div>
            </>
          )}
        </div>

        {/* استهلاك العلف */}
        <div>
          <h3 className="text-sm font-bold text-gray-800 mb-3 border-b pb-2 border-gray-100">استهلاك العلف</h3>
          <div className="max-w-xs">
            <label htmlFor="feed_quantity_kg" className="text-sm font-semibold text-gray-700 block mb-1">كمية العلف المستهلكة (كجم)</label>
            <input
              id="feed_quantity_kg"
              type="number"
              min="0"
              step="0.001"
              className={ic('feed_quantity_kg')}
              value={feedQty}
              onChange={(e) => setFeedQty(e.target.value)}
              placeholder="0.000"
            />
            {errors.feed_quantity_kg && <p className="text-xs text-red-600 mt-1 mr-1">{errors.feed_quantity_kg}</p>}
          </div>
        </div>

        {/* ملاحظات وملاحظات الذكاء الاصطناعي */}
        <div>
          <h3 className="text-sm font-bold text-gray-800 mb-3 border-b pb-2 border-gray-100">ملاحظات</h3>
          <div>
            <label htmlFor="ai_observation" className="text-sm font-semibold text-gray-700 block mb-1">ملاحظة أو تعليق</label>
            <textarea
              id="ai_observation"
              rows={3}
              className={ic('ai_observation')}
              value={aiObs}
              onChange={(e) => setAiObs(e.target.value)}
              placeholder="ملاحظات حول حالة الفوج الصحية أو أي ملاحظات تشغيلية..."
            />
            {errors.ai_observation && <p className="text-xs text-red-600 mt-1 mr-1">{errors.ai_observation}</p>}
          </div>
        </div>

        {/* أزرار الإجراءات */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => router.push(`/flocks/${flockId}`)}
            disabled={updateEntry.isPending}
            className="px-5 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={updateEntry.isPending}
            className="px-5 py-2.5 bg-farm-blue text-white rounded-xl hover:bg-farm-blue/90 font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {updateEntry.isPending ? (
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
