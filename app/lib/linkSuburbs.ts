import suburbs from '../../data/suburbs.json';

type Suburb = { slug: string; name: string; url: string };

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Longest names first so "Alexandra Headland" wins over a bare "Alexandra".
 *
 * The match pattern is built once per suburb here rather than inside the paragraph loop. It used
 * to be constructed with `new RegExp` for every suburb of every paragraph, so a 50KB article with
 * 60 paragraphs compiled 1,800 regexes per render. On Cloudflare that spent the Worker's CPU
 * budget and the request died with "Error 1102: Worker exceeded resource limits" - which is what
 * the intermittent 503s on blog posts were (2026-09-07).
 *
 * Safe to share across calls: no /g or /y flag, so there is no lastIndex state to leak between
 * requests.
 */
const SUBURBS = (suburbs as Suburb[])
  .slice()
  .sort((a, b) => b.name.length - a.name.length)
  .map((suburb) => ({
    ...suburb,
    pattern: new RegExp(`(^|[\\s(,.])(${escapeRe(suburb.name)})(?=[\\s),.:;!?]|$)`),
  }));

/**
 * Link the first mention of each serviced suburb in post copy through to that
 * suburb's page. The 30 suburb pages are the ones that earn the business and
 * the posts are the ones that earn the links, so this is where authority should
 * flow. Capped at one link per paragraph and one per suburb per post so the
 * copy still reads like prose.
 */
export function linkSuburbs(html: string, max = 6): string {
  if (!html) return html;
  const used = new Set<string>();

  return html.replace(/<p>([\s\S]*?)<\/p>/gi, (whole, inner: string) => {
    if (used.size >= max) return whole;
    if (/<a\b/i.test(inner)) return whole;

    for (const suburb of SUBURBS) {
      if (used.has(suburb.slug)) continue;
      if (!suburb.pattern.test(inner)) continue;
      used.add(suburb.slug);
      return `<p>${inner.replace(suburb.pattern, `$1<a href="${suburb.url}">$2</a>`)}</p>`;
    }
    return whole;
  });
}
