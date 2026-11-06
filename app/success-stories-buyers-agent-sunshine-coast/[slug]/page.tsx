import { searchTitle } from '../../lib/searchTitle';
import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { BlogShell } from '../../components/BlogShell';
import { JsonLd } from '../../components/JsonLd';
import { SITE, ORG_ID, breadcrumb, graph } from '../../lib/seo';
import { linkSuburbs } from '../../lib/linkSuburbs';
import {
  STORY_LISTING_PATH,
  existingSitePath,
  fetchStoriesNeedingPage,
  fetchStoryBody,
  fetchStoryMeta,
  storyCanonical,
  storyPath,
} from '../../lib/caseStudySource';

/**
 * One page per success story that does not already have an address on this site, filled from Vexur
 * (Case Studies) the way /blog/<slug> is filled from the blog. Stories that do have one (the old
 * /post/ pages and the /story-... pages, named by their Vexur canonical) keep it: a request for the
 * new address is sent there with a permanent redirect, so nothing is served twice and nothing that
 * ranks today moves.
 */
export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const stories = await fetchStoriesNeedingPage();
  return stories.map((story) => ({ slug: story.slug }));
}

type Props = { params: Promise<{ slug: string }> };

/** A story that already has a page here is sent to it; one that does not exist reports no metadata. */
async function loadStory(slug: string) {
  const meta = await fetchStoryMeta(slug);
  if (!meta) return null;
  const existing = existingSitePath(meta);
  if (existing) permanentRedirect(existing);
  return meta;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const meta = await loadStory(slug);
  if (!meta) return { title: 'Success story not found | Baxter & Mason' };

  const canonical = await storyCanonical(meta);
  const title = meta.meta_title || meta.title;
  const description = meta.meta_description || meta.excerpt;
  return {
    title: searchTitle(storyPath(meta.slug), `${title} | Baxter & Mason`),
    description,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      title,
      description,
      url: canonical,
      siteName: 'Baxter & Mason',
      locale: 'en_AU',
      images: meta.og_image ? [meta.og_image] : undefined,
    },
    twitter: { card: 'summary_large_image' },
  };
}

export default async function SuccessStoryPage({ params }: Props) {
  const { slug } = await params;
  const meta = await loadStory(slug);
  if (!meta) notFound();
  const story = await fetchStoryBody(meta.slug);
  if (!story) notFound();

  const url = await storyCanonical(meta);
  const description = meta.meta_description || meta.excerpt;
  const schema = graph([
    {
      '@type': 'Article',
      '@id': `${url}#article`,
      headline: meta.title,
      description,
      url,
      image: meta.og_image || undefined,
      datePublished: meta.published_at || undefined,
      dateModified: meta.updated_at || meta.published_at || undefined,
      author: { '@id': ORG_ID },
      publisher: { '@id': ORG_ID },
      inLanguage: 'en-AU',
      mainEntityOfPage: { '@id': `${url}#webpage` },
    },
    {
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
      url,
      name: meta.title,
      description,
      isPartOf: { '@id': `${SITE}/#website` },
      breadcrumb: { '@id': `${url}#breadcrumb` },
      inLanguage: 'en-AU',
    },
    breadcrumb(url, [
      { name: 'Success stories', item: `${SITE}${STORY_LISTING_PATH}` },
      { name: meta.title, item: url },
    ]),
  ]);

  return (
    <BlogShell
      heroHeadingAs="h2"
      heroEyebrow="Success stories"
      heroTitle={
        <>
          Real <span className="gi">results</span>.
        </>
      }
      heroSub="Buyers we have helped on the Sunshine Coast."
      showInsightsHead={false}
    >
      <JsonLd data={schema} />
      <p className="blog-back-row">
        <a className="blog-back" href={STORY_LISTING_PATH}>
          <span className="ar">←</span> Back to success stories
        </a>
      </p>
      <h1>{meta.title}</h1>
      <style dangerouslySetInnerHTML={{ __html: story.css }} />
      <div className="cs-embed" dangerouslySetInnerHTML={{ __html: linkSuburbs(story.html) }} />
    </BlogShell>
  );
}
