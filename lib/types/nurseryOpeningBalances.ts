export interface NurseryOpeningBalanceRow {
  id: number
  name: string
  category_id: number | null
  category_name: string
  location_id: number | null
  location_name: string | null
  quantity: number
  unit: string
  min_quantity: number
  item_value: number
  opening_item_value: number
  opening_balance_date: string | null
  total_value: number
  low_stock: boolean
  opening_balance_id: number | null
  updated_at: string | null
}

export interface NurseryOpeningBalanceSummary {
  items_count: number
  committed_count: number
  total_quantity: number
  total_value: number
  low_stock_count: number
}

export interface NurseryOpeningBalancesBootstrap {
  items: NurseryOpeningBalanceRow[]
  summary: NurseryOpeningBalanceSummary
}

export interface NurseryOpeningBalancesPayload {
  items: Array<{
    id: number
    quantity: number
    opening_balance_date?: string | null
  }>
}
