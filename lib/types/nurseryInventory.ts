export interface NurseryInventoryTreeNode {
  id: number
  name: string
  parent_id: number | null
  description?: string | null
  children: NurseryInventoryTreeNode[]
}

export interface NurseryInventoryRelation {
  id: number | null
  name: string | null
  parent_id: number | null
}

export interface NurseryInventoryItem {
  id: number
  name: string
  category_id: number | null
  location_id: number | null
  quantity: number
  unit: string
  min_quantity: number
  item_value: number
  opening_balance_date: string | null
  low_stock: boolean
  total_value: number
  category?: NurseryInventoryRelation
  location?: NurseryInventoryRelation
  created_at?: string
  updated_at?: string
}

export interface NurseryInventoryCategoryTotal {
  category_id: number | null
  category_name: string
  total_value: number
  items_count: number
}

export interface NurseryInventoryGroupedItems {
  category_id: number | null
  category_name: string
  total_value: number
  items: NurseryInventoryItem[]
}

export interface NurseryInventoryLocationCardChild {
  id: number
  name: string
  description?: string | null
  active_items_count: number
  parent_name?: string | null
}

export interface NurseryInventoryLocationCard {
  id: number
  name: string
  description?: string | null
  active_items_count: number
  descendants_count: number
  total_quantity: number
  total_value: number
  low_stock_count: number
  occupancy_percent: number
  children: NurseryInventoryLocationCardChild[]
}

export interface NurseryInventorySummary {
  grand_total_value: number
  category_totals: NurseryInventoryCategoryTotal[]
  items_count: number
  categories_count: number
  locations_count: number
  low_stock_count: number
  total_quantity: number
}

export interface NurseryInventoryBootstrap {
  summary: NurseryInventorySummary
  categories: NurseryInventoryTreeNode[]
  locations: NurseryInventoryTreeNode[]
  items: NurseryInventoryItem[]
  items_grouped_by_category: NurseryInventoryGroupedItems[]
  location_cards: NurseryInventoryLocationCard[]
}

export interface NurseryInventoryCategoryPayload {
  name: string
  parent_id?: number | null
  description?: string
}

export interface NurseryInventoryLocationPayload {
  name: string
  parent_id?: number | null
  description?: string
}

export interface NurseryInventoryItemPayload {
  name: string
  category_id?: number | null
  location_id?: number | null
  quantity: number
  unit: string
  min_quantity?: number
  item_value?: number
  opening_balance_date?: string | null
}

export interface NurseryInventoryOpeningBalancePayload {
  items: Array<{
    id: number
    quantity: number
    opening_balance_date?: string | null
  }>
}
