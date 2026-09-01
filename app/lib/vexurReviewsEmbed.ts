/**
 * Official Vexur Google Reviews embed for Baxter & Mason.
 * Keep in lockstep with scripts/vexur-reviews-embed.js.
 */
export const VEXUR_REVIEWS_AGENT_ID = "09a089fd-72c0-412d-bb2b-0b0ab9cc4ecd";
export const VEXUR_REVIEWS_ORIGIN = "https://app.vexur.com.au";
const PRIMARY = "#e44013";

function embedUrl(params: Record<string, string>): string {
  const query = new URLSearchParams({
    theme: "light",
    primaryColor: PRIMARY,
    ...params,
  });
  return `/api/vexur-reviews?${query.toString()}`;
}

export function homeReviewsEmbedUrl(): string {
  return embedUrl({
    maxReviews: "12",
    minRating: "4",
    reviewSort: "newest",
    layout: "horizontal",
    animation: "none",
    animationSpeed: "standard",
    showBranding: "true",
    showCarouselArrows: "true",
    carouselAutoplay: "true",
  });
}

export function pageReviewsEmbedUrl(): string {
  return embedUrl({
    maxReviews: "20",
    minRating: "4",
    reviewSort: "newest",
    layout: "grid",
    animation: "none",
    animationSpeed: "standard",
    showBranding: "true",
    showCarouselArrows: "false",
    carouselAutoplay: "false",
  });
}
