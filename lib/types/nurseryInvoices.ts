export type NurseryInvoiceType = 'sale' | 'purchase'
export type NurseryInvoiceStatus = 'paid' | 'unpaid' | 'draft'

export type NurseryInvoice = {
  id: number
  invoice_number: string
  type: NurseryInvoiceType
  client_name: string | null
  invoice_date: string | null
  status: NurseryInvoiceStatus
  subtotal: string | number
  vat_amount: string | number
  total_amount: string | number
  created_by: number | null
  created_at: string | null
}

export type NurseryInvoiceItem = {
  id: number
  invoice_id: number
  item_name: string | null
  quantity: string | number | null
  unit_price: string | number | null
  total_price: string | number | null
  tree_id: number | null
  basin_id: number | null
}

export type NurseryInvoiceDetails = NurseryInvoice & {
  items: NurseryInvoiceItem[]
}

export type NurseryInvoiceSettings = {
  company_name: string
  company_address: string
  tax_number: string
  footer_text: string
  logo_path: string
  primary_color: string
  font_family: string
  header_line: boolean | number
  footer_line: boolean | number
  table_striped: boolean | number
  table_border_width: number
  font_size: number
  frame_border_width: number
}

export type NurseryInvoiceContact = {
  id: number
  name: string
  type: 'customer' | 'supplier' | 'both'
}

export type NurseryInvoiceTreeOption = {
  tree_id: number
  basin_id: number
  quantity: number
  pot_size: string | null
  line_number: number
  tree_name: string
  basin_name: string
}

export type NurseryInvoiceBootstrap = {
  invoices: NurseryInvoice[]
  settings: NurseryInvoiceSettings
  contacts: NurseryInvoiceContact[]
  tree_options: NurseryInvoiceTreeOption[]
  summary: {
    count: number
    subtotal: number
    vat: number
    total: number
  }
  next_invoice_number: string
}

export type NurseryInvoicePayload = {
  invoice_number: string
  type: NurseryInvoiceType
  contact_id?: number | null
  client_name?: string | null
  invoice_date: string
  status: NurseryInvoiceStatus
  items: Array<{
    tree_id: number
    name?: string | null
    qty: number
    price: number
  }>
}
