'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { nurseryInvoicesApi } from '../api/nurseryInvoices'
import type {
  NurseryInvoicePayload,
  NurseryInvoiceSettings,
  NurseryInvoiceType,
} from '../types/nurseryInvoices'

export const nurseryInvoicesQueryKey = (type: NurseryInvoiceType | 'all' = 'all') => [
  'nursery-invoices',
  type,
]

export function useNurseryInvoices(type: NurseryInvoiceType | 'all' = 'all') {
  return useQuery({
    queryKey: nurseryInvoicesQueryKey(type),
    queryFn: () => nurseryInvoicesApi.bootstrap(type),
  })
}

export function useNurseryInvoice(id: number | null) {
  return useQuery({
    queryKey: ['nursery-invoices', 'details', id],
    queryFn: () => nurseryInvoicesApi.show(id as number),
    enabled: Boolean(id),
  })
}

export function useCreateNurseryInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: NurseryInvoicePayload) => nurseryInvoicesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nursery-invoices'] })
      queryClient.invalidateQueries({ queryKey: ['nursery-management'] })
      queryClient.invalidateQueries({ queryKey: ['nursery-inventory'] })
    },
  })
}

export function useUpdateNurseryInvoiceSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Partial<NurseryInvoiceSettings> | FormData) =>
      nurseryInvoicesApi.updateSettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nursery-invoices'] })
    },
  })
}
