/**
 * Official Vexur Google Reviews embed for Baxter & Mason.
 * Sally Blyth: 09a089fd-72c0-412d-bb2b-0b0ab9cc4ecd
 *
 * Keep this in lockstep with app/lib/vexurReviewsEmbed.ts.
 */
const AGENT_ID = "09a089fd-72c0-412d-bb2b-0b0ab9cc4ecd";
const ORIGIN = "https://app.vexur.com.au";
const PRIMARY = "#e44013";
const REVIEWS_MARK = "<!-- seo:home-reviews -->";

const HOME_PARAMS = {
  "agent-id": AGENT_ID,
  theme: "light",
  primaryColor: PRIMARY,
  maxReviews: "20",
  minRating: "4",
  reviewSort: "newest",
  layout: "horizontal",
  animation: "none",
  animationSpeed: "standard",
  showBranding: "true",
  showCarouselArrows: "true",
  carouselAutoplay: "false",
  presentation: "compact",
};

const PAGE_PARAMS = {
  "agent-id": AGENT_ID,
  theme: "light",
  primaryColor: PRIMARY,
  maxReviews: "20",
  minRating: "4",
  reviewSort: "newest",
  layout: "grid",
  animation: "none",
  animationSpeed: "standard",
  showBranding: "true",
  showCarouselArrows: "false",
  carouselAutoplay: "false",
};

function embedUrl(params) {
  const query = new URLSearchParams(params);
  query.delete("agent-id");
  return "/api/vexur-reviews?" + query.toString();
}

function iframeMarkup(src, minHeight) {
  return (
    "<iframe" +
    ' class="vx-reviews-frame"' +
    " data-vx-reviews" +
    ' src="' +
    src +
    '"' +
    ' title="Google Reviews"' +
    ' style="width:100%;min-height:' +
    minHeight +
    "px;height:" +
    minHeight +
    'px;border:0;border-radius:12px;background:transparent;"' +
    ' loading="lazy"' +
    ' referrerpolicy="no-referrer-when-downgrade"' +
    "></iframe>"
  );
}

function homeReviewsEmbedUrl() {
  return embedUrl(HOME_PARAMS);
}

function pageReviewsEmbedUrl() {
  return embedUrl(PAGE_PARAMS);
}

function homeReviewsBlock() {
  return (
    REVIEWS_MARK +
    '\n<div class="hm-reviews-widget rv d1">\n' +
    iframeMarkup(homeReviewsEmbedUrl(), 460) +
    "\n" +
    "</div>\n" +
    REVIEWS_MARK
  );
}

module.exports = {
  AGENT_ID,
  ORIGIN,
  PRIMARY,
  REVIEWS_MARK,
  homeReviewsEmbedUrl,
  pageReviewsEmbedUrl,
  homeReviewsBlock,
};
