# 11 - App Context Migration

## Prerequisites
- `01-project-setup.md` through `10-main-components-migration.md` completed

## Next Prompt
- `12-routes-migration.md`

---

## Objective

Replace React Context with Svelte stores. Migrate the `useCurrentUser` hook to work with Better Auth and brand configuration.

---

## Instructions

### Step 1: Create Stores Directory

```bash
mkdir -p src/lib/stores
```

### Step 2: Create App Store

**src/lib/stores/app.ts:**
```typescript
import { writable } from "svelte/store";

/**
 * Selected courier service
 * Empty string means no courier selected
 */
export const courierService = writable<string>("");

/**
 * Drag-drop zone hover state
 */
export const zoneHover = writable<boolean>(false);

/**
 * Currently accepted/uploaded file
 */
export const acceptedFile = writable<File | null>(null);

/**
 * Reset all app state
 */
export const resetAppState = () => {
    courierService.set("");
    zoneHover.set(false);
    acceptedFile.set(null);
};
```

### Step 3: Create Stores Index

**src/lib/stores/index.ts:**
```typescript
export {
    courierService,
    zoneHover,
    acceptedFile,
    resetAppState
} from "./app";
```

### Step 4: Create Hooks Directory

```bash
mkdir -p src/lib/hooks
```

### Step 5: Create useCurrentUser Hook

**src/lib/hooks/use-current-user.ts:**
```typescript
import { findBrandByEmail } from "$lib/config";
import type { CurrentUser } from "$lib/types";

/**
 * Get current user configuration based on authenticated email
 * Maps the authenticated user's email to their brand configuration
 *
 * @param email - The authenticated user's email address
 * @returns CurrentUser object with brand details, or null if not found
 */
export const getCurrentUser = (email: string | undefined): CurrentUser | null => {
    if (!email) return null;

    const brand = findBrandByEmail(email);

    if (!brand) return null;

    return {
        name: brand.name,
        phone: brand.phone,
        courier: brand.courier,
        merchant_id: brand.merchant_id,
        url: brand.url
    };
};

/**
 * Check if an email is authorized
 */
export const isEmailAuthorized = (email: string | undefined): boolean => {
    if (!email) return false;
    return findBrandByEmail(email) !== undefined;
};
```

### Step 6: Create Hooks Index

**src/lib/hooks/index.ts:**
```typescript
export { getCurrentUser, isEmailAuthorized } from "./use-current-user";
```

### Step 7: Update hooks.server.ts to Include CurrentUser

**src/hooks.server.ts:**
```typescript
import type { Handle } from "@sveltejs/kit";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { building } from "$app/environment";
import { createAuth } from "$lib/server/auth";
import { getCurrentUser } from "$lib/hooks";

export const handle: Handle = async ({ event, resolve }) => {
    // Skip during build
    if (building) {
        return resolve(event);
    }

    // Get D1 database from platform
    const db = event.platform?.env?.DB;

    if (!db) {
        console.warn("D1 database not available");
        event.locals.user = null;
        event.locals.session = null;
        event.locals.currentUser = null;
        return resolve(event);
    }

    // Create auth instance with the D1 database
    const auth = createAuth(db);

    // Fetch session and populate locals
    const session = await auth.api.getSession({
        headers: event.request.headers
    });

    if (session) {
        event.locals.session = session.session;
        event.locals.user = session.user;
        // Derive currentUser from email
        event.locals.currentUser = getCurrentUser(session.user.email);
    } else {
        event.locals.session = null;
        event.locals.user = null;
        event.locals.currentUser = null;
    }

    // Handle auth routes
    return svelteKitHandler({ event, resolve, auth, building });
};
```

### Step 8: Update Layout Server Load

**src/routes/+layout.server.ts:**
```typescript
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals }) => {
    return {
        user: locals.user,
        session: locals.session,
        currentUser: locals.currentUser
    };
};
```

### Step 9: Example Store Usage in Component

Here's how to use stores in a component:

```svelte
<script lang="ts">
    import { courierService, zoneHover } from "$lib/stores";

    // Read store value reactively
    // Use $courierService to read

    // Write to store
    const selectCourier = (value: string) => {
        courierService.set(value);
    };

    // Or use update for complex changes
    const toggleZoneHover = () => {
        zoneHover.update(v => !v);
    };
</script>

<!-- Use $ prefix to subscribe -->
<p>Selected: {$courierService}</p>
<p>Hovering: {$zoneHover}</p>
```

### Step 10: Create Store-Connected OrderProcessor

Update the OrderProcessor to use stores:

**Alternative src/lib/components/features/order-processor.svelte (store version):**
```svelte
<!--
  OrderProcessor Component (Store Version)
  Uses Svelte stores for state management
-->
<script lang="ts">
    import * as XLSX from "xlsx";
    import Papa from "papaparse";
    import { CourierService } from "$lib/services";
    import { generateFileName } from "$lib/constants";
    import { Courier } from "$lib/types";
    import type { CurrentUser } from "$lib/types";
    import { cn } from "$lib/utils";
    import { courierService, zoneHover, acceptedFile } from "$lib/stores";
    import Upload from "./upload.svelte";
    import Download from "./download.svelte";

    interface Props {
        currentUser: CurrentUser;
    }

    let { currentUser }: Props = $props();

    let fileInputRef = $state<HTMLInputElement | null>(null);

    // Computed: is upload disabled?
    const isDisabled = $derived(
        $courierService === "" || currentUser.courier !== $courierService
    );

    // Handle file selection
    const handleFileSelect = (file: File) => {
        if (isDisabled || !currentUser.courier) return;

        acceptedFile.set(file);

        Papa.parse(file, {
            complete: (results) => {
                const rawData = results.data as string[][];

                const processedOrders = CourierService.processOrders(
                    currentUser.courier as Courier,
                    rawData,
                    {
                        name: currentUser.name,
                        phone: currentUser.phone || "",
                        merchant_id: currentUser.merchant_id || ""
                    }
                );

                const worksheet = XLSX.utils.json_to_sheet(processedOrders);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

                const fileName = generateFileName(currentUser.courier as string);
                XLSX.writeFile(workbook, fileName);

                zoneHover.set(false);
            },
            error: (error) => {
                console.error("CSV parsing error:", error);
                acceptedFile.set(null);
            }
        });
    };

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        if (!isDisabled) {
            zoneHover.set(true);
        }
    };

    const handleDragLeave = (e: DragEvent) => {
        e.preventDefault();
        zoneHover.set(false);
    };

    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        zoneHover.set(false);

        if (isDisabled) return;

        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
            const file = files[0];
            if (file && file.type === "text/csv") {
                handleFileSelect(file);
            }
        }
    };

    const handleClick = () => {
        if (!isDisabled && fileInputRef) {
            fileInputRef.click();
        }
    };

    const handleInputChange = (e: Event) => {
        const input = e.target as HTMLInputElement;
        const files = input.files;
        if (files && files.length > 0) {
            const file = files[0];
            if (file) {
                handleFileSelect(file);
            }
        }
    };
</script>

<div
    role="button"
    tabindex={isDisabled ? -1 : 0}
    class={cn(
        "flex h-80 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors lg:w-1/2",
        isDisabled
            ? "cursor-not-allowed border-zinc-800 opacity-50"
            : "cursor-pointer border-zinc-700 hover:border-zinc-500",
        $zoneHover && "border-zinc-500 bg-zinc-900/50"
    )}
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
    onclick={handleClick}
    onkeydown={(e) => e.key === "Enter" && handleClick()}
>
    <input
        bind:this={fileInputRef}
        type="file"
        accept=".csv"
        class="hidden"
        onchange={handleInputChange}
        disabled={isDisabled}
    />

    {#if $acceptedFile}
        <Download fileName={$acceptedFile.name} fileSize={$acceptedFile.size} />
    {:else}
        <Upload disabled={isDisabled} />
    {/if}
</div>
```

---

## Verification

```bash
# Type check
bun run check

# Start preview (with D1)
bun run preview
```

---

## Files Created

- `src/lib/stores/app.ts`
- `src/lib/stores/index.ts`
- `src/lib/hooks/use-current-user.ts`
- `src/lib/hooks/index.ts`
- `src/hooks.server.ts` (updated)
- `src/routes/+layout.server.ts` (updated)

---

## React Context vs Svelte Stores

| React Context | Svelte Store | Usage |
|---------------|--------------|-------|
| `useContext(AppContext)` | `import { store } from '$lib/stores'` | Import |
| `ctx.courierService` | `$courierService` | Read |
| `ctx.setCourierService(v)` | `courierService.set(v)` | Write |
| Provider component needed | No provider needed | Setup |

---

## Notes

- Svelte stores are simpler than React Context
- No provider wrapping needed
- The `$` prefix auto-subscribes to store changes
- Stores can be used in any .svelte file or .ts file
- The `getCurrentUser` function replaces the `useCurrentUser` hook
- `currentUser` is now computed server-side in hooks.server.ts
