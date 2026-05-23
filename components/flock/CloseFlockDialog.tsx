'use client'

import React, { useState } from 'react'
import { X, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react'
import { z } from 'zod'
import { useCloseFlock } from '@/lib/hooks/useFlock'

interface CloseFlockDialogProps {
  flockId: number
  currentCount: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

const closeFlockSchema = z.object({
  close_date: z.string().min(1, 'تاريخ الإغلاق مطلوب'),
  allocations: z
    .array(
      z.object({
        label: z.string().min(1, 'اسم الوجهة مطلوب'),
        bird_count: z.coerce.number().int().min(1, 'أكبر من صفر'),
        value: z.coerce.number().min(0).optional(),
      })
    )
    .min(1, 'يجب إضافة وجهة واحدة على الأقل'),
})

type Allocation = {
  label: string
  bird_count: number | ''
  value: number | ''
}

export default function CloseFlockDialog({
  flockId,
  currentCount,
  open,
  onOpenChange,
}: CloseFlockDialogProps) {
  const closeFlock = useCloseFlock(flockId)
  const [closeDate, setCloseDate] = useState(
    new Date().toISOString().slice(0, 10)
  )
  const [allocations, setAllocations] = useState<Allocation[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  if (!open) return null

  const totalAllocated = allocations.reduce(
    (sum, a) => sum + (typeof a.bird_count === 'number' ? a.bird_count : 0),
    0
  )
  const exceedsCount = totalAllocated > currentCount

  const addAllocation = () => {
    setAllocations([...allocations, { label: '', bird_count: '', value: '' }])
  }

  const removeAllocation = (idx: number) => {
    setAllocations(allocations.filter((_, i) => i !== idx))
  }

  const updateAllocation = (
    idx: number,
    field: keyof Allocation,
    value: string
  ) => {
    const updated = [...allocations]
    if (field === 'bird_count' || field === 'value') {
      updated[idx] = { ...updated[idx], [field]: value === '' ? '' : Number(value) }
    } else {
      updated[idx] = { ...updated[idx], [field]: value }
    }
    setAllocations(updated)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const result = closeFlockSchema.safeParse({ close_date: closeDate, allocations })
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach((issue) => {
        const path = issue.path.join('.')
        if (!fieldErrors[path]) fieldErrors[path] = issue.message
      })
      setErrors(fieldErrors)
      return
    }

    if (exceedsCount) return

    closeFlock.mutate(
      {
        close_date: closeDate,
        allocations: allocations.map((a) => ({
          label: a.label,
          bird_count: a.bird_count as number,
          value: (a.value as number) || undefined,
        })),
      },
      {
        onSuccess: () => {
          onOpenChange(false)
        },
      }
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">إغلاق الفوج</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {closeFlock.error && (
          <div className="mb-4 p-4 bg-red-50 border-r-4 border-red-500 text-red-700 flex items-start gap-3 rounded-md">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm">
              {(closeFlock.error as { message?: string })?.message ??
                'حدث خطأ أثناء إغلاق الفوج'}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Close Date */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">
              تاريخ الإغلاق
            </label>
            <input
              type="date"
              max={new Date().toISOString().slice(0, 10)}
              className={`w-full border rounded-xl px-4 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-farm-blue ${
                errors['close_date'] ? 'border-red-500' : 'border-gray-200'
              }`}
              value={closeDate}
              onChange={(e) => setCloseDate(e.target.value)}
            />
            {errors['close_date'] && (
              <p className="text-xs text-red-600 mt-1 mr-1">
                {errors['close_date']}
              </p>
            )}
          </div>

          {/* Allocations */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-700">وجهات التوزيع</label>
              <button
                type="button"
                onClick={addAllocation}
                className="flex items-center gap-1 text-sm text-farm-blue hover:text-blue-800 font-medium"
              >
                <Plus className="w-4 h-4" />
                إضافة وجهة
              </button>
            </div>

            {errors['allocations'] && (
              <p className="text-xs text-red-600 mb-2 mr-1">
                {errors['allocations']}
              </p>
            )}

            <div className="space-y-3">
              {allocations.map((alloc, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                >
                  <input
                    type="text"
                    placeholder="اسم الوجهة"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-farm-blue"
                    value={alloc.label}
                    onChange={(e) => updateAllocation(idx, 'label', e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="عدد الطيور"
                    className="w-28 border border-gray-200 rounded-lg px-3 py-2 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-farm-blue"
                    value={alloc.bird_count}
                    onChange={(e) =>
                      updateAllocation(idx, 'bird_count', e.target.value)
                    }
                  />
                  <input
                    type="number"
                    placeholder="القيمة"
                    className="w-28 border border-gray-200 rounded-lg px-3 py-2 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-farm-blue"
                    value={alloc.value}
                    onChange={(e) =>
                      updateAllocation(idx, 'value', e.target.value)
                    }
                  />
                  <button
                    type="button"
                    onClick={() => removeAllocation(idx)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Live total */}
            {allocations.length > 0 && (
              <div
                className={`mt-3 p-3 rounded-xl text-sm font-medium ${
                  exceedsCount
                    ? 'bg-red-50 text-red-700'
                    : 'bg-farm-blue/5 text-farm-blue'
                }`}
              >
                مجموع الطيور المخصصة:{' '}
                <span className="font-bold">{totalAllocated.toLocaleString()}</span>{' '}
                من{' '}
                <span className="font-bold">
                  {currentCount.toLocaleString()}
                </span>
                {exceedsCount && (
                  <p className="text-xs mt-1 text-red-600">
                    عدد الطيور يتجاوز العدد الحالي
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-medium transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={closeFlock.isPending || exceedsCount}
              className="px-6 py-2 bg-farm-blue hover:bg-blue-800 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {closeFlock.isPending && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              تأكيد الإغلاق
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
