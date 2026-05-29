import { apiRequest, wrapResponse } from './client'
import type {
  NurseryInventoryBootstrap,
  NurseryInventoryCategoryPayload,
  NurseryInventoryItem,
  NurseryInventoryItemPayload,
  NurseryInventoryLocationPayload,
  NurseryInventoryOpeningBalancePayload,
  NurseryInventorySummary,
  NurseryInventoryTreeNode,
} from '../types'

export const nurseryInventoryApi = {
  getBootstrap: () =>
    wrapResponse<NurseryInventoryBootstrap>(apiRequest('/nursery/inventory/bootstrap')),

  getValuation: () =>
    wrapResponse<NurseryInventorySummary>(apiRequest('/nursery/inventory/valuation')),

  listCategories: () =>
    wrapResponse<NurseryInventoryTreeNode[]>(apiRequest('/nursery/inventory/categories')),

  createCategory: (data: NurseryInventoryCategoryPayload) =>
    wrapResponse<NurseryInventoryTreeNode>(
      apiRequest('/nursery/inventory/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    ),

  updateCategory: (id: number, data: NurseryInventoryCategoryPayload) =>
    wrapResponse<NurseryInventoryTreeNode>(
      apiRequest(`/nursery/inventory/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    ),

  deleteCategory: (id: number) =>
    apiRequest<void>(`/nursery/inventory/categories/${id}`, { method: 'DELETE' }),

  listLocations: () =>
    wrapResponse<NurseryInventoryTreeNode[]>(apiRequest('/nursery/inventory/locations')),

  createLocation: (data: NurseryInventoryLocationPayload) =>
    wrapResponse<NurseryInventoryTreeNode>(
      apiRequest('/nursery/inventory/locations', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    ),

  updateLocation: (id: number, data: NurseryInventoryLocationPayload) =>
    wrapResponse<NurseryInventoryTreeNode>(
      apiRequest(`/nursery/inventory/locations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    ),

  deleteLocation: (id: number) =>
    apiRequest<void>(`/nursery/inventory/locations/${id}`, { method: 'DELETE' }),

  listItems: () =>
    wrapResponse<NurseryInventoryItem[]>(apiRequest('/nursery/inventory/items')),

  createItem: (data: NurseryInventoryItemPayload) =>
    wrapResponse<NurseryInventoryItem>(
      apiRequest('/nursery/inventory/items', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    ),

  updateItem: (id: number, data: NurseryInventoryItemPayload) =>
    wrapResponse<NurseryInventoryItem>(
      apiRequest(`/nursery/inventory/items/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    ),

  deleteItem: (id: number) =>
    apiRequest<void>(`/nursery/inventory/items/${id}`, { method: 'DELETE' }),

  storeOpeningBalances: (data: NurseryInventoryOpeningBalancePayload) =>
    apiRequest<{ message: string; data: NurseryInventoryItem[] }>(
      '/nursery/inventory/opening-balances',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),
}
