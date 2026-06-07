'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { ChevronDown } from 'lucide-react'
import MessageBubble from './MessageBubble'
import ThinkingIndicator from './ThinkingIndicator'
import type { NurseryChatMessage, ActionProposal, ActiveAction, TelemetryEvent } from '../_lib/types'

export default function ChatMessages({
  messages,
  sendingMessage,
  telemetryEvents,
  messageActionProposals,
  onActionExecute,
  normalizeActionProposal,
}: {
  messages: NurseryChatMessage[]
  sendingMessage: boolean
  telemetryEvents: TelemetryEvent[]
  messageActionProposals: Record<number, ActionProposal>
  onActionExecute: (action: ActiveAction) => void
  normalizeActionProposal: (proposal: ActionProposal) => ActiveAction
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const [showScrollBtn, setShowScrollBtn] = useState(false)

  // Auto-scroll on new messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sendingMessage])

  // Detect scroll position for scroll-to-bottom button
  const handleScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    setShowScrollBtn(distanceFromBottom > 200)
  }, [])

  function scrollToBottom() {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="relative flex-1 overflow-y-auto p-6"
    >
      <div className="space-y-5 max-w-4xl mx-auto">
        {messages.map(message => (
          <MessageBubble
            key={message.id}
            message={message}
            actionProposal={messageActionProposals[message.id]}
            onActionExecute={onActionExecute}
            normalizeActionProposal={normalizeActionProposal}
          />
        ))}

        {/* Thinking indicator */}
        {sendingMessage && (
          <ThinkingIndicator telemetryEvents={telemetryEvents} />
        )}

        <div ref={endRef} />
      </div>

      {/* Scroll to bottom FAB */}
      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          className="sticky bottom-4 left-1/2 -translate-x-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-surface shadow-lg ring-1 ring-line hover:ring-action-primary/30 hover:shadow-xl transition-all active:scale-95"
          style={{ animation: 'slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
          title="العودة للأسفل"
        >
          <ChevronDown className="h-5 w-5 text-ink-soft" />
        </button>
      )}
    </div>
  )
}
