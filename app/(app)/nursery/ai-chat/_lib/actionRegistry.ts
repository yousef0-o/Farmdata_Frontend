import type { ActiveAction, ActionPayload, KnownActionType } from './types'

type BuildPayloadArgs = {
  activeAction: ActiveAction
  targetBasinId?: number | null
  selectedCycleId?: number | null
  activeChatCycleId?: number | null
  irrigationDate: string
  irrigationPeriod: 'morning' | 'evening'
  irrigationStartTime: string
  irrigationEndTime: string
  mortalityLine: number
  mortalityQuantity: number
  mortalityDate: string
  fertilizationDate: string
  fertilizerId: number
  fertilizationQuantity: number
  transferSuccessCount: number
  transferMarkRemainingFailed: boolean
  transferDate: string
  transferBasinId: number
  transferLineNumber: number
}

type ActionRegistryEntry = {
  title: string
  endpoint: (args: BuildPayloadArgs) => string
  buildPayload: (args: BuildPayloadArgs) => ActionPayload
}

export const actionTitles: Record<string, string> = {
  log_irrigation: 'جدولة عملية ري مقترحة',
  log_mortality: 'تسجيل حالة نفوق مقترحة',
  log_fertilization: 'عملية تسميد مقترحة',
  transfer_cycle: 'نقل وتفريد دورة الإنتاج',
  start_cycle: 'بدء دورة إنتاج مقترحة',
  create_basin: 'إنشاء حوض مقترح',
  log_procedure: 'تسجيل إجراء دورة مقترح',
}

function requireNumber(value: unknown, message: string): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) throw new Error(message)
  return parsed
}

export const actionRegistry: Partial<Record<KnownActionType, ActionRegistryEntry>> = {
  log_irrigation: {
    title: actionTitles.log_irrigation,
    endpoint: ({ targetBasinId }) => `/nursery/manage/basins/${requireNumber(targetBasinId, 'يرجى تحديد حوض لإتمام عملية الري.')}/operations/irrigation`,
    buildPayload: ({ irrigationDate, irrigationPeriod, irrigationStartTime, irrigationEndTime }) => ({
      irrigation_date: irrigationDate,
      irrigation_date_to: irrigationDate,
      period: irrigationPeriod,
      start_time: irrigationStartTime,
      end_time: irrigationEndTime,
    }),
  },
  log_mortality: {
    title: actionTitles.log_mortality,
    endpoint: ({ targetBasinId }) => `/nursery/manage/basins/${requireNumber(targetBasinId, 'يرجى تحديد حوض لتسجيل النفوق.')}/operations/mortality`,
    buildPayload: ({ mortalityLine, mortalityDate, mortalityQuantity }) => ({
      line_number: mortalityLine,
      mortality_date: mortalityDate,
      quantity: mortalityQuantity,
    }),
  },
  log_fertilization: {
    title: actionTitles.log_fertilization,
    endpoint: ({ targetBasinId }) => `/nursery/manage/basins/${requireNumber(targetBasinId, 'يرجى تحديد حوض لتسجيل التسميد.')}/operations/fertilization`,
    buildPayload: ({ fertilizationDate, fertilizerId, fertilizationQuantity }) => ({
      fertilization_date: fertilizationDate,
      fertilizer_id: requireNumber(fertilizerId, 'يرجى اختيار السماد المستخدم.'),
      quantity: fertilizationQuantity,
    }),
  },
  transfer_cycle: {
    title: actionTitles.transfer_cycle,
    endpoint: () => '/nursery/manage/cycle-transfers',
    buildPayload: ({
      activeAction,
      selectedCycleId,
      activeChatCycleId,
      transferSuccessCount,
      transferMarkRemainingFailed,
      transferDate,
      transferBasinId,
      transferLineNumber,
    }) => {
      const cycleId = requireNumber(activeAction.cycle_id || selectedCycleId || activeChatCycleId, 'يرجى تحديد دورة إنتاج لإتمام النقل.')
      const basinId = requireNumber(transferBasinId, 'يرجى تحديد حوض الهدف.')

      return {
        cycle_id: cycleId,
        successful_count: transferSuccessCount,
        mark_remaining_failed: transferMarkRemainingFailed,
        transfer_date: transferDate,
        lines: [
          {
            basin_id: basinId,
            line_number: transferLineNumber,
            quantity: transferSuccessCount,
            pot_size: activeAction.pot_size || null,
            tree_height: activeAction.tree_height || 0.1,
          },
        ],
      }
    },
  },
}

export type { BuildPayloadArgs }
