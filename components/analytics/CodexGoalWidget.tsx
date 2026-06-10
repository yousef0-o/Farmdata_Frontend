'use client'

import type { FlockAnalyticsResponse } from '@/lib/types'

interface CodexGoalWidgetProps {
  analytics: FlockAnalyticsResponse
}

function ProgressRing({ percentage, tone }: { percentage: number; tone: string }) {
  const normalized = Math.max(0, Math.min(100, percentage))
  const circumference = 2 * Math.PI * 42
  const strokeDashoffset = circumference - (normalized / 100) * circumference

  return (
    <svg viewBox="0 0 100 100" className="h-28 w-28">
      <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(199,195,183,0.35)" strokeWidth="10" />
      <circle
        cx="50"
        cy="50"
        r="42"
        fill="none"
        stroke={tone}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        transform="rotate(-90 50 50)"
      />
      <text x="50" y="47" textAnchor="middle" className="fill-current text-xs font-semibold text-ink-soft">
        Achieved
      </text>
      <text x="50" y="60" textAnchor="middle" className="fill-current text-lg font-bold text-ink">
        {normalized.toFixed(0)}%
      </text>
    </svg>
  )
}

export function CodexGoalWidget({ analytics }: CodexGoalWidgetProps) {
  const achievement = analytics.goal_dashboard.achievement_summary

  return (
    <section className="grid gap-4 xl:grid-cols-[1.15fr_2fr]">
      <article className="rounded-[1.75rem] border border-line bg-surface p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase text-ink-muted">Codex Goals</p>
            <h2 className="text-xl font-bold text-ink">لوحة أهداف الأداء</h2>
            <p className="max-w-[28ch] text-sm text-ink-soft">
              مقارنة الأداء الفعلي مع أهداف FCR ونسبة الإنتاج وحجم الكرتون على نفس السياق التشغيلي.
            </p>
          </div>
          <ProgressRing
            percentage={achievement.achievement_ratio}
            tone={achievement.achievement_ratio >= 66 ? 'rgb(22 163 74)' : 'rgb(194 65 12)'}
          />
        </div>
      </article>

      <div className="grid gap-4 md:grid-cols-3">
        {analytics.goal_dashboard.goals.map((goal) => {
          const accent = goal.is_achieved ? 'bg-success-soft text-success-strong' : 'bg-warning-soft text-warning-strong'

          return (
            <article key={goal.metric_key} className="rounded-[1.6rem] border border-line bg-surface p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink">{goal.name}</p>
                  <p className="text-xs text-ink-muted">{goal.source === 'codex_goal' ? 'هدف مخصص' : 'هدف افتراضي'}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${accent}`}>
                  {goal.is_achieved ? 'محقق' : 'قيد المتابعة'}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-ink-muted">الفعلي</p>
                  <p className="mt-1 font-bold text-ink">{goal.actual_value?.toFixed(2) ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-muted">المستهدف</p>
                  <p className="mt-1 font-bold text-ink">{goal.target_value?.toFixed(2) ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-muted">الإنجاز</p>
                  <p className="mt-1 font-bold text-ink">{goal.achievement_rate?.toFixed(1) ?? '—'}%</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-2xl bg-surface-subtle px-4 py-3 text-xs text-ink-soft">
                <span>Variance {goal.variance?.toFixed(2) ?? '—'}</span>
                <span>Remaining {goal.remaining_threshold?.toFixed(2) ?? '—'}</span>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
