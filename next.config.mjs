/** @type {import('next').NextConfig} */
import path from 'path';
import { fileURLToPath } from 'url';

import { cleanUrlRedirects, cleanUrlRewrites, migrationRedirects } from './config/routes.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  images: { unoptimized: true },
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
        // Website Lab's draft and production Workers both answer on workers.dev.
        source: '/:path*',
        has: [{ type: 'host', value: '(?<worker>.*\\.workers\\.dev)' }],
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/images/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      ...['/css/:path*', '/js/:path*'].map((source) => ({
        // Not content-hashed: revalidate daily, serve stale while it refreshes.
        source,
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      })),
      {
        source: '/:path*',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
