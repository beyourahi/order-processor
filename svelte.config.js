import adapter from "@sveltejs/adapter-cloudflare";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
    preprocess: vitePreprocess({ script: true }),
    kit: {
        adapter: adapter({
            platformProxy: {
                configPath: "wrangler.jsonc"
            },
            routes: {
                include: ["/*"],
                exclude: ["<all>"]
            }
        }),
        // CSRF allowlist; MUST mirror trustedOrigins in $lib/server/auth.ts.
        csrf: {
            trustedOrigins: [
                "http://localhost:5173",
                "http://localhost:8787",
                "https://order-processor.beyourahi.workers.dev"
            ]
        }
    }
};

export default config;
