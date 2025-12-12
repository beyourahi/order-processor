# 10 - Main Components Migration

## Prerequisites
- `01-project-setup.md` through `09-ui-components-migration.md` completed

## Next Prompt
- `11-app-context-migration.md`

---

## Objective

Migrate the main feature components: OrderProcessor, Upload, Download, CourierPicker, and User. These components contain the core application logic.

---

## Instructions

### Step 1: Create Feature Components Directory

```bash
mkdir -p src/lib/components/features
```

### Step 2: Create Upload Component

**src/lib/components/features/upload.svelte:**
```svelte
<!--
  Upload Component
  Displays the drag-and-drop upload zone or disabled state
  Uses the upload.gif animation
-->
<script lang="ts">
    interface Props {
        disabled?: boolean;
    }

    let { disabled = false }: Props = $props();
</script>

<div
    class="flex flex-col items-center justify-center gap-6"
    class:opacity-50={disabled}
    class:cursor-not-allowed={disabled}
>
    <img
        src="/upload.gif"
        alt="Upload animation"
        class="h-24 w-24 object-contain"
        class:grayscale={disabled}
    />
    <div class="flex flex-col items-center gap-2">
        <p class="text-lg font-medium text-zinc-300">
            {disabled ? "Select a courier first" : "Drop your CSV file here"}
        </p>
        <p class="text-sm text-zinc-500">
            {disabled ? "Choose a courier service to enable upload" : "or click to browse"}
        </p>
    </div>
</div>
```

### Step 3: Create Download Component

**src/lib/components/features/download.svelte:**
```svelte
<!--
  Download Component
  Shows file preview after CSV is selected
  Displays filename and formatted file size
-->
<script lang="ts">
    interface Props {
        fileName: string;
        fileSize: number;
    }

    let { fileName, fileSize }: Props = $props();

    // Format file size for display
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };
</script>

<div class="flex flex-col items-center justify-center gap-6">
    <img
        src="/download.gif"
        alt="Download animation"
        class="h-24 w-24 object-contain"
    />
    <div class="flex flex-col items-center gap-2">
        <p class="text-lg font-medium text-zinc-300 truncate max-w-xs">
            {fileName}
        </p>
        <p class="text-sm text-zinc-500">
            {formatFileSize(fileSize)}
        </p>
    </div>
</div>
```

### Step 4: Create CourierPicker Component

**src/lib/components/features/courier-picker.svelte:**
```svelte
<!--
  CourierPicker Component
  Displays available courier options as buttons
  Highlights the selected courier with green ring
-->
<script lang="ts">
    import { COURIER_OPTIONS } from "$lib/config";
    import { cn } from "$lib/utils";

    interface Props {
        selectedCourier: string;
        userCourier: string | null;
        onSelect: (courier: string) => void;
    }

    let { selectedCourier, userCourier, onSelect }: Props = $props();
</script>

<div class="flex flex-col items-center gap-6">
    <h2 class="text-xl font-semibold text-zinc-300">Select Courier</h2>

    <div class="flex flex-wrap justify-center gap-4">
        {#each COURIER_OPTIONS as option}
            {@const isSelected = selectedCourier === option.value}
            {@const isUserCourier = userCourier === option.value}

            <button
                onclick={() => onSelect(option.value)}
                class={cn(
                    "sleek flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all",
                    "hover:border-zinc-600 active:scale-95",
                    isSelected
                        ? "border-green-500 bg-green-500/10"
                        : "border-zinc-800 bg-zinc-900/50",
                    isUserCourier && !isSelected && "border-zinc-600"
                )}
            >
                <img
                    src={option.logo}
                    alt={option.label}
                    class="h-12 w-12 object-contain"
                />
                <span class="text-sm font-medium text-zinc-300">
                    {option.label}
                </span>
                {#if isUserCourier}
                    <span class="text-xs text-zinc-500">Your default</span>
                {/if}
            </button>
        {/each}
    </div>
</div>
```

### Step 5: Create User Component

**src/lib/components/features/user.svelte:**
```svelte
<!--
  User Component
  Displays current user info and logout button
  Shows brand name, email, and link to brand URL
-->
<script lang="ts">
    import { authClient } from "$lib/auth-client";
    import { goto } from "$app/navigation";
    import type { CurrentUser } from "$lib/types";

    interface Props {
        user: {
            email: string;
            name: string;
        };
        currentUser: CurrentUser;
    }

    let { user, currentUser }: Props = $props();

    let isLoggingOut = $state(false);

    const handleLogout = async () => {
        isLoggingOut = true;
        try {
            await authClient.signOut();
            goto("/login");
        } finally {
            isLoggingOut = false;
        }
    };
</script>

<div class="flex w-full flex-col gap-8 text-zinc-400 sm:max-w-xl sm:items-center sm:gap-16 md:flex-row md:justify-between lg:max-w-4xl 2xl:max-w-6xl">
    <div class="flex flex-col items-start gap-2 text-sm">
        <span>
            Name:
            <a
                href={currentUser.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                class="sleek font-bold text-zinc-300 active:text-zinc-400 xl:hover:text-zinc-400"
            >
                {currentUser.name}
            </a>
        </span>

        <span>
            E-mail:
            <a
                href={currentUser.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                class="sleek font-bold text-zinc-300 active:text-zinc-400 xl:hover:text-zinc-400"
            >
                {user.email}
            </a>
        </span>
    </div>

    <button
        onclick={handleLogout}
        disabled={isLoggingOut}
        class="sleek rounded-xl bg-red-500 px-12 py-3 text-sm font-bold text-white uppercase active:scale-95 active:bg-red-700 disabled:opacity-50 xl:hover:bg-red-700"
    >
        {isLoggingOut ? "Logging out..." : "Log Out"}
    </button>
</div>
```

### Step 6: Create OrderProcessor Component

**src/lib/components/features/order-processor.svelte:**
```svelte
<!--
  OrderProcessor Component
  Main CSV upload and Excel generation component
  Handles file input, parsing, processing, and download
-->
<script lang="ts">
    import * as XLSX from "xlsx";
    import Papa from "papaparse";
    import { CourierService } from "$lib/services";
    import { generateFileName } from "$lib/constants";
    import { Courier } from "$lib/types";
    import type { CurrentUser } from "$lib/types";
    import { cn } from "$lib/utils";
    import Upload from "./upload.svelte";
    import Download from "./download.svelte";

    interface Props {
        currentUser: CurrentUser;
        selectedCourier: string;
    }

    let { currentUser, selectedCourier }: Props = $props();

    // Component state
    let zoneHover = $state(false);
    let acceptedFile = $state<File | null>(null);
    let fileInputRef = $state<HTMLInputElement | null>(null);

    // Computed: is upload disabled?
    const isDisabled = $derived(
        selectedCourier === "" || currentUser.courier !== selectedCourier
    );

    // Handle file selection
    const handleFileSelect = (file: File) => {
        if (isDisabled || !currentUser.courier) return;

        acceptedFile = file;

        // Parse CSV
        Papa.parse(file, {
            complete: (results) => {
                const rawData = results.data as string[][];

                // Process orders through courier service
                const processedOrders = CourierService.processOrders(
                    currentUser.courier as Courier,
                    rawData,
                    {
                        name: currentUser.name,
                        phone: currentUser.phone || "",
                        merchant_id: currentUser.merchant_id || ""
                    }
                );

                // Generate Excel file
                const worksheet = XLSX.utils.json_to_sheet(processedOrders);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

                // Download file
                const fileName = generateFileName(currentUser.courier as string);
                XLSX.writeFile(workbook, fileName);

                // Reset state
                zoneHover = false;
            },
            error: (error) => {
                console.error("CSV parsing error:", error);
                acceptedFile = null;
            }
        });
    };

    // Handle drag events
    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        if (!isDisabled) {
            zoneHover = true;
        }
    };

    const handleDragLeave = (e: DragEvent) => {
        e.preventDefault();
        zoneHover = false;
    };

    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        zoneHover = false;

        if (isDisabled) return;

        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
            const file = files[0];
            if (file && file.type === "text/csv") {
                handleFileSelect(file);
            }
        }
    };

    // Handle click to browse
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
        zoneHover && "border-zinc-500 bg-zinc-900/50"
    )}
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
    onclick={handleClick}
    onkeydown={(e) => e.key === "Enter" && handleClick()}
>
    <!-- Hidden file input -->
    <input
        bind:this={fileInputRef}
        type="file"
        accept=".csv"
        class="hidden"
        onchange={handleInputChange}
        disabled={isDisabled}
    />

    <!-- Conditional UI -->
    {#if acceptedFile}
        <Download fileName={acceptedFile.name} fileSize={acceptedFile.size} />
    {:else}
        <Upload disabled={isDisabled} />
    {/if}
</div>
```

### Step 7: Create Features Index

**src/lib/components/features/index.ts:**
```typescript
export { default as Upload } from "./upload.svelte";
export { default as Download } from "./download.svelte";
export { default as CourierPicker } from "./courier-picker.svelte";
export { default as User } from "./user.svelte";
export { default as OrderProcessor } from "./order-processor.svelte";
```

### Step 8: Update Main Components Index

**src/lib/components/index.ts:**
```typescript
// UI Components
export {
    Button,
    LoadingSpinner,
    Heading,
    Footer,
    NotAuthorized
} from "./ui";

// Feature Components
export {
    Upload,
    Download,
    CourierPicker,
    User,
    OrderProcessor
} from "./features";
```

---

## Verification

```bash
# Type check
bun run check

# Start dev server
bun run dev
```

Test with mock data:

```svelte
<script lang="ts">
    import { OrderProcessor, CourierPicker, User } from "$lib/components";
    import { Courier } from "$lib/types";

    // Mock data for testing
    const mockUser = { email: "test@example.com", name: "Test User" };
    const mockCurrentUser = {
        name: "Test Brand",
        phone: "01700000000",
        courier: Courier.SteadFast,
        merchant_id: "12345",
        url: "https://example.com"
    };

    let selectedCourier = $state("");
</script>

<div class="flex min-h-screen flex-col items-center gap-12 p-8">
    <CourierPicker
        selectedCourier={selectedCourier}
        userCourier={mockCurrentUser.courier}
        onSelect={(c) => selectedCourier = c}
    />

    <OrderProcessor
        currentUser={mockCurrentUser}
        selectedCourier={selectedCourier}
    />

    <User user={mockUser} currentUser={mockCurrentUser} />
</div>
```

---

## Files Created

- `src/lib/components/features/upload.svelte`
- `src/lib/components/features/download.svelte`
- `src/lib/components/features/courier-picker.svelte`
- `src/lib/components/features/user.svelte`
- `src/lib/components/features/order-processor.svelte`
- `src/lib/components/features/index.ts`
- `src/lib/components/index.ts` (updated)

---

## Component Mapping

| React Component | Svelte Component | Key Changes |
|-----------------|------------------|-------------|
| `OrderProcessor` | `order-processor.svelte` | Papa Parse direct, no CSVReader wrapper |
| `Upload` | `upload.svelte` | Pure presentational |
| `Download` | `download.svelte` | Uses local formatFileSize |
| `CourierPicker` | `courier-picker.svelte` | Props instead of context |
| `User` | `user.svelte` | Better Auth signOut |

---

## Notes

- Papa Parse is used directly instead of react-papaparse
- File handling is done with native browser APIs
- State is managed with Svelte 5 `$state` runes
- The xlsx library works the same way in Svelte
- Drag and drop uses native DOM events
- The component styling exactly matches the original
