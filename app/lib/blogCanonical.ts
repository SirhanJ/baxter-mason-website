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
  const oldSlug = oldPostSlugForCurrent(currentSlug);
  return oldSlug ? `/post/${oldSlug}` : `/blog/${currentSlug}`;
}
