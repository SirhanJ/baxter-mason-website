/**
 * Write every canonical route in public/ as a real file.
 *
 * The site is deployed as a Cloudflare Worker with static assets. Cloudflare serves a matching
 * asset BEFORE the worker runs, so /faq is answered straight from public/faq.html and the
 * rewrites in next.config.mjs never execute for it. A canonical address like
 * /FAQ-Buyers-Agent-Sunshine-Coast has no matching asset, so it does reach the worker - but the
 * rewrite sends it to /faq.html, which is an asset rather than a Next route, and the worker
 * answers 404.
 *
 * The result was that every canonical URL in the site navigation 404'd in production while
 * working perfectly under `next dev`, where Next serves public/ itself and the rewrite resolves.
 * That is the whole About menu, Success Stories, FAQ and Free guides (reported 2026-09-07).
 *
 * App-router pages are unaffected: /blog and /reviews are real routes, so their canonical
 * addresses already resolve through the worker.
 *
 * Rather than rely on a rewrite that cannot work on asset-first hosting, give each canonical
 * address its own file. Runs in prebuild, so the copies land in the build output without being
 * committed twice. Each page already carries a <link rel="canonical"> pointing at the canonical
 * address, so serving both spellings does not split the page in search.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "public");
const canonicalRoutes = JSON.parse(fs.readFileSync(path.join(ROOT, "data/canonical-routes.json"), "utf8"));

function writePageSlugs(canonicalTargets) {
  // app/sitemap.ts used to read public/ with fs at request time. A Cloudflare Worker has no
  // filesystem, so that threw and /sitemap.xml returned 500 in production while working under
  // `next dev` (found 2026-09-07, with robots.txt pointing search engines straight at it).
  //
  // The list is captured here instead, at build time. Canonical copies are excluded: they are
  // duplicates of a page already in the list, and including them would list every page twice.
  const slugs = fs
    .readdirSync(PUBLIC_DIR)
    .filter((file) => file.endsWith(".html"))
    .map((file) => file.replace(/.html$/, ""))
    .filter((slug) => !canonicalTargets.has(slug))
    .sort();

  fs.writeFileSync(path.join(ROOT, "data/page-slugs.json"), JSON.stringify(slugs, null, 2) + "\n");
  return slugs.length;
}

function main() {
  const canonicalTargets = new Set(
    Object.entries(canonicalRoutes)
      .filter(([internal, canonical]) => internal !== canonical)
      .map(([, canonical]) => canonical.replace(/^\//, "")),
  );
  const slugCount = writePageSlugs(canonicalTargets);

  let written = 0;
  let skipped = 0;
  const noSource = [];

  for (const [internal, canonical] of Object.entries(canonicalRoutes)) {
    if (internal === canonical) continue;

    const source = path.join(PUBLIC_DIR, `${internal.replace(/^\//, "")}.html`);
    const target = path.join(PUBLIC_DIR, `${canonical.replace(/^\//, "")}.html`);

    if (!fs.existsSync(source)) {
      // /blog and /reviews are app-router pages, not static files. The worker serves their
      // canonical addresses directly, so there is nothing to copy.
      noSource.push(`${internal} -> ${canonical}`);
      continue;
    }

    // Always overwrite. A copy that is skipped once goes stale the next time the source page
    // changes, and a stale canonical page is worse than no canonical page.
    const existed = fs.existsSync(target);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
    if (existed) skipped += 1;
    else written += 1;
  }

  console.log(`page slugs recorded     : ${slugCount}`);
  console.log(`canonical pages written : ${written}`);
  console.log(`refreshed               : ${skipped}`);
  console.log(`served by a route       : ${noSource.length}${noSource.length ? ` (${noSource.join(", ")})` : ""}`);
}

main();
