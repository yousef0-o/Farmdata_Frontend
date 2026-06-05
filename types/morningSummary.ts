export type MorningSummaryFlockType = 'production' | 'breeding'

export type MorningSummarySeverity = 'low' | 'medium' | 'high'

export type MorningSummaryRiskLevel = 'low' | 'medium' | 'high'

export interface MorningSummaryFilters {
  date?: string
  company_id?: number
  project_id?: number
  section_id?: number
  barn_id?: number
}

export interface MorningSummaryScope {
  type: 'all' | 'company' | 'project' | 'section' | 'barn'
  id: number | null
}

export interface MorningSummaryMeta {
  date: string
  generated_at: string
  scope: MorningSummaryScope
}

export interface MorningSummaryTotals {
  active_flock_count: number
  production_flock_count: number
  breeding_flock_count: number
  active_birds: number
  mortality_today: number
  total_eggs_today: number
  cartons_today: number
  average_production_rate_today: number | null
  feed_kg_today: number
  missing_daily_logs_count: number
  health_alerts_count: number
  feed_low_stock_count: number
}

export interface MorningSummaryMortalityAlert {
  flock_id: number
  flock_number: string | null
  flock_type: MorningSummaryFlockType
  barn_id: number
  barn_name: string | null
  mortality_today: number
  mortality_rate_today: number
  severity: Exclude<MorningSummarySeverity, 'low'>
}

export interface MorningSummaryMissingDailyLogAlert {
  flock_id: number
  flock_number: string | null
  flock_type: MorningSummaryFlockType
  barn_id: number
  barn_name: string | null
  last_record_date: string | null
  missing_days: number
  expected_log_type: 'production_entry' | 'breeding_entry'
}

export interface MorningSummaryHealthAlert {
  id: number
  flock_id: number
  flock_number: string | null
  flock_type: MorningSummaryFlockType
  barn_id: number | null
  barn_name: string | null
  record_date: string
  severity: Exclude<MorningSummarySeverity, 'low'>
  diagnosis: string | null
  clinical_signs: string | null
  veterinarian: string | null
}

export interface MorningSummaryAlerts {
  mortality: MorningSummaryMortalityAlert[]
  missing_daily_logs: MorningSummaryMissingDailyLogAlert[]
  health: MorningSummaryHealthAlert[]
}

export interface MorningSummaryWatchlistItem {
  flock_id: number
  flock_number: string | null
  flock_type: MorningSummaryFlockType
  barn_id: number
  barn_name: string | null
  section_name: string | null
  project_name: string | null
  company_name: string | null
  entry_date: string | null
  age_days: number | null
  entry_birds: number
  current_birds: number
  last_record_date: string | null
  missing_daily_log: boolean
  missing_days: number
  mortality_today: number
  mortality_rate_today: number
  total_eggs_today: number
  production_rate_today: number | null
  feed_kg_today: number
  health_severity: MorningSummarySeverity | null
  risk_score: number
  risk_level: MorningSummaryRiskLevel
}

export interface MorningSummaryFeedRunwayItem {
  warehouse_id: number
  warehouse_name: string | null
  item_id: number
  item_name: string | null
  item_code: string | null
  item_category: string | null
  stock_kg: number
  daily_avg_consumption_kg: number
  days_remaining: number | null
  low_stock: boolean
}

export interface MorningSummaryResponse {
  meta: MorningSummaryMeta
  summary: MorningSummaryTotals
  alerts: MorningSummaryAlerts
  watchlist: MorningSummaryWatchlistItem[]
  feed_runway: MorningSummaryFeedRunwayItem[]
}
