import { apiRequest, wrapResponse } from './client'
import type { Asset, AssetStats, PaginatedResponse } from '../types'

export const assetsApi = {
  listAssets: (page = 1, filters: {
    category?: string
    status?: string
    location_code?: string
    search?: string
    per_page?: number
  } = {}) => {
    const params = new URLSearchParams()
    params.set('page', String(page))
    if (filters.category) params.set('category', filters.category)
    if (filters.status) params.set('status', filters.status)
    if (filters.location_code) params.set('location_code', filters.location_code)
    if (filters.search) params.set('search', filters.search)
    if (filters.per_page) params.set('per_page', String(filters.per_page))

    return apiRequest<PaginatedResponse<Asset>>(`/assets?${params.toString()}`)
  },

  getAsset: (id: number) =>
    wrapResponse<Asset>(apiRequest(`/assets/${id}`)),

  createAsset: (data: Partial<Asset>) =>
    wrapResponse<Asset>(apiRequest('/assets', {
      method: 'POST',
      body: JSON.stringify(data),
    })),

  updateAsset: (id: number, data: Partial<Asset>) =>
    wrapResponse<Asset>(apiRequest(`/assets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })),

  deleteAsset: (id: number) =>
    apiRequest<void>(`/assets/${id}`, { method: 'DELETE' }),

  bulkDeleteAssets: (ids: number[]) =>
    apiRequest<{ message: string; deleted_count: number }>('/assets/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),

  getAssetStats: () =>
    apiRequest<AssetStats>('/assets/stats'),

  importAssets: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    
    return apiRequest<{ message: string; imported_count: number }>('/assets/import', {
      method: 'POST',
      body: formData,
      headers: {
        // Let the browser set the boundary headers automatically by omitting Content-Type
      } as any,
    })
  },
}
