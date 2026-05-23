'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { financialApi, OpeningBalancePayload } from '../api/financial'

export function useOpeningBalances(balanceDate?: string) {
  return useQuery({
    queryKey: ['opening-balances', balanceDate],
    queryFn: () => financialApi.listOpeningBalances(balanceDate),
  })
}

export function useSaveOpeningBalances() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: OpeningBalancePayload) => financialApi.saveOpeningBalances(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['opening-balances'] })
    },
  })
}

export function useImportOpeningBalances() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (formData: FormData) => financialApi.importOpeningBalances(formData),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['opening-balances'] })
    },
  })
}
