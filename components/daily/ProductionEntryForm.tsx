'use client'

import React, { useState, useMemo } from 'react'
import { Loader2, AlertCircle, Egg } from 'lucide-react'
import { z } from 'zod'
import { useCreateProductionEntry } from '@/lib/hooks/useDailyOps'
import { useWarehouses, useItems } from '@/lib/hooks/useInventory'

interface ProductionEntryFormProps {
  flockId: number
  onSuccess: () => void
  onCancel: () => void
}

const productionEntrySchema = z.object({
  record_date:      z.string().min(1, 'تاريخ السجل مطلوب'),
  mortality:        z.coerce.number({ message: 'يجب إدخال رقم صحيح' }).int('يجب أن يكون عدداً صحيحاً').min(0, 'لا يمكن أن يكون سالباً').default(0),
  feed_quantity_kg: z.coerce.number({ message: 'يجب إدخال رقم' }).min(0.001, 'كمية العلف مطلوبة ويجب أن تكون أكبر من صفر'),
  warehouse_id:     z.coerce.number({ message: 'مستودع العلف مطلوب' }).min(1, 'مستودع العلف مطلوب'),
  inventory_item_id: z.coerce.number({ message: 'صنف العلف مطلوب' }).min(1, 'صنف العلف مطلوب'),
  egg_warehouse_id:  z.preprocess((val) => (val === '' ? undefined : val), z.coerce.number().optional()),
  ai_observation:   z.string().optional(),
})

export default function ProductionEntryForm({ flockId, onSuccess, onCancel }: ProductionEntryFormProps) {
  const createEntry = useCreateProductionEntry(flockId)
  
  // Inventory Lookups
  const { data: warehousesData, isLoading: isLoadingWarehouses } = useWarehouses()
  const { data: itemsData, isLoading: isLoadingItems } = useItems()

  const warehouses = Array.isArray(warehousesData) ? warehousesData : (warehousesData as any)?.data || []
  const items = Array.isArray(itemsData) ? itemsData : (itemsData as any)?.data || []

  const eggItems = useMemo(() => {
    return items.filter((it: any) => it.category === 'بيض منتج')
  }, [items])

  const feedItems = useMemo(() => {
    return items.filter((it: any) => it.category === 'أعلاف')
  }, [items])

  // Component Form States
  const [recordDate, setRecordDate] = useState(() => new Date().toISOString().split('T')[0])
  const [mortality, setMortality] = useState('')

  // Dynamic egg quantities: { [itemId]: quantityString }
  const [eggQuantities, setEggQuantities] = useState<Record<number, string>>({})
  const [eggWarehouseId, setEggWarehouseId] = useState('')

  const [feedQty, setFeedQty] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [inventoryItemId, setInventoryItemId] = useState('')

  const [aiObs, setAiObs] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const setEggQty = (itemId: number, value: string) => {
    setEggQuantities(prev => ({ ...prev, [itemId]: value }))
  }

  const totalEggs = useMemo(() => {
    return Object.values(eggQuantities).reduce((sum, val) => sum + (Number(val) || 0), 0)
  }, [eggQuantities])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    
    const result = productionEntrySchema.safeParse({
      record_date: recordDate,
      mortality, 
      feed_quantity_kg: feedQty, 
      warehouse_id: warehouseId,
      inventory_item_id: inventoryItemId,
      egg_warehouse_id: eggWarehouseId,
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

    // Build egg_items array from quantities
    const eggItemsPayload = eggItems
      .map((item: any) => ({
        item_id: item.id,
        quantity: Number(eggQuantities[item.id] || 0),
      }))
      .filter((ei: { item_id: number; quantity: number }) => ei.quantity > 0)

    const d = result.data
    createEntry.mutate({
      record_date: d.record_date,
      mortality: d.mortality, 
      egg_items: eggItemsPayload,
      feed_quantity_kg: d.feed_quantity_kg,
      warehouse_id: d.warehouse_id,
      inventory_item_id: d.inventory_item_id,
      egg_warehouse_id: d.egg_warehouse_id ?? undefined,
      ai_observation: d.ai_observation,
    } as any, { onSuccess: () => onSuccess() })
  }

  const ic = (f: string) =>
    `w-full border rounded-xl px-4 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-farm-blue disabled:opacity-60 transition-colors ${errors[f] ? 'border-red-500' : 'border-gray-200'}`

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6" dir="rtl">
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

      {/* التاريخ */}
      <div>
        <h3 className="text-sm font-bold text-gray-800 mb-3">تاريخ السجل</h3>
        <label className="text-sm font-semibold text-gray-700 block mb-1">
          التاريخ <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          className={ic('record_date')}
          value={recordDate}
          max={new Date().toISOString().split('T')[0]}
          onChange={(e) => setRecordDate(e.target.value)}
          disabled={createEntry.isPending}
        />
        {errors.record_date && <p className="text-xs text-red-600 mt-1 mr-1">{errors.record_date}</p>}
      </div>

      {/* النفوق */}
      <div>
        <h3 className="text-sm font-bold text-gray-800 mb-3">النفوق</h3>
        <label className="text-sm font-semibold text-gray-700 block mb-1">عدد النفوق</label>
        <input 
          type="number" 
          min="0" 
          className={ic('mortality')} 
          value={mortality} 
          onChange={(e) => setMortality(e.target.value)} 
          placeholder="0" 
          disabled={createEntry.isPending}
        />
        {errors.mortality && <p className="text-xs text-red-600 mt-1 mr-1">{errors.mortality}</p>}
      </div>

      {/* البيض — ديناميكي من أصناف المخزون */}
      <div>
        <h3 className="text-sm font-bold text-gray-800 mb-3">إنتاج البيض</h3>
        
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
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-farm-blue disabled:opacity-60 transition-colors"
                    value={eggQuantities[item.id] || ''} 
                    onChange={(e) => setEggQty(item.id, e.target.value)} 
                    placeholder="0" 
                    disabled={createEntry.isPending}
                  />
                </div>
              ))}
            </div>

            <div className="mt-3 p-3 bg-farm-blue/5 rounded-xl text-sm font-medium text-farm-blue flex justify-between items-center">
              <span>إجمالي البيض:</span>
              <span className="font-bold text-lg">{totalEggs.toLocaleString()}</span>
            </div>

            {/* تخزين المخزون للبيض */}
            <div className="mt-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-100/80 space-y-4">
              <h4 className="text-xs font-bold text-gray-700">مستودع تخزين إنتاج البيض (اختياري)</h4>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">مستودع البيض</label>
                <select
                  className={ic('egg_warehouse_id')}
                  value={eggWarehouseId}
                  onChange={(e) => setEggWarehouseId(e.target.value)}
                  disabled={isLoadingWarehouses || createEntry.isPending}
                >
                  <option value="">لا يوجد تخزين تلقائي</option>
                  {warehouses.map((wh: any) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name}
                    </option>
                  ))}
                </select>
                {errors.egg_warehouse_id && <p className="text-xs text-red-600 mt-1 mr-1">{errors.egg_warehouse_id}</p>}
              </div>
              {eggWarehouseId && (
                <p className="text-xs text-emerald-600 bg-emerald-50 p-2 rounded-lg">
                  ✓ عند الحفظ سيتم إضافة كمية كل صنف بيض تلقائياً كحركة وارد في المستودع المختار.
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* العلف */}
      <div>
        <h3 className="text-sm font-bold text-gray-800 mb-3">العلف</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">
              مستودع العلف <span className="text-red-500">*</span>
            </label>
            <select
              className={ic('warehouse_id')}
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              disabled={isLoadingWarehouses || createEntry.isPending}
            >
              <option value="">اختر المستودع...</option>
              {warehouses.map((wh: any) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name}
                </option>
              ))}
            </select>
            {errors.warehouse_id && <p className="text-xs text-red-600 mt-1 mr-1">{errors.warehouse_id}</p>}
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">
              صنف العلف <span className="text-red-500">*</span>
            </label>
            <select
              className={ic('inventory_item_id')}
              value={inventoryItemId}
              onChange={(e) => setInventoryItemId(e.target.value)}
              disabled={isLoadingItems || createEntry.isPending}
            >
              <option value="">اختر الصنف...</option>
              {feedItems.map((it: any) => (
                <option key={it.id} value={it.id}>
                  {it.name}
                </option>
              ))}
            </select>
            {errors.inventory_item_id && <p className="text-xs text-red-600 mt-1 mr-1">{errors.inventory_item_id}</p>}
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">
              كمية العلف <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input 
                type="number" 
                min="0" 
                step="0.001" 
                className={ic('feed_quantity_kg')} 
                value={feedQty} 
                onChange={(e) => setFeedQty(e.target.value)} 
                placeholder="0.000" 
                disabled={createEntry.isPending}
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">كجم</span>
            </div>
            {errors.feed_quantity_kg && <p className="text-xs text-red-600 mt-1 mr-1">{errors.feed_quantity_kg}</p>}
          </div>
        </div>
      </div>

      {/* ملاحظات */}
      <div>
        <h3 className="text-sm font-bold text-gray-800 mb-3">ملاحظات الذكاء الاصطناعي (اختياري)</h3>
        <textarea 
          rows={3} 
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-farm-blue resize-none disabled:opacity-60 transition-colors" 
          value={aiObs} 
          onChange={(e) => setAiObs(e.target.value)} 
          placeholder="ملاحظات اختيارية..." 
          disabled={createEntry.isPending}
        />
      </div>
    

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
        <button 
          type="button" 
          onClick={onCancel} 
          disabled={createEntry.isPending} 
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-600 rounded-xl font-medium transition-colors"
        >
          إلغاء
        </button>
        <button 
          type="submit" 
          disabled={createEntry.isPending || isLoadingWarehouses || isLoadingItems} 
          className="px-6 py-2 bg-farm-green hover:bg-farm-green/90 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {createEntry.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          حفظ التسجيل اليومي
        </button>
      </div>
    </form>
  )
}