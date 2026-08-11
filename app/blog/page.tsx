import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { BlogShell } from '../components/BlogShell';
import { BlogLinkFixup } from '../components/BlogLinkFixup';
import { BlogArchive } from '../components/BlogArchive';
import { rewriteBlogLinks, siteOriginFromHeaders } from '../lib/rewriteBlogLinks';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Blog | Baxter & Mason',
  description: 'Smarter property decisions for Sunshine Coast buyers.',
};

const BLOG_ARCHIVE_URL =
  'https://iipazmwbtctblpyszspb.supabase.co/functions/v1/blog-render/baxter-mason?embed=true&placement=archive';

export default async function BlogPage() {
  let html = '';
  let error = false;
  const origin = siteOriginFromHeaders(await headers());

  try {
    const r = await fetch(BLOG_ARCHIVE_URL, { cache: 'no-store' });
    if (!r.ok) throw new Error('Failed to load blog');
    html = rewriteBlogLinks(await r.text(), origin);
  } catch {
    error = true;
  }

  return (
    <BlogShell showInsightsHead={false}>
      <BlogLinkFixup />
      {error ? (
        <p>Unable to load the blog right now.</p>
      ) : (
        <BlogArchive html={html} />
      )}
    </BlogShell>
  );
}
