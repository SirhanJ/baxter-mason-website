import { cache } from 'react';

import legacyFile from '../../data/story-legacy.json';

/**
 * Success stories come from Sally's Case Studies in Vexur, through the same public render
 * function that feeds the case study widget. It is the case study twin of blogSource.ts: the
 * site fetches on the server, renders its own markup, and revalidates hourly, so a story
 * published in Vexur shows up without a Website Lab publish and crawlers still get HTML.
 *
 * Two calls are used:
 *   ?metadata=true on the account  every published story, newest first (titles, summaries, dates)
 *   the story's own page           its body and cover alt text, read out of the rendered HTML
 * Both are unaffected by the widget's on/off switch and domain list, which only govern embeds,
 * so a settings change in Vexur cannot blank the story pages.
 */

/**
 * Addressed by account id, not by the /case-study-render/<slug> path: the function only strips
 * /functions/v1/ from the path and the runtime hands it /case-study-render/..., so the path form
 * resolves the account as "case-study-render" and 404s (checked 28 Sep 2026). The id is the
 * same public one the home page blog widget already carries in data-agent.
 */
const RENDER =
  process.env.CASE_STUDY_RENDER_URL || 'https://pgsnbsjtpxfmzedjldyu.supabase.co/functions/v1/case-study-render';
const ACCOUNT = '09a089fd-72c0-412d-bb2b-0b0ab9cc4ecd';
const SITE = 'https://www.baxtermason.com.au';

const listingUrl = () => `${RENDER}?user_id=${ACCOUNT}&metadata=true`;
const storyUrl = (slug: string, mode: 'metadata' | 'page') =>
  `${RENDER}?user_id=${ACCOUNT}&post=${encodeURIComponent(slug)}${mode === 'metadata' ? '&metadata=true' : ''}`;

/** An hour of ISR, matching the blog. */
export const CASE_STUDY_REVALIDATE = 3600;

type MetadataItem = {
  slug: string;
  title: string;
  meta_title?: string | null;
  meta_description?: string | null;
  excerpt?: string | null;
  og_image?: string | null;
  canonical_url?: string | null;
  published_at?: string | null;
  updated_at?: string | null;
};

type LegacyStory = {
  readMinutes: number;
  featuredImage: string;
  heroImage?: string;
  ogImage?: string;
};

const LEGACY = (legacyFile as { stories: Record<string, LegacyStory> }).stories;

export type Story = {
  slug: string;
  /** Address on this site: /post/<slug>, or the two stories that always lived at the root. */
  path: string;
  title: string;
  seoTitle: string;
  description: string;
  excerpt: string;
  /** Publication date in Brisbane time, YYYY-MM-DD. */
  date: string;
  updated: string;
  readMinutes: number;
  /** Cover photo, also the card image. */
  image: string;
  imageAlt: string;
  /** The page-top banner. The cover, unless an imported story carried a different banner. */
  heroImage: string;
  /** Absolute share image. */
  ogImage: string;
};

export type StoryWithBody = Story & { bodyHtml: string };

const unesc = (s: string) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

/** Same-origin images render as paths, exactly as the hand-written pages referenced them. */
function sitePath(url: string | null | undefined): string {
  if (!url) return '';
  let out = url.trim();
  for (const origin of [SITE, 'https://baxtermason.com.au']) {
    if (out.startsWith(origin)) out = out.slice(origin.length);
  }
  if (out.startsWith('//images/')) out = out.slice(1);
  return out;
}

const absolute = (url: string) => (url.startsWith('/') ? `${SITE}${url}` : url);

function pathFor(item: MetadataItem): string {
  const canonical = item.canonical_url || '';
  if (canonical.startsWith(SITE)) {
    const path = canonical.slice(SITE.length).replace(/\/+$/, '');
    if (path) return path;
  }
  return `/post/${item.slug}`;
}

const BRISBANE_DATE = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Australia/Brisbane',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function brisbaneDate(iso: string | null | undefined): string {
  const when = iso ? new Date(iso) : new Date();
  return BRISBANE_DATE.format(Number.isNaN(when.getTime()) ? new Date() : when);
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** "August 24, 2026", the format the story cards and pages have always used. */
export function formatStoryDate(date: string, { padDay = false }: { padDay?: boolean } = {}): string {
  const [y, m, d] = date.split('-').map(Number);
  const day = padDay ? String(d).padStart(2, '0') : String(d);
  return `${MONTHS[(m || 1) - 1]} ${day}, ${y}`;
}

export const readTimeLabel = (minutes: number) => `${minutes} min read`;

/** Words over 200 a minute, never under a minute. */
export function readMinutesFor(html: string): number {
  const words = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/**
 * Story bodies written in the Vexur editor come back as plain lists. The site's bullets hang
 * off .blog-article-list, so give a plain list that class and an edited story keeps its look.
 */
function normaliseBody(html: string): string {
  return html.replace(/<ul>/gi, '<ul class="blog-article-list">').trim();
}

async function fetchText(url: string): Promise<{ status: number; text: string }> {
  const response = await fetch(url, {
    headers: { Referer: `${SITE}/` },
    next: { revalidate: CASE_STUDY_REVALIDATE },
  });
  return { status: response.status, text: await response.text() };
}

function toStory(item: MetadataItem, overrides: { image?: string; imageAlt?: string; bodyHtml?: string } = {}): Story {
  const legacy = LEGACY[item.slug];
  const image = overrides.image || sitePath(item.og_image);
  const legacyApplies = Boolean(legacy && legacy.featuredImage === image);
  const readMinutes =
    legacy?.readMinutes ?? (overrides.bodyHtml ? readMinutesFor(overrides.bodyHtml) : 1);

  return {
    slug: item.slug,
    path: pathFor(item),
    title: item.title,
    seoTitle: item.meta_title || item.title,
    description: item.meta_description || item.excerpt || '',
    excerpt: item.excerpt || '',
    date: brisbaneDate(item.published_at),
    updated: brisbaneDate(item.updated_at || item.published_at),
    readMinutes,
    image,
    imageAlt: overrides.imageAlt || item.title,
    heroImage: (legacyApplies && legacy?.heroImage) || image,
    ogImage: (legacyApplies && legacy?.ogImage) || absolute(image),
  };
}

/** Pull the body and the cover's alt text out of the rendered story page. */
function parseStoryPage(html: string): { image: string; imageAlt: string; bodyHtml: string } {
  const hero = html.match(/<img class="cs-detail-hero" src="([^"]*)" alt="([^"]*)">/);
  const start = html.indexOf('<div class="cs-content">');
  const end = html.indexOf('<div class="cs-share">', start);
  let body = start === -1 ? '' : html.slice(start + '<div class="cs-content">'.length, end === -1 ? undefined : end);
  body = body
    .replace(/\s*<img class="cs-detail-hero"[^>]*>\s*$/, '')
    .replace(/\s*<\/div>\s*$/, '');
  return {
    image: hero ? sitePath(unesc(hero[1])) : '',
    imageAlt: hero ? unesc(hero[2]) : '',
    bodyHtml: normaliseBody(body),
  };
}

/** One story with its body, or null when it is missing or unpublished. */
export const fetchStory = cache(async (slug: string): Promise<StoryWithBody | null> => {
  const [meta, page] = await Promise.all([fetchText(storyUrl(slug, 'metadata')), fetchText(storyUrl(slug, 'page'))]);
  if (meta.status === 404) return null;
  if (meta.status !== 200) throw new Error(`case-study-render ${meta.status} for ${slug}`);
  if (page.status !== 200) throw new Error(`case-study-render page ${page.status} for ${slug}`);

  const item = JSON.parse(meta.text) as MetadataItem;
  const parsed = parseStoryPage(page.text);
  return { ...toStory(item, parsed), bodyHtml: parsed.bodyHtml };
});

/**
 * Every published story, newest first. Throws when Vexur cannot answer, so a failed hourly
 * refresh keeps serving the last good page rather than an empty list.
 */
export const fetchStories = cache(async (): Promise<Story[]> => {
  const listing = await fetchText(listingUrl());
  if (listing.status !== 200) throw new Error(`case-study-render listing ${listing.status}`);
  const items = (JSON.parse(listing.text) as { case_studies?: MetadataItem[] }).case_studies || [];

  // Imported stories carry their read time; a story written in Vexur needs its body counted.
  return Promise.all(
    items.map(async (item) => {
      if (LEGACY[item.slug]) return toStory(item);
      const story = await fetchStory(item.slug).catch(() => null);
      return story ? stripBody(story) : toStory(item);
    }),
  );
});

function stripBody(story: StoryWithBody): Story {
  const { bodyHtml: _body, ...rest } = story;
  void _body;
  return rest;
}

/**
 * The two stories after this one in the listing, wrapping to the newest, which is how the
 * hand-written pages chose their "More success stories".
 */
export function relatedStories(all: Story[], slug: string): Story[] {
  const index = all.findIndex((story) => story.slug === slug);
  if (index === -1 || all.length < 2) return all.filter((story) => story.slug !== slug).slice(0, 2);
  const out: Story[] = [];
  for (let step = 1; out.length < 2 && step < all.length; step += 1) {
    out.push(all[(index + step) % all.length]);
  }
  return out;
}
