import { searchTitle } from "../../lib/searchTitle";
import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { BlogShell } from '../../components/BlogShell';
import { BlogLinkFixup } from '../../components/BlogLinkFixup';
import { JsonLd } from '../../components/JsonLd';
import { SITE, breadcrumb, graph } from '../../lib/seo';
import { linkSuburbs } from '../../lib/linkSuburbs';
import { blogPostingNode, blogSeoTitle, fetchCurrentSlug, fetchPost, fetchPostCards } from '../../lib/blogSource';
import {
  RENAMED_BLOG_SLUGS,
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
  if (RENAMED_BLOG_SLUGS[slug]) return {};
  const [, post] = await Promise.all([redirectIfRenamed(slug), fetchPost(slug)]);
  if (!post) return { title: 'Post not found | Baxter & Mason' };

  const url = `${SITE}${canonicalPostPathForCurrent(slug)}`;
  // Title order: (a) the shortened title in data/seo-titles.json for this slug (26 Oct), else (b) the
  // title Vexur holds for the post, with the brand suffix only while the whole stays within 65
  // characters, else (c) the post's own title plus the brand. The customer's text is never rewritten.
  return {
    title: searchTitle(
      `/blog/${slug}`,
      post.metaTitle ? blogSeoTitle(post.metaTitle) : `${post.title} | Baxter & Mason`,
    ),
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.description,
      url,
      siteName: 'Baxter & Mason',
      locale: 'en_AU',
      images: [post.image],
      publishedTime: post.datePublished,
      modifiedTime: post.dateModified,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [post.image],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;

  // A post whose address changed or that duplicates another: send the old /blog address on.
  const renamedTo = RENAMED_BLOG_SLUGS[slug];
  if (renamedTo) permanentRedirect(`/blog/${renamedTo}`);

  const [, post] = await Promise.all([redirectIfRenamed(slug), fetchPost(slug)]);
  if (!post) notFound();

  const url = `${SITE}${canonicalPostPathForCurrent(slug)}`;
  const schema = graph([
    blogPostingNode(url, post),
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
      {['first-home-owners-grant-qld-explained', 'requirements-when-buying-a-property-on-a-491-visa'].includes(slug) ? <aside className="article-review-notice" aria-label="Current eligibility notice"><strong>Check current eligibility before relying on this article.</strong><p>This article is awaiting a qualified review of its grant or visa-related property guidance. Rules and eligibility can change. Check the current {slug === 'first-home-owners-grant-qld-explained' ? <a href="https://www.qld.gov.au/housing/buying-owning-home/home-buyers-financial-help/first-home-owner-grant">Queensland first home owner grant guidance</a> : <a href="https://foreigninvestment.gov.au/guidance/conditions-and-reporting/residential-compliance">Australian Government residential property guidance</a>} and get advice for your circumstances before making a purchase decision.</p></aside> : null}
      <div dangerouslySetInnerHTML={{ __html: linkSuburbs(post.html) }} />
    </BlogShell>
  );
}
