/**
 * Configuration barrel export
 * Re-exports all configuration modules for clean imports
 */

// App configuration
export { APP_CONFIG } from "./app";

// Brands configuration
export { BRANDS, allowedEmails, findBrandByEmail } from "./brands";

// Courier options
export { COURIER_OPTIONS } from "./couriers";
