import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: { formats: ["image/avif", "image/webp"] },
    experimental: {
        reactCompiler: true
    }
};

export default nextConfig;
