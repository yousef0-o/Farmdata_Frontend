import { apiRequest } from './client'
import type {
  NurseryGuideListParams,
  NurseryVarietyListResponse,
  NurseryVarietyListParams,
  PaginatedApiResponse,
  TreeGuide,
  TreeGuidePayload,
  TreeVariety,
  TreeVarietyPayload,
} from '../types'

function toQueryString(params: Record<string, unknown>) {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    searchParams.set(key, String(value))
  })

  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

export const nurseryVarietiesApi = {
  listVarieties: (params: NurseryVarietyListParams = {}) =>
    apiRequest<NurseryVarietyListResponse>(
      `/nursery/varieties${toQueryString(params)}`
    ),

  createVariety: (payload: TreeVarietyPayload) =>
    apiRequest<{ data: TreeVariety }>('/nursery/varieties', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateVariety: (id: number, payload: TreeVarietyPayload) =>
    apiRequest<{ data: TreeVariety }>(`/nursery/varieties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteVariety: (id: number) =>
    apiRequest<void>(`/nursery/varieties/${id}`, { method: 'DELETE' }),

  listGuides: (params: NurseryGuideListParams = {}) =>
    apiRequest<PaginatedApiResponse<TreeGuide>>(
      `/nursery/tree-guide${toQueryString(params)}`
    ),

  createGuide: (payload: TreeGuidePayload) =>
    apiRequest<{ data: TreeGuide }>('/nursery/tree-guide', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateGuide: (id: number, payload: TreeGuidePayload) =>
    apiRequest<{ data: TreeGuide }>(`/nursery/tree-guide/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteGuide: (id: number) =>
    apiRequest<void>(`/nursery/tree-guide/${id}`, { method: 'DELETE' }),

  copyGuideToVarieties: (id: number) =>
    apiRequest<{ data: TreeVariety }>(`/nursery/tree-guide/${id}/copy-to-varieties`, {
      method: 'POST',
    }),
}
