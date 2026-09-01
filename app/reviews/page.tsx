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
const URL = `${SITE}/google-reviews-buyers-agent-sunshine-coast`;
const TITLE = "Client Reviews | Baxter & Mason";
const DESCRIPTION = `Google reviews from Sunshine Coast buyers represented by Baxter & Mason. ${DATA.googleTotals.ratingValue.toFixed(1)} from ${DATA.googleTotals.reviewCount} ${DATA.source} reviews.`;

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
      heroEyebrow="Reviews"
      heroTitle={
        <>
          What clients <span className="gi">actually say</span>.
        </>
      }
      heroSub={`${DATA.googleTotals.ratingValue.toFixed(1)} from ${DATA.googleTotals.reviewCount} ${DATA.source} reviews. The 20 latest reviews are shown below.`}
      showInsightsHead={false}
    >
      <JsonLd data={schema} />
      <div className="vx-reviews-intro">
        <p>
          Baxter &amp; Mason is a Sunshine Coast buyers agency. The cards below
          are live Google reviews from people we have represented, not quotes we
          wrote ourselves.
        </p>
        <p>
          Relocating families, first-home buyers and investors go through the
          same process: in-person inspections, overlay and flood checks, and
          negotiation that stays inside the brief. The longer purchase stories
          sit on <a href="/success-stories-buyers-agent-sunshine-coast">success stories</a>.{" "}
          <a href="/what-we-do-buyers-agent-sunshine-coast">What we do</a> covers the process.{" "}
          <a href="/services">Services</a> lists where we buy.
        </p>
        <div className="cta-row">
          <a className="btn" href="/book-a-free-discovery-call">
            Book a discovery call <span className="ar">→</span>
          </a>
          <a className="btn glass" href="/success-stories-buyers-agent-sunshine-coast">
            Read success stories
          </a>
        </div>
      </div>
      <h2 className="vx-reviews-heading">Latest Google reviews</h2>
      <VexurReviewsFrame />
    </BlogShell>
  );
}
