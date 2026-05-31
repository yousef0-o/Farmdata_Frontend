'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { nurseryExpensesApi } from '../api/nurseryExpenses'
import type {
  NurseryAssetPayload,
  NurseryExpenseAccountPayload,
  NurseryExpenseTransactionPayload,
} from '../types/nurseryExpenses'

export const nurseryExpensesQueryKey = ['nursery-expenses', 'bootstrap']

export function useNurseryExpensesBootstrap() {
  return useQuery({
    queryKey: nurseryExpensesQueryKey,
    queryFn: nurseryExpensesApi.getBootstrap,
  })
}

export function useNurseryExpenseDetails(accountId: number | null) {
  return useQuery({
    queryKey: ['nursery-expenses', 'details', accountId],
    queryFn: () => nurseryExpensesApi.getAccountDetails(accountId as number),
    enabled: accountId !== null,
  })
}

function useInvalidateNurseryExpenses() {
  const queryClient = useQueryClient()

  return () => queryClient.invalidateQueries({ queryKey: nurseryExpensesQueryKey })
}

export function useCreateNurseryExpenseAccount() {
  const invalidate = useInvalidateNurseryExpenses()

  return useMutation({
    mutationFn: (payload: NurseryExpenseAccountPayload) => nurseryExpensesApi.createAccount(payload),
    onSuccess: invalidate,
  })
}

export function useUpdateNurseryExpenseAccount() {
  const invalidate = useInvalidateNurseryExpenses()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: NurseryExpenseAccountPayload }) =>
      nurseryExpensesApi.updateAccount(id, payload),
    onSuccess: invalidate,
  })
}

export function useDeleteNurseryExpenseAccount() {
  const invalidate = useInvalidateNurseryExpenses()

  return useMutation({
    mutationFn: (id: number) => nurseryExpensesApi.deleteAccount(id),
    onSuccess: invalidate,
  })
}

export function useToggleNurseryExpenseAccountPin() {
  const invalidate = useInvalidateNurseryExpenses()

  return useMutation({
    mutationFn: (id: number) => nurseryExpensesApi.togglePin(id),
    onSuccess: invalidate,
  })
}

export function useMoveNurseryExpenseAccount() {
  const invalidate = useInvalidateNurseryExpenses()

  return useMutation({
    mutationFn: ({ id, newParentId }: { id: number; newParentId: number | null }) =>
      nurseryExpensesApi.moveAccount(id, newParentId),
    onSuccess: invalidate,
  })
}

export function useCreateNurseryExpenseTransaction() {
  const invalidate = useInvalidateNurseryExpenses()

  return useMutation({
    mutationFn: ({ accountId, payload }: { accountId: number; payload: NurseryExpenseTransactionPayload }) =>
      nurseryExpensesApi.createTransaction(accountId, payload),
    onSuccess: invalidate,
  })
}

export function useUploadNurseryExpenseFile() {
  const invalidate = useInvalidateNurseryExpenses()

  return useMutation({
    mutationFn: ({ accountId, file }: { accountId: number; file: File }) =>
      nurseryExpensesApi.uploadExpenseFile(accountId, file),
    onSuccess: invalidate,
  })
}

export function useCreateNurseryAsset() {
  const invalidate = useInvalidateNurseryExpenses()

  return useMutation({
    mutationFn: (payload: NurseryAssetPayload) => nurseryExpensesApi.createAsset(payload),
    onSuccess: invalidate,
  })
}

export function useUpdateNurseryAsset() {
  const invalidate = useInvalidateNurseryExpenses()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: NurseryAssetPayload }) =>
      nurseryExpensesApi.updateAsset(id, payload),
    onSuccess: invalidate,
  })
}

export function useDeleteNurseryAsset() {
  const invalidate = useInvalidateNurseryExpenses()

  return useMutation({
    mutationFn: (id: number) => nurseryExpensesApi.deleteAsset(id),
    onSuccess: invalidate,
  })
}

export function useBulkDeleteNurseryAssets() {
  const invalidate = useInvalidateNurseryExpenses()

  return useMutation({
    mutationFn: (ids: number[]) => nurseryExpensesApi.bulkDeleteAssets(ids),
    onSuccess: invalidate,
  })
}

export function useBulkUpdateNurseryAssetCategory() {
  const invalidate = useInvalidateNurseryExpenses()

  return useMutation({
    mutationFn: ({ ids, categoryId }: { ids: number[]; categoryId: number | null }) =>
      nurseryExpensesApi.bulkUpdateAssetCategory(ids, categoryId),
    onSuccess: invalidate,
  })
}

export function useImportNurseryAssets() {
  const invalidate = useInvalidateNurseryExpenses()

  return useMutation({
    mutationFn: (file: File) => nurseryExpensesApi.importAssets(file),
    onSuccess: invalidate,
  })
}

export function useCreateNurseryAssetCategory() {
  const invalidate = useInvalidateNurseryExpenses()

  return useMutation({
    mutationFn: (name: string) => nurseryExpensesApi.createCategory(name),
    onSuccess: invalidate,
  })
}

export function useDeleteNurseryAssetCategory() {
  const invalidate = useInvalidateNurseryExpenses()

  return useMutation({
    mutationFn: (id: number) => nurseryExpensesApi.deleteCategory(id),
    onSuccess: invalidate,
  })
}
