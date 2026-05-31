'use client'

import React, { useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { z } from 'zod'
import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CopyPlus,
  Download,
  Edit3,
  Eye,
  ImageIcon,
  Layers3,
  Leaf,
  Loader2,
  Plus,
  Save,
  Search,
  Sprout,
  Trash2,
  TreePalm,
  Trees,
  X,
} from 'lucide-react'
import AppDialog from '@/components/ui/AppDialog'
import {
  useCopyNurseryTreeGuideToVarieties,
  useCreateNurseryTreeGuide,
  useCreateNurseryVariety,
  useDeleteNurseryTreeGuide,
  useDeleteNurseryVariety,
  useNurseryTreeGuides,
  useNurseryVarieties,
  useUpdateNurseryTreeGuide,
  useUpdateNurseryVariety,
} from '@/lib/hooks/useNurseryVarieties'
import type {
  ApiError,
  NurseryGuideListParams,
  NurseryVarietyListParams,
  PaginationMeta,
  TreeGuide,
  TreeGuidePayload,
  TreeVariety,
  TreeVarietyPayload,
} from '@/lib/types'

type ActiveTab = 'varieties' | 'guide'
type Direction = 'asc' | 'desc'

const categories = ['أشجار مثمرة', 'أشجار زينة', 'أشجار خشبية', 'نخيل', 'شجيرات', 'أخرى'] as const

const optionalNumber = z
  .string()
  .trim()
  .refine((value) => value === '' || (!Number.isNaN(Number(value)) && Number(value) >= 0), {
    message: 'القيمة يجب أن تكون رقماً 0 أو أكثر',
  })

const varietySchema = z.object({
  name: z.string().trim().min(1, 'اسم الصنف مطلوب').max(255, 'اسم الصنف طويل جداً'),
  scientific_name: z.string().trim().max(255, 'الاسم العلمي طويل جداً'),
  category: z.union([z.enum(categories), z.literal('')]),
  growth_period: z
    .string()
    .trim()
    .refine((value) => value === '' || /^\d+$/.test(value), {
      message: 'فترة النمو يجب أن تكون رقماً صحيحاً 0 أو أكثر',
    }),
  description: z.string().trim(),
})

const guideSchema = z.object({
  name: z.string().trim().min(1, 'اسم الشجرة مطلوب').max(255, 'اسم الشجرة طويل جداً'),
  scientific_name: z.string().trim().max(255, 'الاسم العلمي طويل جداً'),
  family: z.string().trim().max(100, 'الفصيلة طويلة جداً'),
  common_name: z.string().trim().max(255, 'الاسم الشائع طويل جداً'),
  origin: z.string().trim().max(255, 'الموطن الأصلي طويل جداً'),
  growth_habit: z.string().trim().max(100, 'طبيعة النمو طويلة جداً'),
  height: optionalNumber,
  spread: optionalNumber,
  leaf_type: z.string().trim().max(100, 'طبيعة الورق طويلة جداً'),
  leaf_color: z.string().trim().max(100, 'لون الورق طويل جداً'),
  usage_location: z.string().trim().max(255, 'موقع الاستخدام طويل جداً'),
  usage_type: z.string().trim().max(255, 'نوع الاستخدام طويل جداً'),
  image_url: z.union([z.literal(''), z.string().trim().url('رابط الصورة غير صحيح')]),
  light: z.string().trim().max(255, 'الضوء طويل جداً'),
  temperature: z.string().trim().max(255, 'الحرارة طويلة جداً'),
  humidity: z.string().trim().max(255, 'الرطوبة طويلة جداً'),
  salinity: z.string().trim().max(255, 'الملوحة طويلة جداً'),
  irrigation: z.string().trim().max(255, 'الري طويل جداً'),
  propagation: z.string().trim().max(255, 'التكاثر طويل جداً'),
  general_care: z.string().trim(),
  notes: z.string().trim(),
})

type VarietyFormValues = z.infer<typeof varietySchema>
type GuideFormValues = z.infer<typeof guideSchema>

const varietyDefaults: VarietyFormValues = {
  name: '',
  scientific_name: '',
  category: 'أشجار مثمرة',
  growth_period: '',
  description: '',
}

const guideDefaults: GuideFormValues = {
  name: '',
  scientific_name: '',
  family: '',
  common_name: '',
  origin: '',
  growth_habit: '',
  height: '',
  spread: '',
  leaf_type: '',
  leaf_color: '',
  usage_location: '',
  usage_type: '',
  image_url: '',
  light: '',
  temperature: '',
  humidity: '',
  salinity: '',
  irrigation: '',
  propagation: '',
  general_care: '',
  notes: '',
}

function nullableString(value: string | null | undefined) {
  const normalized = String(value ?? '').trim()
  return normalized === '' ? null : normalized
}

function nullableNumber(value: string | number) {
  if (value === '') return null
  return Number(value)
}

function formatNumber(value: number | null | undefined, suffix = '') {
  if (value === null || value === undefined || Number.isNaN(value)) return '-'
  return `${new Intl.NumberFormat('ar-SA', { maximumFractionDigits: 2 }).format(value)}${suffix}`
}

function formatDate(value: string | null) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('ar-SA', { dateStyle: 'medium' }).format(new Date(value))
}

function getErrorMessage(error: unknown) {
  const fallback = 'تعذر تنفيذ العملية.'
  if (!error || typeof error !== 'object') return fallback
  const apiError = error as ApiError
  if (apiError.errors) {
    const first = Object.values(apiError.errors)[0]?.[0]
    if (first) return first
  }
  return apiError.message || fallback
}

function varietyToDefaults(variety: TreeVariety): VarietyFormValues {
  return {
    name: variety.name,
    scientific_name: variety.scientific_name ?? '',
    category: categories.includes(variety.category as (typeof categories)[number])
      ? (variety.category as VarietyFormValues['category'])
      : 'أخرى',
    growth_period: variety.growth_period === null ? '' : String(variety.growth_period),
    description: variety.description ?? '',
  }
}

function guideToDefaults(guide: TreeGuide): GuideFormValues {
  return {
    name: guide.name,
    scientific_name: guide.scientific_name ?? '',
    family: guide.family ?? '',
    common_name: guide.common_name ?? '',
    origin: guide.origin ?? '',
    growth_habit: guide.growth_habit ?? '',
    height: guide.height === null ? '' : String(guide.height),
    spread: guide.spread === null ? '' : String(guide.spread),
    leaf_type: guide.leaf_type ?? '',
    leaf_color: guide.leaf_color ?? '',
    usage_location: guide.usage_location ?? '',
    usage_type: guide.usage_type ?? '',
    image_url: guide.image_url ?? '',
    light: guide.light ?? '',
    temperature: guide.temperature ?? '',
    humidity: guide.humidity ?? '',
    salinity: guide.salinity ?? '',
    irrigation: guide.irrigation ?? '',
    propagation: guide.propagation ?? '',
    general_care: guide.general_care ?? '',
    notes: guide.notes ?? '',
  }
}

function toVarietyPayload(values: VarietyFormValues): TreeVarietyPayload {
  return {
    name: values.name.trim(),
    scientific_name: nullableString(values.scientific_name),
    category: nullableString(values.category),
    growth_period: nullableNumber(values.growth_period),
    description: nullableString(values.description),
  }
}

function toGuidePayload(values: GuideFormValues): TreeGuidePayload {
  return {
    name: values.name.trim(),
    scientific_name: nullableString(values.scientific_name),
    family: nullableString(values.family),
    common_name: nullableString(values.common_name),
    origin: nullableString(values.origin),
    growth_habit: nullableString(values.growth_habit),
    height: nullableNumber(values.height),
    spread: nullableNumber(values.spread),
    leaf_type: nullableString(values.leaf_type),
    leaf_color: nullableString(values.leaf_color),
    usage_location: nullableString(values.usage_location),
    usage_type: nullableString(values.usage_type),
    image_url: nullableString(values.image_url),
    light: nullableString(values.light),
    temperature: nullableString(values.temperature),
    humidity: nullableString(values.humidity),
    salinity: nullableString(values.salinity),
    irrigation: nullableString(values.irrigation),
    propagation: nullableString(values.propagation),
    general_care: nullableString(values.general_care),
    notes: nullableString(values.notes),
  }
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-2 block text-sm font-semibold text-ink-soft">{children}</label>
}

function ErrorText({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-2 text-xs font-semibold text-red-600">{message}</p>
}

function SkeletonBlock() {
  return (
    <div className="space-y-4">
      <div className="h-24 animate-skeleton-shimmer rounded-2xl" />
      <div className="h-96 animate-skeleton-shimmer rounded-2xl" />
    </div>
  )
}

function PaginationControls({
  meta,
  onPageChange,
}: {
  meta?: PaginationMeta
  onPageChange: (page: number) => void
}) {
  if (!meta || meta.last_page <= 1) return null

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-sm text-ink-soft sm:flex-row sm:items-center sm:justify-between">
      <div>
        عرض {formatNumber(meta.from)} إلى {formatNumber(meta.to)} من {formatNumber(meta.total)} سجل
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(meta.current_page - 1)}
          disabled={meta.current_page <= 1}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-100 bg-white text-ink-soft disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.98] transition-all"
          aria-label="الصفحة السابقة"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <span className="min-w-24 text-center font-semibold text-ink">
          {formatNumber(meta.current_page)} / {formatNumber(meta.last_page)}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(meta.current_page + 1)}
          disabled={meta.current_page >= meta.last_page}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-100 bg-white text-ink-soft disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.98] transition-all"
          aria-label="الصفحة التالية"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function VarietyFormDialog({
  open,
  variety,
  submitting,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean
  variety: TreeVariety | null
  submitting: boolean
  error: unknown
  onClose: () => void
  onSubmit: (values: VarietyFormValues) => void
}) {
  const form = useForm<VarietyFormValues>({
    resolver: zodResolver(varietySchema),
    values: variety ? varietyToDefaults(variety) : varietyDefaults,
  })

  return (
    <AppDialog open={open} onClose={onClose} panelClassName="max-w-3xl">
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-100 bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 id="variety-form-title" className="text-xl font-bold text-ink">
              {variety ? 'تعديل صنف شجرة' : 'إضافة صنف جديد'}
            </h2>
            <p className="mt-1 text-sm text-ink-soft">حقول الأصناف مطابقة لنموذج varieties.php القديم.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-100 text-ink-soft hover:bg-slate-50 active:scale-[0.98] transition-all"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-5 p-6 sm:grid-cols-2">
          <div>
            <FieldLabel>اسم الصنف</FieldLabel>
            <input
              {...form.register('name')}
              placeholder="مثال: برتقال سكري"
              className="h-11 w-full rounded-lg border border-slate-100 bg-slate-50 px-3 text-sm text-ink outline-none focus:border-[#c2410c] focus:ring-2 focus:ring-orange-100"
            />
            <ErrorText message={form.formState.errors.name?.message} />
          </div>
          <div>
            <FieldLabel>الاسم العلمي</FieldLabel>
            <input
              {...form.register('scientific_name')}
              dir="ltr"
              placeholder="Citrus sinensis"
              className="h-11 w-full rounded-lg border border-slate-100 bg-slate-50 px-3 text-left text-sm text-ink outline-none focus:border-[#c2410c] focus:ring-2 focus:ring-orange-100"
            />
            <ErrorText message={form.formState.errors.scientific_name?.message} />
          </div>
          <div>
            <FieldLabel>الفئة</FieldLabel>
            <select
              {...form.register('category')}
              className="h-11 w-full rounded-lg border border-slate-100 bg-slate-50 px-3 text-sm text-ink outline-none focus:border-[#c2410c] focus:ring-2 focus:ring-orange-100"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <ErrorText message={form.formState.errors.category?.message} />
          </div>
          <div>
            <FieldLabel>فترة النمو (بالأشهر)</FieldLabel>
            <input
              {...form.register('growth_period')}
              type="number"
              min="0"
              placeholder="12"
              className="h-11 w-full rounded-lg border border-slate-100 bg-slate-50 px-3 text-sm text-ink outline-none focus:border-[#c2410c] focus:ring-2 focus:ring-orange-100"
            />
            <ErrorText message={form.formState.errors.growth_period?.message} />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel>الوصف</FieldLabel>
            <textarea
              {...form.register('description')}
              rows={4}
              placeholder="وصف مختصر للصنف..."
              className="w-full rounded-lg border border-slate-100 bg-slate-50 px-3 py-3 text-sm text-ink outline-none focus:border-[#c2410c] focus:ring-2 focus:ring-orange-100"
            />
            <ErrorText message={form.formState.errors.description?.message} />
          </div>
        </div>

        {error ? (
          <div className="mx-6 mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {getErrorMessage(error)}
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 px-6 py-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-100 bg-white px-5 text-sm font-semibold text-ink-soft active:scale-[0.98] transition-all"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#c2410c] px-5 text-sm font-semibold text-white hover:bg-[#9a3412] disabled:opacity-60 active:scale-[0.98] transition-all"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            حفظ
          </button>
        </div>
      </form>
    </AppDialog>
  )
}

function GuideFormDialog({
  open,
  guide,
  submitting,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean
  guide: TreeGuide | null
  submitting: boolean
  error: unknown
  onClose: () => void
  onSubmit: (values: GuideFormValues) => void
}) {
  const form = useForm<GuideFormValues>({
    resolver: zodResolver(guideSchema),
    values: guide ? guideToDefaults(guide) : guideDefaults,
  })

  return (
    <AppDialog open={open} onClose={onClose} panelClassName="max-w-5xl">
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-100 bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 id="guide-form-title" className="text-xl font-bold text-ink">
              {guide ? 'تعديل دليل شجرة' : 'إضافة دليل شجرة'}
            </h2>
            <p className="mt-1 text-sm text-ink-soft">البيانات الأساسية ونصائح العناية كما وردت في دليل أصناف الظل و الزينة.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-100 text-ink-soft hover:bg-slate-50 active:scale-[0.98] transition-all"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-7 p-6">
          <section>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-[#c2410c]">
              <Leaf className="h-4 w-4" />
              البيانات الأساسية
            </h3>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <GuideInput form={form} name="name" label="اسم الشجرة" required />
              <GuideInput form={form} name="scientific_name" label="الاسم العلمي" ltr />
              <GuideInput form={form} name="family" label="الفصيلة" />
              <GuideInput form={form} name="common_name" label="الاسم الشائع" />
              <GuideInput form={form} name="origin" label="الموطن الأصلي" />
              <GuideInput form={form} name="growth_habit" label="طبيعة النمو" />
              <GuideInput form={form} name="height" label="الارتفاع (م)" type="number" step="0.1" />
              <GuideInput form={form} name="spread" label="امتداد التاج (م)" type="number" step="0.1" />
              <GuideInput form={form} name="leaf_type" label="طبيعة الورق" />
              <GuideInput form={form} name="leaf_color" label="لون الورق" />
              <GuideInput form={form} name="usage_location" label="موقع الاستخدام" />
              <GuideInput form={form} name="usage_type" label="نوع الاستخدام" />
              <div className="lg:col-span-3">
                <GuideInput form={form} name="image_url" label="رابط الصورة" ltr />
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-emerald-700">
              <Sprout className="h-4 w-4" />
              نصائح العناية
            </h3>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <GuideInput form={form} name="light" label="الضوء" />
              <GuideInput form={form} name="temperature" label="الحرارة" />
              <GuideInput form={form} name="humidity" label="الرطوبة" />
              <GuideInput form={form} name="salinity" label="الملوحة (ppm)" />
              <GuideInput form={form} name="irrigation" label="الري" />
              <GuideInput form={form} name="propagation" label="التكاثر" />
              <div className="lg:col-span-3">
                <FieldLabel>الرعاية العامة</FieldLabel>
                <textarea
                  {...form.register('general_care')}
                  rows={4}
                  className="w-full rounded-lg border border-slate-100 bg-slate-50 px-3 py-3 text-sm text-ink outline-none focus:border-[#c2410c] focus:ring-2 focus:ring-orange-100"
                />
                <ErrorText message={form.formState.errors.general_care?.message} />
              </div>
              <div className="lg:col-span-3">
                <FieldLabel>ملاحظات إضافية</FieldLabel>
                <textarea
                  {...form.register('notes')}
                  rows={3}
                  className="w-full rounded-lg border border-slate-100 bg-slate-50 px-3 py-3 text-sm text-ink outline-none focus:border-[#c2410c] focus:ring-2 focus:ring-orange-100"
                />
                <ErrorText message={form.formState.errors.notes?.message} />
              </div>
            </div>
          </section>
        </div>

        {error ? (
          <div className="mx-6 mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {getErrorMessage(error)}
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 px-6 py-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-100 bg-white px-5 text-sm font-semibold text-ink-soft active:scale-[0.98] transition-all"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#c2410c] px-5 text-sm font-semibold text-white hover:bg-[#9a3412] disabled:opacity-60 active:scale-[0.98] transition-all"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            حفظ الدليل
          </button>
        </div>
      </form>
    </AppDialog>
  )
}

function GuideInput({
  form,
  name,
  label,
  type = 'text',
  step,
  ltr = false,
}: {
  form: UseFormReturn<GuideFormValues>
  name: keyof GuideFormValues
  label: string
  type?: string
  step?: string
  ltr?: boolean
  required?: boolean
}) {
  const error = form.formState.errors[name]?.message
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input
        {...form.register(name)}
        type={type}
        step={step}
        dir={ltr ? 'ltr' : 'rtl'}
        className={`h-11 w-full rounded-lg border border-slate-100 bg-slate-50 px-3 text-sm text-ink outline-none focus:border-[#c2410c] focus:ring-2 focus:ring-orange-100 ${ltr ? 'text-left' : 'text-right'}`}
      />
      <ErrorText message={typeof error === 'string' ? error : undefined} />
    </div>
  )
}

export default function NurseryVarietiesPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('varieties')
  const [varietySearch, setVarietySearch] = useState('')
  const [guideSearch, setGuideSearch] = useState('')
  const [category, setCategory] = useState('')
  const [varietySort, setVarietySort] = useState<NurseryVarietyListParams['sort']>('created_at')
  const [guideSort, setGuideSort] = useState<NurseryGuideListParams['sort']>('created_at')
  const [direction, setDirection] = useState<Direction>('desc')
  const [varietyPage, setVarietyPage] = useState(1)
  const [guidePage, setGuidePage] = useState(1)
  const [varietyDialogOpen, setVarietyDialogOpen] = useState(false)
  const [guideDialogOpen, setGuideDialogOpen] = useState(false)
  const [editingVariety, setEditingVariety] = useState<TreeVariety | null>(null)
  const [editingGuide, setEditingGuide] = useState<TreeGuide | null>(null)
  const [expandedGuideIds, setExpandedGuideIds] = useState<Set<number>>(new Set())

  const varietyParams = useMemo<NurseryVarietyListParams>(
    () => ({
      search: varietySearch,
      category,
      sort: varietySort,
      direction,
      page: varietyPage,
      per_page: 12,
    }),
    [category, direction, varietyPage, varietySearch, varietySort]
  )

  const guideParams = useMemo<NurseryGuideListParams>(
    () => ({
      search: guideSearch,
      sort: guideSort,
      direction,
      page: guidePage,
      per_page: 12,
    }),
    [direction, guidePage, guideSearch, guideSort]
  )

  const varietiesQuery = useNurseryVarieties(varietyParams)
  const guidesQuery = useNurseryTreeGuides(guideParams)
  const createVariety = useCreateNurseryVariety()
  const updateVariety = useUpdateNurseryVariety()
  const deleteVariety = useDeleteNurseryVariety()
  const createGuide = useCreateNurseryTreeGuide()
  const updateGuide = useUpdateNurseryTreeGuide()
  const deleteGuide = useDeleteNurseryTreeGuide()
  const copyGuide = useCopyNurseryTreeGuideToVarieties()

  const varieties = varietiesQuery.data?.data ?? []
  const guides = guidesQuery.data?.data ?? []

  const summary = useMemo(
    () => ({
      varieties: varietiesQuery.data?.meta.total ?? 0,
      guides: guidesQuery.data?.meta.total ?? 0,
      totalTreeQuantity: varietiesQuery.data?.summary.total_tree_quantity ?? 0,
      stockedVarieties: varietiesQuery.data?.summary.stocked_varieties_count ?? 0,
    }),
    [
      guidesQuery.data?.meta.total,
      varietiesQuery.data?.meta.total,
      varietiesQuery.data?.summary.stocked_varieties_count,
      varietiesQuery.data?.summary.total_tree_quantity,
    ]
  )

  const openCreateVariety = () => {
    setEditingVariety(null)
    setVarietyDialogOpen(true)
  }

  const openEditVariety = (variety: TreeVariety) => {
    setEditingVariety(variety)
    setVarietyDialogOpen(true)
  }

  const openCreateGuide = () => {
    setEditingGuide(null)
    setGuideDialogOpen(true)
  }

  const openEditGuide = (guide: TreeGuide) => {
    setEditingGuide(guide)
    setGuideDialogOpen(true)
  }

  const submitVariety = (values: VarietyFormValues) => {
    const payload = toVarietyPayload(values)
    const mutation = editingVariety
      ? updateVariety.mutateAsync({ id: editingVariety.id, payload })
      : createVariety.mutateAsync(payload)

    mutation.then(() => {
      setVarietyDialogOpen(false)
      setEditingVariety(null)
    })
  }

  const submitGuide = (values: GuideFormValues) => {
    const payload = toGuidePayload(values)
    const mutation = editingGuide
      ? updateGuide.mutateAsync({ id: editingGuide.id, payload })
      : createGuide.mutateAsync(payload)

    mutation.then(() => {
      setGuideDialogOpen(false)
      setEditingGuide(null)
    })
  }

  const exportGuideCsv = () => {
    const headers = [
      'اسم الشجرة',
      'الاسم العلمي',
      'الفصيلة',
      'الاسم الشائع',
      'الموطن الأصلي',
      'طبيعة النمو',
      'الارتفاع (م)',
      'امتداد التاج (م)',
      'طبيعة الورق',
      'لون الورق',
      'موقع الاستخدام',
      'نوع الاستخدام',
      'الضوء',
      'الحرارة',
      'الرطوبة',
      'الملوحة (ppm)',
      'الري',
      'التكاثر',
      'الرعاية العامة',
      'ملاحظات',
    ]
    const rows = guides.map((guide) => [
      guide.name,
      guide.scientific_name,
      guide.family,
      guide.common_name,
      guide.origin,
      guide.growth_habit,
      guide.height,
      guide.spread,
      guide.leaf_type,
      guide.leaf_color,
      guide.usage_location,
      guide.usage_type,
      guide.light,
      guide.temperature,
      guide.humidity,
      guide.salinity,
      guide.irrigation,
      guide.propagation,
      guide.general_care,
      guide.notes,
    ])
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `tree_guide_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-100 bg-white px-3 py-1 text-xs font-semibold text-emerald-700">
            <Trees className="h-3.5 w-3.5" />
            دليل الأصناف والتصنيف النباتي
          </div>
          <h1 className="mt-3 text-2xl font-bold text-ink">أصناف الأشجار</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-soft">
            إدارة أصناف الأشجار ودليل الظل والزينة مع كل الحقول التشغيلية المستخرجة من النظام القديم.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={activeTab === 'guide' ? openCreateGuide : openCreateVariety}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#c2410c] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#9a3412] active:scale-[0.98] transition-all"
          >
            <Plus className="h-4 w-4" />
            {activeTab === 'guide' ? 'إضافة دليل شجرة' : 'إضافة صنف جديد'}
          </button>
          {activeTab === 'guide' ? (
            <button
              type="button"
              onClick={exportGuideCsv}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-100 bg-white px-4 text-sm font-semibold text-ink-soft hover:bg-slate-50 active:scale-[0.98] transition-all"
            >
              <Download className="h-4 w-4" />
              تحميل نموذج Excel
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <SummaryCard icon={Layers3} label="إجمالي الأصناف" value={summary.varieties} tone="clay" />
        <SummaryCard icon={BookOpen} label="سجلات الدليل" value={summary.guides} tone="emerald" />
        <SummaryCard icon={Trees} label="إجمالي أشجار المخزون" value={summary.totalTreeQuantity} tone="slate" />
        <SummaryCard icon={TreePalm} label="أصناف مستخدمة بالأحواض" value={summary.stockedVarieties} tone="slate" />
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <TabButton active={activeTab === 'varieties'} icon={Trees} label="أصناف الأشجار" onClick={() => setActiveTab('varieties')} />
            <TabButton active={activeTab === 'guide'} icon={BookOpen} label="دليل أصناف الظل و الزينة" onClick={() => setActiveTab('guide')} />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <input
                value={activeTab === 'guide' ? guideSearch : varietySearch}
                onChange={(event) => {
                  if (activeTab === 'guide') {
                    setGuideSearch(event.target.value)
                    setGuidePage(1)
                  } else {
                    setVarietySearch(event.target.value)
                    setVarietyPage(1)
                  }
                }}
                placeholder="بحث..."
                className="h-11 w-full rounded-lg border border-slate-100 bg-slate-50 px-10 text-sm text-ink outline-none focus:border-[#c2410c] focus:ring-2 focus:ring-orange-100 sm:w-72"
              />
            </div>
            {activeTab === 'varieties' ? (
              <select
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value)
                  setVarietyPage(1)
                }}
                className="h-11 rounded-lg border border-slate-100 bg-slate-50 px-3 text-sm text-ink outline-none focus:border-[#c2410c] focus:ring-2 focus:ring-orange-100"
              >
                <option value="">كل الفئات</option>
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            ) : null}
            <select
              value={activeTab === 'guide' ? guideSort : varietySort}
              onChange={(event) => {
                if (activeTab === 'guide') setGuideSort(event.target.value as NurseryGuideListParams['sort'])
                else setVarietySort(event.target.value as NurseryVarietyListParams['sort'])
              }}
              className="h-11 rounded-lg border border-slate-100 bg-slate-50 px-3 text-sm text-ink outline-none focus:border-[#c2410c] focus:ring-2 focus:ring-orange-100"
            >
              {activeTab === 'guide' ? (
                <>
                  <option value="created_at">الأحدث</option>
                  <option value="name">اسم الشجرة</option>
                  <option value="scientific_name">الاسم العلمي</option>
                  <option value="family">الفصيلة</option>
                  <option value="growth_habit">طبيعة النمو</option>
                  <option value="height">الارتفاع</option>
                  <option value="spread">امتداد التاج</option>
                  <option value="usage_type">نوع الاستخدام</option>
                </>
              ) : (
                <>
                  <option value="created_at">الأحدث</option>
                  <option value="name">اسم الصنف</option>
                  <option value="scientific_name">الاسم العلمي</option>
                  <option value="category">الفئة</option>
                  <option value="growth_period">فترة النمو</option>
                  <option value="total_quantity">إجمالي الأشجار</option>
                </>
              )}
            </select>
            <button
              type="button"
              onClick={() => setDirection((current) => (current === 'asc' ? 'desc' : 'asc'))}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-100 bg-white px-4 text-sm font-semibold text-ink-soft active:scale-[0.98] transition-all"
            >
              {direction === 'asc' ? 'تصاعدي' : 'تنازلي'}
            </button>
          </div>
        </div>

        {activeTab === 'varieties' ? (
          varietiesQuery.isLoading ? (
            <div className="p-5">
              <SkeletonBlock />
            </div>
          ) : varietiesQuery.error ? (
            <ErrorPanel message={getErrorMessage(varietiesQuery.error)} />
          ) : (
            <VarietiesLedger
              varieties={varieties}
              deletingId={deleteVariety.variables ?? null}
              onEdit={openEditVariety}
              onDelete={(id) => {
                if (confirm('حذف هذا الصنف؟')) deleteVariety.mutate(id)
              }}
            />
          )
        ) : guidesQuery.isLoading ? (
          <div className="p-5">
            <SkeletonBlock />
          </div>
        ) : guidesQuery.error ? (
          <ErrorPanel message={getErrorMessage(guidesQuery.error)} />
        ) : (
          <GuideLedger
            guides={guides}
            expandedIds={expandedGuideIds}
            copyingId={copyGuide.variables ?? null}
            deletingId={deleteGuide.variables ?? null}
            onToggle={(id) =>
              setExpandedGuideIds((current) => {
                const next = new Set(current)
                if (next.has(id)) next.delete(id)
                else next.add(id)
                return next
              })
            }
            onEdit={openEditGuide}
            onDelete={(id) => {
              if (confirm('حذف هذا الدليل؟')) deleteGuide.mutate(id)
            }}
            onCopy={(id) => copyGuide.mutate(id)}
          />
        )}

        {activeTab === 'varieties' ? (
          <PaginationControls meta={varietiesQuery.data?.meta} onPageChange={setVarietyPage} />
        ) : (
          <PaginationControls meta={guidesQuery.data?.meta} onPageChange={setGuidePage} />
        )}
      </div>

      <VarietyFormDialog
        open={varietyDialogOpen}
        variety={editingVariety}
        submitting={createVariety.isPending || updateVariety.isPending}
        error={createVariety.error || updateVariety.error}
        onClose={() => {
          setVarietyDialogOpen(false)
          setEditingVariety(null)
          createVariety.reset()
          updateVariety.reset()
        }}
        onSubmit={submitVariety}
      />

      <GuideFormDialog
        open={guideDialogOpen}
        guide={editingGuide}
        submitting={createGuide.isPending || updateGuide.isPending}
        error={createGuide.error || updateGuide.error}
        onClose={() => {
          setGuideDialogOpen(false)
          setEditingGuide(null)
          createGuide.reset()
          updateGuide.reset()
        }}
        onSubmit={submitGuide}
      />

      {deleteVariety.error || deleteGuide.error || copyGuide.error ? (
        <div className="fixed bottom-5 left-5 z-40 max-w-md rounded-xl border border-red-100 bg-white p-4 text-sm font-semibold text-red-700 shadow-xl">
          {getErrorMessage(deleteVariety.error || deleteGuide.error || copyGuide.error)}
        </div>
      ) : null}
    </div>
  )
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Trees
  label: string
  value: number
  tone: 'clay' | 'emerald' | 'slate'
}) {
  const toneClass =
    tone === 'clay'
      ? 'bg-orange-50 text-[#c2410c]'
      : tone === 'emerald'
        ? 'bg-emerald-50 text-emerald-700'
        : 'bg-slate-50 text-ink-soft'

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg ${toneClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-sm font-semibold text-ink-soft">{label}</div>
      <div className="mt-1 text-2xl font-bold text-ink">{formatNumber(value)}</div>
    </div>
  )
}

function TabButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean
  icon: typeof Trees
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold active:scale-[0.98] transition-all ${
        active
          ? 'border-[#c2410c] bg-[#c2410c] text-white'
          : 'border-slate-100 bg-white text-ink-soft hover:bg-slate-50'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  )
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="m-5 rounded-xl border border-red-100 bg-red-50 p-5 text-sm font-semibold text-red-700">
      {message}
    </div>
  )
}

function VarietiesLedger({
  varieties,
  deletingId,
  onEdit,
  onDelete,
}: {
  varieties: TreeVariety[]
  deletingId: number | null
  onEdit: (variety: TreeVariety) => void
  onDelete: (id: number) => void
}) {
  if (varieties.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-slate-50 text-ink-muted">
          <Trees className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-ink">لا توجد أصناف أشجار</h3>
        <p className="mt-2 text-sm text-ink-soft">أضف أول صنف لبدء ربطه بخطوط الأشجار داخل الأحواض.</p>
      </div>
    )
  }

  return (
    <>
      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-[1120px] w-full text-right text-sm">
          <thead className="bg-slate-50 text-xs font-bold text-ink-soft">
            <tr>
              <th className="px-4 py-3">اسم الصنف</th>
              <th className="px-4 py-3">الاسم العلمي</th>
              <th className="px-4 py-3">الفئة</th>
              <th className="px-4 py-3">فترة النمو</th>
              <th className="px-4 py-3">الوصف</th>
              <th className="px-4 py-3">خطوط الأشجار</th>
              <th className="px-4 py-3">إجمالي الأشجار</th>
              <th className="px-4 py-3">تاريخ الإنشاء</th>
              <th className="px-4 py-3">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {varieties.map((variety) => (
              <tr key={variety.id} className="bg-white hover:bg-slate-50">
                <td className="px-4 py-4 font-bold text-ink">{variety.name}</td>
                <td className="px-4 py-4 text-left italic text-ink-soft" dir="ltr">
                  {variety.scientific_name || '-'}
                </td>
                <td className="px-4 py-4">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {variety.category || '-'}
                  </span>
                </td>
                <td className="px-4 py-4 text-ink-soft">{formatNumber(variety.growth_period, variety.growth_period ? ' شهر' : '')}</td>
                <td className="max-w-xs px-4 py-4 text-ink-soft">
                  <span className="line-clamp-2">{variety.description || '-'}</span>
                </td>
                <td className="px-4 py-4 font-semibold text-ink">{formatNumber(variety.tree_lines_count)}</td>
                <td className="px-4 py-4 font-semibold text-[#c2410c]">{formatNumber(variety.total_quantity)}</td>
                <td className="px-4 py-4 text-ink-soft">{formatDate(variety.created_at)}</td>
                <td className="px-4 py-4">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(variety)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-100 text-ink-soft hover:text-[#c2410c] active:scale-[0.98] transition-all"
                      aria-label="تعديل"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(variety.id)}
                      disabled={deletingId === variety.id}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 text-red-600 hover:bg-red-50 disabled:opacity-60 active:scale-[0.98] transition-all"
                      aria-label="حذف"
                    >
                      {deletingId === variety.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-4 lg:hidden">
        {varieties.map((variety) => (
          <article key={variety.id} className="rounded-xl border border-slate-100 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-ink">{variety.name}</h3>
                <p className="mt-1 text-left text-xs italic text-ink-soft" dir="ltr">
                  {variety.scientific_name || '-'}
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                {variety.category || '-'}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Info label="فترة النمو" value={formatNumber(variety.growth_period, variety.growth_period ? ' شهر' : '')} />
              <Info label="إجمالي الأشجار" value={formatNumber(variety.total_quantity)} />
              <Info label="خطوط الأشجار" value={formatNumber(variety.tree_lines_count)} />
              <Info label="تاريخ الإنشاء" value={formatDate(variety.created_at)} />
            </div>
            <p className="mt-3 text-sm leading-6 text-ink-soft">{variety.description || '-'}</p>
            <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
              <button type="button" onClick={() => onEdit(variety)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-100 px-3 text-sm font-semibold text-ink-soft active:scale-[0.98] transition-all">
                <Edit3 className="h-4 w-4" />
                تعديل
              </button>
              <button type="button" onClick={() => onDelete(variety.id)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-100 px-3 text-sm font-semibold text-red-600 active:scale-[0.98] transition-all">
                <Trash2 className="h-4 w-4" />
                حذف
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}

function GuideLedger({
  guides,
  expandedIds,
  copyingId,
  deletingId,
  onToggle,
  onEdit,
  onDelete,
  onCopy,
}: {
  guides: TreeGuide[]
  expandedIds: Set<number>
  copyingId: number | null
  deletingId: number | null
  onToggle: (id: number) => void
  onEdit: (guide: TreeGuide) => void
  onDelete: (id: number) => void
  onCopy: (id: number) => void
}) {
  if (guides.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-slate-50 text-ink-muted">
          <BookOpen className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-ink">لا توجد أدلة مضافة بعد</h3>
        <p className="mt-2 text-sm text-ink-soft">أضف بيانات التصنيف النباتي ونصائح العناية لكل شجرة.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 p-4 xl:grid-cols-2">
      {guides.map((guide) => {
        const expanded = expandedIds.has(guide.id)

        return (
          <article key={guide.id} className="overflow-hidden rounded-xl border border-slate-100 bg-white">
            <div className="grid sm:grid-cols-[180px_1fr]">
              <div className="relative flex min-h-44 items-center justify-center bg-slate-50">
                {guide.image_url ? (
                  <img src={guide.image_url} alt={guide.name} className="h-full min-h-44 w-full object-cover" />
                ) : (
                  <ImageIcon className="h-10 w-10 text-ink-muted" />
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-ink">{guide.name}</h3>
                    <p className="mt-1 text-left text-sm italic text-ink-soft" dir="ltr">
                      {guide.scientific_name || '-'}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => onCopy(guide.id)} disabled={copyingId === guide.id} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-100 text-emerald-700 hover:bg-emerald-50 disabled:opacity-60 active:scale-[0.98] transition-all" aria-label="إضافة للأصناف">
                      {copyingId === guide.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CopyPlus className="h-4 w-4" />}
                    </button>
                    <button type="button" onClick={() => onEdit(guide)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-100 text-ink-soft hover:text-[#c2410c] active:scale-[0.98] transition-all" aria-label="تعديل">
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => onDelete(guide.id)} disabled={deletingId === guide.id} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 text-red-600 hover:bg-red-50 disabled:opacity-60 active:scale-[0.98] transition-all" aria-label="حذف">
                      {deletingId === guide.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm lg:grid-cols-3">
                  <Info label="الفصيلة" value={guide.family || '-'} />
                  <Info label="طبيعة النمو" value={guide.growth_habit || '-'} />
                  <Info label="الارتفاع" value={formatNumber(guide.height, guide.height ? ' م' : '')} />
                  <Info label="الاستخدام" value={guide.usage_type || '-'} />
                  <Info label="التكاثر" value={guide.propagation || '-'} />
                  <Info label="الملوحة" value={guide.salinity || '-'} />
                </div>

                <button
                  type="button"
                  onClick={() => onToggle(guide.id)}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#c2410c] active:scale-[0.98] transition-all"
                >
                  <Eye className="h-4 w-4" />
                  {expanded ? 'إخفاء التفاصيل' : 'عرض كل التفاصيل'}
                  <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {expanded ? (
              <div className="border-t border-slate-100 bg-slate-50/60 p-4">
                <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <Info label="الاسم الشائع" value={guide.common_name || '-'} />
                  <Info label="الموطن الأصلي" value={guide.origin || '-'} />
                  <Info label="امتداد التاج" value={formatNumber(guide.spread, guide.spread ? ' م' : '')} />
                  <Info label="طبيعة الورق" value={guide.leaf_type || '-'} />
                  <Info label="لون الورق" value={guide.leaf_color || '-'} />
                  <Info label="موقع الاستخدام" value={guide.usage_location || '-'} />
                  <Info label="الضوء" value={guide.light || '-'} />
                  <Info label="الحرارة" value={guide.temperature || '-'} />
                  <Info label="الرطوبة" value={guide.humidity || '-'} />
                  <Info label="الري" value={guide.irrigation || '-'} />
                  <Info label="تاريخ الإنشاء" value={formatDate(guide.created_at)} />
                </div>
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <TextBlock label="الرعاية العامة" value={guide.general_care} />
                  <TextBlock label="ملاحظات" value={guide.notes} />
                </div>
              </div>
            ) : null}
          </article>
        )
      })}
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-white px-3 py-2">
      <div className="text-xs font-semibold text-ink-muted">{label}</div>
      <div className="mt-1 text-sm font-semibold text-ink">{value}</div>
    </div>
  )
}

function TextBlock({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-white p-3">
      <div className="text-xs font-semibold text-ink-muted">{label}</div>
      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-ink-soft">{value || '-'}</p>
    </div>
  )
}
