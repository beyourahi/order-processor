# 15 - Static Assets Migration

## Prerequisites
- `01-project-setup.md` through `14-csv-excel-integration.md` completed

## Next Prompt
- `16-styling-verification.md`

---

## Objective

Migrate static assets from the Next.js `public/` directory to SvelteKit's `static/` directory. Update all asset references throughout the codebase.

---

## Instructions

### Step 1: Create Static Directory

SvelteKit uses `static/` instead of `public/`:

```bash
mkdir -p static
```

### Step 2: Copy Assets

Copy all assets from the original public directory:

```bash
# Courier logos
cp public/pathao.png static/
cp public/steadfast.png static/

# Animations
cp public/upload.gif static/
cp public/download.gif static/

# Favicon (if exists)
cp public/favicon.ico static/ 2>/dev/null || echo "No favicon found"

# Future courier logos (optional, for when they're enabled)
cp public/dhl.png static/ 2>/dev/null || true
cp public/redx.png static/ 2>/dev/null || true
cp public/sheba.jpg static/ 2>/dev/null || true
cp public/ecourier.webp static/ 2>/dev/null || true
cp public/fedex.jpeg static/ 2>/dev/null || true
```

### Step 3: Verify Static Directory Structure

```
static/
├── favicon.ico
├── pathao.png
├── steadfast.png
├── upload.gif
├── download.gif
└── (other future courier logos)
```

### Step 4: Update Couriers Config

Update the config to use static paths:

**src/lib/config/couriers.ts:**
```typescript
import type { CourierOption } from "$lib/types";

/**
 * Available courier options for the picker
 * Logos are served from /static directory
 */
export const COURIER_OPTIONS: CourierOption[] = [
    {
        value: "Pathao",
        label: "Pathao",
        logo: "/pathao.png"
    },
    {
        value: "SteadFast",
        label: "SteadFast",
        logo: "/steadfast.png"
    }
];
```

### Step 5: Update Upload Component

**src/lib/components/features/upload.svelte:**
```svelte
<!--
  Upload Component
  Displays the drag-and-drop upload zone
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

### Step 6: Update Download Component

**src/lib/components/features/download.svelte:**
```svelte
<!--
  Download Component
  Shows file preview after CSV is selected
-->
<script lang="ts">
    import { formatFileSize } from "$lib/utils";

    interface Props {
        fileName: string;
        fileSize: number;
    }

    let { fileName, fileSize }: Props = $props();
</script>

<div class="flex flex-col items-center justify-center gap-6">
    <img
        src="/download.gif"
        alt="Download animation"
        class="h-24 w-24 object-contain"
    />
    <div class="flex flex-col items-center gap-2">
        <p class="max-w-xs truncate text-lg font-medium text-zinc-300">
            {fileName}
        </p>
        <p class="text-sm text-zinc-500">
            {formatFileSize(fileSize)}
        </p>
    </div>
</div>
```

### Step 7: Update CourierPicker Component

**src/lib/components/features/courier-picker.svelte:**
```svelte
<!--
  CourierPicker Component
  Displays available courier options as buttons
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
                    loading="lazy"
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

### Step 8: Update app.html Favicon

**src/app.html:**
```html
<!doctype html>
<html lang="en" class="dark">
    <head>
        <meta charset="utf-8" />
        <link rel="icon" href="%sveltekit.assets%/favicon.ico" />
        <link rel="apple-touch-icon" href="%sveltekit.assets%/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
        <meta name="theme-color" content="#0F0F0F" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap" rel="stylesheet" />
        %sveltekit.head%
    </head>
    <body data-sveltekit-preload-data="hover" class="min-h-screen bg-[#0F0F0F] font-sans text-white antialiased">
        <div style="display: contents">%sveltekit.body%</div>
    </body>
</html>
```

### Step 9: Create Asset Test Page

**src/routes/asset-test/+page.svelte:**
```svelte
<!--
  Asset Test Page
  Verify all static assets load correctly
-->
<script lang="ts">
    import { COURIER_OPTIONS } from "$lib/config";
</script>

<div class="flex min-h-screen flex-col items-center gap-12 p-8">
    <h1 class="text-2xl font-bold">Static Assets Test</h1>

    <div class="flex flex-col gap-8">
        <div class="flex flex-col items-center gap-4">
            <h2 class="text-xl text-zinc-400">Courier Logos</h2>
            <div class="flex gap-8">
                {#each COURIER_OPTIONS as option}
                    <div class="flex flex-col items-center gap-2">
                        <img
                            src={option.logo}
                            alt={option.label}
                            class="h-16 w-16 object-contain"
                        />
                        <span class="text-sm text-zinc-400">{option.label}</span>
                    </div>
                {/each}
            </div>
        </div>

        <div class="flex flex-col items-center gap-4">
            <h2 class="text-xl text-zinc-400">Upload Animation</h2>
            <img src="/upload.gif" alt="Upload" class="h-24 w-24" />
        </div>

        <div class="flex flex-col items-center gap-4">
            <h2 class="text-xl text-zinc-400">Download Animation</h2>
            <img src="/download.gif" alt="Download" class="h-24 w-24" />
        </div>

        <div class="flex flex-col items-center gap-4">
            <h2 class="text-xl text-zinc-400">Favicon</h2>
            <img src="/favicon.ico" alt="Favicon" class="h-8 w-8" />
        </div>
    </div>

    <a href="/" class="text-zinc-400 hover:text-white">← Back to home</a>
</div>
```

### Step 10: Add Static Asset Preloading (Optional)

For better performance, preload critical assets:

**src/routes/+layout.svelte:**
```svelte
<script lang="ts">
    import "../app.css";
    import { Footer } from "$lib/components";

    let { children } = $props();
</script>

<svelte:head>
    <title>Shopify Order Processor</title>
    <meta name="description" content="Turn Chaos into Orders - Process Shopify exports for courier services" />
    <!-- Preload critical images -->
    <link rel="preload" href="/upload.gif" as="image" />
    <link rel="preload" href="/pathao.png" as="image" />
    <link rel="preload" href="/steadfast.png" as="image" />
</svelte:head>

<div class="flex min-h-screen flex-col">
    <main class="flex grow flex-col">
        {@render children()}
    </main>
    <Footer />
</div>
```

---

## Verification

```bash
# Start dev server
bun run dev
```

Visit http://localhost:5173/asset-test and verify:
1. Both courier logos load correctly
2. Upload GIF animates
3. Download GIF animates
4. Favicon appears in browser tab

```bash
# Type check
bun run check

# Build (static assets are copied automatically)
bun run build
```

---

## Files Created/Modified

- `static/pathao.png` (copied)
- `static/steadfast.png` (copied)
- `static/upload.gif` (copied)
- `static/download.gif` (copied)
- `static/favicon.ico` (copied)
- `src/lib/config/couriers.ts` (updated)
- `src/lib/components/features/upload.svelte` (updated)
- `src/lib/components/features/download.svelte` (updated)
- `src/lib/components/features/courier-picker.svelte` (updated)
- `src/app.html` (updated)
- `src/routes/asset-test/+page.svelte` (created)
- `src/routes/+layout.svelte` (updated)

---

## Asset Path Differences

| Next.js | SvelteKit |
|---------|-----------|
| `public/image.png` | `static/image.png` |
| `import img from '/image.png'` | `src="/image.png"` |
| `<Image src={img} />` | `<img src="/image.png" />` |
| `next/image` optimization | Native `<img>` or @unpic/svelte |

---

## Notes

- SvelteKit serves files from `static/` at the root path
- No image optimization is included (unlike Next.js Image)
- Add `loading="lazy"` for non-critical images
- Preload critical images in the layout head
- The asset-test page can be removed before production
