import { searchTitle } from "../../lib/searchTitle";
import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { BlogShell } from '../../components/BlogShell';
import { BlogLinkFixup } from '../../components/BlogLinkFixup';
import { JsonLd } from '../../components/JsonLd';
import { SITE, ORG_ID, breadcrumb, graph } from '../../lib/seo';
import { linkSuburbs } from '../../lib/linkSuburbs';
import { fetchCurrentSlug, fetchPost, fetchPostCards } from '../../lib/blogSource';
import {
  canonicalPostPathForCurrent,
  oldPostSlugForCurrent,
} from '../../lib/blogCanonical';

/**
 * Posts are pre-rendered at build time and revalidated hourly, rather than
 * fetched fresh on every request. That gives crawlers static HTML, survives the
 * blog service being briefly unavailable, and keeps new posts appearing without
 * a deploy.
 */
export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const cards = await fetchPostCards();
  return cards
    .map((card) => ({ slug: card.slug }));
}

type Props = { params: Promise<{ slug: string }> };

/**
 * A renamed post still answers at its old slug, and used to serve the full post there with a
 * self-canonical, so Google indexed both addresses. Vexur reports the slug a post is published at
 * now; when the requested one is not it, send the request to the current address with a permanent
 * redirect. A post that does not exist reports no slug and falls through to the real 404.
 */
async function redirectIfRenamed(slug: string) {
  const currentSlug = await fetchCurrentSlug(slug);
  if (currentSlug && currentSlug !== slug) {
    permanentRedirect(canonicalPostPathForCurrent(currentSlug));
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [, post] = await Promise.all([redirectIfRenamed(slug), fetchPost(slug)]);
  if (!post) return { title: 'Post not found | Baxter & Mason' };

  const url = `${SITE}${canonicalPostPathForCurrent(slug)}`;
  return {
    title: searchTitle(`/blog/${slug}`, `${post.title} | Baxter & Mason`),
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.description,
      url,
      siteName: 'Baxter & Mason',
      locale: 'en_AU',
      images: post.image ? [post.image] : undefined,
    },
    twitter: { card: 'summary_large_image' },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;

  const [, post] = await Promise.all([redirectIfRenamed(slug), fetchPost(slug)]);
  if (!post) notFound();

  const url = `${SITE}${canonicalPostPathForCurrent(slug)}`;
  const schema = graph([
    {
      '@type': 'BlogPosting',
      '@id': `${url}#article`,
      headline: post.title,
      description: post.description,
      url,
      image: post.image ? new URL(post.image, SITE).toString() : undefined,
      author: { '@id': ORG_ID },
      publisher: { '@id': ORG_ID },
      inLanguage: 'en-AU',
      mainEntityOfPage: { '@id': `${url}#webpage` },
      isPartOf: { '@id': `${SITE}/blogs-buyers-agent-sunshine-coast#blog` },
    },
    {
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
      url,
      name: post.title,
      description: post.description,
      isPartOf: { '@id': `${SITE}/#website` },
      breadcrumb: { '@id': `${url}#breadcrumb` },
      inLanguage: 'en-AU',
    },
    breadcrumb(url, [
      { name: 'Blog', item: `${SITE}/blogs-buyers-agent-sunshine-coast` },
      { name: post.title, item: url },
    ]),
  ]);

  return (
    <BlogShell
      heroHeadingAs="h2"
      heroTitle={
        <>
          From the <span className="gi">blog</span>.
        </>
      }
      heroSub="Insights for Sunshine Coast buyers."
      showInsightsHead={false}
    >
      <JsonLd data={schema} />
      <BlogLinkFixup />
      <p className="blog-back-row">
        <a className="blog-back" href="/blogs-buyers-agent-sunshine-coast">
          <span className="ar">←</span> Back to blog
        </a>
      </p>
      <div dangerouslySetInnerHTML={{ __html: linkSuburbs(post.html) }} />
    </BlogShell>
  );
}
