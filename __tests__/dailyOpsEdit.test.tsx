import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ProductionEntryEditPage from '../app/(app)/flocks/[id]/daily/[entryId]/edit/page'
import React from 'react'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useParams: () => ({ id: '12', entryId: '34' }),
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock useFlock hook
let mockFlockData: any = null
let mockFlockLoading = false
vi.mock('@/lib/hooks/useFlock', () => ({
  useFlock: () => ({
    data: mockFlockData,
    isLoading: mockFlockLoading,
  }),
}))

// Mock useDailyOps hooks
let mockEntryData: any = null
let mockEntryLoading = false
let mockEntryError = false
const mockMutate = vi.fn()

vi.mock('@/lib/hooks/useDailyOps', () => ({
  useProductionEntry: () => ({
    data: mockEntryData,
    isLoading: mockEntryLoading,
    error: mockEntryError ? new Error('Not found') : null,
  }),
  useUpdateProductionEntry: () => ({
    mutate: mockMutate,
    isPending: false,
    error: null,
  }),
}))

describe('ProductionEntryEditPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFlockData = {
      data: {
        id: 12,
        flock_type: 'production',
        status: 'active',
        entry_birds: 1000,
        current_count: 1000,
        barn: {
          barn_name: 'عنبر 1',
          section: {
            section_name: 'قسم الإنتاج',
          },
        },
      },
    }
    mockEntryData = {
      data: {
        id: 34,
        flock_id: 12,
        record_date: '2026-05-20',
        bird_count: 980,
        age_days: 10,
        mortality: 2,
        egg_size_jumbo: 100,
        egg_size_xlarge: 200,
        egg_size_large: 300,
        egg_size_medium: 150,
        egg_size_small: 50,
        egg_size_reject: 10,
        feed_quantity_kg: 120.5,
        ai_observation: 'ملاحظة ممتازة',
      },
    }
    mockFlockLoading = false
    mockEntryLoading = false
    mockEntryError = false
  })

  it('renders loading spinner when loading flock or entry', () => {
    mockFlockLoading = true
    render(<ProductionEntryEditPage />)
    expect(screen.queryByText('تعديل تسجيل يومي')).not.toBeInTheDocument()
  })

  it('renders 404 state when entry is not found', () => {
    mockEntryError = true
    render(<ProductionEntryEditPage />)
    expect(screen.getByText('التسجيل غير موجود')).toBeInTheDocument()
    expect(screen.getByText('العودة للفوج')).toBeInTheDocument()
  })

  it('pre-fills form inputs and handles form submission successfully', async () => {
    render(<ProductionEntryEditPage />)

    // Verify breadcrumb and header
    expect(screen.getAllByText('تعديل تسجيل يومي')[0]).toBeInTheDocument()

    // Verify read-only stats
    expect(screen.getByText('2026-05-20')).toBeInTheDocument()
    expect(screen.getByText('10 يوم')).toBeInTheDocument()
    expect(screen.getByText('980')).toBeInTheDocument()

    // Verify prefilled form values
    const mortalityInput = screen.getByLabelText('عدد النفوق اليومي') as HTMLInputElement
    expect(mortalityInput.value).toBe('2')

    const feedInput = screen.getByLabelText('كمية العلف المستهلكة (كجم)') as HTMLInputElement
    expect(feedInput.value).toBe('120.5')

    const jumboInput = screen.getByLabelText('جامبو (Jumbo)') as HTMLInputElement
    expect(jumboInput.value).toBe('100')

    const commentInput = screen.getByLabelText('ملاحظة أو تعليق') as HTMLInputElement
    expect(commentInput.value).toBe('ملاحظة ممتازة')

    // Modify mortality and submit
    fireEvent.change(mortalityInput, { target: { value: '5' } })
    
    const submitButton = screen.getByRole('button', { name: /حفظ التغييرات/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          entryId: 34,
          data: expect.objectContaining({
            mortality: 5,
            feed_quantity_kg: 120.5,
            egg_size_jumbo: 100,
          }),
        }),
        expect.any(Object)
      )
    })
  })
})
