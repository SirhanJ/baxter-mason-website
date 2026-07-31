/**
 * Rewrite Vexur/Supabase (and cross-host) blog URLs to same-origin /blog routes.
 * Relative /blog paths work on localhost, Vercel preview, and baxtermason.com.au.
 * Never navigate to blog-render URLs — they return text/plain.
 */
export function rewriteBlogLinks(html: string, siteOrigin?: string): string {
  if (!html) return html;

  let out = html;
  const origin = (siteOrigin || '').replace(/\/$/, '');

  // Absolute supabase post URLs → /blog/{slug}
  out = out.replace(
    /https?:\/\/iipazmwbtctblpyszspb\.supabase\.co\/functions\/v1\/blog-render\/baxter-mason\/([a-z0-9][a-z0-9-]*)\/?(?=["'?\s&#])/gi,
    '/blog/$1',
  );

  // Absolute supabase archive URL → /blog
  out = out.replace(
    /https?:\/\/iipazmwbtctblpyszspb\.supabase\.co\/functions\/v1\/blog-render\/baxter-mason\/?(?=["'?\s&#])/gi,
    '/blog',
  );

  // Any absolute blog links from known hosts → relative /blog (works on every deploy)
  out = out.replace(
    /https?:\/\/(?:www\.)?baxtermason\.com\.au\/blog(\/[a-z0-9][a-z0-9-]*)?\/?(?=["'?\s&#])/gi,
    '/blog$1',
  );
  out = out.replace(
    /https?:\/\/baxter-mason-website\.vercel\.app\/blog(\/[a-z0-9][a-z0-9-]*)?\/?(?=["'?\s&#])/gi,
    '/blog$1',
  );
  out = out.replace(
    /https?:\/\/localhost(?::\d+)?\/blog(\/[a-z0-9][a-z0-9-]*)?\/?(?=["'?\s&#])/gi,
    '/blog$1',
  );
  out = out.replace(
    /https?:\/\/127\.0\.0\.1(?::\d+)?\/blog(\/[a-z0-9][a-z0-9-]*)?\/?(?=["'?\s&#])/gi,
    '/blog$1',
  );

  // URL-encoded supabase forms inside share-button query strings
  if (origin) {
    const encOrigin = encodeURIComponent(origin);
    out = out.replace(
      /https%3A%2F%2Fiipazmwbtctblpyszspb\.supabase\.co%2Ffunctions%2Fv1%2Fblog-render%2Fbaxter-mason%2F([a-z0-9][a-z0-9-]*)/gi,
      `${encOrigin}%2Fblog%2F$1`,
    );
    out = out.replace(
      /https%3A%2F%2Fiipazmwbtctblpyszspb\.supabase\.co%2Ffunctions%2Fv1%2Fblog-render%2Fbaxter-mason(?!%2F)/gi,
      `${encOrigin}%2Fblog`,
    );
  } else {
    out = out.replace(
      /https%3A%2F%2Fiipazmwbtctblpyszspb\.supabase\.co%2Ffunctions%2Fv1%2Fblog-render%2Fbaxter-mason%2F([a-z0-9][a-z0-9-]*)/gi,
      '%2Fblog%2F$1',
    );
    out = out.replace(
      /https%3A%2F%2Fiipazmwbtctblpyszspb\.supabase\.co%2Ffunctions%2Fv1%2Fblog-render%2Fbaxter-mason(?!%2F)/gi,
      '%2Fblog',
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
