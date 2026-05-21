'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { suppliersApi } from '../api/suppliers'
import type { Supplier } from '../types'

export function useSuppliers(page = 1, filters: Parameters<typeof suppliersApi.listSuppliers>[1] = {}) {
  return useQuery({
    queryKey: ['suppliers', page, filters],
    queryFn: () => suppliersApi.listSuppliers(page, filters),
  })
}

export function useSupplier(id: number) {
  return useQuery({
    queryKey: ['supplier', id],
    queryFn: () => suppliersApi.getSupplier(id),
    enabled: id > 0,
  })
}

export function useSupplierStats() {
  return useQuery({
    queryKey: ['supplier-stats'],
    queryFn: () => suppliersApi.getSupplierStats(),
  })
}

export function useCreateSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: suppliersApi.createSupplier,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] })
      qc.invalidateQueries({ queryKey: ['supplier-stats'] })
    },
  })
}

export function useUpdateSupplier(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Supplier>) => suppliersApi.updateSupplier(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] })
      qc.invalidateQueries({ queryKey: ['supplier', id] })
      qc.invalidateQueries({ queryKey: ['supplier-stats'] })
    },
  })
}

export function useDeleteSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: suppliersApi.deleteSupplier,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] })
      qc.invalidateQueries({ queryKey: ['supplier-stats'] })
    },
  })
}

export function useBulkDeleteSuppliers() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: suppliersApi.bulkDeleteSuppliers,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] })
      qc.invalidateQueries({ queryKey: ['supplier-stats'] })
    },
  })
}

export function useToggleSuspendSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: suppliersApi.toggleSuspendSupplier,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['suppliers'] })
      if (res?.data?.id) {
        qc.invalidateQueries({ queryKey: ['supplier', res.data.id] })
      }
      qc.invalidateQueries({ queryKey: ['supplier-stats'] })
    },
  })
}

export function useImportSuppliers() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: suppliersApi.importSuppliers,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] })
      qc.invalidateQueries({ queryKey: ['supplier-stats'] })
    },
  })
}
