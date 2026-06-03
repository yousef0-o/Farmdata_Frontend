import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AccountingPage from '../app/(app)/archive/accounting/page'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  usePathname: () => '/archive/accounting',
}))

// Mock variables
let mockAccountsData = [] as any[]
let mockSheetsData = [] as any[]
let mockSheetDetailData: any = null
let mockInstitutionsRes = [] as any[]
let mockCompaniesRes = [] as any[]
let mockProjectsRes = [] as any[]

let mockCreateAccountMutate = vi.fn()
let mockDeleteAccountMutate = vi.fn()
let mockToggleAccountMutate = vi.fn()
let mockCreateSheetMutate = vi.fn()
let mockCloseSheetMutate = vi.fn()
let mockCreateTxMutate = vi.fn()
let mockImportTxMutate = vi.fn()
let mockCreateNodeMutate = vi.fn()
let mockDeleteNodeMutate = vi.fn()
let mockDeleteSheetMutate = vi.fn()

vi.mock('@/lib/hooks/useArchive', () => ({
  useAccountingAccounts: () => ({
    data: { data: mockAccountsData },
    isLoading: false,
  }),
  useCreateAccountingAccount: () => ({
    mutateAsync: mockCreateAccountMutate,
    isPending: false,
  }),
  useDeleteAccountingAccount: () => ({
    mutateAsync: mockDeleteAccountMutate,
    isPending: false,
  }),
  useToggleAccountingAccountStatus: () => ({
    mutateAsync: mockToggleAccountMutate,
    isPending: false,
  }),
  useRecordSheets: () => ({
    data: { data: mockSheetsData },
    isLoading: false,
  }),
  useCreateRecordSheet: () => ({
    mutateAsync: mockCreateSheetMutate,
    isPending: false,
  }),
  useRecordSheet: (id: number) => ({
    data: { data: mockSheetDetailData },
    isLoading: false,
  }),
  useCloseRecordSheet: () => ({
    mutateAsync: mockCloseSheetMutate,
    isPending: false,
  }),
  useCreateTransaction: () => ({
    mutateAsync: mockCreateTxMutate,
    isPending: false,
  }),
  useImportRecordTransactions: () => ({
    mutateAsync: mockImportTxMutate,
    isPending: false,
  }),
  useAnnualAccountingStats: () => ({
    data: { data: [] },
    isLoading: false,
  }),
  useImportChartOfAccounts: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useArchiveNodes: () => ({
    data: { data: mockInstitutionsRes },
    isLoading: false,
  }),
  useNodeChildren: (id: number) => {
    if (id === 1) {
      return {
        data: {
          data: [
            { id: 2, name: 'السنة المالية 2026', type: 'year', parent_id: 1, meta: { year: 2026 } }
          ]
        },
        isLoading: false
      }
    }
    if (id === 2) {
      return {
        data: {
          data: [
            {
              id: 3,
              name: 'قسم المشتريات والخدمات',
              type: 'folder',
              parent_id: 2,
              meta: { link_type: 'company', company_id: 5, distribute_by_production: true }
            }
          ]
        },
        isLoading: false
      }
    }
    return { data: { data: [] }, isLoading: false }
  },
  useCreateNode: () => ({
    mutateAsync: mockCreateNodeMutate,
    isPending: false,
  }),
  useUpdateNode: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useDeleteNode: () => ({
    mutateAsync: mockDeleteNodeMutate,
    isPending: false,
  }),
  useDeleteRecordSheet: () => ({
    mutateAsync: mockDeleteSheetMutate,
    isPending: false,
  }),
  useCompanies: () => ({
    data: { data: mockCompaniesRes },
    isLoading: false,
  }),
  useProjects: () => ({
    data: { data: mockProjectsRes },
    isLoading: false,
  }),
}))

describe('Accounting Ledger Page and Sheets Modal Tests', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  beforeEach(() => {
    vi.clearAllMocks()

    mockAccountsData = [
      { id: 10, code: '1000', name: 'الأصول المتداولة', type: 'asset', is_active: true },
      { id: 11, code: '1001', name: 'الصندوق', type: 'asset', parent_id: 10, is_active: true },
      { id: 20, code: '2000', name: 'المصروفات العمومية', type: 'expense', is_active: true },
    ]

    mockInstitutionsRes = [
      { id: 1, name: 'الأرشيف المالي لمزارع الدواجن', type: 'institution' }
    ]

    mockSheetsData = [
      {
        id: 101,
        title: 'سجل فواتير الأعلاف والذرة',
        account_id: 11,
        account: { id: 11, code: '1001', name: 'الصندوق', type: 'asset' },
        folder_id: 3,
        folder: {
          id: 3,
          name: 'قسم المشتريات والخدمات',
          meta: { link_type: 'company', company_id: 5, distribute_by_production: true }
        },
        period_start: '2026-01-01',
        period_end: '2026-12-31',
        status: 'open',
        transactions_count: 3,
      }
    ]

    mockSheetDetailData = {
      id: 101,
      title: 'سجل فواتير الأعلاف والذرة',
      account_id: 11,
      account: { id: 11, code: '1001', name: 'الصندوق', type: 'asset' },
      folder_id: 3,
      folder: {
        id: 3,
        name: 'قسم المشتريات والخدمات',
        meta: { link_type: 'company', company_id: 5, distribute_by_production: true }
      },
      period_start: '2026-01-01',
      period_end: '2026-12-31',
      status: 'open',
      transactions: [
        {
          id: 501,
          transaction_date: '2026-01-05',
          account_id: 20,
          account: { id: 20, code: '2000', name: 'المصروفات العمومية' },
          description: 'شراء ديزل للمزارع',
          reference: 'INV-001',
          debit: '500.00',
          credit: '0.00'
        },
        {
          id: 502,
          transaction_date: '2026-01-10',
          account_id: 20,
          account: { id: 20, code: '2000', name: 'المصروفات العمومية' },
          description: 'صيانة المولد الكهربائي',
          reference: 'INV-002',
          debit: '0.00',
          credit: '150.00'
        },
        {
          id: 503,
          transaction_date: '2026-01-15',
          account_id: 20,
          account: { id: 20, code: '2000', name: 'المصروفات العمومية' },
          description: 'شراء أدوات نظافة وتعقيم',
          reference: 'INV-003',
          debit: '100.00',
          credit: '0.00'
        }
      ]
    }

    mockCompaniesRes = [
      { id: 5, name: 'الشركة الشرقية للدواجن' }
    ]
    mockProjectsRes = []
  })

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <AccountingPage />
      </QueryClientProvider>
    )
  }

  it('renders pages tabs and layout correctly', () => {
    renderComponent()
    expect(screen.getByText('الدفاتر اليومية والحسابات المحاسبية')).toBeInTheDocument()
    expect(screen.getByText('الجدول السنوي')).toBeInTheDocument()
    expect(screen.getByText('دليل الحسابات')).toBeInTheDocument()
    expect(screen.getByText('الدفاتر والسجلات')).toBeInTheDocument()
  })

  it('switches to sheets tab and displays list with transactions count', async () => {
    renderComponent()
    
    // Switch to sheets tab
    const sheetsTab = screen.getByRole('button', { name: 'الدفاتر والسجلات' })
    fireEvent.click(sheetsTab)

    expect(screen.getByText('سجل فواتير الأعلاف والذرة')).toBeInTheDocument()
    
    // Verify "الأوراق" table header is present
    expect(screen.getByText('الأوراق')).toBeInTheDocument()
    
    // Verify transaction count is rendered in the cell
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('opens sheet detail modal, calculates running balance, and filters transactions', async () => {
    renderComponent()
    
    // Switch to sheets tab
    fireEvent.click(screen.getByRole('button', { name: 'الدفاتر والسجلات' }))
    
    // Click View ("عرض") button
    const viewBtn = screen.getByTitle('عرض')
    fireEvent.click(viewBtn)

    // Verify modal is displayed with title and details
    expect(screen.getAllByText('سجل فواتير الأعلاف والذرة')[0]).toBeInTheDocument()
    expect(screen.getAllByText(/الصندوق/)[0]).toBeInTheDocument()
    
    // Verify transaction entries exist
    expect(screen.getByText('شراء ديزل للمزارع')).toBeInTheDocument()
    expect(screen.getByText('صيانة المولد الكهربائي')).toBeInTheDocument()
    
    // Verify running balances:
    // First Tx: debit 500, credit 0. Normal debit (asset) => 500
    // Second Tx: debit 0, credit 150 => 350
    // Third Tx: debit 100, credit 0 => 450
    expect(screen.getAllByText('٥٠٠٫٠٠')[0]).toBeInTheDocument()
    expect(screen.getAllByText('٣٥٠٫٠٠')[0]).toBeInTheDocument()
    expect(screen.getAllByText('٤٥٠٫٠٠')[0]).toBeInTheDocument()

    // Test frontend filtering
    const searchInput = screen.getByPlaceholderText('بحث في البيان أو المرجع...')
    fireEvent.change(searchInput, { target: { value: 'صيانة' } })

    expect(screen.queryByText('شراء ديزل للمزارع')).not.toBeInTheDocument()
    expect(screen.getByText('صيانة المولد الكهربائي')).toBeInTheDocument()
  })

  it('allows posting a new manual transaction with whitelisted fields only', async () => {
    renderComponent()
    
    // Open sheets tab and modal
    fireEvent.click(screen.getByRole('button', { name: 'الدفاتر والسجلات' }))
    fireEvent.click(screen.getByTitle('عرض'))

    // Go to "إدخال قيد يدوي" tab
    const manualTab = screen.getByRole('button', { name: 'إدخال قيد يدوي' })
    fireEvent.click(manualTab)

    // Fill form
    const descInput = screen.getByPlaceholderText('تفاصيل القيد...')
    fireEvent.change(descInput, { target: { value: 'دفعة مصروفات شحن أعلاف' } })

    const counterSelect = screen.getByRole('combobox')
    fireEvent.change(counterSelect, { target: { value: '20' } }) // المصروفات العمومية

    const debitInputs = screen.getAllByPlaceholderText('0.00')
    fireEvent.change(debitInputs[0], { target: { value: '250.50' } }) // Debit

    const refInput = screen.getByPlaceholderText('رقم الفاتورة أو السند...')
    fireEvent.change(refInput, { target: { value: 'REF-999' } })

    const submitBtn = screen.getByRole('button', { name: 'تسجيل القيد المالي' })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockCreateTxMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          account_id: 20,
          description: 'دفعة مصروفات شحن أعلاف',
          debit: 250.5,
          credit: 0,
          reference: 'REF-999',
        })
      )
    })
  })

  it('allows importing transactions from Excel', async () => {
    renderComponent()
    
    // Open sheets tab and modal
    fireEvent.click(screen.getByRole('button', { name: 'الدفاتر والسجلات' }))
    fireEvent.click(screen.getByTitle('عرض'))

    // Go to "استيراد إكسيل" tab
    const importTab = screen.getByRole('button', { name: 'استيراد إكسيل' })
    fireEvent.click(importTab)

    // Verify upload text
    expect(screen.getByText('اسحب ملف Excel هنا أو اضغط للاختيار')).toBeInTheDocument()

    // Trigger file input change
    const file = new File([''], 'transactions.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const fileInput = screen.getByLabelText(/اسحب ملف Excel هنا أو اضغط للاختيار/i)
    
    // Mock the file upload
    Object.defineProperty(fileInput, 'files', {
      value: [file]
    })
    fireEvent.change(fileInput)

    // Click submit
    const submitBtn = screen.getByRole('button', { name: 'بدء استيراد القيود' })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockImportTxMutate).toHaveBeenCalled()
    })
  })
})
