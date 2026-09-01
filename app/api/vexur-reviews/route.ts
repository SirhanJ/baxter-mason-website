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

const COMPACT_HOME_STYLES = `
  <style id="baxter-compact-reviews">
    html, body { background: transparent !important; }
    .vx-card {
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) auto;
      column-gap: 32px;
      max-width: none !important;
      padding: 24px 32px 18px !important;
      background: #fff !important;
      border-radius: 14px;
    }
    .vx-title {
      align-self: center;
      margin: 0 !important;
      font-size: 22px !important;
      line-height: 1.2;
    }
    .vx-subtitle { display: none !important; }
    .vx-summary {
      align-self: start;
      justify-self: end;
      display: flex !important;
      flex-direction: column;
      align-items: flex-end !important;
      gap: 7px !important;
      margin: 0 !important;
      padding: 0 !important;
      background: transparent !important;
      border: 0 !important;
      border-radius: 0 !important;
    }
    .vx-summary-rating { font-size: 40px !important; }
    .vx-summary > div:last-child {
      display: flex;
      align-items: center;
      gap: 11px;
    }
    .vx-summary-count {
      margin: 0 !important;
      padding-left: 11px;
      border-left: 1px solid var(--vx-border);
      white-space: nowrap;
    }
    .vx-reviews-carousel {
      grid-column: 1 / -1;
      margin-top: 18px;
      padding: 0 !important;
    }
    .vx-carousel-btn { display: none !important; }
    .vx-reviews-horizontal {
      gap: 16px !important;
      overflow: hidden !important;
      scroll-snap-type: none !important;
      cursor: default !important;
    }
    .vx-reviews-horizontal .vx-review-card {
      display: flex;
      flex: 0 0 calc((100% - 32px) / 3) !important;
      flex-direction: column;
      min-width: 0;
      height: 200px;
      padding: 18px !important;
      background: #fff !important;
      border: 1px solid var(--vx-border) !important;
      border-radius: 12px !important;
      box-shadow: 0 7px 18px rgba(17, 24, 39, 0.09);
    }
    .vx-review-card[hidden] { display: none !important; }
    .baxter-review-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 14px;
    }
    .baxter-review-score {
      display: flex;
      align-items: center;
      gap: 5px;
      color: #f59e0b;
      font-size: 16px;
      font-weight: 700;
      white-space: nowrap;
    }
    .baxter-review-score .vx-stars { font-size: 15px !important; }
    .baxter-review-top .vx-review-date {
      flex: 0 0 auto;
      margin: 0 !important;
      font-size: 11px !important;
      white-space: nowrap;
    }
    .vx-review-text {
      margin: 0 !important;
      color: #374151 !important;
      font-size: 12.5px !important;
      line-height: 1.65 !important;
      -webkit-line-clamp: 3 !important;
    }
    .baxter-review-more {
      align-self: flex-start;
      margin-top: -1.65em;
      margin-left: auto;
      padding-left: 8px;
      color: #2563eb;
      background: #fff;
      font-size: 12px;
      text-decoration: none;
    }
    .baxter-review-author {
      display: flex;
      align-items: center;
      gap: 9px;
      margin-top: auto;
      min-width: 0;
    }
    .baxter-review-author .vx-avatar-shell,
    .baxter-review-author .vx-avatar {
      width: 30px !important;
      height: 30px !important;
    }
    .baxter-review-author .vx-review-name {
      overflow: hidden;
      color: var(--vx-text-muted) !important;
      font-size: 12px !important;
      font-weight: 500 !important;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .baxter-google-mark {
      margin-left: auto;
      color: #4285f4;
      font-size: 18px;
      font-weight: 700;
      line-height: 1;
    }
    .baxter-review-pagination {
      grid-column: 1 / -1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      margin-top: 16px;
    }
    .baxter-review-pagination button {
      display: inline-grid;
      min-width: 28px;
      height: 28px;
      place-items: center;
      padding: 0 7px;
      color: var(--vx-text);
      background: transparent;
      border: 0;
      border-radius: 999px;
      font: 500 12px/1 var(--vx-font);
      cursor: pointer;
    }
    .baxter-review-pagination button:hover,
    .baxter-review-pagination button[aria-current="page"] {
      color: #fff;
      background: var(--vx-primary);
    }
    .baxter-review-pagination button:disabled {
      cursor: default;
      opacity: 0.35;
    }
    .baxter-review-ellipsis {
      min-width: 20px;
      color: var(--vx-text-muted);
      text-align: center;
    }
    .vx-footer {
      grid-column: 1 / -1;
      justify-self: end;
      margin: -20px 0 0 !important;
      font-size: 9px !important;
    }
    @media (max-width: 759px) {
      .vx-card {
        grid-template-columns: minmax(0, 1fr);
        padding: 20px 18px 16px !important;
      }
      .vx-title { font-size: 19px !important; }
      .vx-summary {
        grid-column: 1;
        justify-self: stretch;
        flex-direction: row;
        align-items: center !important;
        justify-content: space-between;
        margin-top: 14px !important;
      }
      .vx-summary-rating { font-size: 34px !important; }
      .vx-reviews-carousel { margin-top: 15px; }
      .vx-reviews-horizontal .vx-review-card {
        flex: 0 0 100% !important;
        height: 205px;
      }
      .baxter-review-pagination { margin-top: 13px; }
      .vx-footer {
        justify-self: center;
        margin: 9px 0 0 !important;
      }
    }
  </style>`;

const COMPACT_HOME_SCRIPT = `
  <script id="baxter-compact-review-pagination">
  (function () {
    function init() {
      var track = document.querySelector('.vx-reviews-horizontal');
      if (!track || track.getAttribute('data-baxter-compact') === 'true') return;
      var cards = Array.prototype.slice.call(track.querySelectorAll('.vx-review-card'));
      if (!cards.length) return;
      track.setAttribute('data-baxter-compact', 'true');

      cards.forEach(function (card) {
        var head = card.querySelector('.vx-review-head');
        var text = card.querySelector('.vx-review-text');
        if (!head || !text) return;
        var avatar = head.querySelector('.vx-avatar-shell');
        var name = head.querySelector('.vx-review-name');
        var stars = head.querySelector('.vx-stars');
        var date = head.querySelector('.vx-review-date');
        if (!avatar || !name || !stars || !date) return;

        var top = document.createElement('div');
        top.className = 'baxter-review-top';
        var score = document.createElement('div');
        score.className = 'baxter-review-score';
        var value = document.createElement('span');
        value.textContent = String(stars.querySelectorAll('.is-filled').length || 5);
        score.appendChild(value);
        score.appendChild(stars);
        top.appendChild(score);
        top.appendChild(date);

        var author = document.createElement('div');
        author.className = 'baxter-review-author';
        author.appendChild(avatar);
        author.appendChild(name);
        var google = document.createElement('span');
        google.className = 'baxter-google-mark';
        google.setAttribute('aria-hidden', 'true');
        google.textContent = 'G';
        author.appendChild(google);

        card.insertBefore(top, head);
        head.remove();
        if ((text.textContent || '').trim().length > 150) {
          var more = document.createElement('a');
          more.className = 'baxter-review-more';
          more.href = '/google-reviews-buyers-agent-sunshine-coast';
          more.target = '_top';
          more.textContent = 'More';
          card.appendChild(more);
        }
        card.appendChild(author);
      });

      var carousel = track.closest('.vx-reviews-carousel') || track.parentElement;
      var nav = document.createElement('nav');
      nav.className = 'baxter-review-pagination';
      nav.setAttribute('aria-label', 'Review pages');
      carousel.insertAdjacentElement('afterend', nav);
      var page = 0;

      function perPage() {
        return window.matchMedia('(min-width: 760px)').matches ? 3 : 1;
      }
      function pageItems(total, current) {
        if (total <= 5) return Array.from({ length: total }, function (_, i) { return i + 1; });
        if (current <= 3) return [1, 2, 3, 0, total];
        if (current >= total - 2) return [1, 0, total - 2, total - 1, total];
        return [1, 0, current, 0, total];
      }
      function postHeight() {
        window.requestAnimationFrame(function () {
          window.parent.postMessage({
            type: 'vexur:height',
            height: Math.ceil(document.documentElement.scrollHeight)
          }, '*');
        });
      }
      function show(nextPage) {
        var size = perPage();
        var total = Math.max(1, Math.ceil(cards.length / size));
        page = Math.max(0, Math.min(nextPage, total - 1));
        cards.forEach(function (card, index) {
          card.hidden = index < page * size || index >= (page + 1) * size;
        });
        nav.textContent = '';

        var previous = document.createElement('button');
        previous.type = 'button';
        previous.setAttribute('aria-label', 'Previous reviews');
        previous.textContent = '‹';
        previous.disabled = page === 0;
        previous.addEventListener('click', function () { show(page - 1); });
        nav.appendChild(previous);

        pageItems(total, page + 1).forEach(function (item) {
          if (item === 0) {
            var ellipsis = document.createElement('span');
            ellipsis.className = 'baxter-review-ellipsis';
            ellipsis.textContent = '…';
            nav.appendChild(ellipsis);
            return;
          }
          var button = document.createElement('button');
          button.type = 'button';
          button.textContent = String(item);
          button.setAttribute('aria-label', 'Review page ' + item);
          if (item === page + 1) button.setAttribute('aria-current', 'page');
          button.addEventListener('click', function () { show(item - 1); });
          nav.appendChild(button);
        });

        var next = document.createElement('button');
        next.type = 'button';
        next.setAttribute('aria-label', 'Next reviews');
        next.textContent = '›';
        next.disabled = page === total - 1;
        next.addEventListener('click', function () { show(page + 1); });
        nav.appendChild(next);
        postHeight();
      }

      var media = window.matchMedia('(min-width: 760px)');
      if (media.addEventListener) media.addEventListener('change', function () { show(0); });
      show(0);
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  })();
  </script>`;

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
      next: { revalidate: 300 },
    });
    const html = await upstream.text();
    if (!upstream.ok || !html.trim()) {
      return new Response("Reviews are unavailable right now.", {
        status: 502,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    const isHorizontal = incoming.searchParams.get("layout") === "horizontal";
    const isCompactHome =
      isHorizontal && incoming.searchParams.get("presentation") === "compact";
    let servedHtml = isHorizontal
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

    if (isCompactHome) {
      servedHtml = servedHtml
        .replace(
          '<h1 class="vx-title">Google Reviews</h1>',
          '<h1 class="vx-title">What our clients say about us</h1>',
        )
        .replace(
          /<\/body>/i,
          `${COMPACT_HOME_STYLES}${COMPACT_HOME_SCRIPT}</body>`,
        );
    }

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
