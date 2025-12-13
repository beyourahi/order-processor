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
            routes: {
                include: ["/*"],
                exclude: ["<all>"]
            }
        })
    }
};

export default config;
