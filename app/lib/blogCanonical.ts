import postRedirects from '../../data/post-redirects.json';

export const BLOG_INDEX_PATH = '/blogs-buyers-agent-sunshine-coast';

export const OLD_TO_CURRENT_POST_SLUG = postRedirects as Readonly<
  Record<string, string>
>;

export const CURRENT_TO_OLD_POST_SLUG: Readonly<Record<string, string>> =
  Object.freeze(
    Object.fromEntries(
      Object.entries(OLD_TO_CURRENT_POST_SLUG).map(([oldSlug, currentSlug]) => [
        currentSlug,
        oldSlug,
      ]),
    ),
  );

export function oldPostSlugForCurrent(currentSlug: string): string | undefined {
  return (
    CURRENT_TO_OLD_POST_SLUG[currentSlug] ||
    CURRENT_TO_OLD_POST_SLUG[currentSlug.toLowerCase()]
  );
}

export function canonicalPostPathForCurrent(currentSlug: string): string {
  return `/blog/${currentSlug}`;
}

/**
 * Blog posts whose own /blog address changed (a typo or placeholder slug fixed in Vexur).
 * data/post-redirects.json only maps the old site's /post/<old> addresses, and config/routes.mjs
 * allows one old address per current slug, so the earlier /blog/<slug> addresses are redirected
 * here instead: app/blog/[slug]/page.tsx sends them permanently to the new address.
 */
export const RENAMED_BLOG_SLUGS: Readonly<Record<string, string>> = {
  'the-power-of-local-relationshipsew-blog-post': 'the-power-of-local-relationships',
  'number-strategy-tips-for-property-investors-in-year-4':
    'hidden-costs-buyers-are-missing-in-2026-and-how-to-avoid-them',
  'number-strategy-tips-for-property-investors-in-year-5':
    'school-catchment-effect-sunshine-coast-property-prices',
};
