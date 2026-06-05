export interface EggSizeStandard {
  id: number
  size_code: string
  label_ar: string
  label_en: string
  weight_from: string | number | null
  weight_to: string | number | null
  avg_weight: string | number | null
  egg_weight_gram: string | number
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface EggSizeStandardUpdateRow {
  id: number
  weight_from: number | null
  weight_to: number | null
  avg_weight: number | null
  egg_weight_gram: number
  display_order: number
  is_active: boolean
}

export interface EggSizeStandardsResponse {
  data: EggSizeStandard[]
}

export interface UpdateEggSizeStandardsResponse {
  message: string
  data: EggSizeStandard[]
}
