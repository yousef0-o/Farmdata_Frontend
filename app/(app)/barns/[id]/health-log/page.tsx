'use client'

import React from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  Activity,
  ArrowRight,
  Bot,
  ClipboardPlus,
  FilePlus2,
  HeartPulse,
  Pill,
  Printer,
  RefreshCcw,
  Thermometer,
  Waves,
} from 'lucide-react'

const temperatureSeries = [28, 29, 31, 30, 32, 30, 29, 31]
const humiditySeries = [58, 61, 64, 62, 66, 63, 60, 59]

export default function BarnHealthLogPage() {
  const { id } = useParams()
  const barnId = Number(id)

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold text-ink-muted">Farmdata ERP</p>
            <h1 className="mt-1 text-2xl font-bold text-ink">السجل الصحي والتحليل البيئي</h1>
            <p className="mt-2 max-w-3xl text-sm text-ink-soft">
              صفحة مستقلة لتحليل الأنماط البيئية، الإجراءات الطبية، التحصينات، والمؤشرات الحيوية اليومية.
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
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-quick-purple-text px-4 py-2 text-sm font-bold text-ink-inverse shadow-[0_0_0_4px_rgba(147,51,234,0.12),0_12px_26px_rgba(147,51,234,0.22)] transition-colors hover:bg-[#7e22ce]"
            >
              <Bot className="h-4 w-4" />
              بدء التحليل بالذكاء الاصطناعي
            </button>
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

      <section className="grid gap-4 xl:grid-cols-2">
        <AnalyticsChart
          title="مؤشر درجات الحرارة"
          metric="30.1 °م"
          icon={Thermometer}
          data={temperatureSeries}
          min={24}
          max={36}
          color="#C2410C"
          caption="متوسط آخر 8 قراءات تشغيلية"
        />
        <AnalyticsChart
          title="مؤشر الرطوبة النسبية"
          metric="61.6%"
          icon={Waves}
          data={humiditySeries}
          min={45}
          max={75}
          color="#2563EB"
          caption="استقرار الرطوبة داخل نطاق المراقبة"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <OperationalLogCard
          title="التاريخ المرضي والإجراءات"
          action="+ إضافة حالة"
          icon={HeartPulse}
          emptyTitle="لا توجد سجلات مرضية"
          emptyText="سيظهر تسلسل الحالات والإجراءات البيطرية فور تسجيل أول حالة."
        />
        <OperationalLogCard
          title="جدول الأدوية والتحصينات"
          action="+ إضافة دواء"
          icon={Pill}
          emptyTitle="لا توجد أدوية أو تحصينات"
          emptyText="اربط جرعات الأدوية والتحصينات بالفوج لمراقبة التكلفة والالتزام الزمني."
        />
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-muted text-action-secondary">
              <Activity className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-ink">المؤشرات الحيوية اليومية</h2>
              <p className="mt-1 text-sm text-ink-muted">تجميع سريع لدرجات الحرارة، الرطوبة، سحب المياه، انتظام الوزن، وحالة السحب الغذائي.</p>
            </div>
          </div>
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-action-primary px-4 py-2 text-sm font-bold text-ink-inverse transition-colors hover:bg-action-primary-hover"
          >
            <RefreshCcw className="h-4 w-4" />
            + تحديث المؤشرات
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <VitalTile label="المياه" value="0 لتر" />
          <VitalTile label="الحرارة" value="غير محدث" />
          <VitalTile label="الرطوبة" value="غير محدث" />
          <VitalTile label="انتظام الوزن" value="غير محدث" />
        </div>
      </section>
    </div>
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
    const normalized = (value - min) / (max - min)
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
          <defs>
            <filter id={`glow-${title}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id={`fill-${title}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.18" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 1, 2, 3].map((line) => (
            <line
              key={line}
              x1={padding}
              x2={width - padding}
              y1={padding + line * 48}
              y2={padding + line * 48}
              stroke="var(--border-default)"
              strokeDasharray="4 6"
            />
          ))}
          <polygon
            points={`${points.join(' ')} ${width - padding},${height - padding} ${padding},${height - padding}`}
            fill={`url(#fill-${title})`}
          />
          <polyline
            points={points.join(' ')}
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#glow-${title})`}
          />
          {points.map((point) => {
            const [x, y] = point.split(',')
            return <circle key={point} cx={x} cy={y} r="5" fill="var(--surface)" stroke={color} strokeWidth="3" />
          })}
        </svg>
      </div>
    </article>
  )
}

function OperationalLogCard({
  title,
  action,
  emptyTitle,
  emptyText,
  icon: Icon,
}: {
  title: string
  action: string
  emptyTitle: string
  emptyText: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <article className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-muted text-action-secondary">
            <Icon className="h-5 w-5" />
          </span>
          <h2 className="text-lg font-bold text-ink">{title}</h2>
        </div>
        <button
          type="button"
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-line bg-surface-muted px-3 py-2 text-sm font-semibold text-ink-soft transition-colors hover:bg-surface-subtle hover:text-ink"
        >
          {action.includes('حالة') ? <ClipboardPlus className="h-4 w-4" /> : <FilePlus2 className="h-4 w-4" />}
          {action}
        </button>
      </div>

      <div className="mt-5 flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong bg-surface-subtle p-8 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface text-ink-muted">
          <Icon className="h-7 w-7" />
        </span>
        <h3 className="mt-4 text-base font-bold text-ink">{emptyTitle}</h3>
        <p className="mt-2 max-w-md text-sm text-ink-muted">{emptyText}</p>
      </div>
    </article>
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
