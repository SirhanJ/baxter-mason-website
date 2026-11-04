import reviewedSummaries from "../../data/reviewed-blog-summaries.json";
import { localBlogImage } from './rewriteBlogLinks';

/**
 * Small, pure changes to the blog HTML that Vexur renders (blog-render), made on this site so the
 * Vexur template does not have to change. blogSource.ts calls them once per post or archive fetch.
 */

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * The template opens with two Google Fonts @import rules inside a <style> in the body, so the browser
 * finds them late and each one blocks rendering. Inter is not used by anything in the embed. Montserrat is
 * (headings and card text), so it is now requested once from the page head in app/layout.tsx instead.
 */
export function stripFontImports(html: string): string {
  return html.replace(
    /[ \t]*@import\s+url\(\s*['"]?https:\/\/fonts\.googleapis\.com\/css2\?family=(?:Montserrat|Inter)[^'")]*['"]?\s*\)\s*;?[ \t]*\r?\n?/g,
    '',
  );
}

/**
 * Width and height on the images whose size the template's own CSS already fixes: the 16:9 featured
 * image and card pictures, and the round author photos. The attributes match the CSS, so nothing moves;
 * they only let the browser reserve the space before the picture arrives.
 */
const IMAGE_SIZES: Record<string, [number, number]> = {
  'article-featured-image': [1280, 720],
  'blog-card-image': [768, 432],
  'article-author-inline': [32, 32],
  'author-bio': [72, 72],
  'blog-card-author': [28, 28],
};

export function addImageSizes(html: string): string {
  return html.replace(/<img\b[^>]*>/gi, (tag: string, offset: number) => {
    if (/\swidth=/i.test(tag)) return tag;
    const before = html.slice(Math.max(0, offset - 200), offset);
    const holder = before.match(/class="(article-featured-image|blog-card-image|article-author-inline|author-bio|blog-card-author)"[^>]*>\s*$/);
    if (!holder) return tag;
    const [width, height] = IMAGE_SIZES[holder[1]];
    return `<img width="${width}" height="${height}"${tag.slice(4)}`;
  });
}

export type RelatedMeta = {
  slug: string;
  title?: string | null;
  excerpt?: string | null;
  og_image?: string | null;
  published_at?: string | null;
  read_time_minutes?: number | null;
  tags?: string[] | null;
  category?: { slug?: string | null } | null;
};

const tagsOf = (post: RelatedMeta) => (post.tags || []).map((tag) => tag.trim().toLowerCase()).filter(Boolean);

const STOP_WORDS = new Set([
  'about', 'after', 'agent', 'agents', 'amp', 'and', 'are', 'buyer', 'buyers', 'buying', 'coast', 'does', 'for', 'from',
  'have', 'how', 'into', 'its', 'not', 'our', 'property', 'sunshine', 'that', 'the', 'their', 'this', 'what', 'when',
  'why', 'with', 'you', 'your',
]);

/** The words that set a title apart (no filler, no words every post uses). */
const wordsOf = (post: RelatedMeta) =>
  new Set(
    (post.title || '')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 3 && !STOP_WORDS.has(word)),
  );

/** A fixed, even-looking number for a pair of posts, so ties between equally related posts differ by post. */
function pairHash(a: string, b: string): number {
  let hash = 2166136261;
  for (const char of `${a}|${b}`) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}

/**
 * Three posts that share a tag with this one. A tag only a few posts use counts for more than
 * "Sunshine Coast", which nearly all of them carry; posts with the same tags are then ordered by the
 * words their titles share with this post, and any tie that remains is broken by a fixed hash of the pair,
 * so it differs from post to post. If fewer than three share a tag, the newest posts fill the rest.
 * Without this every post showed the same three, whichever post it was.
 */
export function pickRelated(current: RelatedMeta, all: RelatedMeta[], count = 3): RelatedMeta[] {
  const others = all.filter((post) => post.slug !== current.slug && post.title);
  const useCount = new Map<string, number>();
  for (const post of all) for (const tag of new Set(tagsOf(post))) useCount.set(tag, (useCount.get(tag) || 0) + 1);

  const mine = new Set(tagsOf(current));
  const myWords = wordsOf(current);
  const score = (post: RelatedMeta) => {
    let total = 0;
    for (const tag of new Set(tagsOf(post))) if (mine.has(tag)) total += 1 / (useCount.get(tag) || 1);
    if (current.category?.slug && post.category?.slug === current.category.slug) total += 0.25;
    if (total === 0) return 0;
    for (const word of wordsOf(post)) if (myWords.has(word)) total += 0.02;
    return total;
  };
  const time = (post: RelatedMeta) => (post.published_at ? Date.parse(post.published_at) || 0 : 0);
  const newestFirst = (a: RelatedMeta, b: RelatedMeta) => time(b) - time(a) || a.slug.localeCompare(b.slug);

  const ranked = others
    .map((post) => ({ post, score: score(post) }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        pairHash(current.slug, a.post.slug) - pairHash(current.slug, b.post.slug) ||
        newestFirst(a.post, b.post),
    );
  const chosen = ranked.filter((entry) => entry.score > 0).slice(0, count).map((entry) => entry.post);
  if (chosen.length < count) {
    const have = new Set(chosen.map((post) => post.slug));
    for (const post of others.slice().sort(newestFirst)) {
      if (chosen.length >= count) break;
      if (!have.has(post.slug)) chosen.push(post);
    }
  }
  return chosen;
}

function cardImage(src: string | null | undefined, alt: string): string {
  if (!src) return '<div class="blog-card-image-placeholder" role="img" aria-label=""></div>';
  const stored = src.match(/^(https:\/\/[^/]+)\/storage\/v1\/object\/public\/(.+)$/);
  if (stored) {
    const render = (width: number) =>
      esc(`${stored[1]}/storage/v1/render/image/public/${stored[2]}?width=${width}&quality=80&resize=contain&format=webp`);
    return `<img src="${render(768)}" srcset="${render(400)} 400w, ${render(600)} 600w, ${render(768)} 768w" sizes="(max-width: 768px) 100vw, 384px" loading="lazy" decoding="async" width="768" height="432" alt="${esc(alt)}">`;
  }
  return `<img src="${esc(localBlogImage(src))}" loading="lazy" decoding="async" width="768" height="432" alt="${esc(alt)}">`;
}

function relatedCard(post: RelatedMeta, avatar: string | null): string {
  const title = post.title || post.slug;
  const date = post.published_at ? new Date(post.published_at) : null;
  const dateText =
    date && !Number.isNaN(date.getTime())
      ? date.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Australia/Brisbane' })
      : '';
  const minutes = post.read_time_minutes ? `${post.read_time_minutes} min read` : '';
  return `
    <a href="/blog/${esc(post.slug)}" class="blog-card">
      <div class="blog-card-image">
        ${cardImage(post.og_image, title)}
      </div>
      <div class="blog-card-content">
        <h2 class="blog-card-title">
          ${esc(title)}
        </h2>
        <p class="blog-card-excerpt">${esc((reviewedSummaries as Record<string, string>)[post.slug] || post.excerpt || '')}</p>${
          avatar
            ? `
          <div class="blog-card-author">
            <img src="${avatar}" alt="Sally Blyth" loading="lazy" decoding="async" width="28" height="28">
            <span>Author: Sally Blyth</span>
          </div>`
            : ''
        }
        <div class="blog-card-meta">
          <span class="blog-card-meta-read">${esc(minutes)}</span>
          <span class="blog-card-meta-end">
            <span class="blog-card-meta-date">${esc(dateText)}</span>
            <span class="blog-card-read-more">Read more →</span>
          </span>
        </div>
      </div>
    </a>`;
}

const GRID_OPEN = '<div class="related-posts-grid">';

/** Swap the template's "More to Read" cards (always the three newest) for posts that relate to this one. */
export function withRelatedPosts(html: string, current: RelatedMeta, all: RelatedMeta[]): string {
  const start = html.indexOf(GRID_OPEN);
  if (start < 0 || all.length === 0) return html;
  const sectionEnd = html.indexOf('</section>', start);
  const gridClose = sectionEnd < 0 ? -1 : html.lastIndexOf('</div>', sectionEnd);
  if (gridClose < start) return html;
  const chosen = pickRelated(current, all);
  if (chosen.length === 0) return html;
  const avatar = html.match(/<div class="author-bio">\s*<img src="([^"]+)"/)?.[1] || null;
  const cards = chosen.map((post) => relatedCard(post, avatar)).join('');
  return `${html.slice(0, start + GRID_OPEN.length)}${cards}\n      ${html.slice(gridClose)}`;
}
