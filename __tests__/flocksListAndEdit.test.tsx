import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import FlocksListPage from '../app/(app)/flocks/page'
import EditFlockMetadataPage from '../app/(app)/flocks/[id]/edit/page'
import React from 'react'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useParams: () => ({ id: '101' }),
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock useFlocks and useFlock hooks
let mockFlocksData: any = null
let mockFlockData: any = null
let mockFlocksLoading = false
let mockFlockLoading = false
const mockUpdateMutate = vi.fn()

vi.mock('@/lib/hooks/useFlock', () => ({
  useFlocks: (status?: string, page = 1) => ({
    data: mockFlocksData,
    isLoading: mockFlocksLoading,
    isError: false,
    refetch: vi.fn(),
  }),
  useFlock: (id: number) => ({
    data: mockFlockData,
    isLoading: mockFlockLoading,
    error: null,
  }),
  useUpdateFlock: (id: number) => ({
    mutate: mockUpdateMutate,
    isPending: false,
    error: null,
  }),
}))

describe('FlocksListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFlocksLoading = false
    mockFlocksData = {
      data: [
        {
          id: 101,
          flock_type: 'production',
          status: 'active',
          entry_birds: 1200,
          current_count: 1100,
          entry_date: '2026-05-10',
          barn: {
            barn_name: 'عنبر 1',
            section: { section_name: 'القسم الأول' },
          },
        },
      ],
      meta: {
        last_page: 2,
      },
    }
  })

  it('renders flocks list page layout and table successfully', () => {
    render(<FlocksListPage />)
    expect(screen.getByText('إدارة الأقطاع')).toBeInTheDocument()
    expect(screen.getByText('#101')).toBeInTheDocument()
    expect(screen.getByText('عنبر 1')).toBeInTheDocument()
    expect(screen.getByText('القسم الأول')).toBeInTheDocument()
  })

  it('triggers search filter when clicking search button', async () => {
    render(<FlocksListPage />)
    const select = screen.getByLabelText('حالة القطيع')
    fireEvent.change(select, { target: { value: 'completed' } })

    const searchButton = screen.getByRole('button', { name: /بحث/i })
    fireEvent.click(searchButton)
    // Query should refetch with the updated status state
  })
})

describe('EditFlockMetadataPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFlockLoading = false
    mockFlockData = {
      data: {
        id: 101,
        flock_type: 'production',
        status: 'active',
        entry_birds: 1200,
        entry_date: '2026-05-10',
        breed: 'لومان',
        supplier: 'المورد الرئيسي',
        chick_unit_cost: 2.5,
        barn: {
          barn_name: 'عنبر 1',
          section: { section_name: 'القسم الأول' },
        },
      },
    }
  })

  it('pre-fills metadata form and submits whitelisted edits correctly', async () => {
    render(<EditFlockMetadataPage />)

    // Verify header and read-only params
    expect(screen.getByText('تعديل بيانات القطيع #101')).toBeInTheDocument()
    expect(screen.getByText('1,200')).toBeInTheDocument()
    expect(screen.getByText('2026-05-10')).toBeInTheDocument()

    // Form inputs pre-filled
    const breedInput = screen.getByLabelText('السلالة (breed)') as HTMLInputElement
    expect(breedInput.value).toBe('لومان')

    const supplierInput = screen.getByLabelText('المورد (supplier)') as HTMLInputElement
    expect(supplierInput.value).toBe('المورد الرئيسي')

    const costInput = screen.getByLabelText('تكلفة الكتكوت للوحدة (chick_unit_cost)') as HTMLInputElement
    expect(costInput.value).toBe('2.5')

    // Modify values and submit
    fireEvent.change(breedInput, { target: { value: 'هبرد معدلة' } })
    fireEvent.change(costInput, { target: { value: '2.75' } })

    const submitButton = screen.getByRole('button', { name: /حفظ التغييرات/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockUpdateMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          breed: 'هبرد معدلة',
          supplier: 'المورد الرئيسي',
          chick_unit_cost: 2.75,
        }),
        expect.any(Object)
      )
    })
  })
})
