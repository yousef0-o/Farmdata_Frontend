'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { nurseryVarietiesApi } from '../api/nurseryVarieties'
import type {
  NurseryGuideListParams,
  NurseryVarietyListParams,
  TreeGuidePayload,
  TreeVarietyPayload,
} from '../types'

export const nurseryVarietiesQueryKey = ['nursery-varieties']
export const nurseryGuidesQueryKey = ['nursery-tree-guide']

export function useNurseryVarieties(params: NurseryVarietyListParams) {
  return useQuery({
    queryKey: [...nurseryVarietiesQueryKey, params],
    queryFn: () => nurseryVarietiesApi.listVarieties(params),
  })
}

export function useNurseryTreeGuides(params: NurseryGuideListParams) {
  return useQuery({
    queryKey: [...nurseryGuidesQueryKey, params],
    queryFn: () => nurseryVarietiesApi.listGuides(params),
  })
}

function useNurseryVarietyInvalidation() {
  const queryClient = useQueryClient()

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: nurseryVarietiesQueryKey }),
      queryClient.invalidateQueries({ queryKey: nurseryGuidesQueryKey }),
      queryClient.invalidateQueries({ queryKey: ['nursery-lines'] }),
    ])
}

export function useCreateNurseryVariety() {
  const invalidate = useNurseryVarietyInvalidation()

  return useMutation({
    mutationFn: (payload: TreeVarietyPayload) => nurseryVarietiesApi.createVariety(payload),
    onSuccess: invalidate,
  })
}

export function useUpdateNurseryVariety() {
  const invalidate = useNurseryVarietyInvalidation()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: TreeVarietyPayload }) =>
      nurseryVarietiesApi.updateVariety(id, payload),
    onSuccess: invalidate,
  })
}

export function useDeleteNurseryVariety() {
  const invalidate = useNurseryVarietyInvalidation()

  return useMutation({
    mutationFn: (id: number) => nurseryVarietiesApi.deleteVariety(id),
    onSuccess: invalidate,
  })
}

export function useCreateNurseryTreeGuide() {
  const invalidate = useNurseryVarietyInvalidation()

  return useMutation({
    mutationFn: (payload: TreeGuidePayload) => nurseryVarietiesApi.createGuide(payload),
    onSuccess: invalidate,
  })
}

export function useUpdateNurseryTreeGuide() {
  const invalidate = useNurseryVarietyInvalidation()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: TreeGuidePayload }) =>
      nurseryVarietiesApi.updateGuide(id, payload),
    onSuccess: invalidate,
  })
}

export function useDeleteNurseryTreeGuide() {
  const invalidate = useNurseryVarietyInvalidation()

  return useMutation({
    mutationFn: (id: number) => nurseryVarietiesApi.deleteGuide(id),
    onSuccess: invalidate,
  })
}

export function useCopyNurseryTreeGuideToVarieties() {
  const invalidate = useNurseryVarietyInvalidation()

  return useMutation({
    mutationFn: (id: number) => nurseryVarietiesApi.copyGuideToVarieties(id),
    onSuccess: invalidate,
  })
}

export function useAutofillNurseryTreeGuide() {
  return useMutation({
    mutationFn: (payload: { name: string; current_data?: Record<string, unknown> }) =>
      nurseryVarietiesApi.autofillGuide(payload),
  })
}
