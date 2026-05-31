'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { nurseryFieldsApi } from '@/lib/api/nurseryFields'
import type {
  CreateNurseryFieldOptionPayload,
  NurseryFieldOptionType,
} from '@/lib/types/nurseryFields'

export const nurseryFieldsQueryKey = ['nursery-fields', 'all']

export function useNurseryFieldOptions() {
  return useQuery({
    queryKey: nurseryFieldsQueryKey,
    queryFn: nurseryFieldsApi.getAll,
  })
}

export function useCreateNurseryFieldOption() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      type,
      payload,
    }: {
      type: NurseryFieldOptionType
      payload: CreateNurseryFieldOptionPayload
    }) => nurseryFieldsApi.create(type, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nurseryFieldsQueryKey })
    },
  })
}

export function useDeleteNurseryFieldOption() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => nurseryFieldsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nurseryFieldsQueryKey })
    },
  })
}
