'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { teamApi } from '../api/team'
import type { User } from '../types'

export function useTeamUsers(page = 1, search = '') {
  return useQuery({
    queryKey: ['team-users', page, search],
    queryFn: () => teamApi.listUsers(page, search),
  })
}

export function useRolesAndPermissions() {
  return useQuery({
    queryKey: ['roles-permissions'],
    queryFn: () => teamApi.getRolesPermissions(),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours (rarely changes)
  })
}

export function useCreateTeamUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: teamApi.createUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team-users'] })
    },
  })
}

export function useUpdateTeamUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<User> & { password?: string; role_ids?: number[]; permission_ids?: number[] } }) =>
      teamApi.updateUser(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team-users'] })
      qc.invalidateQueries({ queryKey: ['me'] }) // Invalidate active user profile in case of self update
    },
  })
}

export function useDeleteTeamUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: teamApi.deleteUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team-users'] })
    },
  })
}
