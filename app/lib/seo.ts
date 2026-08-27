import organisation from '../../data/organisation.json';

export const SITE = 'https://www.baxtermason.com.au';
export const ORG_ID = `${SITE}/#organization`;
export const SITE_ID = `${SITE}/#website`;

export const ORGANISATION = organisation as Record<string, unknown>;

type Crumb = { name: string; item: string };

export function breadcrumb(url: string, trail: Crumb[]) {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${url}#breadcrumb`,
    itemListElement: [{ name: 'Home', item: `${SITE}/` }, ...trail].map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: crumb.item,
    })),
  };
}

export function website() {
  return {
    '@type': 'WebSite',
    '@id': SITE_ID,
    url: `${SITE}/`,
    name: 'Baxter & Mason Property Buyers Agent',
    inLanguage: 'en-AU',
    publisher: { '@id': ORG_ID },
  };
}

export function graph(nodes: unknown[]) {
  return { '@context': 'https://schema.org', '@graph': [ORGANISATION, website(), ...nodes] };
}

/** First ~155 characters of plain text, trimmed to a word boundary. */
export function summarise(html: string, limit = 155): string {
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#0?39;|&rsquo;|&#8217;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:]$/, '')}.`;
}
