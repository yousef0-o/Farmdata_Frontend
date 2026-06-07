export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }
export type KnownActionType =
  | 'log_irrigation'
  | 'log_fertilization'
  | 'log_mortality'
  | 'transfer_cycle'
  | 'start_cycle'
  | 'create_basin'
  | 'log_procedure'

export type ActionEventType = 'action_confirmed' | 'action_failed' | 'action_result'
export type IrrigationPeriod = 'morning' | 'evening'
export type ActionPayload = Record<string, JsonValue>

export interface ActionProposal {
  status: string
  action: KnownActionType | string
  target?: {
    basin_id?: number | null
    basin_name?: string | null
    cycle_id?: number | null
    cycle_name?: string | null
  }
  params?: Record<string, JsonValue>
  missing_fields?: string[]
  validation_warnings?: string[]
  human_summary?: string
  proposal_id?: string
}

export interface ActiveAction {
  [key: string]: JsonValue | undefined
  action: KnownActionType | string
  proposal_id?: string
  basin_id?: number | null
  basin_name?: string | null
  cycle_id?: number | null
  cycle_name?: string | null
  date?: string
  period?: IrrigationPeriod
  start_time?: string
  end_time?: string
  mortality_date?: string
  fertilization_date?: string
  fertilizer_id?: number
  quantity?: number
  line_number?: number
  successful_count?: number
  mark_remaining_failed?: boolean
  pot_size?: string | null
  tree_height?: number
  human_summary?: string
  missing_fields?: string[]
  validation_warnings?: string[]
  notes?: string
}

export interface NurseryChatMessage {
  id: number
  role: 'user' | 'model' | 'system'
  content: string
  attachments: Array<{
    name: string
    url: string
    mime_type: string
  }> | null
  created_at: string
}

export interface InferredContext {
  last_resolved_entities?: {
    basin?: { id?: number | null; name?: string | null }
    cycle?: { id?: number | null; name?: string | null; basin_id?: number | null; basin_name?: string | null }
    inventory_item?: { id?: number | null; name?: string | null; category_name?: string | null }
  }
  pending_intent?: string | null
  pending_slots?: string[]
  last_response_type?: string | null
  last_action_event?: {
    event_type?: ActionEventType
    action?: string | null
    proposal_id?: string | null
    message?: string | null
    payload?: ActionPayload
    created_at?: string
  }
  weak_context_hints?: Record<string, number>
}

export interface SendMessageResponse {
  success: boolean
  message: string
  inferred_context: InferredContext | null
  action_proposal: ActionProposal | null
  user_message: NurseryChatMessage
  model_response: NurseryChatMessage
}

export interface TelemetryEvent {
  id: string
  event: string
  tool?: string
  type?: string | null
  ok?: boolean
  count?: number | null
  loop?: number
}
