'use client'

import React, { useState, useMemo } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { z } from 'zod'
import { useCreateProductionEntry } from '@/lib/hooks/useDailyOps'

interface ProductionEntryFormProps {
  flockId: number
  onSuccess: () => void
  onCancel: () => void
}

const productionEntrySchema = z.object({
  mortality:        z.coerce.number().int().min(0).default(0),
  egg_size_jumbo:   z.coerce.number().int().min(0).default(0),
  egg_size_xlarge:  z.coerce.number().int().min(0).default(0),
  egg_size_large:   z.coerce.number().int().min(0).default(0),
  egg_size_medium:  z.coerce.number().int().min(0).default(0),
  egg_size_small:   z.coerce.number().int().min(0).default(0),
  egg_size_reject:  z.coerce.number().int().min(0).default(0),
  feed_quantity_kg: z.coerce.number().min(0.001, 'كمية العلف مطلوبة'),
  ai_observation:   z.string().optional(),
})

export default function ProductionEntryForm({ flockId, onSuccess, onCancel }: ProductionEntryFormProps) {
  const createEntry = useCreateProductionEntry(flockId)
  const [mortality, setMortality] = useState('')
  const [eggJumbo, setEggJumbo] = useState('')
  const [eggXlarge, setEggXlarge] = useState('')
  const [eggLarge, setEggLarge] = useState('')
  const [eggMedium, setEggMedium] = useState('')
  const [eggSmall, setEggSmall] = useState('')
  const [eggReject, setEggReject] = useState('')
  const [feedQty, setFeedQty] = useState('')
  const [aiObs, setAiObs] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const totalEggs = useMemo(() => {
    return (Number(eggJumbo) || 0) + (Number(eggXlarge) || 0) +
      (Number(eggLarge) || 0) + (Number(eggMedium) || 0) +
      (Number(eggSmall) || 0) + (Number(eggReject) || 0)
  }, [eggJumbo, eggXlarge, eggLarge, eggMedium, eggSmall, eggReject])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    const result = productionEntrySchema.safeParse({
      mortality, egg_size_jumbo: eggJumbo, egg_size_xlarge: eggXlarge,
      egg_size_large: eggLarge, egg_size_medium: eggMedium,
      egg_size_small: eggSmall, egg_size_reject: eggReject,
      feed_quantity_kg: feedQty, ai_observation: aiObs || undefined,
    })
    if (!result.success) {
      const fe: Record<string, string> = {}
      result.error.issues.forEach((i) => { const k = i.path[0] as string; if (!fe[k]) fe[k] = i.message })
      setErrors(fe); return
    }
    const d = result.data
    createEntry.mutate({
      mortality: d.mortality, egg_size_jumbo: d.egg_size_jumbo,
      egg_size_xlarge: d.egg_size_xlarge, egg_size_large: d.egg_size_large,
      egg_size_medium: d.egg_size_medium, egg_size_small: d.egg_size_small,
      egg_size_reject: d.egg_size_reject, feed_quantity_kg: d.feed_quantity_kg,
      ai_observation: d.ai_observation,
    }, { onSuccess: () => onSuccess() })
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

      {/* النفوق */}
      <div>
        <h3 className="text-sm font-bold text-gray-800 mb-3">النفوق</h3>
        <label className="text-sm font-semibold text-gray-700 block mb-1">عدد النفوق</label>
        <input type="number" min="0" className={ic('mortality')} value={mortality} onChange={(e) => setMortality(e.target.value)} placeholder="0" />
        {errors.mortality && <p className="text-xs text-red-600 mt-1 mr-1">{errors.mortality}</p>}
      </div>

      {/* البيض */}
      <div>
        <h3 className="text-sm font-bold text-gray-800 mb-3">البيض (حسب الحجم)</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {([
            ['كبير جداً', eggJumbo, setEggJumbo, 'egg_size_jumbo'],
            ['كبير XL', eggXlarge, setEggXlarge, 'egg_size_xlarge'],
            ['كبير', eggLarge, setEggLarge, 'egg_size_large'],
            ['متوسط', eggMedium, setEggMedium, 'egg_size_medium'],
            ['صغير', eggSmall, setEggSmall, 'egg_size_small'],
            ['مرفوض', eggReject, setEggReject, 'egg_size_reject'],
          ] as [string, string, React.Dispatch<React.SetStateAction<string>>, string][]).map(([lbl, val, setter, key]) => (
            <div key={key}>
              <label className="text-sm font-semibold text-gray-700 block mb-1">{lbl}</label>
              <input type="number" min="0" className={ic(key)} value={val} onChange={(e) => setter(e.target.value)} placeholder="0" />
              {errors[key] && <p className="text-xs text-red-600 mt-1 mr-1">{errors[key]}</p>}
            </div>
          ))}
        </div>
        <div className="mt-3 p-3 bg-farm-blue/5 rounded-xl text-sm font-medium text-farm-blue">
          إجمالي البيض: <span className="font-bold text-lg">{totalEggs.toLocaleString()}</span>
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
        <h3 className="text-sm font-bold text-gray-800 mb-3">ملاحظات الذكاء الاصطناعي (اختياري)</h3>
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
