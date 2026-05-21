'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customersApi } from '../api/customers'
import type { Customer } from '../types'

export function useCustomers(page = 1, filters: Parameters<typeof customersApi.listCustomers>[1] = {}) {
  return useQuery({
    queryKey: ['customers', page, filters],
    queryFn: () => customersApi.listCustomers(page, filters),
  })
}

export function useCustomer(id: number) {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: () => customersApi.getCustomer(id),
    enabled: id > 0,
  })
}

export function useCustomerStats() {
  return useQuery({
    queryKey: ['customer-stats'],
    queryFn: () => customersApi.getCustomerStats(),
  })
}

export function useCreateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: customersApi.createCustomer,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      qc.invalidateQueries({ queryKey: ['customer-stats'] })
    },
  })
}

export function useUpdateCustomer(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Customer>) => customersApi.updateCustomer(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      qc.invalidateQueries({ queryKey: ['customer', id] })
      qc.invalidateQueries({ queryKey: ['customer-stats'] })
    },
  })
}

export function useDeleteCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: customersApi.deleteCustomer,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      qc.invalidateQueries({ queryKey: ['customer-stats'] })
    },
  })
}

export function useBulkDeleteCustomers() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: customersApi.bulkDeleteCustomers,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      qc.invalidateQueries({ queryKey: ['customer-stats'] })
    },
  })
}

export function useBulkSuspendCustomers() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: customersApi.bulkSuspendCustomers,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      qc.invalidateQueries({ queryKey: ['customer-stats'] })
    },
  })
}

export function useToggleSuspendCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: customersApi.toggleSuspendCustomer,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      if (res?.data?.id) {
        qc.invalidateQueries({ queryKey: ['customer', res.data.id] })
      }
      qc.invalidateQueries({ queryKey: ['customer-stats'] })
    },
  })
}

export function useImportCustomers() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: customersApi.importCustomers,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      qc.invalidateQueries({ queryKey: ['customer-stats'] })
    },
  })
}
