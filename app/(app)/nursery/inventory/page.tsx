'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import {
  AlertTriangle,
  Boxes,
  Building2,
  Edit3,
  Layers3,
  Loader2,
  MapPinned,
  Package2,
  Plus,
  Save,
  Trash2,
  WalletCards,
  Warehouse,
} from 'lucide-react'
import AppDialog from '@/components/ui/AppDialog'
import {
  useCreateNurseryInventoryCategory,
  useCreateNurseryInventoryItem,
  useCreateNurseryInventoryLocation,
  useDeleteNurseryInventoryCategory,
  useDeleteNurseryInventoryItem,
  useDeleteNurseryInventoryLocation,
  useNurseryInventoryBootstrap,
  useStoreNurseryOpeningBalances,
  useUpdateNurseryInventoryCategory,
  useUpdateNurseryInventoryItem,
  useUpdateNurseryInventoryLocation,
} from '@/lib/hooks/useNurseryInventory'
import type {
  ApiError,
  NurseryInventoryBootstrap,
  NurseryInventoryCategoryPayload,
  NurseryInventoryItem,
  NurseryInventoryItemPayload,
  NurseryInventoryLocationPayload,
  NurseryInventoryTreeNode,
} from '@/lib/types'

type InventoryTab = 'items' | 'categories' | 'locations'
type MasterEntityType = 'category' | 'location'

const inventoryItemSchema = z.object({
  name: z.string().trim().min(1, 'اسم الصنف مطلوب'),
  category_id: z.number().nullable(),
  location_id: z.number().nullable(),
  quantity: z.coerce.number().min(0, 'الكمية الحالية يجب أن تكون 0 أو أكثر'),
  unit: z.string().trim().min(1, 'الوحدة مطلوبة'),
  min_quantity: z.coerce.number().min(0, 'الحد الأدنى يجب أن يكون 0 أو أكثر'),
  item_value: z.coerce.number().min(0, 'القيمة الافتراضية يجب أن تكون 0 أو أكثر'),
  opening_balance_date: z.string().nullable(),
})

const masterSchema = z.object({
  name: z.string().trim().min(1, 'الاسم مطلوب'),
  parent_id: z.number().nullable(),
  description: z.string().trim().max(1000, 'الوصف طويل جداً').optional(),
})

const openingBalancesSchema = z.object({
  items: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      unit: z.string(),
      quantity: z.coerce.number().min(0, 'الكمية يجب أن تكون 0 أو أكثر'),
      opening_balance_date: z.string().optional(),
    })
  ),
})

type InventoryItemFormValues = z.infer<typeof inventoryItemSchema>
type MasterFormValues = z.infer<typeof masterSchema>
type OpeningBalancesFormValues = z.infer<typeof openingBalancesSchema>
type InventoryItemFormInput = z.input<typeof inventoryItemSchema>
type MasterFormInput = z.input<typeof masterSchema>
type OpeningBalancesFormInput = z.input<typeof openingBalancesSchema>

const tabs: Array<{ id: InventoryTab; label: string; icon: typeof Boxes }> = [
  { id: 'items', label: 'الـمـخـزون', icon: Boxes },
  { id: 'categories', label: 'الـفـئـات', icon: Layers3 },
  { id: 'locations', label: 'الـمـسـتـودعـات', icon: Warehouse },
]

function formatNumber(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat('ar-SA', {
    maximumFractionDigits,
    minimumFractionDigits: maximumFractionDigits === 0 ? 0 : value % 1 === 0 ? 0 : 2,
  }).format(value)
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    maximumFractionDigits: 2,
  }).format(value)
}

function getErrorMessage(error: unknown) {
  const fallback = 'حدث خطأ غير متوقع أثناء تنفيذ العملية.'
  if (!error || typeof error !== 'object') return fallback

  const apiError = error as ApiError
  if (typeof apiError.message === 'string' && apiError.message.trim()) return apiError.message

  if (apiError.errors) {
    const firstFieldErrors = Object.values(apiError.errors)[0]
    if (firstFieldErrors && firstFieldErrors[0]) return firstFieldErrors[0]
  }

  return fallback
}

function flattenTree(nodes: NurseryInventoryTreeNode[]): NurseryInventoryTreeNode[] {
  return nodes.flatMap((node) => [node, ...flattenTree(node.children)])
}

function findNodePath(
  nodes: NurseryInventoryTreeNode[],
  targetId: number | null | undefined,
  currentPath: NurseryInventoryTreeNode[] = []
): NurseryInventoryTreeNode[] {
  if (!targetId) return []

  for (const node of nodes) {
    const nextPath = [...currentPath, node]
    if (node.id === targetId) return nextPath
    const childPath = findNodePath(node.children, targetId, nextPath)
    if (childPath.length > 0) return childPath
  }

  return []
}

function describeNodePath(nodes: NurseryInventoryTreeNode[], targetId: number | null | undefined) {
  const path = findNodePath(nodes, targetId)
  if (path.length === 0) return 'غير محدد'
  return path.map((node) => node.name).join(' / ')
}

function buildItemDefaults(item?: NurseryInventoryItem | null): InventoryItemFormValues {
  return {
    name: item?.name ?? '',
    category_id: item?.category_id ?? null,
    location_id: item?.location_id ?? null,
    quantity: item ? Number(item.quantity) : 0,
    unit: item?.unit ?? '',
    min_quantity: item ? Number(item.min_quantity) : 0,
    item_value: item ? Number(item.item_value) : 0,
    opening_balance_date: item?.opening_balance_date ?? null,
  }
}

function buildMasterDefaults(node?: NurseryInventoryTreeNode | null): MasterFormValues {
  return {
    name: node?.name ?? '',
    parent_id: node?.parent_id ?? null,
    description: node?.description ?? '',
  }
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-2 block text-sm font-semibold text-ink-soft">{children}</label>
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Boxes
  title: string
  description: string
}) {
  return (
    <div className="rounded-3xl border border-dashed border-line bg-surface p-10 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-subtle text-ink-muted">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="mt-5 text-lg font-bold text-ink">{title}</h3>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-ink-soft">{description}</p>
    </div>
  )
}

function InventorySkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-32 animate-skeleton-shimmer rounded-3xl" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <div className="h-[520px] animate-skeleton-shimmer rounded-3xl" />
        <div className="h-[520px] animate-skeleton-shimmer rounded-3xl" />
      </div>
    </div>
  )
}

function TabButton({
  tab,
  activeTab,
  onClick,
}: {
  tab: (typeof tabs)[number]
  activeTab: InventoryTab
  onClick: (tab: InventoryTab) => void
}) {
  const Icon = tab.icon
  const isActive = activeTab === tab.id

  return (
    <button
      type="button"
      onClick={() => onClick(tab.id)}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold active:scale-[0.98] transition-all ${
        isActive
          ? 'border-action-primary bg-action-primary text-white shadow-[0_16px_30px_rgba(194,65,12,0.18)]'
          : 'border-line bg-surface text-ink-soft hover:border-line-strong hover:text-ink'
      }`}
    >
      <Icon className="h-4 w-4" />
      {tab.label}
    </button>
  )
}

function SummaryCard({
  icon: Icon,
  title,
  value,
  tone,
  helper,
}: {
  icon: typeof Boxes
  title: string
  value: string
  tone: 'clay' | 'emerald' | 'amber' | 'slate'
  helper: string
}) {
  const toneClass =
    tone === 'clay'
      ? 'bg-[rgba(194,65,12,0.08)] text-action-primary'
      : tone === 'emerald'
        ? 'bg-emerald-100 text-emerald-700'
        : tone === 'amber'
          ? 'bg-amber-50 text-amber-700'
          : 'bg-surface-subtle text-ink-soft'

  return (
    <article className="rounded-3xl border border-line bg-surface p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-wide text-ink-muted">{title}</p>
          <p className="mt-3 text-2xl font-bold text-ink">{value}</p>
          <p className="mt-2 text-sm text-ink-soft">{helper}</p>
        </div>
        <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </article>
  )
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  tone = 'primary',
}: {
  icon: typeof Plus
  label: string
  onClick: () => void
  tone?: 'primary' | 'secondary'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold active:scale-[0.98] transition-all ${
        tone === 'primary'
          ? 'bg-action-primary text-white hover:bg-action-primary-hover'
          : 'border border-line bg-surface text-ink-soft hover:border-line-strong hover:text-ink'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  )
}

function TreeSelectorField({
  tree,
  value,
  onChange,
  label,
  placeholder,
  helper,
  error,
}: {
  tree: NurseryInventoryTreeNode[]
  value: number | null
  onChange: (value: number | null) => void
  label: string
  placeholder: string
  helper: string
  error?: string
}) {
  const selectedPath = useMemo(() => findNodePath(tree, value), [tree, value])

  const levels = useMemo(() => {
    const result: NurseryInventoryTreeNode[][] = [tree]
    selectedPath.forEach((node) => {
      if (node.children.length > 0) result.push(node.children)
    })
    return result
  }, [selectedPath, tree])

  const selectedIds = selectedPath.map((node) => node.id)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <FieldLabel>{label}</FieldLabel>
        {value ? (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs font-semibold text-action-primary active:scale-[0.98] transition-all hover:text-action-primary-hover"
          >
            مسح التحديد
          </button>
        ) : null}
      </div>

      <div className="space-y-3 rounded-2xl border border-line bg-surface-subtle p-4">
        {levels.map((options, levelIndex) => (
          <select
            key={`${label}-${levelIndex}`}
            value={selectedIds[levelIndex] ?? ''}
            onChange={(event) => {
              const nextValue = event.target.value ? Number(event.target.value) : null
              onChange(nextValue)
            }}
            className={`h-12 w-full rounded-2xl border bg-surface px-4 text-sm text-ink outline-none focus:ring-2 focus:ring-action-primary/20 ${
              error ? 'border-red-600' : 'border-line'
            }`}
          >
            <option value="">{levelIndex === 0 ? placeholder : 'اختر مستوى فرعي...'}</option>
            {options.map((node) => (
              <option key={node.id} value={node.id}>
                {node.name}
              </option>
            ))}
          </select>
        ))}

        <div className="rounded-2xl border border-line bg-surface px-4 py-3">
          <p className="text-xs font-semibold text-ink-muted">{helper}</p>
          <p className="mt-1 text-sm font-semibold text-ink">{describeNodePath(tree, value)}</p>
        </div>
      </div>

      {error ? <p className="text-xs font-semibold text-red-600">{error}</p> : null}
    </div>
  )
}

function ItemModal({
  open,
  onClose,
  categories,
  locations,
  item,
  onSubmit,
  isPending,
}: {
  open: boolean
  onClose: () => void
  categories: NurseryInventoryTreeNode[]
  locations: NurseryInventoryTreeNode[]
  item?: NurseryInventoryItem | null
  onSubmit: (payload: NurseryInventoryItemPayload) => Promise<void>
  isPending: boolean
}) {
  const itemForm = useForm<InventoryItemFormInput, undefined, InventoryItemFormValues>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: buildItemDefaults(item),
  })
  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = itemForm
  useEffect(() => {
    if (open) reset(buildItemDefaults(item))
  }, [item, open, reset])

  const categoryId = useWatch({ control, name: 'category_id' })
  const locationId = useWatch({ control, name: 'location_id' })

  const [submitError, setSubmitError] = useState('')

  const submit = handleSubmit(async (values) => {
    try {
      setSubmitError('')
      await onSubmit({
        name: values.name,
        category_id: values.category_id,
        location_id: values.location_id,
        quantity: values.quantity,
        unit: values.unit,
        min_quantity: values.min_quantity,
        item_value: values.item_value,
        opening_balance_date: values.opening_balance_date || null,
      })
      onClose()
    } catch (error) {
      setSubmitError(getErrorMessage(error))
    }
  })

  return (
    <AppDialog open={open} onClose={onClose} panelClassName="max-w-4xl">
      <div className="rounded-[2rem] border border-line bg-surface shadow-2xl" dir="rtl">
        <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-ink">
              {item ? 'تعديل صنف المخزون' : 'إضافة صنف جديد'}
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              اربط الصنف بفئة وموقع فعليين داخل مخزون المشتل المعزول.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-line bg-surface-subtle px-3 py-2 text-sm font-semibold text-ink-soft active:scale-[0.98] transition-all hover:text-ink"
          >
            إغلاق
          </button>
        </div>

        <form onSubmit={submit} className="space-y-6 px-6 py-6">
          {submitError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          ) : null}

          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <FieldLabel>اسم الصنف</FieldLabel>
              <input
                {...register('name')}
                placeholder="مثال: مركن مقاس 30 سم"
                className={`h-12 w-full rounded-2xl border bg-surface-muted px-4 text-sm outline-none focus:ring-2 focus:ring-action-primary/20 ${
                  errors.name ? 'border-red-600' : 'border-line'
                }`}
              />
              {errors.name ? (
                <p className="mt-2 text-xs font-semibold text-red-600">{errors.name.message}</p>
              ) : null}
            </div>

            <div>
              <FieldLabel>الوحدة</FieldLabel>
              <input
                {...register('unit')}
                placeholder="مثال: حبة، كيس، لتر"
                className={`h-12 w-full rounded-2xl border bg-surface-muted px-4 text-sm outline-none focus:ring-2 focus:ring-action-primary/20 ${
                  errors.unit ? 'border-red-600' : 'border-line'
                }`}
              />
              {errors.unit ? (
                <p className="mt-2 text-xs font-semibold text-red-600">{errors.unit.message}</p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <TreeSelectorField
              tree={categories}
              value={categoryId}
              onChange={(value) => setValue('category_id', value, { shouldValidate: true })}
              label="الفئة"
              placeholder="اختر الفئة الرئيسية..."
              helper="يمكنك اختيار فئة رئيسية أو مستوى فرعي نهائي."
              error={errors.category_id?.message}
            />

            <TreeSelectorField
              tree={locations}
              value={locationId}
              onChange={(value) => setValue('location_id', value, { shouldValidate: true })}
              label="الموقع / المستودع"
              placeholder="اختر المستودع الرئيسي..."
              helper="التحديد يعمل بشكل متدرج حتى آخر قسم تخزيني."
              error={errors.location_id?.message}
            />
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <FieldLabel>الكمية الحالي</FieldLabel>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register('quantity')}
                className={`h-12 w-full rounded-2xl border bg-surface-muted px-4 text-sm outline-none focus:ring-2 focus:ring-action-primary/20 ${
                  errors.quantity ? 'border-red-600' : 'border-line'
                }`}
              />
              {errors.quantity ? (
                <p className="mt-2 text-xs font-semibold text-red-600">
                  {errors.quantity.message}
                </p>
              ) : null}
            </div>

            <div>
              <FieldLabel>الحد الأدنى</FieldLabel>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register('min_quantity')}
                className={`h-12 w-full rounded-2xl border bg-surface-muted px-4 text-sm outline-none focus:ring-2 focus:ring-action-primary/20 ${
                  errors.min_quantity ? 'border-red-600' : 'border-line'
                }`}
              />
              {errors.min_quantity ? (
                <p className="mt-2 text-xs font-semibold text-red-600">
                  {errors.min_quantity.message}
                </p>
              ) : null}
            </div>

            <div>
              <FieldLabel>القيمة الافتراضية للصنف</FieldLabel>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register('item_value')}
                className={`h-12 w-full rounded-2xl border bg-surface-muted px-4 text-sm outline-none focus:ring-2 focus:ring-action-primary/20 ${
                  errors.item_value ? 'border-red-600' : 'border-line'
                }`}
              />
              {errors.item_value ? (
                <p className="mt-2 text-xs font-semibold text-red-600">
                  {errors.item_value.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="max-w-sm">
            <FieldLabel>تاريخ الرصيد الافتتاحي</FieldLabel>
            <input
              type="date"
              {...register('opening_balance_date')}
              className="h-12 w-full rounded-2xl border border-line bg-surface-muted px-4 text-sm outline-none focus:ring-2 focus:ring-action-primary/20"
            />
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-line pt-4">
            <ActionButton icon={Save} label={item ? 'حفظ التعديلات' : 'إضافة الصنف'} onClick={submit} />
            <ActionButton icon={Plus} label="إلغاء" onClick={onClose} tone="secondary" />
            {isPending ? (
              <span className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-line bg-surface-subtle px-4 text-sm text-ink-soft">
                <Loader2 className="h-4 w-4 animate-spin" />
                جاري الحفظ...
              </span>
            ) : null}
          </div>
        </form>
      </div>
    </AppDialog>
  )
}

function MasterModal({
  open,
  onClose,
  type,
  tree,
  node,
  onSubmit,
  isPending,
}: {
  open: boolean
  onClose: () => void
  type: MasterEntityType
  tree: NurseryInventoryTreeNode[]
  node?: NurseryInventoryTreeNode | null
  onSubmit: (payload: NurseryInventoryCategoryPayload | NurseryInventoryLocationPayload) => Promise<void>
  isPending: boolean
}) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<MasterFormInput, undefined, MasterFormValues>({
    resolver: zodResolver(masterSchema),
    defaultValues: buildMasterDefaults(node),
  })

  useEffect(() => {
    if (open) reset(buildMasterDefaults(node))
  }, [node, open, reset])

  const parentId = useWatch({ control, name: 'parent_id' })
  const [submitError, setSubmitError] = useState('')

  const entityLabel = type === 'category' ? 'الفئة' : 'المستودع'
  const submit = handleSubmit(async (values) => {
    try {
      setSubmitError('')
      await onSubmit({
        name: values.name,
        parent_id: values.parent_id,
        description: values.description?.trim() || '',
      })
      onClose()
    } catch (error) {
      setSubmitError(getErrorMessage(error))
    }
  })

  return (
    <AppDialog open={open} onClose={onClose} panelClassName="max-w-3xl">
      <div className="rounded-[2rem] border border-line bg-surface shadow-2xl" dir="rtl">
        <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-ink">
              {node ? `تعديل ${entityLabel}` : `إضافة ${entityLabel} جديدة`}
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              {type === 'category'
                ? 'استخدم البنية المتداخلة لتقسيم أصناف المشتل بدقة.'
                : 'أنشئ مستودعات فرعية مستقلة للصوبات والثلاجات وأقسام التخزين.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-line bg-surface-subtle px-3 py-2 text-sm font-semibold text-ink-soft active:scale-[0.98] transition-all hover:text-ink"
          >
            إغلاق
          </button>
        </div>

        <form onSubmit={submit} className="space-y-6 px-6 py-6">
          {submitError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          ) : null}

          <div>
            <FieldLabel>الاسم</FieldLabel>
            <input
              {...register('name')}
              placeholder={type === 'category' ? 'مثال: مراكن' : 'مثال: مستودع الصوبة الرئيسية'}
              className={`h-12 w-full rounded-2xl border bg-surface-muted px-4 text-sm outline-none focus:ring-2 focus:ring-action-primary/20 ${
                errors.name ? 'border-red-600' : 'border-line'
              }`}
            />
            {errors.name ? (
              <p className="mt-2 text-xs font-semibold text-red-600">{errors.name.message}</p>
            ) : null}
          </div>

          <TreeSelectorField
            tree={tree}
            value={parentId}
            onChange={(value) => setValue('parent_id', value, { shouldValidate: true })}
            label={type === 'category' ? 'الفئة الأم' : 'الموقع الأم'}
            placeholder={type === 'category' ? 'بدون فئة أم' : 'بدون موقع أم'}
            helper={
              type === 'category'
                ? 'اترك الحقل فارغاً لإنشاء فئة رئيسية.'
                : 'اترك الحقل فارغاً لإنشاء مستودع رئيسي.'
            }
            error={errors.parent_id?.message}
          />

          <div>
            <FieldLabel>الوصف</FieldLabel>
            <textarea
              {...register('description')}
              rows={4}
              placeholder="ملاحظات تشغيلية، نوع المحتوى، أو تعليمات استخدام..."
              className="w-full rounded-2xl border border-line bg-surface-muted px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-action-primary/20"
            />
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-line pt-4">
            <ActionButton
              icon={Save}
              label={node ? 'حفظ التعديلات' : `إضافة ${entityLabel}`}
              onClick={submit}
            />
            <ActionButton icon={Plus} label="إلغاء" onClick={onClose} tone="secondary" />
            {isPending ? (
              <span className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-line bg-surface-subtle px-4 text-sm text-ink-soft">
                <Loader2 className="h-4 w-4 animate-spin" />
                جاري الحفظ...
              </span>
            ) : null}
          </div>
        </form>
      </div>
    </AppDialog>
  )
}

function OpeningBalancesDialog({
  open,
  onClose,
  items,
  onSubmit,
  isPending,
}: {
  open: boolean
  onClose: () => void
  items: NurseryInventoryItem[]
  onSubmit: (payload: { items: Array<{ id: number; quantity: number; opening_balance_date?: string | null }> }) => Promise<void>
  isPending: boolean
}) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OpeningBalancesFormInput, undefined, OpeningBalancesFormValues>({
    resolver: zodResolver(openingBalancesSchema),
    defaultValues: {
      items: [],
    },
  })

  const { fields } = useFieldArray({
    control,
    name: 'items',
  })

  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (!open) return
    reset({
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        unit: item.unit,
        quantity: Number(item.quantity),
        opening_balance_date: item.opening_balance_date ?? '',
      })),
    })
  }, [items, open, reset])

  const submit = handleSubmit(async (values) => {
    try {
      setSubmitError('')
      await onSubmit({
          items: values.items.map((item: OpeningBalancesFormValues['items'][number]) => ({
          id: item.id,
          quantity: item.quantity,
            opening_balance_date: item.opening_balance_date || null,
        })),
      })
      onClose()
    } catch (error) {
      setSubmitError(getErrorMessage(error))
    }
  })

  return (
    <AppDialog open={open} onClose={onClose} panelClassName="max-w-6xl">
      <div className="rounded-[2rem] border border-line bg-surface shadow-2xl" dir="rtl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-ink">لوحة ضخ الأرصدة الافتتاحية</h2>
            <p className="mt-1 text-sm text-ink-soft">
              حدّث تواريخ الأرصدة وكمياتها دفعة واحدة مع حفظ المعاملة في التزام واحد.
            </p>
          </div>
          <div className="flex gap-3">
            <ActionButton icon={Save} label="حفظ دفعة الأرصدة" onClick={submit} />
            <ActionButton icon={Plus} label="إغلاق" onClick={onClose} tone="secondary" />
          </div>
        </div>

        <div className="space-y-4 px-6 py-6">
          {submitError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          ) : null}

          {fields.length === 0 ? (
            <EmptyState
              icon={WalletCards}
              title="لا توجد أصناف قابلة للترصيد"
              description="أضف أصناف مخزون أولاً، ثم استخدم هذه اللوحة لضبط الرصيد الافتتاحي وتاريخه."
            />
          ) : (
            <form onSubmit={submit} className="overflow-hidden rounded-3xl border border-line">
              <div className="hidden grid-cols-[2.2fr_1fr_1fr] gap-4 border-b border-line bg-surface-subtle px-5 py-4 text-sm font-semibold text-ink-soft md:grid">
                <span>الصنف</span>
                <span>الكمية الافتتاحية</span>
                <span>تاريخ الرصيد</span>
              </div>

              <div className="max-h-[60vh] overflow-y-auto divide-y divide-line">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid gap-4 bg-surface px-5 py-4 md:grid-cols-[2.2fr_1fr_1fr]">
                    <div>
                      <p className="text-sm font-semibold text-ink">{field.name}</p>
                      <p className="mt-1 text-xs text-ink-muted">{field.unit}</p>
                    </div>

                    <div>
                      <FieldLabel>الكمية</FieldLabel>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        {...register(`items.${index}.quantity`)}
                        className={`h-11 w-full rounded-2xl border bg-surface-muted px-4 text-sm outline-none focus:ring-2 focus:ring-action-primary/20 ${
                          errors.items?.[index]?.quantity ? 'border-red-600' : 'border-line'
                        }`}
                      />
                      {errors.items?.[index]?.quantity ? (
                        <p className="mt-2 text-xs font-semibold text-red-600">
                          {errors.items[index]?.quantity?.message}
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <FieldLabel>التاريخ</FieldLabel>
                      <input
                        type="date"
                        {...register(`items.${index}.opening_balance_date`)}
                        className="h-11 w-full rounded-2xl border border-line bg-surface-muted px-4 text-sm outline-none focus:ring-2 focus:ring-action-primary/20"
                      />
                      <input type="hidden" {...register(`items.${index}.id`)} />
                      <input type="hidden" {...register(`items.${index}.name`)} />
                      <input type="hidden" {...register(`items.${index}.unit`)} />
                    </div>
                  </div>
                ))}
              </div>
            </form>
          )}

          {isPending ? (
            <div className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-line bg-surface-subtle px-4 text-sm text-ink-soft">
              <Loader2 className="h-4 w-4 animate-spin" />
              جاري ترحيل الأرصدة الافتتاحية...
            </div>
          ) : null}
        </div>
      </div>
    </AppDialog>
  )
}

function TreeNodeRow({
  node,
  depth,
  onEdit,
  onDelete,
}: {
  node: NurseryInventoryTreeNode
  depth: number
  onEdit: (node: NurseryInventoryTreeNode) => void
  onDelete: (node: NurseryInventoryTreeNode) => void
}) {
  return (
    <div className="space-y-3">
      <div
        className="rounded-2xl border border-line bg-surface px-4 py-4 shadow-sm"
        style={{ marginRight: `${depth * 18}px` }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-surface-subtle px-2.5 py-1 text-xs font-semibold text-ink-muted">
                مستوى {depth + 1}
              </span>
              <h3 className="text-sm font-bold text-ink">{node.name}</h3>
            </div>
            {node.description ? (
              <p className="mt-2 text-sm leading-6 text-ink-soft">{node.description}</p>
            ) : (
              <p className="mt-2 text-sm text-ink-muted">لا يوجد وصف مسجل لهذا المستوى.</p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onEdit(node)}
              className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-line bg-surface-subtle px-3 py-2 text-sm font-semibold text-ink-soft active:scale-[0.98] transition-all hover:text-ink"
            >
              <Edit3 className="h-4 w-4" />
              تعديل
            </button>
            <button
              type="button"
              onClick={() => onDelete(node)}
              className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 active:scale-[0.98] transition-all hover:bg-red-100"
            >
              <Trash2 className="h-4 w-4" />
              حذف
            </button>
          </div>
        </div>
      </div>

      {node.children.map((child) => (
        <TreeNodeRow
          key={child.id}
          node={child}
          depth={depth + 1}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}

function ItemsTab({
  data,
  onCreateItem,
  onEditItem,
  onDeleteItem,
  onOpeningBalances,
}: {
  data: NurseryInventoryBootstrap
  onCreateItem: () => void
  onEditItem: (item: NurseryInventoryItem) => void
  onDeleteItem: (item: NurseryInventoryItem) => void
  onOpeningBalances: () => void
}) {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-4">
        <SummaryCard
          icon={WalletCards}
          title="إجمالي قيمة المخزون الحالي"
          value={formatCurrency(data.summary.grand_total_value)}
          helper="القيمة الإجمالية لكامل مخزون المشتل المعزول."
          tone="clay"
        />
        <SummaryCard
          icon={Package2}
          title="عدد الأصناف النشطة"
          value={formatNumber(data.summary.items_count, 0)}
          helper="الأصناف المقيدة داخل دفتر مخزون المشتل."
          tone="slate"
        />
        <SummaryCard
          icon={AlertTriangle}
          title="أصناف تحت الحد الأدنى"
          value={formatNumber(data.summary.low_stock_count, 0)}
          helper="يتم وسمها تلقائياً فور وصول الرصيد للحد الأدنى أو أقل."
          tone="amber"
        />
        <SummaryCard
          icon={Layers3}
          title="إجمالي الكمية الفعلية"
          value={formatNumber(data.summary.total_quantity, 2)}
          helper="مجموع الكميات الحالية عبر كل الوحدات المخزنية."
          tone="emerald"
        />
      </section>

      <section className="rounded-[2rem] border border-line bg-surface p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-ink">دفتر الأصناف النشطة</h2>
            <p className="mt-1 text-sm text-ink-soft">
              كل صنف هنا مرتبط بفئة مستقلة وموقع تخزين مستقل عن ERP العام.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ActionButton icon={WalletCards} label="الأرصدة الافتتاحية" onClick={onOpeningBalances} tone="secondary" />
            <ActionButton icon={Plus} label="إضافة صنف" onClick={onCreateItem} />
          </div>
        </div>
      </section>

      {data.items_grouped_by_category.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="لا توجد أصناف في مخزون المشتل"
          description="أضف أول صنف لمراكن أو أسمدة أو تربة ومحسنات زراعية لبدء تشغيل الوحدة."
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <div className="space-y-5">
            {data.items_grouped_by_category.map((group) => (
              <section
                key={group.category_id ?? group.category_name}
                className="rounded-[2rem] border border-line bg-surface p-5 shadow-sm"
              >
                <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-ink">{group.category_name}</h3>
                    <p className="mt-1 text-sm text-ink-soft">
                      {formatNumber(group.items.length, 0)} أصناف، بقيمة {formatCurrency(group.total_value)}
                    </p>
                  </div>
                  <span className="rounded-2xl bg-surface-subtle px-3 py-2 text-sm font-semibold text-ink-soft">
                    رأس فئة محلي
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {group.items.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-3xl border border-line bg-surface-subtle p-4 active:scale-[0.98] transition-all hover:border-line-strong"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-base font-bold text-ink">{item.name}</h4>
                          <p className="mt-1 text-sm text-ink-soft">
                            المستودع: {item.location?.name ?? 'غير محدد'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => onEditItem(item)}
                            className="rounded-2xl border border-line bg-surface px-3 py-2 text-xs font-semibold text-ink-soft active:scale-[0.98] transition-all hover:text-ink"
                          >
                            تعديل
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteItem(item)}
                            className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 active:scale-[0.98] transition-all hover:bg-red-100"
                          >
                            حذف
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-line bg-surface px-3 py-3">
                          <p className="text-xs font-semibold text-ink-muted">الكمية الحالية</p>
                          <p className="mt-1 text-lg font-bold text-ink">
                            {formatNumber(item.quantity, 2)} {item.unit}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-line bg-surface px-3 py-3">
                          <p className="text-xs font-semibold text-ink-muted">الحد الأدنى</p>
                          <p className="mt-1 text-lg font-bold text-ink">
                            {formatNumber(item.min_quantity, 2)} {item.unit}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-line bg-surface px-3 py-3">
                          <p className="text-xs font-semibold text-ink-muted">القيمة الفردية</p>
                          <p className="mt-1 text-base font-bold text-ink">
                            {formatCurrency(item.item_value)}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-line bg-surface px-3 py-3">
                          <p className="text-xs font-semibold text-ink-muted">القيمة الإجمالية</p>
                          <p className="mt-1 text-base font-bold text-ink">
                            {formatCurrency(item.total_value)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        {item.low_stock ? (
                          <span className="inline-flex items-center rounded-full border border-amber-100 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                            تنصيب مخزون منخفض
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                            رصيد آمن
                          </span>
                        )}

                        <span className="text-xs font-semibold text-ink-muted">
                          تاريخ الرصيد: {item.opening_balance_date || 'غير محدد'}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <aside className="space-y-5">
            <section className="rounded-[2rem] border border-line bg-surface p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-subtle text-action-primary">
                  <WalletCards className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-ink">تفصيل القيمة حسب الفئات</h3>
                  <p className="mt-1 text-sm text-ink-soft">
                    قراءة سريعة للوزن المالي لكل مجموعة مخزنية.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {data.summary.category_totals.map((category) => (
                  <div
                    key={category.category_id ?? category.category_name}
                    className="rounded-2xl border border-line bg-surface-subtle px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-ink">{category.category_name}</p>
                        <p className="mt-1 text-xs text-ink-muted">
                          {formatNumber(category.items_count, 0)} أصناف
                        </p>
                      </div>
                      <p className="text-sm font-bold text-action-primary">
                        {formatCurrency(category.total_value)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      )}
    </div>
  )
}

function CategoriesTab({
  categories,
  onCreate,
  onEdit,
  onDelete,
}: {
  categories: NurseryInventoryTreeNode[]
  onCreate: () => void
  onEdit: (node: NurseryInventoryTreeNode) => void
  onDelete: (node: NurseryInventoryTreeNode) => void
}) {
  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-line bg-surface p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-ink">دليل الفئات المحلية</h2>
            <p className="mt-1 text-sm text-ink-soft">
              فئات مستقلة لمراكن، أسمدة، تربة، ومحسنات زراعية دون أي ارتباط بمخزون المزرعة العام.
            </p>
          </div>
          <ActionButton icon={Plus} label="إضافة فئة" onClick={onCreate} />
        </div>
      </section>

      {categories.length === 0 ? (
        <EmptyState
          icon={Layers3}
          title="لا توجد فئات مسجلة"
          description="أنشئ أول فئة رئيسية لتجميع أصناف المشتل مثل المراكن أو الأسمدة أو المواد الزراعية."
        />
      ) : (
        <div className="space-y-4">
          {categories.map((node) => (
            <TreeNodeRow key={node.id} node={node} depth={0} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  )
}

function LocationsTab({
  locationCards,
  locations,
  onCreate,
  onEdit,
  onDelete,
}: {
  locationCards: NurseryInventoryBootstrap['location_cards']
  locations: NurseryInventoryTreeNode[]
  onCreate: () => void
  onEdit: (node: NurseryInventoryTreeNode) => void
  onDelete: (node: NurseryInventoryTreeNode) => void
}) {
  const flattened = useMemo(() => flattenTree(locations), [locations])

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-line bg-surface p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-ink">مستودعات ومواقع المشتل</h2>
            <p className="mt-1 text-sm text-ink-soft">
              بطاقات تشغيلية للمواقع المعزولة مثل مستودع الصوبة الرئيسية، الثلاجات، وأقسام المناولة.
            </p>
          </div>
          <ActionButton icon={Plus} label="إضافة مستودع" onClick={onCreate} />
        </div>
      </section>

      {locationCards.length === 0 ? (
        <EmptyState
          icon={Warehouse}
          title="لا توجد مستودعات محلية"
          description="أضف أول مستودع أو موقع تخزين خاص بالمشتل لربط الأصناف بمواقعها التشغيلية."
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {locationCards.map((card) => {
            const node = flattened.find((entry) => entry.id === card.id) ?? null

            return (
              <article key={card.id} className="rounded-[2rem] border border-line bg-surface p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-subtle text-action-secondary">
                        <MapPinned className="h-5 w-5" />
                      </span>
                      <div>
                        <h3 className="text-lg font-bold text-ink">{card.name}</h3>
                        <p className="mt-1 text-sm text-ink-soft">
                          {card.description || 'موقع تخزين مستقل داخل منظومة المشتل.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {node ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(node)}
                        className="rounded-2xl border border-line bg-surface-subtle px-3 py-2 text-xs font-semibold text-ink-soft active:scale-[0.98] transition-all hover:text-ink"
                      >
                        تعديل
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(node)}
                        className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 active:scale-[0.98] transition-all hover:bg-red-100"
                      >
                        حذف
                      </button>
                    </div>
                  ) : null}
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-line bg-surface-subtle px-4 py-4">
                    <p className="text-xs font-semibold text-ink-muted">الأصناف النشطة</p>
                    <p className="mt-1 text-xl font-bold text-ink">
                      {formatNumber(card.active_items_count, 0)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-line bg-surface-subtle px-4 py-4">
                    <p className="text-xs font-semibold text-ink-muted">إشغال المساحة التخزينية</p>
                    <p className="mt-1 text-xl font-bold text-action-primary">
                      {formatNumber(card.occupancy_percent, 1)}%
                    </p>
                  </div>
                  <div className="rounded-2xl border border-line bg-surface-subtle px-4 py-4">
                    <p className="text-xs font-semibold text-ink-muted">إجمالي الكميات</p>
                    <p className="mt-1 text-base font-bold text-ink">
                      {formatNumber(card.total_quantity, 2)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-line bg-surface-subtle px-4 py-4">
                    <p className="text-xs font-semibold text-ink-muted">إجمالي القيمة</p>
                    <p className="mt-1 text-base font-bold text-emerald-700">
                      {formatCurrency(card.total_value)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-line bg-surface-subtle px-3 py-1.5 text-xs font-semibold text-ink-soft">
                    مواقع فرعية: {formatNumber(card.descendants_count, 0)}
                  </span>
                  <span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                    أصناف منخفضة: {formatNumber(card.low_stock_count, 0)}
                  </span>
                </div>

                {card.children.length > 0 ? (
                  <div className="mt-5 space-y-2 border-t border-line pt-4">
                    <p className="text-sm font-bold text-ink">الأقسام الفرعية النشطة</p>
                    {card.children.map((child) => (
                      <div
                        key={child.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface-subtle px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-ink">{child.name}</p>
                          <p className="mt-1 text-xs text-ink-muted">
                            أصناف نشطة: {formatNumber(child.active_items_count, 0)}
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-ink-soft">
                          {child.parent_name || 'تابع مباشر'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function NurseryInventoryPage() {
  const [activeTab, setActiveTab] = useState<InventoryTab>('items')
  const [itemModalOpen, setItemModalOpen] = useState(false)
  const [masterModalOpen, setMasterModalOpen] = useState(false)
  const [openingBalancesOpen, setOpeningBalancesOpen] = useState(false)
  const [masterType, setMasterType] = useState<MasterEntityType>('category')
  const [editingItem, setEditingItem] = useState<NurseryInventoryItem | null>(null)
  const [editingNode, setEditingNode] = useState<NurseryInventoryTreeNode | null>(null)

  const bootstrapQuery = useNurseryInventoryBootstrap()
  const createItemMutation = useCreateNurseryInventoryItem()
  const updateItemMutation = useUpdateNurseryInventoryItem()
  const deleteItemMutation = useDeleteNurseryInventoryItem()
  const createCategoryMutation = useCreateNurseryInventoryCategory()
  const updateCategoryMutation = useUpdateNurseryInventoryCategory()
  const deleteCategoryMutation = useDeleteNurseryInventoryCategory()
  const createLocationMutation = useCreateNurseryInventoryLocation()
  const updateLocationMutation = useUpdateNurseryInventoryLocation()
  const deleteLocationMutation = useDeleteNurseryInventoryLocation()
  const openingBalancesMutation = useStoreNurseryOpeningBalances()

  const data = bootstrapQuery.data?.data

  const openCreateItem = () => {
    setEditingItem(null)
    setItemModalOpen(true)
  }

  const openEditItem = (item: NurseryInventoryItem) => {
    setEditingItem(item)
    setItemModalOpen(true)
  }

  const openCreateMaster = (type: MasterEntityType) => {
    setMasterType(type)
    setEditingNode(null)
    setMasterModalOpen(true)
  }

  const openEditCategory = (node: NurseryInventoryTreeNode) => {
    setMasterType('category')
    setEditingNode(node)
    setMasterModalOpen(true)
  }

  const openEditLocation = (node: NurseryInventoryTreeNode) => {
    setMasterType('location')
    setEditingNode(node)
    setMasterModalOpen(true)
  }

  const handleDeleteItem = async (item: NurseryInventoryItem) => {
    if (!window.confirm(`هل تريد حذف الصنف "${item.name}" من مخزون المشتل؟`)) return
    await deleteItemMutation.mutateAsync(item.id)
  }

  const handleDeleteCategory = async (node: NurseryInventoryTreeNode) => {
    if (!window.confirm(`هل تريد حذف الفئة "${node.name}"؟`)) return
    await deleteCategoryMutation.mutateAsync(node.id)
  }

  const handleDeleteLocation = async (node: NurseryInventoryTreeNode) => {
    if (!window.confirm(`هل تريد حذف الموقع "${node.name}"؟`)) return
    await deleteLocationMutation.mutateAsync(node.id)
  }

  const submitItem = async (payload: NurseryInventoryItemPayload) => {
    if (editingItem) {
      await updateItemMutation.mutateAsync({ id: editingItem.id, payload })
      return
    }
    await createItemMutation.mutateAsync(payload)
  }

  const submitMaster = async (payload: NurseryInventoryCategoryPayload | NurseryInventoryLocationPayload) => {
    if (masterType === 'category') {
      if (editingNode) {
        await updateCategoryMutation.mutateAsync({ id: editingNode.id, payload })
        return
      }
      await createCategoryMutation.mutateAsync(payload)
      return
    }

    if (editingNode) {
      await updateLocationMutation.mutateAsync({ id: editingNode.id, payload })
      return
    }

    await createLocationMutation.mutateAsync(payload)
  }

  const isItemPending = createItemMutation.isPending || updateItemMutation.isPending
  const isMasterPending =
    createCategoryMutation.isPending ||
    updateCategoryMutation.isPending ||
    createLocationMutation.isPending ||
    updateLocationMutation.isPending

  return (
    <div className="min-h-full space-y-6 bg-background text-foreground" dir="rtl">
      <section className="rounded-[2rem] border border-line bg-surface p-6 shadow-sm">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3">
              <span className="flex h-14 w-14 items-center justify-center rounded-3xl bg-[rgba(194,65,12,0.08)] text-action-primary">
                <Building2 className="h-6 w-6" />
              </span>
              <div>
                <h1 className="text-3xl font-bold text-ink">مخزون المشتل</h1>
                <p className="mt-1 text-sm leading-6 text-ink-soft">
                  وحدة مخزون محلية معزولة بالكامل لإدارة مراكن وأسمدة وتربة ومواد زراعية داخل منظومة المشتل فقط.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <ActionButton icon={Plus} label="إضافة صنف" onClick={openCreateItem} />
            <ActionButton icon={Layers3} label="إضافة فئة" onClick={() => openCreateMaster('category')} tone="secondary" />
            <ActionButton icon={Warehouse} label="إضافة مستودع" onClick={() => openCreateMaster('location')} tone="secondary" />
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {tabs.map((tab) => (
            <TabButton key={tab.id} tab={tab} activeTab={activeTab} onClick={setActiveTab} />
          ))}
        </div>
      </section>

      {bootstrapQuery.isLoading ? <InventorySkeleton /> : null}

      {bootstrapQuery.isError ? (
        <div className="rounded-[2rem] border border-red-200 bg-red-50 p-6 text-red-700">
          <h2 className="text-lg font-bold">تعذر تحميل بيانات مخزون المشتل</h2>
          <p className="mt-2 text-sm">{getErrorMessage(bootstrapQuery.error)}</p>
        </div>
      ) : null}

      {data ? (
        <>
          {activeTab === 'items' ? (
            <ItemsTab
              data={data}
              onCreateItem={openCreateItem}
              onEditItem={openEditItem}
              onDeleteItem={handleDeleteItem}
              onOpeningBalances={() => setOpeningBalancesOpen(true)}
            />
          ) : null}

          {activeTab === 'categories' ? (
            <CategoriesTab
              categories={data.categories}
              onCreate={() => openCreateMaster('category')}
              onEdit={openEditCategory}
              onDelete={handleDeleteCategory}
            />
          ) : null}

          {activeTab === 'locations' ? (
            <LocationsTab
              locationCards={data.location_cards}
              locations={data.locations}
              onCreate={() => openCreateMaster('location')}
              onEdit={openEditLocation}
              onDelete={handleDeleteLocation}
            />
          ) : null}
        </>
      ) : null}

      <ItemModal
        key={`item-modal-${editingItem?.id ?? 'new'}-${itemModalOpen ? 'open' : 'closed'}`}
        open={itemModalOpen}
        onClose={() => setItemModalOpen(false)}
        categories={data?.categories ?? []}
        locations={data?.locations ?? []}
        item={editingItem}
        onSubmit={submitItem}
        isPending={isItemPending}
      />

      <MasterModal
        key={`master-modal-${masterType}-${editingNode?.id ?? 'new'}-${masterModalOpen ? 'open' : 'closed'}`}
        open={masterModalOpen}
        onClose={() => setMasterModalOpen(false)}
        type={masterType}
        tree={masterType === 'category' ? data?.categories ?? [] : data?.locations ?? []}
        node={editingNode}
        onSubmit={submitMaster}
        isPending={isMasterPending}
      />

      <OpeningBalancesDialog
        open={openingBalancesOpen}
        onClose={() => setOpeningBalancesOpen(false)}
        items={data?.items ?? []}
        onSubmit={async (payload) => {
          await openingBalancesMutation.mutateAsync(payload)
        }}
        isPending={openingBalancesMutation.isPending}
      />
    </div>
  )
}
