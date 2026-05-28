'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { statisticsApi, type FlockAnalyticsParams } from '../api/statistics'

export function buildFlockAnalyticsQueryKey(params: FlockAnalyticsParams) {
  return ['flock-analytics', params] as const
}

export function useFlockAnalytics(params: FlockAnalyticsParams) {
  const [debouncedParams, setDebouncedParams] = useState(params)

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedParams(params), 220)
    return () => window.clearTimeout(timeout)
  }, [params])

  return useQuery({
    queryKey: buildFlockAnalyticsQueryKey(debouncedParams),
    queryFn: () => statisticsApi.getFlockAnalytics(debouncedParams),
    enabled: Boolean(
      debouncedParams.flock_id ||
        debouncedParams.barn_id ||
        debouncedParams.section_id ||
        debouncedParams.project_id ||
        debouncedParams.company_id
    ),
    staleTime: 60 * 1000,
  })
}

export function useInvalidateFlockAnalytics() {
  const queryClient = useQueryClient()

  return useMemo(
    () => ({
      all: () => queryClient.invalidateQueries({ queryKey: ['flock-analytics'] }),
      byFlock: (flockId: number) =>
        queryClient.invalidateQueries({
          predicate: (query) => {
            const [root, params] = query.queryKey as [string, FlockAnalyticsParams | undefined]
            return root === 'flock-analytics' && (
              params?.flock_id === flockId ||
              params?.barn_id !== undefined ||
              params?.section_id !== undefined ||
              params?.project_id !== undefined ||
              params?.company_id !== undefined
            )
          },
        }),
    }),
    [queryClient]
  )
}
