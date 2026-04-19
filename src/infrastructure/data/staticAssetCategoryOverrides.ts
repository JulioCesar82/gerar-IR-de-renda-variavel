import { AssetCategory } from '../../core/domain/Transaction';

/**
 * Static overrides for asset categories.
 * This is useful for assets that don't follow the standard naming conventions,
 * like 'KLBN11' which ends in '11' but is a Stock, not a FII.
 */
export const assetCategoryOverrides: Record<string, AssetCategory> = {
  'KLBN11': AssetCategory.STOCK,
  'SANB11': AssetCategory.STOCK,
  'ALUP11': AssetCategory.STOCK,
  'BPAC11': AssetCategory.STOCK,
  'TIET11': AssetCategory.STOCK,
  'RLOG11': AssetCategory.STOCK,
  'CPLE11': AssetCategory.STOCK,
  'TAEE11': AssetCategory.STOCK,
};
