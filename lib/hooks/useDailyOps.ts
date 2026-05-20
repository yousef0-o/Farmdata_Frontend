'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dailyOpsApi } from '../api/organization'

export function useProductionEntries(flockId: number, page = 1) {
  return useQuery({
    queryKey: ['production-entries', flockId, page],
    queryFn: () => dailyOpsApi.listProductionEntries(flockId, page),
  })
}

export function useBreedingEntries(flockId: number, page = 1) {
  return useQuery({
    queryKey: ['breeding-entries', flockId, page],
    queryFn: () => dailyOpsApi.listBreedingEntries(flockId, page),
  })
}

export function useCreateProductionEntry(flockId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof dailyOpsApi.createProductionEntry>[1]) =>
      dailyOpsApi.createProductionEntry(flockId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-entries', flockId] })
      queryClient.invalidateQueries({ queryKey: ['flock-summary', flockId] })
      queryClient.invalidateQueries({ queryKey: ['flock', flockId] })
    },
  })
}

export function useCreateBreedingEntry(flockId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof dailyOpsApi.createBreedingEntry>[1]) =>
      dailyOpsApi.createBreedingEntry(flockId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breeding-entries', flockId] })
      queryClient.invalidateQueries({ queryKey: ['flock-summary', flockId] })
      queryClient.invalidateQueries({ queryKey: ['flock', flockId] })
    },
  })
}

export function useDeleteProductionEntry(flockId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (entryId: number) =>
      dailyOpsApi.deleteProductionEntry(flockId, entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-entries', flockId] })
      queryClient.invalidateQueries({ queryKey: ['flock-summary', flockId] })
      queryClient.invalidateQueries({ queryKey: ['flock', flockId] })
    },
  })
}

export function useDeleteBreedingEntry(flockId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (entryId: number) =>
      dailyOpsApi.deleteBreedingEntry(flockId, entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breeding-entries', flockId] })
      queryClient.invalidateQueries({ queryKey: ['flock-summary', flockId] })
      queryClient.invalidateQueries({ queryKey: ['flock', flockId] })
    },
  })
}

export function useUpdateProductionEntry(flockId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ entryId, data }: {
      entryId: number
      data: Parameters<typeof dailyOpsApi.updateProductionEntry>[2]
    }) => dailyOpsApi.updateProductionEntry(flockId, entryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-entries', flockId] })
      queryClient.invalidateQueries({ queryKey: ['flock-summary', flockId] })
      queryClient.invalidateQueries({ queryKey: ['flock', flockId] })
    },
  })
}

export function useUpdateBreedingEntry(flockId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ entryId, data }: {
      entryId: number
      data: Parameters<typeof dailyOpsApi.updateBreedingEntry>[2]
    }) => dailyOpsApi.updateBreedingEntry(flockId, entryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breeding-entries', flockId] })
      queryClient.invalidateQueries({ queryKey: ['flock-summary', flockId] })
      queryClient.invalidateQueries({ queryKey: ['flock', flockId] })
    },
  })
}

export function useProductionEntry(flockId: number, entryId: number) {
  return useQuery({
    queryKey: ['production-entry', flockId, entryId],
    queryFn: () => dailyOpsApi.getProductionEntry(flockId, entryId),
    enabled: entryId > 0,
  })
}

export function useBreedingEntry(flockId: number, entryId: number) {
  return useQuery({
    queryKey: ['breeding-entry', flockId, entryId],
    queryFn: () => dailyOpsApi.getBreedingEntry(flockId, entryId),
    enabled: entryId > 0,
  })
}

