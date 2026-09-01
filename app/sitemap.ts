import type { MetadataRoute } from "next";
import fs from "fs";
import path from "path";
import { SITE } from "./lib/seo";
import { fetchPostCards } from "./lib/blogSource";
import legacyPosts from "../data/legacy-posts.json";
import postRedirects from "../data/post-redirects.json";
import canonicalRoutes from "../data/canonical-routes.json";

/**
 * Built from the routes that actually exist, rather than maintained by hand.
 * The old sitemap listed 88 addresses with a .html extension and no blog posts
 * at all; drift like that is how a third of a site goes unseen.
 */
export const revalidate = 3600;
const routeMap = canonicalRoutes as Record<string, string>;

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
  const now = new Date();

  const staticPages = fs
    .readdirSync(path.join(process.cwd(), "public"))
    .filter((file) => file.endsWith(".html"))
    .map((file) => file.replace(/\.html$/, ""))
    // /blog is an App Router page now, not a file in public.
    .filter((slug) => slug !== "blog")
    .map((slug) => {
      const internal = slug === "index" ? "/" : `/${slug}`;
      const canonical = routeMap[internal] || internal;
      return {
      url: `${SITE}${canonical}`,
      lastModified: now,
      changeFrequency: (slug === "index" ? "weekly" : "monthly") as
        | "weekly"
        | "monthly",
      priority: priorityFor(slug),
      };
    });

  const cards = await fetchPostCards();
  const blogPosts = cards.map((card) => ({
    url: `${SITE}/blog/${card.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const preserved = (legacyPosts as { slug: string; published: string }[]).map(
    (post) => ({
      url: `${SITE}/post/${post.slug}`,
      lastModified: post.published
        ? new Date(`${post.published}T00:00:00Z`)
        : now,
      changeFrequency: "yearly" as const,
      priority: 0.5,
    }),
  );

  const historicalAliases = Object.keys(
    postRedirects as Record<string, string>,
  ).map((slug) => ({
    url: `${SITE}/post/${slug}`,
    lastModified: now,
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
      url: `${SITE}/3big`,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    },
    {
      url: `${SITE}/video-page-2417-2491`,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    },
    {
      url: `${SITE}/special-video-report-v1-3603-7869`,
      changeFrequency: "monthly" as const,
      priority: 0.3,
    },
    {
      url: `${SITE}/special-video-report-v1-4327-6380-5418`,
      changeFrequency: "monthly" as const,
      priority: 0.3,
    },
    {
      url: `${SITE}/special-video-report-v1-4327-1283-3541-7869`,
      changeFrequency: "monthly" as const,
      priority: 0.3,
    },
    {
      url: `${SITE}/special-video-report-v1-4327-1283-6652-7055-4904`,
      changeFrequency: "monthly" as const,
      priority: 0.3,
    },
  ].map((page) => ({ ...page, lastModified: now }));

  return [
    ...appPages,
    ...staticPages,
    ...blogPosts,
    ...preserved,
    ...historicalAliases,
  ];
}
