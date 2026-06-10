'use client'

import React from 'react'
import { Bot, Sparkles } from 'lucide-react'
import type { InferredContext } from '../_lib/types'

interface BasinOption { id: number; name: string }
interface CycleOption { id: number; name: string }

export default function ChatHeader({
  activeChat,
  inferredContext,
  selectedBasinId,
  selectedCycleId,
  basins,
  cycles,
}: {
  activeChat: { title: string; created_at: string } | null
  inferredContext: InferredContext | null
  selectedBasinId: number | null
  selectedCycleId: number | null
  basins: BasinOption[]
  cycles: CycleOption[]
}) {
  function focusLabel() {
    const entities = inferredContext?.last_resolved_entities
    if (entities?.basin?.name) return `التركيز الحالي: ${entities.basin.name}`
    if (entities?.cycle?.name) return `التركيز الحالي: ${entities.cycle.name}`
    if (entities?.inventory_item?.name) return `عنصر مخزون: ${entities.inventory_item.name}`
    if (inferredContext?.last_response_type === 'clarification') return 'بانتظار توضيح'

    const quickBasin = selectedBasinId ? basins.find(b => b.id === selectedBasinId)?.name : null
    const quickCycle = selectedCycleId ? cycles.find(c => c.id === selectedCycleId)?.name : null
    if (quickBasin) return `تركيز سريع: ${quickBasin}`
    if (quickCycle) return `تركيز سريع: ${quickCycle}`

    return 'استفسار عام'
  }

  if (!activeChat) {
    return (
      <div className="flex min-h-14 items-center border-b border-line px-6 py-3">
        <div className="flex items-center gap-2.5 text-ink-muted">
          <Sparkles className="h-5 w-5 text-action-primary" />
          <span className="text-sm font-bold">المستشار الزراعي الذكي</span>
        </div>
      </div>
    )
  }

  const isClarification = inferredContext?.last_response_type === 'clarification'

  return (
    <div className="flex min-h-14 items-center justify-between border-b border-line px-6 py-3">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-gradient-to-br from-action-primary/15 to-action-secondary/15 p-2.5 text-action-primary ring-1 ring-action-primary/10">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-sm font-extrabold text-ink">{activeChat.title}</h1>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-ink-muted">
            <span>البدء: {new Date(activeChat.created_at).toLocaleDateString('ar-SA')}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                isClarification
                  ? 'bg-info-soft text-info ring-1 ring-info/20'
                  : 'bg-action-primary/10 text-action-primary ring-1 ring-action-primary/10'
              }`}
            >
              {focusLabel()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
