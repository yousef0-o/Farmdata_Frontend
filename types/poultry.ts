export type FlockType = 'production' | 'breeding'

export type FlockStatus = 'active' | 'completed' | 'cancelled'

export interface Flock {
  id: number
  barn_id: number
  flock_number: string | null
  flock_type: FlockType
  status: FlockStatus
  entry_date: string
  entry_birds: number
  current_count: number
  exit_count: number | null
  exit_age: number | null
  target_carton: number | null
  target_tray: number | null
  chick_unit_cost: number | string | null
  chick_total_cost: number | string | null
  breed: string | null
  supplier: string | null
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
}

export interface PoultryFeedBatch {
  id: number
  flock_id: number
  record_date: string
  log_time: string | null
  feed_type: string | null
  quantity_ton: number | string
  quantity_kg: number | string
  price_per_ton: number | string
  amount: number | string
  warehouse_id: number
  item_id: number
}
