import { cache } from 'react';
import descriptions from '../../data/seo-descriptions.json';

import { rewriteBlogLinks } from './rewriteBlogLinks';
import { OLD_TO_CURRENT_POST_SLUG } from './blogCanonical';

const BASE = 'https://pgsnbsjtpxfmzedjldyu.supabase.co/functions/v1/blog-render/baxter-mason';

/** An hour of ISR: new posts appear without a deploy, crawlers get static HTML. */
export const BLOG_REVALIDATE = 3600;

export type PostCard = {
  slug: string;
  title: string;
  excerpt: string;
  image: string;
};

const unesc = (s: string) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;|&rsquo;|&#8217;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

const plain = (s: string) => unesc(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

/** Vexur says this post does not exist (blog-render answered 404). */
class BlogPostMissing extends Error {}

/**
 * blog-render, with three tries. A hiccup used to become a 404: fetchPost read every failure as "no
 * such post", so one failed fetch while the site was built baked "Page not found" into that post's
 * page until the next build (the Unethical Selling Agents post, Oct 2026). Only a real 404 from
 * Vexur means missing; anything else is retried and then thrown, so a bad moment never gets cached
 * as a missing page.
 */
async function fetchText(url: string, revalidate = BLOG_REVALIDATE): Promise<string> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, { next: { revalidate } });
      if (response.status === 404) throw new BlogPostMissing(`blog-render 404 for ${url}`);
      if (!response.ok) throw new Error(`blog-render ${response.status} for ${url}`);
      return await response.text();
    } catch (error) {
      if (error instanceof BlogPostMissing) throw error;
      lastError = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 750));
    }
  }
  throw lastError;
}

/** The rendered archive, with links already pointing at our own /blog routes. */
export async function fetchArchive(): Promise<string> {
  return rewriteBlogLinks(await fetchText(`${BASE}?embed=true&placement=archive`));
}

/**
 * The archive as structured cards. Used for generateStaticParams, the sitemap
 * and the ItemList schema on /blog.
 */
export async function fetchPostCards(): Promise<PostCard[]> {
  let html: string;
  try {
    html = await fetchArchive();
  } catch {
    return [];
  }

  const cards: PostCard[] = [];
  const seen = new Set<string>();

  const links = Array.from(
    html.matchAll(/<a href="\/(blog|post)\/([^"?#]+)[^"#]*"/gi),
  );
  for (let index = 0; index < links.length; index += 1) {
    const link = links[index];
    const route = link[1].toLowerCase();
    const routeSlug = link[2];
    const slug =
      route === 'post' ? OLD_TO_CURRENT_POST_SLUG[routeSlug] : routeSlug;
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);

    const start = link.index || 0;
    const end = links[index + 1]?.index || html.length;
    const chunk = html.slice(start, end);

    const title = chunk.match(/class="blog-card-title">([\s\S]*?)<\/h2>/);
    const excerpt = chunk.match(/class="blog-card-excerpt">([\s\S]*?)<\/p>/);
    const image = chunk.match(/<img[^>]+src="([^"]+)"/);

    cards.push({
      slug,
      title: title ? plain(title[1]) : slug.replace(/-/g, ' '),
      excerpt: excerpt ? plain(excerpt[1]) : '',
      image: image ? image[1] : '',
    });
  }
  return cards;
}

export type Post = {
  slug: string;
  html: string;
  title: string;
  description: string;
  image: string;
};

/**
 * One post, with its title and description read out of the rendered body.
 *
 * Wrapped in React's cache so generateMetadata and the page body share a single call. Both ask
 * for the same slug on every request, and without this the fetch, the link rewrite and the
 * regex parse all ran twice - doubling the CPU on a route that was already exceeding the
 * Cloudflare Worker's budget (2026-09-07).
 */
export const fetchPost = cache(async (slug: string): Promise<Post | null> => {
  let html: string;
  try {
    html = rewriteBlogLinks(await fetchText(`${BASE}/${encodeURIComponent(slug)}?embed=true`));
  } catch (error) {
    if (error instanceof BlogPostMissing) return null;
    throw error;
  }
  if (!html.trim()) return null;

  const heading = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const firstPara = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  const image = html.match(/<img[^>]+src="([^"]+)"/i);

  return {
    slug,
    html,
    title: heading ? plain(heading[1]) : slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    description: (descriptions as Record<string, string>)[slug] || (firstPara ? plain(firstPara[1]).slice(0, 155) : ''),
    image: image ? image[1] : '',
  };
});

/** Slugs are letters, digits and . _ ~ - ; anything else from Vexur is never redirected to. */
const SLUG_OK = /^[A-Za-z0-9][A-Za-z0-9._~-]*$/;

/**
 * The slug a post is published at NOW. Vexur answers /<slug>?metadata=true for a renamed post's
 * old slug too, and the `slug` it returns is the current one - the page uses that to send the old
 * address to the new one instead of serving the post twice. null when the post does not exist
 * (404) or the answer has no usable slug. Any other failure is thrown, never read as "no
 * redirect", so a bad moment cannot cache a duplicate of the post.
 */
export const fetchCurrentSlug = cache(async (slug: string): Promise<string | null> => {
  let body: string;
  try {
    body = await fetchText(`${BASE}/${encodeURIComponent(slug)}?metadata=true`);
  } catch (error) {
    if (error instanceof BlogPostMissing) return null;
    throw error;
  }
  try {
    const current = JSON.parse(body)?.slug;
    return typeof current === 'string' && SLUG_OK.test(current) ? current : null;
  } catch {
    return null;
  }
});

/**
 * Real change date per post for the sitemap: slug -> ISO string of Vexur's updated_at, else its
 * published_at. One request covers every post. Empty when Vexur cannot be reached, so the
 * sitemap then sends no lastmod rather than a made-up one.
 */
export async function fetchPostDates(): Promise<Map<string, string>> {
  const dates = new Map<string, string>();
  try {
    const data = JSON.parse(await fetchText(`${BASE}?metadata=true`));
    for (const post of Array.isArray(data?.posts) ? data.posts : []) {
      const raw = post?.updated_at || post?.published_at;
      const time = raw ? new Date(raw) : null;
      if (typeof post?.slug === 'string' && time && !Number.isNaN(time.getTime())) {
        dates.set(post.slug, time.toISOString());
      }
    }
  } catch {
    // no dates is safe: the sitemap leaves lastmod off
  }
  return dates;
}
