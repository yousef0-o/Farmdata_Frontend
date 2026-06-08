'use client'

import { useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, CirclePlus, Trash2, Warehouse } from 'lucide-react'
import type { ReactNode } from 'react'
import { useFieldArray, useForm, type Resolver } from 'react-hook-form'
import { z } from 'zod'
import { useCreateBreedingEntry } from '@/lib/hooks/useDailyOps'
import { useFlock } from '@/lib/hooks/useFlock'
import { useItems, useWarehouses } from '@/lib/hooks/useInventory'
import { Button } from '@/components/ui/Button'
import type { FlockDetail, Item, PoultryFeedBatch, Warehouse as WarehouseType } from '@/lib/types'

interface BreedingEntryFormProps {
  flockId: number
  onSuccess: () => void
  onCancel: () => void
}

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

const breedingEntrySchema = z.object({
  mortality: z.coerce.number().int('يجب أن يكون عدداً صحيحاً').min(0, 'النافق لا يمكن أن يكون سالباً').default(0),
  weight_sample_avg: optionalNumber,
  uniformity_pct: optionalNumber.refine((value) => value === undefined || value <= 100, 'نسبة التجانس يجب ألا تتجاوز 100%'),
  ai_observation: z.string().optional(),
  feed_batches: z.array(feedBatchSchema).min(1, 'أضف دفعة علف واحدة على الأقل'),
})

type BreedingEntryValues = z.infer<typeof breedingEntrySchema>

const fieldBase =
  'h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none transition-colors focus:border-[#c2410c] focus:ring-2 focus:ring-[#c2410c]/20 disabled:opacity-60'

function unwrapData<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[]
  if (value && typeof value === 'object' && Array.isArray((value as { data?: unknown }).data)) {
    return (value as { data: T[] }).data
  }
  return []
}

function warehouseName(warehouses: WarehouseType[], warehouseId?: number | null) {
  if (!warehouseId) return 'غير محدد'
  return warehouses.find((warehouse) => warehouse.id === warehouseId)?.name ?? `#${warehouseId}`
}

function buildFeedPayload(feedBatches: BreedingEntryValues['feed_batches'], items: Item[]): PoultryFeedBatch[] {
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

export default function BreedingEntryForm({ flockId, onSuccess, onCancel }: BreedingEntryFormProps) {
  const createEntry = useCreateBreedingEntry(flockId)
  const { data: flockData } = useFlock(flockId)
  const { data: warehousesData, isLoading: isLoadingWarehouses } = useWarehouses(1, 200)
  const { data: itemsData, isLoading: isLoadingItems } = useItems(1, 300, true)

  const flock = flockData?.data as FlockDetail | undefined
  const warehouses = unwrapData<WarehouseType>(warehousesData)
  const items = unwrapData<Item>(itemsData)
  const defaultFeedWarehouseId = flock?.barn?.section?.feed_warehouse_id ?? null

  const feedItems = useMemo(() => {
    const filtered = items.filter((item) => {
      const descriptor = `${item.name ?? ''} ${item.category ?? ''}`.toLowerCase()
      return descriptor.includes('feed') || descriptor.includes('علف') || descriptor.includes('أعلاف')
    })
    return filtered.length > 0 ? filtered : items
  }, [items])

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BreedingEntryValues>({
    resolver: zodResolver(breedingEntrySchema) as Resolver<BreedingEntryValues>,
    defaultValues: {
      mortality: 0,
      weight_sample_avg: undefined,
      uniformity_pct: undefined,
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
    },
  })

  const feedArray = useFieldArray({ control, name: 'feed_batches' })
  const watchedFeedBatches = watch('feed_batches')
  const totalFeedTon = watchedFeedBatches.reduce((total, row) => total + (Number(row.quantity_ton) || 0), 0)
  const totalFeedKg = Number((totalFeedTon * 1000).toFixed(2))
  const totalFeedCost = watchedFeedBatches.reduce(
    (total, row) => total + (Number(row.quantity_ton) || 0) * (Number(row.price_per_ton) || 0),
    0
  )

  const onSubmit = (values: BreedingEntryValues) => {
    const feedBatches = buildFeedPayload(values.feed_batches, items)
    const firstFeedBatch = feedBatches[0]
    const feedSummary = feedBatches
      .map((row) => `${row.log_time ?? 'بدون وقت'} / ${row.feed_type || 'علف'} / ${row.quantity_ton} طن / ${row.price_per_ton ?? 0} ريال`)
      .join(' | ')

    createEntry.mutate({
      mortality: values.mortality,
      weight_sample_avg: values.weight_sample_avg,
      uniformity_pct: values.uniformity_pct,
      feed_quantity_kg: totalFeedKg,
      feed_batches: feedBatches,
      feed_rows: feedBatches,
      warehouse_id: firstFeedBatch?.warehouse_id ?? defaultFeedWarehouseId ?? undefined,
      feed_warehouse_id: firstFeedBatch?.warehouse_id ?? defaultFeedWarehouseId ?? undefined,
      item_id: firstFeedBatch?.item_id ?? undefined,
      inventory_item_id: firstFeedBatch?.item_id ?? undefined,
      ai_observation: [values.ai_observation, feedSummary ? `دفعات العلف: ${feedSummary}` : ''].filter(Boolean).join('\n') || undefined,
    }, { onSuccess })
  }

  const apiErrors = (createEntry.error as { errors?: Record<string, string[]>; message?: string } | null)?.errors
  const isBusy = createEntry.isPending || isLoadingWarehouses || isLoadingItems

  return (
    <form onSubmit={handleSubmit(onSubmit)} dir="rtl" className="space-y-5 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      {createEntry.error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">
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

      <section className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 md:grid-cols-3">
        <FormField label="النافق اليومي" error={errors.mortality?.message}>
          <input type="number" min="0" disabled={isBusy} className={fieldBase} {...register('mortality')} />
        </FormField>
        <FormField label="متوسط وزن العينة (جم)" error={errors.weight_sample_avg?.message}>
          <input type="number" min="0" step="0.01" disabled={isBusy} className={fieldBase} placeholder="اختياري" {...register('weight_sample_avg')} />
        </FormField>
        <FormField label="نسبة التجانس %" error={errors.uniformity_pct?.message}>
          <input type="number" min="0" max="100" step="0.01" disabled={isBusy} className={fieldBase} placeholder="اختياري" {...register('uniformity_pct')} />
        </FormField>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-100 bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-950">دفعات العلف اليومية</h3>
            <p className="text-xs font-semibold text-slate-500">سجل أكثر من دفعة علف بنفس اليوم مع الوقت والكمية والتكلفة.</p>
          </div>
          <Button
            type="button"
            onClick={() => feedArray.append({ log_time: '', quantity_ton: 0, price_per_ton: 0, warehouse_id: undefined, item_id: 0 })}
            leftIcon={<CirclePlus className="h-4 w-4" />}
          >
            إضافة دفعة
          </Button>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-900">
            <Warehouse className="h-4 w-4" />
            مستودع العلف الافتراضي: {warehouseName(warehouses, defaultFeedWarehouseId)}
          </div>
        </div>

        <div className="space-y-3">
          {feedArray.fields.map((field, index) => (
            <div key={field.id} className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 lg:grid-cols-[120px_minmax(180px,1fr)_130px_130px_minmax(180px,1fr)_44px]">
              <FormField label="الوقت" error={errors.feed_batches?.[index]?.log_time?.message}>
                <input type="time" disabled={isBusy} className={fieldBase} {...register(`feed_batches.${index}.log_time`)} />
              </FormField>
              <FormField label="صنف المخزون" error={errors.feed_batches?.[index]?.item_id?.message}>
                <select disabled={isBusy} className={fieldBase} {...register(`feed_batches.${index}.item_id`)}>
                  <option value="">اختر الصنف</option>
                  {feedItems.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="الكمية طن" error={errors.feed_batches?.[index]?.quantity_ton?.message}>
                <input type="number" min="0" step="0.001" disabled={isBusy} className={`${fieldBase} text-left font-mono`} {...register(`feed_batches.${index}.quantity_ton`)} />
              </FormField>
              <FormField label="السعر/طن" error={errors.feed_batches?.[index]?.price_per_ton?.message}>
                <input type="number" min="0" step="0.01" disabled={isBusy} className={`${fieldBase} text-left font-mono`} {...register(`feed_batches.${index}.price_per_ton`)} />
              </FormField>
              <FormField label="مستودع العلف" error={errors.feed_batches?.[index]?.warehouse_id?.message}>
                <select disabled={isBusy} className={fieldBase} {...register(`feed_batches.${index}.warehouse_id`)}>
                  <option value="">استخدام الافتراضي: {warehouseName(warehouses, defaultFeedWarehouseId)}</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                  ))}
                </select>
              </FormField>
              <Button
                type="button"
                onClick={() => feedArray.fields.length > 1 && feedArray.remove(index)}
                disabled={isBusy || feedArray.fields.length === 1}
                variant="danger"
                size="icon"
                className="mt-6"
                aria-label="حذف دفعة العلف"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-3">
          <ReadOnlyMetric label="إجمالي العلف بالطن" value={totalFeedTon.toLocaleString('ar-EG', { maximumFractionDigits: 3 })} />
          <ReadOnlyMetric label="إجمالي العلف بالكجم" value={totalFeedKg.toLocaleString('ar-EG', { maximumFractionDigits: 2 })} />
          <ReadOnlyMetric label="إجمالي تكلفة العلف" value={totalFeedCost.toLocaleString('ar-EG', { maximumFractionDigits: 2 })} />
        </div>
      </section>

      <FormField label="ملاحظات تشغيلية" error={errors.ai_observation?.message}>
        <textarea
          rows={3}
          disabled={isBusy}
          className="w-full resize-none rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition-colors focus:border-[#c2410c] focus:ring-2 focus:ring-[#c2410c]/20 disabled:opacity-60"
          placeholder="ملاحظات اختيارية..."
          {...register('ai_observation')}
        />
      </FormField>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
        <Button
          type="button"
          onClick={onCancel}
          disabled={isBusy}
          variant="outline"
        >
          إلغاء
        </Button>
        <Button
          type="submit"
          disabled={isBusy}
          isLoading={createEntry.isPending}
          loadingText="حفظ تسجيل التربية"
        >
          حفظ تسجيل التربية
        </Button>
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
