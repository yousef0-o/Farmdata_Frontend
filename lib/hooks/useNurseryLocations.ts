'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { nurseryLocationsApi } from '../api/nurseryLocations'
import type {
  StoreIrrigationPlanPayload,
  StoreLocationPayload,
  UpsertBasinPayload,
  UpsertNurseryPayload,
  UpsertSectionPayload,
} from '../types/nurseryLocations'

export const nurseryLocationsQueryKey = ['nursery-locations', 'bootstrap']

function useInvalidateNurseryLocations() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: nurseryLocationsQueryKey })
}

export function useNurseryLocations() {
  return useQuery({
    queryKey: nurseryLocationsQueryKey,
    queryFn: nurseryLocationsApi.getBootstrap,
  })
}

export function useCreateNurseryLayout() {
  const invalidate = useInvalidateNurseryLocations()
  return useMutation({
    mutationFn: (payload: UpsertNurseryPayload) => nurseryLocationsApi.createNursery(payload),
    onSuccess: invalidate,
  })
}

export function useUpdateNurseryLayout() {
  const invalidate = useInvalidateNurseryLocations()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpsertNurseryPayload }) =>
      nurseryLocationsApi.updateNursery(id, payload),
    onSuccess: invalidate,
  })
}

export function useDeleteNurseryLayout() {
  const invalidate = useInvalidateNurseryLocations()
  return useMutation({
    mutationFn: (id: number) => nurseryLocationsApi.deleteNursery(id),
    onSuccess: invalidate,
  })
}

export function useCreateNurseryLocation() {
  const invalidate = useInvalidateNurseryLocations()
  return useMutation({
    mutationFn: (payload: StoreLocationPayload) => nurseryLocationsApi.createLocation(payload),
    onSuccess: invalidate,
  })
}

export function useDeleteNurseryLocation() {
  const invalidate = useInvalidateNurseryLocations()
  return useMutation({
    mutationFn: (id: number) => nurseryLocationsApi.deleteLocation(id),
    onSuccess: invalidate,
  })
}

export function useCreateNurserySection() {
  const invalidate = useInvalidateNurseryLocations()
  return useMutation({
    mutationFn: (payload: UpsertSectionPayload) => nurseryLocationsApi.createSection(payload),
    onSuccess: invalidate,
  })
}

export function useUpdateNurserySection() {
  const invalidate = useInvalidateNurseryLocations()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpsertSectionPayload }) =>
      nurseryLocationsApi.updateSection(id, payload),
    onSuccess: invalidate,
  })
}

export function useDeleteNurserySection() {
  const invalidate = useInvalidateNurseryLocations()
  return useMutation({
    mutationFn: (id: number) => nurseryLocationsApi.deleteSection(id),
    onSuccess: invalidate,
  })
}

export function useCreateNurseryBasin() {
  const invalidate = useInvalidateNurseryLocations()
  return useMutation({
    mutationFn: (payload: UpsertBasinPayload) => nurseryLocationsApi.createBasin(payload),
    onSuccess: invalidate,
  })
}

export function useUpdateNurseryBasin() {
  const invalidate = useInvalidateNurseryLocations()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpsertBasinPayload }) =>
      nurseryLocationsApi.updateBasin(id, payload),
    onSuccess: invalidate,
  })
}

export function useDeleteNurseryBasin() {
  const invalidate = useInvalidateNurseryLocations()
  return useMutation({
    mutationFn: (id: number) => nurseryLocationsApi.deleteBasin(id),
    onSuccess: invalidate,
  })
}

export function useCreateIrrigationPlan() {
  const invalidate = useInvalidateNurseryLocations()
  return useMutation({
    mutationFn: (payload: StoreIrrigationPlanPayload) =>
      nurseryLocationsApi.createIrrigationPlan(payload),
    onSuccess: invalidate,
  })
}

export function useDeleteIrrigationPlan() {
  const invalidate = useInvalidateNurseryLocations()
  return useMutation({
    mutationFn: (id: number) => nurseryLocationsApi.deleteIrrigationPlan(id),
    onSuccess: invalidate,
  })
}

export function useDeleteNurseryImage() {
  const invalidate = useInvalidateNurseryLocations()
  return useMutation({
    mutationFn: (id: number) => nurseryLocationsApi.deleteNurseryImage(id),
    onSuccess: invalidate,
  })
}
