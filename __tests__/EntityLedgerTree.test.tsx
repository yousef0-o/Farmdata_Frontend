import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import EntityLedgerTree from '../components/archive/EntityLedgerTree'
import { organizationApi } from '@/lib/api/organization'

// Mock useArchive hooks
let mockAccountsData = [] as any[]
let mockSheetsData = [] as any[]
let mockCompanyStatsRes: any = { annual_movement: [] }

vi.mock('@/lib/hooks/useArchive', () => ({
  useAccountingAccounts: () => ({
    data: { data: mockAccountsData },
    isLoading: false,
  }),
  useRecordSheets: () => ({
    data: { data: mockSheetsData },
    isLoading: false,
  }),
}))

vi.mock('@/lib/api/organization', () => ({
  organizationApi: {
    getCompanyStatistics: vi.fn(),
  },
}))

describe('EntityLedgerTree Component Tests', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  beforeEach(() => {
    queryClient.clear()
    vi.clearAllMocks()

    vi.mocked(organizationApi.getCompanyStatistics).mockImplementation(() =>
      Promise.resolve(mockCompanyStatsRes)
    )

    // 1000 - Assets
    //   1010 - Cash (Leaf)
    //   1020 - Accounts Receivable (Leaf)
    // 2000 - Liabilities
    //   2010 - Accounts Payable (Leaf)
    mockAccountsData = [
      { id: 1, code: '1000', name: 'الأصول', type: 'asset', parent_id: null, is_leaf: false },
      { id: 2, code: '1010', name: 'الصندوق', type: 'asset', parent_id: 1, is_leaf: true },
      { id: 3, code: '1020', name: 'العملاء', type: 'asset', parent_id: 1, is_leaf: true },
      { id: 4, code: '2000', name: 'الالتزامات', type: 'liability', parent_id: null, is_leaf: false },
      { id: 5, code: '2010', name: 'الموردين', type: 'liability', parent_id: 4, is_leaf: true },
    ]

    mockSheetsData = [
      // Sheet linked to الصندوق (Asset: Debit normal)
      {
        id: 101,
        title: 'دفتر الصندوق 2026',
        account_id: 2,
        total_debit: 1000,
        total_credit: 400,
        period_start: '2026-01-01',
        period_end: '2026-12-31',
        folder: {
          id: 10,
          meta: { link_type: 'project', project_id: 201 }
        }
      },
      // Sheet linked to العملاء (Asset: Debit normal)
      {
        id: 102,
        title: 'دفتر العملاء 2026',
        account_id: 3,
        total_debit: 500,
        total_credit: 200,
        period_start: '2026-01-01',
        period_end: '2026-12-31',
        folder: {
          id: 11,
          meta: { link_type: 'project', project_id: 201 }
        }
      },
      // Sheet linked to الموردين (Liability: Credit normal, distributed from Company)
      {
        id: 103,
        title: 'دفتر الموردين الرئيسي',
        account_id: 5,
        total_debit: 100,
        total_credit: 600,
        period_start: '2026-01-01',
        period_end: '2026-12-31',
        folder: {
          id: 12,
          meta: { link_type: 'company', company_id: 50, distribute_by_production: true }
        }
      }
    ]

    mockCompanyStatsRes = {
      annual_movement: [
        { year: 2026, eggs_produced: 100000 }
      ]
    }
  })

  const renderTree = (props: any) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <EntityLedgerTree {...props} />
      </QueryClientProvider>
    )
  }

  it('calculates recursive balance rollup and renders tree correctly for project with distribution ratio', async () => {
    // Project statistics has 40,000 eggs (out of company 100,000 eggs -> share ratio 40% / 0.4)
    const annualMovement = [
      { year: 2026, eggs_produced: 40000 }
    ]

    renderTree({
      entityType: 'project',
      entityId: 201,
      companyId: 50,
      annualMovement
    })

    // Wait for the loader to disappear and elements to render
    await waitFor(() => {
      expect(screen.getByText('الأصول')).toBeInTheDocument()
    })

    expect(organizationApi.getCompanyStatistics).toHaveBeenCalledWith(50)

    expect(screen.getByText('الصندوق')).toBeInTheDocument()
    expect(screen.getByText('العملاء')).toBeInTheDocument()
    expect(screen.getByText('الالتزامات')).toBeInTheDocument()
    expect(screen.getByText('الموردين')).toBeInTheDocument()

    // Verify Balances (Ar-SA format):
    // 1010 الصندوق (Direct Project): Debit 1,000, Credit 400. Normal Asset (Debit-Credit) => 600.
    // 1020 العملاء (Direct Project): Debit 500, Credit 200. Normal Asset (Debit-Credit) => 300.
    // 1000 الأصول (Parent): Debit 1500, Credit 600 => Net 900.
    expect(screen.getByText('١٬٥٠٠٫٠٠')).toBeInTheDocument() // Assets Debit
    expect(screen.getAllByText('٦٠٠٫٠٠')[0]).toBeInTheDocument()  // Assets Credit
    expect(screen.getByText('٩٠٠٫٠٠ ر.س')).toBeInTheDocument() // Assets Net Balance

    // Wait for async company stats logic to apply the 40% scaling ratio to distributed company sheets:
    // 2010 الموردين (Distributed company): Debit 100, Credit 600. With 40% ratio -> Debit 40, Credit 240.
    // Normal Liability (Credit-Debit) => 240-40 = 200.
    await waitFor(() => {
      expect(screen.getAllByText('٤٠٫٠٠')[0]).toBeInTheDocument() // Liability Debit
    })
    expect(screen.getAllByText('٢٤٠٫٠٠')[0]).toBeInTheDocument() // Liability Credit
    expect(screen.getAllByText('٢٠٠٫٠٠ ر.س')[0]).toBeInTheDocument() // Liability Net Balance
  })

  it('filters account tree nodes by search query', async () => {
    renderTree({
      entityType: 'project',
      entityId: 201,
      companyId: 50,
      annualMovement: [{ year: 2026, eggs_produced: 40000 }]
    })

    await waitFor(() => {
      expect(screen.getByText('الموردين')).toBeInTheDocument()
    })

    // Search for "الموردين"
    const searchInput = screen.getByPlaceholderText('بحث في شجرة الحسابات...')
    fireEvent.change(searchInput, { target: { value: 'الموردين' } })

    // "الموردين" and its parent "الالتزامات" should remain visible
    expect(screen.getByText('الموردين')).toBeInTheDocument()
    expect(screen.getByText('الالتزامات')).toBeInTheDocument()

    // "الصندوق" should be filtered out
    expect(screen.queryByText('الصندوق')).not.toBeInTheDocument()
  })

  it('opens account details dialog on click and displays yearly stats with egg costs', async () => {
    renderTree({
      entityType: 'project',
      entityId: 201,
      companyId: 50,
      annualMovement: [{ year: 2026, eggs_produced: 30000 }]
    })

    await waitFor(() => {
      expect(screen.getByText('الصندوق')).toBeInTheDocument()
    })

    // Click "تفاصيل" for الصندوق
    const detailsBtns = screen.getAllByRole('button', { name: 'تفاصيل' })
    fireEvent.click(detailsBtns[1]) // Second button belongs to الصندوق

    // Modal headers/titles should be visible
    await waitFor(() => {
      expect(screen.getByText('الحركة المالية السنوية وتفاصيل الإنتاج')).toBeInTheDocument()
    })
    
    // Find dialog content and assert inside it
    const modal = screen.getByRole('dialog')
    expect(within(modal).getByText(/الحساب: 1010 - الصندوق/)).toBeInTheDocument()

    // 1010 الصندوق (Direct Project): Debit 1000, Credit 400. Net = 600.
    // Eggs = 30000.
    // Plates = 30000 / 30 = 1000. Plate Cost = 600 / 1000 = 0.60
    // Cartons = 30000 / 360 = 83.33. Carton Cost = 600 / 83.33 = 7.20
    // Egg Cost = 600 / 30000 = 0.02
    expect(within(modal).getByText('٦٠٠٫٠٠')).toBeInTheDocument()
    expect(within(modal).getAllByText('١٬٠٠٠٫٠٠')[0]).toBeInTheDocument()
    expect(within(modal).getByText('٠٫٦٠ ر.س')).toBeInTheDocument()
    expect(within(modal).getAllByText('٨٣٫٣٣')[0]).toBeInTheDocument()
    expect(within(modal).getByText('٧٫٢٠ ر.س')).toBeInTheDocument()
    expect(within(modal).getAllByText('٣٠٬٠٠٠٫٠٠')[0]).toBeInTheDocument()
    expect(within(modal).getByText('٠٫٠٢ ر.س')).toBeInTheDocument()
  })
})
