'use client'

import React, { useState } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { z } from 'zod'
import { useCreateBreedingEntry } from '@/lib/hooks/useDailyOps'

interface BreedingEntryFormProps {
  flockId: number
  onSuccess: () => void
  onCancel: () => void
}

const breedingEntrySchema = z.object({
  mortality:         z.coerce.number().int().min(0).default(0),
  weight_sample_avg: z.union([z.coerce.number().min(0), z.literal('')]).optional(),
  uniformity_pct:    z.union([z.coerce.number().min(0).max(100), z.literal('')]).optional(),
  feed_quantity_kg:  z.coerce.number().min(0.001, 'كمية العلف مطلوبة'),
  ai_observation:    z.string().optional(),
})

export default function BreedingEntryForm({ flockId, onSuccess, onCancel }: BreedingEntryFormProps) {
  const createEntry = useCreateBreedingEntry(flockId)
  const [mortality, setMortality] = useState('')
  const [weightAvg, setWeightAvg] = useState('')
  const [uniformity, setUniformity] = useState('')
  const [feedQty, setFeedQty] = useState('')
  const [aiObs, setAiObs] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    const result = breedingEntrySchema.safeParse({
      mortality,
      weight_sample_avg: weightAvg === '' ? '' : weightAvg,
      uniformity_pct: uniformity === '' ? '' : uniformity,
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

    // Explicit whitelist — NEVER send record_date, bird_count, week_number
    const payload: Parameters<typeof createEntry.mutate>[0] = {
      mortality: result.data.mortality,
      feed_quantity_kg: result.data.feed_quantity_kg as number,
      ai_observation: result.data.ai_observation,
    }
    if (result.data.weight_sample_avg !== '' && result.data.weight_sample_avg !== undefined) {
      payload.weight_sample_avg = result.data.weight_sample_avg as number
    }
    if (result.data.uniformity_pct !== '' && result.data.uniformity_pct !== undefined) {
      payload.uniformity_pct = result.data.uniformity_pct as number
    }

    createEntry.mutate(payload, { onSuccess: () => onSuccess() })
  }

  const ic = (f: string) =>
    `w-full border rounded-xl px-4 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-farm-blue ${errors[f] ? 'border-red-500' : 'border-gray-200'}`

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6">
      {createEntry.error && (
        <div className="p-4 bg-red-50 border-r-4 border-red-500 text-red-700 flex items-start gap-3 rounded-md">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p>{(createEntry.error as { message?: string })?.message ?? 'حدث خطأ أثناء حفظ التسجيل'}</p>
            {(createEntry.error as { errors?: Record<string, string[]> })?.errors && (
              <ul className="mt-2 list-disc pr-4">
                {Object.entries((createEntry.error as unknown as { errors: Record<string, string[]> }).errors).map(([f, m]) => (
                  <li key={f}>{f}: {m.join(', ')}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* البيانات اليومية */}
      <div>
        <h3 className="text-sm font-bold text-gray-800 mb-3">البيانات اليومية</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">النفوق</label>
            <input type="number" min="0" className={ic('mortality')} value={mortality} onChange={(e) => setMortality(e.target.value)} placeholder="0" />
            {errors.mortality && <p className="text-xs text-red-600 mt-1 mr-1">{errors.mortality}</p>}
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">متوسط وزن العينة — جرام (اختياري)</label>
            <input type="number" min="0" step="0.01" className={ic('weight_sample_avg')} value={weightAvg} onChange={(e) => setWeightAvg(e.target.value)} placeholder="اختياري" />
            {errors.weight_sample_avg && <p className="text-xs text-red-600 mt-1 mr-1">{errors.weight_sample_avg}</p>}
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">نسبة التجانس % (اختياري)</label>
            <input type="number" min="0" max="100" step="0.01" className={ic('uniformity_pct')} value={uniformity} onChange={(e) => setUniformity(e.target.value)} placeholder="0-100" />
            {errors.uniformity_pct && <p className="text-xs text-red-600 mt-1 mr-1">{errors.uniformity_pct}</p>}
          </div>
        </div>
      </div>

      {/* العلف */}
      <div>
        <h3 className="text-sm font-bold text-gray-800 mb-3">العلف</h3>
        <label className="text-sm font-semibold text-gray-700 block mb-1">كمية العلف</label>
        <div className="relative">
          <input type="number" min="0" step="0.001" className={ic('feed_quantity_kg')} value={feedQty} onChange={(e) => setFeedQty(e.target.value)} placeholder="0.000" />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">كجم</span>
        </div>
        {errors.feed_quantity_kg && <p className="text-xs text-red-600 mt-1 mr-1">{errors.feed_quantity_kg}</p>}
      </div>

      {/* ملاحظات */}
      <div>
        <h3 className="text-sm font-bold text-gray-800 mb-3">ملاحظات (اختياري)</h3>
        <textarea rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-farm-blue resize-none" value={aiObs} onChange={(e) => setAiObs(e.target.value)} placeholder="ملاحظات اختيارية..." />
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-medium transition-colors">إلغاء</button>
        <button type="submit" disabled={createEntry.isPending} className="px-6 py-2 bg-farm-green hover:bg-green-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2">
          {createEntry.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          حفظ التسجيل اليومي
        </button>
      </div>
    </form>
  )
}
