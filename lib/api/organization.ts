import { apiRequest, wrapResponse } from './client'
import type { Company, Project, Section, Barn, Flock, FlockDetail, FlockSummary, PaginatedResponse, ProductionEntry, BreedingEntry, FeedEntry, EntityStatistics } from '../types'

export const organizationApi = {
  // Companies
  listCompanies: () =>
    apiRequest<PaginatedResponse<Company>>('/companies'),
  getCompany: (id: number) =>
    wrapResponse<Company>(apiRequest(`/companies/${id}`)),
  createCompany: (data: Partial<Company>) =>
    wrapResponse<Company>(apiRequest('/companies', {
      method: 'POST',
      body: JSON.stringify(data),
    })),
  updateCompany: (id: number, data: Partial<Company>) =>
    wrapResponse<Company>(apiRequest(`/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })),
  deleteCompany: (id: number) =>
    apiRequest<void>(`/companies/${id}`, { method: 'DELETE' }),

  // Projects
  listProjects: () =>
    apiRequest<PaginatedResponse<Project>>('/projects'),
  getProject: (id: number) =>
    wrapResponse<Project>(apiRequest(`/projects/${id}`)),
  createProject: (data: { company_id: number; project_name: string }) =>
    wrapResponse<Project>(apiRequest('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    })),
  updateProject: (id: number, data: { project_name: string }) =>
    wrapResponse<Project>(apiRequest(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })),
  deleteProject: (id: number) =>
    apiRequest<void>(`/projects/${id}`, { method: 'DELETE' }),

  // Sections
  getSection: (id: number) =>
    wrapResponse<Section>(apiRequest(`/sections/${id}`)),
  createSection: (data: {
    project_id: number
    section_name: string
    section_type: 'production' | 'breeding'
  }) =>
    wrapResponse<Section>(apiRequest('/sections', {
      method: 'POST',
      body: JSON.stringify(data),
    })),
  deleteSection: (id: number) =>
    apiRequest<void>(`/sections/${id}`, { method: 'DELETE' }),

  // Barns
  getBarn: (id: number) =>
    wrapResponse<Barn>(apiRequest(`/barns/${id}`)),
  createBarn: (data: {
    section_id: number
    barn_name: string
    capacity?: number
  }) =>
    wrapResponse<Barn>(apiRequest('/barns', {
      method: 'POST',
      body: JSON.stringify(data),
    })),
  deleteBarn: (id: number) =>
    apiRequest<void>(`/barns/${id}`, { method: 'DELETE' }),

  // Statistics
  getCompanyStatistics: (id: number) =>
    apiRequest<EntityStatistics>(`/companies/${id}/statistics`),
  getProjectStatistics: (id: number) =>
    apiRequest<EntityStatistics>(`/projects/${id}/statistics`),
  getSectionStatistics: (id: number) =>
    apiRequest<EntityStatistics>(`/sections/${id}/statistics`),
  getBarnStatistics: (id: number) =>
    apiRequest<EntityStatistics>(`/barns/${id}/statistics`),
}

export const flockApi = {
  createFlock: (data: {
    barn_id: number
    entry_date: string
    entry_birds: number
    chick_unit_cost?: number
    breed?: string
    supplier?: string
  }) =>
    wrapResponse<Flock>(apiRequest('/flocks', {
      method: 'POST',
      body: JSON.stringify(data),
    })),

  getFlock: (id: number) =>
    wrapResponse<FlockDetail>(apiRequest(`/flocks/${id}`)),

  updateFlock: (
    id: number,
    data: { breed?: string; supplier?: string; chick_unit_cost?: number }
  ) =>
    wrapResponse<Flock>(apiRequest(`/flocks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })),

  getFlockSummary: (id: number) =>
    apiRequest<FlockSummary>(`/flocks/${id}/summary`),

  closeFlock: (
    id: number,
    data: {
      close_date: string
      allocations: { label: string; bird_count: number; value?: number }[]
    }
  ) =>
    wrapResponse<FlockDetail>(apiRequest(`/flocks/${id}/close`, {
      method: 'POST',
      body: JSON.stringify(data),
    })),
}

export const dailyOpsApi = {
  // Production entries
  listProductionEntries: (flockId: number, page = 1) =>
    apiRequest<PaginatedResponse<ProductionEntry>>(
      `/flocks/${flockId}/production-entries?page=${page}`
    ),

  createProductionEntry: (flockId: number, data: {
    record_date: string
    mortality?: number
    egg_size_jumbo?: number
    egg_size_xlarge?: number
    egg_size_large?: number
    egg_size_medium?: number
    egg_size_small?: number
    egg_size_reject?: number
    feed_quantity_kg: number
    warehouse_id?: number
    inventory_item_id?: number
    egg_warehouse_id?: number
    egg_item_id?: number
    ai_observation?: string
  }) => apiRequest<{ data: { production_entry: ProductionEntry; feed_entry: FeedEntry } }>(
    `/flocks/${flockId}/production-entries`,
    { method: 'POST', body: JSON.stringify(data) }
  ),

  updateProductionEntry: (flockId: number, entryId: number, data: {
    mortality?: number
    egg_size_jumbo?: number
    egg_size_xlarge?: number
    egg_size_large?: number
    egg_size_medium?: number
    egg_size_small?: number
    egg_size_reject?: number
    feed_quantity_kg?: number
    ai_observation?: string
  }) => apiRequest<{ data: { production_entry: ProductionEntry; feed_entry: FeedEntry } }>(
    `/flocks/${flockId}/production-entries/${entryId}`,
    { method: 'PUT', body: JSON.stringify(data) }
  ),

  deleteProductionEntry: (flockId: number, entryId: number) =>
    apiRequest<void>(
      `/flocks/${flockId}/production-entries/${entryId}`,
      { method: 'DELETE' }
    ),

  // Breeding entries
  listBreedingEntries: (flockId: number, page = 1) =>
    apiRequest<PaginatedResponse<BreedingEntry>>(
      `/flocks/${flockId}/breeding-entries?page=${page}`
    ),

  createBreedingEntry: (flockId: number, data: {
    mortality?: number
    weight_sample_avg?: number
    uniformity_pct?: number
    feed_quantity_kg: number
    warehouse_id?: number
    item_id?: number
    ai_observation?: string
  }) => apiRequest<{ data: { measurement: BreedingEntry; feed: FeedEntry } }>(
    `/flocks/${flockId}/breeding-entries`,
    { method: 'POST', body: JSON.stringify(data) }
  ),

  updateBreedingEntry: (flockId: number, entryId: number, data: {
    mortality?: number
    weight_sample_avg?: number
    uniformity_pct?: number
    feed_quantity_kg?: number
    ai_observation?: string
  }) => apiRequest<{ data: { measurement: BreedingEntry; feed: FeedEntry } }>(
    `/flocks/${flockId}/breeding-entries/${entryId}`,
    { method: 'PUT', body: JSON.stringify(data) }
  ),

  deleteBreedingEntry: (flockId: number, entryId: number) =>
    apiRequest<void>(
      `/flocks/${flockId}/breeding-entries/${entryId}`,
      { method: 'DELETE' }
    ),

  getProductionEntry: (flockId: number, entryId: number) =>
    wrapResponse<ProductionEntry>(
      apiRequest(`/flocks/${flockId}/production-entries/${entryId}`)
    ),

  getBreedingEntry: (flockId: number, entryId: number) =>
    wrapResponse<BreedingEntry>(
      apiRequest(`/flocks/${flockId}/breeding-entries/${entryId}`)
    ),
}

export interface ExpenseRecord {
  id: number
  expense_date: string
  amount: number
  category: string
  description?: string
  created_by?: number
  created_at: string
  creator?: {
    id: number
    name: string
  }
}

export const expensesApi = {
  // Barn Expenses
  listBarnExpenses: (barnId: number) =>
    apiRequest<{ data: ExpenseRecord[] }>(`/barns/${barnId}/expenses`),
  
  createBarnExpense: (barnId: number, data: {
    expense_date: string
    amount: number
    category: string
    description?: string
  }) =>
    apiRequest<{ data: ExpenseRecord }>(`/barns/${barnId}/expenses`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteBarnExpense: (barnId: number, expenseId: number) =>
    apiRequest<void>(`/barns/${barnId}/expenses/${expenseId}`, {
      method: 'DELETE',
    }),

  // Flock Expenses
  listFlockExpenses: (flockId: number) =>
    apiRequest<{ data: ExpenseRecord[] }>(`/flocks/${flockId}/expenses`),

  createFlockExpense: (flockId: number, data: {
    expense_date: string
    amount: number
    category: string
    description?: string
  }) =>
    apiRequest<{ data: ExpenseRecord }>(`/flocks/${flockId}/expenses`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteFlockExpense: (flockId: number, expenseId: number) =>
    apiRequest<void>(`/flocks/${flockId}/expenses/${expenseId}`, {
      method: 'DELETE',
    }),
}
