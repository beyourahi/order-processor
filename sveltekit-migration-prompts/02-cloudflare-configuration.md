# 02 - Cloudflare Configuration

## Prerequisites
- `01-project-setup.md` completed

## Next Prompt
- `03-tailwind-setup.md`

---

## Objective

Configure Cloudflare Workers deployment with D1 database binding for Better Auth session storage.

---

## Instructions

### Step 1: Create wrangler.jsonc

**wrangler.jsonc:**
```jsonc
{
    "$schema": "node_modules/wrangler/config-schema.json",
    "name": "order-processor",
    "main": ".svelte-kit/cloudflare/_worker.js",
    "compatibility_flags": ["nodejs_compat"],
    "compatibility_date": "2025-05-29",
    "assets": {
        "binding": "ASSETS",
        "directory": ".svelte-kit/cloudflare"
    },
    "d1_databases": [
        {
            "binding": "DB",
            "database_name": "order_processor",
            "database_id": "ae9e0e94-99a1-485f-9ed0-c42ad70c6094"
        }
    ],
    "observability": {
        "enabled": true
    },
    "limits": {
        "cpu_ms": 300000
    }
}
```

### Step 2: Generate Cloudflare Types

```bash
bun run cf-typegen
```

This creates `worker-configuration.d.ts` with D1 types.

### Step 3: Update tsconfig.json

Add the worker types reference:

```json
{
    "extends": "./.svelte-kit/tsconfig.json",
    "compilerOptions": {
        "allowJs": true,
        "checkJs": true,
        "esModuleInterop": true,
        "forceConsistentCasingInFileNames": true,
        "resolveJsonModule": true,
        "skipLibCheck": true,
        "sourceMap": true,
        "strict": true,
        "moduleResolution": "bundler",
        "noUncheckedIndexedAccess": true,
        "exactOptionalPropertyTypes": true,
        "noImplicitOverride": true,
        "verbatimModuleSyntax": true,
        "types": ["./worker-configuration.d.ts"]
    }
}
```

### Step 4: Create .dev.vars for Local Development

**.dev.vars:**
```env
BETTER_AUTH_SECRET=dev-secret-replace-in-production-with-real-secret
BETTER_AUTH_URL=http://localhost:5173
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Step 5: Update .gitignore

Add Cloudflare-specific entries to `.gitignore`:

```gitignore
# Cloudflare
.wrangler/
.dev.vars
worker-configuration.d.ts

# SvelteKit
.svelte-kit/
build/

# Dependencies
node_modules/

# Environment
.env
.env.*
!.env.example

# IDE
.idea/
.vscode/

# OS
.DS_Store
```

### Step 6: Create .env.example

**.env.example:**
```env
# Better Auth
BETTER_AUTH_SECRET=     # Generate: openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:5173

# Google OAuth
GOOGLE_CLIENT_ID=       # From Google Cloud Console
GOOGLE_CLIENT_SECRET=   # From Google Cloud Console
```

### Step 7: Update svelte.config.js (if needed)

Ensure the adapter is properly configured:

```javascript
import adapter from "@sveltejs/adapter-cloudflare";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
    preprocess: vitePreprocess(),
    kit: {
        alias: {
            $src: "src",
            $components: "src/lib/components",
            $config: "src/lib/config",
            $services: "src/lib/services",
            $types: "src/lib/types"
        },
        adapter: adapter({
            // Cloudflare Pages/Workers options
            routes: {
                include: ["/*"],
                exclude: ["<all>"]
            }
        })
    }
};

export default config;
```

### Step 8: Test Local Wrangler Dev

```bash
# Build and run with wrangler (simulates Cloudflare environment)
bun run preview
```

---

## Verification

```bash
# Generate types
bun run cf-typegen

# Check types
bun run check

# Test preview mode
bun run preview
```

Expected:
- `worker-configuration.d.ts` is generated
- No type errors related to Cloudflare
- Preview server starts and shows placeholder page

---

## Files Created/Modified

- `wrangler.jsonc` (created)
- `.dev.vars` (created)
- `.env.example` (created)
- `worker-configuration.d.ts` (generated)
- `tsconfig.json` (modified - added types)
- `.gitignore` (modified)
- `svelte.config.js` (verified)

---

## D1 Database Reference

Your D1 database is already created:
- **Name**: `order_processor`
- **ID**: `ae9e0e94-99a1-485f-9ed0-c42ad70c6094`

Better Auth will create its tables automatically on first run.

---

## Notes

- The `nodejs_compat` flag enables Node.js APIs in Cloudflare Workers (required for Better Auth)
- The `cpu_ms: 300000` allows 5-minute CPU time (generous limit)
- Local development uses `.dev.vars` for secrets
- Production uses Cloudflare dashboard or `wrangler secret put`

---

## Cloudflare CLI Commands Reference

```bash
# Deploy to production
wrangler deploy

# View production logs
wrangler tail

# Set production secrets
wrangler secret put BETTER_AUTH_SECRET
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET

# Run D1 migrations (if needed)
wrangler d1 execute order_processor --command "SELECT * FROM user LIMIT 1"
```
