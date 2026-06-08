import { apiRequest, wrapResponse } from './client'
import type {
  Warehouse, Item, StockBalance,
  InventoryMovement, PaginatedResponse
} from '../types'

export const inventoryApi = {
  // Warehouses
  listWarehouses: (page = 1, perPage = 20) =>
    apiRequest<PaginatedResponse<Warehouse>>(`/warehouses?page=${page}&per_page=${perPage}`),
  getWarehouse: (id: number) =>
    wrapResponse<Warehouse>(apiRequest(`/warehouses/${id}`)),
  createWarehouse: (data: { company_id: number; name: string; code: string; location?: string }) =>
    wrapResponse<Warehouse>(apiRequest('/warehouses', {
      method: 'POST',
      body: JSON.stringify(data),
    })),
  updateWarehouse: (id: number, data: Partial<Warehouse>) =>
    wrapResponse<Warehouse>(apiRequest(`/warehouses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })),
  deleteWarehouse: (id: number) =>
    apiRequest<void>(`/warehouses/${id}`, { method: 'DELETE' }),

  // Items
  listItems: (page = 1, perPage = 20, activeOnly = false) =>
    apiRequest<PaginatedResponse<Item>>(`/items?page=${page}&per_page=${perPage}${activeOnly ? '&active_only=true' : ''}`),
  getItem: (id: number) =>
    wrapResponse<Item>(apiRequest(`/items/${id}`)),
  createItem: (data: { name: string; unit?: string; category?: string }) =>
    wrapResponse<Item>(apiRequest('/items', {
      method: 'POST',
      body: JSON.stringify(data),
    })),
  updateItem: (id: number, data: Partial<Item>) =>
    wrapResponse<Item>(apiRequest(`/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })),
  deleteItem: (id: number) =>
    apiRequest<void>(`/items/${id}`, { method: 'DELETE' }),

  // Stock balances
  getWarehouseBalances: (warehouseId: number) =>
    wrapResponse<StockBalance[]>(
      apiRequest(`/warehouses/${warehouseId}/balances`)
    ),
  getItemBalance: (warehouseId: number, itemId: number) =>
    apiRequest<{ data: { warehouse_id: number; item_id: number; quantity_on_hand: number } }>(
      `/warehouses/${warehouseId}/balances/item/${itemId}`
    ),

  // Movements ledger
  listMovements: (filters: {
    warehouse_id?: number
    item_id?: number
    type?: 'in' | 'out' | 'transfer_in' | 'transfer_out' | 'adjustment'
    page?: number
  } = {}) => {
    const params = new URLSearchParams()
    if (filters.warehouse_id)
      params.set('warehouse_id', String(filters.warehouse_id))
    if (filters.item_id)
      params.set('item_id', String(filters.item_id))
    if (filters.type)
      params.set('type', filters.type)
    params.set('page', String(filters.page ?? 1))
    return apiRequest<PaginatedResponse<InventoryMovement>>(
      `/inventory/movements?${params.toString()}`
    )
  },
  createMovement: (data: {
    type: 'in' | 'out' | 'adjustment' | 'transfer'
    warehouse_id: number
    to_warehouse_id?: number
    item_id: number
    quantity: number
    adjustment_direction?: 'increase' | 'decrease'
    unit_cost?: number
    notes?: string
  }) => apiRequest<{ data: InventoryMovement }>('/inventory/movements', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
}
