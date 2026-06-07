import { API_BASE, getToken } from '@/lib/api/client'
import type { NurseryChatMessage, SendMessageResponse, TelemetryEvent } from './types'

export type NurseryStreamHandlers = {
  onUserMessage?: (message: NurseryChatMessage) => void
  onTelemetry?: (event: TelemetryEvent) => void
  onDelta?: (delta: string) => void
  onCompleted?: (response: Omit<SendMessageResponse, 'user_message'>) => void
}

type StreamEvent = {
  event: string
  data: unknown
}

export async function sendNurseryMessageStream(
  chatId: number,
  formData: FormData,
  handlers: NurseryStreamHandlers,
) {
  const token = getToken()
  const response = await fetch(`${API_BASE}/nursery/chats/${chatId}/messages/stream`, {
    method: 'POST',
    headers: {
      Accept: 'text/event-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  })

  if (!response.ok || !response.body) {
    throw new Error(`Stream request failed (${response.status})`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split('\n\n')
    buffer = parts.pop() || ''

    for (const part of parts) {
      dispatchStreamEvent(parseStreamEvent(part), handlers)
    }
  }

  if (buffer.trim()) {
    dispatchStreamEvent(parseStreamEvent(buffer), handlers)
  }
}

export function parseStreamEvent(chunk: string): StreamEvent {
  const eventLine = chunk.split('\n').find(line => line.startsWith('event: '))
  const dataLines = chunk
    .split('\n')
    .filter(line => line.startsWith('data: '))
    .map(line => line.slice(6))

  return {
    event: eventLine?.slice(7).trim() || 'message',
    data: dataLines.length ? JSON.parse(dataLines.join('\n')) : null,
  }
}

export function dispatchStreamEvent(parsed: StreamEvent, handlers: NurseryStreamHandlers) {
  const data = parsed.data as Record<string, unknown> | null

  if (parsed.event === 'user_message.created' && data?.user_message) {
    handlers.onUserMessage?.(data.user_message as NurseryChatMessage)
    return
  }

  if (parsed.event.startsWith('telemetry.')) {
    handlers.onTelemetry?.({
      id: `${Date.now()}-${Math.random()}`,
      event: parsed.event,
      ...(data || {}),
    } as TelemetryEvent)
    return
  }

  if (parsed.event === 'message.delta' && typeof data?.delta === 'string') {
    handlers.onDelta?.(data.delta)
    return
  }

  if (parsed.event === 'message.completed' && data) {
    handlers.onCompleted?.(data as Omit<SendMessageResponse, 'user_message'>)
  }
}
