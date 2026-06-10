'use client'

import React from 'react'
import { Activity } from 'lucide-react'
import type { TelemetryEvent } from '../_lib/types'

const toolNames: Record<string, string> = {
  search_basins: 'البحث في الأحواض',
  search_cycles: 'البحث في الدورات',
  get_inventory: 'فحص المخزون',
  get_recent_operations: 'جلب العمليات الأخيرة',
  search_seedling_basins: 'تحليل أحواض الشتلات',
  search_varieties: 'البحث في الأصناف',
  get_tree_guide: 'قراءة دليل الأشجار',
  get_nursery_analytics: 'جلب تحليلات المشتل',
}

function telemetryLabel(event: TelemetryEvent) {
  const toolLabel = event.tool ? (toolNames[event.tool] || event.tool) : 'أداة'
  if (event.event === 'telemetry.tool_start') return `${toolLabel}...`
  if (event.ok === false) return `${toolLabel}: تعذر التنفيذ`
  if (typeof event.count === 'number') return `${toolLabel}: ${event.count} نتيجة`
  return toolLabel
}

export default function ThinkingIndicator({
  telemetryEvents = [],
}: {
  telemetryEvents?: TelemetryEvent[]
}) {
  return (
    <div className="flex items-start gap-3 max-w-[85%]" style={{ animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
      {/* Avatar */}
      <div className="h-9 w-9 shrink-0 rounded-xl flex items-center justify-center bg-gradient-to-br from-action-primary/15 to-action-secondary/15 shadow-sm ring-1 ring-action-primary/10">
        <div className="h-4 w-4 rounded-full border-2 border-action-primary border-t-transparent animate-spin" />
      </div>

      <div className="space-y-2">
        {/* Thinking bubble */}
        <div className="rounded-2xl rounded-tr-md px-5 py-3.5 bg-surface-muted border border-line shadow-sm">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-action-primary/70 animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1.2s' }} />
            <span className="inline-block h-2 w-2 rounded-full bg-action-primary/50 animate-bounce" style={{ animationDelay: '200ms', animationDuration: '1.2s' }} />
            <span className="inline-block h-2 w-2 rounded-full bg-action-primary/30 animate-bounce" style={{ animationDelay: '400ms', animationDuration: '1.2s' }} />
            <span className="mr-3 text-xs font-bold text-ink-muted">يحلل المستشار الذكي...</span>
          </div>
        </div>

        {/* Telemetry chips */}
        {telemetryEvents.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {telemetryEvents.map(event => (
              <span
                key={event.id}
                className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2 py-1 text-xs font-bold text-ink-muted shadow-sm"
                style={{ animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}
              >
                <Activity className="h-3 w-3 text-info" />
                {telemetryLabel(event)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
