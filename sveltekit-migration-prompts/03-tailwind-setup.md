# 03 - Tailwind CSS Setup

## Prerequisites
- `01-project-setup.md` completed
- `02-cloudflare-configuration.md` completed

## Next Prompt
- `04-shadcn-ui-setup.md`

---

## Objective

Configure Tailwind CSS 4 with the exact same theme tokens and custom styles as the original Next.js application. This is critical for maintaining visual fidelity.

---

## Instructions

### Step 1: Create app.css

**src/app.css:**
```css
@import "tailwindcss";

/* Source directories for Tailwind to scan */
@source "./lib/**/*.{js,ts,svelte}";
@source "./routes/**/*.{js,ts,svelte}";

/* Theme configuration - matches original tailwind.css */
@theme {
    /* Colors */
    --color-background: hsl(0 0% 100%);
    --color-foreground: hsl(240 10% 3.9%);

    --color-card: hsl(0 0% 100%);
    --color-card-foreground: hsl(240 10% 3.9%);

    --color-popover: hsl(0 0% 100%);
    --color-popover-foreground: hsl(240 10% 3.9%);

    --color-primary: hsl(240 5.9% 10%);
    --color-primary-foreground: hsl(0 0% 98%);

    --color-secondary: hsl(240 4.8% 95.9%);
    --color-secondary-foreground: hsl(240 5.9% 10%);

    --color-muted: hsl(240 4.8% 95.9%);
    --color-muted-foreground: hsl(240 3.8% 46.1%);

    --color-accent: hsl(240 4.8% 95.9%);
    --color-accent-foreground: hsl(240 5.9% 10%);

    --color-destructive: hsl(0 84.2% 60.2%);
    --color-destructive-foreground: hsl(0 0% 98%);

    --color-border: hsl(240 5.9% 90%);
    --color-input: hsl(240 5.9% 90%);
    --color-ring: hsl(240 5.9% 10%);

    --color-chart-1: hsl(12 76% 61%);
    --color-chart-2: hsl(173 58% 39%);
    --color-chart-3: hsl(197 37% 24%);
    --color-chart-4: hsl(43 74% 66%);
    --color-chart-5: hsl(27 87% 67%);

    /* Border Radius */
    --radius: 0.5rem;
    --radius-lg: var(--radius);
    --radius-md: calc(var(--radius) - 2px);
    --radius-sm: calc(var(--radius) - 4px);
}

/* Custom utility classes - matches original globals.css */
.sleek {
    @apply transform-gpu transition-all duration-200 ease-in-out;
}

/* Floating label input effects */
.input-data input:focus ~ label,
.input-data input:valid ~ label {
    @apply -translate-y-5 text-sm text-white/60;
}

.input-data input:focus ~ .underline:before,
.input-data input:valid ~ .underline:before {
    @apply scale-x-100;
}

/* Loading spinner animation */
.loader {
    width: 48px;
    height: 48px;
    display: block;
    margin: 15px auto;
    position: relative;
    color: #fff;
    box-sizing: border-box;
    animation: rotation 1s linear infinite;
}

.loader::after,
.loader::before {
    content: "";
    box-sizing: border-box;
    position: absolute;
    width: 24px;
    height: 24px;
    top: 0;
    background-color: #fff;
    border-radius: 50%;
    animation: scale50 1s infinite ease-in-out;
}

.loader::before {
    top: auto;
    bottom: 0;
    background-color: #fff;
    animation-delay: 0.5s;
}

/* Custom scrollbar styling */
*::-webkit-scrollbar {
    @apply w-2 bg-transparent;
}

*::-webkit-scrollbar-thumb {
    @apply rounded-xl bg-white/60;
}

*::-webkit-scrollbar-track {
    @apply rounded-xl bg-transparent;
}

.hide-scrollbar::-webkit-scrollbar {
    @apply h-0 bg-transparent;
}

.hide-scrollbar::-webkit-scrollbar-thumb {
    @apply hidden;
}

/* Keyframe animations */
@keyframes rotation {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}

@keyframes scale50 {
    0%,
    100% {
        transform: scale(0);
    }
    50% {
        transform: scale(1);
    }
}

/* Base layer overrides */
@layer base {
    * {
        @apply border-border;
    }

    body {
        @apply bg-[#0F0F0F] text-white;
    }
}
```

### Step 2: Update app.html

Ensure the `<html>` tag has the dark class and body has base styles:

**src/app.html:**
```html
<!doctype html>
<html lang="en" class="dark">
    <head>
        <meta charset="utf-8" />
        <link rel="icon" href="%sveltekit.assets%/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
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

### Step 3: Verify vite.config.ts Has Tailwind Plugin

**vite.config.ts:**
```typescript
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [tailwindcss(), sveltekit()]
});
```

### Step 4: Update Root Layout to Import CSS

**src/routes/+layout.svelte:**
```svelte
<script lang="ts">
    import "../app.css";

    let { children } = $props();
</script>

<div class="flex min-h-screen flex-col">
    {@render children()}
</div>
```

### Step 5: Test Styling with Updated Placeholder

**src/routes/+page.svelte:**
```svelte
<div class="flex min-h-screen flex-col items-center justify-center gap-8">
    <h1 class="text-4xl font-bold">Migration in Progress</h1>

    <!-- Test sleek class -->
    <button class="sleek rounded-xl bg-red-500 px-8 py-3 text-white active:scale-95 active:bg-red-700 xl:hover:bg-red-700">
        Test Button
    </button>

    <!-- Test loader animation -->
    <div class="loader"></div>

    <!-- Test zinc colors -->
    <p class="text-zinc-400">This text should be zinc-400</p>
    <p class="sleek font-bold text-zinc-300 active:text-zinc-400 xl:hover:text-zinc-400">
        Hover/Active Test
    </p>
</div>
```

---

## Verification

```bash
# Start dev server
bun run dev
```

Visual checks:
1. Background should be dark (`#0F0F0F`)
2. Text should be white
3. Button should have red background with hover/active states
4. Loader should animate (two rotating/scaling dots)
5. Hover states should work on desktop
6. Active states should work on mobile

```bash
# Run type check
bun run check
```

---

## Files Created/Modified

- `src/app.css` (created - main stylesheet)
- `src/app.html` (modified - added fonts, base classes)
- `src/routes/+layout.svelte` (created - imports CSS)
- `src/routes/+page.svelte` (modified - styling test)

---

## Color Reference

The app uses a dark theme with these key colors:

| Usage | Color | CSS |
|-------|-------|-----|
| Background | Near black | `bg-[#0F0F0F]` |
| Primary text | White | `text-white` |
| Secondary text | Zinc 400 | `text-zinc-400` |
| Tertiary text | Zinc 300 | `text-zinc-300` |
| Danger/Logout | Red 500 | `bg-red-500` |
| Active courier | Green | Border/ring on selection |

---

## Notes

- Tailwind CSS 4 uses `@theme` directive instead of `tailwind.config.js`
- The `@source` directive tells Tailwind where to scan for classes
- Geist font is loaded from Google Fonts (matches original)
- The `.sleek` utility provides consistent transition behavior
- Dark mode is always active (no toggle needed)
