'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { nurseryOpeningBalancesApi } from '../api/nurseryOpeningBalances'
import type { NurseryOpeningBalancesPayload } from '../types/nurseryOpeningBalances'

const nurseryOpeningBalancesQueryKey = ['nursery-opening-balances', 'bootstrap']

export function useNurseryOpeningBalances() {
  return useQuery({
    queryKey: nurseryOpeningBalancesQueryKey,
    queryFn: nurseryOpeningBalancesApi.getBootstrap,
  })
}

export function useSaveNurseryOpeningBalances() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: NurseryOpeningBalancesPayload) => nurseryOpeningBalancesApi.store(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: nurseryOpeningBalancesQueryKey }),
  })
}
