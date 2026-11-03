import { cache } from 'react';

import { SITE } from './seo';

/**
 * Success stories live in Vexur (Case Studies). This is the story twin of blogSource.ts: it reads
 * case-study-render, the same way the blog reads blog-render, so a story that has no page of its own
 * on this site gets one at /success-stories-buyers-agent-sunshine-coast/<slug>.
 *
 * Stories that already have an address here (the old /post/ pages and the /story-... pages) keep it:
 * their Vexur canonical_url says so, and the new route sends the request there instead of serving
 * the story a second time.
 */
const BASE = 'https://pgsnbsjtpxfmzedjldyu.supabase.co/functions/v1/case-study-render';
const USER_ID = '09a089fd-72c0-412d-bb2b-0b0ab9cc4ecd';

/** An hour of ISR, like the blog: a publish also queues a redeploy, so new stories appear sooner. */
export const STORY_REVALIDATE = 3600;

export const STORY_LISTING_PATH = '/success-stories-buyers-agent-sunshine-coast';

/** The address of a story's own page, used when it has none already. */
export const storyPath = (slug: string) => `${STORY_LISTING_PATH}/${encodeURIComponent(slug)}`;

export type StoryMeta = {
  slug: string;
  title: string;
  meta_title: string;
  meta_description: string;
  excerpt: string;
  og_image: string | null;
  canonical_url: string | null;
  published_at: string | null;
  updated_at: string | null;
};

/** Vexur says this story does not exist (case-study-render answered 404). */
class StoryMissing extends Error {}

/** Three tries; only a real 404 means missing, so a bad moment is never cached as a missing page. */
async function fetchText(url: string): Promise<string> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, { next: { revalidate: STORY_REVALIDATE } });
      if (response.status === 404) throw new StoryMissing(`case-study-render 404 for ${url}`);
      if (!response.ok) throw new Error(`case-study-render ${response.status} for ${url}`);
      return await response.text();
    } catch (error) {
      if (error instanceof StoryMissing) throw error;
      lastError = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 750));
    }
  }
  throw lastError;
}

function query(params: Record<string, string>): string {
  return `${BASE}?${new URLSearchParams({ user_id: USER_ID, ...params })}`;
}

/** Every published story, newest first. Empty when Vexur cannot be reached (the sitemap then skips them). */
export async function fetchStoryList(): Promise<StoryMeta[]> {
  try {
    const data = JSON.parse(await fetchText(query({ metadata: 'true' })));
    return Array.isArray(data?.case_studies) ? (data.case_studies as StoryMeta[]) : [];
  } catch {
    return [];
  }
}

/** The metadata for one story, or null when it does not exist. Other failures throw. */
export const fetchStoryMeta = cache(async (slug: string): Promise<StoryMeta | null> => {
  try {
    const data = JSON.parse(await fetchText(query({ metadata: 'true', post: slug })));
    return typeof data?.slug === 'string' ? (data as StoryMeta) : null;
  } catch (error) {
    if (error instanceof StoryMissing) return null;
    throw error;
  }
});

/**
 * Where a story is already published on this site, as a path, or null when it has no page here yet.
 * A saved canonical on this site that is not the story's own new address wins (/post/<slug>,
 * /story-...). The "#story-" form used before stories had pages is not a page.
 */
export function existingSitePath(meta: Pick<StoryMeta, 'slug' | 'canonical_url'>): string | null {
  const canonical = meta.canonical_url?.trim();
  if (!canonical || canonical.includes('#')) return null;
  let parsed: URL;
  try {
    parsed = new URL(canonical);
  } catch {
    return null;
  }
  if (parsed.hostname.replace(/^www\./, '') !== new URL(SITE).hostname.replace(/^www\./, '')) return null;
  const path = parsed.pathname.replace(/\/+$/, '') || '/';
  return path === storyPath(meta.slug) ? null : path;
}

/** Rules in the story styles that reset the whole page, which would restyle this site's header. */
const PAGE_WIDE_RULES = /(?<=^|\})\s*(?:html|body|html\s*,\s*body|\*\s*,\s*\*::before\s*,\s*\*::after)\s*\{[^{}]*\}/g;

/** The markup inside the first element that opens with `open`, matching nested divs. */
function innerOf(html: string, open: string): string | null {
  const start = html.indexOf(open);
  if (start < 0) return null;
  const from = start + open.length;
  const tag = /<(\/?)div\b[^>]*>/gi;
  tag.lastIndex = from;
  let depth = 1;
  for (let m = tag.exec(html); m; m = tag.exec(html)) {
    depth += m[1] ? -1 : 1;
    if (depth === 0) {
      const inner = html.slice(from, m.index).trim();
      return inner || null;
    }
  }
  return null;
}

export type StoryBody = { css: string; html: string };

/**
 * The story as HTML: the picture, result facts, testimonial (only when the client agreed to it) and
 * the story itself, with its styles minus the rules that would reset the whole page. The title and
 * summary come from the metadata, so the heading, back link, sharing and branding are dropped.
 */
export const fetchStoryBody = cache(async (slug: string): Promise<StoryBody | null> => {
  let raw: string;
  try {
    raw = await fetchText(query({ embed: 'true', post: slug }));
  } catch (error) {
    if (error instanceof StoryMissing) return null;
    throw error;
  }
  const wrap = innerOf(raw, '<div class="cs-wrap cs-detail">');
  if (!wrap) throw new Error(`case-study-render returned no story body for ${slug}`);
  const css = Array.from(raw.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi))
    .map((m) => m[1])
    .join('\n')
    .replace(PAGE_WIDE_RULES, '');
  let html = wrap
    .replace(/<a class="cs-back"[^>]*>[\s\S]*?<\/a>/, '')
    .replace(/<h1 class="cs-detail-title">[\s\S]*?<\/h1>/, '')
    .replace(/<p class="cs-detail-excerpt">[\s\S]*?<\/p>/, '');
  const shareAt = html.indexOf('<div class="cs-share">');
  if (shareAt >= 0) html = html.slice(0, shareAt);
  html = html.trim();
  if (!html.includes('class="cs-content"')) throw new Error(`case-study-render returned no story text for ${slug}`);
  return { css, html };
});

/**
 * Stories that need the page this route serves, with their real change date for the sitemap: every
 * story without an address of its own on this site, and none that have one (those are already listed).
 * A story whose canonical points to another host is left out, as the blog does.
 */
export async function fetchStoriesNeedingPage(): Promise<StoryMeta[]> {
  const stories = await fetchStoryList();
  return stories.filter((story) => {
    if (existingSitePath(story)) return false;
    const canonical = story.canonical_url?.trim();
    if (!canonical || canonical.includes('#')) return true;
    return canonical.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/+$/, '') === `${SITE}${storyPath(story.slug)}`.replace(/^https?:\/\/(www\.)?/i, '');
  });
}
