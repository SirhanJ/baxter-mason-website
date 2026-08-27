import type { MetadataRoute } from 'next';
import fs from 'fs';
import path from 'path';
import { SITE } from './lib/seo';
import { fetchPostCards } from './lib/blogSource';
import legacyPosts from '../data/legacy-posts.json';

/**
 * Built from the routes that actually exist, rather than maintained by hand.
 * The old sitemap listed 88 addresses with a .html extension and no blog posts
 * at all; drift like that is how a third of a site goes unseen.
 */
export const revalidate = 3600;

function priorityFor(slug: string): number {
  if (slug === 'index') return 1;
  if (/-buyers-agent$/.test(slug)) return 0.8;
  if (['services', 'what-we-do', 'contact', 'success-stories', 'blog'].includes(slug)) return 0.8;
  if (/^story-/.test(slug)) return 0.6;
  if (['privacy', 'terms'].includes(slug)) return 0.2;
  return 0.6;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages = fs
    .readdirSync(path.join(process.cwd(), 'public'))
    .filter((file) => file.endsWith('.html'))
    .map((file) => file.replace(/\.html$/, ''))
    // /blog is an App Router page now, not a file in public.
    .filter((slug) => slug !== 'blog')
    .map((slug) => ({
      url: slug === 'index' ? `${SITE}/` : `${SITE}/${slug}`,
      lastModified: now,
      changeFrequency: (slug === 'index' ? 'weekly' : 'monthly') as 'weekly' | 'monthly',
      priority: priorityFor(slug),
    }));

  const cards = await fetchPostCards();
  const blogPosts = cards.map((card) => ({
    url: `${SITE}/blog/${card.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  const preserved = (legacyPosts as { slug: string; published: string }[]).map((post) => ({
    url: `${SITE}/post/${post.slug}`,
    lastModified: post.published ? new Date(`${post.published}T00:00:00Z`) : now,
    changeFrequency: 'yearly' as const,
    priority: 0.5,
  }));

  // App Router pages that have no file in public/ and so are not picked up above.
  // /thank-you is deliberately absent: it is noindex.
  const appPages = [
    { url: `${SITE}/blog`, changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${SITE}/reviews`, changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: `${SITE}/link-in-bio`, changeFrequency: 'monthly' as const, priority: 0.4 },
  ].map((page) => ({ ...page, lastModified: now }));

  return [...appPages, ...staticPages, ...blogPosts, ...preserved];
}
