import { API_BASE, apiRequest, apiRequestRaw, wrapResponse } from './client'
import type {
  NurseryAssetPayload,
  NurseryExpenseAccountPayload,
  NurseryExpenseBootstrap,
  NurseryExpenseDetails,
  NurseryExpenseTransactionPayload,
} from '../types/nurseryExpenses'

export const nurseryExpensesApi = {
  getBootstrap: () =>
    wrapResponse<NurseryExpenseBootstrap>(apiRequest('/nursery/expenses/bootstrap')),

  createAccount: (payload: NurseryExpenseAccountPayload) =>
    wrapResponse<NurseryExpenseBootstrap>(
      apiRequest('/nursery/expenses/accounts', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    ),

  updateAccount: (id: number, payload: NurseryExpenseAccountPayload) =>
    wrapResponse<NurseryExpenseBootstrap>(
      apiRequest(`/nursery/expenses/accounts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
    ),

  deleteAccount: (id: number) =>
    wrapResponse<NurseryExpenseBootstrap>(
      apiRequest(`/nursery/expenses/accounts/${id}`, { method: 'DELETE' })
    ),

  togglePin: (id: number) =>
    wrapResponse<NurseryExpenseBootstrap>(
      apiRequest(`/nursery/expenses/accounts/${id}/toggle-pin`, { method: 'PATCH' })
    ),

  moveAccount: (id: number, newParentId: number | null) =>
    wrapResponse<NurseryExpenseBootstrap>(
      apiRequest(`/nursery/expenses/accounts/${id}/move`, {
        method: 'PATCH',
        body: JSON.stringify({ new_parent_id: newParentId }),
      })
    ),

  createTransaction: (accountId: number, payload: NurseryExpenseTransactionPayload) =>
    apiRequest(`/nursery/expenses/accounts/${accountId}/transactions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getAccountDetails: (accountId: number) =>
    wrapResponse<NurseryExpenseDetails>(
      apiRequest(`/nursery/expenses/accounts/${accountId}/details`)
    ),

  uploadExpenseFile: (accountId: number, file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    return apiRequest(`/nursery/expenses/accounts/${accountId}/upload`, {
      method: 'POST',
      body: formData,
    })
  },

  createAsset: (payload: NurseryAssetPayload) =>
    wrapResponse<NurseryExpenseBootstrap>(
      apiRequest('/nursery/expenses/assets', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    ),

  updateAsset: (id: number, payload: NurseryAssetPayload) =>
    wrapResponse<NurseryExpenseBootstrap>(
      apiRequest(`/nursery/expenses/assets/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
    ),

  deleteAsset: (id: number) =>
    wrapResponse<NurseryExpenseBootstrap>(
      apiRequest(`/nursery/expenses/assets/${id}`, { method: 'DELETE' })
    ),

  bulkDeleteAssets: (ids: number[]) =>
    wrapResponse<NurseryExpenseBootstrap>(
      apiRequest('/nursery/expenses/assets/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ ids }),
      })
    ),

  bulkUpdateAssetCategory: (ids: number[], categoryId: number | null) =>
    wrapResponse<NurseryExpenseBootstrap>(
      apiRequest('/nursery/expenses/assets/bulk-category', {
        method: 'POST',
        body: JSON.stringify({ ids, category_id: categoryId }),
      })
    ),

  importAssets: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    return apiRequest('/nursery/expenses/assets/import', {
      method: 'POST',
      body: formData,
    })
  },

  createCategory: (name: string) =>
    wrapResponse<NurseryExpenseBootstrap>(
      apiRequest('/nursery/expenses/categories', {
        method: 'POST',
        body: JSON.stringify({ name }),
      })
    ),

  deleteCategory: (id: number) =>
    wrapResponse<NurseryExpenseBootstrap>(
      apiRequest(`/nursery/expenses/categories/${id}`, { method: 'DELETE' })
    ),

  downloadAssetTemplateUrl: () => `${API_BASE}/nursery/expenses/assets/template`,

  downloadAssetTemplate: async () => {
    const response = await apiRequestRaw('/nursery/expenses/assets/template')
    if (!response.ok) throw await response.json().catch(() => ({ message: 'Request failed' }))
    return response.blob()
  },
}
