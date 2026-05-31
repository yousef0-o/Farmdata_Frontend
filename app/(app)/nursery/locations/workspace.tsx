'use client'

import React, { useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm, useWatch, type UseFormReturn } from 'react-hook-form'
import { z } from 'zod'
import { usePathname } from 'next/navigation'
import {
  CalendarDays,
  ChevronDown,
  Droplets,
  Edit3,
  Eye,
  Gauge,
  Grid3X3,
  Home,
  Image as ImageIcon,
  Layers3,
  LineChart,
  Link as LinkIcon,
  ListOrdered,
  Loader2,
  MapPin,
  Minus,
  Plus,
  Ruler,
  Settings2,
  Sprout,
  Trash2,
  Waves,
  X,
} from 'lucide-react'
import { API_BASE } from '@/lib/api/client'
import {
  useCreateNurseryBasin,
  useCreateNurseryLayout,
  useCreateNurseryLocation,
  useCreateNurserySection,
  useDeleteIrrigationPlan,
  useDeleteNurseryBasin,
  useDeleteNurseryLayout,
  useDeleteNurseryLocation,
  useDeleteNurserySection,
  useNurseryLocations,
  useUpdateNurseryBasin,
  useUpdateNurseryLayout,
  useUpdateNurserySection,
} from '@/lib/hooks/useNurseryLocations'
import { useNurseryFieldOptions } from '@/lib/hooks/useNurseryFields'
import type { ApiError } from '@/lib/types'
import type { NurseryFieldOptionsDictionary } from '@/lib/types/nurseryFields'
import type {
  NurseryBasin,
  NurseryLayout,
  NurseryLine,
  NurseryLocation,
  NurserySection,
  UpsertBasinPayload,
  UpsertNurseryPayload,
  UpsertSectionPayload,
} from '@/lib/types/nurseryLocations'

const emptyDictionary: NurseryFieldOptionsDictionary = {
  pot_size: [],
  division_option: [],
  basin_type: [],
  basin_content: [],
  irrigation_method: [],
  valve_size: [],
  sprinkler_size: [],
  pipe_size: [],
  hose_size: [],
}

const numberField = z.coerce.number().min(0)
const intField = z.coerce.number().int().min(0)
const optionalText = z.string().trim().max(50).default('')

const lineSchema = z.object({
  length: numberField.default(0),
  size: optionalText,
  num_valves: intField.default(0),
  num_connections: intField.default(0),
  num_dividers: intField.default(0),
})

const nurserySchema = z.object({
  name: z.string().trim().min(1, 'اسم المشتل مطلوب').max(255),
  length: numberField.default(0),
  width: numberField.default(0),
  num_wells: intField.default(0),
  num_well_machines: intField.default(0),
  well_line_length: numberField.default(0),
  long_lines: z.array(lineSchema).default([]),
  trans_lines: z.array(lineSchema).default([]),
})

const locationSchema = z.object({
  location_name: z.string().trim().min(1, 'اسم الموقع مطلوب').max(255),
})

const sectionSchema = z.object({
  name: z.string().trim().min(1, 'اسم القسم مطلوب').max(255),
  creation_date: z.string().trim().default(''),
  length: numberField.default(0),
  width: numberField.default(0),
  num_entrances: intField.default(1),
  entrance_width: numberField.default(0),
  num_aisles: intField.default(1),
  num_columns: intField.default(0),
  column_height: numberField.default(0),
  num_main_lines: intField.default(1),
  main_line_length: numberField.default(0),
  main_line_size: optionalText,
  num_sub_lines: intField.default(1),
  sub_line_length: numberField.default(0),
  sub_line_size: optionalText,
  num_main_valves: intField.default(1),
  main_valve_size: optionalText,
  num_sub_valves: intField.default(1),
  sub_valve_size: optionalText,
})

const basinSchema = z.object({
  base_name: z.string().trim().min(1, 'الاسم الأساسي مطلوب').max(255),
  count: z.coerce.number().int().min(1).default(1),
  length: numberField.default(0),
  width: numberField.default(0),
  long_division: optionalText,
  trans_division: optionalText,
  pots_per_point: z.coerce.number().int().min(1).default(1),
  type: optionalText,
  content: optionalText,
  irrigation_method: optionalText,
})

type NurseryFormInput = z.input<typeof nurserySchema>
type NurseryFormValues = z.output<typeof nurserySchema>
type LocationFormInput = z.input<typeof locationSchema>
type LocationFormValues = z.output<typeof locationSchema>
type SectionFormInput = z.input<typeof sectionSchema>
type SectionFormValues = z.output<typeof sectionSchema>
type BasinFormInput = z.input<typeof basinSchema>
type BasinFormValues = z.output<typeof basinSchema>

type OpenForm =
  | { type: 'nursery' }
  | { type: 'location'; id: number }
  | { type: 'section'; id: number }
  | { type: 'basin'; id: number }
  | null

type Editing =
  | { type: 'nursery'; nursery: NurseryLayout }
  | { type: 'section'; section: NurserySection; locationId: number }
  | { type: 'basin'; basin: NurseryBasin; sectionId: number }
  | null

const today = new Date().toISOString().slice(0, 10)

function getErrorMessage(error: unknown) {
  const fallback = 'حدث خطأ أثناء تنفيذ العملية.'
  if (!error || typeof error !== 'object') return fallback

  const apiError = error as ApiError
  if (typeof apiError.message === 'string' && apiError.message.trim()) return apiError.message

  if (apiError.errors) {
    const firstFieldErrors = Object.values(apiError.errors)[0]
    if (firstFieldErrors?.[0]) return firstFieldErrors[0]
  }

  return fallback
}

function formatNumber(value: number, digits = 0) {
  return new Intl.NumberFormat('ar-EG', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value)
}

function buildAssetUrl(path: string | null) {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) return path

  const origin = API_BASE.replace(/\/api\/?$/, '')
  return `${origin}/${path.replace(/^\/+/, '')}`
}

function parseDivision(value: string) {
  if (!value) return 0
  const numericValue = Number.parseFloat(value.replace(/[^\d.]/g, ''))
  if (!Number.isFinite(numericValue)) return 0
  if (value.includes('سم')) return numericValue / 100
  if (value.includes('متر') || value.toLowerCase().includes('m')) return numericValue
  return numericValue / 100
}

function calculateBasinGrid(values: Pick<BasinFormValues, 'length' | 'width' | 'long_division' | 'trans_division' | 'pots_per_point'>) {
  const longDivision = parseDivision(values.long_division)
  const transDivision = parseDivision(values.trans_division)
  const treesLong = longDivision > 0 ? Math.floor(values.length / longDivision) : 0
  const treesTrans = transDivision > 0 ? Math.floor(values.width / transDivision) : 0
  const capacity = treesLong * treesTrans * values.pots_per_point

  return { treesLong, treesTrans, capacity }
}

function lineDefaults(line?: NurseryLine) {
  return {
    length: line?.length ?? 0,
    size: line?.size ?? '',
    num_valves: line?.num_valves ?? 0,
    num_connections: line?.num_connections ?? 0,
    num_dividers: line?.num_dividers ?? 0,
  }
}

function nurseryDefaults(nursery?: NurseryLayout): NurseryFormValues {
  return {
    name: nursery?.name ?? '',
    length: nursery?.length ?? 0,
    width: nursery?.width ?? 0,
    num_wells: nursery?.num_wells ?? 0,
    num_well_machines: nursery?.num_well_machines ?? 0,
    well_line_length: nursery?.well_line_length ?? 0,
    long_lines: nursery?.lines.filter((line) => line.line_type === 'longitudinal').map(lineDefaults) ?? [],
    trans_lines: nursery?.lines.filter((line) => line.line_type === 'transverse').map(lineDefaults) ?? [],
  }
}

function sectionDefaults(section?: NurserySection): SectionFormValues {
  return {
    name: section?.name ?? '',
    creation_date: section?.creation_date ?? today,
    length: section?.length ?? 0,
    width: section?.width ?? 0,
    num_entrances: section?.num_entrances ?? 1,
    entrance_width: section?.entrance_width ?? 0,
    num_aisles: section?.num_aisles ?? 1,
    num_columns: section?.num_columns ?? 0,
    column_height: section?.column_height ?? 0,
    num_main_lines: section?.num_main_lines ?? 1,
    main_line_length: section?.main_line_length ?? 0,
    main_line_size: section?.main_line_size ?? '',
    num_sub_lines: section?.num_sub_lines ?? 1,
    sub_line_length: section?.sub_line_length ?? 0,
    sub_line_size: section?.sub_line_size ?? '',
    num_main_valves: section?.num_main_valves ?? 1,
    main_valve_size: section?.main_valve_size ?? '',
    num_sub_valves: section?.num_sub_valves ?? 1,
    sub_valve_size: section?.sub_valve_size ?? '',
  }
}

function basinDefaults(basin?: NurseryBasin): BasinFormValues {
  return {
    base_name: basin?.name ?? 'حوض',
    count: 1,
    length: basin?.length ?? 0,
    width: basin?.width ?? 0,
    long_division: basin?.long_division ?? '',
    trans_division: basin?.trans_division ?? '',
    pots_per_point: basin?.pots_per_point ?? 1,
    type: basin?.type ?? '',
    content: basin?.content ?? '',
    irrigation_method: basin?.irrigation_method ?? '',
  }
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs font-semibold text-danger">{message}</p>
}

function NumberInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      type="number"
      className={`min-h-11 w-full rounded-xl border border-line bg-surface-muted px-3 py-2 text-sm font-medium text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-action-primary focus:bg-surface focus:ring-2 focus:ring-[var(--focus-ring)] ${props.className ?? ''}`}
    />
  )
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`min-h-11 w-full rounded-xl border border-line bg-surface-muted px-3 py-2 text-sm font-medium text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-action-primary focus:bg-surface focus:ring-2 focus:ring-[var(--focus-ring)] ${props.className ?? ''}`}
    />
  )
}

function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`min-h-11 w-full rounded-xl border border-line bg-surface-muted px-3 py-2 text-sm font-medium text-ink outline-none transition-colors focus:border-action-primary focus:bg-surface focus:ring-2 focus:ring-[var(--focus-ring)] ${props.className ?? ''}`}
    />
  )
}

function FormField({
  label,
  children,
  error,
}: {
  label: string
  children: React.ReactNode
  error?: string
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-ink-soft">{label}</span>
      {children}
      <FieldError message={error} />
    </label>
  )
}

function ActionButton({
  children,
  tone = 'primary',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'primary' | 'neutral' | 'danger' | 'blue' | 'green' }) {
  const toneClass = {
    primary: 'bg-action-primary text-white hover:bg-action-primary-hover',
    neutral: 'border border-line bg-surface text-ink hover:bg-surface-muted',
    danger: 'bg-danger-soft text-danger hover:bg-red-100',
    blue: 'bg-info-soft text-info hover:bg-blue-100',
    green: 'bg-success-soft text-success-strong hover:bg-emerald-100',
  }[tone]

  return (
    <button
      {...props}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition-colors transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${toneClass} ${props.className ?? ''}`}
    >
      {children}
    </button>
  )
}

function IconButton({
  label,
  children,
  tone = 'neutral',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  tone?: 'neutral' | 'danger' | 'blue' | 'green'
}) {
  const toneClass = {
    neutral: 'text-ink-soft hover:bg-surface-muted hover:text-ink',
    danger: 'text-danger hover:bg-danger-soft',
    blue: 'text-info hover:bg-info-soft',
    green: 'text-success-strong hover:bg-success-soft',
  }[tone]

  return (
    <button
      {...props}
      type={props.type ?? 'button'}
      title={label}
      aria-label={label}
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${toneClass} ${props.className ?? ''}`}
    >
      {children}
    </button>
  )
}

function StatCard({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: typeof Grid3X3
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 border-b border-line pb-3 text-base font-bold text-ink">
        <Icon className="h-5 w-5 text-action-primary" />
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-4">{children}</div>
    </section>
  )
}

function StatItem({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div>
      <div className="text-xs font-semibold text-ink-soft">{label}</div>
      <div className="mt-1 font-mono text-xl font-bold text-ink">
        {value}
        {unit ? <span className="mr-1 font-sans text-xs text-ink-muted">{unit}</span> : null}
      </div>
    </div>
  )
}

function MiniStats({ stats }: { stats: Array<{ label: string; value: string }> }) {
  return (
    <div className="mt-3 grid gap-2 border-t border-white/60 pt-3 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-xl bg-white/55 px-3 py-2">
          <div className="text-xs font-semibold text-ink-soft">{stat.label}</div>
          <div className="mt-1 text-sm font-bold text-ink">{stat.value}</div>
        </div>
      ))}
    </div>
  )
}

function SectionHeading({ icon: Icon, title }: { icon: typeof Sprout; title: string }) {
  return (
    <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-ink">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-info-soft text-info">
        <Icon className="h-4 w-4" />
      </span>
      {title}
    </h3>
  )
}

function NurseryForm({
  nursery,
  options,
  onCancel,
  onSubmit,
  isSubmitting,
}: {
  nursery?: NurseryLayout
  options: NurseryFieldOptionsDictionary
  onCancel: () => void
  onSubmit: (payload: UpsertNurseryPayload) => Promise<void>
  isSubmitting: boolean
}) {
  const [images, setImages] = useState<File[]>([])
  const form = useForm<NurseryFormInput, unknown, NurseryFormValues>({
    resolver: zodResolver(nurserySchema),
    defaultValues: nurseryDefaults(nursery),
  })
  const longLines = useFieldArray({ control: form.control, name: 'long_lines' })
  const transLines = useFieldArray({ control: form.control, name: 'trans_lines' })
  const length = useWatch({ control: form.control, name: 'length' })
  const width = useWatch({ control: form.control, name: 'width' })
  const area = Number(length ?? 0) * Number(width ?? 0)

  async function submit(values: NurseryFormValues) {
    await onSubmit({ ...values, images })
    form.reset(nurseryDefaults())
    setImages([])
  }

  function syncLineCount(type: 'long' | 'trans', nextCount: number) {
    const fieldArray = type === 'long' ? longLines : transLines
    const current = fieldArray.fields.length

    if (nextCount > current) {
      Array.from({ length: nextCount - current }).forEach(() => fieldArray.append(lineDefaults()))
    } else if (nextCount < current) {
      for (let index = current - 1; index >= nextCount; index--) fieldArray.remove(index)
    }
  }

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <SectionHeading icon={nursery ? Edit3 : Sprout} title={nursery ? `تعديل المشتل: ${nursery.name}` : 'إضافة مشتل جديد'} />
      <form onSubmit={form.handleSubmit(submit)} className="space-y-6" noValidate>
        <div className="grid gap-4 lg:grid-cols-2">
          <FormField label="اسم المشتل" error={form.formState.errors.name?.message}>
            <TextInput {...form.register('name')} placeholder="مثال: المشتل الرئيسي" />
          </FormField>
          <FormField label="صور المشتل">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => setImages(Array.from(event.target.files ?? []))}
              className="min-h-11 w-full rounded-xl border border-line bg-surface-muted px-3 py-2 text-sm font-medium text-ink file:ml-3 file:rounded-lg file:border-0 file:bg-action-primary file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white"
            />
          </FormField>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <FormField label="الطول" error={form.formState.errors.length?.message}>
            <NumberInput step="0.01" {...form.register('length')} />
          </FormField>
          <FormField label="العرض" error={form.formState.errors.width?.message}>
            <NumberInput step="0.01" {...form.register('width')} />
          </FormField>
          <FormField label="المساحة">
            <NumberInput value={area.toFixed(2)} readOnly className="bg-surface-subtle" />
          </FormField>
        </div>

        <div className="rounded-2xl border border-line bg-surface-subtle p-4">
          <SectionHeading icon={Waves} title="شبكة الري الرئيسية" />
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="عدد الخطوط الطولية">
              <NumberInput min={0} value={longLines.fields.length} onChange={(event) => syncLineCount('long', Number(event.target.value))} />
            </FormField>
            <FormField label="عدد الخطوط العرضية">
              <NumberInput min={0} value={transLines.fields.length} onChange={(event) => syncLineCount('trans', Number(event.target.value))} />
            </FormField>
          </div>

          <LineFields title="الخطوط الطولية" name="long_lines" fields={longLines.fields} form={form} options={options} />
          <LineFields title="الخطوط العرضية" name="trans_lines" fields={transLines.fields} form={form} options={options} />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <FormField label="عدد الآبار" error={form.formState.errors.num_wells?.message}>
            <NumberInput {...form.register('num_wells')} />
          </FormField>
          <FormField label="عدد مكائن الآبار" error={form.formState.errors.num_well_machines?.message}>
            <NumberInput {...form.register('num_well_machines')} />
          </FormField>
          <FormField label="طول خط البئر" error={form.formState.errors.well_line_length?.message}>
            <NumberInput step="0.01" {...form.register('well_line_length')} />
          </FormField>
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <ActionButton type="button" tone="neutral" onClick={onCancel}>
            إلغاء
          </ActionButton>
          <ActionButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {nursery ? 'تحديث' : 'حفظ'}
          </ActionButton>
        </div>
      </form>
    </section>
  )
}

function LineFields({
  title,
  name,
  fields,
  form,
  options,
}: {
  title: string
  name: 'long_lines' | 'trans_lines'
  fields: Array<{ id: string }>
  form: UseFormReturn<NurseryFormInput, unknown, NurseryFormValues>
  options: NurseryFieldOptionsDictionary
}) {
  if (fields.length === 0) return null

  return (
    <div className="mt-4 space-y-3">
      <h4 className="text-sm font-bold text-info">{title}</h4>
      {fields.map((field, index) => (
        <div key={field.id} className="rounded-2xl border border-line bg-surface p-4">
          <div className="mb-3 text-sm font-bold text-ink-soft">الخط #{index + 1}</div>
          <div className="grid gap-3 md:grid-cols-5">
            <FormField label="طول الخط">
              <NumberInput step="0.01" {...form.register(`${name}.${index}.length`)} />
            </FormField>
            <FormField label="مقاس الخط">
              <SelectInput {...form.register(`${name}.${index}.size`)}>
                <option value="">اختر المقاس</option>
                {options.pipe_size.map((option) => (
                  <option key={option.id} value={option.name}>
                    {option.name}
                  </option>
                ))}
              </SelectInput>
            </FormField>
            <FormField label="عدد المحابس">
              <NumberInput {...form.register(`${name}.${index}.num_valves`)} />
            </FormField>
            <FormField label="عدد الوصلات">
              <NumberInput {...form.register(`${name}.${index}.num_connections`)} />
            </FormField>
            <FormField label="عدد القسامات">
              <NumberInput {...form.register(`${name}.${index}.num_dividers`)} />
            </FormField>
          </div>
        </div>
      ))}
    </div>
  )
}

function LocationForm({
  nurseryId,
  onSubmit,
  isSubmitting,
}: {
  nurseryId: number
  onSubmit: (nurseryId: number, values: LocationFormValues) => Promise<void>
  isSubmitting: boolean
}) {
  const form = useForm<LocationFormInput, unknown, LocationFormValues>({
    resolver: zodResolver(locationSchema),
    defaultValues: { location_name: '' },
  })

  return (
    <form
      onSubmit={form.handleSubmit(async (values) => {
        await onSubmit(nurseryId, values)
        form.reset()
      })}
      className="my-4 flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 sm:flex-row"
      noValidate
    >
      <div className="flex-1">
        <TextInput {...form.register('location_name')} placeholder="اسم الموقع" />
        <FieldError message={form.formState.errors.location_name?.message} />
      </div>
      <ActionButton type="submit" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        حفظ
      </ActionButton>
    </form>
  )
}

function SectionForm({
  locationId,
  section,
  onCancel,
  onSubmit,
  isSubmitting,
}: {
  locationId: number
  section?: NurserySection
  onCancel: () => void
  onSubmit: (locationId: number, values: UpsertSectionPayload, section?: NurserySection) => Promise<void>
  isSubmitting: boolean
}) {
  const form = useForm<SectionFormInput, unknown, SectionFormValues>({
    resolver: zodResolver(sectionSchema),
    defaultValues: sectionDefaults(section),
  })

  return (
    <section className="my-4 rounded-2xl border border-line bg-surface p-5 shadow-sm md:mr-6">
      <SectionHeading icon={section ? Edit3 : Layers3} title={section ? `تعديل القسم: ${section.name}` : 'إضافة قسم جديد'} />
      <form
        onSubmit={form.handleSubmit(async (values) => {
          await onSubmit(locationId, values, section)
          form.reset(sectionDefaults())
        })}
        className="space-y-5"
        noValidate
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="اسم القسم" error={form.formState.errors.name?.message}>
            <TextInput {...form.register('name')} />
          </FormField>
          <FormField label="تاريخ الإنشاء" error={form.formState.errors.creation_date?.message}>
            <TextInput type="date" {...form.register('creation_date')} />
          </FormField>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="طول القسم (م)" error={form.formState.errors.length?.message}>
            <NumberInput step="0.01" {...form.register('length')} />
          </FormField>
          <FormField label="عرض القسم (م)" error={form.formState.errors.width?.message}>
            <NumberInput step="0.01" {...form.register('width')} />
          </FormField>
        </div>

        <div className="rounded-2xl border border-line bg-surface-subtle p-4">
          <SectionHeading icon={Grid3X3} title="الهيكل" />
          <div className="grid gap-4 md:grid-cols-3">
            <FormField label="عدد المداخل">
              <NumberInput {...form.register('num_entrances')} />
            </FormField>
            <FormField label="عرض المدخل (م)">
              <NumberInput step="0.01" {...form.register('entrance_width')} />
            </FormField>
            <FormField label="عدد الممرات">
              <NumberInput {...form.register('num_aisles')} />
            </FormField>
            <FormField label="عدد الأعمدة">
              <NumberInput {...form.register('num_columns')} />
            </FormField>
            <FormField label="ارتفاع العمود (م)">
              <NumberInput step="0.01" {...form.register('column_height')} />
            </FormField>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface-subtle p-4">
          <SectionHeading icon={Droplets} title="تفاصيل الري" />
          <div className="grid gap-4 md:grid-cols-3">
            <FormField label="عدد الخطوط الرئيسية">
              <NumberInput {...form.register('num_main_lines')} />
            </FormField>
            <FormField label="طول الخط الرئيسي">
              <NumberInput step="0.01" {...form.register('main_line_length')} />
            </FormField>
            <FormField label="حجم الخط الرئيسي">
              <TextInput {...form.register('main_line_size')} />
            </FormField>
            <FormField label="عدد الخطوط الفرعية">
              <NumberInput {...form.register('num_sub_lines')} />
            </FormField>
            <FormField label="طول الخط الفرعي">
              <NumberInput step="0.01" {...form.register('sub_line_length')} />
            </FormField>
            <FormField label="حجم الخط الفرعي">
              <TextInput {...form.register('sub_line_size')} />
            </FormField>
            <FormField label="عدد محابس الرئيسي">
              <NumberInput {...form.register('num_main_valves')} />
            </FormField>
            <FormField label="حجم محابس الرئيسي">
              <TextInput {...form.register('main_valve_size')} />
            </FormField>
            <FormField label="عدد محابس الفرعي">
              <NumberInput {...form.register('num_sub_valves')} />
            </FormField>
            <FormField label="حجم محابس الفرعي">
              <TextInput {...form.register('sub_valve_size')} />
            </FormField>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <ActionButton type="button" tone="neutral" onClick={onCancel}>
            إلغاء
          </ActionButton>
          <ActionButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {section ? 'تحديث' : 'حفظ'}
          </ActionButton>
        </div>
      </form>
    </section>
  )
}

function BasinForm({
  sectionId,
  basin,
  options,
  onCancel,
  onSubmit,
  isSubmitting,
}: {
  sectionId: number
  basin?: NurseryBasin
  options: NurseryFieldOptionsDictionary
  onCancel: () => void
  onSubmit: (sectionId: number, values: UpsertBasinPayload, basin?: NurseryBasin) => Promise<void>
  isSubmitting: boolean
}) {
  const form = useForm<BasinFormInput, unknown, BasinFormValues>({
    resolver: zodResolver(basinSchema),
    defaultValues: basinDefaults(basin),
  })
  const watched = useWatch({ control: form.control })
  const basinLength = Number(watched.length ?? 0)
  const basinWidth = Number(watched.width ?? 0)
  const potsPerPoint = Number(watched.pots_per_point ?? 1)
  const count = Number(watched.count ?? 1)
  const grid = calculateBasinGrid({
    length: basinLength,
    width: basinWidth,
    long_division: watched.long_division ?? '',
    trans_division: watched.trans_division ?? '',
    pots_per_point: potsPerPoint,
  })

  return (
    <section className="my-4 rounded-2xl border border-line bg-surface p-5 shadow-sm md:mr-12">
      <SectionHeading icon={basin ? Edit3 : Sprout} title={basin ? `تعديل الحوض: ${basin.name}` : 'إضافة أحواض جديدة'} />
      <form
        onSubmit={form.handleSubmit(async (values) => {
          await onSubmit(sectionId, { ...values, trees_long: grid.treesLong, trees_trans: grid.treesTrans }, basin)
          form.reset(basinDefaults())
        })}
        className="space-y-5"
        noValidate
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="الاسم الأساسي" error={form.formState.errors.base_name?.message}>
            <TextInput {...form.register('base_name')} />
          </FormField>
          {!basin ? (
            <FormField label="عدد الأحواض" error={form.formState.errors.count?.message}>
              <NumberInput min={1} {...form.register('count')} />
            </FormField>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="الطول (متر)">
            <NumberInput step="0.01" {...form.register('length')} />
          </FormField>
          <FormField label="العرض (متر)">
            <NumberInput step="0.01" {...form.register('width')} />
          </FormField>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <FormField label="التقسيم الطولي">
            <SelectInput {...form.register('long_division')}>
              <option value="">اختر التقسيم</option>
              {options.division_option.map((option) => (
                <option key={option.id} value={option.name}>
                  {option.name}
                </option>
              ))}
            </SelectInput>
          </FormField>
          <FormField label="التقسيم العرضي">
            <SelectInput {...form.register('trans_division')}>
              <option value="">اختر التقسيم</option>
              {options.division_option.map((option) => (
                <option key={option.id} value={option.name}>
                  {option.name}
                </option>
              ))}
            </SelectInput>
          </FormField>
          <FormField label="عدد المراكن لكل نقطة">
            <NumberInput min={1} {...form.register('pots_per_point')} />
          </FormField>
        </div>

        <div className="grid gap-3 rounded-2xl border border-line bg-surface-subtle p-4 sm:grid-cols-3">
          <StatItem label="الأشجار بالطول" value={formatNumber(grid.treesLong)} />
          <StatItem label="الأشجار بالعرض" value={formatNumber(grid.treesTrans)} />
          <StatItem label="الطاقة الإستيعابية للحوض" value={formatNumber(grid.capacity)} />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <FormField label="نوع الحوض">
            <SelectInput {...form.register('type')}>
              <option value="">اختر النوع</option>
              {options.basin_type.map((option) => (
                <option key={option.id} value={option.name}>
                  {option.name}
                </option>
              ))}
            </SelectInput>
          </FormField>
          <FormField label="المحتوى">
            <SelectInput {...form.register('content')}>
              <option value="">اختر المحتوى</option>
              {options.basin_content.map((option) => (
                <option key={option.id} value={option.name}>
                  {option.name}
                </option>
              ))}
            </SelectInput>
          </FormField>
          <FormField label="طريقة الري">
            <SelectInput {...form.register('irrigation_method')}>
              <option value="">اختر الطريقة</option>
              {options.irrigation_method.map((option) => (
                <option key={option.id} value={option.name}>
                  {option.name}
                </option>
              ))}
            </SelectInput>
          </FormField>
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <ActionButton type="button" tone="neutral" onClick={onCancel}>
            إلغاء
          </ActionButton>
          <ActionButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {basin ? 'تحديث' : `إضافة ${formatNumber(count)} أحواض`}
          </ActionButton>
        </div>
      </form>
    </section>
  )
}

export default function NurseryLocationsWorkspace() {
  const pathname = usePathname()
  const { data: layoutResponse, isLoading, error } = useNurseryLocations()
  const { data: fieldOptionsResponse } = useNurseryFieldOptions()
  const options = fieldOptionsResponse?.data ?? emptyDictionary
  const data = layoutResponse?.data

  const [openForm, setOpenForm] = useState<OpenForm>(null)
  const [editing, setEditing] = useState<Editing>(null)
  const [expandedNurseries, setExpandedNurseries] = useState<Set<number>>(new Set())
  const [expandedLocations, setExpandedLocations] = useState<Set<number>>(new Set())
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set())

  const createNursery = useCreateNurseryLayout()
  const updateNursery = useUpdateNurseryLayout()
  const deleteNursery = useDeleteNurseryLayout()
  const createLocation = useCreateNurseryLocation()
  const deleteLocation = useDeleteNurseryLocation()
  const createSection = useCreateNurserySection()
  const updateSection = useUpdateNurserySection()
  const deleteSection = useDeleteNurserySection()
  const createBasin = useCreateNurseryBasin()
  const updateBasin = useUpdateNurseryBasin()
  const deleteBasin = useDeleteNurseryBasin()
  const deletePlan = useDeleteIrrigationPlan()

  const busy =
    createNursery.isPending ||
    updateNursery.isPending ||
    createLocation.isPending ||
    createSection.isPending ||
    updateSection.isPending ||
    createBasin.isPending ||
    updateBasin.isPending

  const mutationError =
    createNursery.error ??
    updateNursery.error ??
    deleteNursery.error ??
    createLocation.error ??
    deleteLocation.error ??
    createSection.error ??
    updateSection.error ??
    deleteSection.error ??
    createBasin.error ??
    updateBasin.error ??
    deleteBasin.error ??
    deletePlan.error

  const pageContext = useMemo(() => {
    if (pathname.endsWith('/nursery/locations')) return 'المواقع'
    return 'المشتل'
  }, [pathname])

  function toggleSet(setter: React.Dispatch<React.SetStateAction<Set<number>>>, id: number) {
    setter((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function submitNursery(payload: UpsertNurseryPayload) {
    if (editing?.type === 'nursery') {
      await updateNursery.mutateAsync({ id: editing.nursery.id, payload })
    } else {
      await createNursery.mutateAsync(payload)
    }
    setOpenForm(null)
    setEditing(null)
  }

  async function submitSection(locationId: number, payload: UpsertSectionPayload, section?: NurserySection) {
    if (section) await updateSection.mutateAsync({ id: section.id, payload })
    else await createSection.mutateAsync({ ...payload, location_id: locationId })
    setOpenForm(null)
    setEditing(null)
  }

  async function submitBasin(sectionId: number, payload: UpsertBasinPayload, basin?: NurseryBasin) {
    if (basin) await updateBasin.mutateAsync({ id: basin.id, payload })
    else await createBasin.mutateAsync({ ...payload, section_id: sectionId })
    setOpenForm(null)
    setEditing(null)
  }

  return (
    <div className="space-y-6" dir="rtl">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 text-xs font-bold text-ink-muted">{pageContext}</div>
          <h1 className="text-2xl font-bold text-ink">إدارة المواقع والتنظيم</h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-ink-soft">
            هيكل المشاتل والمواقع والأقسام والأحواض وخطط الري كما هو معرف في النظام القديم.
          </p>
        </div>
        <ActionButton
          type="button"
          onClick={() => {
            setEditing(null)
            setOpenForm({ type: 'nursery' })
          }}
        >
          <Plus className="h-4 w-4" />
          إضافة مشتل جديد
        </ActionButton>
      </header>

      {mutationError ? (
        <div className="rounded-2xl border border-danger/20 bg-danger-soft p-4 text-sm font-bold text-danger">
          {getErrorMessage(mutationError)}
        </div>
      ) : null}

      {data ? (
        <div className="grid gap-4 xl:grid-cols-3">
          <StatCard title="الهيكل التنظيمي" icon={Grid3X3}>
            <StatItem label="المشاتل" value={formatNumber(data.global_stats.nurseries)} />
            <StatItem label="المواقع" value={formatNumber(data.global_stats.locations)} />
            <StatItem label="الأقسام" value={formatNumber(data.global_stats.sections)} />
            <StatItem label="الأحواض" value={formatNumber(data.global_stats.basins)} />
          </StatCard>
          <StatCard title="المساحات والطاقة" icon={LineChart}>
            <div className="col-span-2">
              <StatItem label="الطاقة الإستيعابية الكلية" value={formatNumber(data.global_stats.capacity)} unit="شجرة" />
            </div>
            <StatItem label="مساحة الأقسام" value={formatNumber(data.global_stats.sections_area, 0)} unit="م²" />
            <StatItem label="مساحة الأحواض" value={formatNumber(data.global_stats.basins_area, 0)} unit="م²" />
          </StatCard>
          <StatCard title="البنية التحتية" icon={Settings2}>
            <StatItem label="الأعمدة" value={formatNumber(data.global_stats.columns)} />
            <StatItem label="المحابس" value={formatNumber(data.global_stats.valves)} />
            <StatItem label="خطوط رئيسية" value={formatNumber(data.global_stats.main_lines)} />
            <StatItem label="خطوط فرعية" value={formatNumber(data.global_stats.sub_lines)} />
          </StatCard>
        </div>
      ) : null}

      {openForm?.type === 'nursery' ? (
        <NurseryForm
          nursery={editing?.type === 'nursery' ? editing.nursery : undefined}
          options={options}
          isSubmitting={busy}
          onCancel={() => {
            setOpenForm(null)
            setEditing(null)
          }}
          onSubmit={submitNursery}
        />
      ) : null}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-72 animate-skeleton-shimmer rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-danger/20 bg-danger-soft p-5 text-sm font-bold text-danger">
          {getErrorMessage(error)}
        </div>
      ) : data?.nurseries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center">
          <Sprout className="mx-auto h-12 w-12 text-ink-muted" />
          <h2 className="mt-4 text-lg font-bold text-ink">لا توجد مشاتل محفوظة</h2>
          <p className="mt-2 text-sm text-ink-soft">ابدأ بإضافة مشتل ثم أضف المواقع والأقسام والأحواض.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {data?.nurseries.map((nursery) => {
            const expanded = expandedNurseries.has(nursery.id)
            const imageUrl = buildAssetUrl(nursery.main_image)
            return (
              <article key={nursery.id} className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
                <div className="flex h-[250px] items-center justify-center border-b border-line bg-surface-subtle">
                  {imageUrl ? (
                    <img src={imageUrl} alt={`صورة ${nursery.name}`} className="h-full w-full object-cover" />
                  ) : (
                    <div className="text-center text-ink-muted">
                      <ImageIcon className="mx-auto h-12 w-12" />
                      <div className="mt-2 text-sm font-bold">لا توجد صور لعرضها</div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 border-b border-line bg-surface px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
                  <button
                    type="button"
                    onClick={() => toggleSet(setExpandedNurseries, nursery.id)}
                    className="flex min-w-0 items-center gap-3 text-right"
                  >
                    <ChevronDown className={`h-5 w-5 shrink-0 text-ink-muted transition-transform ${expanded ? 'rotate-180' : ''}`} />
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success-soft text-success-strong">
                      <Home className="h-5 w-5" />
                    </span>
                    <span className="truncate text-lg font-bold text-action-primary">{nursery.name}</span>
                  </button>

                  <div className="flex flex-wrap gap-2">
                    <IconButton
                      label="حذف"
                      tone="danger"
                      onClick={() => {
                        if (confirm('حذف المشتل؟')) deleteNursery.mutate(nursery.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </IconButton>
                    <IconButton
                      label="تعديل"
                      tone="blue"
                      onClick={() => {
                        setEditing({ type: 'nursery', nursery })
                        setOpenForm({ type: 'nursery' })
                      }}
                    >
                      <Edit3 className="h-4 w-4" />
                    </IconButton>
                    <ActionButton
                      type="button"
                      tone="neutral"
                      onClick={() => {
                        setExpandedNurseries((current) => new Set(current).add(nursery.id))
                        setOpenForm({ type: 'location', id: nursery.id })
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      إضافة موقع
                    </ActionButton>
                    <a
                      href={`/nursery/lines?nursery_id=${nursery.id}`}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm font-bold text-ink transition-colors transition-transform hover:bg-surface-muted active:scale-[0.98]"
                    >
                      <ListOrdered className="h-4 w-4 text-info" />
                      عرض الخطوط
                    </a>
                  </div>
                </div>

                {expanded ? (
                  <div className="space-y-4 p-5">
                    <MiniStats
                      stats={[
                        { label: 'الأبعاد', value: `${formatNumber(nursery.length, 2)}م × ${formatNumber(nursery.width, 2)}م` },
                        { label: 'المساحة', value: `${formatNumber(nursery.area, 2)} م²` },
                        { label: 'الآبار', value: formatNumber(nursery.num_wells) },
                        { label: 'مكائن الآبار', value: formatNumber(nursery.num_well_machines) },
                      ]}
                    />

                    {openForm?.type === 'location' && openForm.id === nursery.id ? (
                      <LocationForm
                        nurseryId={nursery.id}
                        isSubmitting={createLocation.isPending}
                        onSubmit={async (nurseryId, values) => {
                          await createLocation.mutateAsync({ nursery_id: nurseryId, location_name: values.location_name })
                          setOpenForm(null)
                        }}
                      />
                    ) : null}

                    {nursery.plans.map((plan) => (
                      <div key={plan.id} className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                        <div className="flex items-center gap-2 text-sm font-bold text-emerald-800">
                          <Droplets className="h-4 w-4" />
                          {plan.name}
                          <span className="rounded-full bg-white/70 px-2 py-1 text-xs text-emerald-700">{plan.components.length} مكونات</span>
                        </div>
                        <IconButton
                          label="حذف الخطة"
                          tone="danger"
                          onClick={() => {
                            if (confirm('حذف الخطة؟')) deletePlan.mutate(plan.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </IconButton>
                      </div>
                    ))}

                    {nursery.locations.map((location) => (
                      <LocationRow
                        key={location.id}
                        location={location}
                        expandedLocations={expandedLocations}
                        expandedSections={expandedSections}
                        openForm={openForm}
                        editing={editing}
                        options={options}
                        busy={busy}
                        onToggleLocation={(id) => toggleSet(setExpandedLocations, id)}
                        onToggleSection={(id) => toggleSet(setExpandedSections, id)}
                        onSetOpenForm={setOpenForm}
                        onSetEditing={setEditing}
                        onSubmitSection={submitSection}
                        onSubmitBasin={submitBasin}
                        onDeleteLocation={(id) => {
                          if (confirm('حذف الموقع؟')) deleteLocation.mutate(id)
                        }}
                        onDeleteSection={(id) => {
                          if (confirm('حذف القسم؟')) deleteSection.mutate(id)
                        }}
                        onDeleteBasin={(id) => {
                          if (confirm('حذف الحوض؟')) deleteBasin.mutate(id)
                        }}
                      />
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

function LocationRow({
  location,
  expandedLocations,
  expandedSections,
  openForm,
  editing,
  options,
  busy,
  onToggleLocation,
  onToggleSection,
  onSetOpenForm,
  onSetEditing,
  onSubmitSection,
  onSubmitBasin,
  onDeleteLocation,
  onDeleteSection,
  onDeleteBasin,
}: {
  location: NurseryLocation
  expandedLocations: Set<number>
  expandedSections: Set<number>
  openForm: OpenForm
  editing: Editing
  options: NurseryFieldOptionsDictionary
  busy: boolean
  onToggleLocation: (id: number) => void
  onToggleSection: (id: number) => void
  onSetOpenForm: React.Dispatch<React.SetStateAction<OpenForm>>
  onSetEditing: React.Dispatch<React.SetStateAction<Editing>>
  onSubmitSection: (locationId: number, values: UpsertSectionPayload, section?: NurserySection) => Promise<void>
  onSubmitBasin: (sectionId: number, values: UpsertBasinPayload, basin?: NurseryBasin) => Promise<void>
  onDeleteLocation: (id: number) => void
  onDeleteSection: (id: number) => void
  onDeleteBasin: (id: number) => void
}) {
  const expanded = expandedLocations.has(location.id)

  return (
    <div>
      <section className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <button type="button" onClick={() => onToggleLocation(location.id)} className="flex items-center gap-2 text-right">
            <ChevronDown className={`h-5 w-5 text-blue-700 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            <MapPin className="h-5 w-5 text-blue-700" />
            <span className="text-base font-bold text-blue-900">{location.name}</span>
          </button>
          <div className="flex flex-wrap gap-2">
            <IconButton label="حذف الموقع" tone="danger" onClick={() => onDeleteLocation(location.id)}>
              <Trash2 className="h-4 w-4" />
            </IconButton>
            <IconButton label="إضافة قسم" tone="blue" onClick={() => onSetOpenForm({ type: 'section', id: location.id })}>
              <Plus className="h-4 w-4" />
            </IconButton>
            <a
              href={`/nursery/lines?location_id=${location.id}`}
              title="عرض الخطوط"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-info transition-colors transition-transform hover:bg-white active:scale-[0.98]"
            >
              <ListOrdered className="h-4 w-4" />
            </a>
          </div>
        </div>
        <MiniStats
          stats={[
            { label: 'مجموع الأقسام', value: formatNumber(location.stats.total_sections) },
            { label: 'مجموع الأحواض', value: formatNumber(location.stats.total_basins) },
            { label: 'مساحة الأقسام', value: `${formatNumber(location.stats.total_area, 2)} م²` },
            { label: 'الطاقة الاستيعابية', value: formatNumber(location.stats.capacity) },
            { label: 'إجمالي الأعمدة', value: formatNumber(location.stats.total_columns) },
            { label: 'الخطوط الرئيسية', value: formatNumber(location.stats.total_main_lines) },
            { label: 'الخطوط الفرعية', value: formatNumber(location.stats.total_sub_lines) },
            { label: 'إجمالي المحابس', value: formatNumber(location.stats.total_valves) },
          ]}
        />
      </section>

      {expanded ? (
        <div className="mt-3 space-y-3">
          {openForm?.type === 'section' && openForm.id === location.id ? (
            <SectionForm
              locationId={location.id}
              section={editing?.type === 'section' && editing.locationId === location.id ? editing.section : undefined}
              isSubmitting={busy}
              onCancel={() => {
                onSetOpenForm(null)
                onSetEditing(null)
              }}
              onSubmit={onSubmitSection}
            />
          ) : null}

          {location.sections.map((section) => {
            const sectionExpanded = expandedSections.has(section.id)
            return (
              <div key={section.id}>
                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:mr-6">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <button type="button" onClick={() => onToggleSection(section.id)} className="flex items-center gap-2 text-right">
                      <ChevronDown className={`h-5 w-5 text-slate-600 transition-transform ${sectionExpanded ? 'rotate-180' : ''}`} />
                      <Layers3 className="h-5 w-5 text-slate-600" />
                      <span className="text-base font-bold text-slate-700">{section.name}</span>
                    </button>
                    <div className="flex flex-wrap gap-2">
                      <IconButton label="حذف القسم" tone="danger" onClick={() => onDeleteSection(section.id)}>
                        <Trash2 className="h-4 w-4" />
                      </IconButton>
                      <IconButton
                        label="تعديل القسم"
                        tone="blue"
                        onClick={() => {
                          onSetEditing({ type: 'section', section, locationId: location.id })
                          onSetOpenForm({ type: 'section', id: location.id })
                        }}
                      >
                        <Edit3 className="h-4 w-4" />
                      </IconButton>
                      <IconButton label="إضافة حوض" tone="green" onClick={() => onSetOpenForm({ type: 'basin', id: section.id })}>
                        <Plus className="h-4 w-4" />
                      </IconButton>
                      <a
                        href={`/nursery/lines?section_id=${section.id}`}
                        title="عرض الخطوط"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-info transition-colors transition-transform hover:bg-white active:scale-[0.98]"
                      >
                        <ListOrdered className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                  <MiniStats
                    stats={[
                      { label: 'مساحة القسم', value: `${formatNumber(section.stats.area, 2)} م²` },
                      { label: 'الأعمدة', value: formatNumber(section.num_columns) },
                      { label: 'الخطوط الرئيسية', value: formatNumber(section.num_main_lines) },
                      { label: 'الخطوط الفرعية', value: formatNumber(section.num_sub_lines) },
                      { label: 'المحابس', value: formatNumber(section.stats.valves) },
                      { label: 'الأحواض', value: formatNumber(section.stats.basin_count) },
                    ]}
                  />
                </section>

                {sectionExpanded ? (
                  <div className="mt-3 space-y-3">
                    {openForm?.type === 'basin' && openForm.id === section.id ? (
                      <BasinForm
                        sectionId={section.id}
                        basin={editing?.type === 'basin' && editing.sectionId === section.id ? editing.basin : undefined}
                        options={options}
                        isSubmitting={busy}
                        onCancel={() => {
                          onSetOpenForm(null)
                          onSetEditing(null)
                        }}
                        onSubmit={onSubmitBasin}
                      />
                    ) : null}

                    {section.basins.map((basin) => (
                      <section key={basin.id} className="rounded-2xl border border-l-blue-500 bg-surface p-4 shadow-sm md:mr-12">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div className="min-w-0">
                            <h4 className="truncate text-base font-bold text-ink">{basin.name}</h4>
                            <MiniStats
                              stats={[
                                { label: 'الأبعاد', value: `${formatNumber(basin.length, 2)}م × ${formatNumber(basin.width, 2)}م` },
                                { label: 'السعة', value: `${formatNumber(basin.capacity)} شجرة` },
                                { label: 'تقسيم', value: `${basin.long_division || '-'} طولي، ${basin.trans_division || '-'} عرضي` },
                                { label: 'مراكن', value: `${formatNumber(basin.pots_per_point)} لكل نقطة` },
                              ]}
                            />
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <IconButton label="حذف الحوض" tone="danger" onClick={() => onDeleteBasin(basin.id)}>
                              <Trash2 className="h-4 w-4" />
                            </IconButton>
                            <IconButton
                              label="تعديل الحوض"
                              tone="blue"
                              onClick={() => {
                                onSetEditing({ type: 'basin', basin, sectionId: section.id })
                                onSetOpenForm({ type: 'basin', id: section.id })
                              }}
                            >
                              <Edit3 className="h-4 w-4" />
                            </IconButton>
                            <a
                              href={`/nursery/lines?basin_id=${basin.id}`}
                              title="عرض الخطوط"
                              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-info transition-colors transition-transform hover:bg-info-soft active:scale-[0.98]"
                            >
                              <ListOrdered className="h-4 w-4" />
                            </a>
                          </div>
                        </div>
                      </section>
                    ))}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
