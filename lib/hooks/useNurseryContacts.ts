'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { nurseryContactsApi, type CreateNurseryContactRequest, type UpdateNurseryContactRequest } from '@/lib/api/nurseryContacts'

export function useNurseryContacts() {
  const queryClient = useQueryClient()

  const contactsQuery = useQuery({
    queryKey: ['nursery-contacts'],
    queryFn: async () => {
      try {
        const result = await nurseryContactsApi.list()
        console.log('API Response:', result)
        return result
      } catch (error) {
        console.error('API Error fetching contacts:', error)
        throw error
      }
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateNurseryContactRequest) => nurseryContactsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nursery-contacts'] })
    },
    onError: (error) => {
      console.error('Create contact error:', error)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateNurseryContactRequest }) =>
      nurseryContactsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nursery-contacts'] })
    },
    onError: (error) => {
      console.error('Update contact error:', error)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => nurseryContactsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nursery-contacts'] })
    },
    onError: (error) => {
      console.error('Delete contact error:', error)
    },
  })

  return {
    contacts: contactsQuery.data?.data ?? [],
    counters: contactsQuery.data?.counters,
    isLoading: contactsQuery.isLoading,
    error: contactsQuery.error,
    createContact: createMutation.mutate,
    updateContact: updateMutation.mutate,
    deleteContact: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
