export type NurseryManageIdName = {
  id: number
  name: string
}

export type NurseryManageLocationOption = NurseryManageIdName & {
  nursery_id: number
}

export type NurseryManageSectionOption = NurseryManageIdName & {
  location_id: number
}

export type NurseryManageBasinOption = NurseryManageIdName & {
  section_id: number
}

export type NurseryManageStats = {
  nurseries: number
  locations: number
  sections: number
  basins: number
  basins_area: number
  total_trees: number
  active_cycles: number
}

export type NurseryManageHierarchyBasin = {
  id: number
  name: string
  length: number
  width: number
  irrigation_method: string | null
  capacity: number
  type: string | null
  content: string | null
  total_trees: number
}

export type NurseryManageHierarchySection = NurseryManageIdName & {
  total_trees: number
  basins: NurseryManageHierarchyBasin[]
}

export type NurseryManageHierarchyLocation = NurseryManageIdName & {
  total_trees: number
  sections: NurseryManageHierarchySection[]
}

export type NurseryManageHierarchyNursery = NurseryManageIdName & {
  total_trees: number
  locations: NurseryManageHierarchyLocation[]
}

export type NurseryManageVarietySize = {
  variety_id: number
  variety_name: string
  pot_size: string | null
  total_quantity: number
  avg_height: number
  avg_thickness: number
  pot_unit_value: number
  pot_total_value: number
}

export type NurseryManageVarietyStat = {
  variety_id: number
  variety_name: string
  total_quantity: number
  sizes: NurseryManageVarietySize[]
}

export type NurseryCycleStatus = 'active' | 'completed' | 'cancelled'
export type NurseryPropagationType = 'seeds' | 'cuttings' | 'grafting' | 'layering'
export type NurseryCycleProcedureType = 'irrigation' | 'inspection' | 'humidity'

export type NurseryCycleProcedure = {
  id: number
  cycle_id: number
  procedure_type: NurseryCycleProcedureType
  procedure_date: string
  period: string | null
  start_time: string | null
  end_time: string | null
  humidity_percentage: number | null
  notes: string | null
  created_at: string | null
}

export type NurseryCycleTransferLine = {
  id: number
  transfer_id: number
  nursery_id: number | null
  location_id: number | null
  section_id: number | null
  basin_id: number
  line_number: number
  quantity: number
  pot_size: string | null
  tree_height: number | null
  created_at: string | null
  nursery: NurseryManageIdName | null
  location: NurseryManageIdName | null
  section: NurseryManageIdName | null
  basin: NurseryManageIdName | null
}

export type NurseryCycleTransfer = {
  id: number
  cycle_id: number
  successful_count: number
  germination_rate: number | null
  transferred_count: number
  remaining_count: number
  failed_count: number
  transfer_date: string | null
  created_at: string | null
  lines: NurseryCycleTransferLine[]
}

export type NurseryCycle = {
  id: number
  basin_id: number
  name: string
  tree_type_id: number
  variety_name: string | null
  propagation_type: NurseryPropagationType | null
  source: string | null
  count: number
  pot_size: string | null
  start_date: string | null
  end_date: string | null
  status: NurseryCycleStatus
  created_at: string | null
  transfers_count: number
  procedures_count: number
  total_transferred: number
  latest_germination_rate: number | null
  nursery: NurseryManageIdName | null
  location: NurseryManageIdName | null
  section: NurseryManageIdName | null
  basin: NurseryManageIdName | null
  transfers: NurseryCycleTransfer[]
  procedures: NurseryCycleProcedure[]
}

export type NurseryManageFilters = {
  nursery_id?: number | null
  location_id?: number | null
  section_id?: number | null
  basin_id?: number | null
  variety_id?: number | null
  pot_size?: string | null
  status?: NurseryCycleStatus | null
  search?: string | null
  sort?: 'created_at' | 'name' | 'start_date' | 'end_date' | 'count' | 'status'
  direction?: 'asc' | 'desc'
  per_page?: number
  page?: number
}

export type NurseryManageFilterOptions = {
  nurseries: NurseryManageIdName[]
  locations: NurseryManageLocationOption[]
  sections: NurseryManageSectionOption[]
  basins: NurseryManageBasinOption[]
  varieties: NurseryManageIdName[]
  pot_sizes: string[]
}

export type NurseryManagePayload = {
  stats: NurseryManageStats
  variety_stats: NurseryManageVarietyStat[]
  hierarchy: NurseryManageHierarchyNursery[]
  cycles: NurseryCycle[]
  pagination: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
  filters: Required<Pick<NurseryManageFilters, 'nursery_id' | 'location_id' | 'section_id' | 'basin_id' | 'variety_id' | 'pot_size' | 'status' | 'search'>>
  filter_options: NurseryManageFilterOptions
}

export type NurseryGeneralOperationType = 'irrigation' | 'fertilization' | 'cleaning' | 'pruning'
export type NurseryGeneralOperationContextType = 'nursery' | 'location' | 'section'

export type NurseryGeneralOperationFertilizer = NurseryManageIdName & {
  quantity: number
  unit: string | null
}

export type NurseryGeneralOperationOptions = {
  context: {
    type: NurseryGeneralOperationContextType
    id: number
    name: string
    basin_count: number
  }
  fertilizers: NurseryGeneralOperationFertilizer[]
}

export type NurseryGeneralOperationPayload = {
  context_type: NurseryGeneralOperationContextType
  context_id: number
  operation: NurseryGeneralOperationType
  date: string
  date_to?: string | null
  period?: 'morning' | 'evening' | null
  start_time?: string | null
  end_time?: string | null
  fertilizer_id?: number | null
  quantity?: number | null
  pruning_detail?: string | null
}

export type NurseryCyclePayload = {
  basin_id: number
  name: string
  tree_type_id: number
  propagation_type?: NurseryPropagationType | null
  source?: string | null
  count: number
  pot_size?: string | null
  start_date: string
  end_date?: string | null
  status?: NurseryCycleStatus
}

export type NurseryCycleTransferPayload = {
  cycle_id: number
  successful_count: number
  mark_remaining_failed?: boolean
  transfer_date?: string | null
  lines: Array<{
    nursery_id?: number | null
    location_id?: number | null
    section_id?: number | null
    basin_id: number
    line_number: number
    quantity: number
    pot_size?: string | null
    tree_height?: number | null
  }>
}

export type NurseryCycleProcedurePayload = {
  cycle_id: number
  procedure_type: NurseryCycleProcedureType
  procedure_date: string
  period?: string | null
  start_time?: string | null
  end_time?: string | null
  humidity_percentage?: number | null
  notes?: string | null
}

export type NurseryManageLocationRow = {
  nursery_id: number
  nursery_name: string
  location_id: number
  location_name: string
  section_id: number
  section_name: string
  basin_id: number
  basin_name: string
  quantity: number
}

export type NurseryBasinDashboardBasin = NurseryManageHierarchyBasin & {
  section_id: number
}

export type NurseryBasinDashboardStats = {
  total_trees: number
  line_count: number
  variety_count: number
  section_total: number
  location_total: number
  nursery_total: number
}

export type NurseryBasinOperationStats = {
  pruning: number
  moving: number
  hardening: number
  irrigation: number
  fertilization: number
  mortality: number
}

export type NurseryBasinActivityType =
  | 'sale'
  | 'purchase'
  | 'procedure'
  | 'irrigation'
  | 'fertilization'
  | 'mortality'
  | 'transfer'
  | 'cycle'
  | 'tree_add'
  | 'basin_transfer'

export type NurseryBasinActivity = {
  id: number
  type: NurseryBasinActivityType
  title: string
  detail: string
  date: string | null
  end_date: string | null
  created_at: string | null
}

export type NurseryBasinActivityGroup = {
  type: NurseryBasinActivityType
  title: string
  records: NurseryBasinActivity[]
}

export type NurseryBasinTreeOption = {
  tree_id: number
  basin_id: number
  quantity: number
  tree_name: string
}

export type NurseryBasinLineOption = {
  id: number
  line_number: number
  tree_type_id: number
  tree_name: string
  quantity: number
  pot_size: string | null
  height: number
  thickness: number
}

export type NurseryBasinInventoryOption = NurseryManageIdName & {
  quantity: number
  unit: string
}

export type NurseryBasinContactOption = NurseryManageIdName & {
  type: 'customer' | 'supplier' | 'both'
}

export type NurseryBasinOperationOptions = {
  lines: NurseryBasinLineOption[]
  varieties: NurseryManageIdName[]
  pot_sizes: NurseryBasinInventoryOption[]
  fertilizers: NurseryBasinInventoryOption[]
  contacts: NurseryBasinContactOption[]
  basins: NurseryManageIdName[]
}

export type NurseryBasinVarietySize = {
  variety_id: number
  variety_name: string
  pot_size: string | null
  total_quantity: number
  avg_height: number
  avg_thickness: number
}

export type NurseryBasinDashboardPayload = {
  basin: NurseryBasinDashboardBasin
  breadcrumbs: {
    nursery: NurseryManageIdName
    location: NurseryManageIdName
    section: NurseryManageIdName
    basin: NurseryManageIdName
  }
  stats: NurseryBasinDashboardStats
  operations_stats: NurseryBasinOperationStats
  variety_stats: Array<{
    variety_id: number
    variety_name: string
    total_quantity: number
    sizes: NurseryBasinVarietySize[]
  }>
  recent_activities: NurseryBasinActivity[]
  activity_groups: NurseryBasinActivityGroup[]
  tree_options: NurseryBasinTreeOption[]
  operation_options: NurseryBasinOperationOptions
}

export type NurseryBasinActivitiesPayload = {
  basin: NurseryBasinDashboardBasin
  breadcrumbs: NurseryBasinDashboardPayload['breadcrumbs']
  filters: Array<{ key: NurseryBasinActivityType | 'all'; label: string }>
  current_type: NurseryBasinActivityType | 'all'
  activities: NurseryBasinActivity[]
}
