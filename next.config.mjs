// next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
    // 1. Output Mode: Essential for Vercel/serverless deployments involving native modules.
    output: 'standalone', 

    // 2. Experimental Configuration: CRITICAL for listing large external packages.
    experimental: {
        serverComponentsExternalPackages: [
            '@sparticuz/chromium', 
            'puppeteer-core', 
            'jszip',
            'xlsx',
        ],
    },
};

// Use ES Module export syntax
export default nextConfig;