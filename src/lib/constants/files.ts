/**
 * File naming constants for order processing
 * Used when generating and downloading processed order files
 */

/**
 * Prefix for generated order files
 */
export const FILE_PREFIX = "formatted-orders";

/**
 * File extension for generated Excel files
 */
export const FILE_EXTENSION = ".xlsx";

/**
 * Generate output filename for a courier
 * @param courierName - Name of the courier service
 * @returns Formatted filename string
 */
export const generateFileName = (courierName: string): string => {
    return `${FILE_PREFIX}-${courierName.toLowerCase()}${FILE_EXTENSION}`;
};
