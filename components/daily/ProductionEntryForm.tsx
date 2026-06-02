'use client'

import { useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, CirclePlus, Egg, Loader2, Trash2, Warehouse } from 'lucide-react'
import type { ReactNode } from 'react'
import { useFieldArray, useForm, type Resolver } from 'react-hook-form'
import { z } from 'zod'
import { useCreateProductionEntry } from '@/lib/hooks/useDailyOps'
import { useFlock } from '@/lib/hooks/useFlock'
import { useItems, useWarehouses } from '@/lib/hooks/useInventory'
import type { EggItemPayload, FlockDetail, Item, PoultryFeedBatch, Warehouse as WarehouseType } from '@/lib/types'

interface ProductionEntryFormProps {
  flockId: number
  onSuccess: () => void
  onCancel: () => void
}

const canonicalEggSizes = [
  { code: 'F2', label: 'F2' },
  { code: 'SSS', label: 'SSS' },
  { code: 'B', label: 'B' },
  { code: 'B-D', label: 'B-D' },
  { code: 'S-D', label: 'S-D' },
  { code: 'SS', label: 'SS' },
  { code: 'S', label: 'S' },
  { code: 'M', label: 'M' },
  { code: 'L2', label: 'L2' },
  { code: 'L1', label: 'L1' },
  { code: 'XL', label: 'XL' },
  { code: 'XXL', label: 'XXL' },
  { code: 'J', label: 'J' },
] as const

const optionalNumber = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? undefined : value),
  z.coerce.number().optional()
)

const feedBatchSchema = z.object({
  log_time: z.string().optional(),
  feed_type: z.string().optional(),
  quantity_ton: z.coerce.number({ message: 'كمية العلف مطلوبة' }).min(0.001, 'كمية العلف مطلوبة'),
  price_per_ton: z.coerce.number().min(0, 'السعر لا يمكن أن يكون سالباً').default(0),
  warehouse_id: optionalNumber,
  item_id: z.coerce.number({ message: 'صنف العلف مطلوب' }).min(1, 'صنف العلف مطلوب'),
})

const eggSizeSchema = z.object({
  size_code: z.string(),
  item_id: optionalNumber,
  quantity: z.coerce.number().int('الكمية يجب أن تكون عدداً صحيحاً').min(0, 'الكمية لا يمكن أن تكون سالبة').default(0),
})

const productionEntrySchema = z.object({
  record_date: z.string().min(1, 'تاريخ السجل مطلوب'),
  mortality: z.coerce.number().int('يجب أن يكون عدداً صحيحاً').min(0, 'النافق لا يمكن أن يكون سالباً').default(0),
  egg_warehouse_id: optionalNumber,
  ai_observation: z.string().optional(),
  feed_batches: z.array(feedBatchSchema).min(1, 'أضف دفعة علف واحدة على الأقل'),
  egg_items: z.array(eggSizeSchema),
}).superRefine((value, context) => {
  value.egg_items.forEach((row, index) => {
    if (row.quantity > 0 && !row.item_id) {
      context.addIssue({
        code: 'custom',
        message: 'اختر صنف المخزون لهذا الحجم',
        path: ['egg_items', index, 'item_id'],
      })
    }
  })
})

type ProductionEntryValues = z.infer<typeof productionEntrySchema>

const fieldBase =
  'h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none transition-colors focus:border-[#c2410c] focus:ring-2 focus:ring-[#c2410c]/20 disabled:opacity-60'

const buttonPress =
  'transition-transform duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60'

function today() {
  return new Date().toISOString().split('T')[0]
}

function unwrapData<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[]
  if (value && typeof value === 'object' && Array.isArray((value as { data?: unknown }).data)) {
    return (value as { data: T[] }).data
  }
  return []
}

function normalizeText(value: string) {
  return value.toLowerCase().replaceAll('-', '').replaceAll('_', '').replaceAll(' ', '')
}

function findDefaultEggItem(items: Item[], sizeCode: string) {
  const normalizedSize = normalizeText(sizeCode)
  return items.find((item) => {
    const descriptor = normalizeText(`${item.name ?? ''} ${item.category ?? ''}`)
    return descriptor.includes('بيض') && descriptor.includes(normalizedSize)
  })?.id
}

function warehouseName(warehouses: WarehouseType[], warehouseId?: number | null) {
  if (!warehouseId) return 'غير محدد'
  return warehouses.find((warehouse) => warehouse.id === warehouseId)?.name ?? `#${warehouseId}`
}

function buildFeedPayload(feedBatches: ProductionEntryValues['feed_batches'], items: Item[]): PoultryFeedBatch[] {
  return feedBatches
    .filter((row) => row.quantity_ton > 0)
    .map((row) => {
      const item = items.find((it) => it.id === Number(row.item_id))
      return {
        log_time: row.log_time || null,
        feed_type: item?.name || null,
        quantity_ton: Number(row.quantity_ton.toFixed(3)),
        quantity_kg: Number((row.quantity_ton * 1000).toFixed(2)),
        price_per_ton: Number(row.price_per_ton || 0),
        amount: Number((row.quantity_ton * (row.price_per_ton || 0)).toFixed(2)),
        warehouse_id: row.warehouse_id ?? null,
        item_id: row.item_id,
        inventory_item_id: row.item_id,
      }
    })
}

function buildEggPayload(eggItems: ProductionEntryValues['egg_items']): EggItemPayload[] {
  return eggItems
    .filter((row) => row.quantity > 0 && row.item_id)
    .map((row) => ({
      item_id: Number(row.item_id),
      quantity: row.quantity,
      size_code: row.size_code,
      egg_size: row.size_code,
      size: row.size_code,
    }))
}

export default function ProductionEntryForm({ flockId, onSuccess, onCancel }: ProductionEntryFormProps) {
  const createEntry = useCreateProductionEntry(flockId)
  const { data: flockData } = useFlock(flockId)
  const { data: warehousesData, isLoading: isLoadingWarehouses } = useWarehouses(1, 200)
  const { data: itemsData, isLoading: isLoadingItems } = useItems(1, 300, true)

  const flock = flockData?.data as FlockDetail | undefined
  const warehouses = unwrapData<WarehouseType>(warehousesData)
  const items = unwrapData<Item>(itemsData)
  const section = flock?.barn?.section
  const defaultFeedWarehouseId = section?.feed_warehouse_id ?? null
  const defaultProductionWarehouseId = section?.production_warehouse_id ?? null

  const feedItems = useMemo(() => {
    const filtered = items.filter((item) => {
      const descriptor = `${item.name ?? ''} ${item.category ?? ''}`.toLowerCase()
      return descriptor.includes('feed') || descriptor.includes('علف') || descriptor.includes('أعلاف')
    })
    return filtered.length > 0 ? filtered : items
  }, [items])

  const eggItems = useMemo(() => {
    const filtered = items.filter((item) => {
      const descriptor = `${item.name ?? ''} ${item.category ?? ''}`.toLowerCase()
      return descriptor.includes('egg') || descriptor.includes('بيض')
    })
    return filtered.length > 0 ? filtered : items
  }, [items])

  const defaultValues = useMemo<ProductionEntryValues>(() => ({
    record_date: today(),
    mortality: 0,
    egg_warehouse_id: undefined,
    ai_observation: '',
    feed_batches: [
      {
        log_time: '08:00',
        quantity_ton: 0,
        price_per_ton: 0,
        warehouse_id: undefined,
        item_id: 0,
      },
    ],
    egg_items: canonicalEggSizes.map((size) => ({
      size_code: size.code,
      item_id: findDefaultEggItem(eggItems, size.code),
      quantity: 0,
    })),
  }), [eggItems])

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ProductionEntryValues>({
    resolver: zodResolver(productionEntrySchema) as Resolver<ProductionEntryValues>,
    values: defaultValues,
  })

  const feedArray = useFieldArray({ control, name: 'feed_batches' })
  const watchedFeedBatches = watch('feed_batches')
  const watchedEggItems = watch('egg_items')
  const selectedEggWarehouseId = watch('egg_warehouse_id')

  const totalFeedTon = watchedFeedBatches.reduce((total, row) => total + (Number(row.quantity_ton) || 0), 0)
  const totalFeedKg = Number((totalFeedTon * 1000).toFixed(2))
  const totalFeedCost = watchedFeedBatches.reduce(
    (total, row) => total + (Number(row.quantity_ton) || 0) * (Number(row.price_per_ton) || 0),
    0
  )
  const totalEggs = watchedEggItems.reduce((total, row) => total + (Number(row.quantity) || 0), 0)

  const onSubmit = (values: ProductionEntryValues) => {
    const feedBatches = buildFeedPayload(values.feed_batches, items)
    const firstFeedBatch = feedBatches[0]
    const feedSummary = feedBatches
      .map((row) => `${row.log_time ?? 'بدون وقت'} / ${row.feed_type || 'علف'} / ${row.quantity_ton} طن / ${row.price_per_ton ?? 0} ريال`)
      .join(' | ')

    createEntry.mutate({
      record_date: values.record_date,
      mortality: values.mortality,
      egg_items: buildEggPayload(values.egg_items),
      feed_batches: feedBatches,
      feed_rows: feedBatches,
      feed_quantity_kg: totalFeedKg,
      warehouse_id: firstFeedBatch?.warehouse_id ?? defaultFeedWarehouseId ?? undefined,
      feed_warehouse_id: firstFeedBatch?.warehouse_id ?? defaultFeedWarehouseId ?? undefined,
      inventory_item_id: firstFeedBatch?.item_id ?? undefined,
      egg_warehouse_id: values.egg_warehouse_id ?? defaultProductionWarehouseId ?? undefined,
      production_warehouse_id: values.egg_warehouse_id ?? defaultProductionWarehouseId ?? undefined,
      ai_observation: [values.ai_observation, feedSummary ? `دفعات العلف: ${feedSummary}` : ''].filter(Boolean).join('\n') || undefined,
    }, { onSuccess })
  }

  const apiErrors = (createEntry.error as { errors?: Record<string, string[]>; message?: string } | null)?.errors
  const isBusy = createEntry.isPending || isLoadingWarehouses || isLoadingItems

  return (
    <form onSubmit={handleSubmit(onSubmit)} dir="rtl" className="space-y-6">
      {createEntry.error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p>{(createEntry.error as { message?: string })?.message ?? 'حدث خطأ أثناء حفظ التسجيل'}</p>
              {apiErrors ? (
                <ul className="mt-2 list-disc space-y-1 pr-5 text-xs">
                  {Object.entries(apiErrors).map(([field, messages]) => (
                    <li key={field}>{field}: {messages.join('، ')}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        {/* العمود الأيمن: البيانات العامة والملاحظات */}
        <div className="space-y-6 lg:col-span-4">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">البيانات الأساسية</h3>
            
            <FormField label="تاريخ السجل" error={errors.record_date?.message}>
              <input type="date" max={today()} disabled={isBusy} className={fieldBase} {...register('record_date')} />
            </FormField>

            <FormField label="النافق اليومي" error={errors.mortality?.message}>
              <input type="number" min="0" disabled={isBusy} className={fieldBase} {...register('mortality')} />
            </FormField>

            <FormField label="مستودع تخزين البيض" error={errors.egg_warehouse_id?.message}>
              <select disabled={isBusy} className={fieldBase} {...register('egg_warehouse_id')}>
                <option value="">
                  استخدام الافتراضي: {warehouseName(warehouses, defaultProductionWarehouseId)}
                </option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                ))}
              </select>
              {!selectedEggWarehouseId && defaultProductionWarehouseId ? (
                <p className="mt-1.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">سيتم استخدام مستودع الإنتاج الافتراضي من القسم.</p>
              ) : null}
            </FormField>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">ملاحظات تشغيلية</h3>
            <FormField label="ملاحظات وتوصيات" error={errors.ai_observation?.message}>
              <textarea
                rows={4}
                disabled={isBusy}
                className="w-full resize-none rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition-colors focus:border-[#c2410c] focus:ring-2 focus:ring-[#c2410c]/20 disabled:opacity-60"
                placeholder="اكتب أي ملاحظات أو توصيات هنا..."
                {...register('ai_observation')}
              />
            </FormField>
          </div>
        </div>

        {/* العمود الأيسر: مقاسات البيض ودفعات العلف */}
        <div className="space-y-6 lg:col-span-8">
          {/* مقاسات البيض */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Egg className="h-5 w-5 text-[#c2410c]" />
                  إنتاج البيض حسب المقاسات القياسية
                </h3>
                <p className="text-xs font-semibold text-slate-400 mt-1">يتم ربط وحفظ الإنتاج تلقائياً بـ 13 مقاساً قياسياً معتمداً.</p>
              </div>
              <div className="rounded-xl border border-orange-100 bg-orange-50/50 px-4 py-2 text-sm font-bold text-[#c2410c] shadow-sm">
                الإجمالي: {totalEggs.toLocaleString('ar-EG')} طبق
              </div>
            </div>

            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7">
              {canonicalEggSizes.map((size, index) => (
                <div key={size.code} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 hover:border-orange-200 transition-all duration-200">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <span className="h-2 w-2 rounded-full bg-[#c2410c]" />
                      {size.label}
                    </span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-500">
                      {size.code}
                    </span>
                  </div>
                  <input type="hidden" {...register(`egg_items.${index}.size_code`)} />
                  <input type="hidden" {...register(`egg_items.${index}.item_id`)} />
                  
                  <div className="space-y-1.5">
                    <input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      disabled={isBusy}
                      className="h-10 w-full rounded-xl border border-slate-100 bg-white px-3 text-left font-mono text-sm font-semibold text-slate-900 outline-none transition-all focus:border-[#c2410c] focus:ring-2 focus:ring-[#c2410c]/10"
                      placeholder="0"
                      {...register(`egg_items.${index}.quantity`)}
                    />
                    {(() => {
                      const itemId = watchedEggItems?.[index]?.item_id
                      const matchedItem = eggItems.find((it) => it.id === Number(itemId))
                      return (
                        <p className="text-[10px] text-slate-400 font-semibold text-center truncate">
                          مخزون: {matchedItem?.name || size.label}
                        </p>
                      )
                    })()}
                    {errors.egg_items?.[index]?.item_id?.message ? (
                      <p className="text-xs font-semibold text-red-600 text-center">{errors.egg_items[index]?.item_id?.message}</p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* دفعات العلف */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Warehouse className="h-5 w-5 text-emerald-700" />
                  دفعات استهلاك العلف
                </h3>
                <p className="text-xs font-semibold text-slate-400 mt-1">سجل أوقات تقديم العلف والكميات بالطن بدقة متناهية.</p>
              </div>
              <button
                type="button"
                onClick={() => feedArray.append({ log_time: '', quantity_ton: 0, price_per_ton: 0, warehouse_id: undefined, item_id: 0 })}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white hover:bg-slate-800 active:scale-[0.98] transition-transform duration-150"
              >
                <CirclePlus className="h-4 w-4" />
                إضافة دفعة علف
              </button>
            </div>

            <div className="space-y-4">
              {feedArray.fields.map((field, index) => (
                <div key={field.id} className="relative rounded-2xl border border-slate-100 bg-slate-50/50 p-4 pt-8 lg:pt-4 grid gap-4 lg:grid-cols-[100px_1fr_100px_100px_1fr_40px] items-start hover:border-slate-200 transition-colors duration-200">
                  <FormField label="الوقت" error={errors.feed_batches?.[index]?.log_time?.message}>
                    <input type="time" disabled={isBusy} className={`${fieldBase} bg-white h-10`} {...register(`feed_batches.${index}.log_time`)} />
                  </FormField>
                  
                  <FormField label="صنف المخزون" error={errors.feed_batches?.[index]?.item_id?.message}>
                    <select disabled={isBusy} className={`${fieldBase} bg-white h-10`} {...register(`feed_batches.${index}.item_id`)}>
                      <option value="">اختر الصنف</option>
                      {feedItems.map((item) => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                  </FormField>
                  
                  <FormField label="الكمية طن" error={errors.feed_batches?.[index]?.quantity_ton?.message}>
                    <input type="number" min="0" step="0.001" disabled={isBusy} className={`${fieldBase} bg-white h-10 text-left font-mono`} {...register(`feed_batches.${index}.quantity_ton`)} />
                  </FormField>
                  
                  <FormField label="السعر/طن" error={errors.feed_batches?.[index]?.price_per_ton?.message}>
                    <input type="number" min="0" step="0.01" disabled={isBusy} className={`${fieldBase} bg-white h-10 text-left font-mono`} {...register(`feed_batches.${index}.price_per_ton`)} />
                  </FormField>
                  
                  <FormField label="المستودع" error={errors.feed_batches?.[index]?.warehouse_id?.message}>
                    <select disabled={isBusy} className={`${fieldBase} bg-white h-10`} {...register(`feed_batches.${index}.warehouse_id`)}>
                      <option value="">الافتراضي: {warehouseName(warehouses, defaultFeedWarehouseId)}</option>
                      {warehouses.map((warehouse) => (
                        <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                      ))}
                    </select>
                  </FormField>

                  <div className="absolute top-2 left-2 lg:relative lg:top-0 lg:left-0 lg:mt-5 flex justify-end">
                    <button
                      type="button"
                      onClick={() => feedArray.fields.length > 1 && feedArray.remove(index)}
                      disabled={isBusy || feedArray.fields.length === 1}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-30 active:scale-95 transition-transform"
                      aria-label="حذف دفعة العلف"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-3 grid-cols-1 md:grid-cols-3 pt-2">
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 flex flex-col justify-center">
                <span className="text-[10px] font-bold text-slate-400">إجمالي العلف بالطن</span>
                <span className="mt-1 font-mono text-base font-bold text-slate-800">{totalFeedTon.toLocaleString('ar-EG', { maximumFractionDigits: 3 })} طن</span>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 flex flex-col justify-center">
                <span className="text-[10px] font-bold text-slate-400">إجمالي العلف بالكجم</span>
                <span className="mt-1 font-mono text-base font-bold text-slate-800">{totalFeedKg.toLocaleString('ar-EG', { maximumFractionDigits: 2 })} كجم</span>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 flex flex-col justify-center">
                <span className="text-[10px] font-bold text-slate-400">إجمالي التكلفة</span>
                <span className="mt-1 font-mono text-base font-bold text-[#c2410c]">{totalFeedCost.toLocaleString('ar-EG', { maximumFractionDigits: 2 })} ر.س</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={isBusy}
          className="min-h-11 rounded-xl border border-slate-200/60 bg-white px-6 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-transform duration-150"
        >
          إلغاء
        </button>
        <button
          type="submit"
          disabled={isBusy}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-8 py-2 text-sm font-bold text-white hover:bg-slate-800 active:scale-[0.98] transition-all shadow-sm"
        >
          {createEntry.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          حفظ تسجيل الإنتاج
        </button>
      </div>
    </form>
  )
}

function FormField({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-slate-600">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs font-bold text-red-600">{error}</span> : null}
    </label>
  )
}

function ReadOnlyMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white px-4 py-3">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 font-mono text-lg font-bold text-slate-950">{value}</p>
    </div>
  )
}
