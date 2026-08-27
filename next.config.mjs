/** @type {import('next').NextConfig} */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const read = (p) => JSON.parse(fs.readFileSync(path.join(__dirname, p), 'utf8'));

const PROD_HOST = 'www.baxtermason.com.au';

/** Every static page in public/, by slug. */
const pageSlugs = fs
  .readdirSync(path.join(__dirname, 'public'))
  .filter((f) => f.endsWith('.html'))
  .map((f) => f.replace(/\.html$/, ''))
  .filter((slug) => slug !== 'index');

const legacyRedirects = read('./data/legacy-redirects.json');
const postRedirects = read('./data/post-redirects.json');

const permanent = (source, destination) => ({ source, destination, permanent: true });

/**
 * Serve every static page at its extensionless address.
 *
 * These run before the filesystem check so /contact resolves to
 * public/contact.html without the .html ever appearing in a URL. The paired
 * redirect below sends anyone who asks for the .html form to the clean one, so
 * each page has exactly one address.
 */
const cleanUrlRewrites = [
  { source: '/', destination: '/index.html' },
  ...pageSlugs.map((slug) => ({ source: `/${slug}`, destination: `/${slug}.html` })),
];

const cleanUrlRedirects = [
  permanent('/index.html', '/'),
  ...pageSlugs.map((slug) => permanent(`/${slug}.html`, `/${slug}`)),
];

/** The old site's URLs, so nothing that is indexed today lands on a 404. */
const migrationRedirects = [
  ...Object.entries(legacyRedirects)
    .filter(([source]) => source.startsWith('/'))
    .map(([source, destination]) => permanent(source, destination)),

  // Posts that now live in the blog under a new slug.
  ...Object.entries(postRedirects).map(([oldSlug, newSlug]) =>
    permanent(`/post/${oldSlug}`, `/blog/${newSlug}`),
  ),

  // The two alternate post paths the old CMS also served.
  permanent('/blogs-buyers-agent-sunshine-coast/b/:slug', '/post/:slug'),
  permanent('/success-stories-buyers-agent-sunshine-coast/b/:slug', '/post/:slug'),
  permanent('/:prefix(blogs?-[^/]+)/b/:slug', '/post/:slug'),

  // 364 tag, category and author routes: crawl noise, all of it the blog index.
  permanent('/:prefix(blogs?-[^/]+)/tag/:tag*', '/blog'),
  permanent('/:prefix(blogs?-[^/]+)/category/:category*', '/blog'),
  permanent('/:prefix(blogs?-[^/]+)/author/:author*', '/blog'),

  // A template bug on the old site emitted links with the hostname in the path.
  permanent('/www.baxtermason.com.au/:path*', '/:path*'),

  // One canonical host.
  {
    source: '/:path*',
    has: [{ type: 'host', value: 'baxtermason.com.au' }],
    destination: `https://${PROD_HOST}/:path*`,
    permanent: true,
  },
];

const nextConfig = {
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
