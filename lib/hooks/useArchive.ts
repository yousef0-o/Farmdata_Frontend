'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { archiveApi } from '../api/archive'
import type { ArchiveNode, ArchiveFolderSchema, ArchiveItem, ArchiveStatsConfig, AccountingAccount, RecordSheet, RecordTransaction } from '../types'

// --- Tree Nodes Hook ---
export function useArchiveNodes(parentId?: number) {
  return useQuery({
    queryKey: ['archive-nodes', parentId],
    queryFn: () => archiveApi.listNodes(parentId),
  })
}

export function useNodeChildren(id: number) {
  return useQuery({
    queryKey: ['archive-children', id],
    queryFn: () => archiveApi.getNodeChildren(id),
    enabled: id > 0,
  })
}

export function useNodeBreadcrumb(id: number) {
  return useQuery({
    queryKey: ['archive-breadcrumb', id],
    queryFn: () => archiveApi.getNodeBreadcrumb(id),
    enabled: id > 0,
  })
}

export function useNode(id: number) {
  return useQuery({
    queryKey: ['archive-node', id],
    queryFn: () => archiveApi.getNode(id),
    enabled: id > 0,
  })
}

export function useCreateNode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: archiveApi.createNode,
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['archive-nodes'] })
      if (variables.parent_id) {
        qc.invalidateQueries({ queryKey: ['archive-children', variables.parent_id] })
        qc.invalidateQueries({ queryKey: ['archive-node', variables.parent_id] })
      }
    },
  })
}

export function useUpdateNode(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; description?: string }) => archiveApi.updateNode(id, data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['archive-nodes'] })
      qc.invalidateQueries({ queryKey: ['archive-node', id] })
      if (res?.data?.parent_id) {
        qc.invalidateQueries({ queryKey: ['archive-children', res.data.parent_id] })
      }
    },
  })
}

export function useDeleteNode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: archiveApi.deleteNode,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['archive-nodes'] })
      qc.invalidateQueries({ queryKey: ['archive-children'] })
    },
  })
}

// --- Custom Schema Hooks ---
export function useFolderSchema(folderId: number) {
  return useQuery({
    queryKey: ['archive-schema', folderId],
    queryFn: () => archiveApi.getSchema(folderId),
    enabled: folderId > 0,
  })
}

export function useUpdateSchema(folderId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { columns: any[] }) => archiveApi.updateSchema(folderId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['archive-schema', folderId] })
      qc.invalidateQueries({ queryKey: ['archive-items', folderId] })
    },
  })
}

// --- Dynamic Items Hooks ---
export function useFolderItems(folderId: number, params?: { search?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['archive-items', folderId, params],
    queryFn: () => archiveApi.listItems(folderId, params),
    enabled: folderId > 0,
  })
}

export function useCreateItem(folderId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { data: Record<string, any> }) => archiveApi.createItem(folderId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['archive-items', folderId] })
      qc.invalidateQueries({ queryKey: ['archive-stats-configs', folderId] })
    },
  })
}

export function useUpdateItem(folderId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: number; data: { data: Record<string, any> } }) => archiveApi.updateItem(folderId, itemId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['archive-items', folderId] })
      qc.invalidateQueries({ queryKey: ['archive-stats-configs', folderId] })
    },
  })
}

export function useDeleteItem(folderId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (itemId: number) => archiveApi.deleteItem(folderId, itemId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['archive-items', folderId] })
      qc.invalidateQueries({ queryKey: ['archive-stats-configs', folderId] })
    },
  })
}

export function useBulkDeleteItems(folderId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ids: number[]) => archiveApi.bulkDeleteItems(folderId, ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['archive-items', folderId] })
      qc.invalidateQueries({ queryKey: ['archive-stats-configs', folderId] })
    },
  })
}

// --- Attachments Hooks ---
export function useUploadAttachment(folderId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: archiveApi.uploadAttachment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['archive-items', folderId] })
    },
  })
}

export function useDeleteAttachment(folderId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: archiveApi.deleteAttachment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['archive-items', folderId] })
    },
  })
}

// --- Stats configs Hooks ---
export function useFolderStatsConfigs(folderId: number) {
  return useQuery({
    queryKey: ['archive-stats-configs', folderId],
    queryFn: () => archiveApi.listStatsConfigs(folderId),
    enabled: folderId > 0,
  })
}

export function useCreateStatsConfig(folderId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<ArchiveStatsConfig>) => archiveApi.createStatsConfig(folderId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['archive-stats-configs', folderId] })
    },
  })
}

export function useStatsResult(folderId: number, configId: number, dateFilters?: { from?: string; to?: string; column?: string }) {
  return useQuery({
    queryKey: ['archive-stats-result', folderId, configId, dateFilters],
    queryFn: () => archiveApi.getStatsResult(folderId, configId, dateFilters),
    enabled: folderId > 0 && configId > 0,
  })
}

export function useRecalculateStats(folderId: number, configId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => archiveApi.recalculateStatsConfig(folderId, configId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['archive-stats-result', folderId, configId] })
    },
  })
}

// --- Accounting Chart & record sheets Hooks ---
export function useAccountingAccounts() {
  return useQuery({
    queryKey: ['accounting-accounts'],
    queryFn: () => archiveApi.listAccountingAccounts(),
  })
}

export function useCreateAccountingAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: archiveApi.createAccountingAccount,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounting-accounts'] })
    },
  })
}

export function useDeleteAccountingAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => archiveApi.deleteAccountingAccount(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounting-accounts'] })
      qc.invalidateQueries({ queryKey: ['record-sheets'] })
    },
  })
}

export function useToggleAccountingAccountStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number, isActive: boolean }) =>
      archiveApi.toggleAccountingAccountStatus(id, isActive),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounting-accounts'] })
      qc.invalidateQueries({ queryKey: ['record-sheets'] })
    },
  })
}

export function useRecordSheets(folderId?: number, status?: 'open' | 'closed') {
  return useQuery({
    queryKey: ['record-sheets', folderId, status],
    queryFn: () => archiveApi.listRecordSheets(folderId, status),
  })
}

export function useCreateRecordSheet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: archiveApi.createRecordSheet,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['record-sheets'] })
    },
  })
}

export function useRecordSheet(id: number) {
  return useQuery({
    queryKey: ['record-sheet', id],
    queryFn: () => archiveApi.getRecordSheet(id),
    enabled: id > 0,
  })
}

export function useCloseRecordSheet(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => archiveApi.closeRecordSheet(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['record-sheet', id] })
      qc.invalidateQueries({ queryKey: ['record-sheets'] })
    },
  })
}

export function useCreateTransaction(sheetId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<RecordTransaction>) => archiveApi.createTransaction(sheetId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['record-sheet', sheetId] })
    },
  })
}

export function useAnnualAccountingStats(year: number) {
  return useQuery({
    queryKey: ['annual-accounting-stats', year],
    queryFn: () => archiveApi.getAnnualAccountingStats(year),
    enabled: year > 0,
  })
}

export function useImportChartOfAccounts() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: archiveApi.importChartOfAccounts,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounting-accounts'] })
    },
  })
}

export function useImportRecordTransactions(sheetId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (formData: FormData) => archiveApi.importRecordSheetTransactions(sheetId, formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['record-sheet', sheetId] })
      qc.invalidateQueries({ queryKey: ['record-sheets'] })
    },
  })
}

export function useCompanies() {
  return useQuery({
    queryKey: ['companies-list'],
    queryFn: () => import('../api/organization').then(m => m.organizationApi.listCompanies()),
  })
}

