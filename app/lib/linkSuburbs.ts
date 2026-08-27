import suburbs from '../../data/suburbs.json';

type Suburb = { slug: string; name: string; url: string };

// Longest names first so "Alexandra Headland" wins over a bare "Alexandra".
const SUBURBS = (suburbs as Suburb[]).slice().sort((a, b) => b.name.length - a.name.length);

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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
      const re = new RegExp(`(^|[\\s(,.])(${escapeRe(suburb.name)})(?=[\\s),.:;!?]|$)`);
      if (!re.test(inner)) continue;
      used.add(suburb.slug);
      return `<p>${inner.replace(re, `$1<a href="${suburb.url}">$2</a>`)}</p>`;
    }
    return whole;
  });
}
