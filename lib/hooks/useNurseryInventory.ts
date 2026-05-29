'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { nurseryInventoryApi } from '../api/nurseryInventory'
import type {
  NurseryInventoryCategoryPayload,
  NurseryInventoryItemPayload,
  NurseryInventoryLocationPayload,
  NurseryInventoryOpeningBalancePayload,
} from '../types'

const bootstrapQueryKey = ['nursery-inventory', 'bootstrap']
const valuationQueryKey = ['nursery-inventory', 'valuation']

export function useNurseryInventoryBootstrap() {
  return useQuery({
    queryKey: bootstrapQueryKey,
    queryFn: nurseryInventoryApi.getBootstrap,
  })
}

export function useNurseryInventoryValuation() {
  return useQuery({
    queryKey: valuationQueryKey,
    queryFn: nurseryInventoryApi.getValuation,
  })
}

function useNurseryInventoryInvalidation() {
  const queryClient = useQueryClient()

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: bootstrapQueryKey }),
      queryClient.invalidateQueries({ queryKey: valuationQueryKey }),
    ])
}

export function useCreateNurseryInventoryCategory() {
  const invalidate = useNurseryInventoryInvalidation()

  return useMutation({
    mutationFn: (payload: NurseryInventoryCategoryPayload) =>
      nurseryInventoryApi.createCategory(payload),
    onSuccess: invalidate,
  })
}

export function useUpdateNurseryInventoryCategory() {
  const invalidate = useNurseryInventoryInvalidation()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: NurseryInventoryCategoryPayload }) =>
      nurseryInventoryApi.updateCategory(id, payload),
    onSuccess: invalidate,
  })
}

export function useDeleteNurseryInventoryCategory() {
  const invalidate = useNurseryInventoryInvalidation()

  return useMutation({
    mutationFn: (id: number) => nurseryInventoryApi.deleteCategory(id),
    onSuccess: invalidate,
  })
}

export function useCreateNurseryInventoryLocation() {
  const invalidate = useNurseryInventoryInvalidation()

  return useMutation({
    mutationFn: (payload: NurseryInventoryLocationPayload) =>
      nurseryInventoryApi.createLocation(payload),
    onSuccess: invalidate,
  })
}

export function useUpdateNurseryInventoryLocation() {
  const invalidate = useNurseryInventoryInvalidation()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: NurseryInventoryLocationPayload }) =>
      nurseryInventoryApi.updateLocation(id, payload),
    onSuccess: invalidate,
  })
}

export function useDeleteNurseryInventoryLocation() {
  const invalidate = useNurseryInventoryInvalidation()

  return useMutation({
    mutationFn: (id: number) => nurseryInventoryApi.deleteLocation(id),
    onSuccess: invalidate,
  })
}

export function useCreateNurseryInventoryItem() {
  const invalidate = useNurseryInventoryInvalidation()

  return useMutation({
    mutationFn: (payload: NurseryInventoryItemPayload) =>
      nurseryInventoryApi.createItem(payload),
    onSuccess: invalidate,
  })
}

export function useUpdateNurseryInventoryItem() {
  const invalidate = useNurseryInventoryInvalidation()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: NurseryInventoryItemPayload }) =>
      nurseryInventoryApi.updateItem(id, payload),
    onSuccess: invalidate,
  })
}

export function useDeleteNurseryInventoryItem() {
  const invalidate = useNurseryInventoryInvalidation()

  return useMutation({
    mutationFn: (id: number) => nurseryInventoryApi.deleteItem(id),
    onSuccess: invalidate,
  })
}

export function useStoreNurseryOpeningBalances() {
  const invalidate = useNurseryInventoryInvalidation()

  return useMutation({
    mutationFn: (payload: NurseryInventoryOpeningBalancePayload) =>
      nurseryInventoryApi.storeOpeningBalances(payload),
    onSuccess: invalidate,
  })
}
