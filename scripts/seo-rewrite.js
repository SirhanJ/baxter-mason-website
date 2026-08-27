#!/usr/bin/env node
/**
 * Idempotent SEO pass over the static pages in public/.
 *
 *   node scripts/seo-rewrite.js
 *
 * Per page it rewrites internal links to root-relative extensionless URLs,
 * repoints canonical/og:url, sizes and defers images, links the first mention of
 * a serviced suburb to that suburb's page, and injects one JSON-LD @graph
 * carrying the shared business, the page, its breadcrumb trail and — depending
 * on page type — a Service or Article node.
 *
 * Marker comments make re-runs a no-op, so this is safe to run after any edit.
 */
const fs = require('fs');
const path = require('path');
const lib = require('./seo-lib');

const ORG = require('../data/organisation.json');
const OVERRIDES = require('../data/meta-overrides.json');

const { PUBLIC, SITE, ORG_ID, SITE_ID, GRAPH_OPEN, GRAPH_CLOSE, LINKED_MARK, PAGES } = lib;

/* ------------------------------------------------------------ page model */

function classify(slug) {
  if (slug === 'index') return 'home';
  if (/-buyers-agent$/.test(slug)) return 'suburb';
  if (/^story-/.test(slug)) return 'story';
  if (/^blog-/.test(slug)) return 'article';
  if (slug === 'success-stories' || slug === 'blog') return 'collection';
  return 'page';
}

function readPage(file) {
  const slug = path.basename(file, '.html');
  const html = lib.read(path.join(PUBLIC, file));
  const grab = (re) => {
    const m = html.match(re);
    return m ? m[1] : '';
  };
  return {
    file,
    slug,
    html,
    type: classify(slug),
    url: lib.urlFor(file),
    title: lib.unesc(grab(/<title>([\s\S]*?)<\/title>/i).trim()),
    description: lib.unesc(grab(/<meta name="description" content="([^"]*)"/i).trim()),
    image: grab(/<meta property="og:image" content="([^"]*)"/i),
    h1: lib.strip(grab(/<h1[^>]*>([\s\S]*?)<\/h1>/i)).replace(/\.$/, ''),
    date: grab(
      /\b((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+20\d\d)/,
    ),
  };
}

const pages = PAGES.map(readPage);
const bySlug = new Map(pages.map((p) => [p.slug, p]));

/** The 30 serviced suburbs, named from each page's own H1. */
const SUBURBS = pages
  .filter((p) => p.type === 'suburb')
  .map((p) => ({ slug: p.slug, name: p.h1.replace(/\s*Buyers Agent$/i, '').trim(), url: p.url }))
  .filter((s) => s.name)
  .sort((a, b) => b.name.length - a.name.length);

// Published for the App Router routes, which do the same interlinking in posts.
fs.writeFileSync(
  path.join(__dirname, '..', 'data', 'suburbs.json'),
  JSON.stringify(
    SUBURBS.slice().sort((a, b) => a.name.localeCompare(b.name)),
    null,
    2,
  ) + '\n',
);

/* --------------------------------------------------------------- dates */

const MONTHS = {
  January: '01', February: '02', March: '03', April: '04', May: '05', June: '06',
  July: '07', August: '08', September: '09', October: '10', November: '11', December: '12',
};

function isoDate(text) {
  const m = String(text).match(/([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})/);
  if (!m || !MONTHS[m[1]]) return '';
  return m[3] + '-' + MONTHS[m[1]] + '-' + String(m[2]).padStart(2, '0');
}

/* -------------------------------------------------------------- graph */

function absolute(url) {
  return SITE + url;
}

function breadcrumb(page) {
  const trail = [{ name: 'Home', item: SITE + '/' }];
  if (page.type === 'suburb') {
    trail.push({ name: 'Areas We Service', item: absolute('/services') });
    trail.push({ name: page.h1, item: absolute(page.url) });
  } else if (page.type === 'story') {
    trail.push({ name: 'Success Stories', item: absolute('/success-stories') });
    trail.push({ name: page.h1, item: absolute(page.url) });
  } else if (page.type === 'article') {
    trail.push({ name: 'Blog', item: absolute('/blog') });
    trail.push({ name: page.h1, item: absolute(page.url) });
  } else if (page.type !== 'home') {
    trail.push({ name: page.h1 || page.title.split('|')[0].trim(), item: absolute(page.url) });
  }
  return {
    '@type': 'BreadcrumbList',
    '@id': absolute(page.url) + '#breadcrumb',
    itemListElement: trail.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: t.name,
      item: t.item,
    })),
  };
}

function graphFor(page) {
  const url = absolute(page.url);
  const nodes = [];

  nodes.push(ORG);

  nodes.push({
    '@type': 'WebSite',
    '@id': SITE_ID,
    url: SITE + '/',
    name: 'Baxter & Mason Property Buyers Agent',
    inLanguage: 'en-AU',
    publisher: { '@id': ORG_ID },
  });

  const webPage = {
    '@type': page.type === 'home' ? 'WebPage' : page.type === 'collection' ? 'CollectionPage' : 'WebPage',
    '@id': url + '#webpage',
    url,
    name: page.title,
    description: page.description,
    isPartOf: { '@id': SITE_ID },
    about: { '@id': ORG_ID },
    inLanguage: 'en-AU',
    breadcrumb: { '@id': url + '#breadcrumb' },
  };
  if (page.image) webPage.primaryImageOfPage = { '@type': 'ImageObject', url: page.image };
  nodes.push(webPage);

  nodes.push(breadcrumb(page));

  if (page.type === 'suburb') {
    const name = page.h1.replace(/\s*Buyers Agent$/i, '').trim();
    nodes.push({
      '@type': 'Service',
      '@id': url + '#service',
      name: 'Buyers agent in ' + name,
      serviceType: "Buyer's agent",
      description: page.description,
      url,
      provider: { '@id': ORG_ID },
      areaServed: { '@type': 'Place', name: name + ', Sunshine Coast QLD' },
      audience: { '@type': 'Audience', audienceType: 'Property buyers and investors' },
    });
  }

  if (page.type === 'story' || page.type === 'article') {
    const published = isoDate(page.date);
    const article = {
      '@type': page.type === 'story' ? 'Article' : 'BlogPosting',
      '@id': url + '#article',
      headline: page.h1 || page.title.split('|')[0].trim(),
      description: page.description,
      mainEntityOfPage: { '@id': url + '#webpage' },
      author: { '@id': ORG_ID },
      publisher: { '@id': ORG_ID },
      inLanguage: 'en-AU',
    };
    if (page.image) article.image = page.image;
    if (published) {
      article.datePublished = published;
      article.dateModified = published;
    }
    nodes.push(article);
  }

  return { '@context': 'https://schema.org', '@graph': nodes };
}

/**
 * Drop any hand-written business block left over from before the graph existed,
 * so a page never declares the organisation twice. Other blocks (the FAQ markup
 * on /faq, for one) are left alone.
 */
function dropLegacyOrgBlock(html) {
  return html.replace(
    /<script type="application\/ld\+json">\s*\{[\s\S]*?"@type"\s*:\s*"RealEstateAgent"[\s\S]*?\}\s*<\/script>\s*/g,
    (block, offset) => {
      const graphStart = html.indexOf(GRAPH_OPEN);
      const graphEnd = html.indexOf(GRAPH_CLOSE);
      const insideGraph = graphStart !== -1 && offset > graphStart && offset < graphEnd;
      return insideGraph ? block : '';
    },
  );
}

function injectGraph(html, page) {
  const block =
    GRAPH_OPEN +
    '\n<script type="application/ld+json">' +
    JSON.stringify(graphFor(page)) +
    '</script>\n' +
    GRAPH_CLOSE;

  const start = html.indexOf(GRAPH_OPEN);
  if (start !== -1) {
    const end = html.indexOf(GRAPH_CLOSE, start) + GRAPH_CLOSE.length;
    return html.slice(0, start) + block + html.slice(end);
  }
  return html.replace(/<\/head>/i, block + '\n</head>');
}

/* ------------------------------------------------------- home reviews */

const REVIEWS = require('../data/reviews.json');
const REVIEWS_MARK = '<!-- seo:home-reviews -->';

const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * The homepage used to render its reviews inside a GoHighLevel iframe, with a
 * third-party script alongside it. Both stop working the day that account
 * closes, and neither ever put a word of review text into the HTML. These are
 * the same reviews, as page content, with no runtime dependency at all.
 */
function replaceHomeReviews(html, page) {
  if (page.slug !== 'index') return html;

  const picks = REVIEWS.reviews
    .filter((r) => r.body.length > 180 && r.body.length < 520)
    .slice(0, 3);
  if (!picks.length) return html;

  const cards = picks
    .map(
      (r) =>
        '<figure class="hm-review">\n' +
        '<blockquote><p>' +
        escapeHtml(r.body.split('\n')[0]) +
        '</p></blockquote>\n' +
        '<figcaption><span class="hm-review-stars" aria-label="' +
        r.rating +
        ' out of 5 stars"><span aria-hidden="true">' +
        '★'.repeat(r.rating) +
        '</span></span> <span class="hm-review-name">' +
        escapeHtml(r.author) +
        '</span></figcaption>\n</figure>',
    )
    .join('\n');

  const block =
    REVIEWS_MARK +
    '\n<div class="hm-reviews-widget rv d1">\n' +
    '<p class="hm-reviews-score">' +
    REVIEWS.aggregate.ratingValue.toFixed(1) +
    ' from ' +
    REVIEWS.aggregate.reviewCount +
    ' Google reviews</p>\n' +
    cards +
    '\n<p class="hm-reviews-more"><a href="/reviews">Read all ' +
    REVIEWS.reviews.length +
    ' reviews <span class="ar">&rarr;</span></a></p>\n</div>\n' +
    REVIEWS_MARK;

  const start = html.indexOf(REVIEWS_MARK);
  if (start !== -1) {
    const end = html.indexOf(REVIEWS_MARK, start + REVIEWS_MARK.length) + REVIEWS_MARK.length;
    return html.slice(0, start) + block + html.slice(end);
  }

  let out = html.replace(
    /<div class="hm-reviews-widget[^"]*">[\s\S]*?<\/div>/i,
    block,
  );
  // The widget's loader script goes with it.
  out = out.replace(/\s*<script src="https:\/\/apisystem\.tech\/js\/reviews_widget\.js"><\/script>/i, '');
  return out;
}

/* --------------------------------------------- suburb cluster linking */

const NEIGHBOURS = require('../data/suburb-neighbours.json');
const NEARBY_MARK = '<!-- seo:nearby -->';
const AREAS_MARK = '<!-- seo:areas -->';

/**
 * Every suburb page was a leaf: reachable from two list blocks, linking on to
 * nothing. A short "nearby" block gives the 30 pages lateral crawl paths and
 * ties them together as one topical cluster. Adjacency is geography, so nothing
 * here asserts anything about the market.
 */
function addNearbyBlock(html, page) {
  if (page.type !== 'suburb') return html;
  const neighbours = (NEIGHBOURS[page.slug] || []).filter((slug) => bySlug.has(slug));
  if (!neighbours.length) return html;

  const name = page.h1.replace(/\s*Buyers Agent$/i, '').trim();
  const links = neighbours
    .map((slug) => {
      const near = bySlug.get(slug);
      const label = near.h1.replace(/\s*Buyers Agent$/i, '').trim();
      return '<li><a href="' + near.url + '">' + label + ' buyers agent</a></li>';
    })
    .join('\n');

  const block =
    NEARBY_MARK +
    '\n<div class="prose-block rv nearby-block">\n' +
    '<h2>Nearby suburbs we also buy in</h2>\n' +
    '<p>We search across the whole Sunshine Coast, so if ' +
    name +
    ' turns out not to be the right fit, these are the closest areas we cover.</p>\n' +
    '<ul class="legal-list nearby-list">\n' +
    links +
    '\n</ul>\n</div>\n' +
    NEARBY_MARK;

  const start = html.indexOf(NEARBY_MARK);
  if (start !== -1) {
    const end = html.indexOf(NEARBY_MARK, start + NEARBY_MARK.length) + NEARBY_MARK.length;
    return html.slice(0, start) + block + html.slice(end);
  }
  // Sits after the last prose block, before the closing note.
  return html.replace(/(<p class="prose-note rv">)/i, block + '\n$1');
}

/**
 * /services is the breadcrumb parent of all 30 suburb pages but linked to none
 * of them, so the hierarchy the markup claimed did not exist in the HTML.
 */
function addAreasHub(html, page) {
  if (page.slug !== 'services') return html;

  const links = pages
    .filter((p) => p.type === 'suburb')
    .map((p) => ({ url: p.url, label: p.h1.replace(/\s*Buyers Agent$/i, '').trim() }))
    .sort((a, b) => a.label.localeCompare(b.label))
    .map((s) => '<li><a href="' + s.url + '">' + s.label + '</a></li>')
    .join('\n');

  const block =
    AREAS_MARK +
    '\n<section class="blk areas-hub" id="areas"><div class="wrap">\n' +
    '<div class="head">\n<span class="eyebrow rv">Where we buy</span>\n' +
    '<h2 class="rv d1">Thirty suburbs, from Caloundra to Noosa.</h2>\n' +
    '<p class="intro rv d2">Coast, hinterland and everything between. Each one has its own page covering how we search there.</p>\n' +
    '</div>\n<ul class="areas-list rv d3">\n' +
    links +
    '\n</ul>\n</div></section>\n' +
    AREAS_MARK;

  const start = html.indexOf(AREAS_MARK);
  if (start !== -1) {
    const end = html.indexOf(AREAS_MARK, start + AREAS_MARK.length) + AREAS_MARK.length;
    return html.slice(0, start) + block + html.slice(end);
  }
  return html.replace(/(<section class="final final-rich)/i, block + '\n$1');
}

/* ------------------------------------------------- suburb interlinking */

const SKIP_LINKING = new Set(['index', 'privacy', 'terms', 'contact', 'faq']);

/**
 * Link the first mention of each serviced suburb in a page's body copy. Only
 * paragraph text is touched, and only once per suburb, so nothing turns into a
 * wall of links.
 */
function linkSuburbs(html, page) {
  if (page.type === 'suburb' || SKIP_LINKING.has(page.slug)) return html;
  if (html.indexOf(LINKED_MARK) !== -1) return html;

  const bodyStart = html.search(/<main\b|<section\b/i);
  if (bodyStart === -1) return html;
  const footStart = html.search(/<footer\b/i);
  const end = footStart === -1 ? html.length : footStart;

  let head = html.slice(0, bodyStart);
  let body = html.slice(bodyStart, end);
  const tail = html.slice(end);
  const used = new Set();

  body = body.replace(/<p>([\s\S]*?)<\/p>/gi, (whole, inner) => {
    if (/<a\b/i.test(inner)) return whole;
    let text = inner;
    for (const suburb of SUBURBS) {
      if (used.has(suburb.slug)) continue;
      const re = new RegExp('(^|[\\s(,.])(' + suburb.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')(?=[\\s),.:;!?]|$)');
      if (!re.test(text)) continue;
      text = text.replace(
        re,
        '$1<a ' + LINKED_MARK + ' href="' + suburb.url + '">$2</a>',
      );
      used.add(suburb.slug);
      break; // at most one new link per paragraph
    }
    return '<p>' + text + '</p>';
  });

  return head + body + tail;
}

/* ------------------------------------------------------ meta overrides */

function applyOverrides(html, page) {
  const over = OVERRIDES[page.slug];
  if (!over) return html;
  let out = html;
  if (over.title) {
    const escaped = over.title.replace(/&/g, '&amp;');
    out = out.replace(/<title>[\s\S]*?<\/title>/i, '<title>' + escaped + '</title>');
    out = out.replace(/(<meta property="og:title" content=")[^"]*(">)/i, '$1' + escaped + '$2');
    page.title = over.title;
  }
  if (over.description) {
    const escaped = over.description.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    out = out.replace(/(<meta name="description" content=")[^"]*(">)/i, '$1' + escaped + '$2');
    out = out.replace(/(<meta property="og:description" content=")[^"]*(">)/i, '$1' + escaped + '$2');
    page.description = over.description;
  }
  return out;
}

/* ----------------------------------------------------------------- run */

let changed = 0;
const report = { linked: 0, graphs: 0 };

for (const page of pages) {
  const original = page.html;
  let html = original;

  html = applyOverrides(html, page);
  html = lib.rewriteLinks(html);
  html = lib.rewriteInlineBackgrounds(html);
  html = lib.setHead(html, page.url);
  html = lib.fixImages(html);
  html = lib.preloadHero(html);
  html = lib.ensureReviewsLink(html);
  html = addNearbyBlock(html, page);
  html = addAreasHub(html, page);
  html = replaceHomeReviews(html, page);
  html = dropLegacyOrgBlock(html);
  const beforeLink = html;
  html = linkSuburbs(html, page);
  if (html !== beforeLink) report.linked += 1;
  html = injectGraph(html, page);
  report.graphs += 1;

  if (html !== original) {
    lib.write(path.join(PUBLIC, page.file), html);
    changed += 1;
  }
}

console.log('pages processed   : ' + pages.length);
console.log('pages rewritten   : ' + changed);
console.log('suburbs detected  : ' + SUBURBS.length);
console.log('pages interlinked : ' + report.linked);
console.log('graphs injected   : ' + report.graphs);
