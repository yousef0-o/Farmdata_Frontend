'use client'

import type { FlockAnalyticsResponse } from '@/lib/types'

interface FlockAnalyticsCardsProps {
  analytics: FlockAnalyticsResponse
}

function MetricCard({
  eyebrow,
  title,
  value,
  meta,
  tone,
}: {
  eyebrow: string
  title: string
  value: string
  meta: string
  tone: string
}) {
  return (
    <article className="group relative overflow-hidden rounded-[1.6rem] border border-line bg-surface p-5 shadow-sm transition-transform duration-200 hover:-translate-y-0.5">
      <div
        className="absolute inset-x-0 top-0 h-1.5 opacity-90"
        style={{ background: tone }}
      />
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
        {eyebrow}
      </p>
      <h3 className="mt-4 text-sm font-semibold text-ink-soft">{title}</h3>
      <div className="mt-2 text-3xl font-bold text-ink">{value}</div>
      <p className="mt-2 text-xs text-ink-soft">{meta}</p>
    </article>
  )
}

export function FlockAnalyticsCards({ analytics }: FlockAnalyticsCardsProps) {
  const { production, breeding } = analytics.summary

  return (
    <section className="grid gap-4 xl:grid-cols-4">
      <MetricCard
        eyebrow="Lay Rate"
        title="نسبة الإنتاج الكلية"
        value={`${production.weighted_lay_rate.toFixed(2)}%`}
        meta={production.evaluations.lay_rate.label_ar}
        tone={production.evaluations.lay_rate.color_token}
      />
      <MetricCard
        eyebrow="FCR"
        title="معامل التحويل الغذائي"
        value={production.fcr !== null ? production.fcr.toFixed(3) : '—'}
        meta={production.evaluations.fcr.label_ar}
        tone={production.evaluations.fcr.color_token}
      />
      <MetricCard
        eyebrow="Cartons"
        title="الكرتون المنتج"
        value={production.cartons_produced.toLocaleString('en-US', { maximumFractionDigits: 2 })}
        meta={`إجمالي ${production.total_eggs.toLocaleString('en-US')} بيضة`}
        tone="linear-gradient(90deg, rgba(194,65,12,0.88), rgba(28,59,43,0.88))"
      />
      <MetricCard
        eyebrow="Breeding Value"
        title="قيمة الطائر الرأسمالية"
        value={breeding.bird_value.toLocaleString('en-US', { maximumFractionDigits: 2 })}
        meta={`إجمالي قيمة الفوج ${breeding.total_flock_value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`}
        tone="linear-gradient(90deg, rgba(59,130,246,0.88), rgba(194,65,12,0.88))"
      />
    </section>
  )
}
