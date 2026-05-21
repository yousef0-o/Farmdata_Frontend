import { apiRequest, wrapResponse } from './client'
import type { Supplier, SupplierStats, PaginatedResponse } from '../types'

export const suppliersApi = {
  listSuppliers: (page = 1, filters: {
    is_suspended?: boolean
    search?: string
    per_page?: number
  } = {}) => {
    const params = new URLSearchParams()
    params.set('page', String(page))
    if (filters.is_suspended !== undefined) params.set('is_suspended', String(filters.is_suspended))
    if (filters.search) params.set('search', filters.search)
    if (filters.per_page) params.set('per_page', String(filters.per_page))

    return apiRequest<PaginatedResponse<Supplier>>(`/suppliers?${params.toString()}`)
  },

  getSupplier: (id: number) =>
    wrapResponse<Supplier>(apiRequest(`/suppliers/${id}`)),

  createSupplier: (data: Partial<Supplier>) =>
    wrapResponse<Supplier>(apiRequest('/suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    })),

  updateSupplier: (id: number, data: Partial<Supplier>) =>
    wrapResponse<Supplier>(apiRequest(`/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })),

  deleteSupplier: (id: number) =>
    apiRequest<void>(`/suppliers/${id}`, { method: 'DELETE' }),

  bulkDeleteSuppliers: (ids: number[]) =>
    apiRequest<{ message: string; count: number }>('/suppliers/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),

  toggleSuspendSupplier: (id: number) =>
    wrapResponse<Supplier>(apiRequest(`/suppliers/${id}/suspend`, {
      method: 'PATCH',
    })),

  getSupplierStats: () =>
    apiRequest<SupplierStats>('/suppliers/stats'),

  importSuppliers: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    return apiRequest<{ message: string; imported_count: number }>('/suppliers/import', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': undefined,
      } as any,
    })
  },
}
