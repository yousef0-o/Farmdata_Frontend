'use client'

import Link from 'next/link'
import React, { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  FlaskConical,
  Loader2,
  RefreshCw,
  Scissors,
  Trees,
  Waves,
} from 'lucide-react'
import { nurseryManagementApi } from '@/lib/api/nurseryManagement'
import type { ApiError } from '@/lib/types'
import type {
  NurseryGeneralOperationContextType,
  NurseryGeneralOperationType,
} from '@/lib/types/nurseryManagement'

const today = () => new Date().toISOString().slice(0, 10)

const operationLabels: Record<NurseryGeneralOperationType, string> = {
  irrigation: 'ري',
  fertilization: 'تسميد',
  cleaning: 'تنظيف',
  pruning: 'تقليم',
}

const contextLabels: Record<NurseryGeneralOperationContextType, string> = {
  nursery: 'المشتل',
  location: 'الموقع',
  section: 'القسم',
}

function apiErrorMessage(error: unknown, fallback: string) {
  if (!error || typeof error !== 'object') return fallback
  const apiError = error as ApiError
  if (typeof apiError.message === 'string' && apiError.message.trim()) return apiError.message
  if (apiError.errors) {
    const first = Object.values(apiError.errors)[0]
    if (first?.[0]) return first[0]
  }
  return fallback
}

function formatNumber(value: number | null | undefined, digits = 0) {
  return new Intl.NumberFormat('ar-EG', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(Number(value ?? 0))
}

function Button({
  children,
  tone = 'primary',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: 'primary' | 'neutral' | 'green'
}) {
  const toneClass = {
    primary: 'bg-[#c2410c] text-white hover:bg-[#9a3412]',
    neutral:
      'border border-slate-100 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900',
    green: 'bg-emerald-600 text-white hover:bg-emerald-700',
  }[tone]

  return (
    <button
      {...props}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${toneClass} ${props.className ?? ''}`}
    >
      {children}
    </button>
  )
}

function TextField({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">
        {label}
      </span>
      <input
        {...props}
        className="min-h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition-colors focus:border-[#c2410c] focus:bg-white focus:ring-2 focus:ring-orange-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
      />
    </label>
  )
}

function SelectField({
  label,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">
        {label}
      </span>
      <select
        {...props}
        className="min-h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition-colors focus:border-[#c2410c] focus:bg-white focus:ring-2 focus:ring-orange-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
      >
        {children}
      </select>
    </label>
  )
}

function OperationOption({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean
  icon: typeof Waves
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-20 items-center gap-3 rounded-xl border px-4 py-3 text-right transition-colors ${
        active
          ? 'border-[#c2410c] bg-orange-50 text-[#c2410c] dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-300'
          : 'border-slate-100 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900'
      }`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-current ring-1 ring-slate-100 dark:bg-slate-950 dark:ring-slate-800">
        <Icon className="h-5 w-5" />
      </span>
      <span className="text-sm font-extrabold">{label}</span>
    </button>
  )
}

export default function NurseryGeneralOperationsWorkspace({
  contextType,
  contextId,
}: {
  contextType: NurseryGeneralOperationContextType | null
  contextId: number
}) {
  const queryClient = useQueryClient()
  const [operation, setOperation] = useState<NurseryGeneralOperationType | ''>('')
  const [date, setDate] = useState(today())
  const [dateTo, setDateTo] = useState('')
  const [period, setPeriod] = useState<'morning' | 'evening'>('morning')
  const [startTime, setStartTime] = useState('06:00')
  const [endTime, setEndTime] = useState('08:00')
  const [fertilizerId, setFertilizerId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [pruningDetail, setPruningDetail] = useState('تقليم جائر')
  const [successMessage, setSuccessMessage] = useState('')

  const hasValidContext = Boolean(contextType && Number.isInteger(contextId) && contextId > 0)
  const query = useQuery({
    queryKey: ['nursery-general-operations', contextType, contextId],
    enabled: hasValidContext,
    queryFn: () => nurseryManagementApi.generalOperationOptions(contextType!, contextId),
  })

  const data = query.data?.data
  const selectedFertilizer = useMemo(
    () => data?.fertilizers.find((item) => item.id === Number(fertilizerId)),
    [data?.fertilizers, fertilizerId]
  )
  const quantityPerBasin = Number(quantity || 0)
  const totalNeeded = quantityPerBasin * Number(data?.context.basin_count ?? 0)
  const fertilizerIsShort =
    operation === 'fertilization' &&
    Boolean(selectedFertilizer) &&
    quantityPerBasin > 0 &&
    totalNeeded > Number(selectedFertilizer?.quantity ?? 0)

  const mutation = useMutation({
    mutationFn: () =>
      nurseryManagementApi.createGeneralOperation({
        context_type: contextType!,
        context_id: contextId,
        operation: operation as NurseryGeneralOperationType,
        date,
        date_to: dateTo || null,
        period: operation === 'irrigation' ? period : null,
        start_time: operation === 'irrigation' ? startTime || null : null,
        end_time: operation === 'irrigation' ? endTime || null : null,
        fertilizer_id: operation === 'fertilization' ? Number(fertilizerId) : null,
        quantity: operation === 'fertilization' ? Number(quantity) : null,
        pruning_detail: operation === 'pruning' ? pruningDetail : null,
      }),
    onSuccess: async (response) => {
      setSuccessMessage(response.message)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['nursery-general-operations'] }),
        queryClient.invalidateQueries({ queryKey: ['nursery-management'] }),
      ])
    },
  })

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSuccessMessage('')
    if (!operation || !hasValidContext || !date) return
    mutation.mutate()
  }

  if (!hasValidContext) {
    return (
      <main dir="rtl" className="min-h-screen bg-[#f8fafc] px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-100 bg-red-50 p-5 text-sm font-bold text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          رابط العمليات العامة غير مكتمل.
        </div>
      </main>
    )
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#f8fafc] px-3 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-4 lg:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-xl bg-orange-50 px-3 py-1 text-xs font-bold text-[#c2410c] dark:bg-orange-950/40 dark:text-orange-300">
                <Activity className="h-4 w-4" />
                عمليات عامة
              </div>
              <h1 className="text-2xl font-bold text-slate-950 dark:text-slate-50">عمليات عامة</h1>
              {data ? (
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  تطبيق عملية على {contextLabels[data.context.type]}: {data.context.name}
                </p>
              ) : null}
            </div>
            <Link
              href="/nursery/manage"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-100 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              <ArrowRight className="h-4 w-4" />
              العودة
            </Link>
          </div>
        </header>

        {query.isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-20 animate-pulse rounded-2xl bg-white dark:bg-slate-900" />
            ))}
          </div>
        ) : query.error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {apiErrorMessage(query.error, 'تعذر تحميل بيانات العمليات العامة.')}
          </div>
        ) : data ? (
          <form
            onSubmit={submit}
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950"
          >
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
              <div>
                <div className="text-xs font-bold text-slate-500">النطاق المحدد</div>
                <div className="mt-1 text-base font-extrabold text-slate-950 dark:text-slate-50">
                  {contextLabels[data.context.type]}: {data.context.name}
                </div>
              </div>
              <span className="rounded-lg bg-emerald-50 px-3 py-1 font-mono text-sm font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                {formatNumber(data.context.basin_count)} حوض
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <OperationOption
                active={operation === 'irrigation'}
                icon={Waves}
                label={operationLabels.irrigation}
                onClick={() => setOperation('irrigation')}
              />
              <OperationOption
                active={operation === 'fertilization'}
                icon={FlaskConical}
                label={operationLabels.fertilization}
                onClick={() => setOperation('fertilization')}
              />
              <OperationOption
                active={operation === 'cleaning'}
                icon={Trees}
                label={operationLabels.cleaning}
                onClick={() => setOperation('cleaning')}
              />
              <OperationOption
                active={operation === 'pruning'}
                icon={Scissors}
                label={operationLabels.pruning}
                onClick={() => setOperation('pruning')}
              />
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <TextField
                label="التاريخ (من / البداية)"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
              />
              {operation === 'irrigation' || operation === 'cleaning' || operation === 'pruning' ? (
                <TextField
                  label="التاريخ (إلى / النهاية)"
                  type="date"
                  value={dateTo}
                  min={date}
                  onChange={(event) => setDateTo(event.target.value)}
                />
              ) : null}
            </div>

            {operation === 'irrigation' ? (
              <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="grid gap-4 md:grid-cols-3">
                  <SelectField
                    label="فترة الري"
                    value={period}
                    onChange={(event) => setPeriod(event.target.value as 'morning' | 'evening')}
                  >
                    <option value="morning">صبحية</option>
                    <option value="evening">مسائية</option>
                  </SelectField>
                  <TextField
                    label="من"
                    type="time"
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                  />
                  <TextField
                    label="إلى"
                    type="time"
                    value={endTime}
                    onChange={(event) => setEndTime(event.target.value)}
                  />
                </div>
              </div>
            ) : null}

            {operation === 'fertilization' ? (
              <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="grid gap-4 md:grid-cols-3">
                  <SelectField
                    label="نوع السماد (من المخزون)"
                    value={fertilizerId}
                    onChange={(event) => setFertilizerId(event.target.value)}
                    required
                  >
                    <option value="">اختر نوع السماد...</option>
                    {data.fertilizers.length ? (
                      data.fertilizers.map((fertilizer) => (
                        <option key={fertilizer.id} value={fertilizer.id}>
                          {fertilizer.name} (متوفر: {formatNumber(fertilizer.quantity, 2)} {fertilizer.unit ?? ''})
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        لا توجد أسمدة في المخزون
                      </option>
                    )}
                  </SelectField>
                  <TextField
                    label="الكمية (لكل حوض)"
                    type="number"
                    min={0.01}
                    step="0.01"
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                    required
                  />
                  <TextField
                    label="الوحدة"
                    value={selectedFertilizer?.unit ?? ''}
                    readOnly
                  />
                </div>
                {selectedFertilizer && quantityPerBasin > 0 ? (
                  <div
                    className={`mt-3 rounded-lg px-3 py-2 text-sm font-bold ${
                      fertilizerIsShort
                        ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                        : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                    }`}
                  >
                    المطلوب: {formatNumber(totalNeeded, 2)} {selectedFertilizer.unit ?? ''}، المتوفر:{' '}
                    {formatNumber(selectedFertilizer.quantity, 2)} {selectedFertilizer.unit ?? ''}
                  </div>
                ) : null}
              </div>
            ) : null}

            {operation === 'cleaning' ? (
              <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                سيتم تسجيل عملية تنظيف الحوض لكل الأحواض داخل النطاق المحدد.
              </div>
            ) : null}

            {operation === 'pruning' ? (
              <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <SelectField
                  label="نوع التقليم"
                  value={pruningDetail}
                  onChange={(event) => setPruningDetail(event.target.value)}
                >
                  <option value="تقليم جائر">تقليم جائر</option>
                  <option value="تقليم جوانب">تقليم جوانب</option>
                  <option value="تقليم سرطانات">تقليم سرطانات</option>
                  <option value="قص من الاعلي">قص من الاعلي</option>
                </SelectField>
              </div>
            ) : null}

            {successMessage ? (
              <div className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                {successMessage}
              </div>
            ) : null}
            {mutation.error ? (
              <div className="mt-5 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700 dark:bg-red-950/40 dark:text-red-300">
                {apiErrorMessage(mutation.error, 'تعذر تنفيذ العملية.')}
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Button type="button" tone="neutral" onClick={() => query.refetch()}>
                <RefreshCw className={`h-4 w-4 ${query.isFetching ? 'animate-spin' : ''}`} />
                تحديث البيانات
              </Button>
              <Button
                type="submit"
                tone="green"
                disabled={
                  !operation ||
                  data.context.basin_count === 0 ||
                  mutation.isPending ||
                  (operation === 'fertilization' && (!fertilizerId || !quantity || fertilizerIsShort))
                }
              >
                {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                تنفيذ العملية
              </Button>
            </div>
          </form>
        ) : null}
      </div>
    </main>
  )
}
