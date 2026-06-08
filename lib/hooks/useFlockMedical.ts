'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '../api/client'
import { PaginatedResponse, FlockMedicalRecord } from '../types'

type MedicalRecordMutationPayload = Record<string, unknown> | FormData

export function useFlockMedicalRecords(flockId: number, page = 1) {
  return useQuery({
    queryKey: ['flock-medical-records', flockId, page],
    queryFn: () =>
      apiRequest<PaginatedResponse<FlockMedicalRecord>>(
        `/flocks/${flockId}/medical-records?page=${page}`
      ),
  })
}

export function useFlockMedicalRecord(flockId: number, recordId: number) {
  return useQuery({
    queryKey: ['flock-medical-record', flockId, recordId],
    queryFn: () =>
      apiRequest<FlockMedicalRecord>(
        `/flocks/${flockId}/medical-records/${recordId}`
      ),
    enabled: !!recordId,
  })
}

export function useCreateFlockMedicalRecord(flockId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: MedicalRecordMutationPayload) =>
      apiRequest<FlockMedicalRecord>(`/flocks/${flockId}/medical-records`, {
        method: 'POST',
        body: data instanceof FormData ? data : JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flock-medical-records', flockId] })
    },
  })
}

export function useUpdateFlockMedicalRecord(flockId: number, recordId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: MedicalRecordMutationPayload) =>
      apiRequest<FlockMedicalRecord>(`/flocks/${flockId}/medical-records/${recordId}`, {
        method: data instanceof FormData ? 'POST' : 'PUT',
        body: data instanceof FormData ? withMethodOverride(data, 'PUT') : JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flock-medical-records', flockId] })
      queryClient.invalidateQueries({ queryKey: ['flock-medical-record', flockId, recordId] })
    },
  })
}

function withMethodOverride(formData: FormData, method: string): FormData {
  if (!formData.has('_method')) {
    formData.append('_method', method)
  }

  return formData
}

export function useDeleteFlockMedicalRecord(flockId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (recordId: number) =>
      apiRequest<void>(`/flocks/${flockId}/medical-records/${recordId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flock-medical-records', flockId] })
    },
  })
}
