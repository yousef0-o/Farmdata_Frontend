'use client'

import React from 'react'
import {
  Loader2,
  Warehouse,
  ChevronLeft,
  Droplets,
  Leaf,
  SkullIcon,
  ArrowRightLeft,
} from 'lucide-react'
import type { KnownActionType } from '../_lib/types'

interface BasinOption { id: number; name: string }
interface CycleOption { id: number; name: string }

interface BasinStats {
  basin?: { name?: string; capacity?: number; irrigation_method?: string | null }
  stats?: { total_trees?: number }
  operations_stats?: { last_irrigation?: string | null; last_fertilization?: string | null }
  recent_activities?: Array<{ description?: string; type?: string; date?: string; detail?: string }>
}

const shortcuts = [
  { action: 'log_irrigation' as KnownActionType, label: 'تسجيل عملية ري', icon: Droplets, color: 'text-info bg-info-soft' },
  { action: 'log_fertilization' as KnownActionType, label: 'تسجيل عملية تسميد', icon: Leaf, color: 'text-success bg-success-soft' },
  { action: 'log_mortality' as KnownActionType, label: 'تسجيل حالة نفوق', icon: SkullIcon, color: 'text-danger bg-danger-soft' },
  { action: 'transfer_cycle' as KnownActionType, label: 'نقل وتفريد دورة', icon: ArrowRightLeft, color: 'text-action-secondary bg-action-secondary/10' },
]

export default function QuickFocusPanel({
  selectedBasinId,
  selectedCycleId,
  setSelectedBasinId,
  setSelectedCycleId,
  basins,
  cycles,
  basinStats,
  loadingBasinStats,
  onShortcut,
}: {
  selectedBasinId: number | null
  selectedCycleId: number | null
  setSelectedBasinId: (id: number | null) => void
  setSelectedCycleId: (id: number | null) => void
  basins: BasinOption[]
  cycles: CycleOption[]
  basinStats: BasinStats | null
  loadingBasinStats: boolean
  onShortcut: (action: KnownActionType) => void
}) {
  const occupancy = basinStats?.basin?.capacity
    ? Math.round(((basinStats.stats?.total_trees || 0) / basinStats.basin.capacity) * 100)
    : 0

  return (
    <div className="flex w-72 shrink-0 flex-col bg-surface border-r border-line p-4 space-y-4 overflow-y-auto">
      {/* Quick Focus selectors */}
      <div className="border-b border-line pb-3">
        <h3 className="text-xs font-extrabold text-ink-muted mb-3">تركيز سريع</h3>
        <div className="space-y-2.5">
          <div>
            <label className="text-[11px] font-bold text-ink-muted block mb-1">الحوض</label>
            <select
              value={selectedBasinId || ''}
              onChange={e => setSelectedBasinId(e.target.value ? Number(e.target.value) : null)}
              className="w-full text-xs font-semibold rounded-xl border border-line bg-surface-muted/50 p-2.5 outline-none text-ink focus:border-action-primary/40 focus:ring-2 focus:ring-action-primary/10 transition-all"
            >
              <option value="">بدون تركيز...</option>
              {basins.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-bold text-ink-muted block mb-1">دورة الإنتاج</label>
            <select
              value={selectedCycleId || ''}
              onChange={e => setSelectedCycleId(e.target.value ? Number(e.target.value) : null)}
              className="w-full text-xs font-semibold rounded-xl border border-line bg-surface-muted/50 p-2.5 outline-none text-ink focus:border-action-primary/40 focus:ring-2 focus:ring-action-primary/10 transition-all"
            >
              <option value="">بدون تركيز...</option>
              {cycles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Basin stats or empty state */}
      {selectedBasinId ? (
        <div className="space-y-4">
          {/* Stats card */}
          <div className="rounded-2xl border border-line bg-surface-muted/30 p-4">
            <div className="flex items-center justify-between border-b border-line pb-2.5 mb-3">
              <span className="text-xs font-extrabold text-ink">بيانات الحوض</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-[9px] font-bold text-success ring-1 ring-success/20">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                متصل
              </span>
            </div>

            {loadingBasinStats ? (
              <div className="py-10 flex justify-center">
                <div className="space-y-3 w-full">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-4 rounded-lg animate-skeleton-shimmer" />
                  ))}
                </div>
              </div>
            ) : basinStats ? (
              <div className="space-y-3 text-xs">
                <StatRow label="اسم الحوض" value={basinStats.basin?.name || '—'} />
                <StatRow label="طريقة الري" value={basinStats.basin?.irrigation_method || 'غير محدد'} />
                <StatRow
                  label="الأشجار القائمة"
                  value={`${(basinStats.stats?.total_trees || 0).toLocaleString('ar-SA')} شجرة`}
                />

                {/* Occupancy bar */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-ink-muted">نسبة التشغيل</span>
                    <span className="font-mono font-bold text-action-primary">{occupancy}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-surface-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-l from-action-primary to-action-secondary transition-all duration-700"
                      style={{ width: `${Math.min(occupancy, 100)}%` }}
                    />
                  </div>
                </div>

                <StatRow
                  label="آخر ري"
                  value={basinStats.operations_stats?.last_irrigation || 'لا يوجد'}
                />
                <StatRow
                  label="آخر تسميد"
                  value={basinStats.operations_stats?.last_fertilization || 'لا يوجد'}
                />
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-ink-muted">فشل تحميل التفاصيل.</div>
            )}
          </div>

          {/* Quick operation shortcuts */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-ink-muted block mb-1">عمليات مباشرة</span>
            {shortcuts.map(s => (
              <button
                key={s.action}
                onClick={() => onShortcut(s.action)}
                className="w-full text-right p-2.5 rounded-xl border border-line bg-surface hover:border-action-primary/30 hover:shadow-sm text-xs font-bold text-ink flex items-center justify-between group transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${s.color}`}>
                    <s.icon className="h-3.5 w-3.5" />
                  </span>
                  <span>{s.label}</span>
                </div>
                <ChevronLeft className="h-3.5 w-3.5 text-ink-muted group-hover:text-action-primary transition-colors" />
              </button>
            ))}
          </div>

          {/* Recent activities */}
          {(basinStats?.recent_activities?.length ?? 0) > 0 && (
            <div className="space-y-2 pt-2 border-t border-line">
              <span className="text-[11px] font-bold text-ink-muted block mb-1">أنشطة أخيرة</span>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {(basinStats?.recent_activities ?? []).slice(0, 4).map((activity, index) => (
                  <div
                    key={index}
                    className="rounded-xl bg-surface-muted/50 border border-line/50 p-2.5 text-[10px] font-semibold text-ink-soft space-y-0.5"
                  >
                    <div className="flex justify-between">
                      <span className="font-extrabold text-ink">{activity.description || activity.type}</span>
                      <span className="text-[9px] text-ink-muted">{activity.date}</span>
                    </div>
                    {activity.detail && <div className="text-[9px] text-ink-muted">{activity.detail}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-ink-muted text-center space-y-3">
          <Warehouse className="h-10 w-10 text-line" />
          <span className="text-xs leading-relaxed px-2">
            اختر حوضاً لعرض بياناته وعملياته السريعة هنا.
          </span>
        </div>
      )}
    </div>
  )
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-ink-muted">{label}</span>
      <span className="font-bold text-ink">{value}</span>
    </div>
  )
}
