import type { Metadata } from 'next';
import { BlogShell } from '../components/BlogShell';
import { JsonLd } from '../components/JsonLd';
import { SITE, ORG_ID, breadcrumb, graph } from '../lib/seo';
import reviewsData from '../../data/reviews.json';

/**
 * The old site had a reviews page, but the reviews sat inside a third-party
 * iframe, so nothing on the page told a search engine they were reviews. Here
 * they are real page content, and the Review / AggregateRating markup describes
 * exactly what is rendered below — nothing more.
 */
type Review = { id: string; author: string; rating: number; date: string; body: string };
type ReviewsFile = {
  source: string;
  aggregate: { ratingValue: number; reviewCount: number; bestRating: number; worstRating: number };
  reviews: Review[];
};

const DATA = reviewsData as ReviewsFile;
const URL = `${SITE}/reviews`;
const TITLE = 'Client Reviews | Baxter & Mason';
const DESCRIPTION = `What ${DATA.aggregate.reviewCount} Sunshine Coast buyers say about working with Baxter & Mason — every Google review, in full, unedited.`;

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

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-AU', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

function Stars({ rating }: { rating: number }) {
  return (
    <span className="review-stars" aria-label={`${rating} out of 5 stars`}>
      <span aria-hidden="true">{'★'.repeat(rating)}</span>
    </span>
  );
}

export default function ReviewsPage() {
  const { aggregate, reviews } = DATA;

  const schema = graph([
    {
      '@type': 'AggregateRating',
      '@id': `${URL}#aggregaterating`,
      itemReviewed: { '@id': ORG_ID },
      ratingValue: aggregate.ratingValue,
      reviewCount: aggregate.reviewCount,
      bestRating: aggregate.bestRating,
      worstRating: aggregate.worstRating,
    },
    ...reviews.map((review) => ({
      '@type': 'Review',
      '@id': `${URL}#review-${review.id}`,
      itemReviewed: { '@id': ORG_ID },
      author: { '@type': 'Person', name: review.author },
      datePublished: review.date,
      reviewBody: review.body,
      publisher: { '@type': 'Organization', name: DATA.source },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: review.rating,
        bestRating: aggregate.bestRating,
        worstRating: aggregate.worstRating,
      },
    })),
    {
      '@type': 'WebPage',
      '@id': `${URL}#webpage`,
      url: URL,
      name: TITLE,
      description: DESCRIPTION,
      isPartOf: { '@id': `${SITE}/#website` },
      breadcrumb: { '@id': `${URL}#breadcrumb` },
      inLanguage: 'en-AU',
    },
    breadcrumb(URL, [{ name: 'Reviews', item: URL }]),
  ]);

  return (
    <BlogShell
      heroTitle={
        <>
          What clients <span className="gi">actually say</span>.
        </>
      }
      heroSub={`${aggregate.ratingValue.toFixed(1)} from ${aggregate.reviewCount} ${DATA.source} reviews.`}
      showInsightsHead={false}
    >
      <JsonLd data={schema} />

      <div className="review-summary">
        <p className="review-summary-score">
          <span className="review-summary-value">{aggregate.ratingValue.toFixed(1)}</span>
          <Stars rating={aggregate.bestRating} />
        </p>
        <p className="review-summary-note">
          {aggregate.reviewCount} {DATA.source} reviews. The {reviews.length} below are reproduced in
          full, exactly as they were written.
        </p>
      </div>

      <ul className="review-list">
        {reviews.map((review) => (
          <li key={review.id} className="review">
            <div className="review-head">
              <span className="review-author">{review.author}</span>
              <Stars rating={review.rating} />
              <time className="review-date" dateTime={review.date}>
                {formatDate(review.date)}
              </time>
            </div>
            {review.body.split('\n').filter(Boolean).map((para, i) => (
              <p key={i} className="review-body">
                {para}
              </p>
            ))}
          </li>
        ))}
      </ul>
    </BlogShell>
  );
}
