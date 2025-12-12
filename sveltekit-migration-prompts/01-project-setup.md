# 01 - Project Setup

## Prerequisites
- None (this is the first prompt)

## Next Prompt
- `02-cloudflare-configuration.md`

---

## Objective

Initialize a new SvelteKit project structure within the existing repository, preparing for the migration from Next.js.

---

## Instructions

### Step 1: Backup Current Configuration

Before making changes, note the current structure. The following directories will be preserved and migrated:
- `src/config/` - Configuration files
- `src/constants/` - Constants
- `src/services/` - Business logic
- `src/types/` - TypeScript types
- `public/` - Static assets

### Step 2: Create SvelteKit Project Files

Create the core SvelteKit configuration files:

**svelte.config.js:**
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
        adapter: adapter()
    }
};

export default config;
```

**vite.config.ts:**
```typescript
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [tailwindcss(), sveltekit()]
});
```

**tsconfig.json:**
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
        "verbatimModuleSyntax": true
    }
}
```

### Step 3: Update package.json

Replace the current package.json with SvelteKit dependencies:

```json
{
    "name": "order-processor",
    "version": "1.0.0",
    "private": true,
    "scripts": {
        "dev": "vite dev",
        "build": "vite build",
        "preview": "bun run build && wrangler dev",
        "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
        "check:watch": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --watch",
        "format": "prettier --write .",
        "lint": "prettier --check . && eslint .",
        "cf-typegen": "wrangler types"
    },
    "devDependencies": {
        "@sveltejs/adapter-cloudflare": "^7.2.4",
        "@sveltejs/kit": "^2.21.0",
        "@sveltejs/vite-plugin-svelte": "^5.1.0",
        "@tailwindcss/vite": "^4.1.18",
        "@types/node": "^22.15.0",
        "eslint": "^9.39.1",
        "eslint-config-prettier": "^10.1.5",
        "eslint-plugin-svelte": "^3.9.0",
        "globals": "^16.2.0",
        "prettier": "^3.7.4",
        "prettier-plugin-svelte": "^3.4.0",
        "prettier-plugin-tailwindcss": "^0.7.2",
        "svelte": "^5.33.0",
        "svelte-check": "^4.3.4",
        "tailwindcss": "^4.1.18",
        "typescript": "^5.9.3",
        "typescript-eslint": "^8.32.0",
        "vite": "^7.2.2",
        "wrangler": "^4.53.0"
    },
    "dependencies": {
        "better-auth": "^1.2.8",
        "bits-ui": "^2.14.4",
        "class-variance-authority": "^0.7.1",
        "clsx": "^2.1.1",
        "papaparse": "^5.5.3",
        "tailwind-merge": "^3.4.0",
        "xlsx": "^0.18.5"
    },
    "type": "module"
}
```

### Step 4: Create SvelteKit Directory Structure

Create the new directory structure (don't delete old files yet):

```
src/
├── lib/
│   ├── components/
│   │   └── ui/
│   ├── config/          # Will migrate from src/config/
│   ├── constants/       # Will migrate from src/constants/
│   ├── services/        # Will migrate from src/services/
│   ├── types/           # Will migrate from src/types/
│   ├── server/          # Server-only code (auth)
│   └── utils.ts         # cn() helper
├── routes/
│   └── (placeholder)
├── app.html
├── app.css
├── app.d.ts
└── hooks.server.ts
```

### Step 5: Create app.html

```html
<!doctype html>
<html lang="en" class="dark">
    <head>
        <meta charset="utf-8" />
        <link rel="icon" href="%sveltekit.assets%/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
        %sveltekit.head%
    </head>
    <body data-sveltekit-preload-data="hover" class="bg-[#0F0F0F] text-white antialiased">
        <div style="display: contents">%sveltekit.body%</div>
    </body>
</html>
```

### Step 6: Create utils.ts

**src/lib/utils.ts:**
```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]): string => {
    return twMerge(clsx(inputs));
};
```

### Step 7: Create app.d.ts

**src/app.d.ts:**
```typescript
/// <reference types="@sveltejs/kit" />
/// <reference types="@cloudflare/workers-types" />

declare global {
    namespace App {
        interface Locals {
            user: import("better-auth").User | null;
            session: import("better-auth").Session | null;
        }
        interface Platform {
            env: {
                DB: D1Database;
            };
            cf: CfProperties;
            ctx: ExecutionContext;
        }
    }
}

export {};
```

### Step 8: Create Placeholder Files

**src/routes/+page.svelte:**
```svelte
<h1>Migration in progress...</h1>
```

**src/hooks.server.ts:**
```typescript
import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
    // Will be configured with Better Auth in prompt 05
    return resolve(event);
};
```

### Step 9: Create Prettier Config

**.prettierrc:**
```json
{
    "useTabs": false,
    "tabWidth": 4,
    "singleQuote": false,
    "trailingComma": "none",
    "printWidth": 120,
    "plugins": ["prettier-plugin-svelte", "prettier-plugin-tailwindcss"],
    "overrides": [
        {
            "files": "*.svelte",
            "options": {
                "parser": "svelte"
            }
        }
    ]
}
```

### Step 10: Create ESLint Config

**eslint.config.js:**
```javascript
import prettier from "eslint-config-prettier";
import js from "@eslint/js";
import svelte from "eslint-plugin-svelte";
import globals from "globals";
import ts from "typescript-eslint";

export default ts.config(
    js.configs.recommended,
    ...ts.configs.recommended,
    ...svelte.configs.recommended,
    prettier,
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node
            }
        }
    },
    {
        files: ["**/*.svelte", "**/*.svelte.ts", "**/*.svelte.js"],
        languageOptions: {
            parserOptions: {
                parser: ts.parser
            }
        }
    },
    {
        ignores: ["build/", ".svelte-kit/", "dist/", "node_modules/"]
    }
);
```

### Step 11: Install Dependencies

```bash
# Remove node_modules and lock file
rm -rf node_modules bun.lockb package-lock.json

# Install new dependencies
bun install
```

---

## Verification

```bash
# Sync SvelteKit types
bun run check

# Should show no errors (just warnings about unused files)
bun run lint

# Start dev server (will show placeholder page)
bun run dev
```

Expected: Dev server starts at http://localhost:5173 showing "Migration in progress..."

---

## Files Created

- `svelte.config.js`
- `vite.config.ts`
- `tsconfig.json` (replaced)
- `package.json` (replaced)
- `src/lib/utils.ts`
- `src/app.html`
- `src/app.d.ts`
- `src/routes/+page.svelte`
- `src/hooks.server.ts`
- `.prettierrc`
- `eslint.config.js`

---

## Notes

- The old Next.js files are still present and will be removed after full migration
- Path aliases are configured for clean imports
- TypeScript strict mode matches the original configuration
- The `dark` class on `<html>` ensures dark mode is always active (matching original behavior)
