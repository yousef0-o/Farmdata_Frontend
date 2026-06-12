'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ClipboardList,
  Droplets,
  FlaskConical,
  History,
  Info,
  Layers3,
  Loader2,
  Plus,
  RefreshCw,
  Route,
  Settings,
  Sprout,
  Trash2,
  Waves,
  X,
} from 'lucide-react'

import { nurseryManagementApi } from '@/lib/api/nurseryManagement'
import AppDialog from '@/components/ui/AppDialog'
import type { ApiError } from '@/lib/types'
import type {
  NurseryCycle,
  NurseryCycleProcedure,
  NurseryCycleProcedureType,
  NurseryCycleTransfer,
  NurseryCycleTransferPayload,
  NurseryCycleProcedurePayload,
} from '@/lib/types/nurseryManagement'

const propagationLabels = {
  seeds: 'بذور',
  cuttings: 'عقل',
  grafting: 'تطعيم',
  layering: 'ترقيد',
}

const statusLabels = {
  active: 'نشط',
  completed: 'مكتمل',
  cancelled: 'ملغي',
}

function formatNumber(value: number | string | null, decimals = 0) {
  if (value === null || value === undefined) return '-'
  return new Intl.NumberFormat('ar-EG', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number(value))
}

function timeLabel(value: string | null) {
  if (!value) return ''
  const time = new Date(value).getTime()
  if (Number.isNaN(time)) return ''
  const diff = Math.max(0, Date.now() - time)
  const days = Math.floor(diff / 86400000)
  if (days > 0) return `منذ ${formatNumber(days)} يوم`
  const hours = Math.floor(diff / 3600000)
  if (hours > 0) return `منذ ${formatNumber(hours)} ساعة`
  return 'اليوم'
}

function today() {
  return new Date().toISOString().split('T')[0]
}

// Validation schemas
const transferLineSchema = z.object({
  basin_id: z.coerce.number().min(1, 'يجب اختيار الحوض'),
  line_number: z.coerce.number().min(1, 'يجب تحديد رقم الخط'),
  quantity: z.coerce.number().min(1, 'يجب تحديد الكمية'),
  pot_size: z.string().optional(),
  tree_height: z.coerce.number().min(0).optional(),
})

const transferSchema = z.object({
  successful_count: z.coerce.number().min(0, 'يجب تحديد عدد الشتلات الناجحة'),
  mark_remaining_failed: z.boolean().default(false),
  transfer_date: z.string().min(1, 'يجب تحديد تاريخ النقل'),
  lines: z.array(transferLineSchema).min(1, 'يجب إضافة خط نقل واحد على الأقل'),
})

const procedureSchema = z.object({
  procedure_type: z.enum(['irrigation', 'inspection', 'humidity']),
  procedure_date: z.string().min(1, 'يجب تحديد تاريخ الإجراء'),
  period: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  humidity_percentage: z.coerce.number().min(0).max(100).optional(),
  notes: z.string().optional(),
})

type TransferFormInput = z.input<typeof transferSchema>
type TransferFormValues = z.output<typeof transferSchema>

type ProcedureFormInput = z.input<typeof procedureSchema>
type ProcedureFormValues = z.output<typeof procedureSchema>

function Card({
  title,
  icon: Icon,
  children,
  className = '',
}: {
  title: string
  icon: typeof Info
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-2xl border border-slate-100 bg-white dark:bg-surface p-5 shadow-sm ${className}`}>
      <div className="mb-4 flex items-center gap-2 text-base font-extrabold text-slate-800 dark:text-slate-200">
        <Icon className="h-5 w-5 text-terracotta" />
        {title}
      </div>
      {children}
    </section>
  )
}

function InfoGrid({
  items,
}: {
  items: Array<{ label: string; value: React.ReactNode; danger?: boolean; accent?: string }>
}) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-slate-100 bg-slate-50 dark:bg-surface-subtle px-4 py-3 text-center"
        >
          <div className="text-xs font-bold text-slate-500">{item.label}</div>
          <div
            className={`mt-1 text-base font-extrabold ${
              item.danger ? 'text-red-600' : item.accent ?? 'text-slate-900 dark:text-slate-100'
            }`}
          >
            {item.value}
          </div>
        </div>
      ))}
    </div>
  )
}

function StatusBadge({ status }: { status: NurseryCycle['status'] }) {
  const meta = {
    active: { text: statusLabels.active, className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
    completed: { text: statusLabels.completed, className: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300' },
    cancelled: { text: statusLabels.cancelled, className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  }[status]

  return (
    <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold ${meta.className}`}>
      {meta.text}
    </span>
  )
}

function Button({
  children,
  tone = 'primary',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: 'primary' | 'neutral' | 'green' | 'danger'
}) {
  const toneClass = {
    primary: 'bg-terracotta text-white hover:bg-terracotta-hover',
    neutral: 'border border-slate-100 bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700/80',
    green: 'bg-emerald-600 text-white hover:bg-emerald-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  }[tone]

  return (
    <button
      {...props}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${toneClass} ${props.className ?? ''}`}
    >
      {children}
    </button>
  )
}

function TextField({
  label,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-400">
        {label}
      </span>
      <input
        {...props}
        className="min-h-11 w-full rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-surface-subtle px-3 py-2 text-sm font-semibold text-slate-900 dark:text-slate-100 outline-none transition-all focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-orange-100 dark:focus:bg-slate-950 dark:focus:ring-orange-950/20"
      />
      {error ? <p className="mt-1 text-xs font-bold text-red-600">{error}</p> : null}
    </label>
  )
}

function SelectField({
  label,
  error,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-400">
        {label}
      </span>
      <select
        {...props}
        className="min-h-11 w-full rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-surface-subtle px-3 py-2 text-sm font-semibold text-slate-900 dark:text-slate-100 outline-none transition-all focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-orange-100 dark:focus:bg-slate-950 dark:focus:ring-orange-950/20"
      >
        {children}
      </select>
      {error ? <p className="mt-1 text-xs font-bold text-red-600">{error}</p> : null}
    </label>
  )
}

export default function CycleManagementPage() {
  const params = useParams<{ id: string }>()
  const cycleId = Number(params.id)
  const queryClient = useQueryClient()
  const router = useRouter()
  const [dialog, setDialog] = useState<'transfer' | 'procedure' | null>(null)
  const [procedureType, setProcedureType] = useState<NurseryCycleProcedureType>('irrigation')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const query = useQuery({
    queryKey: ['nursery-cycle-dashboard', cycleId],
    queryFn: () => nurseryManagementApi.getCycle(cycleId),
    enabled: Number.isFinite(cycleId) && cycleId > 0,
  })

  const cycle: NurseryCycle | undefined = query.data?.data
  const options = (query.data as any)?.options

  const transferMutation = useMutation({
    mutationFn: (payload: NurseryCycleTransferPayload) =>
      nurseryManagementApi.createTransfer(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['nursery-cycle-dashboard', cycleId] })
      setDialog(null)
      setFeedback({ type: 'success', message: 'تم تسجيل عملية النقل بنجاح.' })
    },
    onError: (error: unknown) => {
      const apiError = error as ApiError
      const firstError = apiError.errors ? Object.values(apiError.errors)[0] : null
      setFeedback({
        type: 'error',
        message: Array.isArray(firstError) ? firstError[0] : apiError.message || 'فشل حفظ عملية النقل.',
      })
    },
  })

  const procedureMutation = useMutation({
    mutationFn: (payload: NurseryCycleProcedurePayload) =>
      nurseryManagementApi.createProcedure(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['nursery-cycle-dashboard', cycleId] })
      setDialog(null)
      setFeedback({ type: 'success', message: 'تم تسجيل الإجراء بنجاح.' })
    },
    onError: (error: unknown) => {
      const apiError = error as ApiError
      const firstError = apiError.errors ? Object.values(apiError.errors)[0] : null
      setFeedback({
        type: 'error',
        message: Array.isArray(firstError) ? firstError[0] : apiError.message || 'فشل حفظ الإجراء.',
      })
    },
  })

  const breadcrumbItems = useMemo(() => {
    if (!cycle) return []
    return [
      { label: 'الرئيسية', href: '/nursery/manage' },
      { label: cycle.basin?.name || 'الحوض', href: cycle.basin_id ? `/nursery/manage/basins/${cycle.basin_id}` : undefined },
      { label: `إدارة الدورة: ${cycle.name}`, current: true },
    ]
  }, [cycle])

  if (query.isLoading) {
    return (
      <main className="flex min-h-[55vh] items-center justify-center bg-background text-ink" dir="rtl">
        <Loader2 className="h-7 w-7 animate-spin text-terracotta" />
      </main>
    )
  }

  if (query.isError || !cycle) {
    return (
      <main className="bg-background p-4 text-ink sm:p-6 lg:p-8" dir="rtl">
        <section className="rounded-2xl border border-line bg-surface p-10 text-center shadow-sm">
          <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-red-600" />
          <h1 className="text-xl font-extrabold text-ink">لم يتم العثور على دورة الإنتاج</h1>
          <Link href="/nursery/manage" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface-muted px-5 text-sm font-bold text-ink-soft transition-colors hover:bg-surface-subtle">
            عودة للرئيسية
          </Link>
        </section>
      </main>
    )
  }

  const remainingQuantity = Number(cycle.count) - Number(cycle.total_transferred)

  return (
    <main className="bg-background px-4 py-5 text-ink sm:px-6 lg:px-8" dir="rtl">
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs font-bold text-ink-muted">
        {breadcrumbItems.map((item, index) => (
          <React.Fragment key={`${item.label}-${index}`}>
            {index > 0 ? <ChevronLeft className="h-3.5 w-3.5" /> : null}
            {item.href ? (
              <Link href={item.href} className="transition-colors hover:text-terracotta">
                {item.label}
              </Link>
            ) : (
              <span className={item.current ? 'text-terracotta' : ''}>{item.label}</span>
            )}
          </React.Fragment>
        ))}
      </nav>

      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">دورة الإنتاج: {cycle.name}</h1>
          <div className="mt-1 flex items-center gap-2">
            <StatusBadge status={cycle.status} />
            <span className="text-sm font-semibold text-ink-muted">
              {cycle.basin?.name || 'غير محدد'}
            </span>
          </div>
        </div>
        {cycle.basin_id ? (
          <Link
            href={`/nursery/manage/basins/${cycle.basin_id}`}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-surface px-4 text-sm font-bold text-ink-soft shadow-sm transition-[background-color,transform] duration-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 active:scale-[0.98]"
          >
            <ArrowRight className="h-4 w-4" />
            العودة للحوض
          </Link>
        ) : null}
      </header>

      {feedback ? (
        <div className={`mb-5 rounded-xl border px-4 py-3 text-sm font-bold flex flex-wrap items-center justify-between gap-3 ${feedback.type === 'success' ? 'border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300' : 'border-red-100 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300'}`}>
          <span>{feedback.message}</span>
          <button type="button" onClick={() => setFeedback(null)} className="text-sm font-semibold hover:opacity-85">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_350px]">
        <div className="space-y-6">
          <Card title="تفاصيل دورة الإنتاج" icon={Info}>
            <InfoGrid
              items={[
                { label: 'الصنف', value: cycle.variety_name || '-' },
                { label: 'العدد الأولي', value: formatNumber(cycle.count) },
                { label: 'الكمية المتبقية', value: formatNumber(remainingQuantity), danger: remainingQuantity <= 0 },
                { label: 'إجمالي المنقول', value: formatNumber(cycle.total_transferred), accent: 'text-terracotta' },
                { label: 'تاريخ البدء', value: cycle.start_date || '-' },
                { label: 'تاريخ الانتهاء', value: cycle.end_date || '-' },
                { label: 'المركن الأولي', value: cycle.pot_size || '-' },
                { label: 'طريقة الإكثار', value: cycle.propagation_type ? propagationLabels[cycle.propagation_type] : '-' },
                { label: 'المصدر', value: cycle.source || '-' },
              ]}
            />
          </Card>

          <Card title="سجل النقل وتوزيع الشتلات" icon={History}>
            {!cycle.transfers || cycle.transfers.length === 0 ? (
              <div className="py-6 text-center text-sm font-semibold text-ink-muted">لا توجد عمليات نقل مسجلة</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-right">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-surface-subtle">
                      <th className="px-4 py-3 text-xs font-bold text-slate-500">التاريخ</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500">الناجح</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500">نسبة الإنبات</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500">المنقول</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500">المتبقي للتوزيع</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500">التالف / الفاشل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {cycle.transfers.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-surface-subtle/40">
                        <td className="px-4 py-3 text-sm font-semibold">{t.transfer_date || '-'}</td>
                        <td className="px-4 py-3 text-sm font-bold font-mono">{formatNumber(t.successful_count)}</td>
                        <td className="px-4 py-3 text-sm font-bold font-mono">{t.germination_rate !== null ? `${formatNumber(t.germination_rate, 2)}%` : '-'}</td>
                        <td className="px-4 py-3 text-sm font-bold font-mono text-emerald-600">{formatNumber(t.transferred_count)}</td>
                        <td className="px-4 py-3 text-sm font-bold font-mono">{formatNumber(t.remaining_count)}</td>
                        <td className="px-4 py-3 text-sm font-bold font-mono text-red-500">{formatNumber(t.failed_count)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card title="سجل الإجراءات والنشاطات" icon={ClipboardList}>
            {!cycle.procedures || cycle.procedures.length === 0 ? (
              <div className="py-6 text-center text-sm font-semibold text-ink-muted">لا توجد إجراءات مسجلة</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-right">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-surface-subtle">
                      <th className="px-4 py-3 text-xs font-bold text-slate-500">نوع الإجراء</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500">التاريخ</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500">التفاصيل</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500">ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {cycle.procedures.map((p) => {
                      let typeLabelStr = ''
                      let typeColor = ''
                      if (p.procedure_type === 'irrigation') {
                        typeLabelStr = 'ري'
                        typeColor = 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300'
                      } else if (p.procedure_type === 'inspection') {
                        typeLabelStr = 'كشف'
                        typeColor = 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                      } else {
                        typeLabelStr = 'رطوبة'
                        typeColor = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                      }

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-surface-subtle/40">
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-bold ${typeColor}`}>
                              {typeLabelStr}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold">{p.procedure_date}</td>
                          <td className="px-4 py-3 text-sm font-semibold">
                            {p.procedure_type === 'irrigation' && (
                              <span>
                                {p.period || 'ري'} {p.start_time || p.end_time ? `(${p.start_time ?? ''} - ${p.end_time ?? ''})` : ''}
                              </span>
                            )}
                            {p.procedure_type === 'humidity' && (
                              <span>نسبة الرطوبة: {formatNumber(p.humidity_percentage, 2)}%</span>
                            )}
                            {p.procedure_type === 'inspection' && <span>تم الفحص والتحقق</span>}
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold text-slate-500 max-w-[200px] truncate" title={p.notes || ''}>
                            {p.notes || '-'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <aside className="space-y-6">
          <Card title="إجراءات سريعة" icon={Settings}>
            <div className="flex flex-col gap-3">
              <Button
                type="button"
                tone="primary"
                disabled={cycle.status !== 'active' || remainingQuantity <= 0}
                onClick={() => setDialog('transfer')}
              >
                <Route className="h-4 w-4" />
                نقل وتوزيع الشتلات
              </Button>

              <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

              <Button
                type="button"
                tone="neutral"
                disabled={cycle.status !== 'active'}
                onClick={() => {
                  setProcedureType('irrigation')
                  setDialog('procedure')
                }}
              >
                <Waves className="h-4 w-4 text-sky-500" />
                تسجيل ري الدورة
              </Button>

              <Button
                type="button"
                tone="neutral"
                disabled={cycle.status !== 'active'}
                onClick={() => {
                  setProcedureType('inspection')
                  setDialog('procedure')
                }}
              >
                <ClipboardList className="h-4 w-4 text-amber-500" />
                تسجيل كشف / معاينة
              </Button>

              <Button
                type="button"
                tone="neutral"
                disabled={cycle.status !== 'active'}
                onClick={() => {
                  setProcedureType('humidity')
                  setDialog('procedure')
                }}
              >
                <Droplets className="h-4 w-4 text-emerald-500" />
                تسجيل قياس الرطوبة
              </Button>
            </div>
          </Card>
        </aside>
      </div>

      {/* Transfer Dialog */}
      <TransferDialog
        open={dialog === 'transfer'}
        cycle={cycle}
        remaining={remainingQuantity}
        options={options}
        onClose={() => setDialog(null)}
        pending={transferMutation.isPending}
        onSave={(data) => transferMutation.mutate(data)}
      />

      {/* Procedure Dialog */}
      <ProcedureDialog
        open={dialog === 'procedure'}
        cycle={cycle}
        type={procedureType}
        onClose={() => setDialog(null)}
        pending={procedureMutation.isPending}
        onSave={(data) => procedureMutation.mutate(data)}
      />
    </main>
  )
}

// Subcomponents
function TransferDialog({
  open,
  cycle,
  remaining,
  options,
  onClose,
  pending,
  onSave,
}: {
  open: boolean
  cycle: NurseryCycle
  remaining: number
  options?: {
    basins: Array<{ id: number; name: string }>
    pot_sizes: string[]
  }
  onClose: () => void
  pending: boolean
  onSave: (payload: NurseryCycleTransferPayload) => void
}) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TransferFormInput, unknown, TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      successful_count: remaining,
      mark_remaining_failed: false,
      transfer_date: today(),
      lines: [{ basin_id: cycle.basin_id || 0, line_number: 1, quantity: remaining, pot_size: cycle.pot_size || '', tree_height: 0.1 }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lines',
  })

  const successfulCount = watch('successful_count')
  const lines = watch('lines') || []

  const transferredCount = useMemo(() => {
    return lines.reduce((sum, line) => sum + Number(line.quantity || 0), 0)
  }, [lines])

  const remainingCount = Math.max(0, Number(successfulCount || 0) - transferredCount)
  const germinationRate = cycle.count > 0 ? ((Number(successfulCount || 0) / cycle.count) * 100).toFixed(2) : '0.00'

  function handleSave(values: TransferFormValues) {
    onSave({
      cycle_id: cycle.id,
      successful_count: values.successful_count,
      mark_remaining_failed: values.mark_remaining_failed,
      transfer_date: values.transfer_date,
      lines: values.lines.map((line) => ({
        basin_id: line.basin_id,
        line_number: line.line_number,
        quantity: line.quantity,
        pot_size: line.pot_size || null,
        tree_height: line.tree_height || null,
      })),
    })
  }

  return (
    <AppDialog open={open} onClose={onClose} panelClassName="max-w-3xl">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-200">نقل وتوزيع الشتلات من دورة الإنبات</h2>
        <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800">
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit(handleSave)} className="mt-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="العدد الناجح من الشتلات"
            type="number"
            {...register('successful_count')}
            error={errors.successful_count?.message}
          />
          <TextField
            label="تاريخ النقل"
            type="date"
            {...register('transfer_date')}
            error={errors.transfer_date?.message}
          />
        </div>

        <div className="grid grid-cols-3 gap-3 rounded-xl bg-slate-50 dark:bg-surface-subtle p-4 text-center text-xs font-bold text-slate-600 dark:text-slate-400">
          <div>
            <span>نسبة الإنبات: </span>
            <span className="text-sm text-terracotta block mt-0.5">{germinationRate}%</span>
          </div>
          <div>
            <span>إجمالي المنقول: </span>
            <span className="text-sm text-emerald-600 block mt-0.5">{transferredCount} شتلة</span>
          </div>
          <div>
            <span>المتبقي للتوزيع: </span>
            <span className="text-sm text-slate-800 dark:text-slate-200 block mt-0.5">{remainingCount} شتلة</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">توزيع كميات الشتلات على الأحواض والخطوط</h3>
            <Button
              type="button"
              tone="neutral"
              className="min-h-8 px-2 py-1 text-xs"
              onClick={() => append({ basin_id: cycle.basin_id || 0, line_number: 1, quantity: remainingCount > 0 ? remainingCount : 1, pot_size: cycle.pot_size || '', tree_height: 0.1 })}
            >
              <Plus className="h-3.5 w-3.5" />
              إضافة خط توزيع
            </Button>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="grid gap-3 sm:grid-cols-[2fr_1.2fr_1.5fr_1.5fr_1.2fr_auto] items-end rounded-xl border border-slate-100 dark:border-slate-800 p-3 bg-white dark:bg-slate-900/50">
                <SelectField
                  label="الحوض المستهدف"
                  {...register(`lines.${index}.basin_id`)}
                  error={errors.lines?.[index]?.basin_id?.message}
                >
                  <option value="">اختر الحوض</option>
                  {options?.basins?.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </SelectField>

                <TextField
                  label="رقم الخط"
                  type="number"
                  {...register(`lines.${index}.line_number`)}
                  error={errors.lines?.[index]?.line_number?.message}
                />

                <TextField
                  label="الكمية"
                  type="number"
                  {...register(`lines.${index}.quantity`)}
                  error={errors.lines?.[index]?.quantity?.message}
                />

                <SelectField
                  label="المركن الجديد"
                  {...register(`lines.${index}.pot_size`)}
                  error={errors.lines?.[index]?.pot_size?.message}
                >
                  <option value="">لا يوجد تغيير</option>
                  {options?.pot_sizes?.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </SelectField>

                <TextField
                  label="ارتفاع الشتلة (م)"
                  type="number"
                  step="0.01"
                  {...register(`lines.${index}.tree_height`)}
                  error={errors.lines?.[index]?.tree_height?.message}
                />

                <button
                  type="button"
                  disabled={fields.length === 1}
                  className="mb-1 rounded-xl p-2.5 text-red-600 hover:bg-red-50 disabled:opacity-40 transition-colors"
                  onClick={() => remove(index)}
                  aria-label="حذف"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="mark_remaining_failed"
            type="checkbox"
            className="rounded border-slate-300 text-terracotta focus:ring-terracotta"
            {...register('mark_remaining_failed')}
          />
          <label htmlFor="mark_remaining_failed" className="text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer select-none">
            تحويل الكمية المتبقية للتوزيع ({remainingCount}) إلى غير ناجحة وتالفة
          </label>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
          <Button type="button" tone="neutral" onClick={onClose} disabled={pending}>
            إلغاء
          </Button>
          <Button type="submit" tone="green" disabled={pending || transferredCount > Number(successfulCount || 0)}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            تأكيد ونقل الشتلات
          </Button>
        </div>
      </form>
    </AppDialog>
  )
}

function ProcedureDialog({
  open,
  cycle,
  type,
  onClose,
  pending,
  onSave,
}: {
  open: boolean
  cycle: NurseryCycle
  type: NurseryCycleProcedureType
  onClose: () => void
  pending: boolean
  onSave: (payload: NurseryCycleProcedurePayload) => void
}) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProcedureFormInput, unknown, ProcedureFormValues>({
    resolver: zodResolver(procedureSchema),
    defaultValues: {
      procedure_type: type,
      procedure_date: today(),
      period: 'صباحية',
      start_time: '08:00',
      end_time: '09:00',
      humidity_percentage: 60,
      notes: '',
    },
  })

  React.useEffect(() => {
    if (open) {
      setValue('procedure_type', type)
      setValue('procedure_date', today())
    }
  }, [open, type, setValue])

  const titleStr = {
    irrigation: 'تسجيل عملية الري لدورة الإنبات',
    inspection: 'تسجيل كشف ومعاينة الدورة',
    humidity: 'تسجيل قياس الرطوبة في الدورة',
  }[type]

  return (
    <AppDialog open={open} onClose={onClose} panelClassName="max-w-xl">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-200">{titleStr}</h2>
        <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800">
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSave)} className="mt-4 space-y-4">
        <TextField
          label="تاريخ الإجراء"
          type="date"
          {...register('procedure_date')}
          error={errors.procedure_date?.message}
        />

        {type === 'irrigation' && (
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-400">
                فترة الري
              </span>
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 text-sm font-semibold cursor-pointer">
                  <input type="radio" value="صباحية" {...register('period')} className="text-terracotta focus:ring-terracotta" />
                  صباحية
                </label>
                <label className="flex items-center gap-1.5 text-sm font-semibold cursor-pointer">
                  <input type="radio" value="مسائية" {...register('period')} className="text-terracotta focus:ring-terracotta" />
                  مسائية
                </label>
              </div>
            </label>

            <div className="grid grid-cols-2 gap-4">
              <TextField
                label="من الساعة"
                type="time"
                {...register('start_time')}
                error={errors.start_time?.message}
              />
              <TextField
                label="إلى الساعة"
                type="time"
                {...register('end_time')}
                error={errors.end_time?.message}
              />
            </div>
          </div>
        )}

        {type === 'humidity' && (
          <TextField
            label="نسبة الرطوبة (%)"
            type="number"
            step="0.01"
            {...register('humidity_percentage')}
            error={errors.humidity_percentage?.message}
          />
        )}

        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-400">
            ملاحظات وتفاصيل إضافية
          </span>
          <textarea
            rows={3}
            {...register('notes')}
            className="w-full rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-surface-subtle px-3 py-2 text-sm font-semibold text-slate-900 dark:text-slate-100 outline-none transition-all focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-orange-100 dark:focus:bg-slate-950 dark:focus:ring-orange-950/20"
          />
        </label>

        <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
          <Button type="button" tone="neutral" onClick={onClose} disabled={pending}>
            إلغاء
          </Button>
          <Button type="submit" tone="primary" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            تأكيد وحفظ الإجراء
          </Button>
        </div>
      </form>
    </AppDialog>
  )
}
