'use client'

import { useQuery } from '@tanstack/react-query'
import { nurseryManagementApi } from '../api/nurseryManagement'
import type { NurseryManageFilters } from '../types/nurseryManagement'

export function useNurseryManagement(filters: NurseryManageFilters) {
  return useQuery({
    queryKey: ['nursery-management', filters],
    queryFn: () => nurseryManagementApi.dashboard(filters),
  })
}
