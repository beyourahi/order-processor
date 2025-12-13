/**
 * Configuration types and utility types
 * Contains types for application configuration and general utility types
 */

// ==================== Configuration Types ====================

/**
 * Application metadata configuration
 * Core application configuration details
 */
export interface AppConfig {
    name: string;
    description: string;
    url: string;
    repository: {
        type: string;
        url: string;
    };
    author: {
        name: string;
        url: string;
    };
}

// ==================== Utility Types ====================

/**
 * Makes all properties of T optional recursively
 * Useful for partial updates and patch operations
 */
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Makes specific properties of T required
 * Useful when you need to ensure certain fields are present
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Extracts the type of array elements
 * Useful for working with array item types
 */
export type ArrayElement<A> = A extends readonly (infer T)[] ? T : never;
