'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { eggStandardsApi } from '@/lib/api/eggStandards'
import type { EggSizeStandardUpdateRow } from '@/types/eggStandards'

export function useEggStandards() {
  return useQuery({
    queryKey: ['egg-size-standards'],
    queryFn: eggStandardsApi.list,
  })
}

export function useUpdateEggStandards() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (standards: EggSizeStandardUpdateRow[]) => eggStandardsApi.update(standards),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['egg-size-standards'] })
      queryClient.invalidateQueries({ queryKey: ['flock-analytics'] })
      queryClient.invalidateQueries({ queryKey: ['company-statistics'] })
      queryClient.invalidateQueries({ queryKey: ['project-statistics'] })
      queryClient.invalidateQueries({ queryKey: ['section-statistics'] })
      queryClient.invalidateQueries({ queryKey: ['barn-statistics'] })
    },
  })
}
