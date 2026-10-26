import type { MetadataRoute } from "next";
import { SITE } from "./lib/seo";
/**
 * Captured at build time by scripts/materialise-canonical-pages.js.
 *
 * This used to be an fs.readdirSync of public/ inside the handler. A Cloudflare Worker has no
 * filesystem, so it threw and /sitemap.xml returned 500 in production while working under
 * `next dev` - with robots.txt pointing search engines straight at it.
 */
import pageSlugs from "../data/page-slugs.json";
import { fetchPostCards, fetchPostDates } from "./lib/blogSource";
import { oldPostSlugForCurrent } from "./lib/blogCanonical";
import legacyPosts from "../data/legacy-posts.json";
import postRedirects from "../data/post-redirects.json";
import canonicalRoutes from "../data/canonical-routes.json";
import legacyRedirects from "../data/legacy-redirects.json";

/**
 * Built from the routes that actually exist, rather than maintained by hand.
 * The old sitemap listed 88 addresses with a .html extension and no blog posts
 * at all; drift like that is how a third of a site goes unseen.
 */
export const revalidate = 3600;
const routeMap = canonicalRoutes as Record<string, string>;
const redirectMap = legacyRedirects as Record<string, string>;

function canonicalStaticPath(internal: string): string {
  const redirected = redirectMap[internal];
  const destination = (
    routeMap[internal] ||
    (redirected ? routeMap[redirected] || redirected : undefined) ||
    internal
  );
  const oldSlug = destination.startsWith("/post/") ? destination.slice(6) : "";
  const currentSlug = (postRedirects as Record<string,string>)[oldSlug];
  return currentSlug ? `/blog/${currentSlug}` : destination;
}

function priorityFor(slug: string): number {
  if (slug === "index") return 1;
  if (/-buyers-agent$/.test(slug)) return 0.8;
  if (
    ["services", "what-we-do", "contact", "success-stories", "blog"].includes(
      slug,
    )
  )
    return 0.8;
  if (/^story-/.test(slug)) return 0.6;
  if (["privacy", "terms"].includes(slug)) return 0.2;
  return 0.6;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  /**
   * lastmod is only worth sending when it is true. The build or render time is not a change date,
   * so pages with no real date carry none; posts carry the date Vexur holds for them (updated_at,
   * else published_at); archived /post entries keep their fixed published date.
   */
  const postDates = await fetchPostDates();
  const postDate = (slug: string) => {
    const date = postDates.get(slug);
    return date ? { lastModified: date } : {};
  };

  const staticPages = (pageSlugs as string[])
    // /blog is an App Router page now, not a file in public.
    .filter((slug) => slug !== "blog")
    .map((slug) => {
      const internal = slug === "index" ? "/" : `/${slug}`;
      const canonical = canonicalStaticPath(internal);
      return {
      url: `${SITE}${canonical}`,
      changeFrequency: (slug === "index" ? "weekly" : "monthly") as
        | "weekly"
        | "monthly",
      priority: priorityFor(slug),
      };
    });

  const cards = await fetchPostCards();
  const blogPosts = cards
    // The indexed GoHighLevel /post address remains canonical whenever a post
    // was migrated into the replacement blog feed.
    .map((card) => ({
      url: `${SITE}/blog/${card.slug}`,
      ...postDate(card.slug),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

  const preserved = (legacyPosts as { slug: string; published: string }[]).map(
    (post) => ({
      url: `${SITE}${(postRedirects as Record<string,string>)[post.slug] ? "/blog/" + (postRedirects as Record<string,string>)[post.slug] : "/post/" + post.slug}`,
      ...(post.published
        ? { lastModified: new Date(`${post.published}T00:00:00Z`) }
        : {}),
      changeFrequency: "yearly" as const,
      priority: 0.5,
    }),
  );

  const historicalAliases = Object.values(
    postRedirects as Record<string, string>,
  ).map((slug) => ({
    url: `${SITE}/blog/${slug}`,
    ...postDate(slug),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // App Router pages that have no file in public/ and so are not picked up above.
  // /thank-you is deliberately absent: it is noindex.
  const appPages = [
    {
      url: `${SITE}/blogs-buyers-agent-sunshine-coast`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${SITE}/google-reviews-buyers-agent-sunshine-coast`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${SITE}/link-in-bio`,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    },
    {
      url: `${SITE}/interview-funnel`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
    {
      url: `${SITE}/video-page-2417-2491`,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    },
  ];

  const entries = [
    ...appPages,
    ...staticPages,
    ...blogPosts,
    ...preserved,
    ...historicalAliases,
  ];

  // Static/App route overlap and archived/CMS overlap must never emit two
  // sitemap entries for the same canonical URL.
  return [...new Map(entries.map((entry) => [entry.url, entry])).values()];
}
