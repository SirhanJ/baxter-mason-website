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
import { fetchStoriesToIndex, fetchStoryList, storyPath } from "./lib/caseStudySource";
import { oldPostSlugForCurrent } from "./lib/blogCanonical";
import legacyPosts from "../data/legacy-posts.json";
import postRedirects from "../data/post-redirects.json";
import canonicalRoutes from "../data/canonical-routes.json";
import storyTwins from "../data/story-blog-twins.json";
import legacyRedirects from "../data/legacy-redirects.json";

/**
 * Built from the routes that actually exist, rather than maintained by hand.
 * The old sitemap listed 88 addresses with a .html extension and no blog posts
 * at all; drift like that is how a third of a site goes unseen.
 */
export const revalidate = 3600;
const routeMap = canonicalRoutes as Record<string, string>;
const redirectMap = legacyRedirects as Record<string, string>;
/** Stories that are also blog posts: the /post/ page still loads, but only the blog post is listed. */
const twinMap = storyTwins as Record<string, string>;

function canonicalStaticPath(internal: string): string {
  const redirected = redirectMap[internal];
  const destination = (
    routeMap[internal] ||
    (redirected ? routeMap[redirected] || redirected : undefined) ||
    internal
  );
  if (twinMap[destination]) return twinMap[destination];
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
  // Only posts that are published in Vexur right now are real /blog addresses. An alias or old slug that
  // is not one of them redirects (or does not exist), so it never goes in the sitemap. When Vexur cannot
  // be reached the list is empty and nothing is filtered, as before.
  const published = new Set(cards.map((card) => card.slug));
  const isPublished = (slug: string) => published.size === 0 || published.has(slug);
  const blogPosts = cards
    // The indexed GoHighLevel /post address remains canonical whenever a post
    // was migrated into the replacement blog feed.
    .map((card) => ({
      url: `${SITE}/blog/${card.slug}`,
      ...postDate(card.slug),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

  // Success stories with no address of their own on this site get one under the success stories page,
  // dated by when Vexur last changed them. Stories already at a /post/ or /story- address are listed
  // below with that address, so they are not repeated here. A story that is also a blog post (same
  // slug) is left out: its page points to the blog post, which is listed with the blog posts.
  const storyPages = (await fetchStoriesToIndex()).map((story) => {
    const raw = story.updated_at || story.published_at;
    const time = raw ? new Date(raw) : null;
    return {
      url: `${SITE}${storyPath(story.slug)}`,
      ...(time && !Number.isNaN(time.getTime()) ? { lastModified: time.toISOString() } : {}),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    };
  });

  // Old-site posts keep their /post/ address, except those that now 301 to a /blog post (listed with the
  // blog posts, once) and the stories that point to a blog twin.
  const preserved = (legacyPosts as { slug: string; published: string }[])
    .filter((post) => {
      const target = (postRedirects as Record<string, string>)[post.slug];
      if (target) return isPublished(target);
      return !twinMap[`/post/${post.slug}`];
    })
    .map((post) => ({
      url: `${SITE}${(postRedirects as Record<string,string>)[post.slug] ? "/blog/" + (postRedirects as Record<string,string>)[post.slug] : "/post/" + post.slug}`,
      ...(post.published
        ? { lastModified: new Date(`${post.published}T00:00:00Z`) }
        : {}),
      changeFrequency: "yearly" as const,
      priority: 0.5,
    }));

  const historicalAliases = Object.values(
    postRedirects as Record<string, string>,
  )
    .filter(isPublished)
    .map((slug) => ({
    url: `${SITE}/blog/${slug}`,
    ...postDate(slug),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // App Router pages that have no file in public/ and so are not picked up above.
  // /thank-you is deliberately absent: it is noindex. So are the thin funnel pages
  // (/interview-funnel, /video-page-2417-2491): they are for ad traffic, not search.
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
  ];

  // Blog posts come last so that, where an address appears twice, the date Vexur holds for the post wins.
  const entries = [
    ...appPages,
    ...staticPages,
    ...preserved,
    ...historicalAliases,
    ...blogPosts,
    ...storyPages,
  ];

  // A story's date is when Vexur last changed it (updated_at), matched on its saved canonical address, not
  // the date in the archived legacy-posts.json. Stories with no date in Vexur keep no lastmod.
  const storyDates = new Map<string, string>();
  for (const story of await fetchStoryList()) {
    try {
      const time = story.updated_at ? new Date(story.updated_at) : null;
      const canonical = story.canonical_url ? new URL(story.canonical_url) : null;
      if (canonical && time && !Number.isNaN(time.getTime())) {
        storyDates.set(canonical.pathname.replace(/\/+$/, "") || "/", time.toISOString());
      }
    } catch {
      // an unreadable canonical just means no story date for that one
    }
  }

  // Static/App route overlap and archived/CMS overlap must never emit two
  // sitemap entries for the same canonical URL.
  return [...new Map(entries.map((entry) => [entry.url, entry])).values()].map((entry) => {
    const date = storyDates.get(new URL(entry.url).pathname.replace(/\/+$/, "") || "/");
    return date ? { ...entry, lastModified: date } : entry;
  });
}
