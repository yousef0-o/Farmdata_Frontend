export type NurseryLineType = 'longitudinal' | 'transverse'

export type IrrigationComponentType =
  | 'main_line'
  | 'sub_line'
  | 'valve'
  | 'connection'
  | 'divider'

export type NurseryLayoutLinePayload = {
  length: number
  size: string
  num_valves: number
  num_connections: number
  num_dividers: number
}

export type UpsertNurseryPayload = {
  name: string
  length: number
  width: number
  num_wells: number
  num_well_machines: number
  well_line_length: number
  long_lines: NurseryLayoutLinePayload[]
  trans_lines: NurseryLayoutLinePayload[]
  images?: File[]
}

export type StoreLocationPayload = {
  nursery_id: number
  location_name: string
}

export type UpsertSectionPayload = {
  location_id?: number
  name: string
  creation_date: string
  length: number
  width: number
  num_entrances: number
  entrance_width: number
  num_aisles: number
  num_columns: number
  column_height: number
  num_main_lines: number
  main_line_length: number
  main_line_size: string
  num_sub_lines: number
  sub_line_length: number
  sub_line_size: string
  num_main_valves: number
  main_valve_size: string
  num_sub_valves: number
  sub_valve_size: string
}

export type UpsertBasinPayload = {
  section_id?: number
  base_name: string
  count?: number
  length: number
  width: number
  long_division: string
  trans_division: string
  pots_per_point: number
  trees_long: number
  trees_trans: number
  type: string
  content: string
  irrigation_method: string
}

export type StoreIrrigationPlanPayload = {
  nursery_id: number
  plan_name: string
  components: IrrigationComponentType[]
}

export type NurseryImage = {
  id: number
  nursery_id: number
  image_path: string
}

export type NurseryLine = {
  id: number
  nursery_id: number
  line_type: NurseryLineType
  line_number: number
  length: number
  size: string
  num_valves: number
  num_connections: number
  num_dividers: number
}

export type IrrigationComponent = {
  id: number
  plan_id: number
  type: IrrigationComponentType
  sort_order: number
  created_at: string | null
}

export type IrrigationPlan = {
  id: number
  nursery_id: number
  name: string
  created_at: string | null
  components: IrrigationComponent[]
}

export type NurseryBasin = {
  id: number
  section_id: number
  name: string
  length: number
  width: number
  long_division: string
  trans_division: string
  pots_per_point: number
  trees_long: number
  trees_trans: number
  capacity: number
  type: string
  content: string
  irrigation_method: string
  created_at: string | null
}

export type SectionStats = {
  basin_count: number
  area: number
  valves: number
  basins_area: number
  basins_capacity: number
}

export type NurserySection = {
  id: number
  location_id: number
  name: string
  creation_date: string | null
  length: number
  width: number
  num_entrances: number
  entrance_width: number
  num_aisles: number
  num_columns: number
  column_height: number
  num_main_lines: number
  main_line_length: number
  main_line_size: string
  num_sub_lines: number
  sub_line_length: number
  sub_line_size: string
  num_main_valves: number
  main_valve_size: string
  num_sub_valves: number
  sub_valve_size: string
  created_at: string | null
  stats: SectionStats
  basins: NurseryBasin[]
}

export type LocationStats = {
  total_sections: number
  total_basins: number
  total_area: number
  total_basins_area: number
  capacity: number
  total_columns: number
  total_main_lines: number
  total_sub_lines: number
  total_valves: number
}

export type NurseryLocation = {
  id: number
  nursery_id: number
  name: string
  created_at: string | null
  stats: LocationStats
  sections: NurserySection[]
}

export type NurseryLayout = {
  id: number
  name: string
  length: number
  width: number
  area: number
  num_wells: number
  num_well_machines: number
  well_line_length: number
  created_at: string | null
  main_image: string | null
  images: NurseryImage[]
  lines: NurseryLine[]
  plans: IrrigationPlan[]
  locations: NurseryLocation[]
}

export type NurseryLocationGlobalStats = {
  nurseries: number
  locations: number
  sections: number
  basins: number
  sections_area: number
  basins_area: number
  capacity: number
  columns: number
  main_lines: number
  sub_lines: number
  valves: number
}

export type NurseryLocationsBootstrap = {
  nurseries: NurseryLayout[]
  global_stats: NurseryLocationGlobalStats
}
