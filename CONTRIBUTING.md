# Contributing to Order Processor

Thank you for your interest in contributing. This document covers everything you need to work on this project effectively — from local setup to submitting changes.

---

## Table of Contents

- [Philosophy](#philosophy)
- [Local Development Setup](#local-development-setup)
- [Project Structure](#project-structure)
- [Architecture Guidelines](#architecture-guidelines)
- [Coding Standards](#coding-standards)
- [Git Workflow](#git-workflow)
- [Commit Message Conventions](#commit-message-conventions)
- [Submitting Issues and Feature Requests](#submitting-issues-and-feature-requests)
- [Pull Request Workflow](#pull-request-workflow)
- [Testing](#testing)
- [Database Migrations](#database-migrations)
- [Documentation Standards](#documentation-standards)
- [Code of Conduct](#code-of-conduct)

---

## Philosophy

Order Processor is an internal tool — correctness and reliability matter more than feature breadth. Contributions should:

- **Solve a concrete problem** — avoid speculative features or premature abstractions
- **Fit the existing architecture** — read the codebase before proposing changes
- **Leave the codebase cleaner than you found it** — small, focused changes over large rewrites
- **Not introduce security regressions** — auth flows, session handling, and header policies are sensitive

When in doubt, open an issue to discuss the change before writing code.

---

## Local Development Setup

### Prerequisites

| Tool                                                            | Version                      | Install                                     |
| --------------------------------------------------------------- | ---------------------------- | ------------------------------------------- |
| [Bun](https://bun.sh)                                           | Latest                       | `curl -fsSL https://bun.sh/install \| bash` |
| [Wrangler](https://developers.cloudflare.com/workers/wrangler/) | Included as devDep           | `bunx wrangler`                             |
| [Node.js](https://nodejs.org)                                   | 20+ (for type compatibility) | Via `nvm` or direct                         |

A Google Cloud Console project with OAuth 2.0 credentials is required for authentication during development.

### Step-by-Step Setup

```bash
# 1. Clone the repository
git clone <repo-url> order-processor
cd order-processor

# 2. Install dependencies
bun install

# 3. Copy environment files
cp .env.example .env
cp .env.example .dev.vars

# 4. Fill in required values in both files:
#    BETTER_AUTH_SECRET  — generate: openssl rand -base64 32
#    BETTER_AUTH_URL     — http://localhost:5173 for local dev
#    GOOGLE_CLIENT_ID    — from Google Cloud Console
#    GOOGLE_CLIENT_SECRET — from Google Cloud Console

# 5. Apply database migrations to the local D1 instance
bun run db:migrate:local

# 6. Start the dev server
bun run dev
```

The app will open at `http://localhost:5173`.

### Local Cloudflare Workers Preview

To test the app as it runs in production (Workers runtime with D1 bindings):

```bash
bun run preview   # builds + starts wrangler dev on :8787
```

### Available Scripts

| Script                | Description                            |
| --------------------- | -------------------------------------- |
| `bun run dev`         | Vite dev server on `:5173`             |
| `bun run build`       | Production build                       |
| `bun run preview`     | Build + Wrangler local Workers preview |
| `bun run deploy`      | Build + deploy to Cloudflare Workers   |
| `bun run check`       | TypeScript and Svelte type checking    |
| `bun run check:watch` | Type checking in watch mode            |
| `bun run lint`        | Prettier check + ESLint                |
| `bun run format`      | Auto-format with Prettier              |
| `bun run cf-typegen`  | Regenerate `worker-configuration.d.ts` |

---

## Project Structure

```
src/
  routes/                           # SvelteKit file-based routing
    +layout.svelte / +layout.server.ts   # Root layout, loads auth state
    +page.svelte / +page.server.ts       # Main order processing page
    +error.svelte                        # Error boundary
    login/                               # Google OAuth login page
    api/brand-settings/+server.ts        # Brand settings CRUD API
    api/logout/+server.ts                # Logout endpoint
  lib/
    auth-client.ts                  # Better Auth browser client
    server/
      auth.ts                       # createAuth() factory (per-request, NOT singleton)
      schema.ts                     # Drizzle ORM schema (6 tables)
    components/
      features/                     # Business-logic components (upload, download, etc.)
      ui/                           # shadcn-svelte generated components (DO NOT EDIT MANUALLY)
    config/
      app.ts                        # App metadata
      brands.ts                     # Email authorization config
      couriers.ts                   # Courier options and logos
    constants/
      files.ts                      # File-related constants
      indexes.ts                    # CSV column index mappings (Shopify-specific)
    services/
      courier-service.ts            # Main orchestrator (format detection → processing → export)
      data-processing.ts            # CSV cleaning, deduplication, extraction utilities
      processors/steadfast.ts       # SteadFast courier processor
    stores/app.ts                   # Global Svelte writables (courierService, hasMerchantId)
    hooks/use-current-user.ts       # Derives CurrentUser from Better Auth session
    types/                          # Shared TypeScript interfaces (courier, user, ui, config)
    utils/                          # cn(), csv.ts, excel.ts
  hooks.server.ts                   # Auth middleware + security headers (CSP, HSTS, etc.)
  hooks.client.ts                   # Client-side hooks
  app.css                           # Global Tailwind styles
  app.d.ts                          # App.Locals, App.Platform, App.PageData, App.Error
migrations/                         # Drizzle-generated SQL migrations (never edit manually)
```

### Path Aliases

| Alias         | Maps to              |
| ------------- | -------------------- |
| `$lib`        | `src/lib`            |
| `$src`        | `src`                |
| `$components` | `src/lib/components` |
| `$config`     | `src/lib/config`     |
| `$services`   | `src/lib/services`   |
| `$types`      | `src/lib/types`      |

Always use aliases — never use relative paths from route files.

---

## Architecture Guidelines

### Data Processing Pipeline

Changes to the CSV processing pipeline must preserve this flow:

```
CSV Upload → PapaParse → isShopifyExport() → Column extraction/deduplication
  → Phone normalization (BD +880 format) → CourierProcessor → .xlsx export
```

- `CourierService` is the orchestrator; do not add business logic directly to route files
- `CourierProcessor<T>` is generic — adding a new courier means implementing this interface, not modifying existing processors
- Column indexes in `constants/indexes.ts` are hardcoded to Shopify's current export format; any change there requires explicit testing against a real Shopify CSV export

### Authentication

- `createAuth()` in `src/lib/server/auth.ts` is a **factory function**, not a singleton — Cloudflare Workers provide a fresh D1 binding per request. Never cache the auth instance at module scope.
- The `if (building)` guard in `hooks.server.ts` is critical — D1 bindings are unavailable during SvelteKit's build/prerender step. Do not remove it.
- Session expiry is 7 days, rolling (refreshed daily), with a 5-minute cookie cache. The `cookieCache.version` string is a global kill-switch for all sessions — bump it only in a security incident.

### Components

- `src/lib/components/ui/` contains **auto-generated shadcn-svelte components**. Do not edit these manually. Use `bunx shadcn-svelte@latest add <component>` to add or update them, then wrap in `features/` if customization is needed.
- Feature components live in `src/lib/components/features/`. Each should be self-contained with a clear, single responsibility.

### Database Schema

- All column names must be `snake_case` — the Better Auth Drizzle adapter with `usePlural: true` requires this. Deviations cause silent auth failures.
- Never edit existing migration files. Always generate new ones with `bun run db:generate`.

---

## Coding Standards

### TypeScript

- **Strict mode** is enforced with additional flags: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `verbatimModuleSyntax`
- Optional properties must use explicit `| undefined` for `exactOptionalPropertyTypes` compatibility
- Export barrel files (`index.ts`) in every module directory
- Use the path aliases defined above — never relative paths from route files

### Svelte 5 (Runes Mode)

All components must use Svelte 5 runes syntax. Legacy reactivity (`$: reactive`, `writable` for component-local state) is not permitted in new code:

```svelte
<script lang="ts">
    // Props
    let { user, onSubmit }: Props = $props();

    // Local state
    let value = $state("");
    let length = $derived(value.length);

    // Side effects
    $effect(() => {
        console.log(value);
    });
</script>
```

Use `writable` stores only for cross-component global state in `src/lib/stores/`.

### Styling

- **Tailwind CSS v4** exclusively — no inline styles, no CSS modules
- Configuration is CSS-first in `app.css` using `@import 'tailwindcss'` — do not create `tailwind.config.js`
- Use `cn()` from `$lib/utils` for conditional or merged Tailwind classes

### Formatting (Prettier)

| Setting         | Value                                                   |
| --------------- | ------------------------------------------------------- |
| Indent          | 4 spaces (no tabs)                                      |
| Quotes          | Double                                                  |
| Trailing commas | None                                                    |
| Print width     | 120                                                     |
| Plugins         | `prettier-plugin-svelte`, `prettier-plugin-tailwindcss` |

Run `bun run format` before committing. The CI equivalent is `bun run lint`.

### ESLint

Flat config in `eslint.config.js`. Key rules:

- Unused variables with `_` prefix are allowed (`argsIgnorePattern: "^_"`)
- `svelte/no-navigation-without-resolve` is disabled (no base path in use)
- Ignored paths: `build/`, `.svelte-kit/`, `dist/`, `node_modules/`, `scripts/`

### Comments

Default to no comments. Add one only when the **why** is non-obvious — a hidden constraint, a subtle invariant, a workaround for a known upstream bug. Do not describe what the code does; well-named identifiers already do that.

---

## Git Workflow

This project uses a **git worktree workflow** instead of feature branches. All commits go directly to `main`.

### Why Worktrees Instead of Branches

Worktrees allow parallel development on isolated copies of the repo without branch switching or stashing. Each worktree has its own working tree; the git history stays linear and easy to follow.

### Creating a Worktree

```bash
# Navigate to the project root
cd ~/Desktop/projects/order-processor

# Create a worktree for your work
git worktree add ../order-processor-<feature-name>

# Work in the isolated copy
cd ../order-processor-<feature-name>

# When done, commit and remove the worktree
git add <files>
git commit -m "feat: your change"
git worktree remove ../order-processor-<feature-name>
```

### Worktree Hygiene

```bash
git worktree list    # List all active worktrees
git worktree prune   # Clean up stale references
```

**Never create branches** (`git checkout -b` or `git branch`) — this is a hard requirement of the workspace workflow.

---

## Commit Message Conventions

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <short summary in present tense, lowercase, no period>

[optional body: explain WHY, not WHAT]
```

### Types

| Type       | When to use                                |
| ---------- | ------------------------------------------ |
| `feat`     | New user-facing feature                    |
| `fix`      | Bug fix                                    |
| `refactor` | Code restructuring with no behavior change |
| `style`    | Visual/UI-only changes                     |
| `chore`    | Tooling, config, dependency updates        |
| `docs`     | Documentation changes only                 |
| `perf`     | Performance improvements                   |
| `test`     | Adding or updating tests                   |

### Examples

```
feat: add editable merchant ID to brand settings
fix: include city in SteadFast address field
refactor: extract phone normalization into standalone util
chore: upgrade drizzle-kit to 0.31.10
docs: document Shopify CSV column index assumptions
```

### Rules

- Subject line: 50–70 characters, imperative mood, lowercase
- Body: explain _why_ the change was made, not _what_ it does
- Atomic commits — one logical change per commit
- Never amend already-pushed commits

---

## Submitting Issues and Feature Requests

### Bug Reports

Include:

1. **Description** — what you expected vs. what happened
2. **Reproduction steps** — minimal steps to trigger the bug
3. **Environment** — OS, browser, Bun version, relevant env vars (never paste secrets)
4. **Relevant output** — error messages, console logs, or screenshot

### Feature Requests

Include:

1. **Problem statement** — what gap does this fill?
2. **Proposed solution** — how would it work?
3. **Alternatives considered** — what else did you evaluate?
4. **Scope** — is this a small addition or a larger architectural change?

Features that require changes to the auth flow, security headers, or Cloudflare bindings should be flagged explicitly so they receive extra scrutiny.

---

## Pull Request Workflow

Since this project uses direct commits to `main` via worktrees, "pull requests" refer to collaborative review requests opened against `main`.

### Before Opening a PR

- [ ] `bun run check` passes (no TypeScript or Svelte type errors)
- [ ] `bun run lint` passes (Prettier + ESLint)
- [ ] The app starts without errors (`bun run dev`)
- [ ] For UI changes: visual verification done via screenshot or Playwright
- [ ] For database changes: migration generated and tested locally (`bun run db:migrate:local`)
- [ ] No `.env`, `.dev.vars`, or secrets committed
- [ ] No manually edited files inside `src/lib/components/ui/`

### PR Description Template

```markdown
## What does this change?

[Short description]

## Why?

[Motivation — link to issue if applicable]

## How was it tested?

[Steps taken, screenshots if UI work]

## Checklist

- [ ] Type check passes
- [ ] Lint passes
- [ ] No secrets committed
- [ ] DB migration included (if schema changed)
```

### Review Expectations

- Reviews will focus on correctness, security, and fit with existing architecture
- Expect feedback on auth-related changes, security headers, and any new D1 queries
- Address all review comments before merging; mark resolved threads explicitly

---

## Testing

No test framework is currently configured in the project. When adding tests:

- Use **Vitest** (compatible with the existing Vite setup)
- Add `vitest` to `devDependencies` and a `test` script to `package.json`
- Place test files co-located with source: `*.test.ts` or `*.spec.ts`

### Priority Test Targets

| File                                       | What to test                                             |
| ------------------------------------------ | -------------------------------------------------------- |
| `src/lib/services/data-processing.ts`      | CSV deduplication, row slicing edge cases                |
| `src/lib/services/processors/steadfast.ts` | Phone normalization (+880, leading zeros), field mapping |
| `src/lib/services/courier-service.ts`      | Shopify format detection logic                           |
| `src/lib/hooks/use-current-user.ts`        | Null handling, name/email extraction                     |

### Validation Before Commit

Even without a test suite, always validate:

```bash
bun run check   # TypeScript + Svelte type safety
bun run lint    # Prettier + ESLint
bun run build   # Full production build
```

---

## Database Migrations

**Never edit existing migration files in `migrations/`.** Drizzle tracks state against these files; modifying them causes schema drift.

### Migration Workflow

```bash
# 1. Edit the schema
$EDITOR src/lib/server/schema.ts

# 2. Generate a new migration SQL file
bun run db:generate

# 3. Review the generated SQL in migrations/
# Verify it does exactly what you intended.

# 4. Apply locally and test
bun run db:migrate:local
bun run dev   # verify the app works

# 5. Commit the schema change and migration file together
git add src/lib/server/schema.ts migrations/

# 6. Apply to production (after merge)
bun run db:migrate
```

### Schema Rules

- All column names in `snake_case` — required by the Better Auth Drizzle adapter
- Index names should be descriptive and prefixed with the table name
- Always pair schema changes with a migration; never use `db:push` in production

---

## Documentation Standards

- **`CLAUDE.md`** is the primary architectural reference — keep it accurate when making structural changes
- **`CONTRIBUTING.md`** (this file) covers workflow and contributor process
- **Inline comments** only for non-obvious constraints, not for describing what code does
- **JSDoc** on public service functions where parameter intent is ambiguous

If you introduce a new courier processor, document:

- The courier's expected CSV schema
- Any phone or address normalization specifics
- Column index assumptions

---

## Code of Conduct

Contributors are expected to interact professionally and constructively. This includes:

- Respectful, focused code review feedback
- Clear and specific bug reports and feature requests
- Keeping discussion on-topic and actionable

Disrespectful, harassing, or off-topic behavior will not be tolerated.

---

## Questions

If something in this guide is unclear or outdated, open an issue or reach out directly. Feedback on the contributor experience is welcome.
