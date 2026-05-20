'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { inventoryApi } from '../api/inventory'

export function useWarehouses(page = 1) {
  return useQuery({
    queryKey: ['warehouses', page],
    queryFn: () => inventoryApi.listWarehouses(page),
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

export function useItems(page = 1) {
  return useQuery({
    queryKey: ['items', page],
    queryFn: () => inventoryApi.listItems(page),
  })
}

export function useInventoryMovements(filters: Parameters<typeof inventoryApi.listMovements>[0] = {}) {
  return useQuery({
    queryKey: ['inventory-movements', filters],
    queryFn: () => inventoryApi.listMovements(filters),
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
