/**
 * Hooks barrel export
 * Re-exports all custom hooks and utilities
 *
 * Note: In SvelteKit, "hooks" are utility functions rather than
 * React-style hooks. They're pure functions that can be called
 * from server or client code.
 */

export { getCurrentUser, isEmailAuthorized } from "./use-current-user";
