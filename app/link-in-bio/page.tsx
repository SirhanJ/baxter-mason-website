import type { Metadata } from 'next';
import { BlogShell } from '../components/BlogShell';
import { JsonLd } from '../components/JsonLd';
import { SITE, breadcrumb, graph } from '../lib/seo';

/**
 * The destination in the Instagram and TikTok bios. It existed on the old site
 * and every social click still points at this exact path, so it has to be a
 * real page here before the domain moves.
 */
const URL = `${SITE}/link-in-bio`;
const TITLE = 'Start here | Baxter & Mason';
const DESCRIPTION =
  'Everything in one place: who we are, what we do, real client outcomes, and a link to book a free discovery call with a Sunshine Coast buyers agent.';

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

const LINKS: { href: string; label: string; note: string }[] = [
  {
    href: '/contact',
    label: 'Book a free discovery call',
    note: '30 minutes, no obligation. The fastest way to work out whether we can help.',
  },
  {
    href: '/what-we-do',
    label: 'What we do',
    note: 'How a buyers agency actually works, what we charge, and what you get.',
  },
  {
    href: '/our-people',
    label: 'Who we are',
    note: 'A woman-led buyers agency based in Buddina, buying across the Sunshine Coast.',
  },
  {
    href: '/success-stories',
    label: 'Success stories',
    note: 'Real purchases, real numbers — from first homes to dual-income investments.',
  },
  {
    href: '/services',
    label: 'Where we buy',
    note: 'Thirty suburbs from Caloundra to Noosa, each one covered properly.',
  },
  {
    href: '/free-guides',
    label: 'Free guides',
    note: 'The checklists and explainers we hand our own clients.',
  },
  {
    href: '/blog',
    label: 'The blog',
    note: 'Market reads and buying strategy, written between inspections.',
  },
  {
    href: '/faq',
    label: 'FAQs',
    note: 'The questions we get asked before every engagement.',
  },
];

export default function LinkInBioPage() {
  const schema = graph([
    {
      '@type': 'WebPage',
      '@id': `${URL}#webpage`,
      url: URL,
      name: TITLE,
      description: DESCRIPTION,
      isPartOf: { '@id': `${SITE}/#website` },
      breadcrumb: { '@id': `${URL}#breadcrumb` },
      inLanguage: 'en-AU',
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: LINKS.map((link, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: link.label,
          url: `${SITE}${link.href}`,
        })),
      },
    },
    breadcrumb(URL, [{ name: 'Start here', item: URL }]),
  ]);

  return (
    <BlogShell
      heroTitle={
        <>
          Start <span className="gi">here</span>.
        </>
      }
      heroSub="You came from our bio. Everything worth reading is below."
      showInsightsHead={false}
    >
      <JsonLd data={schema} />
      <ul className="bio-links">
        {LINKS.map((link) => (
          <li key={link.href}>
            <a className="bio-link" href={link.href}>
              <span className="bio-link-label">
                {link.label} <span className="ar">→</span>
              </span>
              <span className="bio-link-note">{link.note}</span>
            </a>
          </li>
        ))}
      </ul>
    </BlogShell>
  );
}
