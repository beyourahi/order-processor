import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Performance optimizations
    images: { 
        formats: ["image/avif", "image/webp"],
        dangerouslyAllowSVG: false,
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
        remotePatterns: []
    },
    
    // Experimental features for Next.js 15
    experimental: {
        reactCompiler: true,
        optimizePackageImports: ["@radix-ui/react-icons", "@radix-ui/react-dropdown-menu", "@radix-ui/react-slot"],
        scrollRestoration: true
    },
    
    // Turbopack configuration (stable in Next.js 15)
    turbopack: {
        rules: {
            "*.svg": {
                loaders: ["@svgr/webpack"],
                as: "*.js"
            }
        }
    },
    
    // Compiler optimizations
    compiler: {
        removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error"] } : false
    },
    
    // Security headers
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    {
                        key: "X-Frame-Options",
                        value: "DENY"
                    },
                    {
                        key: "X-Content-Type-Options",
                        value: "nosniff"
                    },
                    {
                        key: "Referrer-Policy",
                        value: "strict-origin-when-cross-origin"
                    },
                    {
                        key: "X-DNS-Prefetch-Control",
                        value: "on"
                    },
                    {
                        key: "Strict-Transport-Security",
                        value: "max-age=31536000; includeSubDomains; preload"
                    },
                    {
                        key: "Permissions-Policy",
                        value: "camera=(), microphone=(), geolocation=(), interest-cohort=()"
                    }
                ]
            }
        ];
    },
    
    // Optimization settings
    poweredByHeader: false,
    compress: true,
    
    // Environment variables
    env: {
        CUSTOM_KEY: process.env.NODE_ENV
    },
    
    // Bundle analyzer (for development)
    ...(process.env.ANALYZE === "true" && {
        webpack: (config, { dev, isServer }) => {
            if (!dev && !isServer) {
                const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
                config.plugins.push(
                    new BundleAnalyzerPlugin({
                        analyzerMode: "static",
                        reportFilename: "bundle-analysis.html",
                        openAnalyzer: false
                    })
                );
            }
            return config;
        }
    }),
    
    // Redirects and rewrites
    async redirects() {
        return [];
    },
    
    async rewrites() {
        return [];
    }
};

export default nextConfig;
