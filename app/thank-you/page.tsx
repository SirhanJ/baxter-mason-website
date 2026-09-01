import type { Metadata } from "next";
import { BlogShell } from "../components/BlogShell";

/**
 * The form confirmation page. Conversion tracking on the old site is keyed to
 * this URL, so it has to keep existing at exactly this path or every enquiry
 * stops being recorded on cutover day.
 *
 * Deliberately noindex: it is a destination for people who have already
 * converted, not a search result.
 */
export const metadata: Metadata = {
  title: "Thank you | Baxter & Mason",
  description:
    "Your enquiry is with us. We will be in touch within one business day.",
  robots: { index: false, follow: true },
};

export default function ThankYouPage() {
  return (
    <BlogShell
      heroEyebrow="Contact"
      heroTitle={
        <>
          Thank you. <span className="gi">It is with us</span>.
        </>
      }
      heroSub="We will be in touch within one business day."
      showInsightsHead={false}
    >
      <div className="thankyou">
        <p>
          Someone from the team reads every enquiry personally. If it is urgent,
          call <a href="tel:+61490744453">+61 490 744 453</a> or email{" "}
          <a href="mailto:mail@baxtermason.com.au">mail@baxtermason.com.au</a>.
        </p>

        <h2>While you wait</h2>
        <ul className="notfound-links">
          <li>
            <a href="/google-reviews-buyers-agent-sunshine-coast">Read client reviews</a>
          </li>
          <li>
            <a href="/success-stories-buyers-agent-sunshine-coast">Read a few client outcomes</a>
          </li>
          <li>
            <a href="/what-we-do-buyers-agent-sunshine-coast">See exactly how we work</a>
          </li>
          <li>
            <a href="/free-guides-and-downloads">Download the buyer guides</a>
          </li>
          <li>
            <a href="/blogs-buyers-agent-sunshine-coast">Read the blog</a>
          </li>
        </ul>
      </div>
    </BlogShell>
  );
}
