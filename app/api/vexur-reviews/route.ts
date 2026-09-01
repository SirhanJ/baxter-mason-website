import {
  VEXUR_REVIEWS_AGENT_ID,
  VEXUR_REVIEWS_ORIGIN,
} from "../../lib/vexurReviewsEmbed";

const ALLOWED_PARAMS = [
  "theme",
  "primaryColor",
  "maxReviews",
  "minRating",
  "reviewSort",
  "layout",
  "animation",
  "animationSpeed",
  "showBranding",
  "showCarouselArrows",
  "carouselAutoplay",
] as const;

/**
 * Proxy the Vexur Google Reviews embed and force text/html.
 * The public embed URL is HTML, but the gateway often labels it text/plain,
 * which makes a raw iframe render source instead of the widget.
 */
export async function GET(request: Request) {
  try {
    const incoming = new URL(request.url);
    const target = new URL(`${VEXUR_REVIEWS_ORIGIN}/embed/v1/google-reviews`);
    target.searchParams.set("agent-id", VEXUR_REVIEWS_AGENT_ID);

    for (const key of ALLOWED_PARAMS) {
      const value = incoming.searchParams.get(key);
      if (value) target.searchParams.set(key, value);
    }

    const upstream = await fetch(target.toString(), {
      headers: { Accept: "text/html" },
      cache: "no-store",
    });
    const html = await upstream.text();
    if (!upstream.ok || !html.trim()) {
      return new Response("Reviews are unavailable right now.", {
        status: 502,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    const isHorizontal = incoming.searchParams.get("layout") === "horizontal";
    const servedHtml = isHorizontal
      ? html.replace(
          /<\/head>/i,
          `<style id="baxter-review-layout">
            .vx-card { max-width: none !important; }
            @media (min-width: 760px) {
              .vx-card .vx-reviews-horizontal .vx-review-card {
                flex: 0 0 calc((100% - 24px) / 3) !important;
              }
            }
          </style></head>`,
        )
      : html;

    return new Response(servedHtml, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Reviews are unavailable right now.", {
      status: 502,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
