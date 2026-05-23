import { apiRequest } from './client'

export interface InvoiceItemPayload {
  item_id: number
  quantity: number
  unit_price: number
}

export interface InvoicePayload {
  type: 'sales' | 'purchase'
  invoice_number: string
  customer_id?: number | null
  supplier_id?: number | null
  warehouse_id: number
  invoice_date: string
  due_date?: string | null
  notes?: string | null
  items: InvoiceItemPayload[]
}

export interface Invoice {
  id: number
  invoice_number: string
  customer_id?: number | null
  supplier_id?: number | null
  warehouse_id: number
  invoice_date: string
  due_date?: string | null
  total_amount: string
  tax_amount: string
  notes?: string | null
  created_at: string
  updated_at: string
  customer?: { id: number; customer_name: string } | null
  supplier?: { id: number; supplier_name: string } | null
  warehouse?: { id: number; name: string } | null
  items?: Array<{
    id: number
    invoice_id: number
    invoice_type: string
    item_id: number
    quantity: string
    unit_price: string
    total: string
    item?: { id: number; name: string } | null
  }>
}

export interface OpeningBalanceLine {
  account_id: number
  debit_amount: number
  credit_amount: number
  description?: string
}

export interface OpeningBalancePayload {
  balance_date: string
  description?: string
  lines: OpeningBalanceLine[]
}

export interface OpeningBalanceResponseLine {
  id: number
  account_id: number
  account_code: string
  account_name: string
  balance_date: string
  debit_amount: number
  credit_amount: number
  description?: string
}

export interface OpeningBalancesResponse {
  data: OpeningBalanceResponseLine[]
  totals: {
    total_debits: number
    total_credits: number
    difference: number
    is_balanced: boolean
  }
  balance_date: string
}

export const financialApi = {
  listInvoices(type: 'sales' | 'purchase', search?: string, page = 1): Promise<any> {
    let url = `/financial/invoices?type=${type}&page=${page}`
    if (search) {
      url += `&search=${encodeURIComponent(search)}`
    }
    return apiRequest<any>(url)
  },

  createInvoice(data: InvoicePayload): Promise<{ success: boolean; message: string; data: Invoice }> {
    return apiRequest<{ success: boolean; message: string; data: Invoice }>('/financial/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  deleteInvoice(id: number, type: 'sales' | 'purchase'): Promise<{ success: boolean; message: string }> {
    return apiRequest<{ success: boolean; message: string }>(`/financial/invoices/${id}?type=${type}`, {
      method: 'DELETE',
    })
  },

  listOpeningBalances(balanceDate?: string): Promise<OpeningBalancesResponse> {
    const url = balanceDate ? `/accounting/opening-balances?balance_date=${balanceDate}` : '/accounting/opening-balances'
    return apiRequest<OpeningBalancesResponse>(url)
  },

  saveOpeningBalances(data: OpeningBalancePayload): Promise<{ success: boolean; message: string; data: any }> {
    return apiRequest<{ success: boolean; message: string; data: any }>('/accounting/opening-balances', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  importOpeningBalances(formData: FormData): Promise<{ success: boolean; message: string; data: any }> {
    return apiRequest<{ success: boolean; message: string; data: any }>('/accounting/opening-balances/import', {
      method: 'POST',
      body: formData,
      headers: {},
    })
  }
}
