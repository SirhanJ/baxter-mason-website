/** @type {import('next').NextConfig} */
import path from 'path';
import { fileURLToPath } from 'url';

import { cleanUrlRedirects, cleanUrlRewrites, migrationRedirects } from './config/routes.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  // Silence the warning about a lockfile living above the project.
  outputFileTracingRoot: path.join(__dirname),
  poweredByHeader: false,
  compress: true,

  async rewrites() {
    return { beforeFiles: cleanUrlRewrites, afterFiles: [], fallback: [] };
  },

  async redirects() {
    return [...cleanUrlRedirects, ...migrationRedirects];
  },

  async headers() {
    return [
      {
        // Keep preview deploys out of the index. Production is untouched.
        source: '/:path*',
        has: [{ type: 'host', value: '(?<preview>.*\\.vercel\\.app)' }],
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/images/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
