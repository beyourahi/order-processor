/**
 * Closure-based runes store (project pattern; NOT a Svelte `writable()`). The
 * exported `brandSettings` is a module singleton.
 *
 * HYDRATION: `+page.svelte` calls `hydrate()` synchronously via `untrack()`
 * during its own setup so children read canonical server values on first mount.
 * Do NOT move hydration into an `$effect` — that reintroduces the mount race
 * fixed in commit 6d9d68b (children would briefly see EMPTY).
 *
 * Each field owns an independent SaveState + retry budget so a slow/failing
 * field never blocks another; the aggregate `saveState`/`saveError` getters
 * roll them up for the beforeunload guard.
 */
import type { BrandSettingsState, BrandSettingsPatch, SaveState } from "$lib/types";
import { api, debounceSync } from "$lib/api/client";

const EMPTY: BrandSettingsState = {
    contactName: null,
    contactPhone: null,
    merchantId: null,
    selectedCourier: null
};

type FieldKey = keyof BrandSettingsState;

const TEXT_DEBOUNCE_MS = 500;
const SAVED_LINGER_MS = 2000;
const RETRY_DELAYS_MS = [1000, 2000, 4000] as const;

// Retry budget is per-call; one field's failure never blocks another.
// Delays: 1s, 2s, 4s — up to 4 attempts total.
const persistWithRetry = async (patch: BrandSettingsPatch): Promise<void> => {
    let lastError: unknown;
    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
        try {
            await api.patch<void>("/api/brand-settings", patch);
            return;
        } catch (err) {
            lastError = err;
            const delay = RETRY_DELAYS_MS[attempt];
            if (delay === undefined) break;
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
    throw lastError instanceof Error ? lastError : new Error(String(lastError));
};

const createBrandSettingsStore = () => {
    let value = $state<BrandSettingsState>({ ...EMPTY });
    // Per-field SaveState so each input renders independently — no cross-field bleed.
    let fieldStates = $state<Partial<Record<FieldKey, SaveState>>>({});
    let fieldErrors = $state<Partial<Record<FieldKey, string>>>({});
    // Non-reactive (plain object): timers are bookkeeping, no UI reads them.
    const fieldTimers: Partial<Record<FieldKey, ReturnType<typeof setTimeout>>> = {};

    const setSavedTransient = (field: FieldKey) => {
        fieldStates[field] = "saved";
        delete fieldErrors[field];
        const existing = fieldTimers[field];
        if (existing) clearTimeout(existing);
        fieldTimers[field] = setTimeout(() => {
            if (fieldStates[field] === "saved") fieldStates[field] = "idle";
            delete fieldTimers[field];
        }, SAVED_LINGER_MS);
    };

    const onState = (field: FieldKey) => (next: SaveState, err?: Error) => {
        if (next === "saving") {
            fieldStates[field] = "saving";
            delete fieldErrors[field];
        } else if (next === "saved") {
            setSavedTransient(field);
        } else if (next === "error") {
            fieldStates[field] = "error";
            fieldErrors[field] = err?.message ?? "Save failed";
        }
    };

    const hydrate = (initial: BrandSettingsState) => {
        value = { ...initial };
        fieldStates = {};
        fieldErrors = {};
        for (const key of Object.keys(fieldTimers) as FieldKey[]) {
            const t = fieldTimers[key];
            if (t) clearTimeout(t);
            delete fieldTimers[key];
        }
    };

    const updateField = <K extends FieldKey>(field: K, next: BrandSettingsState[K]) => {
        value = { ...value, [field]: next };
        debounceSync(`brand:${field}`, TEXT_DEBOUNCE_MS, () => persistWithRetry({ [field]: next }), {
            onState: onState(field)
        });
    };

    const dismissError = (field: FieldKey) => {
        if (fieldStates[field] === "error") fieldStates[field] = "idle";
        delete fieldErrors[field];
    };

    const fieldState = (field: FieldKey): SaveState => fieldStates[field] ?? "idle";
    const fieldError = (field: FieldKey): string | null => fieldErrors[field] ?? null;

    return {
        get value() {
            return value;
        },
        // Aggregate roll-up used by the beforeunload guard.
        // Precedence: saving > error > saved > idle.
        get saveState(): SaveState {
            const states = Object.values(fieldStates);
            if (states.includes("saving")) return "saving";
            if (states.includes("error")) return "error";
            if (states.includes("saved")) return "saved";
            return "idle";
        },
        get saveError(): string | null {
            for (const err of Object.values(fieldErrors)) if (err) return err;
            return null;
        },
        fieldState,
        fieldError,
        hydrate,
        updateField,
        dismissError
    };
};

export const brandSettings = createBrandSettingsStore();
