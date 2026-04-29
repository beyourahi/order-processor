# Order Processor

Converts Shopify order export CSVs into courier-ready Excel files for the [SteadFast](https://steadfast.com.bd) delivery service in Bangladesh. Sign in with Google, upload a CSV, download a `.xlsx` file — no manual reformatting.

**Live**: https://order-processor.beyourahi.workers.dev

---

## Tech Stack

| Layer         | Technology                         |
| ------------- | ---------------------------------- |
| Framework     | SvelteKit 2 + Svelte 5 (runes)     |
| Styling       | Tailwind CSS v4                    |
| UI Components | shadcn-svelte                      |
| Auth          | Better Auth (Google OAuth)         |
| Database      | Cloudflare D1 + Drizzle ORM        |
| CSV Parsing   | PapaParse                          |
| Excel Export  | SheetJS                            |
| Deployment    | Cloudflare Workers                 |
| Package mgr   | Bun                                |

---

## Setup

**Prerequisites**: Bun, a Cloudflare account with a D1 database named `order_processor`, a Google Cloud OAuth 2.0 client.

```bash
git clone https://github.com/beyourahi/order-processor.git
cd order-processor
bun install
```

Copy `.dev.vars.example` to `.dev.vars`:

```dotenv
BETTER_AUTH_SECRET=    # openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:5173
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
CLOUDFLARE_ACCOUNT_ID=       # from Cloudflare dashboard
CLOUDFLARE_DATABASE_ID=      # from Cloudflare D1 dashboard
CLOUDFLARE_D1_TOKEN=         # Cloudflare API token with D1 edit permission
```

Apply migrations and start:

```bash
bun run db:migrate:local
bun run dev              # http://localhost:5173
```

---

## Environment Variables

| Variable                 | Required | Description                                   |
| ------------------------ | -------- | --------------------------------------------- |
| `BETTER_AUTH_SECRET`     | Yes      | Random secret for session signing             |
| `BETTER_AUTH_URL`        | Yes      | Deployed URL (also set in `wrangler.jsonc`)   |
| `GOOGLE_CLIENT_ID`       | Yes      | Google OAuth client ID                        |
| `GOOGLE_CLIENT_SECRET`   | Yes      | Google OAuth client secret                    |
| `CLOUDFLARE_ACCOUNT_ID`  | Yes      | Cloudflare account ID                         |
| `CLOUDFLARE_DATABASE_ID` | Yes      | D1 database ID                                |
| `CLOUDFLARE_D1_TOKEN`    | Yes      | Cloudflare API token with D1 edit permission  |

`BETTER_AUTH_URL` is also a non-secret binding in `wrangler.jsonc` for production. All others are secrets — never commit them.

---

## Scripts

| Script                       | Description                              |
| ---------------------------- | ---------------------------------------- |
| `bun run dev`                | Dev server on `:5173`                    |
| `bun run preview`            | Wrangler local preview on `:8787`        |
| `bun run build`              | Production build                         |
| `bun run deploy`             | Build + deploy to Cloudflare Workers     |
| `bun run check`              | TypeScript validation                    |
| `bun run lint`               | Prettier + ESLint                        |
| `bun run format`             | Prettier auto-format                     |
| `bun run cf-typegen`         | Regenerate Cloudflare types              |
| `bun run db:generate`        | Generate migration from schema changes   |
| `bun run db:migrate`         | Apply migrations to production D1        |
| `bun run db:migrate:local`   | Apply migrations to local D1             |

---

## Deployment

Set production secrets, then deploy:

```bash
wrangler secret put BETTER_AUTH_SECRET
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
bun run deploy
```

---

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. Create an OAuth 2.0 Client ID (Web application)
3. Add authorized redirect URIs:
   - `http://localhost:5173/api/auth/callback/google` (local)
   - `https://order-processor.beyourahi.workers.dev/api/auth/callback/google` (production)

---

## License

MIT — see [LICENSE](./LICENSE).

## Author

**Rahi Khan** · [beyourahi.com](https://beyourahi.com) · [beyourahi@gmail.com](mailto:beyourahi@gmail.com)
