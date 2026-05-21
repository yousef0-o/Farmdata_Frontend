export interface User {
  id: number
  name: string
  email: string
  roles: string[]
  created_at: string
}

export interface Company {
  id: number
  name: string
  address?: string
  phone?: string
  email?: string
  tax_number?: string
  commercial_record?: string
  is_active?: boolean
  projects?: Project[]
}

export interface Project {
  id: number
  company_id: number
  project_name: string
  description?: string
  start_date?: string
  end_date?: string
  sections?: Section[]
}

export interface Section {
  id: number
  project_id: number
  section_name: string
  section_type: 'production' | 'breeding'
  barns?: Barn[]
}

export interface Barn {
  id: number
  section_id: number
  barn_name: string
  barn_type: 'production' | 'breeding'
  capacity?: number
  active_flocks?: Flock[]
}

export interface Flock {
  id: number
  barn_id: number
  flock_type: 'production' | 'breeding'
  status: 'active' | 'completed' | 'cancelled'
  entry_birds: number
  current_count: number
  entry_date: string
  breed?: string
  supplier?: string
  chick_unit_cost?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  links?: {
    first: string
    last: string
    prev: string | null
    next: string | null
  }
  meta?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export interface FlockSummary {
  flock_id: number
  flock_type: 'production' | 'breeding'
  entry_birds: number
  current_count: number
  cumulative_mortality: number
  mortality_rate: number
  total_feed_kg: number
  days_recorded: number
  last_record_date: string | null
  // production only
  total_eggs?: number
  average_production_rate?: number
  fcr?: number | null
  // breeding only
  latest_week_number?: number
}

export interface FlockClosingAllocation {
  id: number
  flock_id: number
  allocation_label: string
  bird_count: number
  percentage: number
  value?: number
}

export interface FlockDetail extends Flock {
  barn?: Barn & { section?: Section }
  closing_allocations?: FlockClosingAllocation[]
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
}

export interface ProductionEntry {
  id: number
  flock_id: number
  record_date: string
  bird_count: number
  age_days: number
  mortality: number
  egg_size_jumbo: number
  egg_size_xlarge: number
  egg_size_large: number
  egg_size_medium: number
  egg_size_small: number
  egg_size_reject: number
  total_eggs: number
  production_rate: number   // PERCENT (0-100)
  operational_target: number
  standard_target: number
  ai_observation?: string
  feed_quantity_kg?: number
}

export interface BreedingEntry {
  id: number
  flock_id: number
  record_date: string
  week_number: number
  bird_count: number
  age_days: number
  mortality: number
  weight_sample_avg?: number
  uniformity_pct?: number
  ai_observation?: string
  feed_quantity_kg?: number
}

export interface FeedEntry {
  id: number
  flock_id: number
  record_date: string
  feed_quantity_kg: number
  warehouse_id?: number
  item_id?: number
}

export interface Warehouse {
  id: number
  name: string
  location?: string
  is_active?: boolean
}

export interface Item {
  id: number
  name: string
  unit?: string
  category?: string
  is_active?: boolean
}

export interface StockBalance {
  warehouse_id: number
  item_id: number
  item_name: string
  quantity_on_hand: number
  updated_at: string
}

export interface InventoryMovement {
  id: number
  type: 'in' | 'out'
  warehouse_id: number
  item_id: number
  quantity: number
  unit_cost?: number
  flock_id?: number
  reference_type?: string
  reference_id?: number
  reversal_of?: number
  notes?: string
  created_at: string
}

export interface Asset {
  id: number
  asset_code: string
  name: string
  name_en?: string
  category: 'nurseries' | 'incubators' | 'lands' | 'buildings' | 'poultry_houses' | 'cars' | 'equipment' | 'roads'
  sub_category?: string
  calculation_type?: string
  calculated_by?: string
  calculation_rate: number
  purchase_value: number
  book_value: number
  value_as_of: string
  location_code?: string
  location_name?: string
  cost_center_code?: string
  cost_center_name?: string
  asset_account?: string
  asset_account_name?: string
  depreciation_ac?: string
  depreciation_ac_name?: string
  accumulated_depreciation_ac?: string
  accumulated_depreciation_ac_name?: string
  additional_details?: Record<string, any>
  status: 'active' | 'in_maintenance' | 'disposed' | 'sold'
  status_label: string
  depreciation_percentage: number
  created_at?: string
  updated_at?: string
}

export interface AssetStats {
  total_assets_count: number
  total_purchase_value: number
  total_book_value: number
  total_depreciation: number
  depreciation_percentage: number
  assets_by_category: {
    category: string
    count: number
    total_value: number
  }[]
  assets_by_location: {
    location_name: string
    count: number
  }[]
  top_5_by_value: Asset[]
  top_5_by_depreciation: Asset[]
}

export interface Customer {
  id: number
  customer_code: string
  customer_name: string
  email1?: string
  email2?: string
  phone1?: string
  phone2?: string
  fax1?: string
  fax2?: string
  postal_code?: string
  country?: string
  credit_limit: number
  discount_days: number
  guarantee_amount: number
  discount_rate: number
  payment_discount: number
  discount_limit: number
  tax_number?: string
  commercial_record?: string
  account_code?: string
  account_name?: string
  current_balance: number
  customer_type: 'individual' | 'company'
  customer_type_label: string
  company_name?: string
  is_suspended: boolean
  is_suspended_label: string
  issue_date?: string
  salesman_number?: string
  salesman_name?: string
  sales_area_code?: string
  sales_area_name?: string
  po_box?: string
  district?: string
  province?: string
  street_name?: string
  building_number?: string
  customer_address?: string
  additional_street?: string
  additional_number?: string
  reference1?: string
  reference2?: string
  reference1_email?: string
  reference2_email?: string
  reference1_phone?: string
  reference2_phone?: string
  created_at?: string
  updated_at?: string
}

export interface CustomerStats {
  total_customers: number
  active_customers: number
  suspended_customers: number
  total_credit_limit: number
  total_balance: number
}

export interface Supplier {
  id: number
  supplier_code: string
  supplier_name: string
  email1?: string
  email2?: string
  phone1?: string
  phone2?: string
  fax1?: string
  fax2?: string
  postal_code?: string
  country?: string
  credit_limit: number
  discount_days: number
  guarantee_amount: number
  discount_rate: number
  tax_number?: string
  account_code?: string
  account_name?: string
  current_balance: number
  is_suspended: boolean
  is_suspended_label: string
  issue_date?: string
  po_box?: string
  district?: string
  province?: string
  street_name?: string
  building_number?: string
  customer_address?: string
  additional_street?: string
  additional_number?: string
  reference1?: string
  reference2?: string
  reference1_email?: string
  reference2_email?: string
  reference1_phone?: string
  reference2_phone?: string
  created_at?: string
  updated_at?: string
}

export interface SupplierStats {
  total_suppliers: number
  active_suppliers: number
  suspended_suppliers: number
  total_credit_limit: number
  total_balance: number
}


