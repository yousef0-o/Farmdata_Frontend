import { apiRequest, apiRequestRaw, wrapResponse } from './client'
import type {
  StoreIrrigationPlanPayload,
  StoreLocationPayload,
  NurseryLocationsBootstrap,
  UpsertBasinPayload,
  UpsertNurseryPayload,
  UpsertSectionPayload,
} from '../types/nurseryLocations'

function appendNumber(formData: FormData, key: string, value: number) {
  formData.append(key, String(Number.isFinite(value) ? value : 0))
}

function buildNurseryFormData(payload: UpsertNurseryPayload) {
  const formData = new FormData()

  formData.append('name', payload.name)
  appendNumber(formData, 'length', payload.length)
  appendNumber(formData, 'width', payload.width)
  appendNumber(formData, 'num_wells', payload.num_wells)
  appendNumber(formData, 'num_well_machines', payload.num_well_machines)
  appendNumber(formData, 'well_line_length', payload.well_line_length)

  payload.long_lines.forEach((line, index) => {
    appendNumber(formData, `long_lines[${index}][length]`, line.length)
    formData.append(`long_lines[${index}][size]`, line.size)
    appendNumber(formData, `long_lines[${index}][num_valves]`, line.num_valves)
    appendNumber(formData, `long_lines[${index}][num_connections]`, line.num_connections)
    appendNumber(formData, `long_lines[${index}][num_dividers]`, line.num_dividers)
  })

  payload.trans_lines.forEach((line, index) => {
    appendNumber(formData, `trans_lines[${index}][length]`, line.length)
    formData.append(`trans_lines[${index}][size]`, line.size)
    appendNumber(formData, `trans_lines[${index}][num_valves]`, line.num_valves)
    appendNumber(formData, `trans_lines[${index}][num_connections]`, line.num_connections)
    appendNumber(formData, `trans_lines[${index}][num_dividers]`, line.num_dividers)
  })

  payload.images?.forEach((image) => formData.append('images[]', image))

  return formData
}

export const nurseryLocationsApi = {
  getBootstrap: () =>
    wrapResponse<NurseryLocationsBootstrap>(apiRequest('/nursery/locations/bootstrap')),

  createNursery: async (payload: UpsertNurseryPayload) => {
    const response = await apiRequestRaw('/nursery/locations/nurseries', {
      method: 'POST',
      body: buildNurseryFormData(payload),
    })

    if (!response.ok) throw await response.json().catch(() => ({ message: 'Request failed' }))

    return response.json()
  },

  updateNursery: async (id: number, payload: UpsertNurseryPayload) => {
    const response = await apiRequestRaw(`/nursery/locations/nurseries/${id}`, {
      method: 'POST',
      body: buildNurseryFormData(payload),
    })

    if (!response.ok) throw await response.json().catch(() => ({ message: 'Request failed' }))

    return response.json()
  },

  deleteNursery: (id: number) =>
    apiRequest<void>(`/nursery/locations/nurseries/${id}`, { method: 'DELETE' }),

  createLocation: (payload: StoreLocationPayload) =>
    apiRequest('/nursery/locations/locations', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteLocation: (id: number) =>
    apiRequest<void>(`/nursery/locations/locations/${id}`, { method: 'DELETE' }),

  createSection: (payload: UpsertSectionPayload) =>
    apiRequest('/nursery/locations/sections', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateSection: (id: number, payload: UpsertSectionPayload) =>
    apiRequest(`/nursery/locations/sections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteSection: (id: number) =>
    apiRequest<void>(`/nursery/locations/sections/${id}`, { method: 'DELETE' }),

  createBasin: (payload: UpsertBasinPayload) =>
    apiRequest('/nursery/locations/basins', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateBasin: (id: number, payload: UpsertBasinPayload) =>
    apiRequest(`/nursery/locations/basins/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteBasin: (id: number) =>
    apiRequest<void>(`/nursery/locations/basins/${id}`, { method: 'DELETE' }),

  createIrrigationPlan: (payload: StoreIrrigationPlanPayload) =>
    apiRequest('/nursery/locations/irrigation-plans', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteIrrigationPlan: (id: number) =>
    apiRequest<void>(`/nursery/locations/irrigation-plans/${id}`, { method: 'DELETE' }),

  deleteNurseryImage: (id: number) =>
    apiRequest<void>(`/nursery/images/${id}`, { method: 'DELETE' }),
}
