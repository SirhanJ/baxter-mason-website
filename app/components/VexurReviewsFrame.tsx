import { pageReviewsEmbedUrl } from "../lib/vexurReviewsEmbed";

const MIN_HEIGHT = 640;

export function VexurReviewsFrame() {
  return (
    <div className="vx-reviews-page">
      <iframe
        className="vx-reviews-frame"
        data-vx-reviews=""
        src={pageReviewsEmbedUrl()}
        title="Google Reviews"
        style={{
          width: "100%",
          minHeight: MIN_HEIGHT,
          height: MIN_HEIGHT,
          border: 0,
          borderRadius: 12,
          background: "transparent",
        }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
