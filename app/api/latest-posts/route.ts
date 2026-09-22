import { fetchPostCards } from '../../lib/blogSource';
import { canonicalPostPathForCurrent } from '../../lib/blogCanonical';

/**
 * The newest posts for the Blog section on the home page.
 *
 * The home page is static HTML in public/, so its Blog cards were written in by
 * hand and never moved when a post was published. public/js/main.js swaps them
 * for these. Same source and the same hourly revalidation as the blog index.
 */
export const dynamic = 'force-static';
export const revalidate = 3600;

const HOME_POST_COUNT = 3;

export async function GET() {
  const cards = await fetchPostCards();
  const posts = cards.slice(0, HOME_POST_COUNT).map((card) => ({
    href: canonicalPostPathForCurrent(card.slug),
    title: card.title,
    excerpt: card.excerpt,
    image: card.image,
    date: card.date,
    readTime: card.readTime,
  }));
  return Response.json({ posts });
}
