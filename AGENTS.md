# Order Processor

SvelteKit 5/Cloudflare Workers tool that converts Shopify order CSV data into courier-ready Excel output, with Better Auth, D1/Drizzle, an AI copilot, and the vendored Dropout design system. Bun is the package manager.

## Binding workflow

- Work only on `main`; use isolated worktrees for concurrent work.
- Follow workspace git gates, autonomy, deployment, frontend-design, browser verification, and mandatory Swiss Design rules.
- Pushes auto-deploy through Cloudflare Workers Builds; never run routine manual deploys.
- Vendored DS lives in `src/lib/ds/`; refresh with `dropout-ds-sync`, never hand-edit it.
- Tailwind v4 is CSS-first; use Svelte 5 runes and strict TypeScript.

## Architecture and safety

- Preserve the CSV parse → validate/normalize → transform → courier workbook pipeline and deterministic output.
- Validate uploaded files, headers, row values, formulas, and generated spreadsheet cells at trust boundaries.
- Keep auth, user ownership, CSRF, rate limits, and D1 access fail closed.
- Never expose uploaded order/customer data, credentials, secrets, prompts, or generated files across users.
- Database schema changes require generated migrations plus local and remote migration verification.
- Local auth bypass requires both the gitignored flag and localhost host; never deploy it.

## Verification

Use `bun run format`, `bun run lint`, `bun run check`, targeted tests, and a representative CSV-to-workbook check when the processing path changes.

## Conditional reference

Read the project skill `order-processor-reference` before changing processing, AI copilot, auth, database, migrations, environment, testing, or operations. It preserves the detailed architecture, commands, setup, and project warnings.
