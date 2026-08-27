import type { MetadataRoute } from 'next';
import { SITE } from './lib/seo';

/**
 * Everything is allowed, including the backlink crawlers the old site blocked.
 * Blocking Ahrefs, Semrush and the rest does nothing for rankings; it just
 * means nobody can measure the domain, us included.
 *
 * Preview deploys are kept out of the index with an X-Robots-Tag header keyed
 * off the host in next.config.mjs, not here, so this file is identical on every
 * environment and cannot leak a stray Disallow into production.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
