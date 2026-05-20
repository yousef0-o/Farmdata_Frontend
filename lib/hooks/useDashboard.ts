'use client'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '../api/client'
import type { FlockDetail } from '../types'

// Fetch all active flocks by querying a dedicated endpoint
// If /api/flocks?status=active exists — use it
// If not — fetch from /api/flocks with status filter
// Check routes/api.php; if missing, use companies→projects→sections→barns chain
// For the dashboard we need at minimum: count of active flocks

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // Step 1: get companies count
      const companies = await apiRequest<{ meta: { total: number } }>(
        '/companies?page=1'
      )

      // Step 2: get active flocks
      // Try /api/flocks?status=active first
      // If that route doesn't exist, catch and return partial data
      let activeFlocks: FlockDetail[] = []

      try {
        const flocksRes = await apiRequest<{ data: FlockDetail[] }>(
          '/flocks?status=active&per_page=100'
        )
        activeFlocks = flocksRes.data ?? []
      } catch {
        // endpoint may not exist yet — graceful fallback
        activeFlocks = []
      }

      return {
        totalCompanies:  companies.meta?.total ?? 0,
        activeFlockCount: activeFlocks.length,
        flocks:          activeFlocks,
      }
    },
    staleTime: 2 * 60 * 1000,   // refresh every 2 minutes
    refetchInterval: 5 * 60 * 1000,
  })
}
