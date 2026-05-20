'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { assetsApi } from '../api/assets'
import type { Asset } from '../types'

export function useAssets(page = 1, filters: Parameters<typeof assetsApi.listAssets>[1] = {}) {
  return useQuery({
    queryKey: ['assets', page, filters],
    queryFn: () => assetsApi.listAssets(page, filters),
  })
}

export function useAsset(id: number) {
  return useQuery({
    queryKey: ['asset', id],
    queryFn: () => assetsApi.getAsset(id),
    enabled: id > 0,
  })
}

export function useAssetStats() {
  return useQuery({
    queryKey: ['asset-stats'],
    queryFn: () => assetsApi.getAssetStats(),
  })
}

export function useCreateAsset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: assetsApi.createAsset,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assets'] })
      qc.invalidateQueries({ queryKey: ['asset-stats'] })
    },
  })
}

export function useUpdateAsset(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Asset>) => assetsApi.updateAsset(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assets'] })
      qc.invalidateQueries({ queryKey: ['asset', id] })
      qc.invalidateQueries({ queryKey: ['asset-stats'] })
    },
  })
}

export function useDeleteAsset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: assetsApi.deleteAsset,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assets'] })
      qc.invalidateQueries({ queryKey: ['asset-stats'] })
    },
  })
}

export function useBulkDeleteAssets() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: assetsApi.bulkDeleteAssets,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assets'] })
      qc.invalidateQueries({ queryKey: ['asset-stats'] })
    },
  })
}

export function useImportAssets() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: assetsApi.importAssets,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assets'] })
      qc.invalidateQueries({ queryKey: ['asset-stats'] })
    },
  })
}
