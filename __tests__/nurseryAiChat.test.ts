import { describe, expect, it, vi } from 'vitest'
import { contextHintsFromPath } from '@/app/(app)/nursery/ai-chat/_lib/contextHints'
import { dispatchStreamEvent, parseStreamEvent } from '@/app/(app)/nursery/ai-chat/_lib/streaming'
import { actionRegistry } from '@/app/(app)/nursery/ai-chat/_lib/actionRegistry'
import type { BuildPayloadArgs } from '@/app/(app)/nursery/ai-chat/_lib/actionRegistry'

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

  describe('actionRegistry payload builders', () => {
    const defaultArgs: BuildPayloadArgs = {
      activeAction: { action: 'start_cycle', title: '', inferred: true },
      targetBasinId: 10,
      selectedCycleId: null,
      activeChatCycleId: null,
      irrigationDate: '2026-06-07',
      irrigationPeriod: 'morning',
      irrigationStartTime: '08:00',
      irrigationEndTime: '09:00',
      mortalityLine: 1,
      mortalityQuantity: 5,
      mortalityDate: '2026-06-07',
      fertilizationDate: '2026-06-07',
      fertilizerId: 2,
      fertilizationQuantity: 10,
      transferSuccessCount: 50,
      transferMarkRemainingFailed: false,
      transferDate: '2026-06-07',
      transferBasinId: 12,
      transferLineNumber: 3,
      // New action fields
      cycleName: 'دورة تجريبية',
      cycleTreeTypeId: 5,
      cyclePropagationType: 'seeds',
      cycleSource: 'مورد خارجي',
      cycleCount: 150,
      cyclePotSize: '10cm',
      cycleStartDate: '2026-06-07',
      basinSectionId: 2,
      basinBaseName: 'حوض B',
      basinCount: 3,
      basinLength: 10,
      basinWidth: 4,
      basinIrrigationMethod: 'sprinkler',
      procedureCycleId: 15,
      procedureType: 'irrigation',
      procedureDate: '2026-06-07',
      procedurePeriod: 'morning',
      procedureStartTime: '06:00',
      procedureEndTime: '07:00',
      procedureHumidity: 65,
      procedureNotes: 'ملاحظة الفحص',
    }

    it('builds start_cycle payload correctly', () => {
      const payload = actionRegistry.start_cycle?.buildPayload(defaultArgs)
      expect(payload).toEqual({
        basin_id: 10,
        name: 'دورة تجريبية',
        tree_type_id: 5,
        propagation_type: 'seeds',
        source: 'مورد خارجي',
        count: 150,
        pot_size: '10cm',
        start_date: '2026-06-07',
        status: 'active',
      })
    })

    it('builds create_basin payload correctly', () => {
      const payload = actionRegistry.create_basin?.buildPayload(defaultArgs)
      expect(payload).toEqual({
        section_id: 2,
        base_name: 'حوض B',
        count: 3,
        length: 10,
        width: 4,
        irrigation_method: 'sprinkler',
      })
    })

    it('builds log_procedure payload correctly', () => {
      const payload = actionRegistry.log_procedure?.buildPayload(defaultArgs)
      expect(payload).toEqual({
        cycle_id: 15,
        procedure_type: 'irrigation',
        procedure_date: '2026-06-07',
        period: 'morning',
        start_time: '06:00',
        end_time: '07:00',
        humidity_percentage: 65,
        notes: 'ملاحظة الفحص',
      })
    })
  })
})

