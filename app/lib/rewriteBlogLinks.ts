import {
  BLOG_INDEX_PATH,
  canonicalPostPathForCurrent,
} from './blogCanonical';
import blogImageMap from '../../data/blog-image-map.json';

/**
 * Post images over 1 MB that GoHighLevel storage serves at full size (up to 15 MB). Each one has a
 * 1600px WebP copy in public/images, and the post HTML from Vexur is pointed at that copy.
 */
const LOCAL_BLOG_IMAGES = blogImageMap as Record<string, string>;

/**
 * Rewrite Vexur/Supabase (and cross-host) blog URLs to their canonical local
 * routes. Posts that existed on the old site keep /post/<old-slug>; only posts
 * with no historical URL use /blog/<current-slug>.
 * Never navigate to blog-render URLs — they return text/plain.
 */
export function rewriteBlogLinks(html: string, siteOrigin?: string): string {
  if (!html) return html;

  let out = html;
  for (const [remote, local] of Object.entries(LOCAL_BLOG_IMAGES)) {
    if (out.includes(remote)) out = out.split(remote).join(local);
  }
  const moved: Record<string,string> = {"Buying-a-House-with-a-Pool-what-you-need-to-know":"buying-a-house-with-a-pool-what-you-need-to-know","Infrastructure-Upgrades-Boost-Property-Values-on-the-Sunshine-Coast":"exciting-infrastructure-upgrades-set-to-boost-property-values-on-the-sunshine-co","Lifestyle-Migration-Trend":"lifestyle-migration-trend","Unethical-Selling-Agents-and-the-Multi-Offer-Dilemma":"the-dark-side-of-real-estate-unethical-selling-agents-and-the-multi-offer-dilemm","Why-Queensland-Micro-Markets-Are-Defying-National-Trends":"why-queensland-micro-markets-are-defying-national-trends","best-suburbs-for-first-home-buyers-on-the-sunshine-coast-summer-2025-edition":"best-suburbs-for-first-home-buyers-on-the-sunshine-coast","big-shifts-ahead-for-trusts-property-investment-in-australia":"big-shifts-ahead-for-trusts-property-investment-in-australia","breaking-barriers-how-your-relationship-with-money-is-holding-you-back-from-property-ownershipand-how-to-shift-it":"breaking-barriers-how-your-relationship-with-money-is-holding-you-back-from-prop","help-to-buy-launched-in-december":"help-to-buy-launched-in-december","i-cant-afford-a-buyers-agent-lets-flip-that-thinking":"i-can-t-afford-a-buyers-agent-let-s-flip-that-thinking","insurance-embargo-explained-property-buyer-sunshine-coast":"southeast-queensland-insurance-embargo-explained","negotiation-isnt-about-being-pushy":"why-property-negotiation-isn-t-about-being-pushy-and-what-actually-works","negotiation-secrets-from-a-buyers-agent":"negotiation-secrets-from-a-buyers-agent","new-blog-post-1026":"the-emotional-rollercoaster-of-buying","new-blog-post-1697":"why-good-properties-sell-fast","new-blog-post-2128":"sunshine-coast-property-market-update","new-blog-post-2390":"why-sunshine-coast-is-a-lifestyle-investment","new-blog-post-2431":"the-10-year-rule","new-blog-post-2944":"what-makes-a-property-future-proof","new-blog-post-2969":"loved-our-service-refer-a-friend-and-earn-1-000","new-blog-post-3422":"the-power-of-a-clean-contract","new-blog-post-3687":"the-truth-about-multiple-offers","new-blog-post-3848":"the-sunshine-coast-lifestyle-premium","new-blog-post-4256":"the-power-of-pre-approval","new-blog-post-4675":"the-truth-about-hot-properties","new-blog-post-4738":"why-now-is-still-the-smart-time-to-invest-in-sunshine-coast-property","new-blog-post-5810":"your-property-should-match-your-life","new-blog-post-6110":"why-downsizers-are-winning-right-now","new-blog-post-6433":"why-you-shouldn-t-rush-into-a-build","new-blog-post-6454":"why-investors-love-the-coast","new-blog-post-6465":"the-power-of-local-relationshipsew-blog-post","new-blog-post-6502":"why-you-shouldn-t-fear-competition","new-blog-post-7179":"sunshine-coast-market-update-april-2026-median-prices-rents-vacancy-trends","new-blog-post-8096":"why-cheap-can-be-expensive","new-blog-post-9085":"refinance-to-live-better-use-equity-for-renovations-travel-or-business-growth","new-blog-post-9720":"thinking-about-your-next-move-investment-side-step-or-upgraden","new-seller-disclosure-laws":"new-seller-disclosure-laws","property-buying-is-not-as-easy-as-just-looking-at-online-property-portals":"property-buying-is-not-as-easy-as-just-looking-at-online-property-portals","queenslands-boost-to-buy-program":"queensland-s-165m-boost-to-buy-program-game-changer-or-just-a-band-aid","renovate-or-walk-away":"renovate-or-walk-away-how-to-assess-a-property-s-true-potential-on-the-sunshine-","single-women-have-never-bought-property-by-themselves":"did-you-know-that-75-of-single-women-have-never-bought-property-by-themselves","sunshine-coast-infrastructure-projects":"sunshine-coast-infrastructure-projects","sunshine-coast-market-update":"sunshine-coast-market-update","sunshine-coast-property-prices-set-to-rise":"sunshine-coast-property-prices-set-to-rise-5-in-the-next-year-here-s-what-that-m","the-biggest-mistake-first-home-buyers-make":"the-biggest-mistake-first-home-buyers-make-and-how-to-avoid-it","the-hidden-costs-of-buying-a-property-on-the-sunshine-coast-and-how-to-prepare-for-them":"the-hidden-costs-of-buying-a-property-on-the-sunshine-coast-and-how-to-prepare-f","the-power-of-a-pre-auction-strategy":"why-every-buyer-needs-a-pre-auction-strategy-on-the-sunshine-coast","the-rise-of-offmarket-deals-how-buyers-are-winning-without-the-bidding-war":"the-rise-of-off-market-deals-how-buyers-are-winning-without-the-bidding-war","the-truth-about-hot-properties":"the-truth-about-hot-properties-and-how-to-avoid-overpaying","three-things-buyers-agent-checks-at-inspections":"the-3-things-every-buyer-should-check-at-a-property-inspection","underrated-sunshine-coast-suburbs":"the-most-underrated-sunshine-coast-suburbs-and-why-smart-buyers-love-them","unlock-your-sunshine-coast-dream-home-faster-and-smarter":"unlock-your-sunshine-coast-dream-home-faster-and-smarter-how-a-buyer-s-agent-sup","unlocking-offmarket-property-opportunities":"unlocking-off-market-property-opportunities","what-agents-really-look-for-in-a-buyer":"what-real-estate-agents-look-for-in-a-buyer-it-s-not-just-the-price","why-off-market-isnt-a-myth":"off-market-properties-on-the-sunshine-coast-how-buyers-really-access-them","why-online-estimates-fail":"why-online-property-estimates-are-often-wrong-especially-on-the-sunshine-coast","why-sunshine-coast-is-still-undervalued":"why-the-sunshine-coast-property-market-still-has-room-to-grow","why-you-need-a-buying-strategy-before-you-search":"why-every-buyer-needs-a-strategy-before-starting-their-property-search","will-growth-continue-or-will-it-crash":"will-growth-continue-or-will-it-crash","your-complete-guide-to-buying-a-house":"your-complete-guide-to-buying-a-house-in-queensland-from-pre-approval-to-keys-in"};
  out = out.replace(/(href=["'])(?:https?:\/\/(?:www\.)?baxtermason\.com\.au)?\/post\/([^"'?#]+)/gi, (match, prefix, slug) => moved[slug] ? prefix + "/blog/" + moved[slug] : match);
  const origin = (siteOrigin || '').replace(/\/$/, '');

  // Absolute Supabase post URLs → the preserved old path where one exists.
  out = out.replace(
    /https?:\/\/(?:pgsnbsjtpxfmzedjldyu|pgsnbsjtpxfmzedjldyu)\.supabase\.co\/functions\/v1\/blog-render\/baxter-mason\/([a-z0-9][a-z0-9-]*)\/?(?=["'?\s&#])/gi,
    (_match, slug: string) => canonicalPostPathForCurrent(slug),
  );

  // Absolute Supabase archive URL → the canonical historical blog index.
  out = out.replace(
    /https?:\/\/(?:pgsnbsjtpxfmzedjldyu|pgsnbsjtpxfmzedjldyu)\.supabase\.co\/functions\/v1\/blog-render\/baxter-mason\/?(?=["'?\s&#])/gi,
    BLOG_INDEX_PATH,
  );

  // Absolute /blog links from known hosts → the same canonical local route.
  const rewriteKnownHost = (_match: string, slug?: string) =>
    slug ? canonicalPostPathForCurrent(slug) : BLOG_INDEX_PATH;
  const knownHosts = [
    /https?:\/\/(?:www\.)?baxtermason\.com\.au\/blog(?:\/([a-z0-9][a-z0-9-]*))?\/?(?=["'?\s&#])/gi,
    /https?:\/\/baxter-mason-website\.vercel\.app\/blog(?:\/([a-z0-9][a-z0-9-]*))?\/?(?=["'?\s&#])/gi,
    /https?:\/\/localhost(?::\d+)?\/blog(?:\/([a-z0-9][a-z0-9-]*))?\/?(?=["'?\s&#])/gi,
    /https?:\/\/127\.0\.0\.1(?::\d+)?\/blog(?:\/([a-z0-9][a-z0-9-]*))?\/?(?=["'?\s&#])/gi,
  ];
  for (const pattern of knownHosts) out = out.replace(pattern, rewriteKnownHost);

  // The embedded archive normally emits relative /blog links. Canonicalise
  // those too so crawlers and users never prefer the replacement URL.
  out = out.replace(
    /(\bhref=["'])\/blog\/([a-z0-9][a-z0-9-]*)\/?(?=[?#"'])/gi,
    (_match, prefix: string, slug: string) =>
      `${prefix}${canonicalPostPathForCurrent(slug)}`,
  );
  out = out.replace(
    /(\bhref=["'])\/blog\/?(?=[?#"'])/gi,
    `$1${BLOG_INDEX_PATH}`,
  );

  // URL-encoded supabase forms inside share-button query strings
  if (origin) {
    out = out.replace(
      /https%3A%2F%2F(?:pgsnbsjtpxfmzedjldyu|pgsnbsjtpxfmzedjldyu)\.supabase\.co%2Ffunctions%2Fv1%2Fblog-render%2Fbaxter-mason%2F([a-z0-9][a-z0-9-]*)/gi,
      (_match, slug: string) =>
        encodeURIComponent(`${origin}${canonicalPostPathForCurrent(slug)}`),
    );
    out = out.replace(
      /https%3A%2F%2F(?:pgsnbsjtpxfmzedjldyu|pgsnbsjtpxfmzedjldyu)\.supabase\.co%2Ffunctions%2Fv1%2Fblog-render%2Fbaxter-mason(?!%2F)/gi,
      encodeURIComponent(`${origin}${BLOG_INDEX_PATH}`),
    );
  } else {
    out = out.replace(
      /https%3A%2F%2F(?:pgsnbsjtpxfmzedjldyu|pgsnbsjtpxfmzedjldyu)\.supabase\.co%2Ffunctions%2Fv1%2Fblog-render%2Fbaxter-mason%2F([a-z0-9][a-z0-9-]*)/gi,
      (_match, slug: string) =>
        encodeURIComponent(canonicalPostPathForCurrent(slug)),
    );
    out = out.replace(
      /https%3A%2F%2F(?:pgsnbsjtpxfmzedjldyu|pgsnbsjtpxfmzedjldyu)\.supabase\.co%2Ffunctions%2Fv1%2Fblog-render%2Fbaxter-mason(?!%2F)/gi,
      encodeURIComponent(BLOG_INDEX_PATH),
    );
  }

  return out;
}

/** Resolve the public site origin for the current request (local / Vercel / custom domain). */
export function siteOriginFromHeaders(headersList: Headers): string {
  const host =
    headersList.get('x-forwarded-host') ||
    headersList.get('host') ||
    '';
  if (!host) return '';
  const proto =
    headersList.get('x-forwarded-proto') ||
    (host.includes('localhost') || host.startsWith('127.') ? 'http' : 'https');
  return `${proto}://${host}`;
}
