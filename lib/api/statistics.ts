import { apiRequest } from './client'
import type {
  AnalyticsAggregation,
  AnalyticsAxis,
  FlockAnalyticsResponse,
} from '../types'

export type FlockAnalyticsParams = {
  flock_id?: number
  barn_id?: number
  section_id?: number
  project_id?: number
  company_id?: number
  year?: number
  date_from?: string
  date_to?: string
  aggregation?: AnalyticsAggregation
  axis?: AnalyticsAxis
  active_flocks_only?: boolean
}

export const statisticsApi = {
  getFlockAnalytics: (params: FlockAnalyticsParams) => {
    const search = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return
      search.set(key, String(value))
    })

    return apiRequest<FlockAnalyticsResponse>(`/statistics?${search.toString()}`)
  },
}
