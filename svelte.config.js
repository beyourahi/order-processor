import adapter from "@sveltejs/adapter-cloudflare";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
    preprocess: vitePreprocess(),
    kit: {
        adapter: adapter({
            routes: {
                include: ["/*"],
                exclude: ["<all>"]
            }
        }),
        // CSRF protection - only allow requests from these trusted origins
        csrf: {
            trustedOrigins: [
                "http://localhost:5173", // Vite dev server
                "http://localhost:8787", // Wrangler preview
                "https://order-processor.beyourahi.workers.dev" // Production
            ]
        }
    }
};

export default config;
