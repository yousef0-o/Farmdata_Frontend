export type NurseryLineLedgerFilters = {
  nursery_id?: number | null
  location_id?: number | null
  section_id?: number | null
  basin_id?: number | null
  variety_id?: number | null
  pot_size?: string | null
  date_from?: string | null
  date_to?: string | null
}

export type NurseryLineFilterOption = {
  id: number
  name: string
}

export type NurseryLineLocationOption = NurseryLineFilterOption & {
  nursery_id: number
}

export type NurseryLineSectionOption = NurseryLineFilterOption & {
  location_id: number
}

export type NurseryLineBasinOption = NurseryLineFilterOption & {
  section_id: number
}

export type NurseryLineLedgerRow = {
  id: number
  basin_id: number
  line_number: number
  tree_type_id: number
  variety_name: string
  quantity: number
  pot_size: string | null
  height: number
  thickness: number
  birth_date: string | null
  created_at: string | null
  original_quantity: number
  nursery: NurseryLineFilterOption
  location: NurseryLineFilterOption
  section: NurseryLineFilterOption
  basin: NurseryLineFilterOption
}

export type NurseryLineFilterOptions = {
  nurseries: NurseryLineFilterOption[]
  locations: NurseryLineLocationOption[]
  sections: NurseryLineSectionOption[]
  basins: NurseryLineBasinOption[]
  varieties: NurseryLineFilterOption[]
  pot_sizes: string[]
}

export type NurseryLineLedgerSummary = {
  lines_count: number
  total_quantity: number
}

export type NurseryLineLedgerPayload = {
  lines: NurseryLineLedgerRow[]
  filters: Required<NurseryLineLedgerFilters>
  filter_options: NurseryLineFilterOptions
  summary: NurseryLineLedgerSummary
}
