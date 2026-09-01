import type { Metadata } from 'next';
import { BlogShell } from './components/BlogShell';
import suburbs from '../data/suburbs.json';

/**
 * After a migration this is the page that catches every URL a redirect rule
 * missed, so it carries the full nav, the suburb list and a way to book — not a
 * bare error string.
 */
export const metadata: Metadata = {
  title: 'Page not found | Baxter & Mason',
  robots: { index: false, follow: true },
};

type Suburb = { slug: string; name: string; url: string };

export default function NotFound() {
  const areas = suburbs as Suburb[];

  return (
    <BlogShell
      heroTitle={
        <>
          That page has <span className="gi">moved</span>.
        </>
      }
      heroSub="It may have a new address since we rebuilt the site. Here is everything else."
      showInsightsHead={false}
    >
      <div className="notfound">
        <p>
          If you followed a link here, try one of these — or{' '}
          <a href="/book-a-free-discovery-call">book a discovery call</a> and we will point you the right way.
        </p>

        <h2>The main pages</h2>
        <ul className="notfound-links">
          <li><a href="/">Home</a></li>
          <li><a href="/what-we-do-buyers-agent-sunshine-coast">What we do</a></li>
          <li><a href="/services">Services</a></li>
          <li><a href="/success-stories-buyers-agent-sunshine-coast">Success stories</a></li>
          <li><a href="/blogs-buyers-agent-sunshine-coast">Blog</a></li>
          <li><a href="/free-guides-and-downloads">Free guides</a></li>
          <li><a href="/FAQ-Buyers-Agent-Sunshine-Coast">FAQ</a></li>
          <li><a href="/our-people-buyers-agent-sunshine-coast">Our people</a></li>
          <li><a href="/contact">Contact</a></li>
        </ul>

        <h2>Where we buy</h2>
        <ul className="notfound-links notfound-links--areas">
          {areas.map((suburb) => (
            <li key={suburb.slug}>
              <a href={suburb.url}>{suburb.name}</a>
            </li>
          ))}
        </ul>
      </div>
    </BlogShell>
  );
}
