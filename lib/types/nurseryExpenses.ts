export interface NurseryExpenseYearTotal {
  year: string
  total: number
}

export interface NurseryExpenseAccount {
  id: number
  parent_id: number | null
  name: string
  is_pinned: boolean
  created_at?: string | null
}

export interface NurseryExpenseAccountNode extends NurseryExpenseAccount {
  level: number
  children: NurseryExpenseAccountNode[]
  direct_amount: number
  total_amount: number
  yearly_totals: NurseryExpenseYearTotal[]
}

export interface NurseryPinnedExpenseAccount extends NurseryExpenseAccount {
  total_amount: number
}

export interface NurseryAssetCategory {
  id: number
  name: string
}

export interface NurseryAsset {
  id: number
  name: string
  code: string | null
  document_number: string | null
  purchase_date: string | null
  purchase_value: number
  asset_type: 'fixed' | 'current'
  asset_account_number: string | null
  category_id: number | null
  category_name: string | null
  expense_account_id: number | null
  expense_account_name: string | null
  expense_account_number: string | null
  account_name: string | null
  created_at?: string | null
}

export interface NurseryAssetGroup {
  category_name: string
  total: number
  items_count: number
  items: NurseryAsset[]
}

export interface NurseryExpenseSummary {
  accounts_count: number
  assets_count: number
  assets_total: number
  expenses_total: number
  pinned_count: number
}

export interface NurseryExpenseBootstrap {
  accounts: NurseryExpenseAccountNode[]
  flat_accounts: NurseryExpenseAccount[]
  pinned_accounts: NurseryPinnedExpenseAccount[]
  assets: NurseryAsset[]
  asset_categories: NurseryAssetCategory[]
  grouped_assets: NurseryAssetGroup[]
  summary: NurseryExpenseSummary
}

export interface NurseryExpenseAccountPayload {
  name: string
  parent_id?: number | null
}

export interface NurseryExpenseTransactionPayload {
  operation_number?: string | null
  entry_number?: string | null
  expense_date: string
  description?: string | null
  debit_amount: number
  credit_amount?: number | null
}

export interface NurseryAssetPayload {
  name: string
  code?: string | null
  document_number?: string | null
  purchase_date: string
  purchase_value: number
  asset_type: 'fixed' | 'current'
  asset_account_number?: string | null
  category_id?: number | null
  expense_account_id?: number | null
  expense_account_name?: string | null
  expense_account_number?: string | null
  account_name?: string | null
}

export interface NurseryExpenseTransactionDetail {
  id: number
  transaction_date: string | null
  operation_number: string | null
  entry_number: string | null
  description: string | null
  debit_amount: number
  credit_amount: number
  balance: number
  balance_type: string | null
  file_name: string | null
  source: string
}

export interface NurseryOldExpenseDetail {
  id: number
  expense_date: string | null
  description: string | null
  amount: number
  file_path: string | null
  source: string
}

export interface NurseryMonthlyExpenseSummary {
  year: string
  month: string
  month_name: string
  total: number
}

export interface NurseryExpenseDetails {
  transactions: NurseryExpenseTransactionDetail[]
  old_expenses: NurseryOldExpenseDetail[]
  monthly_summary: NurseryMonthlyExpenseSummary[]
}
