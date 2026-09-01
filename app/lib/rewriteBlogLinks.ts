import {
  BLOG_INDEX_PATH,
  canonicalPostPathForCurrent,
} from './blogCanonical';

/**
 * Rewrite Vexur/Supabase (and cross-host) blog URLs to their canonical local
 * routes. Posts that existed on the old site keep /post/<old-slug>; only posts
 * with no historical URL use /blog/<current-slug>.
 * Never navigate to blog-render URLs — they return text/plain.
 */
export function rewriteBlogLinks(html: string, siteOrigin?: string): string {
  if (!html) return html;

  let out = html;
  const origin = (siteOrigin || '').replace(/\/$/, '');

  // Absolute Supabase post URLs → the preserved old path where one exists.
  out = out.replace(
    /https?:\/\/iipazmwbtctblpyszspb\.supabase\.co\/functions\/v1\/blog-render\/baxter-mason\/([a-z0-9][a-z0-9-]*)\/?(?=["'?\s&#])/gi,
    (_match, slug: string) => canonicalPostPathForCurrent(slug),
  );

  // Absolute Supabase archive URL → the canonical historical blog index.
  out = out.replace(
    /https?:\/\/iipazmwbtctblpyszspb\.supabase\.co\/functions\/v1\/blog-render\/baxter-mason\/?(?=["'?\s&#])/gi,
    BLOG_INDEX_PATH,
  );

  // Absolute /blog links from known hosts → the same canonical local route.
  const rewriteKnownHost = (_match: string, slug?: string) =>
    slug ? canonicalPostPathForCurrent(slug) : BLOG_INDEX_PATH;
  const knownHosts = [
    /https?:\/\/(?:www\.)?baxtermason\.com\.au\/blog(?:\/([a-z0-9][a-z0-9-]*))?\/?(?=["'?\s&#])/gi,
    /https?:\/\/baxter-mason-website\.vercel\.app\/blog(?:\/([a-z0-9][a-z0-9-]*))?\/?(?=["'?\s&#])/gi,
    /https?:\/\/localhost(?::\d+)?\/blog(?:\/([a-z0-9][a-z0-9-]*))?\/?(?=["'?\s&#])/gi,
    /https?:\/\/127\.0\.0\.1(?::\d+)?\/blog(?:\/([a-z0-9][a-z0-9-]*))?\/?(?=["'?\s&#])/gi,
  ];
  for (const pattern of knownHosts) out = out.replace(pattern, rewriteKnownHost);

  // The embedded archive normally emits relative /blog links. Canonicalise
  // those too so crawlers and users never prefer the replacement URL.
  out = out.replace(
    /(\bhref=["'])\/blog\/([a-z0-9][a-z0-9-]*)\/?(?=[?#"'])/gi,
    (_match, prefix: string, slug: string) =>
      `${prefix}${canonicalPostPathForCurrent(slug)}`,
  );
  out = out.replace(
    /(\bhref=["'])\/blog\/?(?=[?#"'])/gi,
    `$1${BLOG_INDEX_PATH}`,
  );

  // URL-encoded supabase forms inside share-button query strings
  if (origin) {
    out = out.replace(
      /https%3A%2F%2Fiipazmwbtctblpyszspb\.supabase\.co%2Ffunctions%2Fv1%2Fblog-render%2Fbaxter-mason%2F([a-z0-9][a-z0-9-]*)/gi,
      (_match, slug: string) =>
        encodeURIComponent(`${origin}${canonicalPostPathForCurrent(slug)}`),
    );
    out = out.replace(
      /https%3A%2F%2Fiipazmwbtctblpyszspb\.supabase\.co%2Ffunctions%2Fv1%2Fblog-render%2Fbaxter-mason(?!%2F)/gi,
      encodeURIComponent(`${origin}${BLOG_INDEX_PATH}`),
    );
  } else {
    out = out.replace(
      /https%3A%2F%2Fiipazmwbtctblpyszspb\.supabase\.co%2Ffunctions%2Fv1%2Fblog-render%2Fbaxter-mason%2F([a-z0-9][a-z0-9-]*)/gi,
      (_match, slug: string) =>
        encodeURIComponent(canonicalPostPathForCurrent(slug)),
    );
    out = out.replace(
      /https%3A%2F%2Fiipazmwbtctblpyszspb\.supabase\.co%2Ffunctions%2Fv1%2Fblog-render%2Fbaxter-mason(?!%2F)/gi,
      encodeURIComponent(BLOG_INDEX_PATH),
    );
  }

  return out;
}

/** Resolve the public site origin for the current request (local / Vercel / custom domain). */
export function siteOriginFromHeaders(headersList: Headers): string {
  const host =
    headersList.get('x-forwarded-host') ||
    headersList.get('host') ||
    '';
  if (!host) return '';
  const proto =
    headersList.get('x-forwarded-proto') ||
    (host.includes('localhost') || host.startsWith('127.') ? 'http' : 'https');
  return `${proto}://${host}`;
}
