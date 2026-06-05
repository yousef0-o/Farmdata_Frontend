import { apiRequest } from './client'
import type {
  MorningSummaryFilters,
  MorningSummaryResponse,
} from '../../types/morningSummary'

function buildMorningSummaryQuery(filters: MorningSummaryFilters = {}) {
  const params = new URLSearchParams()

  if (filters.date) params.set('date', filters.date)
  if (filters.company_id) params.set('company_id', String(filters.company_id))
  if (filters.project_id) params.set('project_id', String(filters.project_id))
  if (filters.section_id) params.set('section_id', String(filters.section_id))
  if (filters.barn_id) params.set('barn_id', String(filters.barn_id))

  const query = params.toString()
  return query ? `?${query}` : ''
}

export const morningSummaryApi = {
  getMorningSummary: (filters: MorningSummaryFilters = {}) =>
    apiRequest<MorningSummaryResponse>(
      `/dashboard/morning-summary${buildMorningSummaryQuery(filters)}`
    ),
}
