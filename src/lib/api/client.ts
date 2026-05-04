/**
 * Tiny typed fetch + debounce primitives for client-side persistence.
 *
 * Adapted from the invoice-generator pattern. The debounceSync helper
 * coalesces rapid edits per-key so that simultaneous edits to different
 * fields never cancel each other.
 */

import type { SaveState } from "$lib/types";

type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

const send = async <T>(method: Method, path: string, body?: unknown): Promise<T> => {
    const init: RequestInit = { method };
    if (body !== undefined) {
        init.headers = { "content-type": "application/json" };
        init.body = JSON.stringify(body);
    }
    const res = await fetch(path, init);
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `${method} ${path} failed with ${res.status}`);
    }
    if (res.status === 204) return undefined as T;
    const ct = res.headers.get("content-type") ?? "";
    return ct.includes("application/json") ? ((await res.json()) as T) : (undefined as T);
};

export const api = {
    get: <T>(path: string) => send<T>("GET", path),
    post: <T>(path: string, body?: unknown) => send<T>("POST", path, body),
    patch: <T>(path: string, body?: unknown) => send<T>("PATCH", path, body),
    put: <T>(path: string, body?: unknown) => send<T>("PUT", path, body),
    delete: <T>(path: string) => send<T>("DELETE", path)
};

export interface SyncOptions {
    /**
     * Optional callback invoked on save-state transitions: "saving" when the
     * debounced call begins, "saved" on success, "error" on failure. The
     * second argument carries the Error on the "error" transition.
     */
    onState?: (state: SaveState, err?: Error) => void;
}

const pending = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Schedule fn to run after delayMs of quiet on `key`. Subsequent calls with
 * the same key reset the timer; calls with different keys run independently.
 *
 * Errors are logged to the console; callers wanting richer error handling
 * should pass an onState callback.
 */
export const debounceSync = <T>(
    key: string,
    delayMs: number,
    fn: () => Promise<T>,
    options: SyncOptions = {}
): void => {
    const existing = pending.get(key);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(async () => {
        pending.delete(key);
        options.onState?.("saving");
        try {
            await fn();
            options.onState?.("saved");
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            console.error("[sync]", key, error);
            options.onState?.("error", error);
        }
    }, delayMs);
    pending.set(key, timer);
};

/**
 * Fire-and-forget wrapper. Runs fn immediately, returns the result on
 * success or null on failure. Errors are logged to the console.
 */
export const sync = async <T>(fn: () => Promise<T>, options: SyncOptions = {}): Promise<T | null> => {
    options.onState?.("saving");
    try {
        const result = await fn();
        options.onState?.("saved");
        return result;
    } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error("[sync]", error);
        options.onState?.("error", error);
        return null;
    }
};

/**
 * Cancel any pending debounced syncs without running them. Useful in tests
 * and during teardown.
 */
export const flushSync = (): void => {
    for (const t of pending.values()) clearTimeout(t);
    pending.clear();
};
