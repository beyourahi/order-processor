/**
 * Central configuration export point
 * This file re-exports all configuration modules for easy importing
 */

export * from "./app";
export * from "./brands";
export * from "./couriers";

// Re-export file constants for backward compatibility
export * from "@/constants/files";

// Legacy exports for backward compatibility
// These should eventually be replaced with direct imports from their new locations
export { STEADFAST_INDEXES_ARRAY as STEADFAST_INDEXES } from "@/constants";
export { PATHAO_INDEXES_ARRAY as PATHAO_INDEXES } from "@/constants";