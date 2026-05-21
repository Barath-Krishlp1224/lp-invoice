/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    serverExternalPackages: [
        '@sparticuz/chromium', 
        'puppeteer-core', 
        'jszip',
        'xlsx',
    ],
};
export default nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
