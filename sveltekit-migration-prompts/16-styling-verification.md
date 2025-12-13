# 16 - Styling Verification

## Prerequisites

- `01-project-setup.md` through `15-static-assets-migration.md` completed

## Next Prompt

- `17-deployment-setup.md`

---

## MCP Servers to Use

Before implementing this prompt, use these MCP servers for accurate documentation:

| MCP Server   | Usage                                                                                                  |
| ------------ | ------------------------------------------------------------------------------------------------------ |
| **svelte**   | Use `get-documentation` for Svelte component styling patterns, class directives, and CSS scoping       |
| **context7** | Use `resolve-library-id` → `get-library-docs` for Tailwind CSS class utilities if styling issues arise |

### Recommended MCP Queries

```
svelte MCP:
- get-documentation: "styling", "scoped styles"
- get-documentation: "class directive"
- svelte-autofixer: Validate any components with styling issues

context7 MCP:
- resolve-library-id: "tailwindcss" → get-library-docs for specific utility classes
```

**Note**: This is a visual verification prompt. Use MCP servers only if you encounter specific styling discrepancies that need resolution.

---

## Objective

Perform comprehensive visual verification to ensure the SvelteKit app looks identical to the original Next.js app. This is a critical requirement of the migration.

---

## Instructions

### Step 1: Side-by-Side Comparison Setup

Run both apps simultaneously for comparison:

**Terminal 1 (Original Next.js):**

```bash
cd /path/to/original-order-processor
npm run dev
# Runs on http://localhost:3000
```

**Terminal 2 (New SvelteKit):**

```bash
cd /path/to/order-processor
bun run dev
# Runs on http://localhost:5173
```

### Step 2: Visual Comparison Checklist

Open both apps side-by-side and verify each item:

#### Global Layout

- [ ] Background color matches (`#0F0F0F`)
- [ ] Text color is white
- [ ] Font family matches (Geist)
- [ ] Footer position and styling
- [ ] Overall page structure

#### Heading Component

- [ ] Title text size (5xl mobile, 7xl desktop)
- [ ] Title font weight (bold)
- [ ] Tagline color (zinc-400)
- [ ] Spacing between title and tagline
- [ ] Center alignment

#### Button Component

- [ ] All variants render correctly
- [ ] Hover states match
- [ ] Active states match
- [ ] Disabled state opacity
- [ ] Focus ring appearance
- [ ] Border radius

#### Loading Spinner

- [ ] Animation speed matches
- [ ] Dot size and positioning
- [ ] Color (white)

#### Courier Picker

- [ ] Button sizing and padding
- [ ] Border color (zinc-800 default)
- [ ] Selected state (green border + bg)
- [ ] User default indicator
- [ ] Logo sizing
- [ ] Hover state

#### Order Processor (Drop Zone)

- [ ] Border style (dashed)
- [ ] Border color states
- [ ] Height matches (h-80)
- [ ] Width responsive behavior
- [ ] Hover state
- [ ] Disabled state opacity

#### Upload Component

- [ ] GIF animation
- [ ] Text content
- [ ] Disabled state styling

#### Download Component

- [ ] GIF animation
- [ ] Filename display
- [ ] File size formatting

#### User Component

- [ ] Layout (row on desktop, column on mobile)
- [ ] Name and email styling
- [ ] Link hover states
- [ ] Logout button styling

#### Not Authorized

- [ ] Red "Access Denied" text
- [ ] Message text
- [ ] Button styling

### Step 3: Responsive Design Check

Test at these breakpoints:

#### Mobile (< 640px)

- [ ] Column layout for main content
- [ ] Proper spacing
- [ ] Touch-friendly button sizes
- [ ] Footer visible

#### Tablet (640px - 1024px)

- [ ] Layout transitions correctly
- [ ] No horizontal overflow
- [ ] Readable text sizes

#### Desktop (> 1024px)

- [ ] Row layout for main content
- [ ] Proper max-widths
- [ ] Hover states work

### Step 4: Animation & Transition Check

- [ ] `.sleek` transitions (200ms ease-in-out)
- [ ] Active scale effect (scale-95)
- [ ] Hover color transitions
- [ ] Loading spinner rotation
- [ ] Focus ring transitions

### Step 5: Create Screenshot Comparison Tool

**src/routes/style-check/+page.svelte:**

```svelte
<!--
  Style Check Page
  Displays all UI states for visual verification
-->
<script lang="ts">
    import { Button, LoadingSpinner, Heading, Footer, NotAuthorized } from "$lib/components";
    import { COURIER_OPTIONS } from "$lib/config";
    import { cn } from "$lib/utils";

    let selectedCourier = $state("SteadFast");
</script>

<div class="min-h-screen space-y-16 p-8">
    <!-- Section: Heading -->
    <section class="flex flex-col items-center gap-4 border-b border-zinc-800 pb-8">
        <h2 class="text-sm tracking-wide text-zinc-500 uppercase">Heading Component</h2>
        <Heading />
    </section>

    <!-- Section: Buttons -->
    <section class="flex flex-col items-center gap-4 border-b border-zinc-800 pb-8">
        <h2 class="text-sm tracking-wide text-zinc-500 uppercase">Button Variants</h2>
        <div class="flex flex-wrap justify-center gap-4">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button disabled>Disabled</Button>
        </div>
        <div class="flex gap-4">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
        </div>
    </section>

    <!-- Section: Loading -->
    <section class="flex flex-col items-center gap-4 border-b border-zinc-800 pb-8">
        <h2 class="text-sm tracking-wide text-zinc-500 uppercase">Loading Spinner</h2>
        <LoadingSpinner />
    </section>

    <!-- Section: Courier Picker -->
    <section class="flex flex-col items-center gap-4 border-b border-zinc-800 pb-8">
        <h2 class="text-sm tracking-wide text-zinc-500 uppercase">Courier Picker</h2>
        <div class="flex flex-wrap justify-center gap-4">
            {#each COURIER_OPTIONS as option}
                {@const isSelected = selectedCourier === option.value}
                <button
                    onclick={() => (selectedCourier = option.value)}
                    class={cn(
                        "sleek flex flex-col items-center gap-3 rounded-xl border-2 p-6",
                        isSelected
                            ? "border-green-500 bg-green-500/10"
                            : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-600"
                    )}
                >
                    <img src={option.logo} alt={option.label} class="h-12 w-12 object-contain" />
                    <span class="text-sm font-medium text-zinc-300">{option.label}</span>
                </button>
            {/each}
        </div>
    </section>

    <!-- Section: Drop Zone States -->
    <section class="flex flex-col items-center gap-4 border-b border-zinc-800 pb-8">
        <h2 class="text-sm tracking-wide text-zinc-500 uppercase">Drop Zone States</h2>
        <div class="flex flex-wrap justify-center gap-8">
            <!-- Normal -->
            <div class="flex flex-col items-center gap-2">
                <div
                    class="flex h-48 w-64 items-center justify-center rounded-xl border-2 border-dashed border-zinc-700"
                >
                    <span class="text-zinc-400">Normal</span>
                </div>
            </div>
            <!-- Hover -->
            <div class="flex flex-col items-center gap-2">
                <div
                    class="flex h-48 w-64 items-center justify-center rounded-xl border-2 border-dashed border-zinc-500 bg-zinc-900/50"
                >
                    <span class="text-zinc-400">Hover</span>
                </div>
            </div>
            <!-- Disabled -->
            <div class="flex flex-col items-center gap-2">
                <div
                    class="flex h-48 w-64 items-center justify-center rounded-xl border-2 border-dashed border-zinc-800 opacity-50"
                >
                    <span class="text-zinc-400">Disabled</span>
                </div>
            </div>
        </div>
    </section>

    <!-- Section: Upload/Download GIFs -->
    <section class="flex flex-col items-center gap-4 border-b border-zinc-800 pb-8">
        <h2 class="text-sm tracking-wide text-zinc-500 uppercase">Animations</h2>
        <div class="flex gap-16">
            <div class="flex flex-col items-center gap-2">
                <img src="/upload.gif" alt="Upload" class="h-24 w-24" />
                <span class="text-sm text-zinc-400">Upload</span>
            </div>
            <div class="flex flex-col items-center gap-2">
                <img src="/download.gif" alt="Download" class="h-24 w-24" />
                <span class="text-sm text-zinc-400">Download</span>
            </div>
        </div>
    </section>

    <!-- Section: Logout Button -->
    <section class="flex flex-col items-center gap-4 border-b border-zinc-800 pb-8">
        <h2 class="text-sm tracking-wide text-zinc-500 uppercase">Logout Button</h2>
        <button
            class="sleek rounded-xl bg-red-500 px-12 py-3 text-sm font-bold text-white uppercase active:scale-95 active:bg-red-700 xl:hover:bg-red-700"
        >
            Log Out
        </button>
    </section>

    <!-- Section: Not Authorized -->
    <section class="flex flex-col items-center gap-4 border-b border-zinc-800 pb-8">
        <h2 class="text-sm tracking-wide text-zinc-500 uppercase">Not Authorized</h2>
        <div class="max-w-md">
            <NotAuthorized />
        </div>
    </section>

    <!-- Section: User Info -->
    <section class="flex flex-col items-center gap-4 border-b border-zinc-800 pb-8">
        <h2 class="text-sm tracking-wide text-zinc-500 uppercase">User Info Layout</h2>
        <div class="flex w-full max-w-4xl flex-col gap-8 text-zinc-400 md:flex-row md:justify-between">
            <div class="flex flex-col gap-2 text-sm">
                <span>
                    Name: <a href="#" class="sleek font-bold text-zinc-300 hover:text-zinc-400">Test User</a>
                </span>
                <span>
                    E-mail: <a href="#" class="sleek font-bold text-zinc-300 hover:text-zinc-400">test@example.com</a>
                </span>
            </div>
            <button class="sleek rounded-xl bg-red-500 px-12 py-3 text-sm font-bold text-white uppercase">
                Log Out
            </button>
        </div>
    </section>

    <Footer />
</div>
```

### Step 6: Fix Any Discrepancies

If you find styling differences, check:

1. **Missing Tailwind classes** - Ensure all classes are present
2. **CSS specificity** - Check if classes are being overridden
3. **Dark mode** - Verify `dark` class is on `<html>`
4. **Custom CSS** - Check `app.css` has all custom styles
5. **Font loading** - Verify Geist font is loading

### Step 7: Browser Testing

Test in multiple browsers:

- [ ] Chrome
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Edge

---

## Verification

```bash
bun run dev
```

1. Visit http://localhost:5173/style-check
2. Compare each section with the original app
3. Take screenshots if needed for documentation

---

## Files Created

- `src/routes/style-check/+page.svelte`

---

## Common Issues & Fixes

### Issue: Colors don't match

**Fix:** Check `app.css` @theme section has correct HSL values

### Issue: Transitions feel different

**Fix:** Verify `.sleek` class is defined with `duration-200 ease-in-out`

### Issue: Font looks different

**Fix:** Ensure Geist font is loading from Google Fonts in `app.html`

### Issue: Spacing is off

**Fix:** Compare Tailwind spacing classes (gap-X, p-X, m-X)

### Issue: Active states not working on mobile

**Fix:** Use `active:` prefix, not `:active` pseudo-class

---

## Notes

- This step is critical - visual fidelity is a core requirement
- The style-check page can be removed before production
- Take screenshots for documentation if needed
- Test on actual mobile devices if possible
