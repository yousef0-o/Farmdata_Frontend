import { describe, expect, it, vi } from 'vitest'
import { contextHintsFromPath } from '@/app/(app)/nursery/ai-chat/_lib/contextHints'
import { dispatchStreamEvent, parseStreamEvent } from '@/app/(app)/nursery/ai-chat/_lib/streaming'

describe('nursery AI chat helpers', () => {
  it('extracts route context hints with route basin overriding query basin', () => {
    const params = new URLSearchParams('context_basin_id=4&context_cycle_id=9')

    expect(contextHintsFromPath('/nursery/manage/basins/12', params)).toEqual({
      context_basin_id: 12,
      context_cycle_id: 9,
    })
  })

  it('parses and dispatches SSE message completion events', () => {
    const onCompleted = vi.fn()
    const parsed = parseStreamEvent([
      'event: message.completed',
      'data: {"success":true,"message":"تم","inferred_context":null,"action_proposal":null,"model_response":{"id":7,"role":"model","content":"تم","attachments":null,"created_at":"2026-06-07T00:00:00Z"}}',
    ].join('\n'))

    dispatchStreamEvent(parsed, { onCompleted })

    expect(onCompleted).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      message: 'تم',
    }))
  })

  it('maps telemetry SSE events into typed telemetry entries', () => {
    const onTelemetry = vi.fn()
    const parsed = parseStreamEvent('event: telemetry.tool_result\ndata: {"tool":"search_basins","ok":true,"count":2}')

    dispatchStreamEvent(parsed, { onTelemetry })

    expect(onTelemetry).toHaveBeenCalledWith(expect.objectContaining({
      event: 'telemetry.tool_result',
      tool: 'search_basins',
      ok: true,
      count: 2,
    }))
  })
})
