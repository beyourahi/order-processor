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
        },
        rules: {
            // Allow unused vars with underscore prefix (conventional for intentionally unused params)
            "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }]
        }
    },
    {
        files: ["**/*.svelte", "**/*.svelte.ts", "**/*.svelte.js"],
        languageOptions: {
            parserOptions: {
                parser: ts.parser
            }
        },
        rules: {
            // Disable resolve() requirement - this app doesn't use a base path
            "svelte/no-navigation-without-resolve": "off"
        }
    },
    {
        ignores: [
            "build/",
            ".svelte-kit/",
            ".wrangler/",
            "dist/",
            "node_modules/",
            "scripts/",
            "worker-configuration.d.ts"
        ]
    }
);
