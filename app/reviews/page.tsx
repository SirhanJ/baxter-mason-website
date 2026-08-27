import type { Metadata } from "next";
import { BlogShell } from "../components/BlogShell";
import { JsonLd } from "../components/JsonLd";
import { VexurReviewsFrame } from "../components/VexurReviewsFrame";
import { SITE, breadcrumb, graph } from "../lib/seo";
import reviewsData from "../../data/reviews.json";

/**
 * Visible reviews come from the Vexur widget, so this page must not declare
 * Review or AggregateRating nodes. Those would describe text that is not in
 * the HTML. googleTotals is prose only, for the hero line.
 */
type ReviewsFile = {
  source: string;
  googleTotals: { ratingValue: number; reviewCount: number };
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
  const schema = graph([
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
