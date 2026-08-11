/** @type {import('next').NextConfig} */
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  // Silence warning when a lockfile exists above the project (e.g. c:\Users\lixjw\package-lock.json)
  outputFileTracingRoot: path.join(__dirname),
  // Keep static marketing pages available without forcing a static-only Vercel deploy.
  async rewrites() {
    return [
      { source: '/', destination: '/index.html' },
    ];
  },
};
export default nextConfig;
