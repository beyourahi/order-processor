# Order Processor

## Always Do First

**Invoke the `frontend-design` skill** before writing any frontend code, every session, no exceptions.

## Parallel Workflow & Git Strategy -- READ FIRST

**NEVER CREATE NEW BRANCHES.** Use git worktrees for parallel work:

```bash
# Create a worktree for a feature
git worktree add ../order-processor-<feature> main

# List active worktrees
git worktree list

# Remove a worktree when done
git worktree remove ../order-processor-<feature>

# Clean up stale worktree references
git worktree prune
```

All commits go directly to `main`. No feature branches. No PRs for solo work. Worktrees allow parallel development without branch switching or stashing.

**Always break large tasks into focused scopes** — run parallel agents with git worktrees, each with a narrow, well-defined goal.

## Project Overview

SvelteKit application that converts Shopify order export CSVs into courier-ready Excel files for the SteadFast delivery service in Bangladesh. Any authenticated Google user is authorized — upload CSV files, the app auto-detects Shopify format, extracts and normalizes order data (names, addresses, phone numbers), and produces downloadable `.xlsx` files matching SteadFast's import schema. Deployed on Cloudflare Workers with D1 (SQLite) for auth sessions and brand settings.

**Production URL**: `https://order-processor.beyourahi.workers.dev`

## Tech Stack

| Layer           | Technology                                                                             |
| --------------- | -------------------------------------------------------------------------------------- |
| Framework       | SvelteKit 2.x (Svelte 5 with runes)                                                    |
| Language        | TypeScript 6.x (strict mode, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) |
| Styling         | Tailwind CSS 4.x (via `@tailwindcss/vite` plugin)                                      |
| UI Components   | shadcn-svelte (new-york style, zinc base color) + CVA                                  |
| Auth            | Better Auth with Google OAuth, Drizzle adapter                                         |
| Database        | Cloudflare D1 (SQLite) via Drizzle ORM                                                 |
| CSV Parsing     | PapaParse                                                                              |
| Excel Export    | SheetJS (`xlsx`)                                                                       |
| Deployment      | Cloudflare Workers (adapter-cloudflare)                                                |
| AI Copilot      | Cloudflare Workers AI (`@cf/openai/gpt-oss-120b`), Zod tool schemas, `@lucide/svelte`  |
| Package Manager | Bun                                                                                    |
| Linting         | ESLint 10 flat config + Prettier                                                       |

## Core Architecture

### Data Processing Pipeline

```
CSV Upload --> PapaParse --> Auto-detect Shopify format --> Extract/deduplicate columns
  --> Normalize phone numbers (BD +880 format) --> CourierProcessor --> in-app output editor --> xlsx export
```

1. **Upload**: User uploads CSV, parsed client-side via PapaParse
2. **Detection**: `CourierService.isShopifyExport()` checks header columns
3. **Preparation**: Data cleaned, deduplicated, and columns extracted
    - `prepareSteadFastOrderData()` -- standard CSV with known column indexes
    - `prepareShopifySteadFastOrderData()` -- Shopify export with address concatenation (cols 36+37+39)
4. **Processing**: `SteadFastProcessor.processOrders()` maps to courier schema
5. **Review** (optional): User edits the mapped batch in the in-app output editor grid before download
6. **Export**: SheetJS generates `.xlsx` file for download

### Service Layer

```
CourierService (orchestrator)
  --> isShopifyExport() -- format detection
  --> processors Map<Courier, CourierProcessor<T>>
      --> SteadFastProcessor -- implements CourierProcessor<SteadFastOrder>
  --> data-processing.ts -- prepareSteadFastOrderData() / prepareShopifySteadFastOrderData() -- dedup + column extraction
```

The `CourierProcessor<T>` interface is generic -- new couriers implement `processOrders(data, user): T[]`.

### Client State & API Layer

```
$lib/api/client.ts
  --> api.{get,post,patch,put,delete}<T>()  -- typed fetch wrapper, throws on non-2xx
  --> debounceSync(key, delayMs, fn, opts)   -- per-key debounce with onState callbacks

$lib/stores/brand-settings.svelte.ts        -- closure-based runes store (NOT writable())
  --> brandSettings.value                   -- reactive BrandSettingsState
  --> brandSettings.hydrate(initial)        -- called synchronously in +page.svelte via untrack()
  --> brandSettings.updateField(key, value) -- debounces PATCH /api/brand-settings with retry

$lib/stores/app.svelte.ts                   -- thin facades over brandSettings
  --> courierService.value / .setSelected() -- reads/writes selectedCourier via brandSettings
  --> hasMerchantId()                       -- function (not a derived store)
```

- Stores use `.svelte.ts` extension and Svelte 5 `$state` runes internally — do not import from `.ts` files that don't use runes context.
- `brandSettings` is a module singleton. `hydrate()` is called synchronously via `untrack()` in `+page.svelte` so children read canonical server values during their own mount — do NOT move hydration into `$effect`, that race was fixed in `6d9d68b`.

### AI Copilot

A conversational assistant docked beside the output editor that edits the batch via
natural-language tool calls. Split architecture — the **server only decides** tool calls,
the **browser executes** them.

```
copilot-sidebar.svelte --> chat-client.sendMessage()
  --> POST /api/copilot/chat  (stateless: client ships full history + rendered CURRENT STATE)
      --> client.runChatFrames() --> env.AI (@cf/openai/gpt-oss-120b, streaming)
      --> sseStream() yields Frame union: text | tool_call | end | error
  --> streamFrames() --> executor.executeToolCall()  (runs IN THE BROWSER)
      --> validates args (Zod) --> safety.ts anomaly check --> confirmation dialog
      --> mutates the grid via copilotBridge.editor --> pushes AI undo snapshot
```

- **Model**: `@cf/openai/gpt-oss-120b` via the `AI` Worker binding (OpenAI-compatible chat +
  tool calls). Image turns route through `@cf/meta/llama-3.2-11b-vision-instruct` for
  transcription. `MODEL_ID` lives in `$lib/ai/client.ts`.
- **The bridge** (`$lib/stores/copilot-bridge.svelte.ts`): `output-editor.svelte` registers
  an `EditorController`, `order-processor.svelte` an `IngestionController`. Grid tools fail
  gracefully when nothing is registered (no CSV loaded).
- **Tools** (`$lib/ai/tools-catalog.ts` + `schemas.ts`): 11 typed tools — `editCells`,
  `setBatchDefaults`, `addRows`, `deleteRows`, `autoFixWarnings`, `updateBrandSettings`,
  `proposeCsvColumnMapping`, `getBatchSummary`, `getRows`, `flagAnomalies`, `undoLastChange`.
- **Undo is separate** from the editor's native Cmd+Z (`copilot.undoStack`): each mutation
  snapshots full editor state; reverting restores it. Tool-card Undo + `undoLastChange` pop it.
- **Confirmation** (`copilot-confirm-dialog.svelte`): any mutation touching > 1 row shows a
  diff panel before applying. Enforced centrally in `executor.ts`.
- **State** (`$lib/stores/copilot.svelte.ts`): conversations + messages are in-memory only —
  they clear on reload, matching the ephemeral CSV batch. No D1 tables.

### Authentication Flow

```
Google OAuth --> Better Auth --> D1 sessions --> hooks.server.ts
  --> event.locals.user / session / currentUser
  --> Any authenticated Google user is authorized (authentication is the sole gate)
```

- Auth instance created per-request (Cloudflare Workers provide D1 binding per-request)
- `createAuth()` factory in `$lib/server/auth.ts` -- not a singleton
- Session: 7-day expiry, rolling (updated daily), cookie-cached (5 min)
- Cookie prefix: `order-processor`, secure-only
- `getCurrentUser()` maps session user to `CurrentUser { name, email }` — any authenticated user is authorized
- Rate limiting enabled (20 req/min, D1-backed) — applies across all Cloudflare edge nodes
- `App.Locals` user/session types derived via `Auth["$Infer"]["Session"]` — don't inline them manually

### Database Schema (Drizzle ORM)

Tables in `src/lib/server/schema.ts`:

- `users` -- authenticated user profiles
- `sessions` -- active sessions (indexed on `user_id`)
- `accounts` -- OAuth provider connections (composite unique on `provider_id` + `account_id`)
- `verifications` -- OAuth state/email verification tokens
- `brand_settings` -- editable contact info per user (contact_name, contact_phone, merchant_id, selected_courier), linked via `user_id` FK
- `rate_limits` -- request counts per IP+path for Better Auth's D1-backed rate limiter (20 req/60s)

All columns use `snake_case` (required by Better Auth Drizzle adapter with `usePlural: true`).

### Project Structure

```
src/
  routes/
    +layout.svelte / +layout.server.ts   -- root layout, loads user/session
    +page.svelte / +page.server.ts       -- main page; loads brandSettings from D1 + hydrates store
    +error.svelte                         -- error boundary
    login/                               -- login page with Google OAuth
    api/brand-settings/+server.ts        -- brand settings CRUD (GET + PATCH)
    api/copilot/chat/+server.ts          -- AI Copilot streaming chat endpoint (SSE, Workers AI)
    api/logout/+server.ts                -- logout endpoint
  lib/
    auth-client.ts                       -- Better Auth client (`authClient`); use authClient.signIn/signOut/useSession directly — no named re-exports
    assets/                              -- static assets (upload.gif, steadfast.png)
    api/
      client.ts                          -- typed api object (get/post/patch/put/delete) + debounceSync
    ai/                                  -- AI Copilot: types, schemas (Zod), tools-catalog, prompts, context,
                                            client (Workers AI), streaming, chat-client, executor, safety, markdown
    server/
      auth.ts                            -- createAuth() factory
      schema.ts                          -- Drizzle ORM schema (6 tables)
    components/
      features/                          -- order-processor, upload, courier-picker, user, steadfast-settings
      features/output-editor/            -- in-app editable courier-batch grid; output-editor.svelte (entry) + action-bar, batch-defaults-strip, editor-grid/row/cell, columns.ts
      features/copilot/                  -- AI Copilot UI; copilot-sidebar.svelte (entry) + message, tool-badge, anomaly-warning, conversations-panel, confirm-dialog, mobile-fab, mobile-sheet, launcher-icon
      ui/                                -- button, footer, heading, input, loading-spinner, table (shadcn-svelte)
    config/
      app.ts                             -- app metadata
      couriers.ts                        -- courier options with logos
    constants/
      files.ts                           -- file-related constants
      indexes.ts                         -- CSV column index mappings
    services/
      courier-service.ts                 -- main orchestrator
      data-processing.ts                 -- CSV prep utilities
      processors/steadfast.ts            -- SteadFast processor
    stores/
      app.svelte.ts                      -- courierService facade + hasMerchantId() (backed by brandSettings store)
      brand-settings.svelte.ts           -- closure-based runes store with hydrate, debounce, retry, SaveState
      copilot.svelte.ts                  -- Copilot runes store: conversations, messages, confirmations, AI undo stack
      copilot-bridge.svelte.ts           -- editor <-> Copilot bridge (EditorController / IngestionController registration)
    hooks/use-current-user.ts            -- getCurrentUser() derives CurrentUser from the session user
    types/                               -- courier.ts, user.ts, ui.ts, brand-settings.ts (includes SaveState)
    utils/                               -- cn() (clsx + tailwind-merge), csv.ts, excel.ts, phone.ts, validate.ts, types.ts
  hooks.server.ts                        -- auth middleware + security headers
  hooks.client.ts                        -- client-side hooks
  app.css                                -- global Tailwind styles (includes 16px touch-device font floor)
  app.d.ts                               -- App.Locals, App.Platform, App.PageData, App.Error
  app.html                               -- HTML shell
```

### Path Aliases

```
$lib     --> src/lib (SvelteKit default, only configured alias)
```

All imports use `$lib/...` — the other aliases (`$src`, `$components`, `$config`, `$services`, `$types`) are not configured and do not exist.

## Common Commands

```bash
# Development
bun run dev              # Vite dev server on :5173
bun run build            # Production build
bun run preview          # Build + wrangler dev (local Cloudflare preview on :8787)
bun run deploy           # Build + deploy to Cloudflare Workers

# Type Checking & Linting
bun run check            # svelte-kit sync + svelte-check
bun run check:watch      # same, in watch mode
bun run lint             # prettier --check + eslint
bun run format           # prettier --write

# Cloudflare
bun run cf-typegen       # regenerate worker-configuration.d.ts

# Database (Drizzle Kit + D1)
bun run db:generate      # generate migration SQL from schema changes
bun run db:migrate:local # apply migrations to local D1
bun run db:migrate       # apply migrations to remote/production D1
bun run db:migrate:list  # list applied migrations (local)
bun run db:push          # push schema directly (needs D1 credentials)
bun run db:studio        # Drizzle Studio GUI (needs D1 credentials)
bun run db:check         # validate migration state
bun run db:pull          # pull remote schema
```

### Database Migration Workflow

1. Edit schema in `src/lib/server/schema.ts`
2. `bun run db:generate` -- creates SQL in `migrations/`
3. Review the generated SQL before applying
4. `bun run db:migrate:local` -- test locally
5. `bun run dev` -- verify the app works
6. `bun run db:migrate` -- apply to production
7. Commit migration files alongside schema changes

For `db:push` and `db:studio`, set `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_DATABASE_ID`, and `CLOUDFLARE_D1_TOKEN` env vars.

## Code Style Guidelines

### Prettier

- 4-space indentation (no tabs)
- Double quotes
- No trailing commas
- 120 character print width
- Plugins: `prettier-plugin-svelte`, `prettier-plugin-tailwindcss`

### ESLint

- Flat config (`eslint.config.js`) with `@eslint/js`, `typescript-eslint`, `eslint-plugin-svelte`, `eslint-config-prettier`
- Unused vars allowed with `_` prefix: `argsIgnorePattern: "^_"`, `varsIgnorePattern: "^_"`
- `svelte/no-navigation-without-resolve` disabled (app does not use a base path)
- Ignored: `build/`, `.svelte-kit/`, `dist/`, `node_modules/`, `scripts/`, `worker-configuration.d.ts`

### TypeScript

- Strict mode with additional flags: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `verbatimModuleSyntax`
- Use `$lib/` alias imports, never relative paths from route files
- Barrel exports (`index.ts`) in every module directory
- Type optional properties with explicit `| undefined` for `exactOptionalPropertyTypes` compatibility (see `app.d.ts` Locals)

### Svelte 5 Patterns

```svelte
<script lang="ts">
    // State (NOT writable stores for component-local state)
    let value = $state("");
    let derived = $derived(value.length);

    // Props
    let { user, onSubmit }: Props = $props();
</script>
```

- Use runes (`$state`, `$derived`, `$props`, `$effect`) for Svelte 5 components
- Global state uses closure-based rune stores in `$lib/stores/*.svelte.ts` — not Svelte `writable()`
- Tailwind CSS for all styling -- no inline styles, no CSS modules
- Use `cn()` from `$lib/utils` for conditional/merged Tailwind classes
- JSDoc on complex business logic functions

## Testing Practices

No test framework is currently configured. When adding tests:

- Use Vitest (already compatible with the Vite setup)
- Add `vitest` to devDependencies and a `test` script to `package.json`
- Place test files alongside source: `*.test.ts` or `*.spec.ts`
- Priority test targets: `data-processing.ts` (CSV parsing), `SteadFastProcessor` (phone normalization, field mapping), `courier-service.ts` (format detection)

## Repository Etiquette

### Conventional Commits

This repo uses conventional commit prefixes (visible in git log):

```
feat:     new feature (e.g., "feat: Add editable brand settings")
fix:      bug fix (e.g., "fix: Include city in SteadFast address")
refactor: code restructuring without behavior change
style:    visual/UI changes only
chore:    tooling, config, dependencies
docs:     documentation changes
```

### Commit Discipline

- Atomic commits -- one logical change per commit
- Never edit existing migration files -- always generate new ones
- Commit migration SQL files alongside the schema.ts changes
- Never commit `.env`, `.dev.vars`, or any file with secrets

## Development Environment

### Prerequisites

- **Bun** (package manager and runtime)
- **Wrangler** (Cloudflare Workers CLI, installed as devDependency)
- **Google Cloud Console** project with OAuth 2.0 credentials

### Environment Setup

1. Create `.dev.vars` (used by `wrangler dev` / `bun run preview`):
    - `BETTER_AUTH_SECRET` -- generate with `openssl rand -base64 32`
    - `BETTER_AUTH_URL` -- `http://localhost:5173` for dev
    - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` -- from Google Cloud Console
2. Create `.env` for D1 CLI operations (`db:push`, `db:studio`): `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_DATABASE_ID`, `CLOUDFLARE_D1_TOKEN`
3. Run `bun install` and `bun run dev`

### Cloudflare Bindings

Configured in `wrangler.jsonc`:

- **D1 Database**: binding `DB`, database `order_processor`
- **Workers AI**: binding `AI` — powers the `/api/copilot/chat` endpoint
- **Assets**: binding `ASSETS`, directory `.svelte-kit/cloudflare`
- **Compatibility**: `nodejs_compat` flag, date `2025-05-29`
- **Observability**: enabled
- **CPU Limit**: 300,000ms
- **Vars**: `BETTER_AUTH_URL` set to production URL

Access in SvelteKit via `event.platform.env.DB`, typed in `app.d.ts` under `App.Platform`.

### CSRF Protection

Trusted origins configured in `svelte.config.js`:

- `http://localhost:5173` (Vite dev)
- `http://localhost:8787` (Wrangler preview)
- `https://order-processor.beyourahi.workers.dev` (production)

## Documentation References (Progressive Disclosure)

### Critical Documentation Pattern

When encountering unfamiliar patterns, check these sources in order:

1. **SvelteKit docs** -- routing, hooks, adapters, `event.platform` for Cloudflare
2. **Svelte 5 docs** -- runes (`$state`, `$derived`, `$props`, `$effect`), snippets
3. **Better Auth docs** -- `svelteKitHandler`, Drizzle adapter config, `usePlural`, cookie settings
4. **Drizzle ORM docs** -- D1 driver, schema definition, migration workflow
5. **Cloudflare Workers docs** -- D1 bindings, `wrangler.jsonc` config, `nodejs_compat`
6. **shadcn-svelte docs** -- component installation, `components.json` config, new-york style

## Project-Specific Warnings

1. **Auth instance is per-request** -- Cloudflare Workers provide D1 binding per-request. `createAuth()` in `$lib/server/auth.ts` is a factory, not a singleton. Never cache the auth instance at module scope.

2. **`building` guard in hooks.server.ts** -- During SvelteKit build/prerender, platform bindings (D1) are unavailable. The `if (building)` check is critical. Do not remove it.

3. **Better Auth column names must be snake_case** -- The Drizzle adapter with `usePlural: true` expects `snake_case` column names in the schema. Deviation causes silent auth failures.

4. **Phone number normalization is Bangladesh-specific** -- `normalizePhoneNumber()` in `$lib/utils/phone.ts` strips `+880`, removes leading zeros, and ensures numbers start with `1`. This is correct only for Bangladesh mobile numbers. `SteadFastProcessor` and the output editor's download path both call it.

5. **Shopify CSV column indexes are hardcoded** -- Column positions (34 for Shipping Name, 36/37/39 for address parts, 43 for phone, 44 for notes, 11 for total) are based on Shopify's current export format. If Shopify changes their export schema, these break silently.

6. **`prepareSteadFastOrderData` trims first and last rows** -- The `.slice(1, -1)` intentionally removes header and trailing rows for standard CSV format. This does NOT apply to Shopify exports (handled separately).

7. **Authorization is authentication-only** -- Any Google user who successfully authenticates is authorized. There is no email allowlist. Brand settings (contact name, phone, merchant ID) are per-user in D1 and editable via the UI. To restrict access, an email allowlist or similar gate would need to be re-added.

8. **drizzle-kit version sensitivity** -- Previously pinned to 0.30.0 due to a hang bug in early 0.31.x. Current version is `0.31.10` (stable). If migration commands hang, check for upstream regressions before upgrading.

9. **Security headers are applied to all responses** -- `hooks.server.ts` sets a Content-Security-Policy, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, and Permissions-Policy. `X-XSS-Protection` was removed (deprecated). The CSP requires `'unsafe-inline'` for SvelteKit hydration scripts and Tailwind styles — do not tighten it without testing. Immutable responses (redirects) are cloned before header application.

10. **Never commit `.env` or `.dev.vars`** -- These contain auth secrets and API tokens. No example file is tracked. Use `wrangler secret put <NAME>` for production secrets.

11. **Cookie cache version is a global session kill-switch** -- Bumping `cookieCache.version` in `createAuth()` instantly invalidates all cached sessions across all users/edge nodes. Use in security incidents. Current value: `"1"`.

12. **Mobile anti-zoom rule uses `@media (pointer: coarse)`** -- `app.css` enforces a 16px minimum font size on touch devices to prevent iOS auto-zoom on input focus. The rule is placed outside `@layer` so it outranks Tailwind utilities. Do not move it inside a layer or lower its specificity.

13. **Svelte's `slide` transition is invalid on `<tr>`** -- table rows have no overflow clipping and ignore padding/margin, so Svelte rejects `slide` (`transition_slide_display`). The output editor's row transitions use `fade` instead.

14. **Editor/dark-background body text must be `zinc-400` or lighter** -- `text-zinc-500` is only 3.77:1 on the dark background, below WCAG 2.2 AA for normal text; `zinc-400` is 6.93:1. Applies to all informational and control text in the output editor.

15. **Copilot grid tools require a mounted editor** -- `editCells`, `addRows`, `deleteRows`, etc. operate through `copilotBridge.editor`, which is null until `output-editor.svelte` mounts. The executor throws a friendly "upload a CSV first" error when nothing is registered. Never assume the bridge is populated.

16. **The `AI` Worker binding is required** -- `wrangler.jsonc` declares `"ai": { "binding": "AI" }`; `app.d.ts` mirrors it on `App.Platform.env`. `/api/copilot/chat` returns 503 if it is absent. After editing `wrangler.jsonc`, rerun `bun run cf-typegen`.

17. **Copilot tool execution is client-side** -- the chat endpoint only _decides_ tool calls; `executor.ts` _runs_ them in the browser against editor `$state`. The server is stateless — it never sees grid data except the rendered CURRENT STATE text the client ships each turn. Do not move mutation logic server-side.

18. **Copilot AI undo is separate from the editor's Cmd+Z** -- `copilot.undoStack` holds full-editor snapshots; reverting an AI action restores the snapshot (and will also revert any manual edits made since). This is intentional — the editor's native `undoEntry` is untouched by Copilot mutations.

---

## Frontend UI Visual Verification (REQUIRED)

**During any frontend UI or design work, you MUST use Playwright MCP to visually verify your changes.**

### Workflow

1. **Determine the active port** for this project before taking screenshots (see Port Detection below)
2. **Take screenshots** via Playwright MCP targeting the correct `http://localhost:<port>`
3. **Save to `tmp_screenshots/`** at the root of this repository
4. **Analyze each screenshot** against the plan or requirements to verify accuracy
5. **Iterate** — fix discrepancies, re-screenshot, re-analyze until requirements are met

### Rules

- **ALWAYS** take at least one screenshot per UI change before considering it done
- **NEVER** mark frontend work as complete without visual verification
- Screenshots go in `tmp_screenshots/` at the project root (create the directory if it doesn't exist)
- Name screenshots descriptively: `tmp_screenshots/homepage-hero.png`, `tmp_screenshots/cart-drawer-open.png`
- Take screenshots at multiple viewport sizes when responsive behavior matters (mobile + desktop)
- After each batch of changes, compare the screenshots against the original requirements or design spec and explicitly state what matches and what still needs work
- **MANDATORY CLEANUP**: After every successful task implementation, if the `tmp_screenshots/` directory was created during the work, it must be deleted before the task is considered complete. Do not skip this step — it is a hard requirement.
- **MANDATORY CLEANUP**: After every successful task implementation, if the `.playwright-mcp/` directory exists in the project root, it must be deleted before the task is considered complete. This directory is created by the Playwright MCP server during browser automation and is a transient artifact that must not persist in the codebase. Do not skip this step — it is a hard requirement.

### Port Detection

Multiple dev servers may be running simultaneously across projects. **Always identify the correct port before screenshotting.**

Detection order (use the first that works):

1. **Check dev server output** — the terminal running `bun run dev` prints the active URL (e.g. `Local: http://localhost:4457`)
2. **Check `vite.config.ts`** — look for an explicit `server.port` value
3. **Check `package.json`** — some scripts hardcode a port via `--port` flag
4. **Scan active ports** — run `lsof -i :3000-4999 | grep LISTEN` to see what's bound, then match the process to this project's directory

**Never assume port 3000.** If multiple Vite/Hydrogen servers are running, confirm you're screenshotting the right one by checking the page title or a unique element.

### Example Playwright MCP Usage

```
// First confirm the port (e.g. from dev server output: http://localhost:4457)
navigate to http://localhost:4457
take screenshot → tmp_screenshots/homepage-initial.png

// After making changes, verify
take screenshot → tmp_screenshots/homepage-after-fix.png
// Analyze: does this match the requirement?
```

### What to Check in Screenshots

- Layout matches the intended design/spec
- Spacing, typography, and colors are correct
- Interactive states (hover, focus, open/closed) render properly
- No visible layout breaks or overflow issues
- Responsive breakpoints behave as expected

### Commit Message Rules

- **Never include AI agent co-authors** — commit messages must not reference any AI agent (Claude, ChatGPT, Gemini, GitHub Copilot, or similar) in `Co-Authored-By` trailers or any other form.
