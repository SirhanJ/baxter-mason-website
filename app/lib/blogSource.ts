import { rewriteBlogLinks } from './rewriteBlogLinks';

const BASE = 'https://iipazmwbtctblpyszspb.supabase.co/functions/v1/blog-render/baxter-mason';

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

async function fetchText(url: string, revalidate = BLOG_REVALIDATE): Promise<string> {
  const response = await fetch(url, { next: { revalidate } });
  if (!response.ok) throw new Error(`blog-render ${response.status} for ${url}`);
  return response.text();
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

  for (const chunk of html.split(/<a href="\/blog\//).slice(1)) {
    const slug = chunk.slice(0, chunk.indexOf('"'));
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);

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

/** One post, with its title and description read out of the rendered body. */
export async function fetchPost(slug: string): Promise<Post | null> {
  let html: string;
  try {
    html = rewriteBlogLinks(await fetchText(`${BASE}/${encodeURIComponent(slug)}?embed=true`));
  } catch {
    return null;
  }
  if (!html.trim()) return null;

  const heading = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const firstPara = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  const image = html.match(/<img[^>]+src="([^"]+)"/i);

  return {
    slug,
    html,
    title: heading ? plain(heading[1]) : slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    description: firstPara ? plain(firstPara[1]).slice(0, 155) : '',
    image: image ? image[1] : '',
  };
}
