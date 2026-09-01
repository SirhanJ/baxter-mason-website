import type { Metadata } from 'next';
import { BlogShell } from '../components/BlogShell';
import { BlogArchive } from '../components/BlogArchive';
import { JsonLd } from '../components/JsonLd';
import { SITE, breadcrumb, graph } from '../lib/seo';
import { fetchArchive, fetchPostCards } from '../lib/blogSource';
import { canonicalPostPathForCurrent } from '../lib/blogCanonical';

/**
 * The archive used to be fetched in the browser, which meant no crawler ever
 * saw a single post link. It is rendered on the server now and revalidated
 * hourly, so the whole blog is reachable from one static page.
 */
export const revalidate = 3600;

const URL = `${SITE}/blogs-buyers-agent-sunshine-coast`;
const TITLE = 'Blog | Baxter & Mason';
const DESCRIPTION =
  'Sunshine Coast property insight from a working buyers agency: market reads, buying strategy and what we are seeing on the ground.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: {
    type: 'website',
    title: TITLE,
    description: DESCRIPTION,
    url: URL,
    siteName: 'Baxter & Mason',
    locale: 'en_AU',
  },
  twitter: { card: 'summary_large_image' },
};

export default async function BlogIndexPage() {
  const [html, cards] = await Promise.all([
    fetchArchive().catch(() => ''),
    fetchPostCards(),
  ]);

  const schema = graph([
    {
      '@type': 'Blog',
      '@id': `${URL}#blog`,
      url: URL,
      name: TITLE,
      description: DESCRIPTION,
      inLanguage: 'en-AU',
      blogPost: cards.map((card) => ({
        '@type': 'BlogPosting',
        headline: card.title,
        url: `${SITE}${canonicalPostPathForCurrent(card.slug)}`,
        description: card.excerpt || undefined,
      })),
    },
    {
      '@type': 'CollectionPage',
      '@id': `${URL}#webpage`,
      url: URL,
      name: TITLE,
      description: DESCRIPTION,
      isPartOf: { '@id': `${SITE}/#website` },
      breadcrumb: { '@id': `${URL}#breadcrumb` },
      inLanguage: 'en-AU',
    },
    breadcrumb(URL, [{ name: 'Blog', item: URL }]),
  ]);

  return (
    <BlogShell
      heroTitle={
        <>
          From the <span className="gi">blog</span>.
        </>
      }
      heroSub="Insights for Sunshine Coast buyers."
      showInsightsHead
    >
      <JsonLd data={schema} />
      {html ? (
        <BlogArchive html={html} />
      ) : (
        <>
          <p>The archive is not loading right now. Every post is still listed below.</p>
          <ul className="blog-fallback-list">
            {cards.map((card) => (
              <li key={card.slug}>
                <a href={canonicalPostPathForCurrent(card.slug)}>{card.title}</a>
              </li>
            ))}
          </ul>
        </>
      )}
    </BlogShell>
  );
}
