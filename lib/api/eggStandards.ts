import { apiRequest } from './client'
import type {
  EggSizeStandardsResponse,
  EggSizeStandardUpdateRow,
  UpdateEggSizeStandardsResponse,
} from '@/types/eggStandards'

export const eggStandardsApi = {
  list: () => apiRequest<EggSizeStandardsResponse>('/standards/egg-sizes'),
  update: (standards: EggSizeStandardUpdateRow[]) =>
    apiRequest<UpdateEggSizeStandardsResponse>('/standards/egg-sizes', {
      method: 'PUT',
      body: JSON.stringify({ standards }),
    }),
}
