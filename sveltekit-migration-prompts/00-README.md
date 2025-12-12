# SvelteKit Migration Prompts

## Overview

This directory contains sequential prompts for migrating the order-processor application from Next.js 16 to SvelteKit with Cloudflare Workers deployment.

**CRITICAL REQUIREMENT**: The UI and design MUST NOT change at all. This is a tech stack migration only.

---

## Migration Summary

| From | To |
|------|-----|
| Next.js 16 | SvelteKit 2.x |
| React 19 | Svelte 5 |
| Kinde Auth | Better Auth |
| Radix UI | shadcn/svelte (bits-ui) |
| Vercel | Cloudflare Workers |
| react-papaparse | Papa Parse (direct) |

---

## MCP Servers for AI Assistance

When executing these prompts with Claude Code or similar AI assistants, leverage these MCP (Model Context Protocol) servers for accurate, up-to-date documentation:

### Required MCP Servers

| MCP Server | Purpose | Used In Prompts |
|------------|---------|-----------------|
| **svelte** | Official Svelte 5 and SvelteKit documentation, component validation, runes syntax | 01, 03, 04, 09, 10, 11, 12, 14 |
| **better-auth** | Better Auth framework documentation and patterns | 05, 06, 11, 13 |
| **cloudflare-docs** | Cloudflare Workers, D1, Pages, deployment configuration | 02, 05, 17 |
| **context7** | General library documentation lookup (xlsx, papaparse, tailwind, etc.) | All prompts as needed |

### How to Use MCP Servers

When working on a prompt, instruct the AI to:

1. **For Svelte/SvelteKit questions**: Use the `svelte` MCP to fetch official documentation and validate component syntax
2. **For Better Auth setup**: Use the `better-auth` MCP to get correct API usage and D1 adapter configuration
3. **For Cloudflare deployment**: Use the `cloudflare-docs` MCP to get correct wrangler configuration and D1 bindings
4. **For library-specific questions**: Use the `context7` MCP with `resolve-library-id` then `get-library-docs`

### Example AI Instructions

```
Before implementing this prompt, use the svelte MCP to:
1. List available documentation sections with `list-sections`
2. Fetch relevant sections for Svelte 5 runes and SvelteKit routing
3. Validate any Svelte component code with `svelte-autofixer`
```

---

## Execution Order

Execute these prompts **sequentially**. Each prompt depends on the previous ones being completed.

### Phase 1: Foundation
- [ ] **01-project-setup.md** - Initialize SvelteKit, TypeScript, path aliases
- [ ] **02-cloudflare-configuration.md** - Cloudflare adapter, wrangler.jsonc, D1 binding
- [ ] **03-tailwind-setup.md** - Tailwind CSS 4, theme tokens, global styles
- [ ] **04-shadcn-ui-setup.md** - shadcn/svelte, bits-ui, Button component

### Phase 2: Authentication
- [ ] **05-better-auth-setup.md** - Better Auth with D1, Google OAuth, hooks
- [ ] **06-types-migration.md** - TypeScript types, app.d.ts declarations

### Phase 3: Business Logic
- [ ] **07-config-constants-migration.md** - Config files, constants (minimal changes)
- [ ] **08-services-migration.md** - CourierService, processors, data-processing

### Phase 4: Components
- [ ] **09-ui-components-migration.md** - Button, LoadingSpinner, Heading, Footer, NotAuthorized
- [ ] **10-main-components-migration.md** - OrderProcessor, Upload, Download, CourierPicker, User
- [ ] **11-app-context-migration.md** - Svelte stores, useCurrentUser hook

### Phase 5: Routes & Auth Flows
- [ ] **12-routes-migration.md** - +layout.svelte, +page.svelte, +error.svelte
- [ ] **13-auth-flows-migration.md** - Login, logout, email allowlist, protected routes

### Phase 6: Integration
- [ ] **14-csv-excel-integration.md** - Papa Parse, xlsx, file processing pipeline
- [ ] **15-static-assets-migration.md** - public/ → static/, image references

### Phase 7: Polish & Deploy
- [ ] **16-styling-verification.md** - Visual comparison, responsive design
- [ ] **17-deployment-setup.md** - Production wrangler config, environment variables
- [ ] **18-testing-verification.md** - Functional testing, auth flows, CSV processing

---

## Configuration Reference

### Cloudflare D1 Database
- **Name**: `order_processor`
- **ID**: `ae9e0e94-99a1-485f-9ed0-c42ad70c6094`

### Environment Variables (Target)
```env
BETTER_AUTH_SECRET=     # openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:5173
GOOGLE_CLIENT_ID=       # From Google Cloud Console
GOOGLE_CLIENT_SECRET=
```

---

## Verification Steps (After Each Prompt)

Run these commands after completing each prompt:

```bash
# Type checking
bun run check

# Linting
bun run lint

# Development server (when applicable)
bun run dev
```

### Visual Verification
- Compare UI against the original Next.js app
- Check responsive breakpoints (mobile, tablet, desktop)
- Verify animations and transitions
- Test hover/active states

---

## Reference Project

Use `~/Desktop/projects/dropout-studio` as reference for:
- SvelteKit project structure
- Cloudflare Workers configuration
- Svelte 5 component patterns
- hooks.server.ts implementation

---

## Key Patterns Reference

### React → Svelte State
```tsx
// React
const [value, setValue] = useState("");
```
```svelte
<!-- Svelte 5 -->
<script>
  let value = $state("");
</script>
```

### React Context → Svelte Stores
```tsx
// React
const ctx = useContext(AppContext);
```
```ts
// Svelte
import { courierService } from '$lib/stores';
$courierService // read
courierService.set('value') // write
```

### Kinde → Better Auth
```tsx
// Kinde
const { user } = useKindeBrowserClient();
```
```svelte
<!-- Better Auth -->
<script>
  import { authClient } from '$lib/auth-client';
  const session = authClient.useSession();
</script>
{$session.data?.user.name}
```

---

## Troubleshooting

### Common Issues

1. **"Cannot find module '$lib/...'**
   - Run `bun run check` to sync SvelteKit types
   - Ensure `svelte.config.js` has correct aliases

2. **Better Auth session not working**
   - Check `hooks.server.ts` is calling `svelteKitHandler`
   - Verify D1 binding in `wrangler.jsonc`
   - Check `BETTER_AUTH_SECRET` is set

3. **Styles not matching**
   - Compare Tailwind theme tokens
   - Check `app.css` has all custom styles from `globals.css`
   - Verify dark mode class is applied to body

4. **CSV parsing fails**
   - Papa Parse API differs slightly from react-papaparse
   - Check file input handling in Upload component

---

## Files to Delete After Migration

Once migration is complete and verified:

```
src/app/                    # Next.js app directory
src/middleware.ts           # Next.js middleware
next.config.ts              # Next.js config
.env.local                  # Kinde env vars (migrate to .env)
package.json                # Replace entirely
tsconfig.json               # Replace with SvelteKit version
```

---

## Success Criteria

- [ ] All 18 prompts completed
- [ ] `bun run build` succeeds
- [ ] `bun run preview` works locally
- [ ] Visual UI identical to original
- [ ] Google OAuth login works
- [ ] Email allowlist authorization works
- [ ] CSV upload and Excel download works
- [ ] Deployed to Cloudflare Workers
