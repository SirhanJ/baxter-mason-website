import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BlogShell } from '../../components/BlogShell';
import { JsonLd } from '../../components/JsonLd';
import { SITE, ORG_ID, breadcrumb, graph } from '../../lib/seo';
import legacyPosts from '../../../data/legacy-posts.json';
import { linkSuburbs } from '../../lib/linkSuburbs';

/**
 * Articles that were live on the old site and have no equivalent in the current
 * blog. They keep their original /post/<slug> address so nothing that is
 * indexed today has to be redirected at all. Posts that DO exist in the blog
 * are 301'd to /blog/<slug> in next.config.mjs before this route is reached.
 */
type LegacyPost = {
  slug: string;
  title: string;
  description: string;
  image: string;
  published: string;
  words: number;
  body: string;
};

const POSTS = legacyPosts as LegacyPost[];
const BY_SLUG = new Map(POSTS.map((p) => [p.slug, p]));

export const dynamicParams = false;

export function generateStaticParams() {
  return POSTS.map((post) => ({ slug: post.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = BY_SLUG.get(slug);
  if (!post) return {};

  const url = `${SITE}/post/${post.slug}`;
  return {
    title: `${post.title} | Baxter & Mason`,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.description,
      url,
      siteName: 'Baxter & Mason',
      locale: 'en_AU',
      images: [`/images/posts/${post.slug}${post.image.endsWith('.png') ? '.png' : '.jpg'}`],
      publishedTime: post.published || undefined,
    },
    twitter: { card: 'summary_large_image' },
  };
}

export default async function LegacyPostPage({ params }: Props) {
  const { slug } = await params;
  const post = BY_SLUG.get(slug);
  if (!post) notFound();

  const url = `${SITE}/post/${post.slug}`;
  const cover = `/images/posts/${post.slug}${post.image.endsWith('.png') ? '.png' : '.jpg'}`;
  const body = linkSuburbs(post.body);

  const schema = graph([
    {
      '@type': 'BlogPosting',
      '@id': `${url}#article`,
      headline: post.title,
      description: post.description,
      url,
      image: `${SITE}${cover}`,
      datePublished: post.published || undefined,
      dateModified: post.published || undefined,
      wordCount: post.words,
      author: { '@id': ORG_ID },
      publisher: { '@id': ORG_ID },
      inLanguage: 'en-AU',
      mainEntityOfPage: { '@id': `${url}#webpage` },
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
      { name: 'Blog', item: `${SITE}/blog` },
      { name: post.title, item: url },
    ]),
  ]);

  return (
    <BlogShell heroTitle={<>{post.title}</>} heroSub="" showInsightsHead={false}>
      <JsonLd data={schema} />
      <p className="blog-back-row">
        <a className="blog-back" href="/blog">
          <span className="ar">←</span> Back to blog
        </a>
      </p>
      <article className="blog-post">
        <img
          className="blog-post-cover"
          src={cover}
          alt={post.title}
          width={1600}
          height={900}
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
        {post.published ? (
          <p className="blog-post-meta">
            <time dateTime={post.published}>
              {new Date(`${post.published}T00:00:00Z`).toLocaleDateString('en-AU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                timeZone: 'UTC',
              })}
            </time>
          </p>
        ) : null}
        <div dangerouslySetInnerHTML={{ __html: body }} />
      </article>
    </BlogShell>
  );
}
