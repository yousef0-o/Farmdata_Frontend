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
  cycleName: string
  cycleTreeTypeId: number
  cyclePropagationType?: string | null
  cycleSource?: string | null
  cycleCount: number
  cyclePotSize?: string | null
  cycleStartDate: string
  basinSectionId: number
  basinBaseName: string
  basinCount: number
  basinLength: number
  basinWidth: number
  basinIrrigationMethod: string
  procedureCycleId?: number | null
  procedureType: 'irrigation' | 'inspection' | 'humidity'
  procedureDate: string
  procedurePeriod?: string | null
  procedureStartTime?: string | null
  procedureEndTime?: string | null
  procedureHumidity?: number | null
  procedureNotes?: string | null
  // add_trees fields
  treeLineNumber: number
  treeTypeId: number
  treeQuantity: number
  treePotSize?: string | null
  treeHeight: number
  treeThickness: number
  treeBirthDate: string
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
  add_trees: 'إضافة شجر مقترحة',
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
  start_cycle: {
    title: actionTitles.start_cycle,
    endpoint: () => '/nursery/manage/cycles',
    buildPayload: ({
      targetBasinId,
      cycleName,
      cycleTreeTypeId,
      cyclePropagationType,
      cycleSource,
      cycleCount,
      cyclePotSize,
      cycleStartDate,
    }) => ({
      basin_id: requireNumber(targetBasinId, 'يرجى تحديد حوض لبدء دورة الإنتاج.'),
      name: cycleName,
      tree_type_id: requireNumber(cycleTreeTypeId, 'يرجى اختيار نوع الشجرة.'),
      propagation_type: cyclePropagationType || null,
      source: cycleSource || null,
      count: requireNumber(cycleCount, 'يرجى إدخال العدد.'),
      pot_size: cyclePotSize || null,
      start_date: cycleStartDate,
      status: 'active',
    }),
  },
  create_basin: {
    title: actionTitles.create_basin,
    endpoint: () => '/nursery/locations/basins',
    buildPayload: ({
      basinSectionId,
      basinBaseName,
      basinCount,
      basinLength,
      basinWidth,
      basinIrrigationMethod,
    }) => ({
      section_id: requireNumber(basinSectionId, 'يرجى تحديد القسم.'),
      base_name: basinBaseName,
      count: basinCount || 1,
      length: basinLength || 0,
      width: basinWidth || 0,
      irrigation_method: basinIrrigationMethod || null,
    }),
  },
  log_procedure: {
    title: actionTitles.log_procedure,
    endpoint: () => '/nursery/manage/cycle-procedures',
    buildPayload: ({
      activeAction,
      selectedCycleId,
      activeChatCycleId,
      procedureCycleId,
      procedureType,
      procedureDate,
      procedurePeriod,
      procedureStartTime,
      procedureEndTime,
      procedureHumidity,
      procedureNotes,
    }) => {
      const cycleId = requireNumber(
        procedureCycleId || activeAction.cycle_id || selectedCycleId || activeChatCycleId,
        'يرجى تحديد دورة إنتاج لتسجيل الإجراء.'
      )
      return {
        cycle_id: cycleId,
        procedure_type: procedureType,
        procedure_date: procedureDate,
        period: procedurePeriod || null,
        start_time: procedureStartTime || null,
        end_time: procedureEndTime || null,
        humidity_percentage: procedureHumidity !== null && procedureHumidity !== undefined ? Number(procedureHumidity) : null,
        notes: procedureNotes || null,
      }
    },
  },
  add_trees: {
    title: actionTitles.add_trees,
    endpoint: ({ targetBasinId }) => `/nursery/manage/basins/${requireNumber(targetBasinId, 'يرجى تحديد حوض لإضافة الشجر.')}/operations/trees`,
    buildPayload: ({
      treeLineNumber,
      treeTypeId,
      treeQuantity,
      treePotSize,
      treeHeight,
      treeThickness,
      treeBirthDate,
    }) => ({
      lines: [
        {
          line_number: requireNumber(treeLineNumber, 'يرجى إدخال رقم الخط.'),
          tree_type_id: requireNumber(treeTypeId, 'يرجى اختيار نوع الشجرة.'),
          quantity: requireNumber(treeQuantity, 'يرجى إدخال الكمية.'),
          pot_size: treePotSize || null,
          height: treeHeight || 0,
          thickness: treeThickness || 0,
          birth_date: treeBirthDate || null,
        },
      ],
    }),
  },
}

export type { BuildPayloadArgs }
