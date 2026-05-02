# Codebase Audit Report — order-processor

**Date**: 2026-05-01
**Audited by**: Claude Code (automated audit + fix session)
**Status**: All findings resolved

---

## Summary

Full audit of the SvelteKit order-processor application across 8 domains. All 25 findings were resolved in a single session using parallel git worktrees (Batches A–E).

Additionally, the SteadFast settings form was rewritten with debounced auto-save (no "Save Changes" button), AbortController-based request cancellation, exponential backoff retry, and ARIA live-region status indicators.

---

## Findings & Resolutions

### UI/UX Consistency

| ID     | File                                              | Finding                                                           | Resolution                                                                                                  |
| ------ | ------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| UI-001 | `src/app.html:18`                                 | Hardcoded `bg-[#0F0F0F]` bypasses token system                    | Replaced with `bg-background`                                                                               |
| UI-002 | `src/app.css:135`                                 | Hardcoded `#0F0F0F` in base layer                                 | Replaced with `@apply bg-background text-white`; `--color-background` token corrected to `oklch(0.065 0 0)` |
| UI-003 | `src/app.css:70,83,91`                            | Hardcoded `#fff` in `@keyframes loader`                           | Replaced with `white`                                                                                       |
| UI-004 | 4 component files                                 | Inline spinner divs duplicated 4 ways; `LoadingSpinner` unused    | Extended `LoadingSpinner` with `size` and `colorClass` props; replaced all 4 inline spinners                |
| UI-005 | Multiple                                          | Mixed `focus:` / `focus-visible:` usage; inconsistent ring colors | Standardized to `focus-visible:ring-2` across all interactive elements                                      |
| UI-006 | `footer.svelte:12-18`                             | Footer `<a>` had no focus ring                                    | Added `focus-visible:ring-2 focus-visible:ring-white/50`                                                    |
| UI-007 | 3 component files                                 | Three different error display implementations                     | Standardized to `text-destructive` / `bg-destructive/10`                                                    |
| UI-008 | `user.svelte:92`                                  | `text-[10px]` below Tailwind scale                                | Replaced with `text-xs`                                                                                     |
| UI-009 | `courier-picker.svelte`, `order-processor.svelte` | `ring-offset-[#0F0F0F]` hardcoded hex                             | Replaced with `ring-offset-background`                                                                      |

### Design System Alignment

| ID     | File                                                          | Finding                                             | Resolution                                                                                                                                                                                               |
| ------ | ------------------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DS-001 | `src/app.css`, `courier-picker.svelte`, `input.svelte`        | Emerald green used but not tokenized                | Added `--color-courier-accent: oklch(0.69 0.17 162)` to `@theme`; consumed via `bg-courier-accent`/`border-courier-accent` in courier-picker and `focus-visible:ring-courier-accent/50` in input         |
| DS-002 | Throughout                                                    | `zinc-{700,800,900}` used directly                  | Added `--color-surface` / `--color-surface-raised` / `--color-border-strong` tokens with exact Tailwind v4 zinc OKLCH values; mechanically replaced 16 occurrences across 5 components (pixel-identical) |
| DS-003 | `login/+page.svelte`, `order-processor.svelte`, `user.svelte` | `red-400`/`red-500/10` instead of destructive token | Replaced all `text-red-400`, `bg-red-500/10`, `border-red-500/50`, `ring-red-500/50` usages with destructive-token equivalents                                                                           |
| DS-004 | `steadfast-settings.svelte`                                   | Input styling block repeated 3×                     | Created `src/lib/components/ui/input/input.svelte` (CVA-style); replaced all 3 blocks                                                                                                                    |

### Component Structure

| ID       | File                         | Finding                                     | Resolution                                                                                      |
| -------- | ---------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| COMP-001 | `session-provider.svelte:23` | Legacy `onMount()` in Svelte 5 codebase     | Migrated to `$effect(() => { ...; return () => clearInterval(id); })`                           |
| COMP-002 | `download.svelte:17-23`      | Inline `formatFileSize` duplicates `csv.ts` | Removed inline; imported from `$lib/utils`                                                      |
| COMP-003 | `+error.svelte:17`           | Status code in `<h1>` (semantically wrong)  | Status code moved to `<p>` with `aria-label="HTTP status code {n}"`; message promoted to `<h1>` |

### Backend / API

| ID      | File                                    | Finding                                                 | Resolution                                                                                                                                                   |
| ------- | --------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| API-001 | `brand-settings/+server.ts:17,41`       | `platform!.env.DB` non-null assertion                   | Added `if (!platform?.env?.DB) return error(503, ...)` guard                                                                                                 |
| API-002 | `hooks.server.ts:88,90-91`              | `BETTER_AUTH_SECRET ?? ""` silent fallback              | Added `console.error` warning when secret is missing in production context                                                                                   |
| API-003 | `brand-settings/+server.ts:43-51`       | POST body not validated for shape/types                 | Added `ALLOWED_BODY_KEYS` set check and string-type validation                                                                                               |
| API-004 | `brand-settings/+server.ts`             | Mixed `error()` and `json({ success: false })` patterns | Standardized: `error()` for auth/validation, `json({ success: true })` for success                                                                           |
| API-005 | `logout/+server.ts`                     | No error handling on cookie operations                  | POST wrapped in try/catch returning `json({ success: false })`; GET logs failures via `console.error` before redirect (must redirect for browser navigation) |
| API-006 | `brand-settings/+server.ts:12-13,36-37` | Auth check duplicated in GET and POST                   | Extracted to `requireAuth(locals)` helper                                                                                                                    |

### Architecture & Standards

| ID       | File                                 | Finding                                                                     | Resolution                                     |
| -------- | ------------------------------------ | --------------------------------------------------------------------------- | ---------------------------------------------- |
| ARCH-001 | `src/lib/types/user.ts:15`           | `merchant_id` snake_case in TypeScript interface                            | Renamed to `merchantId`; updated all consumers |
| ARCH-002 | `src/lib/constants/indexes.ts:10-56` | `SHOPIFY_EXPORT_INDEXES` dead export                                        | Removed entirely                               |
| ARCH-003 | `svelte.config.js:8-13`              | 5 unused path aliases (`$src`, `$components`, etc.)                         | Removed all 5 alias definitions                |
| ARCH-004 | `src/lib/utils/index.ts`             | `formatFileSize`, `generateExcelBlob`, `parseCSVString` not barrel-exported | Added missing re-exports                       |

### Naming & Standards

| ID      | File                                 | Finding                                           | Resolution                                                                                                            |
| ------- | ------------------------------------ | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| STD-001 | `src/lib/utils/csv.ts:55`            | Magic number `1024` appears 3×                    | Extracted `const BYTES_PER_UNIT = 1024`                                                                               |
| STD-002 | `src/lib/constants/indexes.ts:73-80` | Comment claimed `address` column index; incorrect | Fixed comment to accurately document `[ShippingName(34), ShippingAddress1(36), Phone(43), TotalPrice(11), Notes(44)]` |

---

## Auto-Save Feature (SteadFast Settings)

The SteadFast settings form was rewritten with the following behavior:

- **No "Save Changes" button** — saves automatically on input
- **500ms debounce** — pending saves cancelled on each keystroke via `setTimeout` / `clearTimeout`
- **AbortController** — in-flight fetch requests cancelled when new save triggered
- **Exponential backoff** — 3 retries with 1s / 2s / 4s delays
- **Finite state machine** — `idle → loading → saving → saved → error` with ARIA live region (`aria-live="polite"`) announcing state changes
- **`beforeunload` guard** — warns on navigation while save is in progress
- **`<Input>` component** — all 3 raw input blocks replaced with the new shared component

---

## Intentional Patterns (Not Changed)

- Google OAuth brand colors in SVG — required by Google brand guidelines
- `slice(1, -1)` in `data-processing.ts` — documented in CLAUDE.md
- Bangladesh phone number normalization — courier-specific, correct behavior
- `drizzle-kit` version — intentional per CLAUDE.md warning
- (none — DS-002 resolved 2026-05-02 in follow-up pass)

---

## Verification

- `bun run check`: 0 errors, 0 warnings (1175 files)
- `bun run lint`: All files pass Prettier + ESLint
- Visual: 24 screenshots captured (3 pages × 8 viewports: 320/375/430/768/1024/1280/1440/1920px)
    - Login page: dark background correct at all breakpoints
    - Error page: 404 in `<p>`, "Not Found" as `<h1>`, correct layout
    - Main page: auto-save form, `Input` components, no layout breaks
