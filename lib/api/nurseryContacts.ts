import { apiRequest } from './client'

export type NurseryContactType = 'customer' | 'supplier' | 'both'

export interface NurseryContact {
  id: number
  name: string
  type: NurseryContactType
  type_display_name: string
  phone: string | null
  email: string | null
  tax_number: string | null
  address: string | null
  created_at: string | null
  updated_at: string | null
}

export interface NurseryContactCounters {
  total_customers: number
  total_suppliers: number
  total_both: number
}

export interface NurseryContactsResponse {
  data: NurseryContact[]
  counters: NurseryContactCounters
}

export interface CreateNurseryContactRequest {
  name: string
  type: NurseryContactType
  phone?: string
  email?: string
  tax_number?: string
  address?: string
}

export interface UpdateNurseryContactRequest extends Partial<CreateNurseryContactRequest> {}

export const nurseryContactsApi = {
  list: async () => {
    return apiRequest<NurseryContactsResponse>('/nursery/contacts')
  },

  get: async (id: number) => {
    return apiRequest<NurseryContact>(`/nursery/contacts/${id}`)
  },

  create: async (data: CreateNurseryContactRequest) => {
    return apiRequest<NurseryContact>('/nursery/contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  update: async (id: number, data: UpdateNurseryContactRequest) => {
    return apiRequest<NurseryContact>(`/nursery/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  delete: async (id: number) => {
    return apiRequest(`/nursery/contacts/${id}`, {
      method: 'DELETE',
    })
  },
}
