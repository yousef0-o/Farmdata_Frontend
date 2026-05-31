export type TreeVarietyCategory =
  | 'أشجار مثمرة'
  | 'أشجار زينة'
  | 'أشجار خشبية'
  | 'نخيل'
  | 'شجيرات'
  | 'أخرى'

export type TreeVariety = {
  id: number
  name: string
  scientific_name: string | null
  category: string | null
  growth_period: number | null
  description: string | null
  tree_lines_count: number
  total_quantity: number
  created_at: string | null
}

export type TreeVarietyPayload = {
  name: string
  scientific_name?: string | null
  category?: TreeVarietyCategory | string | null
  growth_period?: number | null
  description?: string | null
}

export type TreeGuide = {
  id: number
  name: string
  scientific_name: string | null
  family: string | null
  common_name: string | null
  origin: string | null
  growth_habit: string | null
  height: number | null
  spread: number | null
  leaf_type: string | null
  leaf_color: string | null
  usage_location: string | null
  usage_type: string | null
  image_url: string | null
  light: string | null
  temperature: string | null
  humidity: string | null
  salinity: string | null
  irrigation: string | null
  propagation: string | null
  general_care: string | null
  notes: string | null
  created_at: string | null
}

export type TreeGuidePayload = {
  name: string
  scientific_name?: string | null
  family?: string | null
  common_name?: string | null
  origin?: string | null
  growth_habit?: string | null
  height?: number | null
  spread?: number | null
  leaf_type?: string | null
  leaf_color?: string | null
  usage_location?: string | null
  usage_type?: string | null
  image_url?: string | null
  light?: string | null
  temperature?: string | null
  humidity?: string | null
  salinity?: string | null
  irrigation?: string | null
  propagation?: string | null
  general_care?: string | null
  notes?: string | null
}

export type NurseryVarietyListParams = {
  search?: string
  category?: string
  sort?: 'name' | 'scientific_name' | 'category' | 'growth_period' | 'created_at' | 'total_quantity'
  direction?: 'asc' | 'desc'
  page?: number
  per_page?: number
}

export type NurseryGuideListParams = {
  search?: string
  family?: string
  growth_habit?: string
  usage_type?: string
  sort?: 'name' | 'scientific_name' | 'family' | 'growth_habit' | 'height' | 'spread' | 'usage_type' | 'created_at'
  direction?: 'asc' | 'desc'
  page?: number
  per_page?: number
}

export type PaginationMeta = {
  current_page: number
  from: number | null
  last_page: number
  per_page: number
  to: number | null
  total: number
}

export type NurseryVarietySummary = {
  total_tree_quantity: number
  active_tree_lines_count: number
  stocked_varieties_count: number
}

export type PaginatedApiResponse<T> = {
  data: T[]
  links: Record<string, string | null>
  meta: PaginationMeta
}

export type NurseryVarietyListResponse = PaginatedApiResponse<TreeVariety> & {
  summary: NurseryVarietySummary
}
