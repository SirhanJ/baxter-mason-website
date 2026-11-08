import { cache } from 'react';
import descriptions from '../../data/seo-descriptions.json';
import reviewedSummaries from '../../data/reviewed-blog-summaries.json';
import populationFallback from '../../data/blog-fallbacks/the-impact-of-the-population-explosion-on-property-in-qld.json';

import { localBlogImage, rewriteBlogLinks } from './rewriteBlogLinks';
import { ORG_ID, SITE } from './seo';
import { OLD_TO_CURRENT_POST_SLUG } from './blogCanonical';
import { addImageSizes, stripFontImports, withRelatedPosts, completeDescription, completeArchiveSummaries, normalizeArticleHeadings } from './blogEnhance';

const BASE = 'https://pgsnbsjtpxfmzedjldyu.supabase.co/functions/v1/blog-render/baxter-mason';

const SALLY_URL = `${SITE}/sally-blyth-director-buyers-agent-sunshine-coast-8025`;

/**
 * Every blog post is by Sally Blyth (each Vexur post row carries her as its author_snapshot). The @id is
 * the Person node on her own page, so the post's author and that page describe the same person.
 */
export const BLOG_AUTHOR = {
  '@type': 'Person',
  '@id': `${SALLY_URL}#person`,
  name: 'Sally Blyth',
  url: SALLY_URL,
} as const;

/** The share image used when a post has none of its own: the same picture the blog index and home page use. */
export const DEFAULT_SHARE_IMAGE = `${SITE}/brand/social-logo-20261108.png`;

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
 * blog-render, with two bounded tries. A hiccup used to become a 404: fetchPost read every failure as "no
 * such post", so one failed fetch while the site was built baked "Page not found" into that post's
 * page until the next build (the Unethical Selling Agents post, Oct 2026). Only a real 404 from
 * Vexur means missing; anything else is retried and then thrown, so a bad moment never gets cached
 * as a missing page.
 */
async function fetchText(url: string, revalidate = BLOG_REVALIDATE): Promise<string> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await fetch(url, { next: { revalidate }, signal: AbortSignal.timeout(10000) });
      if (response.status === 404) throw new BlogPostMissing(`blog-render 404 for ${url}`);
      if (!response.ok) throw new Error(`blog-render ${response.status} for ${url}`);
      return await response.text();
    } catch (error) {
      if (error instanceof BlogPostMissing) throw error;
      lastError = error;
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, attempt * 750));
    }
  }
  throw lastError;
}

/** The rendered archive, with links already pointing at our own /blog routes. */
export async function fetchArchive(): Promise<string> {
  return completeArchiveSummaries(addImageSizes(stripFontImports(rewriteBlogLinks(await fetchText(`${BASE}?embed=true&placement=archive`))))).replace(/(<[^>]*class="[^"]*blog-card-image-placeholder[^>]*)(?:role="img")([^>]*)(?:aria-label="")/g, '$1aria-hidden="true"$2');
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

/** What blog-render's ?metadata=true says about one post (the fields this site uses). */
export type PostMeta = {
  slug: string;
  title?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  excerpt?: string | null;
  og_image?: string | null;
  featured_image_url?: string | null;
  published_at?: string | null;
  updated_at?: string | null;
  read_time_minutes?: number | null;
  tags?: string[] | null;
  category?: { name?: string | null; slug?: string | null } | null;
};

export type Post = {
  slug: string;
  html: string;
  title: string;
  description: string;
  /** Absolute address of the post's own share image, else the site's default. Never the author photo. */
  image: string;
  /** The title Vexur holds for search results (meta_title), when it has one. */
  metaTitle: string;
  datePublished?: string;
  dateModified?: string;
  keywords?: string;
};

const SEO_SUFFIX = ' | Baxter & Mason';

/**
 * The search-result title for a post: its Vexur meta_title, with " | Baxter & Mason" kept only if the whole
 * thing stays within 65 characters. A longer one ends at the last whole word that fits.
 */
export function blogSeoTitle(metaTitle: string): string {
  const own = metaTitle.trim();
  // Vexur cuts meta_title at 70 characters, so the suffix can arrive whole or as "| Baxter & Ma".
  const cut = own.lastIndexOf(' |');
  const base = cut >= 0 && SEO_SUFFIX.startsWith(own.slice(cut)) ? own.slice(0, cut).trimEnd() : own;
  if (`${base}${SEO_SUFFIX}`.length <= 65) return `${base}${SEO_SUFFIX}`;
  if (base.length <= 65) return base;
  const fit = base.slice(0, 66);
  return fit.slice(0, fit.lastIndexOf(' ')).replace(/[\s:;,(–—-]+$/, '');
}

/** The post's own picture as an absolute address: Vexur's og image (a local copy when it is a heavy one), else the site default. */
function shareImageFor(meta: PostMeta | null): string {
  const own = (meta?.og_image || meta?.featured_image_url || '').trim();
  return own ? new URL(localBlogImage(own), SITE).toString() : DEFAULT_SHARE_IMAGE;
}

/**
 * One post, with its title and description read out of the rendered body.
 *
 * Wrapped in React's cache so generateMetadata and the page body share a single call. Both ask
 * for the same slug on every request, and without this the fetch, the link rewrite and the
 * regex parse all ran twice - doubling the CPU on a route that was already exceeding the
 * Cloudflare Worker's budget (2026-09-07).
 */
export const fetchPost = cache(async (slug: string): Promise<Post | null> => {
  const metadata = fetchPostMeta(slug).catch(() => null);
  const relatedPosts = fetchPostList();
  let html: string;
  try {
    html = rewriteBlogLinks(await fetchText(`${BASE}/${encodeURIComponent(slug)}?embed=true`));
  } catch (error) {
    if (error instanceof BlogPostMissing) return null;
    if (slug !== populationFallback.metadata.slug) throw error;
    html = rewriteBlogLinks(Buffer.from(populationFallback.htmlBase64, "base64").toString("utf8"));
  }
  if (!html.trim()) return null;

  // Vexur's own record of the post (share image, search title and description, dates, tags). A failed
  // lookup must not take the page down, so the post then falls back to what its HTML says.
  const meta = await metadata;

  html = normalizeArticleHeadings(addImageSizes(stripFontImports(html)));
  if (meta) {
    try {
      html = withRelatedPosts(html, meta, await relatedPosts);
    } catch {
      // keep the related posts Vexur rendered
    }
  }

  const heading = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const firstPara = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  const published = meta?.published_at || undefined;
  const modified = meta?.updated_at || published;

  return {
    slug,
    html,
    title: heading ? plain(heading[1]) : slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    description: completeDescription(
      (reviewedSummaries as Record<string, string>)[slug] ||
      meta?.meta_description?.trim() ||
      (descriptions as Record<string, string>)[slug] ||
      (firstPara ? plain(firstPara[1]) : ''), heading ? plain(heading[1]) : slug.replace(/-/g, ' ')),
    image: shareImageFor(meta),
    metaTitle: meta?.meta_title?.trim() || '',
    datePublished: published,
    dateModified: modified,
    keywords: meta?.tags?.length ? meta.tags.join(', ') : undefined,
  };
});

/** The BlogPosting node for a post: its own image, dates, tags and Sally Blyth as the author. */
export function blogPostingNode(url: string, post: Post) {
  return {
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    headline: post.title,
    description: post.description,
    url,
    image: post.image,
    datePublished: post.datePublished,
    dateModified: post.dateModified,
    keywords: post.keywords,
    author: BLOG_AUTHOR,
    publisher: { '@id': ORG_ID },
    inLanguage: 'en-AU',
    mainEntityOfPage: { '@id': `${url}#webpage` },
    isPartOf: { '@id': `${SITE}/blogs-buyers-agent-sunshine-coast#blog` },
  };
}

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
  const meta = await fetchPostMeta(slug);
  return meta && SLUG_OK.test(meta.slug) ? meta.slug : null;
});

/**
 * One post's record from Vexur (?metadata=true). null when the post does not exist or the answer has no
 * slug; any other failure is thrown. Cached per request, so the slug check, the page head and the page
 * body share one call.
 */
export const fetchPostMeta = cache(async (slug: string): Promise<PostMeta | null> => {
  let body: string;
  try {
    body = await fetchText(`${BASE}/${encodeURIComponent(slug)}?metadata=true`);
  } catch (error) {
    if (error instanceof BlogPostMissing) return null;
    if (slug === populationFallback.metadata.slug) return populationFallback.metadata as PostMeta;
    throw error;
  }
  try {
    const meta = JSON.parse(body);
    return typeof meta?.slug === 'string' ? (meta as PostMeta) : null;
  } catch {
    return null;
  }
});

/** Every published post's record, from one request. Empty when Vexur cannot be reached. */
export const fetchPostList = cache(async (): Promise<PostMeta[]> => {
  try {
    const data = JSON.parse(await fetchText(`${BASE}?metadata=true`));
    return Array.isArray(data?.posts) ? (data.posts as PostMeta[]).filter((post) => typeof post?.slug === 'string') : [];
  } catch {
    return [];
  }
});

/**
 * Real change date per post for the sitemap: slug -> ISO string of Vexur's updated_at, else its
 * published_at. One request covers every post. Empty when Vexur cannot be reached, so the
 * sitemap then sends no lastmod rather than a made-up one.
 */
export async function fetchPostDates(): Promise<Map<string, string>> {
  const dates = new Map<string, string>();
  // no dates is safe (the list is empty when Vexur cannot be reached): the sitemap leaves lastmod off
  for (const post of await fetchPostList()) {
    const raw = post.updated_at || post.published_at;
    const time = raw ? new Date(raw) : null;
    if (time && !Number.isNaN(time.getTime())) dates.set(post.slug, time.toISOString());
  }
  return dates;
}
