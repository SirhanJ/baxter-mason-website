import type { Metadata } from "next";
import { BlogShell } from "../components/BlogShell";
import { JsonLd } from "../components/JsonLd";
import { VexurReviewsFrame } from "../components/VexurReviewsFrame";
import { SITE, ORG_ID, breadcrumb, graph } from "../lib/seo";
import reviewsData from "../../data/reviews.json";

/**
 * Live reviews come from the Vexur Google Reviews widget. Schema still
 * describes the captured set in reviews.json so search engines see real
 * Review / AggregateRating markup for the same business.
 */
type Review = {
  id: string;
  author: string;
  rating: number;
  date: string;
  body: string;
};
type ReviewsFile = {
  source: string;
  aggregate: {
    ratingValue: number;
    reviewCount: number;
    bestRating: number;
    worstRating: number;
  };
  googleTotals: { ratingValue: number; reviewCount: number };
  reviews: Review[];
};

const DATA = reviewsData as ReviewsFile;
const URL = `${SITE}/reviews`;
const TITLE = "Client Reviews | Baxter & Mason";
const DESCRIPTION = `What Sunshine Coast buyers say about working with Baxter & Mason — ${DATA.googleTotals.reviewCount} Google reviews.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
    url: URL,
    siteName: "Baxter & Mason",
    locale: "en_AU",
  },
  twitter: { card: "summary_large_image" },
};

export default function ReviewsPage() {
  const { aggregate, reviews } = DATA;

  const schema = graph([
    {
      "@type": "AggregateRating",
      "@id": `${URL}#aggregaterating`,
      itemReviewed: { "@id": ORG_ID },
      ratingValue: aggregate.ratingValue,
      reviewCount: aggregate.reviewCount,
      bestRating: aggregate.bestRating,
      worstRating: aggregate.worstRating,
    },
    ...reviews.map((review) => ({
      "@type": "Review",
      "@id": `${URL}#review-${review.id}`,
      itemReviewed: { "@id": ORG_ID },
      author: { "@type": "Person", name: review.author },
      datePublished: review.date,
      reviewBody: review.body,
      publisher: { "@type": "Organization", name: DATA.source },
      reviewRating: {
        "@type": "Rating",
        ratingValue: review.rating,
        bestRating: aggregate.bestRating,
        worstRating: aggregate.worstRating,
      },
    })),
    {
      "@type": "WebPage",
      "@id": `${URL}#webpage`,
      url: URL,
      name: TITLE,
      description: DESCRIPTION,
      isPartOf: { "@id": `${SITE}/#website` },
      breadcrumb: { "@id": `${URL}#breadcrumb` },
      inLanguage: "en-AU",
    },
    breadcrumb(URL, [{ name: "Reviews", item: URL }]),
  ]);

  return (
    <BlogShell
      heroTitle={
        <>
          What clients <span className="gi">actually say</span>.
        </>
      }
      heroSub={`${DATA.googleTotals.ratingValue.toFixed(1)} from ${DATA.googleTotals.reviewCount} ${DATA.source} reviews.`}
      showInsightsHead={false}
    >
      <JsonLd data={schema} />
      <VexurReviewsFrame />
    </BlogShell>
  );
}
