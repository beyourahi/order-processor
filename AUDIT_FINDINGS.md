# Audit Findings — Order Processor

Full-codebase audit & remediation. Severity-ranked, evidence-backed, with live fix
status. The originally-reported "duplicate content while scrolling" symptom was
**withdrawn by the user** (no duplicates exist); static analysis independently
confirmed every section renders exactly once. That domain is closed — see
_Dismissed_.

## Architecture Overview

- **Stack:** SvelteKit 2 / Svelte 5 runes · TypeScript (strict) · Tailwind CSS 4
  (`@theme inline` tokens in `src/app.css`) · shadcn-svelte primitives
  (`src/lib/components/ui`) · GSAP via the SSR-safe `src/lib/motion` loader ·
  Cloudflare Workers + D1 + Better Auth.
- **Routes:** `/` (auth-gated order processor), `/login`, `api/{brand-settings,
copilot/chat,logout}`. `+layout.server.ts` loads user/session; `+page.server.ts`
  loads brand settings from D1.
- **Composition:** `+layout.svelte` renders `{@render children()}` + `Footer` once
  and gates the Copilot rail (desktop `<aside>` + mobile FAB/sheet/confirm) to `/`.
  `+page.svelte` renders Heading, User (fixed), OrderProcessor, CourierPicker,
  SteadFastSettings — each once, revealed via `use:reveal` (GSAP, reduced-motion safe).
- **State:** closure-based runes singletons (`brand-settings`, `app`, `copilot`,
  `copilot-bridge`), not `writable()`.
- **Design system:** color/radius/shadow/chat tokens are wired into Tailwind and
  used widely. The **typography token scale was defined but had zero call sites**
  (drift — see F-011/F-012).

## Finding Schema

`ID · Category · Severity · Location · Description · Root cause · Evidence ·
Fix · Status`

Categories: duplication · ui · ux · a11y · responsive · bug · code-quality ·
performance.

---

## Findings

### Type safety / code-quality

- **F-001 · code-quality · high · `editor-row.svelte:81,85`**
  Checkbox `onclick`/`onkeydown` call `onToggleSelect(e as unknown as MouseEvent)` —
  the `onkeydown` handler forces a `KeyboardEvent` through `unknown` into
  `MouseEvent`. Root cause: `onToggleSelect` was typed `(event: MouseEvent)` but
  only reads `.shiftKey` (present on both event types).
  Fix: widen the callback type to `MouseEvent | KeyboardEvent` through the chain
  (editor-row → editor-grid → output-editor `toggleSelect`) and drop both casts.
  **Status: fixed**

- **F-002 · code-quality · medium · `lib/ai/client.ts:76`**
  `(await ai.run(...)) as ReadableStream<Uint8Array>` blindly trusts the Workers-AI
  binding to return a stream. Fix: guard with `instanceof ReadableStream` and emit a
  friendly `error` frame otherwise (no behavior change on the happy path).
  **Status: fixed**

- **F-003 · code-quality · low · `lib/ai/client.ts:100`, `hooks.server.ts:95,105`,
  `brand-settings.svelte.ts:70`**
  Boundary casts: SSE `JSON.parse(...) as StreamChunk` (already guarded by optional
  chaining), E2E-bypass `as App.Locals["user"|"session"]` (preview-only synthetic
  session), and `Object.keys(...) as FieldKey[]` (TS `Object.keys` limitation).
  Reviewed: these are idiomatic, runtime-safe boundary casts; rewriting them adds
  complexity/risk at the auth + model boundaries for no safety gain.
  **Status: kept (documented)**

### Accessibility

- **F-004 · a11y · medium · `upload.svelte:27`**
  Decorative upload GIF has `alt="Upload animation"`, duplicating adjacent text for
  screen readers. Fix: `alt=""` (decorative).
  **Status: fixed**

- **F-005 · a11y · medium · `courier-picker.svelte`**
  Selected courier button conveys selection only visually. Fix: add
  `aria-pressed={isSelected}`.
  **Status: fixed**

- **F-006 · a11y · medium · `output-editor.svelte:467` (discard modal)**
  Custom modal uses `role="dialog"` with no focus trap and isn't an alert. Fix:
  `role="alertdialog"` + Tab focus trap (mirroring the working trap in
  `copilot-mobile-sheet.svelte`).
  **Status: fixed**

- **F-007 · a11y · medium · `+page.svelte`, `steadfast-settings.svelte:76`**
  Heading order: `<h1>` then sections with no programmatic heading; the SteadFast
  divider label is a `<span>`. Fix: add `sr-only` section headings and promote the
  settings label to a heading.
  **Status: fixed**

- **F-008 · a11y · low · `order-processor.svelte` (dropzone)**
  `role="button"` dropzone has no accessible name. Fix: add a state-aware
  `aria-label`.
  **Status: fixed**

- **F-009 · a11y · low · `copilot-message.svelte:54`**
  User image has generic `alt="Attached"` and no load-error fallback. Fix: clearer
  alt + `onerror` fallback.
  **Status: fixed**

### UI consistency / token drift

- **F-010 · ui · medium · `app.css:276–284`**
  Scrollbar uses hardcoded hex `bg-[#0F0F10]` (×3), bypassing the token system.
  Fix: introduce a `--scrollbar` / `--color-scrollbar` token and reference it.
  **Status: fixed**

- **F-011 · code-quality · medium · `app.css:190–205` (`@theme inline`)**
  The custom typography scale (`--text-caption…--text-display`, all `--leading-*`,
  `--tracking-*`) has **zero** call sites (verified by grep). Fully adopting it
  would be a redesign (out of scope). Fix: remove the unused tokens as dead code;
  retain `--text-micro` (the one micro size used repeatedly) for F-012.
  **Status: fixed**

- **F-012 · ui · low · editor-grid, batch-defaults-strip, copilot-{image-upload,
  message,composer}**
  `text-[10px]` (= `0.625rem`) hardcoded in ~5 places. Fix: replace with the
  retained `text-micro` token (pixel-identical). `text-[11px]`/`[9px]` left as-is
  (no pixel-exact token/utility — converting would shift the design).
  **Status: fixed**

- **F-013 · ui · low · `editor-cell.svelte:223`**
  `before:w-[2px]` arbitrary value. Fix: `before:w-0.5` (exact equivalent).
  **Status: fixed**

### Dead code

- **F-014 · code-quality · low · `lib/components/features/copilot/index.ts`**
  Barrel re-exports `CopilotHeader, CopilotWelcome, CopilotMessageList,
CopilotComposer, CopilotTypingIndicator, CopilotImageUpload`, but all six are
  consumed only via direct relative imports inside the folder — never through the
  barrel. Fix: trim to the four exports `features/index.ts` actually re-uses.
  (`ui/button` barrel's unused `Root`/`Props` aliases are **kept** — standard
  shadcn-svelte vendor convention regenerated by the CLI.)
  **Status: fixed**

---

## Dismissed (false positives — investigated, no change)

- **Copilot "rendered twice"** (`+layout.svelte` aside vs `copilot-mobile-sheet`):
  intentional responsive pattern; mutually exclusive by viewport; share one
  singleton store (`copilot.svelte.ts`). Not duplication.
- **`copilot-composer.svelte:32` `void value` in `$effect`**: correct reactive
  dependency tracking for textarea auto-resize — removing it breaks resize.
- **`copilot.svelte.ts` `pendingConfirmations = [...]` / `output-editor` `editorOpen`
  `$effect` mirror**: idiomatic Svelte 5, not anti-patterns.
- **`editor-grid.svelte` "missing empty state"**: already implemented
  (`{:else}` "No orders yet — click Add row…").
- **`copilot-message.svelte` `Date.parse`**: already NaN-guarded.
- **`copilot-confirm-dialog.svelte:64` index `(i)` key**: `diff` is a static
  snapshot, never reordered — safe.
- **`user.svelte` `role="group"`**: already has `aria-label`.
- **`min-h-[44px]` touch targets / `min-w-[10rem]` column widths**: deliberate
  (WCAG target size / layout), not drift — left untouched.

---

## Verification

- `bun run check` — clean (0 errors).
- `bun run lint` — clean (prettier + eslint).
- `bun run build` — succeeds (SSR / Workers compatibility).
