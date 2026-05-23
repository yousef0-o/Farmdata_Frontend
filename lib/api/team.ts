import { apiRequest, wrapResponse } from './client'
import type { User, PaginatedResponse } from '../types'

export interface RolesPermissionsResponse {
  roles: { id: number; name: string }[]
  permissions: { id: number; name: string }[]
}

export const teamApi = {
  listUsers: (page = 1, search = '') => {
    const params = new URLSearchParams()
    params.set('page', String(page))
    if (search) params.set('search', search)

    return apiRequest<PaginatedResponse<User>>(`/users?${params.toString()}`)
  },

  createUser: (data: Partial<User> & { password?: string; role_ids?: number[]; permission_ids?: number[] }) =>
    wrapResponse<User>(
      apiRequest('/users', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    ),

  updateUser: (id: number, data: Partial<User> & { password?: string; role_ids?: number[]; permission_ids?: number[] }) =>
    wrapResponse<User>(
      apiRequest(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    ),

  deleteUser: (id: number) =>
    apiRequest<{ message: string }>(`/users/${id}`, { method: 'DELETE' }),

  getRolesPermissions: () =>
    apiRequest<RolesPermissionsResponse>('/roles-permissions'),
}
