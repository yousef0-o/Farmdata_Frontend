'use client'

import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import React, { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckSquare,
  ChevronLeft,
  ClipboardCheck,
  Droplets,
  Eye,
  FlaskConical,
  History,
  Loader2,
  MoveRight,
  Pencil,
  PlusCircle,
  RefreshCw,
  ShoppingCart,
  Skull,
  Sprout,
  Trash2,
  Truck,
  X,
} from 'lucide-react'
import AppDialog from '@/components/ui/AppDialog'
import { nurseryManagementApi } from '@/lib/api/nurseryManagement'
import type { ApiError } from '@/lib/types'
import type { NurseryBasinActivity, NurseryBasinActivityType } from '@/lib/types/nurseryManagement'

const activityMeta: Record<NurseryBasinActivityType, { icon: typeof Activity; tone: string }> = {
  sale: { icon: ShoppingCart, tone: 'bg-warning-soft text-warning' },
  purchase: { icon: Truck, tone: 'bg-purple-50 text-purple-700' },
  procedure: { icon: ClipboardCheck, tone: 'bg-success-soft text-success' },
  irrigation: { icon: Droplets, tone: 'bg-info-soft text-info' },
  fertilization: { icon: FlaskConical, tone: 'bg-success-soft text-success' },
  mortality: { icon: Skull, tone: 'bg-danger-soft text-danger' },
  transfer: { icon: RefreshCw, tone: 'bg-indigo-50 text-indigo-700' },
  cycle: { icon: Sprout, tone: 'bg-pink-50 text-pink-700' },
  tree_add: { icon: PlusCircle, tone: 'bg-success-soft text-success' },
  basin_transfer: { icon: MoveRight, tone: 'bg-info-soft text-info' },
}

function formatDateRange(activity: NurseryBasinActivity) {
  if (!activity.date) return '-'
  if (activity.end_date && activity.end_date !== activity.date) return `${activity.date} ← ${activity.end_date}`
  return activity.date
}

function timeLabel(value: string | null) {
  if (!value) return ''
  const time = new Date(value).getTime()
  if (Number.isNaN(time)) return ''
  const diff = Math.max(0, Date.now() - time)
  const days = Math.floor(diff / 86400000)
  if (days > 0) return `منذ ${days} يوم`
  const hours = Math.floor(diff / 3600000)
  if (hours > 0) return `منذ ${hours} ساعة`
  return 'اليوم'
}

export default function BasinActivitiesPage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const basinId = Number(params.id)
  const currentType = searchParams.get('type') ?? 'all'
  const [selected, setSelected] = useState<Array<{ id: number; type: string }>>([])
  const [activeActivity, setActiveActivity] = useState<NurseryBasinActivity | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const query = useQuery({
    queryKey: ['nursery-basin-activities', basinId, currentType],
    queryFn: () => nurseryManagementApi.basinActivities(basinId, currentType),
    enabled: Number.isFinite(basinId) && basinId > 0,
  })

  const deleteMutation = useMutation({
    mutationFn: (items: Array<{ id: number; type: string }>) =>
      nurseryManagementApi.deleteBasinActivities(basinId, items),
    onSuccess: async () => {
      setSelected([])
      setFeedback('تم الحذف بنجاح.')
      await queryClient.invalidateQueries({ queryKey: ['nursery-basin-activities', basinId] })
      await queryClient.invalidateQueries({ queryKey: ['nursery-basin-dashboard', basinId] })
    },
    onError: (error: unknown) => {
      const apiError = error as ApiError
      const firstError = apiError.errors ? Object.values(apiError.errors)[0] : null
      setFeedback(Array.isArray(firstError) ? firstError[0] : apiError.message || 'فشل حذف النشاط.')
    },
  })

  const payload = query.data?.data
  const allSelected = payload?.activities.length ? selected.length === payload.activities.length : false
  const selectedKey = (activity: NurseryBasinActivity) => `${activity.type}:${activity.id}`
  const selectedSet = useMemo(() => new Set(selected.map((item) => `${item.type}:${item.id}`)), [selected])

  function toggleActivity(activity: NurseryBasinActivity, checked: boolean) {
    setSelected((current) =>
      checked
        ? [...current, { id: activity.id, type: activity.type }]
        : current.filter((item) => !(item.id === activity.id && item.type === activity.type))
    )
  }

  function deleteItems(items: Array<{ id: number; type: string }>) {
    if (!items.length) return
    if (!window.confirm(`هل أنت متأكد من حذف ${items.length} عنصر؟`)) return
    deleteMutation.mutate(items)
  }

  if (query.isLoading) {
    return <main className="flex min-h-[55vh] items-center justify-center bg-background text-ink" dir="rtl"><Loader2 className="h-7 w-7 animate-spin text-action-primary" /></main>
  }

  if (query.isError || !payload) {
    return (
      <main className="bg-background p-4 text-ink sm:p-6 lg:p-8" dir="rtl">
        <section className="rounded-2xl border border-line bg-surface p-10 text-center shadow-sm">
          <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-danger" />
          <h1 className="text-xl font-extrabold text-ink">لم يتم العثور على الحوض</h1>
          <Link href="/nursery/manage" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface-muted px-5 text-sm font-bold text-ink-soft transition-colors hover:bg-surface-subtle">عودة للرئيسية</Link>
        </section>
      </main>
    )
  }

  return (
    <main className="bg-background px-4 py-5 text-ink sm:px-6 lg:px-8" dir="rtl">
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs font-bold text-ink-muted">
        <Link href="/nursery/manage" className="transition-colors hover:text-action-primary">الرئيسية</Link>
        <ChevronLeft className="h-3.5 w-3.5" />
        <span>{payload.breadcrumbs.nursery.name}</span>
        <ChevronLeft className="h-3.5 w-3.5" />
        <span>{payload.breadcrumbs.location.name}</span>
        <ChevronLeft className="h-3.5 w-3.5" />
        <span>{payload.breadcrumbs.section.name}</span>
        <ChevronLeft className="h-3.5 w-3.5" />
        <Link href={`/nursery/manage/basins/${basinId}`} className="transition-colors hover:text-action-primary">{payload.basin.name}</Link>
        <ChevronLeft className="h-3.5 w-3.5" />
        <span className="text-action-primary">سجل النشاطات</span>
      </nav>

      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold text-ink">سجل النشاطات: {payload.basin.name}</h1>
        <Link href={`/nursery/manage/basins/${basinId}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-bold text-ink-soft shadow-sm transition-[background-color,transform] duration-200 hover:bg-surface-muted active:scale-[0.98]">
          <ArrowRight className="h-4 w-4" />
          العودة للحوض
        </Link>
      </header>

      <section className="mb-5 rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {payload.filters.map((filter) => (
            <Link
              key={filter.key}
              href={`/nursery/manage/basins/${basinId}/activities?type=${filter.key}`}
              className={`inline-flex min-h-9 items-center rounded-xl border px-4 text-sm font-bold transition-colors ${
                payload.current_type === filter.key
                  ? 'border-action-primary bg-action-primary text-ink-inverse'
                  : 'border-line bg-surface text-ink-soft hover:bg-surface-muted'
              }`}
            >
              {filter.label}
            </Link>
          ))}
        </div>
      </section>

      {selected.length > 0 ? (
        <section className="sticky top-4 z-20 mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-action-primary bg-surface-subtle p-4 shadow-md">
          <div className="text-sm font-extrabold text-ink">تم تحديد <span className="font-mono">{selected.length}</span> عنصر</div>
          <div className="flex gap-2">
            <button type="button" onClick={() => window.alert('تعديل النشاطات سيضاف بعد مطابقة edit_activity.php بالكامل.')} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-action-primary px-4 text-sm font-bold text-ink-inverse">
              <Pencil className="h-4 w-4" />
              تعديل المحدد
            </button>
            <button type="button" onClick={() => deleteItems(selected)} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-danger px-4 text-sm font-bold text-ink-inverse">
              <Trash2 className="h-4 w-4" />
              حذف المحدد
            </button>
          </div>
        </section>
      ) : null}

      {feedback ? <div className="mb-5 rounded-xl border border-line bg-surface-subtle px-4 py-3 text-sm font-bold text-ink-soft">{feedback}</div> : null}

      <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-base font-extrabold text-ink">
            <History className="h-5 w-5 text-action-primary" />
            النشاطات
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-ink-soft">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(event) => setSelected(event.target.checked ? payload.activities.map((activity) => ({ id: activity.id, type: activity.type })) : [])}
            />
            تحديد الكل
          </label>
        </div>

        <div className="divide-y divide-line">
          {payload.activities.length > 0 ? payload.activities.map((activity) => {
            const meta = activityMeta[activity.type]
            const Icon = meta.icon
            return (
              <article key={selectedKey(activity)} className="flex items-center gap-4 py-4">
                <input
                  type="checkbox"
                  checked={selectedSet.has(selectedKey(activity))}
                  onChange={(event) => toggleActivity(activity, event.target.checked)}
                  className="h-4 w-4"
                />
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${meta.tone}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-extrabold text-ink">{activity.title}</div>
                  <div className="mt-1 text-xs font-semibold text-ink-muted">{formatDateRange(activity)} {activity.created_at ? <span>({timeLabel(activity.created_at)})</span> : null}</div>
                  {activity.detail ? <div className="mt-1 text-sm font-semibold text-ink-soft">{activity.detail}</div> : null}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button type="button" title="عرض التفاصيل" onClick={() => setActiveActivity(activity)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-info text-ink-inverse transition-colors hover:bg-info-strong">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button type="button" title="تعديل" onClick={() => window.alert('تعديل النشاطات سيضاف بعد مطابقة edit_activity.php بالكامل.')} className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-warning text-ink-inverse transition-colors hover:bg-warning-strong">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button type="button" title="حذف" onClick={() => deleteItems([{ id: activity.id, type: activity.type }])} className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-danger text-ink-inverse transition-colors hover:bg-danger-strong">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </article>
            )
          }) : (
            <div className="py-12 text-center text-sm font-bold text-ink-muted">لا توجد نشاطات مسجلة</div>
          )}
        </div>
      </section>

      <AppDialog open={Boolean(activeActivity)} onClose={() => setActiveActivity(null)} labelledBy="activity-details-title" panelClassName="max-w-2xl">
        <div className="rounded-2xl border border-line bg-surface shadow-2xl">
          <div className="flex items-center justify-between gap-4 rounded-t-2xl border-b border-line bg-surface-subtle px-5 py-4">
            <h2 id="activity-details-title" className="text-lg font-extrabold text-ink">تفاصيل العملية</h2>
            <button type="button" onClick={() => setActiveActivity(null)} className="rounded-xl p-2 text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"><X className="h-5 w-5" /></button>
          </div>
          {activeActivity ? (
            <div className="space-y-3 p-5 text-sm font-semibold text-ink-soft">
              <Detail label="النوع" value={activeActivity.title} />
              <Detail label="التاريخ" value={formatDateRange(activeActivity)} />
              <Detail label="التفاصيل" value={activeActivity.detail || '-'} />
              <Detail label="تاريخ التسجيل" value={activeActivity.created_at || '-'} />
              {activeActivity.type === 'cycle' ? (
                <Link href={`/nursery/manage?basin_id=${basinId}`} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-action-primary px-4 text-sm font-bold text-ink-inverse">
                  <CheckSquare className="h-4 w-4" />
                  إدارة الدورة
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      </AppDialog>
    </main>
  )
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface-subtle px-4 py-3">
      <div className="text-xs font-bold text-ink-muted">{label}</div>
      <div className="mt-1 text-sm font-extrabold text-ink">{value}</div>
    </div>
  )
}
