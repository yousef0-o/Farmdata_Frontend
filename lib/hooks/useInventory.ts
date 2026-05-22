'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { inventoryApi } from '../api/inventory'

export function useWarehouses(page = 1, perPage = 20) {
  return useQuery({
    queryKey: ['warehouses', page, perPage],
    queryFn: () => inventoryApi.listWarehouses(page, perPage),
  })
}

export function useWarehouse(id: number) {
  return useQuery({
    queryKey: ['warehouse', id],
    queryFn: () => inventoryApi.getWarehouse(id),
    enabled: id > 0,
  })
}


export function useWarehouseBalances(warehouseId: number) {
  return useQuery({
    queryKey: ['warehouse-balances', warehouseId],
    queryFn: () => inventoryApi.getWarehouseBalances(warehouseId),
    enabled: warehouseId > 0,
  })
}

export function useItems(page = 1, perPage = 20) {
  return useQuery({
    queryKey: ['items', page, perPage],
    queryFn: () => inventoryApi.listItems(page, perPage),
  })
}

export function useInventoryMovements(filters: Parameters<typeof inventoryApi.listMovements>[0] = {}) {
  return useQuery({
    queryKey: ['inventory-movements', filters],
    queryFn: () => inventoryApi.listMovements(filters),
  })
}

export function useCreateMovement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: inventoryApi.createMovement,
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['inventory-movements'] })
      qc.invalidateQueries({ queryKey: ['warehouse-balances', variables.warehouse_id] })
      qc.invalidateQueries({ queryKey: ['item-balance'] })
    },
  })
}

export function useItemBalance(warehouseId: number, itemId: number) {
  return useQuery({
    queryKey: ['item-balance', warehouseId, itemId],
    queryFn: () => inventoryApi.getItemBalance(warehouseId, itemId),
    enabled: warehouseId > 0 && itemId > 0,
  })
}

export function useCreateWarehouse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: inventoryApi.createWarehouse,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['warehouses'] }),
  })
}

export function useCreateItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: inventoryApi.createItem,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items'] }),
  })
}
