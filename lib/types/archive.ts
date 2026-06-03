export interface ArchiveNode {
  id: number
  parent_id: number | null
  type: 'institution' | 'year' | 'folder'
  name: string
  slug: string
  description?: string
  created_by: number
  created_at?: string
  updated_at?: string
  children_count?: number
  items_count?: number
  children?: ArchiveNode[]
  meta?: Record<string, any>
}

export interface SchemaColumn {
  key: string
  label: string
  label_ar?: string
  label_en?: string
  type: 'text' | 'number' | 'date' | 'select' | 'boolean'
  options?: string[]
  required?: boolean
  searchable?: boolean
  is_group_by?: boolean
  is_sum?: boolean
  is_shown?: boolean
  is_attachment_key?: boolean
  validation?: string
  validation_pattern?: string
  validation_min?: number | string
  validation_max?: number | string
  formula?: string
}

export interface ArchiveFolderSchema {
  id: number
  folder_id: number
  columns: SchemaColumn[]
  version: number
  created_by: number
  created_at?: string
  updated_at?: string
}

export interface ArchiveItem {
  id: number
  folder_id: number
  data: Record<string, any>
  created_by: number
  created_at?: string
  updated_at?: string
  attachments?: ArchiveAttachment[]
  created_by_user?: {
    id: number
    name: string
    email: string
  }
}

export interface ArchiveAttachment {
  id: number
  attachable_type: string
  attachable_id: number
  file_path: string
  original_name: string
  mime_type: string
  file_size: number
  created_by: number
  created_at?: string
}

export interface ArchiveStatsConfig {
  id: number
  folder_id: number
  name: string
  chart_type: 'card' | 'bar' | 'pie' | 'line' | 'table'
  aggregation: 'count' | 'distinct_count' | 'sum_total' | 'sum_group' | 'avg'
  column_key?: string
  group_by_key?: string
  filters?: Record<string, any>
  sort_order?: number
  threshold_value?: number
  threshold_condition?: 'gt' | 'lt' | 'eq'
  threshold_alert_type?: 'positive' | 'negative'
  widget_color?: string
  created_at?: string
}

export interface AccountingAccount {
  id: number
  parent_id: number | null
  code: string
  name: string
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
  is_leaf: boolean
  is_active?: boolean
  parent?: AccountingAccount
}

export interface RecordSheet {
  id: number
  folder_id?: number
  account_id: number
  title: string
  period_start: string
  period_end: string
  status: 'open' | 'closed'
  created_by: number
  created_at?: string
  account?: AccountingAccount
  folder?: ArchiveNode
  transactions?: RecordTransaction[]
  created_by_user?: {
    name: string
  }
  total_debit?: number | string
  total_credit?: number | string
}

export interface RecordTransaction {
  id: number
  sheet_id: number
  account_id: number
  description?: string
  debit: number
  credit: number
  transaction_date: string
  reference?: string
  created_by: number
  created_at?: string
  account?: AccountingAccount
}
