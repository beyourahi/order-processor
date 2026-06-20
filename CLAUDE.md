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

SvelteKit application that converts Shopify order export CSVs into courier-ready Excel files for the SteadFast delivery service in Bangladesh. Upload CSV files, the app auto-detects Shopify format, extracts and normalizes order data (names, addresses, phone numbers), and produces downloadable `.xlsx` files matching SteadFast's import schema. **Auth is optional**: logged-out guests get the full CSV→Excel app (settings persist to `localStorage`); signing in (Google OAuth) adds D1 server storage, cross-device sync, and the AI Copilot — which additionally requires a connected **bring-your-own (BYO) Cloudflare account**. Deployed on Cloudflare Workers with D1 (SQLite) for auth sessions, brand settings, BYO-Cloudflare credentials, and Copilot conversation history.

**Production URL**: `https://order-processor.dropoutstudio.co` (custom domain; the `*.workers.dev` and preview URLs are disabled — `workers_dev: false`, `preview_urls: false`)

## Tech Stack

| Layer           | Technology                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------ |
| Framework       | SvelteKit 2.x (Svelte 5 with runes)                                                              |
| Language        | TypeScript 6.x (strict mode, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)           |
| Styling         | Tailwind CSS 4.x (`@tailwindcss/vite`) + design tokens from vendored `@dropout/ds`               |
| Design System   | `@dropout/ds` vendored at `src/lib/ds/`, imported via `$lib/ds` (tokens + primitives)            |
| UI Components   | shadcn-svelte (new-york, zinc) + CVA in `src/lib/components/ui/` (coexists with the DS)          |
| Auth            | Better Auth with Google OAuth, Drizzle adapter                                                   |
| Database        | Cloudflare D1 (SQLite) via Drizzle ORM                                                           |
| CSV Parsing     | PapaParse                                                                                        |
| Excel Export    | SheetJS (`xlsx`)                                                                                 |
| Deployment      | Cloudflare Workers (adapter-cloudflare)                                                          |
| AI Copilot      | Bring-your-own Workers AI — inference runs on each user's OWN Cloudflare account via the REST API (single user-picked model), Zod tool schemas |
| AI RAG          | Cloudflare Vectorize (`order-processor-kb`, owner's index) + qwen3 query embeddings (`@cf/qwen/qwen3-embedding-0.6b`) run on the user's account |
| Package Manager | Bun                                                                                              |
| Linting         | ESLint 10 flat config + Prettier                                                                 |

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
  --> brandSettings.fieldState(key) / fieldError(key) / dismissError(key) -- per-field SaveState (each field has its own retry budget; aggregate `saveState` getter rolls them up for beforeunload)

$lib/stores/app.svelte.ts                   -- thin facades over brandSettings
  --> courierService.value / .setSelected() -- reads/writes selectedCourier via brandSettings
  --> hasMerchantId()                       -- function (not a derived store)
```

- Stores use `.svelte.ts` extension and Svelte 5 `$state` runes internally — do not import from `.ts` files that don't use runes context.
- `brandSettings` is a module singleton. `hydrate()` is called synchronously via `untrack()` in `+page.svelte` so children read canonical server values during their own mount — do NOT move hydration into `$effect`, that race was fixed in `6d9d68b`.

### AI Copilot

A conversational assistant docked beside the output editor that edits the batch via
natural-language tool calls. **Requires login AND a connected bring-your-own (BYO) Cloudflare
account** — inference runs on the USER's own account (billed to them), not the owner's. Split
architecture — the **server only decides** tool calls, the **browser executes** them. The chat
turn is stateless to the model (client ships full history each turn); D1 records the turn
separately so conversations survive reloads.

```
copilot-sidebar.svelte --> chat-client.sendMessage()
  --> POST /api/copilot/chat  (401 if logged out · 412 {connect:"/settings"} if no CF account · 429 per-user budget)
      --> resolveCloudflareCreds() decrypts the user's BYO token (AES-GCM, TOKEN_ENCRYPTION_KEY)
      --> retrieveAppKnowledge() (Vectorize RAG; query embedded on the USER's account) folds APP KNOWLEDGE in
      --> client.runChatFrames() --> runChatViaRest() --> POST /accounts/{id}/ai/run/{model} (BUFFERED, user's account)
      --> sseStream() emits the buffered turn as Frames: text | tool_call | end | error
      --> appendMessage()/touchUpdatedAt() persist the turn to D1 (best-effort, never aborts)
  --> streamFrames() --> executor.executeToolCall()  (runs IN THE BROWSER)
      --> validates args (Zod) --> safety.ts anomaly check --> confirmation dialog
      --> mutates the grid via copilotBridge.editor --> pushes AI undo snapshot
```

- **Model routing — BYO REST** (`$lib/ai/client.ts` → `$lib/server/ai/run-rest.ts`): chat runs the
  user's single chosen model on the user's account via `POST /accounts/{id}/ai/run/{model}` (buffered,
  not streamed; `client.ts` still emits the same `text`/`tool_call` Frame contract). There is NO runtime
  fallback chain — `$lib/ai/gateway.ts`/`openGatewayChat` is now **dead code**, kept only for the
  `MODEL_CHAIN`/`DEFAULT_MODEL` (`@cf/moonshotai/kimi-k2.6`) constants. The per-user token is AES-GCM
  encrypted in `user_settings` and decrypted per request with `TOKEN_ENCRYPTION_KEY`; connecting an
  account + picking a model happens at `/settings`. Images ride as native multimodal `image_url` content
  parts on the SAME model — no separate vision model; `buildUserContent` emits a plain string when there
  are no images, else a `[text, ...image_url]` array. The chat endpoint caps uploads at `MAX_IMAGES` (3)
  × `MAX_IMAGE_DATA_URL_CHARS` (~8MB, `$lib/ai/image-limits.ts`) and enforces a per-user 20-req/60s budget
  (`checkChatRateLimit`). `stableConversationId` (SHA-256 of the first user message) is retained for
  session affinity without leaking content.
- **RAG** (`$lib/ai/rag.ts` + `embeddings.ts` + `knowledge.ts`): a static `KNOWLEDGE_CORPUS` is embedded
  with qwen3 (`@cf/qwen/qwen3-embedding-0.6b`, 1024 dims) into the owner's `VECTORIZE` index
  `order-processor-kb`. Each turn embeds the query on the USER's own account (`runEmbeddingViaRest`),
  retrieves top-4 passages (score ≥ 0.4) from the owner's index, and folds them into the user message as
  "APP KNOWLEDGE". Best-effort — a Vectorize/AI failure degrades silently. The one-time owner seed
  (`POST /api/copilot/seed`, guarded by `SEED_SECRET` + `x-seed-secret`) still embeds the corpus with the
  owner's bound `env.AI`.
- **D1 history** (`$lib/server/repositories/ai-conversations.ts` + `ai-messages.ts`):
  conversations + messages persist in the `ai_conversations` / `ai_messages` tables, so chats are
  resumable across reloads. `+page.server.ts` loads conversation summaries; messages load lazily on
  switch via `/api/copilot/messages`. Persistence is best-effort and never blocks the live stream.
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
- **Multilingual**: the system prompt (`prompts.ts`, `PROMPT_VERSION` `v4`) replies in Bangla
  (Bengali script or romanized) when the user writes Bangla, English otherwise, leaving names,
  amounts, phones, addresses, and identifiers unchanged.
- **State** (`$lib/stores/copilot.svelte.ts`): a D1-backed closure-rune store holding the working
  set of conversations + messages; `chat-client.ts` owns the network calls (create/list/load/
  rename/delete) and feeds results back. A new chat starts local (`persisted: false`); the server
  mints the real id on the first turn and the client adopts it via `adoptConversationId`.

### Design System

The frontend runs on the **vendored Dropout design system** (`@dropout/ds`). It is copied into
`src/lib/ds/` (NOT an npm/`file:` dependency — that breaks Cloudflare auto-deploy) and refreshed
via the global `dropout-ds-sync` tool. Consume it through the `$lib/ds` alias; the `@dropout/ds`
specifier survives only in vendored doc-comments.

- **Exports** (`src/lib/ds/index.ts`): `cn` + components `Cta`/`Heading`/`Eyebrow`/`Input`/`Tile`
    - style-string helpers (`inputBase`, `labelBase`, `tileBase`/`tileSelected`/`tileUnselected`,
      `pillBase`/`pillSelected`/`pillUnselected`).
- **Tokens**: color/type/space/motion-ease CSS vars live in `src/lib/ds/styles/tokens.css`
  (+ optional `animations.css`), `@import`ed once at the top of `app.css`. Use the custom
  `text-{micro,caption,label,body,…,display}` size scale and semantic colors like `text-ink-muted`.
- **Two `cn()` (gotcha)**: the DS `cn` (`$lib/ds`) extends tailwind-merge to treat the custom
  `text-*` literals as a `font-size` group; the plain `cn` (`$lib/utils`) does not. In DS markup
  that mixes a custom size with a color, use the DS `cn` or the size is **silently dropped**.
- **Hybrid UI**: shadcn-svelte primitives still live in `src/lib/components/ui/` (button, dialog,
  table, tooltip, input…) and coexist with the DS — both valid; prefer DS tokens/primitives for new
  surfaces. Propagation playbook: `~/Desktop/mind-palace/playbooks/implement-dropout-ds.md`.

### Motion

GSAP is the motion engine. All motion code lives under `$lib/motion` and is the **only**
entry point — surface components import from `$lib/motion`, never from `gsap` directly.

- **SSR safety (critical)**: GSAP touches `window`/`document` at module eval, so it must
  NEVER load during SSR on Cloudflare Workers. `gsap.ts` is the only file that imports
  GSAP, and it does so exclusively via a `browser`-guarded dynamic `import()`. Never write
  a top-level `import ... from "gsap"` anywhere else.
- **Tokens** (`tokens.ts`): shared duration/ease/stagger/distance values — the cross-app
  cohesion contract. Mirrored as CSS variables appended at the end of `app.css`
  (`--motion-*`). Keep restrained: 150–350ms, subtle 8–16px offsets.
- **API**: `reveal` action (mount/scroll fade-rise), `stagger`/`flipList`/`motionDuration`
  helpers, `handleViewTransition` (wired via `onNavigate` in `+layout.svelte` for route
  View Transitions), `prefersReducedMotion` reactive store.
- **Reduced motion**: all motion respects `prefers-reduced-motion`. The helpers/actions
  short-circuit automatically; for any direct GSAP use, check `prefersReducedMotion.current`.
- **Cleanup**: every GSAP timeline and ScrollTrigger must be killed on component destroy
  (the `reveal` action and helpers already return cleanup; do the same for direct use).
- **Do not mix mechanisms on one element**: a single element gets either a Svelte
  `transition:` or GSAP — never both (e.g. editor rows keep their existing `transition:fade`).

### Authentication Flow

Auth is **optional** — `hooks.server.ts` always resolves `locals.user`/`session`/`currentUser`
(null when logged out) and never blocks a route. Guests use the full CSV→Excel app with settings in
`localStorage`; signing in unlocks D1 storage, cross-device sync, and the Copilot.

```
Google OAuth --> Better Auth --> D1 sessions --> hooks.server.ts
  --> event.locals.user / session / currentUser  (all null for guests; the app still works)
```

- Auth instance created per-request (Cloudflare Workers provide D1 binding per-request)
- `createAuth()` factory in `$lib/server/auth.ts` -- not a singleton
- Session: 7-day expiry, rolling (updated daily), cookie-cached (5 min)
- Cookie prefix: `order-processor`, secure-only
- `getCurrentUser()` maps session user to `CurrentUser { name, email }`
- Rate limiting enabled (20 req/min, D1-backed) — applies across all Cloudflare edge nodes
- `App.Locals` user/session types derived via `Auth["$Infer"]["Session"]` — don't inline them manually
- Guest persistence (`$lib/persistence/local.ts`): SSR-safe localStorage helpers; `brandSettings.loadGuest()`
  re-seeds from localStorage on guest mount, `migrateGuestToServer()` folds guest settings into an empty
  account on first authed load (never clobbers existing server values)

### Database Schema (Drizzle ORM)

Tables in `src/lib/server/schema.ts`:

- `users` -- authenticated user profiles
- `sessions` -- active sessions (indexed on `user_id`)
- `accounts` -- OAuth provider connections (composite unique on `provider_id` + `account_id`)
- `verifications` -- OAuth state/email verification tokens
- `brand_settings` -- editable contact info per user (contact_name, contact_phone, merchant_id, selected_courier), linked via `user_id` FK
- `user_settings` -- per-user BYO Cloudflare account for the Copilot: `cloudflare_token_encrypted` (BLOB, AES-GCM), `cloudflare_account_id`, `cloudflare_model`; PK = `user_id`. Inference runs on the user's own account, not the owner's
- `rate_limits` -- request counts keyed by IP+path (Better Auth's D1 limiter) AND by `copilot-chat:<userId>` (the Copilot's per-user 20/60s budget) — one table, two key namespaces
- `ai_conversations` -- Copilot chat threads per user (title, timestamps), indexed on `(user_id, updated_at)`
- `ai_messages` -- Copilot messages per conversation (role, content, JSON tool_calls), indexed on `(conversation_id, created_at)`, cascade-deleted with their conversation

All columns use `snake_case` (required by Better Auth Drizzle adapter with `usePlural: true`).

### Project Structure

```
src/
  routes/
    +layout.svelte / +layout.server.ts   -- root layout, loads user/session (null for guests)
    +page.svelte / +page.server.ts       -- main page; loads brandSettings + conversations only when authed, else empty defaults (guests hydrate from localStorage)
    +error.svelte                         -- error boundary
    settings/+page.svelte / +page.server.ts -- BYO Cloudflare account form (token + account id + live model picker); 303 /login when signed out
    changelog/+page.svelte               -- public, customer-facing changelog (groups CHANGELOG_ENTRIES by date)
    login/                               -- login page with Google OAuth
    api/brand-settings/+server.ts        -- brand settings CRUD (GET + PATCH)
    api/cf/models/+server.ts             -- list the user's function-calling chat models (live, no cache) for the settings picker
    api/copilot/chat/+server.ts          -- AI Copilot chat endpoint (SSE; BYO Workers AI REST; 401/412/429 gates)
    api/copilot/conversations/+server.ts -- list (GET) + create (POST) Copilot conversations
    api/copilot/conversations/[id]/+server.ts -- rename (PATCH) + delete (DELETE) a conversation
    api/copilot/messages/+server.ts      -- load a conversation's messages (GET ?conversationId=)
    api/copilot/seed/+server.ts          -- embed + upsert KNOWLEDGE_CORPUS into Vectorize (SEED_SECRET-gated, owner env.AI)
    api/logout/+server.ts                -- logout endpoint
  lib/
    auth-client.ts                       -- Better Auth client (`authClient`); use authClient.signIn/signOut/useSession directly — no named re-exports
    assets/                              -- static assets (upload.gif, steadfast.png)
    ds/                                  -- vendored @dropout/ds (import via $lib/ds): index.ts (cn + Cta/Heading/Eyebrow/Input/Tile + style helpers), components/, styles/ (tokens.css + animations.css → imported by app.css), utils.ts (DS cn with extended text-* scale)
    api/
      client.ts                          -- typed api object (get/post/patch/put/delete) + debounceSync
    ai/                                  -- AI Copilot (client): types, schemas (Zod), tools-catalog, prompts, context,
                                            client (BYO Workers AI REST bridge), streaming, chat-client, executor,
                                            safety, markdown, image-limits, embeddings + rag + knowledge (Vectorize RAG).
                                            gateway.ts is dead code (only MODEL_CHAIN/DEFAULT_MODEL constants survive)
    persistence/local.ts                 -- SSR-safe localStorage helpers for logged-out (guest) persistence
    server/
      auth.ts                            -- createAuth() factory
      schema.ts                          -- Drizzle ORM schema (9 tables)
      crypto.ts                          -- AES-GCM encrypt/decrypt/mask for the BYO Cloudflare token (WebCrypto, TOKEN_ENCRYPTION_KEY)
      rate-limit.ts                      -- per-user Copilot chat budget (checkChatRateLimit, 20/60s) over the rate_limits table
      ai/                                -- BYO Cloudflare layer: run-rest.ts (Workers AI REST: chat/embedding/model-list), cloudflare-config.ts (load/resolve creds), errors.ts (user-facing CF error help)
      repositories/                      -- ai-conversations.ts, ai-messages.ts (Copilot history D1 access)
    components/
      features/                          -- order-processor, upload, courier-picker, user, sign-in-button, steadfast-settings
      features/output-editor/            -- in-app editable courier-batch grid; output-editor.svelte (entry) + action-bar, batch-defaults-strip, editor-{grid,row,cell}.svelte, columns.ts
      features/copilot/                  -- AI Copilot UI; copilot-sidebar.svelte (entry) + chat shell (header, welcome, message-list, message, composer, typing-indicator, image-upload) + tool-badge, anomaly-warning, conversations-panel, confirm-dialog, desktop-launcher, mobile-fab, mobile-sheet, launcher-icon
      ui/                                -- button, dialog, footer, heading, input, loading-spinner, table, tooltip (shadcn-svelte)
    config/
      app.ts                             -- app metadata
      couriers.ts                        -- courier options with logos
    data/
      changelog.ts                       -- hand-curated customer-facing changelog entries (newest-first, ISO dates)
    constants/
      files.ts                           -- file-related constants (generateFileName). CSV column indexes are now inline in services/data-processing.ts
    motion/                              -- GSAP motion system (SSR-safe); tokens, gsap loader, reveal action, helpers, view-transition
    services/
      courier-service.ts                 -- main orchestrator
      data-processing.ts                 -- CSV prep utilities
      processors/steadfast.ts            -- SteadFast processor
    styles/
      chat-animations.css                -- Copilot chat keyframes (ported from canonical reference); @imported by app.css
    stores/
      app.svelte.ts                      -- courierService facade + hasMerchantId() (backed by brandSettings store)
      brand-settings.svelte.ts           -- closure-based runes store; per-field SaveState + aggregate saveState; debounced sink is D1 PATCH when authed, localStorage when guest; loadGuest/migrateGuestToServer bridge the two
      copilot.svelte.ts                  -- Copilot runes store (D1-backed): conversations, messages, confirmations, AI undo stack
      copilot-bridge.svelte.ts           -- editor <-> Copilot bridge (EditorController / IngestionController registration)
    hooks/use-current-user.ts            -- getCurrentUser() derives CurrentUser from the session user
    types/                               -- courier.ts, user.ts, ui.ts, brand-settings.ts (includes SaveState)
    utils/                               -- cn() (clsx + tailwind-merge), csv.ts, excel.ts, phone.ts, validate.ts, types.ts
  hooks.server.ts                        -- auth middleware + security headers
  hooks.client.ts                        -- client-side hooks
  app.css                                -- global Tailwind styles; @imports DS tokens.css + animations.css + lib/styles/chat-animations.css; 16px touch-device font floor; mirrors --motion-* vars
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
bun run dev              # Vite dev server on :5173 (--open auto-opens a tab, --host exposes on LAN)
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

# Design System (vendored @dropout/ds)
bun run sync-ds          # rsync ../../dropout-design-system/src/lib/ -> src/lib/ds/ (local mirror of the global dropout-ds-sync)

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
- Ignored: `build/`, `.svelte-kit/`, `.wrangler/`, `dist/`, `node_modules/`, `scripts/`, `worker-configuration.d.ts`

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
    - `TOKEN_ENCRYPTION_KEY` -- AES-GCM key (base64, exactly 32 bytes: `openssl rand -base64 32`); encrypts each user's BYO Cloudflare token. The Copilot 412s without it
    - `SEED_SECRET` (optional) -- gates `POST /api/copilot/seed`
2. Create `.env` for D1 CLI operations (`db:push`, `db:studio`): `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_DATABASE_ID`, `CLOUDFLARE_D1_TOKEN`
3. Run `bun install` and `bun run dev`

### Cloudflare Bindings

Configured in `wrangler.jsonc`:

- **Custom domain**: served ONLY at `order-processor.dropoutstudio.co` — `workers_dev: false`, `preview_urls: false` (single known host for OAuth + CSRF)
- **D1 Database**: binding `DB`, database `order_processor`
- **Workers AI**: binding `AI` (`remote: true`) — the chat endpoint hard-checks it (503 if absent), but Copilot inference + RAG query embeddings are BYO (the user's account). `env.AI` is genuinely used only by the owner seed endpoint
- **Vectorize**: binding `VECTORIZE` (`remote: true`), index `order-processor-kb` — owner's Copilot RAG store (no local emulator; `remote` is required for `wrangler dev` to query it)
- **Assets**: binding `ASSETS`, directory `.svelte-kit/cloudflare`
- **Compatibility**: `nodejs_compat` flag, date `2025-05-29`
- **Observability**: enabled
- **CPU Limit**: 300,000ms
- **Vars**: `BETTER_AUTH_URL` (`https://order-processor.dropoutstudio.co`), `AI_GATEWAY_SLUG` (`order-processor-ai`, now vestigial — the gateway route is bypassed by BYO)
- **Secrets**: `TOKEN_ENCRYPTION_KEY` (AES-GCM base64 32-byte key encrypting BYO tokens; Copilot 412s without it), `SEED_SECRET` (optional, gates `/api/copilot/seed`)

Access in SvelteKit via `event.platform.env.DB`, typed in `app.d.ts` under `App.Platform`.

### CSRF Protection

Trusted origins configured in `svelte.config.js` (mirrored in `trustedOrigins` in `$lib/server/auth.ts` — keep the two in sync):

- `http://localhost:5173` (Vite dev)
- `http://localhost:8787` (Wrangler preview)
- `https://order-processor.dropoutstudio.co` (production)

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

7. **Auth is optional, not a gate** -- Logged-out guests get the full CSV→Excel app with settings in `localStorage` (`brandSettings` sinks to localStorage instead of D1). Signing in (any Google account; no email allowlist) adds D1 storage, cross-device sync, and the Copilot. Only the Copilot endpoints (`/api/copilot/*`, `/settings`) require a session. To restrict the app itself, a gate would need to be added in `hooks.server.ts` / `+page.server.ts`.

8. **drizzle-kit version sensitivity** -- Previously pinned to 0.30.0 due to a hang bug in early 0.31.x. Current version is `0.31.10` (stable). If migration commands hang, check for upstream regressions before upgrading.

9. **Security headers are applied to all responses** -- `hooks.server.ts` sets a Content-Security-Policy, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, and Permissions-Policy. `X-XSS-Protection` was removed (deprecated). The CSP requires `'unsafe-inline'` for SvelteKit hydration scripts and Tailwind styles — do not tighten it without testing. Immutable responses (redirects) are cloned before header application.

10. **Never commit `.env` or `.dev.vars`** -- These contain auth secrets and API tokens. No example file is tracked. Use `wrangler secret put <NAME>` for production secrets.

11. **Cookie cache version is a global session kill-switch** -- Bumping `cookieCache.version` in `createAuth()` instantly invalidates all cached sessions across all users/edge nodes. Use in security incidents. Current value: `"1"`.

12. **Mobile anti-zoom rule uses `@media (hover: none) and (pointer: coarse)`** -- `app.css` enforces a 16px minimum font size on touch devices to prevent iOS auto-zoom on input focus. The rule is placed outside `@layer` so it outranks Tailwind utilities. Do not move it inside a layer or lower its specificity.

13. **Svelte's `slide` transition is invalid on `<tr>`** -- table rows have no overflow clipping and ignore padding/margin, so Svelte rejects `slide` (`transition_slide_display`). The output editor's row transitions use `fade` instead.

14. **Editor/dark-background body text must be `zinc-400` or lighter** -- `text-zinc-500` is only 3.77:1 on the dark background, below WCAG 2.2 AA for normal text; `zinc-400` is 6.93:1. Applies to all informational and control text in the output editor.

15. **Copilot grid tools require a mounted editor** -- `editCells`, `addRows`, `deleteRows`, etc. operate through `copilotBridge.editor`, which is null until `output-editor.svelte` mounts. The executor throws a friendly "upload a CSV first" error when nothing is registered. Never assume the bridge is populated.

16. **The `AI` binding is still checked, but inference is BYO** -- `/api/copilot/chat` returns 503 if `env.AI` is absent, yet chat inference and the RAG query embedding run on the USER's own Cloudflare account (REST), not `env.AI`. `env.AI` is genuinely used only by the owner seed endpoint. The `VECTORIZE` binding (`order-processor-kb`) is still needed for RAG (skipped silently without it). `AI_GATEWAY_SLUG` is now vestigial — the gateway route is dead code. After editing `wrangler.jsonc`, rerun `bun run cf-typegen`.

17. **Copilot tool execution is client-side** -- the chat endpoint only _decides_ tool calls; `executor.ts` _runs_ them in the browser against editor `$state`. The server is stateless — it never sees grid data except the rendered CURRENT STATE text the client ships each turn. Do not move mutation logic server-side.

18. **Copilot AI undo is separate from the editor's Cmd+Z** -- `copilot.undoStack` holds full-editor snapshots; reverting an AI action restores the snapshot (and will also revert any manual edits made since). This is intentional — the editor's native `undoEntry` is untouched by Copilot mutations.

19. **The chat models leak artifacts** -- the BYO Workers AI models intermittently emit reasoning text, stray code fences, and tool calls as plain chat text (and sometimes narrate an action without calling a tool). The Copilot defends in layers: `prompts.ts` hardens the system prompt; `chat/+server.ts` detects leaked tool-call JSON (`looksLikeLeakedToolCall`) and failed-to-act narrations (`looksImperative`/`REFUSAL_RE`) and runs ONE corrective retry; the message renderer downgrades stray code blocks to plain text; `chat-client.ts` maps every failure to a friendly message. Raw model output, raw errors, and internal tool names must never reach the user — do not strip these guards as redundant.

20. **`E2E_BYPASS_AUTH` is a preview-only auth shortcut** -- when set to `"true"` in `.dev.vars`, `hooks.server.ts` synthesizes an `e2e-test-user` session and upserts it into the local D1, bypassing Google OAuth entirely. It exists for Wrangler preview / E2E runs. NEVER set it in `wrangler.jsonc`, GitHub Actions, or production secrets. The flag is declared optional on `App.Platform.env` in `app.d.ts` so it can stay absent everywhere else.

21. **Copilot rail width is tokenized** -- `--copilot-rail-width` / `--copilot-rail-width-xl` in `app.css` define the right rail's size; the main column reserves space via `lg:pr-[calc(var(--copilot-rail-width)+1.5rem)]` in `+layout.svelte`. Change the tokens, not the hard-coded values.

22. **Copilot inference is bring-your-own (BYO) over the Workers AI REST API** -- chat + RAG embedding run on the END USER's own Cloudflare account (`$lib/server/ai/run-rest.ts`, billed to them) with the user's single chosen model — NO runtime fallback chain. `$lib/ai/gateway.ts`/`openGatewayChat` is DEAD code, retained only for the `MODEL_CHAIN`/`DEFAULT_MODEL` constants; do not wire it back in. Connecting an account + picking a model happens at `/settings`; the endpoint returns 412 (with `connect: "/settings"`) until a token + account id are saved.

23. **Copilot chat is model-stateless but D1-persisted** -- the model never sees stored history; the client re-ships the full conversation + rendered CURRENT STATE every turn. Separately, `chat/+server.ts` writes each turn to `ai_conversations` / `ai_messages` so chats resume after reload. Persistence is best-effort and wrapped in try/catch — it must NEVER abort or block the live SSE stream. (This supersedes the old "in-memory only, no D1 tables" design.)

24. **Vectorize index dims must match the embedding model** -- the `order-processor-kb` index is created for qwen3's 1024-dim output (`EMBEDDING_DIMS` in `embeddings.ts`). Changing the embedding model requires recreating the index at the new dimension and re-running `POST /api/copilot/seed`. RAG retrieval drops matches below `MIN_SCORE` (0.4) and is best-effort — chat still works if Vectorize is down.

25. **`/api/copilot/seed` is gated by `SEED_SECRET`** -- it embeds and upserts the entire `KNOWLEDGE_CORPUS`, so it is protected by an `x-seed-secret` header compared against the `SEED_SECRET` env var (401 on mismatch, 503 if AI/Vectorize absent). Set the secret with `wrangler secret put SEED_SECRET`; never commit it. Re-seed after editing `knowledge.ts`.

26. **Changelog is hand-curated, not generated** -- `src/lib/data/changelog.ts` (`CHANGELOG_ENTRIES`) is the single source for the public `/changelog` route, written in plain merchant-facing English (no commit hashes/jargon). Entries must stay newest-first with ISO `YYYY-MM-DD` dates; the page tags the newest group "Latest" and relies on the ordering instead of sorting. NEVER render relative dates ("x days ago") — they mismatch the SSR render and trip hydration. Prepend new entries when shipping user-visible changes.

27. **BYO Cloudflare token is encrypted at rest** -- the user's API token lives AES-GCM encrypted in `user_settings.cloudflare_token_encrypted` (`[12-byte IV] || ciphertext+tag`, `$lib/server/crypto.ts`), keyed by `TOKEN_ENCRYPTION_KEY` (base64, exactly 32 bytes — `deriveTokenKey` throws otherwise). It is decrypted server-side only: per chat turn to call the REST API, and on the settings load solely to mask it (`maskToken`). The raw secret never reaches the client. The settings `save` action validates a new token by listing the account's models BEFORE encrypting (proves token + account + Workers AI permission); an empty token field preserves the existing blob.

28. **Per-user Copilot rate limit reuses the `rate_limits` table** -- `checkChatRateLimit` (`$lib/server/rate-limit.ts`) enforces 20 chat turns / 60s per user under a `copilot-chat:<userId>` key, separate from Better Auth's own per-route keys in the same table. Fixed window (the window start is NOT bumped per request, so a steady stream can't slide it open). It is a cost guard against BYO model spend; the read-modify-write is intentionally non-atomic and fails open when D1 is unbound.

29. **Served only at the custom domain** -- `wrangler.jsonc` sets `workers_dev: false` + `preview_urls: false`, so the app runs only at `order-processor.dropoutstudio.co`. OAuth redirect URIs, `BETTER_AUTH_URL`, and the CSRF/`trustedOrigins` lists (`svelte.config.js` + `$lib/server/auth.ts`) all assume this single host. Re-enabling `*.workers.dev` or preview URLs means adding those origins everywhere, or auth/CSRF breaks.

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

For Cloudflare work, prefer the installed Cloudflare skills and Code Mode MCP over your own knowledge.
