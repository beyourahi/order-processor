import type { HandleClientError } from "@sveltejs/kit";

/**
 * Client-side error handler for unexpected errors.
 *
 * This hook handles errors that occur during:
 * - Client-side navigation
 * - Component rendering in the browser
 * - Hydration failures
 *
 * The errorId allows users to report issues with a trackable identifier.
 */
export const handleError: HandleClientError = async ({ error, status, message }) => {
    const errorId = crypto.randomUUID();

    // Log error to console for debugging
    console.error(`[${errorId}] Client error:`, {
        status,
        message,
        error: error instanceof Error ? { name: error.name, message: error.message } : error
    });

    // Return safe error object (matches App.Error interface)
    return {
        message: status >= 500 ? "An unexpected error occurred" : message,
        errorId
    };
};
