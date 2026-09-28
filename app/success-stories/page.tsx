import type { Metadata } from 'next';
import { preload } from 'react-dom';
import { StoryShell } from '../components/StoryShell';
import { StoryCard } from '../components/StoryCards';
import { JsonLd } from '../components/JsonLd';
import { SITE, breadcrumb, graph } from '../lib/seo';
import { fetchStories } from '../lib/caseStudySource';

/**
 * The Success Stories page, built from Sally's Case Studies in Vexur rather than hand-written.
 * Rendered on the server and revalidated hourly, like the blog, so a story she publishes in
 * Vexur appears here without a Website Lab publish, and crawlers get every card as HTML.
 */
export const revalidate = 3600;

const URL = `${SITE}/success-stories-buyers-agent-sunshine-coast`;
const TITLE = 'Success Stories | Baxter & Mason';
const DESCRIPTION =
  'Real results from Sunshine Coast buyers we have represented, from first home buyers and relocators to investors buying off-market and at auction.';
const HERO = '/images/hero-home.webp';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  robots: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
  openGraph: {
    type: 'website',
    title: TITLE,
    description: DESCRIPTION,
    url: URL,
    siteName: 'Baxter & Mason',
    locale: 'en_AU',
    images: [`${SITE}/images/hero-home.jpg`],
  },
  twitter: { card: 'summary_large_image' },
};

export default async function SuccessStoriesPage() {
  preload(HERO, { as: 'image', fetchPriority: 'high' });
  const stories = await fetchStories();

  const schema = graph([
    {
      '@type': 'CollectionPage',
      '@id': `${URL}#webpage`,
      url: URL,
      name: TITLE,
      description: DESCRIPTION,
      isPartOf: { '@id': `${SITE}/#website` },
      about: { '@id': `${SITE}/#organization` },
      inLanguage: 'en-AU',
      breadcrumb: { '@id': `${URL}#breadcrumb` },
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: stories.map((story, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `${SITE}${story.path}`,
          name: story.title,
        })),
      },
    },
    breadcrumb(URL, [{ name: 'Recent success stories', item: URL }]),
  ]);

  return (
    <StoryShell>
      <JsonLd data={schema} />
      <section className="page-hero img-hero" style={{ backgroundImage: `url('${HERO}')` }}>
        <div className="grain" />
        <div className="wrap">
          <div className="page-hero-copy">
            <span className="eyebrow rv">Success Stories</span>
            <h1 className="display rv d1">
              Recent success <span className="gi">stories</span>.
            </h1>
            <p className="sub rv d2">Don&apos;t just take our word for it.</p>
          </div>
        </div>
      </section>

      <section className="blk stories-page">
        <div className="wrap">
          <div className="head">
            <span className="eyebrow rv">Client stories</span>
            <h2 className="rv d1">Real buyers. Real results.</h2>
            <p className="intro rv d2">
              From off-market coastal homes to tight budgets, see how Sally helps Sunshine Coast buyers.
            </p>
          </div>
          <div className="guide-cards">
            {stories.map((story, index) => (
              <StoryCard key={story.slug} story={story} index={index} />
            ))}
          </div>
          <div className="guides-intro rv">
            <p>
              We are based in Buddina and work across the Sunshine Coast with brokers, conveyancers, and inspectors when
              clients need them.
            </p>
          </div>
        </div>
      </section>

      <section className="blk cred-band">
        <div className="wrap">
          <div className="cred-grid rv">
            <div className="cred-item">
              <span className="cred-val gi">Off-market</span>
              <span className="cred-label">First access to unlisted homes</span>
            </div>
            <div className="cred-item">
              <span className="cred-val">
                <span className="ct" data-to="30">
                  0
                </span>{' '}
                yrs
              </span>
              <span className="cred-label">A designer&apos;s eye for detail</span>
            </div>
            <div className="cred-item">
              <span className="cred-val gi">Only you</span>
              <span className="cred-label">Never the seller or developer</span>
            </div>
            <div className="cred-item">
              <span className="cred-val">Licensed QLD</span>
              <span className="cred-label">4684962 · Sunshine Coast buyers agent</span>
            </div>
          </div>
        </div>
      </section>
    </StoryShell>
  );
}
