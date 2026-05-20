import { apiRequest } from './client'
import type { Company, FlockSummary } from '../types'

export const dashboardApi = {
  // Fetch all companies to count them
  getCompanies: () =>
    apiRequest<{ data: Company[]; meta: { total: number } }>('/companies'),

  // Single flock summary (reuse existing)
  getFlockSummary: (flockId: number) =>
    apiRequest<FlockSummary>(`/flocks/${flockId}/summary`),
}
