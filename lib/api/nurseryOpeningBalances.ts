import { apiRequest, wrapResponse } from './client'
import type {
  NurseryOpeningBalancesBootstrap,
  NurseryOpeningBalancesPayload,
} from '../types/nurseryOpeningBalances'

export const nurseryOpeningBalancesApi = {
  getBootstrap: () =>
    wrapResponse<NurseryOpeningBalancesBootstrap>(apiRequest('/nursery/opening-balances')),

  store: (data: NurseryOpeningBalancesPayload) =>
    apiRequest<{ message: string; data: NurseryOpeningBalancesBootstrap }>(
      '/nursery/opening-balances',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),
}
