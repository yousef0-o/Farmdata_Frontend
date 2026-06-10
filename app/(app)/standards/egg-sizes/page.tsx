'use client'

import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, RotateCcw, Save, Settings } from 'lucide-react'
import { useEggStandards, useUpdateEggStandards } from '@/lib/hooks/useEggStandards'
import type { EggSizeStandard, EggSizeStandardUpdateRow } from '@/types/eggStandards'

type DraftStandard = {
  id: number
  size_code: string
  label_ar: string
  label_en: string
  weight_from: string
  weight_to: string
  avg_weight: string
  egg_weight_gram: string
  display_order: string
  is_active: boolean
}

const numericFields: Array<keyof Pick<DraftStandard, 'weight_from' | 'weight_to' | 'avg_weight' | 'egg_weight_gram' | 'display_order'>> = [
  'weight_from',
  'weight_to',
  'avg_weight',
  'egg_weight_gram',
  'display_order',
]

function toInputValue(value: string | number | null) {
  if (value === null || value === undefined) return ''
  return String(value)
}

function normalizeStandards(standards: EggSizeStandard[]): DraftStandard[] {
  return standards.map((standard) => ({
    id: standard.id,
    size_code: standard.size_code,
    label_ar: standard.label_ar,
    label_en: standard.label_en,
    weight_from: toInputValue(standard.weight_from),
    weight_to: toInputValue(standard.weight_to),
    avg_weight: toInputValue(standard.avg_weight),
    egg_weight_gram: toInputValue(standard.egg_weight_gram),
    display_order: toInputValue(standard.display_order),
    is_active: standard.is_active,
  }))
}

function decimalOrNull(value: string) {
  if (value.trim() === '') return null
  return Number(value)
}

function decimalRequired(value: string) {
  return Number(value)
}

function formatError(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message
  }

  return 'تعذر حفظ معايير أوزان البيض.'
}

function buildPayload(rows: DraftStandard[]): EggSizeStandardUpdateRow[] {
  return rows.map((row) => ({
    id: row.id,
    weight_from: decimalOrNull(row.weight_from),
    weight_to: decimalOrNull(row.weight_to),
    avg_weight: decimalOrNull(row.avg_weight),
    egg_weight_gram: decimalRequired(row.egg_weight_gram),
    display_order: Number.parseInt(row.display_order, 10),
    is_active: row.is_active,
  }))
}

function validateRows(rows: DraftStandard[]) {
  const errors: string[] = []

  rows.forEach((row) => {
    if (row.egg_weight_gram.trim() === '' || !Number.isFinite(Number(row.egg_weight_gram)) || Number(row.egg_weight_gram) <= 0) {
      errors.push(`${row.label_ar}: وزن البيضة مطلوب ويجب أن يكون أكبر من صفر.`)
    }

    if (row.display_order.trim() === '' || !Number.isInteger(Number(row.display_order)) || Number(row.display_order) < 0) {
      errors.push(`${row.label_ar}: ترتيب العرض يجب أن يكون رقماً صحيحاً موجباً.`)
    }

    numericFields.forEach((field) => {
      const value = row[field]
      if (value.trim() !== '' && !Number.isFinite(Number(value))) {
        errors.push(`${row.label_ar}: قيمة ${field} غير رقمية.`)
      }
    })

    const from = decimalOrNull(row.weight_from)
    const to = decimalOrNull(row.weight_to)
    if (from !== null && to !== null && to < from) {
      errors.push(`${row.label_ar}: الوزن إلى لا يمكن أن يكون أقل من الوزن من.`)
    }
  })

  return errors
}

function StandardsForm({ initialStandards }: { initialStandards: EggSizeStandard[] }) {
  const router = useRouter()
  const updateMutation = useUpdateEggStandards()
  const initialRows = useMemo(() => normalizeStandards(initialStandards), [initialStandards])
  const [rows, setRows] = useState<DraftStandard[]>(initialRows)
  const [savedRows, setSavedRows] = useState<DraftStandard[]>(initialRows)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [successMessage, setSuccessMessage] = useState('')

  const hasChanges = JSON.stringify(rows) !== JSON.stringify(savedRows)
  const activeCount = rows.filter((row) => row.is_active).length

  const updateRow = (id: number, patch: Partial<DraftStandard>) => {
    setSuccessMessage('')
    setValidationErrors([])
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)))
  }

  const resetRows = () => {
    setRows(savedRows)
    setValidationErrors([])
    setSuccessMessage('')
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSuccessMessage('')

    const errors = validateRows(rows)
    if (errors.length > 0) {
      setValidationErrors(errors)
      return
    }

    setValidationErrors([])
    const response = await updateMutation.mutateAsync(buildPayload(rows))
    const persistedRows = normalizeStandards(response.data)
    setRows(persistedRows)
    setSavedRows(persistedRows)
    setSuccessMessage(response.message)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" dir="rtl">
      <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-muted text-action-primary">
              <Settings className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-bold text-ink-muted">Standards</p>
              <h1 className="mt-1 text-2xl font-bold text-ink">إعدادات معايير أوزان البيض</h1>
              <p className="mt-1 max-w-3xl text-sm text-ink-muted">
                هذه القيم تستخدم في حساب وزن البيض، إجمالي الوزن بالطن، وبعض مؤشرات الإنتاج في الداشبورد وتقارير الشركة والمشروع والقسم.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-xl bg-surface-muted px-3 py-2 text-xs font-bold text-ink-soft">
              {activeCount} نشط من {rows.length}
            </span>
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-bold text-ink-soft transition-colors hover:bg-surface-muted hover:text-ink"
            >
              <ArrowRight className="h-4 w-4" />
              رجوع
            </button>
          </div>
        </div>
      </section>

      {validationErrors.length > 0 ? (
        <section className="rounded-2xl border border-danger/30 bg-danger-soft p-4 text-danger-strong">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <h2 className="text-sm font-bold">راجع القيم قبل الحفظ</h2>
              <ul className="mt-2 space-y-1 text-xs">
                {validationErrors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ) : null}

      {updateMutation.isError ? (
        <section className="rounded-2xl border border-danger/30 bg-danger-soft p-4 text-sm font-bold text-danger-strong">
          {formatError(updateMutation.error)}
        </section>
      ) : null}

      {successMessage ? (
        <section className="flex items-center gap-3 rounded-2xl border border-success/30 bg-success-soft p-4 text-sm font-bold text-success-strong">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          {successMessage}
        </section>
      ) : null}

      <section className="hidden overflow-hidden rounded-2xl border border-line bg-surface shadow-sm lg:block">
        <table className="w-full border-collapse text-right text-sm">
          <thead className="bg-surface-subtle text-xs font-bold text-ink-muted">
            <tr>
              <th className="px-4 py-3">رمز الحجم</th>
              <th className="px-4 py-3">الوزن من (جم)</th>
              <th className="px-4 py-3">الوزن إلى (جم)</th>
              <th className="px-4 py-3">متوسط الوزن (جم)</th>
              <th className="px-4 py-3">وزن البيضة (جم)</th>
              <th className="px-4 py-3">ترتيب العرض</th>
              <th className="px-4 py-3">نشط</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id} className={`border-t border-line ${index % 2 === 0 ? 'bg-surface' : 'bg-surface-subtle/60'}`}>
                <td className="px-4 py-3">
                  <div className="font-bold text-ink">{row.label_ar}</div>
                  <div className="font-mono text-xs text-ink-muted">{row.size_code}، {row.label_en}</div>
                </td>
                <td className="px-4 py-3">
                  <NumberInput value={row.weight_from} onChange={(value) => updateRow(row.id, { weight_from: value })} />
                </td>
                <td className="px-4 py-3">
                  <NumberInput value={row.weight_to} onChange={(value) => updateRow(row.id, { weight_to: value })} />
                </td>
                <td className="px-4 py-3">
                  <NumberInput value={row.avg_weight} onChange={(value) => updateRow(row.id, { avg_weight: value })} />
                </td>
                <td className="px-4 py-3">
                  <NumberInput required value={row.egg_weight_gram} onChange={(value) => updateRow(row.id, { egg_weight_gram: value })} />
                </td>
                <td className="px-4 py-3">
                  <NumberInput integer required value={row.display_order} onChange={(value) => updateRow(row.id, { display_order: value })} />
                </td>
                <td className="px-4 py-3">
                  <Toggle checked={row.is_active} onChange={(checked) => updateRow(row.id, { is_active: checked })} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="grid grid-cols-1 gap-3 lg:hidden">
        {rows.map((row) => (
          <article key={row.id} className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-ink">{row.label_ar}</h2>
                <p className="font-mono text-xs text-ink-muted">{row.size_code}، {row.label_en}</p>
              </div>
              <Toggle checked={row.is_active} onChange={(checked) => updateRow(row.id, { is_active: checked })} />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="الوزن من (جم)">
                <NumberInput value={row.weight_from} onChange={(value) => updateRow(row.id, { weight_from: value })} />
              </Field>
              <Field label="الوزن إلى (جم)">
                <NumberInput value={row.weight_to} onChange={(value) => updateRow(row.id, { weight_to: value })} />
              </Field>
              <Field label="متوسط الوزن (جم)">
                <NumberInput value={row.avg_weight} onChange={(value) => updateRow(row.id, { avg_weight: value })} />
              </Field>
              <Field label="وزن البيضة (جم)">
                <NumberInput required value={row.egg_weight_gram} onChange={(value) => updateRow(row.id, { egg_weight_gram: value })} />
              </Field>
              <Field label="ترتيب العرض">
                <NumberInput integer required value={row.display_order} onChange={(value) => updateRow(row.id, { display_order: value })} />
              </Field>
            </div>
          </article>
        ))}
      </section>

      <section className="sticky bottom-4 z-20 rounded-2xl border border-line bg-surface/95 p-4 shadow-lg">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-semibold text-ink-muted">
            {hasChanges ? 'هناك تغييرات غير محفوظة.' : 'لا توجد تغييرات غير محفوظة.'}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={resetRows}
              disabled={!hasChanges || updateMutation.isPending}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-bold text-ink-soft transition-colors hover:bg-surface-muted hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              إلغاء التغييرات
            </button>
            <button
              type="submit"
              disabled={!hasChanges || updateMutation.isPending}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-action-primary px-5 text-sm font-bold text-ink-inverse transition-colors hover:bg-action-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              حفظ التعديلات
            </button>
          </div>
        </div>
      </section>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1">
      <span className="text-xs font-bold text-ink-muted">{label}</span>
      {children}
    </label>
  )
}

function NumberInput({
  value,
  onChange,
  required = false,
  integer = false,
}: {
  value: string
  onChange: (value: string) => void
  required?: boolean
  integer?: boolean
}) {
  return (
    <input
      type="number"
      step={integer ? 1 : 0.01}
      min={0}
      required={required}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-11 w-full rounded-xl border border-line bg-surface px-3 text-left font-mono text-sm text-ink outline-none transition-colors focus:border-action-primary focus:bg-surface-muted"
      dir="ltr"
    />
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className={`inline-flex h-11 w-[4.5rem] items-center rounded-full p-1 transition-colors ${
        checked ? 'bg-success' : 'bg-line-strong'
      }`}
    >
      <span
        className={`h-9 w-9 rounded-full bg-surface shadow-sm transition-transform ${
          checked ? '-translate-x-7' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

export default function EggSizeStandardsPage() {
  const standardsQuery = useEggStandards()

  if (standardsQuery.isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-action-primary" />
      </div>
    )
  }

  if (standardsQuery.isError) {
    return (
      <section className="rounded-2xl border border-danger/30 bg-danger-soft p-5 text-danger-strong" dir="rtl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div>
              <h1 className="text-sm font-bold">تعذر تحميل معايير أوزان البيض</h1>
              <p className="text-xs">لم تصل بيانات المعايير من الخادم.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => standardsQuery.refetch()}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-danger/30 bg-surface px-4 text-sm font-bold text-danger-strong transition-colors hover:bg-danger-soft"
          >
            إعادة المحاولة
          </button>
        </div>
      </section>
    )
  }

  return <StandardsForm initialStandards={standardsQuery.data?.data ?? []} />
}
