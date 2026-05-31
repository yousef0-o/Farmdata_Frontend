'use client'

import { useQuery } from '@tanstack/react-query'
import { nurseryLinesApi } from '../api/nurseryLines'
import type { NurseryLineLedgerFilters } from '../types/nurseryLines'

export function useNurseryLineLedger(filters: NurseryLineLedgerFilters) {
  return useQuery({
    queryKey: ['nursery-lines', filters],
    queryFn: () => nurseryLinesApi.list(filters),
  })
}
