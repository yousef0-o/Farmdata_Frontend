'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { financialApi } from '../api/financial'
import type { InvoicePayload } from '../api/financial'

export function useInvoices(type: 'sales' | 'purchase', search?: string, page = 1) {
  return useQuery({
    queryKey: ['financial-invoices', type, search, page],
    queryFn: () => financialApi.listInvoices(type, search, page),
  })
}

export function useCreateInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: InvoicePayload) => financialApi.createInvoice(data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['financial-invoices', variables.type] })
      qc.invalidateQueries({ queryKey: ['inventory-movements'] })
    },
  })
}

export function useDeleteInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, type }: { id: number; type: 'sales' | 'purchase' }) => financialApi.deleteInvoice(id, type),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['financial-invoices', variables.type] })
      qc.invalidateQueries({ queryKey: ['inventory-movements'] })
    },
  })
}
