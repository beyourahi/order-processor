/**
 * Configuration types and utility types
 * Contains types for application configuration and general utility types
 */

import type { ClassValue } from "clsx";
import type { NextConfig } from "next";
import type { NextRequest } from "next/server";

// ==================== Configuration Types ====================

/**
 * Application metadata interface
 * Core application configuration details
 */
export interface AppConfig {
    name: string;
    description: string;
    url: string;
    repository: {
        url: string;
        type: string;
    };
    author: {
        name: string;
        email: string;
        url: string;
    };
}

// ==================== Utility Types ====================

/**
 * Makes all properties of T optional recursively
 */
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Makes specific properties of T required
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Extracts the type of array elements
 */
export type ArrayElement<ArrayType extends readonly unknown[]> = ArrayType extends readonly (infer ElementType)[]
    ? ElementType
    : never;

// ==================== Re-exports for External Types ====================

export type { ClassValue, NextRequest, NextConfig };
