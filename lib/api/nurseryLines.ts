import { API_BASE, apiRequest, apiRequestRaw, wrapResponse } from './client'
import type { NurseryLineLedgerFilters, NurseryLineLedgerPayload } from '../types/nurseryLines'

export function buildNurseryLineQuery(filters: NurseryLineLedgerFilters) {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value))
    }
  })

  return params.toString()
}

export const nurseryLinesApi = {
  list: (filters: NurseryLineLedgerFilters) => {
    const query = buildNurseryLineQuery(filters)
    return wrapResponse<NurseryLineLedgerPayload>(
      apiRequest(`/nursery/lines${query ? `?${query}` : ''}`)
    )
  },

  exportUrl: (filters: NurseryLineLedgerFilters) => {
    const query = buildNurseryLineQuery(filters)
    return `${API_BASE}/nursery/lines/export${query ? `?${query}` : ''}`
  },

  exportCsv: async (filters: NurseryLineLedgerFilters) => {
    const query = buildNurseryLineQuery(filters)
    return apiRequestRaw(`/nursery/lines/export${query ? `?${query}` : ''}`)
  },
}
