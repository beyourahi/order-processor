import type { HandleClientError } from "@sveltejs/kit";

// Client mirror of hooks.server.ts handleError: log the full error against an
// errorId for correlation, but only surface raw messages for < 500 — 5xx are
// genericised so internal details never reach the user. errorId flows to the
// shape declared on App.Error and is rendered by +error.svelte.
export const handleError: HandleClientError = async ({ error, status, message }) => {
    const errorId = crypto.randomUUID();

    console.error(`[${errorId}] Client error:`, {
        status,
        message,
        error: error instanceof Error ? { name: error.name, message: error.message } : error
    });

    return {
        message: status >= 500 ? "An unexpected error occurred" : message,
        errorId
    };
};
