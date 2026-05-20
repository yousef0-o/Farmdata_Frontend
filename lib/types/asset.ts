/**
 * Asset Management Types
 * Re-exported from the central types index for modular imports.
 */
export type { Asset, AssetStats } from './index'

export type AssetCategory =
  | 'nurseries'
  | 'incubators'
  | 'lands'
  | 'buildings'
  | 'poultry_houses'
  | 'cars'
  | 'equipment'
  | 'roads'

export type AssetStatus = 'active' | 'in_maintenance' | 'disposed' | 'sold'
