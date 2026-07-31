import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { BlogShell } from '../../components/BlogShell';
import { BlogLinkFixup } from '../../components/BlogLinkFixup';
import { rewriteBlogLinks, siteOriginFromHeaders } from '../../lib/rewriteBlogLinks';

const POST_BASE =
  'https://iipazmwbtctblpyszspb.supabase.co/functions/v1/blog-render/baxter-mason/';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const label = String(slug || 'Post')
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return {
    title: `${label} | Baxter & Mason`,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  let html = '';
  let error = false;
  const origin = siteOriginFromHeaders(await headers());

  try {
    const r = await fetch(
      `${POST_BASE}${encodeURIComponent(String(slug))}?embed=true`,
      { cache: 'no-store' },
    );
    if (!r.ok) throw new Error('Failed to load post');
    html = rewriteBlogLinks(await r.text(), origin);
  } catch {
    error = true;
  }

  return (
    <BlogShell
      heroTitle={
        <>
          From the <span className="gi">blog</span>.
        </>
      }
      heroSub="Insights for Sunshine Coast buyers."
      showInsightsHead={false}
    >
      <BlogLinkFixup />
      <p className="blog-back-row">
        <a className="blog-back" href="/blog">
          <span className="ar">←</span> Back to blog
        </a>
      </p>
      {error ? (
        <p>Unable to load this post right now.</p>
      ) : (
        <div dangerouslySetInnerHTML={{ __html: html }} />
      )}
    </BlogShell>
  );
}
