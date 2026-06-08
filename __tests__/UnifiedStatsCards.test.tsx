import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import UnifiedStatsCards from '../components/statistics/UnifiedStatsCards'
import React from 'react'
import { EntityStatistics } from '@/lib/types'

const mockStats: EntityStatistics = {
  level: 'projects',
  section_type: null,
  breeding_stats: {
    entry_birds: 10000,
    exit_birds: 9500,
    mortality_breeding: 500,
    mortality_value: 2000,
    chick_cost: 5000,
    feed_cost: 8000,
    vet_cost: 1000,
    other_cost: 500,
    total_value: 14500,
    mortality_rate: 5.0,
  },
  production_stats: {
    cartons_produced: 1000,
    total_eggs: 360000,
    feed_consumed_ton: 15.5,
    mortality_production: 100,
    mortality_value: 500,
    average_production_rate: 78.5,
    mortality_rate: 1.0,
  },
  annual_production: [],
  annual_movement: [
    {
      year: 2026,
      cartons_produced: 1000,
      eggs_produced: 360000,
      birds_entering_production: 10000,
      cumulative_birds: 10000,
      production_rate: 78.5,
      mortality_count: 100,
      feed_consumption: 15.5,
      target_cartons: 1200,
      cartons_difference: -200,
    }
  ],
  egg_weight_distribution: {
    summary: {
      total_eggs: 360000,
      total_cartons: 1000,
      total_plates: 12000,
    },
    rows: [
      {
        size_code: 'jumbo',
        label_ar: 'جامبو',
        label_en: 'Jumbo',
        cartons: 200,
        plates: 2400,
        eggs: 72000,
        percentage: 20.0,
        weight_from: 70,
        weight_to: 80,
        avg_weight: 75,
        egg_weight_gram: 75,
        total_weight_ton: 5.4,
      },
      {
        size_code: 'xlarge',
        label_ar: 'كبير جداً',
        label_en: 'Extra Large',
        cartons: 800,
        plates: 9600,
        eggs: 288000,
        percentage: 80.0,
        weight_from: 63,
        weight_to: 70,
        avg_weight: 66,
        egg_weight_gram: 66,
        total_weight_ton: 19.008,
      }
    ],
  },
  ledger_summary: {
    total_debit: 50000,
    total_credit: 30000,
    net_balance: 20000,
  },
  flock_count: 2,
}

describe('UnifiedStatsCards', () => {
  it('renders breeding and production statistics', () => {
    render(<UnifiedStatsCards stats={mockStats} title="شركة التجربة" />)

    expect(screen.getByText('إحصائيات التربية')).toBeInTheDocument()
    expect(screen.getByText('إحصائيات الإنتاجية')).toBeInTheDocument()
  })

  it('renders EggWeightDistributionMatrix when egg_weight_distribution is present and not breeding only', () => {
    render(<UnifiedStatsCards stats={mockStats} title="شركة التجربة" />)

    // Check if headers from the transposed matrix table are rendered
    expect(screen.getAllByText(/البيان/i)[0]).toBeInTheDocument()
    expect(screen.getAllByText(/Jumbo/i)[0]).toBeInTheDocument()
    expect(screen.getAllByText(/Extra Large/i)[0]).toBeInTheDocument()
    expect(screen.getAllByText('عدد الكرتون')[0]).toBeInTheDocument()
    expect(screen.getAllByText('عدد الأطباق')[0]).toBeInTheDocument()
    expect(screen.getAllByText('عدد البيض')[0]).toBeInTheDocument()
    expect(screen.getAllByText('نسبة الأوزان')[0]).toBeInTheDocument()
  })

  it('does not render EggWeightDistributionMatrix when isBreedingOnly is true', () => {
    render(<UnifiedStatsCards stats={mockStats} isBreedingOnly={true} title="شركة التجربة" />)

    expect(screen.queryByText(/Jumbo/i)).not.toBeInTheDocument()
  })

  it('formats negative cartons difference with a prefix minus sign', () => {
    render(<UnifiedStatsCards stats={mockStats} title="شركة التجربة" />)

    // Diff is -200, so we expect -200 to be rendered.
    // The previous implementation would show 200-
    expect(screen.getAllByText('-200')[0]).toBeInTheDocument()
  })
})
