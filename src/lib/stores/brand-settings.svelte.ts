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

/**
 * Persist a patch with retries before reporting failure. Each call uses its
 * own retry budget so failures on one field do not affect others.
 */
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
    // Per-field state map. Each field tracks its own save lifecycle so the
    // indicator on one input never reflects activity on another.
    let fieldStates = $state<Partial<Record<FieldKey, SaveState>>>({});
    let fieldErrors = $state<Partial<Record<FieldKey, string>>>({});
    // Plain object — internal bookkeeping only, never read reactively.
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
        // Aggregate state derived from all field states. "saving" wins (used by
        // beforeunload), then "error", then "saved", else "idle".
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
