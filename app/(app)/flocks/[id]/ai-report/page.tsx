'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowRight, Bot, Loader2, MessageSquare, RefreshCcw, Send, ShieldAlert, Sparkles } from 'lucide-react'
import { useCreatePoultryAiReport, usePoultryAiReports, useSendPoultryAiReportMessage } from '@/lib/hooks/useDailyOps'
import { useFlock } from '@/lib/hooks/useFlock'
import type { PoultryAiReport } from '@/lib/types'

export default function FlockAiReportPage() {
  const { id } = useParams()
  const flockId = Number(id)
  const { data: flockRes } = useFlock(flockId)
  const { data: reportsRes, isLoading } = usePoultryAiReports(flockId)
  const createReport = useCreatePoultryAiReport(flockId)
  const reports = useMemo(() => reportsRes?.data ?? [], [reportsRes?.data])
  const latestReport = reports[0]
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null)
  const activeReport = useMemo(
    () => reports.find((report) => report.id === selectedReportId) ?? latestReport,
    [latestReport, reports, selectedReportId]
  )

  return (
    <div className="space-y-6" dir="rtl">
      <header className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface-muted text-action-secondary">
              <Bot className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-bold text-ink-muted">تحليل فوج</p>
              <h1 className="mt-1 text-2xl font-bold text-ink">تقرير الذكاء الاصطناعي</h1>
              <p className="mt-2 text-sm text-ink-soft">
                {flockRes?.data?.flock_number ? `الفوج ${flockRes.data.flock_number}` : `الفوج #${flockId}`}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/flocks/${flockId}`}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface-muted px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:bg-surface-subtle hover:text-ink"
            >
              <ArrowRight className="h-4 w-4" />
              عودة للفوج
            </Link>
            <button
              type="button"
              onClick={() => createReport.mutate()}
              disabled={createReport.isPending}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-action-primary px-4 py-2 text-sm font-bold text-ink-inverse transition-colors hover:bg-action-primary-hover disabled:opacity-50"
            >
              {createReport.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
              إنشاء تقرير
            </button>
          </div>
        </div>
      </header>

      {isLoading ? (
        <div className="flex min-h-72 items-center justify-center rounded-2xl border border-line bg-surface">
          <Loader2 className="h-8 w-8 animate-spin text-action-primary" />
        </div>
      ) : !activeReport ? (
        <section className="rounded-2xl border border-line bg-surface p-8 text-center shadow-sm">
          <Sparkles className="mx-auto h-10 w-10 text-action-primary" />
          <h2 className="mt-4 text-lg font-bold text-ink">لا يوجد تقرير بعد</h2>
          <p className="mt-2 text-sm text-ink-muted">أنشئ تقريرا لتحليل الإنتاج، التربية، السجلات الطبية، والمخاطر المحتملة.</p>
        </section>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
          <aside className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <h2 className="text-sm font-bold text-ink">التقارير السابقة</h2>
            <div className="mt-3 space-y-2">
              {reports.map((report) => (
                <button
                  key={report.id}
                  type="button"
                  onClick={() => setSelectedReportId(report.id)}
                  className={`w-full rounded-xl border px-3 py-3 text-right text-sm transition-colors ${
                    activeReport.id === report.id
                      ? 'border-action-primary bg-surface-subtle text-ink'
                      : 'border-line bg-surface text-ink-soft hover:bg-surface-subtle'
                  }`}
                >
                  <span className="block font-bold">{report.title || `تقرير #${report.id}`}</span>
                  <span className="mt-1 block text-xs text-ink-muted">{report.created_at || 'بدون تاريخ'}</span>
                </button>
              ))}
            </div>
          </aside>

          <main className="space-y-6">
            <ReportSummary report={activeReport} />
            <ReportChat flockId={flockId} report={activeReport} />
          </main>
        </div>
      )}
    </div>
  )
}

function ReportSummary({ report }: { report: PoultryAiReport }) {
  const payload = report.report_payload ?? {}
  const summary = textValue(payload.summary) || report.raw_response || 'لا يوجد ملخص نصي.'
  const risks = listValue(payload.risks)
  const recommendations = listValue(payload.recommendations)
  const questions = listValue(payload.follow_up_questions)

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <div className="flex flex-col gap-2 border-b border-line pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink">{report.title || 'تقرير الذكاء الاصطناعي'}</h2>
          <p className="mt-1 text-xs font-semibold text-ink-muted">{report.provider || 'AI'} · {report.model || 'model'} · {report.status}</p>
        </div>
      </div>

      <div className="mt-5 space-y-5">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
            <Sparkles className="h-4 w-4 text-action-primary" />
            الملخص
          </h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-ink-soft">{summary}</p>
        </div>
        <ReportList title="المخاطر" icon={ShieldAlert} items={risks} />
        <ReportList title="التوصيات" icon={Sparkles} items={recommendations} />
        <ReportList title="أسئلة متابعة" icon={MessageSquare} items={questions} />
      </div>
    </section>
  )
}

function ReportList({ title, icon: Icon, items }: { title: string; icon: React.ComponentType<{ className?: string }>; items: string[] }) {
  if (items.length === 0) return null

  return (
    <div>
      <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
        <Icon className="h-4 w-4 text-action-primary" />
        {title}
      </h3>
      <ul className="mt-2 space-y-2">
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className="rounded-xl border border-line bg-surface-subtle px-4 py-3 text-sm text-ink-soft">
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function ReportChat({ flockId, report }: { flockId: number; report: PoultryAiReport }) {
  const [message, setMessage] = useState('')
  const sendMessage = useSendPoultryAiReportMessage(flockId, report.id)
  const messages = report.messages ?? []

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!message.trim()) return
    sendMessage.mutate(message.trim(), {
      onSuccess: () => setMessage(''),
    })
  }

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <h2 className="text-lg font-bold text-ink">محادثة التقرير</h2>
      <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto rounded-2xl border border-line bg-surface-subtle p-4">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted">لا توجد أسئلة متابعة بعد.</p>
        ) : (
          messages.map((item) => (
            <div key={item.id} className={`rounded-xl px-4 py-3 text-sm leading-7 ${item.role === 'user' ? 'bg-surface text-ink' : 'bg-action-primary text-ink-inverse'}`}>
              {item.content}
            </div>
          ))
        )}
      </div>
      <form onSubmit={submit} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="min-h-11 flex-1 rounded-xl border border-line bg-surface px-4 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-action-primary"
          placeholder="اسأل عن سبب انخفاض الإنتاج أو مخاطر صحية محددة"
        />
        <button
          type="submit"
          disabled={sendMessage.isPending || !message.trim()}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-action-primary px-4 py-2 text-sm font-bold text-ink-inverse transition-colors hover:bg-action-primary-hover disabled:opacity-50"
        >
          {sendMessage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          إرسال
        </button>
      </form>
    </section>
  )
}

function textValue(value: unknown): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(textValue).filter(Boolean).join('\n')
  if (value && typeof value === 'object') return Object.values(value as Record<string, unknown>).map(textValue).filter(Boolean).join('\n')
  return ''
}

function listValue(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value.map(textValue).filter(Boolean)
  if (typeof value === 'object') return Object.values(value as Record<string, unknown>).map(textValue).filter(Boolean)
  if (typeof value === 'string') return [value]
  return []
}
