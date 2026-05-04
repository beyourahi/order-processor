import type { BrandSettingsState, BrandSettingsPatch, SaveState } from "$lib/types";
import { api, debounceSync } from "$lib/api/client";

const EMPTY: BrandSettingsState = {
    contactName: null,
    contactPhone: null,
    merchantId: null,
    selectedCourier: null
};

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
    let saveState = $state<SaveState>("idle");
    let saveError = $state<string | null>(null);
    let savedTimer: ReturnType<typeof setTimeout> | null = null;

    const setSavedTransient = () => {
        saveState = "saved";
        saveError = null;
        if (savedTimer) clearTimeout(savedTimer);
        savedTimer = setTimeout(() => {
            if (saveState === "saved") saveState = "idle";
            savedTimer = null;
        }, SAVED_LINGER_MS);
    };

    const onState = (next: SaveState, err?: Error) => {
        if (next === "saving") {
            saveState = "saving";
            saveError = null;
        } else if (next === "saved") {
            setSavedTransient();
        } else if (next === "error") {
            saveState = "error";
            saveError = err?.message ?? "Save failed";
        }
    };

    const hydrate = (initial: BrandSettingsState) => {
        value = { ...initial };
        saveState = "idle";
        saveError = null;
    };

    const updateField = <K extends keyof BrandSettingsState>(field: K, next: BrandSettingsState[K]) => {
        value = { ...value, [field]: next };
        debounceSync(`brand:${field}`, TEXT_DEBOUNCE_MS, () => persistWithRetry({ [field]: next }), { onState });
    };

    const dismissError = () => {
        saveState = "idle";
        saveError = null;
    };

    return {
        get value() {
            return value;
        },
        get saveState() {
            return saveState;
        },
        get saveError() {
            return saveError;
        },
        hydrate,
        updateField,
        dismissError
    };
};

export const brandSettings = createBrandSettingsStore();
