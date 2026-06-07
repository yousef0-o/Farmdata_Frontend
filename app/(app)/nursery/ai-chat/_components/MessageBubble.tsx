'use client'

import React, { useState } from 'react'
import { Bot, User, FileText, Copy, Check, Activity } from 'lucide-react'
import { formatMessageContent } from '../_lib/markdown'
import type { NurseryChatMessage, ActionProposal, ActiveAction } from '../_lib/types'

function formatTime(dateString: string) {
  try {
    return new Date(dateString).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

export default function MessageBubble({
  message,
  actionProposal,
  onActionExecute,
  normalizeActionProposal,
}: {
  message: NurseryChatMessage
  actionProposal?: ActionProposal | null
  onActionExecute?: (action: ActiveAction) => void
  normalizeActionProposal?: (proposal: ActionProposal) => ActiveAction
}) {
  const [copied, setCopied] = useState(false)
  const isModel = message.role === 'model'
  const isSystem = message.role === 'system'

  // System message
  if (isSystem) {
    return (
      <div className="flex justify-center my-4" style={{ animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        <span className="inline-flex items-center gap-2 rounded-full bg-success-soft/60 px-4 py-2 text-xs font-bold text-success ring-1 ring-success/20 shadow-sm">
          <Activity className="h-3.5 w-3.5" />
          {message.content}
        </span>
      </div>
    )
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Silently fail
    }
  }

  return (
    <div
      className={`group flex items-start gap-3 max-w-[85%] ${isModel ? '' : 'mr-auto flex-row-reverse'}`}
      style={{ animation: 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)' }}
    >
      {/* Avatar */}
      <div
        className={`h-9 w-9 shrink-0 rounded-xl flex items-center justify-center shadow-sm ring-1 transition-all ${
          isModel
            ? 'bg-gradient-to-br from-action-primary/15 to-action-secondary/15 ring-action-primary/10 text-action-primary'
            : 'bg-surface-muted ring-line text-ink-muted'
        }`}
      >
        {isModel ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
      </div>

      {/* Content */}
      <div className="space-y-2 min-w-0 flex-1">
        <div
          className={`relative rounded-2xl p-4 shadow-sm transition-shadow ${
            isModel
              ? 'rounded-tr-md bg-surface border border-line hover:shadow-md'
              : 'rounded-tl-md bg-action-primary text-white shadow-md'
          }`}
        >
          {isModel
            ? formatMessageContent(message.content)
            : <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          }

          {/* Copy button (model only) */}
          {isModel && (
            <button
              onClick={handleCopy}
              className="absolute top-2 left-2 flex h-7 w-7 items-center justify-center rounded-lg bg-surface-muted/80 opacity-0 group-hover:opacity-100 hover:bg-surface-muted transition-all"
              title="نسخ"
            >
              {copied
                ? <Check className="h-3.5 w-3.5 text-success" />
                : <Copy className="h-3.5 w-3.5 text-ink-muted" />
              }
            </button>
          )}
        </div>

        {/* Timestamp */}
        <div className={`px-1 text-[10px] font-semibold text-ink-muted ${isModel ? '' : 'text-left'}`}>
          {formatTime(message.created_at)}
        </div>

        {/* Action card */}
        {isModel && actionProposal && onActionExecute && normalizeActionProposal && (
          <ActionCardInline
            proposal={actionProposal}
            onExecute={() => onActionExecute(normalizeActionProposal(actionProposal))}
          />
        )}

        {/* File attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {message.attachments.map((attach, i) => (
              <a
                key={i}
                href={attach.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-xl bg-surface-muted px-3 py-2 ring-1 ring-line hover:ring-action-primary/30 hover:shadow-sm text-ink-soft max-w-xs transition-all"
              >
                {attach.mime_type.startsWith('image/') ? (
                  <img src={attach.url} alt={attach.name} className="h-8 w-8 rounded-lg object-cover" />
                ) : (
                  <FileText className="h-4 w-4 text-action-primary" />
                )}
                <span className="text-[10px] font-bold truncate">{attach.name}</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Inline Action Card ──────────────────────────────────── */

import {
  Waves,
  AlertCircle,
  Sprout,
  Layers3,
  Warehouse,
  HelpCircle,
} from 'lucide-react'
import { actionTitles, actionRegistry } from '../_lib/actionRegistry'
import type { KnownActionType } from '../_lib/types'

const actionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  log_irrigation: Waves,
  log_mortality: AlertCircle,
  log_fertilization: Sprout,
  transfer_cycle: Layers3,
  start_cycle: Sprout,
  create_basin: Warehouse,
  log_procedure: Activity,
}

function ActionCardInline({ proposal, onExecute }: { proposal: ActionProposal; onExecute: () => void }) {
  const ActionIcon = actionIcons[proposal.action] || HelpCircle
  const title = actionTitles[proposal.action] || 'إجراء مقترح'
  const canExecute = Boolean(actionRegistry[proposal.action as KnownActionType])

  return (
    <div
      className="rounded-2xl border border-action-primary/20 bg-gradient-to-br from-action-primary/5 to-transparent p-4 shadow-sm"
      style={{ animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-action-primary/10 p-2.5 text-action-primary shrink-0 ring-1 ring-action-primary/10">
            <ActionIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-extrabold text-ink">{title}</h4>
            {proposal.human_summary && (
              <p className="mt-1 text-xs font-semibold leading-relaxed text-ink-soft">{proposal.human_summary}</p>
            )}
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-muted font-semibold">
              {proposal.target?.basin_name && <span>الحوض: {proposal.target.basin_name}</span>}
              {proposal.target?.cycle_name && <span>الدورة: {proposal.target.cycle_name}</span>}
            </div>
          </div>
        </div>

        <button
          onClick={onExecute}
          disabled={!canExecute}
          className="min-h-9 px-4 py-1.5 shrink-0 rounded-xl bg-action-primary hover:bg-action-primary-hover text-white font-bold text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span>{canExecute ? 'تأكيد الإجراء' : 'يفتح من النموذج القياسي'}</span>
        </button>
      </div>
    </div>
  )
}
