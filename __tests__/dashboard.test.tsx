import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import DashboardPage from '../app/(app)/dashboard/page'
import React from 'react'

// Mock useDashboardStats hook
const mockRefetch = vi.fn()
let mockStatsData: any = null
let mockIsLoading = false
let mockIsError = false

vi.mock('@/lib/hooks/useDashboard', () => ({
  useDashboardStats: () => ({
    data: mockStatsData,
    isLoading: mockIsLoading,
    isError: mockIsError,
    refetch: mockRefetch,
  })
}))

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStatsData = null
    mockIsLoading = false
    mockIsError = false
  })

  it('renders loading skeleton cards when loading', () => {
    mockIsLoading = true
    render(<DashboardPage />)
    expect(screen.getByText('لوحة التحكم')).toBeInTheDocument()
    // It should not display the KPI card subtitles since it is loading
    expect(screen.queryByText('شركة مسجلة')).not.toBeInTheDocument()
    expect(screen.queryByText('قطيع نشط حالياً')).not.toBeInTheDocument()
  })

  it('renders error state with retry button when API fails', () => {
    mockIsError = true
    render(<DashboardPage />)
    expect(screen.getByText('تعذر تحميل البيانات')).toBeInTheDocument()
    const retryButton = screen.getByRole('button', { name: /إعادة المحاولة/i })
    expect(retryButton).toBeInTheDocument()
    
    fireEvent.click(retryButton)
    expect(mockRefetch).toHaveBeenCalled()
  })

  it('renders KPI stats and active flocks table successfully', () => {
    mockStatsData = {
      totalCompanies: 5,
      activeFlockCount: 2,
      flocks: [
        {
          id: 101,
          flock_type: 'production',
          status: 'active',
          entry_birds: 1200,
          current_count: 1150,
          entry_date: '2026-05-10',
          barn: { barn_name: 'عنبر الإنتاج 1' }
        },
        {
          id: 102,
          flock_type: 'breeding',
          status: 'active',
          entry_birds: 800,
          current_count: 780,
          entry_date: '2026-05-15',
          barn: { barn_name: 'عنبر التربية 2' }
        }
      ]
    }

    render(<DashboardPage />)

    // Verify page header
    expect(screen.getByText('لوحة التحكم')).toBeInTheDocument()

    // Verify KPI StatCard values
    expect(screen.getByText('5')).toBeInTheDocument() // companies
    expect(screen.getByText('2')).toBeInTheDocument() // active flocks

    // Verify quick links
    expect(screen.getByText('إضافة شركة جديدة')).toBeInTheDocument()
    expect(screen.getByText('إدارة المستودعات')).toBeInTheDocument()
    expect(screen.getByText('حركة المخزون')).toBeInTheDocument()

    // Verify table records
    expect(screen.getByText('عنبر الإنتاج 1')).toBeInTheDocument()
    expect(screen.getByText('عنبر التربية 2')).toBeInTheDocument()
  })
})
