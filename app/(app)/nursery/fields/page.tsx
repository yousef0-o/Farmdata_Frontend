'use client'

import React, { useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  Droplets,
  Grid2X2,
  Gauge,
  Layers3,
  Loader2,
  Plus,
  Rows3,
  Ruler,
  Settings2,
  Trash2,
} from 'lucide-react'
import {
  useCreateNurseryFieldOption,
  useDeleteNurseryFieldOption,
  useNurseryFieldOptions,
} from '@/lib/hooks/useNurseryFields'
import type { ApiError } from '@/lib/types'
import type {
  NurseryFieldOption,
  NurseryFieldOptionType,
  NurseryFieldOptionsDictionary,
} from '@/lib/types/nurseryFields'

const optionSchema = z.object({
  name: z.string().trim().min(1, 'اسم الخيار مطلوب'),
})

type OptionFormValues = z.infer<typeof optionSchema>

const optionTypes: Array<{
  type: NurseryFieldOptionType
  title: string
  description: string
  icon: typeof Grid2X2
}> = [
  {
    type: 'pot_size',
    title: 'مقاسات المراكن',
    description: 'مقاسات المراكن والحفر المستخدمة في التشغيل والإنتاج.',
    icon: Ruler,
  },
  {
    type: 'division_option',
    title: 'خيارات التقسيم',
    description: 'ثوابت التقسيم المستخدمة في حسابات سعة الحوض.',
    icon: Rows3,
  },
  {
    type: 'basin_type',
    title: 'أنواع الأحواض',
    description: 'تعريف أشكال وتصنيفات الأحواض داخل هيكل المشتل.',
    icon: Grid2X2,
  },
  {
    type: 'basin_content',
    title: 'محتويات الأحواض',
    description: 'قوائم محتوى الحوض المستخدمة عند بناء بيانات المواقع.',
    icon: Layers3,
  },
  {
    type: 'irrigation_method',
    title: 'طرق الري',
    description: 'طرق الري المتاحة لتخطيط تشغيل الأحواض.',
    icon: Droplets,
  },
  {
    type: 'valve_size',
    title: 'أحجام المحابس',
    description: 'أحجام المحابس المستخدمة في خطوط الري.',
    icon: Gauge,
  },
  {
    type: 'sprinkler_size',
    title: 'أحجام الرشاشات',
    description: 'تصنيفات أحجام الرشاشات المتاحة داخل المشتل.',
    icon: Droplets,
  },
  {
    type: 'pipe_size',
    title: 'أحجام المواسير',
    description: 'مقاسات خطوط الري الطولية والعرضية داخل المشتل.',
    icon: Ruler,
  },
  {
    type: 'hose_size',
    title: 'أحجام الليات',
    description: 'أحجام الليات المستخدمة في تمديدات الري.',
    icon: Ruler,
  },
]

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

function getErrorMessage(error: unknown) {
  const fallback = 'حدث خطأ أثناء تنفيذ العملية.'
  if (!error || typeof error !== 'object') return fallback

  const apiError = error as ApiError
  if (typeof apiError.message === 'string' && apiError.message.trim()) return apiError.message

  if (apiError.errors) {
    const firstFieldErrors = Object.values(apiError.errors)[0]
    if (firstFieldErrors && firstFieldErrors[0]) return firstFieldErrors[0]
  }

  return fallback
}

function FieldCardsSkeleton() {
  return (
    <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
      {Array.from({ length: optionTypes.length }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
          <div className="mb-5 flex items-start gap-3">
            <div className="h-11 w-11 animate-skeleton-shimmer rounded-2xl" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-32 animate-skeleton-shimmer rounded-lg" />
              <div className="h-4 w-56 max-w-full animate-skeleton-shimmer rounded-lg" />
            </div>
          </div>
          <div className="mb-5 flex gap-2">
            <div className="h-11 flex-1 animate-skeleton-shimmer rounded-xl" />
            <div className="h-11 w-11 animate-skeleton-shimmer rounded-xl" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, rowIndex) => (
              <div key={rowIndex} className="h-11 animate-skeleton-shimmer rounded-xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function OptionCard({
  type,
  title,
  description,
  icon: Icon,
  options,
  deletingId,
  onCreate,
  onDelete,
  isCreating,
}: {
  type: NurseryFieldOptionType
  title: string
  description: string
  icon: typeof Grid2X2
  options: NurseryFieldOption[]
  deletingId: number | null
  onCreate: (type: NurseryFieldOptionType, name: string) => Promise<void>
  onDelete: (option: NurseryFieldOption) => Promise<void>
  isCreating: boolean
}) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<OptionFormValues>({
    resolver: zodResolver(optionSchema),
    defaultValues: { name: '' },
  })

  const submit = handleSubmit(async (values) => {
    const nextName = values.name.trim()
    const duplicate = options.some((option) => option.name.trim() === nextName)

    if (duplicate) {
      setError('name', { type: 'manual', message: 'هذا الخيار موجود بالفعل في نفس القائمة' })
      return
    }

    await onCreate(type, nextName)
    reset()
  })

  return (
    <article className="flex min-h-[470px] flex-col rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <header className="mb-5 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[rgba(194,65,12,0.09)] text-action-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-ink">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-ink-soft">{description}</p>
        </div>
      </header>

      <form onSubmit={submit} className="mb-4" noValidate>
        <div className="flex gap-2">
          <input
            {...register('name')}
            type="text"
            placeholder="إضافة خيار جديد..."
            className="min-h-11 min-w-0 flex-1 rounded-xl border border-line bg-surface-muted px-4 py-2 text-sm font-medium text-ink outline-none transition-all placeholder:text-ink-muted focus:border-action-primary focus:bg-surface focus:ring-2 focus:ring-[var(--focus-ring)]"
            disabled={isSubmitting || isCreating}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={isSubmitting || isCreating}
            className="inline-flex min-h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            aria-label={`إضافة خيار إلى ${title}`}
          >
            {isSubmitting || isCreating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-5 w-5" />
            )}
          </button>
        </div>
        {errors.name?.message ? (
          <p className="mt-2 text-xs font-semibold text-danger">{errors.name.message}</p>
        ) : null}
      </form>

      <div className="mb-3 flex items-center justify-between border-t border-line pt-4">
        <span className="text-sm font-bold text-ink">القيم الحالية</span>
        <span className="rounded-full bg-surface-subtle px-3 py-1 text-xs font-semibold text-ink-soft">
          {options.length} خيار
        </span>
      </div>

      <div className="max-h-[300px] flex-1 space-y-2 overflow-y-auto pr-1">
        {options.length === 0 ? (
          <div className="flex min-h-32 items-center justify-center rounded-2xl border border-dashed border-line bg-surface-subtle px-4 text-center text-sm font-medium leading-6 text-ink-soft">
            لا توجد خيارات محفوظة في هذه القائمة.
          </div>
        ) : (
          options.map((option) => (
            <div
              key={option.id}
              className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-line bg-surface-subtle px-3 py-2 transition-all hover:border-line-strong"
            >
              <span className="min-w-0 flex-1 truncate text-right text-sm font-semibold text-ink">
                {option.name}
              </span>
              <button
                type="button"
                onClick={() => onDelete(option)}
                disabled={deletingId === option.id}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#ef4444] text-white transition-all hover:bg-[#dc2626] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                aria-label={`حذف ${option.name}`}
              >
                {deletingId === option.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          ))
        )}
      </div>
    </article>
  )
}

export default function NurseryFieldsPage() {
  const { data, isLoading, error } = useNurseryFieldOptions()
  const createMutation = useCreateNurseryFieldOption()
  const deleteMutation = useDeleteNurseryFieldOption()
  const [mutationError, setMutationError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const dictionary = useMemo(
    () => ({ ...emptyDictionary, ...(data?.data ?? {}) }),
    [data?.data]
  )

  const totalOptions = optionTypes.reduce((sum, item) => sum + dictionary[item.type].length, 0)

  const handleCreate = async (type: NurseryFieldOptionType, name: string) => {
    setMutationError(null)

    try {
      await createMutation.mutateAsync({ type, payload: { name } })
    } catch (createError) {
      setMutationError(getErrorMessage(createError))
      throw createError
    }
  }

  const handleDelete = async (option: NurseryFieldOption) => {
    if (!window.confirm(`هل تريد حذف "${option.name}"؟`)) return

    setMutationError(null)
    setDeletingId(option.id)

    try {
      await deleteMutation.mutateAsync(option.id)
    } catch (deleteError) {
      setMutationError(getErrorMessage(deleteError))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-action-primary text-white shadow-[0_16px_30px_rgba(194,65,12,0.18)]">
              <Settings2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-ink">إدارة الحقول العامة</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-soft">
                تهيئة القوائم المنسدلة والخيارات التشغيلية لجداول وهيكل المشتل
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
            <div className="rounded-2xl border border-line bg-surface-subtle px-4 py-3">
              <div className="text-xs font-semibold text-ink-muted">القوائم</div>
              <div className="mt-1 font-mono text-xl font-bold text-ink">{optionTypes.length}</div>
            </div>
            <div className="rounded-2xl border border-line bg-surface-subtle px-4 py-3">
              <div className="text-xs font-semibold text-ink-muted">إجمالي الخيارات</div>
              <div className="mt-1 font-mono text-xl font-bold text-emerald-700">{totalOptions}</div>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-danger-soft bg-danger-soft p-4 text-sm font-semibold text-danger-strong">
          {getErrorMessage(error)}
        </div>
      ) : null}

      {mutationError ? (
        <div className="rounded-2xl border border-danger-soft bg-danger-soft p-4 text-sm font-semibold text-danger-strong">
          {mutationError}
        </div>
      ) : null}

      {isLoading ? (
        <FieldCardsSkeleton />
      ) : (
        <section className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
          {optionTypes.map((item) => (
            <OptionCard
              key={item.type}
              type={item.type}
              title={item.title}
              description={item.description}
              icon={item.icon}
              options={dictionary[item.type]}
              deletingId={deletingId}
              onCreate={handleCreate}
              onDelete={handleDelete}
              isCreating={createMutation.isPending}
            />
          ))}
        </section>
      )}
    </div>
  )
}
