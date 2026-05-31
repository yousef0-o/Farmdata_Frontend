import { apiRequest, wrapResponse } from './client'
import type {
  CreateNurseryFieldOptionPayload,
  NurseryFieldOption,
  NurseryFieldOptionsDictionary,
  NurseryFieldOptionType,
} from '../types/nurseryFields'

export const nurseryFieldsApi = {
  getAll: () =>
    wrapResponse<NurseryFieldOptionsDictionary>(apiRequest('/nursery/fields/all')),

  listByType: (type: NurseryFieldOptionType) =>
    wrapResponse<NurseryFieldOption[]>(apiRequest(`/nursery/fields/${type}`)),

  create: (type: NurseryFieldOptionType, data: CreateNurseryFieldOptionPayload) =>
    wrapResponse<NurseryFieldOption>(
      apiRequest(`/nursery/fields/${type}`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
    ),

  delete: (id: number) =>
    apiRequest<void>(`/nursery/fields/options/${id}`, {
      method: 'DELETE',
    }),
}
