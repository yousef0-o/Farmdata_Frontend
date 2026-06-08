export interface User {
  id: number
  name: string
  email: string
  phone?: string
  is_active?: boolean
  roles: string[]
  permissions?: string[]
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
  name?: string
  section_type: 'production' | 'breeding'
  type?: string
  feed_warehouse_id?: number | null
  production_warehouse_id?: number | null
  barns?: Barn[]
}

export interface Barn {
  id: number
  section_id: number
  barn_name: string
  name?: string
  barn_number?: string | null
  barn_type: 'production' | 'breeding'
  capacity?: number
  current_birds?: number
  location?: string | null
  status?: 'active' | 'inactive' | 'maintenance'
  description?: string | null
  active_flocks?: Flock[]
  flocks?: Flock[]
  section?: Section & { project?: Project & { company?: Company } }
}

export interface Flock {
  id: number
  barn_id: number
  flock_number?: string | null
  flock_type: 'production' | 'breeding'
  status: 'active' | 'completed' | 'cancelled'
  entry_birds: number
  current_count: number
  entry_date: string
  end_date?: string | null
  production_end_date?: string | null
  breeding_entered_count?: number | null
  breeding_exited_count?: number | null
  production_entered_count?: number | null
  production_exited_count?: number | null
  exit_count?: number | null
  exit_age?: number | null
  target_carton?: number | null
  target_tray?: number | null
  exit_date?: string
  breed?: string
  supplier?: string
  chick_unit_cost?: string
  chick_total_cost?: string
  rearing_entry_date?: string | null
  rearing_exit_date?: string | null
  rearing_entered_count?: number | null
  rearing_mortality_count?: number | null
  rearing_mortality_value?: number | string | null
  chicks_value?: number | string | null
  feed_value?: number | string | null
  vet_value?: number | string | null
  other_value?: number | string | null
  flock_value?: number | string | null
  bird_value?: number | string | null
  barn?: Barn
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
  current_birds?: number
  age_days?: number
  week_number?: number
  cumulative_mortality: number
  mortality_rate: number
  total_feed_kg: number
  chick_cost?: number
  feed_cost?: number
  vet_cost?: number
  other_cost?: number
  bird_value?: number
  mortality_value?: number
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

export * from './nurseryExpenses'
export * from './nurseryLocations'
export * from './nurseryLines'
export * from './nurseryVarieties'

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
  standard_target?: number
  ai_observation?: string
  feed_quantity_kg?: number
  egg_items?: EggItemPayload[]
  feed_batches?: PoultryFeedBatch[]
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
  feed_batches?: PoultryFeedBatch[]
}

export interface FeedEntry {
  id: number
  flock_id: number
  record_date: string
  feed_quantity_kg: number
  warehouse_id?: number
  item_id?: number
}

export interface EggItemPayload {
  item_id: number
  quantity: number
  size_code?: string
  egg_size?: string
  size?: string
}

export interface PoultryFeedBatch {
  id?: number
  flock_id?: number
  record_date?: string
  log_time?: string | null
  feed_type?: string | null
  quantity_ton: number
  quantity_kg?: number
  price_per_ton?: number
  amount?: number
  warehouse_id?: number | null
  item_id?: number | null
  inventory_item_id?: number | null
  inventory_movement_id?: number | null
}

export interface Warehouse {
  id: number
  company_id: number
  name: string
  code: string
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
  warehouse_name?: string
  item_id: number
  item_name?: string
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
  additional_details?: Record<string, unknown>
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
export * from './nurseryInventory'
export * from './archive'

export interface FlockMedication {
  id: number
  flock_medical_record_id: number
  warehouse_id?: number
  warehouse_name?: string
  inventory_item_id?: number
  inventory_item_name?: string
  quantity?: number
  medicine_name: string
  dosage?: string
  water_concentration?: string
  method_of_administration?: string
  attachment_path?: string[]
  attachments?: Array<{
    path: string
    url: string
    name: string
  }>
}

export interface FlockMedicalRecord {
  id: number
  flock_id: number
  record_date: string
  clinical_signs?: string
  diagnosis?: string
  severity: 'low' | 'medium' | 'high'
  veterinarian?: string
  notes?: string
  attachment_path?: string[]
  attachments?: Array<{
    path: string
    url: string
    name: string
  }>
  ai_extracted_text?: Array<Record<string, unknown>>
  created_by?: {
    id: number
    name: string
  }
  medications: FlockMedication[]
}

export interface EggWeightDistribution {
  summary: {
    total_eggs: number
    total_cartons: number
    total_plates: number
  }
  rows: {
    size_code: string
    label_ar: string
    label_en: string
    cartons: number
    plates: number
    eggs: number
    percentage: number
    weight_from: number | null
    weight_to: number | null
    avg_weight: number | null
    egg_weight_gram: number
    total_weight_ton: number
  }[]
}

export interface EntityStatistics {
  level: 'projects' | 'project' | 'section' | 'barn'
  section_type: 'production' | 'breeding' | null
  breeding_stats: {
    entry_birds: number
    exit_birds: number
    mortality_breeding: number
    mortality_value: number
    chick_cost: number
    feed_cost: number
    vet_cost: number
    other_cost: number
    total_value: number
    mortality_rate: number
  }
  production_stats: {
    cartons_produced: number
    total_eggs: number
    feed_consumed_ton: number
    mortality_production: number
    mortality_value: number
    average_production_rate: number
    mortality_rate: number
    target_carton?: number
    standard_target_carton?: number
    operational_target_carton?: number
    egg_sizes_distribution?: {
      B: number
      BD: number
      SD: number
      SS: number
      S: number
      M: number
      L2: number
      L1: number
      XL: number
      XXL: number
      J: number
      F2: number
      SSS: number
    }
  }
  annual_production: {
    year: number
    month: number
    cartons: number
  }[]
  annual_movement?: {
    year: number
    cartons_produced: number
    eggs_produced: number
    birds_entering_production: number
    cumulative_birds: number
    production_rate: number
    mortality_count: number
    feed_consumption: number
    target_cartons: number
    cartons_difference: number
  }[]
  ledger_summary: {
    total_debit: number
    total_credit: number
    net_balance: number
  }
  flock_count: number
  egg_weight_distribution?: EggWeightDistribution
}

export type AnalyticsScopeLevel = 'all' | 'company' | 'project' | 'section' | 'barn' | 'flock'
export type AnalyticsStage = 'production' | 'breeding' | 'mixed'
export type AnalyticsAggregation = 'daily' | 'weekly' | 'monthly'
export type AnalyticsAxis = 'date' | 'age'

export interface AnalyticsFilterOption {
  id: number
  name: string
  company_id?: number
  project_id?: number
  section_id?: number
  barn_id?: number
  section_type?: 'production' | 'breeding'
  barn_type?: 'production' | 'breeding'
}

export interface AnalyticsMetricEvaluation {
  level: 'excellent' | 'very_good' | 'good' | 'average' | 'weak' | 'neutral' | 'unknown'
  label_ar: string
  label_en: string
  color_token: string
}

export interface AnalyticsGoalComparison {
  metric_key: 'fcr' | 'lay_rate' | 'carton_yield'
  name: string
  source: string
  comparison_operator: 'gte' | 'lte'
  target_value: number | null
  actual_value: number | null
  achievement_rate: number | null
  variance: number | null
  remaining_threshold: number | null
  is_achieved: boolean
}

export interface FlockAnalyticsResponse {
  meta: {
    level: AnalyticsScopeLevel
    scope: {
      level: AnalyticsScopeLevel
      flock_id: number | null
      barn_id: number | null
      section_id: number | null
      project_id: number | null
      company_id: number | null
      label: string
    }
    stage: AnalyticsStage
    aggregation: AnalyticsAggregation
    axis: AnalyticsAxis
    active_flocks_only: boolean
    date_from: string
    date_to: string
    year: number
    flock_count: number
    production_flock_count: number
    breeding_flock_count: number
  }
  filters: {
    companies: AnalyticsFilterOption[]
    projects: AnalyticsFilterOption[]
    sections: AnalyticsFilterOption[]
    barns: AnalyticsFilterOption[]
    years: number[]
  }
  stage_router: {
    current: AnalyticsStage
    has_breeding_data: boolean
    has_production_data: boolean
  }
  summary: {
    breeding: {
      entry_birds: number
      exit_birds: number
      mortality_breeding: number
      mortality_rate: number
      chick_cost: number
      feed_cost: number
      vet_cost: number
      other_cost: number
      bird_value: number
      mortality_value: number
      total_flock_value: number
      total_feed_kg: number
      evaluation: AnalyticsMetricEvaluation
    }
    production: {
      cartons_produced: number
      total_eggs: number
      total_feed_kg: number
      total_feed_ton: number
      mortality_production: number
      mortality_rate: number
      chick_cost?: number
      feed_cost?: number
      vet_cost?: number
      other_cost?: number
      bird_value?: number
      mortality_value: number
      weighted_lay_rate: number
      actual_avg_egg_weight_g: number
      actual_carton_weight_kg: number
      total_egg_weight_kg: number
      total_egg_weight_ton: number
      feed_per_carton_kg: number | null
      fcr: number | null
      cartons_per_ton_feed: number | null
      targets: {
        operational_target_eggs: number
        operational_target_cartons: number
        standard_target_eggs: number
        standard_target_cartons: number
        operational_achievement_rate: number | null
        standard_achievement_rate: number | null
      }
      evaluations: {
        lay_rate: AnalyticsMetricEvaluation
        fcr: AnalyticsMetricEvaluation
        feed_per_carton: AnalyticsMetricEvaluation
        mortality_rate: AnalyticsMetricEvaluation
      }
    }
  }
  goal_dashboard: {
    goals: AnalyticsGoalComparison[]
    achievement_summary: {
      tracked_goal_count: number
      achieved_goal_count: number
      achievement_ratio: number
    }
  }
  egg_weight_distribution: EggWeightDistribution
  series: {
    axis: AnalyticsAxis
    aggregation: AnalyticsAggregation
    summary_line: {
      avg_lay_rate: number
      fcr: number | null
    }
    points: {
      bucket: string
      label: string
      date: string
      age_days: number
      total_eggs: number
      cartons: number
      feed_kg: number
      mortality: number
      lay_rate: number
    }[]
  }
  breeding_series: {
    axis: AnalyticsAxis
    aggregation: AnalyticsAggregation
    points: {
      bucket: string
      label: string
      date: string
      age_days: number
      feed_kg: number
      mortality: number
    }[]
  }
  annual_movement: {
    year: number
    cartons_produced: number
    eggs_produced: number
    birds_entering_production: number
    cumulative_birds: number
    production_rate: number
    annual_mortality: number
    annual_feed_ton: number
    annual_target_cartons: number
    carton_difference: number
  }[]
}
