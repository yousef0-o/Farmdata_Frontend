import { apiRequest, wrapResponse } from './client'
import type {
  NurseryCycle,
  NurseryCyclePayload,
  NurseryCycleProcedure,
  NurseryCycleProcedurePayload,
  NurseryCycleTransfer,
  NurseryCycleTransferPayload,
  NurseryBasinActivitiesPayload,
  NurseryBasinDashboardPayload,
  NurseryGeneralOperationContextType,
  NurseryGeneralOperationOptions,
  NurseryGeneralOperationPayload,
  NurseryManageFilters,
  NurseryManageLocationRow,
  NurseryManagePayload,
} from '../types/nurseryManagement'

export function buildNurseryManageQuery(filters: NurseryManageFilters) {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value))
    }
  })

  return params.toString()
}

export const nurseryManagementApi = {
  dashboard: (filters: NurseryManageFilters) => {
    const query = buildNurseryManageQuery(filters)
    return wrapResponse<NurseryManagePayload>(
      apiRequest(`/nursery/manage${query ? `?${query}` : ''}`)
    )
  },

  locations: (varietyId: number, potSize: string) => {
    const query = buildNurseryManageQuery({ variety_id: varietyId, pot_size: potSize })
    return wrapResponse<NurseryManageLocationRow[]>(
      apiRequest(`/nursery/manage/locations?${query}`)
    )
  },

  generalOperationOptions: (type: NurseryGeneralOperationContextType, id: number) =>
    wrapResponse<NurseryGeneralOperationOptions>(
      apiRequest(`/nursery/manage/general-operations?type=${encodeURIComponent(type)}&id=${id}`)
    ),

  createGeneralOperation: (payload: NurseryGeneralOperationPayload) =>
    apiRequest<{ message: string; data: { basin_count: number } }>(
      '/nursery/manage/general-operations',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  basinDashboard: (basinId: number) =>
    wrapResponse<NurseryBasinDashboardPayload>(
      apiRequest(`/nursery/manage/basins/${basinId}`)
    ),

  createBasinOperation: (basinId: number, operation: string, payload: unknown) =>
    wrapResponse<NurseryBasinDashboardPayload>(
      apiRequest(`/nursery/manage/basins/${basinId}/operations/${operation}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    ),

  basinActivities: (basinId: number, type = 'all') =>
    wrapResponse<NurseryBasinActivitiesPayload>(
      apiRequest(`/nursery/manage/basins/${basinId}/activities?type=${encodeURIComponent(type)}`)
    ),

  deleteBasinActivities: (basinId: number, items: Array<{ id: number; type: string }>) =>
    apiRequest<{ message: string }>(`/nursery/manage/basins/${basinId}/activities`, {
      method: 'DELETE',
      body: JSON.stringify({ items }),
    }),

  getCycle: (cycleId: number) =>
    wrapResponse<NurseryCycle>(
      apiRequest(`/nursery/manage/cycles/${cycleId}`)
    ),

  createCycle: (payload: NurseryCyclePayload) =>
    wrapResponse<NurseryCycle>(
      apiRequest('/nursery/manage/cycles', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    ),

  updateCycle: (cycleId: number, payload: NurseryCyclePayload) =>
    wrapResponse<NurseryCycle>(
      apiRequest(`/nursery/manage/cycles/${cycleId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
    ),

  deleteCycle: (cycleId: number) =>
    apiRequest<{ message: string }>(`/nursery/manage/cycles/${cycleId}`, {
      method: 'DELETE',
    }),

  createTransfer: (payload: NurseryCycleTransferPayload) =>
    wrapResponse<NurseryCycleTransfer>(
      apiRequest('/nursery/manage/cycle-transfers', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    ),

  createProcedure: (payload: NurseryCycleProcedurePayload) =>
    wrapResponse<NurseryCycleProcedure>(
      apiRequest('/nursery/manage/cycle-procedures', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    ),
}
