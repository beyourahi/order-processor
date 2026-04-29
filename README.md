# Order Processor

Converts Shopify order export CSVs into courier-ready Excel files for the [SteadFast](https://steadfast.com.bd) delivery service in Bangladesh. Sign in with Google, upload a CSV, download a `.xlsx` file — no manual reformatting.

**Live**: https://order-processor.beyourahi.workers.dev

---

## Stack

SvelteKit 2 (Svelte 5 runes) · TypeScript 5.9 · Tailwind CSS 4 · shadcn-svelte · Better Auth (Google OAuth) · Drizzle ORM · Cloudflare Workers + D1 · PapaParse · SheetJS

---

## Setup

**Prerequisites**: Bun, a Google OAuth 2.0 client, a Cloudflare account with a D1 database named `order_processor`.

```bash
git clone https://github.com/beyourahi/order-processor.git
cd order-processor
bun install
```

Copy `.env.example` to `.env` and `.dev.vars`, then fill in:

```dotenv
BETTER_AUTH_SECRET=    # openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:5173
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

Apply migrations and start:

```bash
bun run db:migrate:local
bun run dev              # http://localhost:5173
```

---

## Key Scripts

| Script | Description |
|--------|-------------|
| `bun run dev` | Dev server on `:5173` |
| `bun run preview` | Wrangler local preview on `:8787` |
| `bun run deploy` | Build + deploy to Cloudflare Workers |
| `bun run lint` | Prettier + ESLint |
| `bun run check` | svelte-check type checking |
| `bun run db:generate` | Generate migration from schema changes |
| `bun run db:migrate` | Apply migrations to production D1 |
| `bun run db:migrate:local` | Apply migrations to local D1 |

---

## Deployment

Set production secrets via Wrangler, then deploy:

```bash
wrangler secret put BETTER_AUTH_SECRET
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
bun run deploy
```

---

## Adding Authorized Users

Edit `src/lib/config/brands.ts` and add the user's Google email to the `BRANDS` array, then redeploy.

---

## License

MIT — see [LICENSE](./LICENSE).

## Author

**Rahi Khan** · [beyourahi.com](https://beyourahi.com) · [beyourahi@gmail.com](mailto:beyourahi@gmail.com)
