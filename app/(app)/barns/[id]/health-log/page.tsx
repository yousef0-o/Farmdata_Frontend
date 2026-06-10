'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  ArrowRight,
  Bot,
  ClipboardPlus,
  FileText,
  HeartPulse,
  Loader2,
  Pill,
  Printer,
  RefreshCcw,
  Thermometer,
  Waves,
} from 'lucide-react'
import { organizationApi } from '@/lib/api/organization'
import { useCreateVitalObservation, useVitalObservations } from '@/lib/hooks/useDailyOps'
import { useFlockMedicalRecords, useRerunMedicalRecordOcr } from '@/lib/hooks/useFlockMedical'
import type { Flock, FlockMedicalRecord, FlockVitalObservation } from '@/lib/types'

type VitalForm = {
  observation_date: string
  source_type: 'production' | 'breeding'
  water_intake_liters: string
  temperature_celsius: string
  humidity_percent: string
  weight_uniformity_percent: string
  ai_notes: string
}

const today = new Date().toISOString().slice(0, 10)
const fieldInputClass = 'min-h-11 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-action-primary'

export default function BarnHealthLogPage() {
  const { id } = useParams()
  const barnId = Number(id)

  const { data: barnRes, isLoading: isBarnLoading } = useQuery({
    queryKey: ['barn', barnId],
    queryFn: () => organizationApi.getBarn(barnId),
    enabled: Number.isFinite(barnId) && barnId > 0,
  })

  const barn = barnRes?.data
  const flocks = useMemo<Flock[]>(() => barn?.flocks || barn?.active_flocks || [], [barn?.active_flocks, barn?.flocks])
  const activeFlock = flocks.find((flock) => flock.status === 'active') ?? flocks[0]
  const flockId = activeFlock?.id ?? 0

  const { data: vitalRes, isLoading: isVitalsLoading } = useVitalObservations(flockId)
  const { data: medicalRes, isLoading: isMedicalLoading } = useFlockMedicalRecords(flockId)
  const createVital = useCreateVitalObservation(flockId)

  const vitals = vitalRes?.data ?? []
  const medicalRecords = medicalRes?.data ?? []
  const latestVital = vitals[0]
  const temperatureSeries = seriesFrom(vitals, 'temperature_celsius', 28)
  const humiditySeries = seriesFrom(vitals, 'humidity_percent', 60)

  const [form, setForm] = useState<VitalForm>({
    observation_date: today,
    source_type: 'production',
    water_intake_liters: '',
    temperature_celsius: '',
    humidity_percent: '',
    weight_uniformity_percent: '',
    ai_notes: '',
  })

  const currentSourceType = activeFlock?.flock_type === 'breeding' ? 'breeding' : form.source_type

  const updateForm = (field: keyof VitalForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const submitVital = (event: React.FormEvent) => {
    event.preventDefault()
    if (!flockId) return

    createVital.mutate({
      observation_date: form.observation_date,
      source_type: currentSourceType,
      water_intake_liters: nullableNumber(form.water_intake_liters),
      temperature_celsius: nullableNumber(form.temperature_celsius),
      humidity_percent: nullableNumber(form.humidity_percent),
      weight_uniformity_percent: nullableNumber(form.weight_uniformity_percent),
      ai_notes: form.ai_notes || null,
    })
  }

  if (isBarnLoading) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-action-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold text-ink-muted">Farmdata ERP</p>
            <h1 className="mt-1 text-2xl font-bold text-ink">السجل الصحي والتحليل البيئي</h1>
            <p className="mt-2 max-w-3xl text-sm text-ink-soft">
              {activeFlock ? `الفوج ${activeFlock.flock_number ?? activeFlock.id} داخل ${barn?.barn_name ?? barn?.name ?? 'الحظيرة'}` : 'لا يوجد فوج مرتبط بهذه الحظيرة.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/barns/${barnId}`}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface-muted px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:bg-surface-subtle hover:text-ink"
            >
              <ArrowRight className="h-4 w-4" />
              عودة للحظيرة
            </Link>
            {activeFlock && (
              <Link
                href={`/flocks/${activeFlock.id}/ai-report`}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-quick-purple-text px-4 py-2 text-sm font-bold text-ink-inverse shadow-[0_0_0_4px_rgba(147,51,234,0.12),0_12px_26px_rgba(147,51,234,0.22)] transition-colors hover:bg-[#7e22ce]"
              >
                <Bot className="h-4 w-4" />
                تحليل الذكاء الاصطناعي
              </Link>
            )}
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface-muted px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:bg-surface-subtle hover:text-ink"
            >
              <Printer className="h-4 w-4" />
              طباعة السجل
            </button>
          </div>
        </div>
      </header>

      {!activeFlock ? (
        <section className="rounded-2xl border border-line bg-surface p-8 text-center shadow-sm">
          <h2 className="text-lg font-bold text-ink">لا يوجد فوج نشط</h2>
          <p className="mt-2 text-sm text-ink-muted">اربط فوجا بالحظيرة قبل تسجيل المؤشرات الصحية أو الطبية.</p>
        </section>
      ) : (
        <>
          <section className="grid gap-4 xl:grid-cols-2">
            <AnalyticsChart
              title="مؤشر درجات الحرارة"
              metric={formatMetric(average(temperatureSeries), ' °م')}
              icon={Thermometer}
              data={temperatureSeries}
              min={20}
              max={42}
              color="#C2410C"
              caption="آخر قراءات المؤشرات الحيوية المسجلة"
            />
            <AnalyticsChart
              title="مؤشر الرطوبة النسبية"
              metric={formatMetric(average(humiditySeries), '%')}
              icon={Waves}
              data={humiditySeries}
              min={30}
              max={90}
              color="#2563EB"
              caption="الرطوبة المرتبطة بسجلات الفوج اليومية"
            />
          </section>

          <section className="grid gap-4 xl:grid-cols-[1fr_1.1fr]">
            <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-muted text-action-secondary">
                  <Activity className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-ink">المؤشرات الحيوية اليومية</h2>
                  <p className="mt-1 text-sm text-ink-muted">درجات الحرارة، الرطوبة، سحب المياه، انتظام الوزن، والملاحظات الطبية.</p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <VitalTile label="المياه" value={latestVital?.water_intake_liters ? `${latestVital.water_intake_liters} لتر` : 'غير محدث'} />
                <VitalTile label="الحرارة" value={latestVital?.temperature_celsius ? `${latestVital.temperature_celsius} °م` : 'غير محدث'} />
                <VitalTile label="الرطوبة" value={latestVital?.humidity_percent ? `${latestVital.humidity_percent}%` : 'غير محدث'} />
                <VitalTile label="انتظام الوزن" value={latestVital?.weight_uniformity_percent ? `${latestVital.weight_uniformity_percent}%` : 'غير محدث'} />
              </div>

              <form onSubmit={submitVital} className="mt-5 space-y-4 rounded-2xl border border-line bg-surface-subtle p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="التاريخ">
                    <input type="date" max={today} value={form.observation_date} onChange={(event) => updateForm('observation_date', event.target.value)} className={fieldInputClass} />
                  </Field>
                  <Field label="مصدر السجل">
                    <select value={currentSourceType} onChange={(event) => updateForm('source_type', event.target.value)} className={fieldInputClass}>
                      <option value="production">إنتاج</option>
                      <option value="breeding">تربية</option>
                    </select>
                  </Field>
                  <Field label="المياه باللتر">
                    <input type="number" min="0" step="any" value={form.water_intake_liters} onChange={(event) => updateForm('water_intake_liters', event.target.value)} className={fieldInputClass} />
                  </Field>
                  <Field label="الحرارة">
                    <input type="number" min="-10" max="60" step="any" value={form.temperature_celsius} onChange={(event) => updateForm('temperature_celsius', event.target.value)} className={fieldInputClass} />
                  </Field>
                  <Field label="الرطوبة">
                    <input type="number" min="0" max="100" step="any" value={form.humidity_percent} onChange={(event) => updateForm('humidity_percent', event.target.value)} className={fieldInputClass} />
                  </Field>
                  <Field label="انتظام الوزن">
                    <input type="number" min="0" max="100" step="any" value={form.weight_uniformity_percent} onChange={(event) => updateForm('weight_uniformity_percent', event.target.value)} className={fieldInputClass} />
                  </Field>
                </div>
                <Field label="ملاحظات الذكاء الاصطناعي أو الطبيب">
                  <textarea value={form.ai_notes} onChange={(event) => updateForm('ai_notes', event.target.value)} className={`${fieldInputClass} min-h-20`} />
                </Field>
                <button
                  type="submit"
                  disabled={createVital.isPending}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-action-primary px-4 py-2 text-sm font-bold text-ink-inverse transition-colors hover:bg-action-primary-hover disabled:opacity-50"
                >
                  {createVital.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                  تحديث المؤشرات
                </button>
              </form>
            </section>

            <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-muted text-action-secondary">
                    <HeartPulse className="h-5 w-5" />
                  </span>
                  <h2 className="text-lg font-bold text-ink">التاريخ المرضي والإجراءات</h2>
                </div>
                <Link
                  href={`/flocks/${activeFlock.id}`}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface-muted px-3 py-2 text-sm font-semibold text-ink-soft transition-colors hover:bg-surface-subtle hover:text-ink"
                >
                  <ClipboardPlus className="h-4 w-4" />
                  إدارة السجلات
                </Link>
              </div>

              <div className="mt-5 space-y-3">
                {isMedicalLoading ? (
                  <div className="flex min-h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-action-primary" /></div>
                ) : medicalRecords.length === 0 ? (
                  <EmptyState icon={Pill} title="لا توجد سجلات مرضية" text="سيظهر تسلسل الحالات والإجراءات البيطرية فور تسجيل أول حالة." />
                ) : (
                  medicalRecords.map((record) => (
                    <MedicalRecordRow key={record.id} flockId={activeFlock.id} record={record} />
                  ))
                )}
              </div>
            </section>
          </section>

          <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
            <h2 className="text-lg font-bold text-ink">سجل المؤشرات المسجلة</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 lg:hidden">
              {isVitalsLoading ? (
                <div className="rounded-2xl border border-line bg-surface-subtle px-4 py-8 text-center text-sm text-ink-muted">
                  جاري تحميل المؤشرات...
                </div>
              ) : vitals.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-line-strong bg-surface-subtle px-4 py-8 text-center text-sm text-ink-muted">
                  لا توجد مؤشرات مسجلة.
                </div>
              ) : (
                vitals.map((vital) => (
                  <article key={vital.id} className="rounded-2xl border border-line bg-surface-subtle p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-ink-muted">التاريخ</p>
                        <h3 className="mt-1 font-mono text-sm font-bold text-ink">{vital.observation_date}</h3>
                      </div>
                      <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-bold text-ink-soft">
                        {vital.source_type === 'production' ? 'إنتاج' : 'تربية'}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <VitalTile label="المياه" value={vital.water_intake_liters == null ? '-' : String(vital.water_intake_liters)} />
                      <VitalTile label="الحرارة" value={vital.temperature_celsius == null ? '-' : String(vital.temperature_celsius)} />
                      <VitalTile label="الرطوبة" value={vital.humidity_percent == null ? '-' : String(vital.humidity_percent)} />
                      <VitalTile label="انتظام الوزن" value={vital.weight_uniformity_percent == null ? '-' : String(vital.weight_uniformity_percent)} />
                      <div className="col-span-2">
                        <VitalTile label="ملاحظات" value={vital.ai_notes ?? '-'} />
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>

            <div className="mt-4 hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[720px] text-right text-sm">
                <thead className="border-b border-line bg-surface-subtle text-xs font-bold text-ink-muted">
                  <tr>
                    <th className="px-4 py-3">التاريخ</th>
                    <th className="px-4 py-3">المصدر</th>
                    <th className="px-4 py-3">المياه</th>
                    <th className="px-4 py-3">الحرارة</th>
                    <th className="px-4 py-3">الرطوبة</th>
                    <th className="px-4 py-3">انتظام الوزن</th>
                    <th className="px-4 py-3">ملاحظات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {isVitalsLoading ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-ink-muted">جاري تحميل المؤشرات...</td></tr>
                  ) : vitals.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-ink-muted">لا توجد مؤشرات مسجلة.</td></tr>
                  ) : (
                    vitals.map((vital) => (
                      <tr key={vital.id}>
                        <td className="px-4 py-3 font-mono">{vital.observation_date}</td>
                        <td className="px-4 py-3">{vital.source_type === 'production' ? 'إنتاج' : 'تربية'}</td>
                        <td className="px-4 py-3">{vital.water_intake_liters ?? '-'}</td>
                        <td className="px-4 py-3">{vital.temperature_celsius ?? '-'}</td>
                        <td className="px-4 py-3">{vital.humidity_percent ?? '-'}</td>
                        <td className="px-4 py-3">{vital.weight_uniformity_percent ?? '-'}</td>
                        <td className="px-4 py-3">{vital.ai_notes ?? '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function MedicalRecordRow({ flockId, record }: { flockId: number; record: FlockMedicalRecord }) {
  const [selectedPath, setSelectedPath] = useState('')
  const rerunOcr = useRerunMedicalRecordOcr(flockId, record.id)
  const attachments = record.attachments ?? []

  return (
    <article className="rounded-xl border border-line bg-surface-subtle p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-mono text-sm font-bold text-action-primary">{record.record_date}</p>
          <h3 className="mt-1 font-bold text-ink">{record.diagnosis || record.clinical_signs || 'سجل طبي'}</h3>
          <p className="mt-1 text-sm text-ink-muted">{record.notes || 'لا توجد ملاحظات إضافية.'}</p>
        </div>
        <span className="rounded-lg bg-surface px-3 py-1 text-xs font-bold text-ink-soft">{severityLabel(record.severity)}</span>
      </div>

      {record.medications?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {record.medications.map((med) => (
            <span key={med.id} className="rounded-lg bg-surface px-3 py-1 text-xs font-semibold text-ink-soft">
              {med.medicine_name}
            </span>
          ))}
        </div>
      )}

      {attachments.length > 0 && (
        <div className="mt-4 space-y-2">
          {attachments.map((attachment) => (
            <div key={attachment.path} className="flex flex-col gap-2 rounded-lg bg-surface px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
              <a href={attachment.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-action-primary">
                <FileText className="h-4 w-4" />
                {attachment.name}
              </a>
              <button
                type="button"
                onClick={() => {
                  setSelectedPath(attachment.path)
                  rerunOcr.mutate(attachment.path)
                }}
                disabled={rerunOcr.isPending && selectedPath === attachment.path}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line bg-surface-muted px-3 py-2 text-xs font-bold text-ink-soft transition-colors hover:bg-surface-subtle disabled:opacity-50"
              >
                {rerunOcr.isPending && selectedPath === attachment.path ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bot className="h-3.5 w-3.5" />}
                إعادة OCR
              </button>
            </div>
          ))}
        </div>
      )}
    </article>
  )
}

function AnalyticsChart({
  title,
  metric,
  caption,
  icon: Icon,
  data,
  min,
  max,
  color,
}: {
  title: string
  metric: string
  caption: string
  icon: React.ComponentType<{ className?: string }>
  data: number[]
  min: number
  max: number
  color: string
}) {
  const width = 640
  const height = 220
  const padding = 24
  const points = data.map((value, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(1, data.length - 1)
    const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)))
    const y = height - padding - normalized * (height - padding * 2)
    return `${x},${y}`
  })

  return (
    <article className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-muted text-action-primary">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-ink">{title}</h2>
            <p className="mt-1 text-sm text-ink-muted">{caption}</p>
          </div>
        </div>
        <span className="font-mono text-xl font-bold text-ink">{metric}</span>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-line bg-surface-subtle">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full" role="img" aria-label={title}>
          {[0, 1, 2, 3].map((line) => (
            <line key={line} x1={padding} x2={width - padding} y1={padding + line * 48} y2={padding + line * 48} stroke="var(--border-default)" strokeDasharray="4 6" />
          ))}
          <polyline points={points.join(' ')} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          {points.map((point) => {
            const [x, y] = point.split(',')
            return <circle key={point} cx={x} cy={y} r="5" fill="var(--surface)" stroke={color} strokeWidth="3" />
          })}
        </svg>
      </div>
    </article>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-ink-muted">{label}</span>
      {children}
    </label>
  )
}

function EmptyState({ icon: Icon, title, text }: { icon: React.ComponentType<{ className?: string }>; title: string; text: string }) {
  return (
    <div className="flex min-h-60 flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong bg-surface-subtle p-8 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface text-ink-muted">
        <Icon className="h-7 w-7" />
      </span>
      <h3 className="mt-4 text-base font-bold text-ink">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-ink-muted">{text}</p>
    </div>
  )
}

function VitalTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface-subtle px-4 py-3">
      <p className="text-xs font-bold text-ink-muted">{label}</p>
      <p className="mt-1 font-mono text-base font-bold text-ink">{value}</p>
    </div>
  )
}

function seriesFrom(vitals: FlockVitalObservation[], field: keyof FlockVitalObservation, fallback: number): number[] {
  const values = vitals
    .slice(0, 8)
    .reverse()
    .map((vital) => Number(vital[field] ?? NaN))
    .filter((value) => Number.isFinite(value))

  return values.length > 0 ? values : [fallback, fallback, fallback, fallback]
}

function average(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function formatMetric(value: number, suffix: string): string {
  if (!Number.isFinite(value)) return 'غير محدث'
  return `${value.toFixed(1)}${suffix}`
}

function nullableNumber(value: string): number | null {
  return value.trim() === '' ? null : Number(value)
}

function severityLabel(severity: FlockMedicalRecord['severity']): string {
  if (severity === 'high') return 'عالية'
  if (severity === 'medium') return 'متوسطة'
  return 'منخفضة'
}
