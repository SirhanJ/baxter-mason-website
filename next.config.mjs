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
const canonicalRoutes = read('./data/canonical-routes.json');
const canonicalPaths = new Set(Object.values(canonicalRoutes));
const canonicalBlogPath = canonicalRoutes['/blog'];
const canonicalSuccessStoriesPath = canonicalRoutes['/success-stories'];

const postTargets = Object.values(postRedirects);
if (new Set(postTargets).size !== postTargets.length) {
  throw new Error('data/post-redirects.json must map one old post URL to one current blog slug');
}

const permanent = (source, destination) => ({ source, destination, permanent: true });
const canonicalDestination = (source) => {
  const redirected = legacyRedirects[source];
  return (
    canonicalRoutes[source] ||
    (redirected ? canonicalRoutes[redirected] || redirected : undefined) ||
    source
  );
};

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
  ...Object.entries(canonicalRoutes).map(([internal, canonical]) => ({
    source: canonical,
    destination: pageSlugs.includes(internal.slice(1))
      ? `${internal}.html`
      : internal,
  })),
  ...pageSlugs.map((slug) => ({ source: `/${slug}`, destination: `/${slug}.html` })),
];

const cleanUrlRedirects = [
  permanent('/index.html', '/'),
  ...pageSlugs.map((slug) => {
    const internal = `/${slug}`;
    return permanent(`${internal}.html`, canonicalDestination(internal));
  }),
  ...Object.entries(canonicalRoutes).map(([internal, canonical]) =>
    permanent(internal, canonical),
  ),
];

/** The old site's URLs, so nothing that is indexed today lands on a 404. */
const migrationRedirects = [
  ...Object.entries(legacyRedirects)
    .filter(([source]) => source.startsWith('/') && !canonicalPaths.has(source))
    .map(([source, destination]) =>
      permanent(source, canonicalRoutes[destination] || destination),
    ),

  // The GoHighLevel /post URLs are the indexed addresses. The replacement
  // /blog slugs are implementation details and must consolidate back to them.
  ...Object.entries(postRedirects).map(([oldSlug, currentSlug]) =>
    permanent(`/blog/${currentSlug}`, `/post/${oldSlug}`),
  ),

  // The two alternate post paths the old CMS also served.
  permanent('/blogs-buyers-agent-sunshine-coast/b/:slug', '/post/:slug'),
  permanent('/success-stories-buyers-agent-sunshine-coast/b/:slug', '/post/:slug'),
  permanent('/buyers-agent-real-results/b/:slug', '/post/:slug'),
  permanent('/:prefix(blogs?-[^/]+)/b/:slug', '/post/:slug'),

  // The old success-story CMS had two collection namespaces. Their post
  // addresses survive; collection and archive variants consolidate directly.
  permanent('/buyers-agent-real-results', canonicalSuccessStoriesPath),
  ...['buyers-agent-real-results', 'success-stories-buyers-agent-sunshine-coast']
    .flatMap((prefix) => ['c', 'category', 'tag', 'author'].map((segment) =>
      permanent(`/${prefix}/${segment}/:path*`, canonicalSuccessStoriesPath),
    )),

  // Tag, category and author archives duplicate the canonical blog index.
  // GoHighLevel also exposed the category collection under the short /c form.
  // Redirect there directly instead of creating a second hop through /blog.
  permanent('/:prefix(blogs?-[^/]+)/c/:category*', canonicalBlogPath),
  permanent('/:prefix(blogs?-[^/]+)/tag/:tag*', canonicalBlogPath),
  permanent('/:prefix(blogs?-[^/]+)/category/:category*', canonicalBlogPath),
  permanent('/:prefix(blogs?-[^/]+)/author/:author*', canonicalBlogPath),

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
