import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import DashboardPage from '../app/(app)/dashboard/page'
import React from 'react'

// Mock the hooks
const mockMorningRefetch = vi.fn()
let mockMorningData: any = null
let mockMorningIsLoading = false
let mockMorningIsError = false

const mockAnalyticsRefetch = vi.fn()
let mockAnalyticsData: any = null
let mockAnalyticsIsLoading = false
let mockAnalyticsIsError = false

vi.mock('@/lib/hooks/useMorningSummary', () => ({
  useMorningSummary: () => ({
    data: mockMorningData,
    isLoading: mockMorningIsLoading,
    isError: mockMorningIsError,
    refetch: mockMorningRefetch,
    isFetching: false,
  })
}))

vi.mock('@/lib/hooks/useFlockAnalytics', () => ({
  useFlockAnalytics: () => ({
    data: mockAnalyticsData,
    isLoading: mockAnalyticsIsLoading,
    isError: mockAnalyticsIsError,
    refetch: mockAnalyticsRefetch,
    isFetching: false,
  })
}))

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: { data: [] },
    isLoading: false,
    isError: false,
  }),
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
  }),
}))

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMorningData = null
    mockMorningIsLoading = false
    mockMorningIsError = false
    mockAnalyticsData = null
    mockAnalyticsIsLoading = false
    mockAnalyticsIsError = false
  })

  it('renders dashboard layout correctly', () => {
    render(<DashboardPage />)
    expect(screen.getByText('لوحة التحكم')).toBeInTheDocument()
  })

  it('renders error state when morning summary fails', () => {
    mockMorningIsError = true
    render(<DashboardPage />)
    expect(screen.getByText('تعذر تحميل مؤشرات الصباح')).toBeInTheDocument()
  })

  it('renders error state when analytics fails', () => {
    mockAnalyticsIsError = true
    render(<DashboardPage />)
    expect(screen.getByText('تعذر تحميل تحليلات الإنتاج')).toBeInTheDocument()
  })
})
