import { apiRequest } from './client'
import type {
  ArchiveNode,
  ArchiveFolderSchema,
  ArchiveItem,
  ArchiveAttachment,
  ArchiveStatsConfig,
  AccountingAccount,
  RecordSheet,
  RecordTransaction
} from '../types'

export const archiveApi = {
  // --- Tree Nodes ---
  listNodes(parentId?: number): Promise<{ data: ArchiveNode[] }> {
    const url = parentId ? `/archive/nodes?parent_id=${parentId}` : '/archive/nodes'
    return apiRequest<{ data: ArchiveNode[] }>(url)
  },

  getNodeChildren(id: number): Promise<{ data: ArchiveNode[] }> {
    return apiRequest<{ data: ArchiveNode[] }>(`/archive/nodes/${id}/children`)
  },

  getNodeBreadcrumb(id: number): Promise<{ data: ArchiveNode[] }> {
    return apiRequest<{ data: ArchiveNode[] }>(`/archive/nodes/${id}/breadcrumb`)
  },

  getNode(id: number): Promise<{ data: ArchiveNode }> {
    return apiRequest<{ data: ArchiveNode }>(`/archive/nodes/${id}`)
  },

  createNode(data: { parent_id?: number | null; type: 'institution' | 'year' | 'folder'; name: string; description?: string }): Promise<{ data: ArchiveNode }> {
    return apiRequest<{ data: ArchiveNode }>('/archive/nodes', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  updateNode(id: number, data: { name: string; description?: string }): Promise<{ data: ArchiveNode }> {
    return apiRequest<{ data: ArchiveNode }>(`/archive/nodes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  deleteNode(id: number): Promise<void> {
    return apiRequest<void>(`/archive/nodes/${id}`, { method: 'DELETE' })
  },

  // --- Dynamic Schema ---
  getSchema(folderId: number): Promise<{ data: ArchiveFolderSchema }> {
    return apiRequest<{ data: ArchiveFolderSchema }>(`/archive/folders/${folderId}/schema`)
  },

  updateSchema(folderId: number, data: { columns: any[] }): Promise<{ data: ArchiveFolderSchema }> {
    return apiRequest<{ data: ArchiveFolderSchema }>(`/archive/folders/${folderId}/schema`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  // --- Dynamic Items ---
  listItems(folderId: number, params?: { search?: string; page?: number; limit?: number }): Promise<{ data: ArchiveItem[]; meta?: any }> {
    let url = `/archive/folders/${folderId}/items`
    const parts: string[] = []
    if (params?.search) parts.push(`search=${encodeURIComponent(params.search)}`)
    if (params?.page) parts.push(`page=${params.page}`)
    if (params?.limit) parts.push(`limit=${params.limit}`)
    if (parts.length > 0) url += `?${parts.join('&')}`

    return apiRequest<{ data: ArchiveItem[]; meta?: any }>(url)
  },

  getItem(folderId: number, itemId: number): Promise<{ data: ArchiveItem }> {
    return apiRequest<{ data: ArchiveItem }>(`/archive/folders/${folderId}/items/${itemId}`)
  },

  createItem(folderId: number, data: { data: Record<string, any> }): Promise<{ data: ArchiveItem }> {
    return apiRequest<{ data: ArchiveItem }>(`/archive/folders/${folderId}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  updateItem(folderId: number, itemId: number, data: { data: Record<string, any> }): Promise<{ data: ArchiveItem }> {
    return apiRequest<{ data: ArchiveItem }>(`/archive/folders/${folderId}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  deleteItem(folderId: number, itemId: number): Promise<void> {
    return apiRequest<void>(`/archive/folders/${folderId}/items/${itemId}`, { method: 'DELETE' })
  },

  bulkDeleteItems(folderId: number, ids: number[]): Promise<void> {
    return apiRequest<void>(`/archive/folders/${folderId}/items/bulk-delete`, {
      method: 'POST',
      body: JSON.stringify({ ids }),
    })
  },

  // --- Attachments ---
  uploadAttachment(formData: FormData): Promise<{ data: ArchiveAttachment }> {
    return apiRequest<{ data: ArchiveAttachment }>('/archive/attachments', {
      method: 'POST',
      body: formData,
      // Do not set Content-Type header so browser automatically boundary tags multipart/form-data
      headers: {},
    })
  },

  deleteAttachment(id: number): Promise<void> {
    return apiRequest<void>(`/archive/attachments/${id}`, { method: 'DELETE' })
  },

  getAttachmentDownloadUrl(id: number): Promise<{ data: { url: string } }> {
    return apiRequest<{ data: { url: string } }>(`/archive/attachments/${id}/download`)
  },

  // --- Stats Configs & Computed Analytics Widget Payloads ---
  listStatsConfigs(folderId: number): Promise<{ data: ArchiveStatsConfig[] }> {
    return apiRequest<{ data: ArchiveStatsConfig[] }>(`/archive/folders/${folderId}/stats-configs`)
  },

  createStatsConfig(folderId: number, data: Partial<ArchiveStatsConfig>): Promise<{ data: ArchiveStatsConfig }> {
    return apiRequest<{ data: ArchiveStatsConfig }>(`/archive/folders/${folderId}/stats-configs`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  getStatsResult(folderId: number, configId: number, dateFilters?: { from?: string; to?: string; column?: string }): Promise<{ config: ArchiveStatsConfig; results: { value: number; labels?: string[]; values?: number[] } }> {
    let url = `/archive/folders/${folderId}/stats-configs/${configId}`
    if (dateFilters?.from || dateFilters?.to) {
      const parts: string[] = []
      if (dateFilters.from) parts.push(`date_from=${dateFilters.from}`)
      if (dateFilters.to) parts.push(`date_to=${dateFilters.to}`)
      if (dateFilters.column) parts.push(`date_column=${dateFilters.column}`)
      url += `?${parts.join('&')}`
    }
    return apiRequest<{ config: ArchiveStatsConfig; results: any }>(url)
  },

  updateStatsConfig(folderId: number, configId: number, data: Partial<ArchiveStatsConfig>): Promise<{ data: ArchiveStatsConfig }> {
    return apiRequest<{ data: ArchiveStatsConfig }>(`/archive/folders/${folderId}/stats-configs/${configId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  deleteStatsConfig(folderId: number, configId: number): Promise<void> {
    return apiRequest<void>(`/archive/folders/${folderId}/stats-configs/${configId}`, { method: 'DELETE' })
  },

  recalculateStatsConfig(folderId: number, configId: number): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/archive/folders/${folderId}/stats-configs/${configId}/recalculate`, {
      method: 'POST',
    })
  },

  // --- Excel Imports / Exports Pipeline ---
  getImportMappingProposal(folderId: number, formData: FormData): Promise<Record<string, string>> {
    return apiRequest<Record<string, string>>(`/archive/folders/${folderId}/import/mapping`, {
      method: 'POST',
      body: formData,
      headers: {},
    })
  },

  executeImport(folderId: number, formData: FormData): Promise<{ data: { inserted: number; errors: string[] } }> {
    return apiRequest<{ data: { inserted: number; errors: string[] } }>(`/archive/folders/${folderId}/import`, {
      method: 'POST',
      body: formData,
      headers: {},
    })
  },

  getExportDownloadUrl(folderId: number, format: 'excel' | 'csv' = 'excel'): Promise<{ data: { url: string } }> {
    return apiRequest<{ data: { url: string } }>(
      `/archive/folders/${folderId}/export-url?format=${format}`
    )
  },

  async downloadExport(folderId: number, format: 'excel' | 'csv' = 'excel'): Promise<void> {
    const signedUrlRes = await this.getExportDownloadUrl(folderId, format)
    const res = await fetch(signedUrlRes.data.url)

    if (!res.ok) {
      throw new Error('تعذر تنزيل ملف التصدير')
    }

    const blob = await res.blob()
    const href = URL.createObjectURL(blob)
    const disposition = res.headers.get('content-disposition')
    const encodedFileName = disposition?.match(/filename\*=UTF-8''([^;]+)/)?.[1]
    const plainFileName = disposition?.match(/filename="?([^"]+)"?/)?.[1]
    const fileName = encodedFileName
      ? decodeURIComponent(encodedFileName)
      : plainFileName || `archive-export.${format === 'csv' ? 'csv' : 'xlsx'}`

    const anchor = document.createElement('a')
    anchor.href = href
    anchor.download = fileName
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(href)
  },

  // --- Scan Pipeline ---
  uploadScans(folderId: number, formData: FormData): Promise<{ job_id: string; message: string }> {
    return apiRequest<{ job_id: string; message: string }>(`/archive/folders/${folderId}/scanner/upload`, {
      method: 'POST',
      body: formData,
      headers: {},
    })
  },

  getScannerJobStatus(folderId: number, jobId: string): Promise<{ job_id: string; status: 'pending' | 'processing' | 'completed' | 'failed'; message: string; processed_count: number }> {
    return apiRequest<{ job_id: string; status: any; message: string; processed_count: number }>(`/archive/folders/${folderId}/scanner/status/${jobId}`)
  },

  // --- Accounting Ledger, record sheets and matrix ---
  listAccountingAccounts(): Promise<{ data: AccountingAccount[] }> {
    return apiRequest<{ data: AccountingAccount[] }>('/archive/accounting/accounts')
  },

  createAccountingAccount(data: Partial<AccountingAccount>): Promise<{ data: AccountingAccount }> {
    return apiRequest<{ data: AccountingAccount }>('/archive/accounting/accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  deleteAccountingAccount(id: number): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/archive/accounting/accounts/${id}`, {
      method: 'DELETE',
    })
  },

  toggleAccountingAccountStatus(id: number, isActive: boolean): Promise<{ message: string, data: AccountingAccount }> {
    return apiRequest<{ message: string, data: AccountingAccount }>(`/archive/accounting/accounts/${id}/toggle-status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive }),
    })
  },

  listRecordSheets(folderId?: number, status?: 'open' | 'closed'): Promise<{ data: RecordSheet[] }> {
    let url = '/archive/record-sheets'
    const parts: string[] = []
    if (folderId) parts.push(`folder_id=${folderId}`)
    if (status) parts.push(`status=${status}`)
    if (parts.length > 0) url += `?${parts.join('&')}`

    return apiRequest<{ data: RecordSheet[] }>(url)
  },

  createRecordSheet(data: { folder_id?: number | null; account_id: number; title: string; period_start: string; period_end: string }): Promise<{ data: RecordSheet }> {
    return apiRequest<{ data: RecordSheet }>('/archive/record-sheets', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  getRecordSheet(id: number): Promise<{ data: RecordSheet }> {
    return apiRequest<{ data: RecordSheet }>(`/archive/record-sheets/${id}`)
  },

  closeRecordSheet(id: number): Promise<{ message: string; data: RecordSheet }> {
    return apiRequest<{ message: string; data: RecordSheet }>(`/archive/record-sheets/${id}/close`, {
      method: 'POST',
    })
  },

  createTransaction(sheetId: number, data: Partial<RecordTransaction>): Promise<{ data: RecordTransaction }> {
    return apiRequest<{ data: RecordTransaction }>(`/archive/record-sheets/${sheetId}/transactions`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  getAnnualAccountingStats(year: number): Promise<{ data: any[] }> {
    return apiRequest<{ data: any[] }>(`/archive/accounting/annual-stats/${year}`)
  },

  importChartOfAccounts(formData: FormData): Promise<{ message: string; data: { total_rows: number; inserted_accounts: number; updated_accounts: number } }> {
    return apiRequest<{ message: string; data: any }>('/archive/accounting/accounts/import', {
      method: 'POST',
      body: formData,
      headers: {},
    })
  },

  importRecordSheetTransactions(sheetId: number, formData: FormData): Promise<{ message: string; data: { total_rows_read: number; inserted_transactions: number } }> {
    return apiRequest<{ message: string; data: any }>(`/archive/record-sheets/${sheetId}/import`, {
      method: 'POST',
      body: formData,
      headers: {},
    })
  }
}
