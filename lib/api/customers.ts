import { apiRequest, wrapResponse } from './client'
import type { Customer, CustomerStats, PaginatedResponse } from '../types'

export const customersApi = {
  listCustomers: (page = 1, filters: {
    customer_type?: string
    is_suspended?: boolean
    search?: string
    per_page?: number
  } = {}) => {
    const params = new URLSearchParams()
    params.set('page', String(page))
    if (filters.customer_type) params.set('customer_type', filters.customer_type)
    if (filters.is_suspended !== undefined) params.set('is_suspended', String(filters.is_suspended))
    if (filters.search) params.set('search', filters.search)
    if (filters.per_page) params.set('per_page', String(filters.per_page))

    return apiRequest<PaginatedResponse<Customer>>(`/customers?${params.toString()}`)
  },

  getCustomer: (id: number) =>
    wrapResponse<Customer>(apiRequest(`/customers/${id}`)),

  createCustomer: (data: Partial<Customer>) =>
    wrapResponse<Customer>(apiRequest('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    })),

  updateCustomer: (id: number, data: Partial<Customer>) =>
    wrapResponse<Customer>(apiRequest(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })),

  deleteCustomer: (id: number) =>
    apiRequest<void>(`/customers/${id}`, { method: 'DELETE' }),

  bulkDeleteCustomers: (ids: number[]) =>
    apiRequest<{ message: string; count: number }>('/customers/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),

  bulkSuspendCustomers: (ids: number[]) =>
    apiRequest<{ message: string; suspended: number }>('/customers/bulk-suspend', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),

  toggleSuspendCustomer: (id: number) =>
    wrapResponse<Customer>(apiRequest(`/customers/${id}/suspend`, {
      method: 'PATCH',
    })),

  getCustomerStats: () =>
    apiRequest<CustomerStats>('/customers/stats'),

  importCustomers: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    return apiRequest<{ message: string; imported_count: number }>('/customers/import', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': undefined,
      } as any,
    })
  },
}
