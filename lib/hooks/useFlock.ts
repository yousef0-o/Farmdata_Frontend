'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { flockApi } from '../api/organization'
import { apiRequest } from '../api/client'
import { PaginatedResponse, Flock, FlockDetail } from '../types'

export function useFlocks(status?: string, page = 1) {
  return useQuery({
    queryKey: ['flocks', status, page],
    queryFn: () => {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      params.set('page', String(page))
      params.set('per_page', '20')
      return apiRequest<PaginatedResponse<FlockDetail>>(
        `/flocks?${params.toString()}`
      )
    },
  })
}

export function useFlock(id: number) {
  return useQuery({
    queryKey: ['flock', id],
    queryFn: () => flockApi.getFlock(id),
  })
}

export function useFlockSummary(id: number) {
  return useQuery({
    queryKey: ['flock-summary', id],
    queryFn: () => flockApi.getFlockSummary(id),
  })
}

export function useCreateFlock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: flockApi.createFlock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barn'] })
    },
  })
}

export function useCloseFlock(flockId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<(typeof flockApi)['closeFlock']>[1]) =>
      flockApi.closeFlock(flockId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flock', flockId] })
      queryClient.invalidateQueries({ queryKey: ['flock-summary', flockId] })
    },
  })
}

export function useUpdateFlock(flockId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { breed?: string; supplier?: string; chick_unit_cost?: number }) =>
      flockApi.updateFlock(flockId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flock', flockId] })
      queryClient.invalidateQueries({ queryKey: ['flocks'] })
    },
  })
}

