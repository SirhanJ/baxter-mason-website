import { fetchStories, formatStoryDate, readTimeLabel } from '../../lib/caseStudySource';

/**
 * The newest success stories for the home page's Success Stories section.
 *
 * The home page is a static file, so its three cards are drawn by a small script that reads
 * this route (same origin, no CORS). The route is revalidated hourly like the story pages, so
 * a story Sally publishes in Vexur reaches the home page on the same schedule.
 */
export const revalidate = 3600;

export async function GET() {
  const stories = await fetchStories();
  const latest = stories.slice(0, 3).map((story) => ({
    path: story.path,
    title: story.title,
    excerpt: story.excerpt,
    meta: `${formatStoryDate(story.date)} · ${readTimeLabel(story.readMinutes)}`,
    image: story.image,
  }));
  return Response.json(
    { stories: latest },
    { headers: { 'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400' } },
  );
}
