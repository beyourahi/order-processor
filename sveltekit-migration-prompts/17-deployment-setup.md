# 17 - Deployment Setup

## Prerequisites
- `01-project-setup.md` through `16-styling-verification.md` completed

## Next Prompt
- `18-testing-verification.md`

---

## MCP Servers to Use

Before implementing this prompt, use these MCP servers for accurate documentation:

| MCP Server | Usage |
|------------|-------|
| **cloudflare-docs** | **PRIMARY** - Use `search_cloudflare_documentation` for wrangler deploy, Workers secrets, D1 production setup, custom domains, and observability |
| **svelte** | Use `get-documentation` for SvelteKit build configuration and adapter options |

### Recommended MCP Queries
```
cloudflare-docs MCP:
- search: "wrangler deploy Workers"
- search: "wrangler secret put"
- search: "D1 production database"
- search: "Workers custom domain"
- search: "Workers observability logs"
- search: "wrangler tail logs"

svelte MCP:
- get-documentation: "building", "adapter-cloudflare"
- get-documentation: "environment variables production"
```

**Critical**: Production deployment requires correct secrets configuration. Use `cloudflare-docs` MCP to verify wrangler commands and environment setup.

---

## Objective

Configure production deployment to Cloudflare Workers/Pages with proper environment variables, secrets, and build configuration.

---

## Instructions

### Step 1: Update wrangler.jsonc for Production

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
    },
    "vars": {
        "BETTER_AUTH_URL": "https://order-processor.pages.dev"
    }
}
```

### Step 2: Set Production Secrets

Set secrets using Wrangler CLI:

```bash
# Better Auth secret (generate a strong random string)
openssl rand -base64 32 | wrangler secret put BETTER_AUTH_SECRET

# Google OAuth credentials
wrangler secret put GOOGLE_CLIENT_ID
# Enter your Google Client ID when prompted

wrangler secret put GOOGLE_CLIENT_SECRET
# Enter your Google Client Secret when prompted
```

### Step 3: Update Google OAuth Redirect URIs

Go to [Google Cloud Console](https://console.cloud.google.com/) and add production redirect URIs:

**Authorized JavaScript origins:**
- `https://order-processor.pages.dev`
- `https://your-custom-domain.com` (if applicable)

**Authorized redirect URIs:**
- `https://order-processor.pages.dev/api/auth/callback/google`
- `https://your-custom-domain.com/api/auth/callback/google` (if applicable)

### Step 4: Create Production Build Script

Update **package.json** scripts:

```json
{
    "scripts": {
        "dev": "vite dev",
        "build": "vite build",
        "preview": "bun run build && wrangler dev",
        "deploy": "bun run build && wrangler deploy",
        "deploy:staging": "bun run build && wrangler deploy --env staging",
        "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
        "check:watch": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --watch",
        "format": "prettier --write .",
        "lint": "prettier --check . && eslint .",
        "cf-typegen": "wrangler types",
        "db:migrate": "wrangler d1 execute order_processor --file=./migrations/001_init.sql"
    }
}
```

### Step 5: Create Production Checklist

Before deploying, verify:

```markdown
## Pre-Deployment Checklist

- [ ] `bun run check` passes with no errors
- [ ] `bun run lint` passes with no errors
- [ ] `bun run build` completes successfully
- [ ] `bun run preview` works locally
- [ ] All auth flows tested locally
- [ ] CSV/Excel processing tested
- [ ] Visual styling verified
- [ ] Google OAuth redirect URIs updated
- [ ] Production secrets set via `wrangler secret put`
- [ ] D1 database tables created
```

### Step 6: Build and Deploy

```bash
# Build the app
bun run build

# Deploy to Cloudflare
bun run deploy
```

### Step 7: Verify Production Deployment

After deployment:

1. **Visit the production URL**: https://order-processor.pages.dev
2. **Test authentication**:
   - Click "Sign In"
   - Complete Google OAuth
   - Verify redirect back to app
3. **Test authorization**:
   - Login with authorized email - should see main UI
   - Login with unauthorized email - should see "Access Denied"
4. **Test file processing**:
   - Upload test CSV
   - Verify Excel download

### Step 8: Set Up Custom Domain (Optional)

If you have a custom domain:

```bash
# Add custom domain via Cloudflare dashboard
# Or use wrangler:
wrangler domains add order-processor.yourdomain.com
```

Update wrangler.jsonc:

```jsonc
{
    "routes": [
        {
            "pattern": "order-processor.yourdomain.com/*",
            "zone_name": "yourdomain.com"
        }
    ]
}
```

### Step 9: Set Up Staging Environment (Optional)

Create **wrangler.staging.jsonc**:

```jsonc
{
    "$schema": "node_modules/wrangler/config-schema.json",
    "name": "order-processor-staging",
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
            "database_name": "order_processor_staging",
            "database_id": "your-staging-db-id"
        }
    ],
    "vars": {
        "BETTER_AUTH_URL": "https://order-processor-staging.pages.dev"
    }
}
```

### Step 10: Production Monitoring

Check Cloudflare dashboard for:

- **Analytics**: Request volume, errors, latency
- **Logs**: View with `wrangler tail`
- **D1 Analytics**: Database queries and performance

```bash
# Stream production logs
wrangler tail

# View recent logs
wrangler tail --format json
```

---

## Verification

```bash
# Build and preview locally
bun run preview

# Deploy to production
bun run deploy

# Check deployment status
wrangler deployments list
```

---

## Files Created/Modified

- `wrangler.jsonc` (updated for production)
- `package.json` (added deploy scripts)
- `wrangler.staging.jsonc` (optional)

---

## Environment Variables Reference

| Variable | Where to Set | Description |
|----------|--------------|-------------|
| `BETTER_AUTH_SECRET` | `wrangler secret put` | Encryption key |
| `BETTER_AUTH_URL` | `wrangler.jsonc` vars | Base URL |
| `GOOGLE_CLIENT_ID` | `wrangler secret put` | OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | `wrangler secret put` | OAuth secret |

---

## Troubleshooting

### Issue: "Secrets not available"
**Fix:** Ensure secrets are set with `wrangler secret put`

### Issue: OAuth redirect fails
**Fix:** Check Google Console has correct redirect URIs

### Issue: D1 connection fails
**Fix:** Verify database_id in wrangler.jsonc matches your D1

### Issue: Build fails
**Fix:** Run `bun run check` and fix TypeScript errors

---

## Notes

- Secrets are not stored in wrangler.jsonc for security
- Use `wrangler tail` to debug production issues
- Cloudflare Pages auto-deploys from Git (alternative to manual deploy)
- D1 is in the same region as your Workers by default
