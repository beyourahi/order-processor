# 04 - shadcn/ui Setup

## Prerequisites
- `01-project-setup.md` completed
- `02-cloudflare-configuration.md` completed
- `03-tailwind-setup.md` completed

## Next Prompt
- `05-better-auth-setup.md`

---

## Objective

Set up shadcn/svelte with bits-ui and migrate the Button component with CVA variants. The Button must be visually identical to the original Radix UI implementation.

---

## Instructions

### Step 1: Install bits-ui

bits-ui provides the primitive components that shadcn/svelte is built on:

```bash
bun add bits-ui
```

### Step 2: Create components.json

**components.json:**
```json
{
    "$schema": "https://shadcn-svelte.com/schema.json",
    "style": "new-york",
    "tailwind": {
        "config": "",
        "css": "src/app.css",
        "baseColor": "zinc"
    },
    "aliases": {
        "components": "$lib/components",
        "utils": "$lib/utils"
    },
    "typescript": true
}
```

### Step 3: Create UI Directory Structure

```bash
mkdir -p src/lib/components/ui
```

### Step 4: Create Button Component

**src/lib/components/ui/button/index.ts:**
```typescript
import Root from "./button.svelte";

export {
    Root,
    Root as Button,
    type ButtonProps,
    type ButtonSize,
    type ButtonVariant,
    buttonVariants
} from "./button.svelte";
```

**src/lib/components/ui/button/button.svelte:**
```svelte
<script lang="ts" module>
    import { cva, type VariantProps } from "class-variance-authority";

    export const buttonVariants = cva(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        {
            variants: {
                variant: {
                    default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
                    destructive: "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90",
                    outline: "border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
                    secondary: "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
                    ghost: "hover:bg-accent hover:text-accent-foreground",
                    link: "text-primary underline-offset-4 hover:underline"
                },
                size: {
                    default: "h-9 px-4 py-2",
                    sm: "h-8 rounded-md px-3 text-xs",
                    lg: "h-10 rounded-md px-8",
                    icon: "h-9 w-9"
                }
            },
            defaultVariants: {
                variant: "default",
                size: "default"
            }
        }
    );

    export type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];
    export type ButtonSize = VariantProps<typeof buttonVariants>["size"];

    export interface ButtonProps {
        variant?: ButtonVariant;
        size?: ButtonSize;
        class?: string;
        disabled?: boolean;
        type?: "button" | "submit" | "reset";
    }
</script>

<script lang="ts">
    import { cn } from "$lib/utils";

    let {
        variant = "default",
        size = "default",
        class: className,
        disabled = false,
        type = "button",
        children,
        ...restProps
    }: ButtonProps & { children?: import("svelte").Snippet } = $props();
</script>

<button
    type={type}
    class={cn(buttonVariants({ variant, size, className }))}
    disabled={disabled}
    {...restProps}
>
    {@render children?.()}
</button>
```

### Step 5: Create Index Export for UI Components

**src/lib/components/ui/index.ts:**
```typescript
export * from "./button";
```

### Step 6: Create Main Components Index

**src/lib/components/index.ts:**
```typescript
// UI Components
export * from "./ui";

// Feature components will be added here during migration
```

### Step 7: Test Button Component

Update the test page:

**src/routes/+page.svelte:**
```svelte
<script lang="ts">
    import { Button } from "$lib/components/ui/button";
</script>

<div class="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
    <h1 class="text-4xl font-bold">Button Component Test</h1>

    <div class="flex flex-wrap gap-4">
        <!-- Default variants -->
        <Button>Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
    </div>

    <div class="flex flex-wrap gap-4">
        <!-- Sizes -->
        <Button size="sm">Small</Button>
        <Button size="default">Default</Button>
        <Button size="lg">Large</Button>
        <Button size="icon">I</Button>
    </div>

    <div class="flex flex-wrap gap-4">
        <!-- States -->
        <Button disabled>Disabled</Button>
    </div>

    <!-- Custom styled button (matching logout button style) -->
    <button class="sleek rounded-xl bg-red-500 px-12 py-3 text-sm font-bold text-white uppercase active:scale-95 active:bg-red-700 xl:hover:bg-red-700">
        Log Out (Custom)
    </button>

    <!-- Loader test -->
    <div class="loader"></div>
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
1. All button variants render correctly
2. Hover states work on desktop
3. Active states work on mobile
4. Disabled state shows reduced opacity
5. Focus ring appears on keyboard focus
6. Custom logout button matches original styling

---

## Files Created

- `components.json`
- `src/lib/components/ui/button/index.ts`
- `src/lib/components/ui/button/button.svelte`
- `src/lib/components/ui/index.ts`
- `src/lib/components/index.ts`

---

## Button Usage Reference

```svelte
<!-- Basic usage -->
<Button>Click me</Button>

<!-- With variant -->
<Button variant="destructive">Delete</Button>

<!-- With size -->
<Button size="lg">Large Button</Button>

<!-- Combined -->
<Button variant="outline" size="sm">Small Outline</Button>

<!-- Custom classes -->
<Button class="w-full">Full Width</Button>
```

---

## Notes

- The Button component uses Svelte 5 runes (`$props()`)
- CVA (class-variance-authority) handles variant logic
- The `cn()` utility merges Tailwind classes
- No Radix UI dependency needed - pure Svelte implementation
- The `asChild` pattern from Radix is not needed for this app (not used in original)

---

## Original React Button Reference

The original React button used:
```tsx
import { Slot } from "@radix-ui/react-slot";
const Comp = asChild ? Slot : "button";
```

Since the `asChild` prop was not actually used anywhere in the app, we've simplified to a standard button element. If you need polymorphic behavior later, bits-ui provides similar primitives.
