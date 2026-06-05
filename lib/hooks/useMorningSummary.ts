'use client'

import { useQuery } from '@tanstack/react-query'
import { morningSummaryApi } from '../api/morningSummary'
import type { MorningSummaryFilters } from '../../types/morningSummary'

export function useMorningSummary(filters: MorningSummaryFilters = {}) {
  return useQuery({
    queryKey: ['morning-summary', filters],
    queryFn: () => morningSummaryApi.getMorningSummary(filters),
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  })
}
