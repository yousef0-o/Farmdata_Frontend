import { apiRequest, wrapResponse } from './client'
import type {
  NurseryInvoiceBootstrap,
  NurseryInvoiceDetails,
  NurseryInvoicePayload,
  NurseryInvoiceSettings,
  NurseryInvoiceType,
} from '../types/nurseryInvoices'

export const nurseryInvoicesApi = {
  bootstrap: (type: NurseryInvoiceType | 'all' = 'all') =>
    wrapResponse<NurseryInvoiceBootstrap>(
      apiRequest(`/nursery/invoices?type=${encodeURIComponent(type)}`)
    ),

  show: (id: number) =>
    wrapResponse<{ invoice: NurseryInvoiceDetails; settings: NurseryInvoiceSettings }>(
      apiRequest(`/nursery/invoices/${id}`)
    ),

  create: (payload: NurseryInvoicePayload) =>
    wrapResponse<NurseryInvoiceDetails>(
      apiRequest('/nursery/invoices', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    ),

  update: (id: number, payload: NurseryInvoicePayload) =>
    wrapResponse<NurseryInvoiceDetails>(
      apiRequest(`/nursery/invoices/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
    ),

  delete: (id: number) =>
    apiRequest<{ message: string }>(`/nursery/invoices/${id}`, {
      method: 'DELETE',
    }),

  updateSettings: (payload: Partial<NurseryInvoiceSettings> | FormData) =>
    wrapResponse<NurseryInvoiceSettings>(
      apiRequest('/nursery/invoices/settings', {
        method: 'PUT',
        body: payload instanceof FormData ? payload : JSON.stringify(payload),
      })
    ),
}
