# 09 - UI Components Migration

## Prerequisites
- `01-project-setup.md` through `08-services-migration.md` completed

## Next Prompt
- `10-main-components-migration.md`

---

## MCP Servers to Use

Before implementing this prompt, use these MCP servers for accurate documentation:

| MCP Server | Usage |
|------------|-------|
| **svelte** | **PRIMARY** - Use `get-documentation` for Svelte 5 component patterns, `$props()`, `$state()` runes, and validate with `svelte-autofixer` |
| **better-auth** | Use `search` for auth client signOut patterns |

### Recommended MCP Queries
```
svelte MCP:
- list-sections → get-documentation: "$props", "$state", "components"
- get-documentation: "class directive", "conditional classes"
- svelte-autofixer: Validate all .svelte components before finalizing

better-auth MCP:
- search: "signOut client"
```

**Important**: After writing each Svelte component, use `svelte-autofixer` to validate Svelte 5 syntax. Components must be visually identical to the React originals.

---

## Objective

Migrate the UI components (Button already done in 04, now: LoadingSpinner, Heading, Footer, NotAuthorized) from React to Svelte 5. These must be visually identical to the original.

---

## Instructions

### Step 1: Create LoadingSpinner Component

**src/lib/components/ui/loading-spinner.svelte:**
```svelte
<!--
  LoadingSpinner Component
  Displays an animated loading indicator
  Uses CSS animation defined in app.css
-->
<div class="loader" aria-label="Loading"></div>
```

**src/lib/components/ui/loading-spinner/index.ts:**
```typescript
import LoadingSpinner from "./loading-spinner.svelte";
export { LoadingSpinner };
export default LoadingSpinner;
```

Wait - let me restructure. The Button uses a folder structure, let's be consistent:

### Step 1: Restructure UI Components

```bash
mkdir -p src/lib/components/ui/loading-spinner
mkdir -p src/lib/components/ui/heading
mkdir -p src/lib/components/ui/footer
mkdir -p src/lib/components/ui/not-authorized
```

### Step 2: Create LoadingSpinner Component

**src/lib/components/ui/loading-spinner/loading-spinner.svelte:**
```svelte
<!--
  LoadingSpinner Component
  Displays an animated loading indicator using CSS keyframe animations
  The .loader class is defined in app.css
-->
<script lang="ts">
    interface Props {
        class?: string;
    }

    let { class: className = "" }: Props = $props();
</script>

<div class="loader {className}" role="status" aria-label="Loading">
    <span class="sr-only">Loading...</span>
</div>

<style>
    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }
</style>
```

**src/lib/components/ui/loading-spinner/index.ts:**
```typescript
import LoadingSpinner from "./loading-spinner.svelte";
export { LoadingSpinner };
export default LoadingSpinner;
```

### Step 3: Create Heading Component

**src/lib/components/ui/heading/heading.svelte:**
```svelte
<!--
  Heading Component
  Displays the app title and tagline
  Matches original Next.js design exactly
-->
<script lang="ts">
    import { APP_CONFIG } from "$lib/config";
</script>

<div class="flex flex-col items-center gap-4">
    <h1 class="text-center text-5xl font-bold tracking-tight lg:text-7xl">
        {APP_CONFIG.name}
    </h1>
    <p class="text-center text-lg text-zinc-400 lg:text-xl">
        {APP_CONFIG.description}
    </p>
</div>
```

**src/lib/components/ui/heading/index.ts:**
```typescript
import Heading from "./heading.svelte";
export { Heading };
export default Heading;
```

### Step 4: Create Footer Component

**src/lib/components/ui/footer/footer.svelte:**
```svelte
<!--
  Footer Component
  Displays developer attribution with link
  Positioned at bottom of viewport
-->
<script lang="ts">
    import { APP_CONFIG } from "$lib/config";
</script>

<footer class="mt-auto pb-6 pt-12 text-center text-sm text-zinc-500">
    <p>
        Designed & Developed by
        <a
            href={APP_CONFIG.author.url}
            target="_blank"
            rel="noopener noreferrer"
            class="sleek font-medium text-zinc-400 hover:text-white"
        >
            {APP_CONFIG.author.name}
        </a>
    </p>
</footer>
```

**src/lib/components/ui/footer/index.ts:**
```typescript
import Footer from "./footer.svelte";
export { Footer };
export default Footer;
```

### Step 5: Create NotAuthorized Component

**src/lib/components/ui/not-authorized/not-authorized.svelte:**
```svelte
<!--
  NotAuthorized Component
  Displays when user's email is not in the allowlist
  Shows access denied message with login redirect option
-->
<script lang="ts">
    import { authClient } from "$lib/auth-client";
    import { goto } from "$app/navigation";

    const handleLogout = async () => {
        await authClient.signOut();
        goto("/login");
    };
</script>

<div class="flex flex-col items-center gap-8 text-center">
    <div class="flex flex-col gap-4">
        <h2 class="text-3xl font-bold text-red-500">Access Denied</h2>
        <p class="max-w-md text-zinc-400">
            Your email is not authorized to access this application.
            Please contact the administrator if you believe this is an error.
        </p>
    </div>

    <button
        onclick={handleLogout}
        class="sleek rounded-xl bg-zinc-800 px-8 py-3 text-sm font-medium text-white hover:bg-zinc-700"
    >
        Sign in with a different account
    </button>
</div>
```

**src/lib/components/ui/not-authorized/index.ts:**
```typescript
import NotAuthorized from "./not-authorized.svelte";
export { NotAuthorized };
export default NotAuthorized;
```

### Step 6: Update UI Index Exports

**src/lib/components/ui/index.ts:**
```typescript
// Button
export * from "./button";
export { Button } from "./button";

// Loading Spinner
export * from "./loading-spinner";
export { LoadingSpinner } from "./loading-spinner";

// Heading
export * from "./heading";
export { Heading } from "./heading";

// Footer
export * from "./footer";
export { Footer } from "./footer";

// Not Authorized
export * from "./not-authorized";
export { NotAuthorized } from "./not-authorized";
```

### Step 7: Update Main Components Index

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

// Feature components will be added in prompt 10
```

### Step 8: Test All UI Components

**src/routes/+page.svelte:**
```svelte
<script lang="ts">
    import {
        Button,
        LoadingSpinner,
        Heading,
        Footer,
        NotAuthorized
    } from "$lib/components";
</script>

<div class="flex min-h-screen flex-col items-center justify-center gap-12 p-8">
    <!-- Heading Test -->
    <Heading />

    <!-- Button Variants -->
    <div class="flex flex-wrap gap-4">
        <Button>Default</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
    </div>

    <!-- Loading Spinner -->
    <div class="flex flex-col items-center gap-2">
        <p class="text-sm text-zinc-400">Loading Spinner:</p>
        <LoadingSpinner />
    </div>

    <!-- Not Authorized (conditional render in real app) -->
    <div class="rounded-lg border border-zinc-800 p-8">
        <p class="mb-4 text-sm text-zinc-400">NotAuthorized Preview:</p>
        <NotAuthorized />
    </div>

    <!-- Footer -->
    <Footer />
</div>
```

---

## Verification

```bash
# Type check
bun run check

# Start dev server
bun run dev
```

Visual checks:
1. Heading displays app name and description centered
2. Button variants all render correctly
3. LoadingSpinner animates (two dots rotating)
4. NotAuthorized shows red "Access Denied" with button
5. Footer shows at bottom with author link

---

## Files Created

- `src/lib/components/ui/loading-spinner/loading-spinner.svelte`
- `src/lib/components/ui/loading-spinner/index.ts`
- `src/lib/components/ui/heading/heading.svelte`
- `src/lib/components/ui/heading/index.ts`
- `src/lib/components/ui/footer/footer.svelte`
- `src/lib/components/ui/footer/index.ts`
- `src/lib/components/ui/not-authorized/not-authorized.svelte`
- `src/lib/components/ui/not-authorized/index.ts`
- `src/lib/components/ui/index.ts` (updated)
- `src/lib/components/index.ts` (updated)

---

## Component Mapping

| React Component | Svelte Component | Changes |
|-----------------|------------------|---------|
| `LoadingSpinner` | `loading-spinner.svelte` | Same CSS animation |
| `Heading` | `heading.svelte` | Same layout, uses APP_CONFIG |
| `Footer` | `footer.svelte` | Same layout, uses APP_CONFIG |
| `NotAuthorized` | `not-authorized.svelte` | Better Auth signOut |

---

## Notes

- All components use the `sleek` utility class for transitions
- The `.loader` CSS animation is defined in `app.css`
- Components are server-renderable where possible
- The NotAuthorized component uses Better Auth's signOut instead of Kinde's LogoutLink
- Screen reader text is added to LoadingSpinner for accessibility
