/** @type {import('next').NextConfig} */
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  // Silence warning when a lockfile exists above the project (e.g. c:\Users\lixjw\package-lock.json)
  outputFileTracingRoot: path.join(__dirname),
  // Static marketing pages + reliable blog archive (public/blog.html).
  // Individual posts stay on App Router at /blog/[slug].
  async rewrites() {
    return [
      { source: '/', destination: '/index.html' },
      { source: '/blog', destination: '/blog.html' },
    ];
  },
};
export default nextConfig;
