/**
 * SteadFast CSV column indexes (Shopify-shaped layout):
 * [34, 36, 39, 43, 11, 44]
 *  = [ShippingName(34), ShippingAddress1(36), ShippingCity(39), Phone(43), TotalPrice(11), Notes(44)]
 *
 * FRAGILE (CLAUDE.md #5): positions are hardcoded to Shopify's current export
 * column order. If Shopify reorders or adds columns these break silently — the
 * wrong fields land in the courier sheet with no error.
 */
export const STEADFAST_INDEXES_ARRAY = [34, 36, 39, 43, 11, 44] as const;
