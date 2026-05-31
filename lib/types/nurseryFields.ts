export type NurseryFieldOptionType =
  | 'pot_size'
  | 'division_option'
  | 'basin_type'
  | 'basin_content'
  | 'irrigation_method'
  | 'valve_size'
  | 'sprinkler_size'
  | 'pipe_size'
  | 'hose_size'

export interface NurseryFieldOption {
  id: number
  type: NurseryFieldOptionType
  type_label: string
  name: string
  created_at: string | null
}

export type NurseryFieldOptionsDictionary = Record<NurseryFieldOptionType, NurseryFieldOption[]>

export interface CreateNurseryFieldOptionPayload {
  name: string
}
