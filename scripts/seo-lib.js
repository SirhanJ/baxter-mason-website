/**
 * Shared helpers for the SEO transform over the static pages in public/.
 * Everything here is pure enough to unit-check by hand; seo-rewrite.js drives it.
 */
const fs = require('fs');
const path = require('path');

const PUBLIC = path.join(__dirname, '..', 'public');
const SITE = 'https://www.baxtermason.com.au';
const ORG_ID = SITE + '/#organization';
const SITE_ID = SITE + '/#website';

const GRAPH_OPEN = '<!-- seo:graph -->';
const GRAPH_CLOSE = '<!-- /seo:graph -->';
const ROBOTS_MARK = 'seo:robots';
const LINKED_MARK = 'data-suburb-link';

const read = (f) => fs.readFileSync(f, 'utf8');
const write = (f, s) => fs.writeFileSync(f, s, 'utf8');

const unesc = (s) =>
  String(s)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;|&rsquo;/g, "'")
    .replace(/&nbsp;/g, ' ');

const strip = (s) =>
  unesc(String(s).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

/** public/foo.html -> /foo ; public/index.html -> / */
function urlFor(file) {
  const base = path.basename(file, '.html');
  return base === 'index' ? '/' : '/' + base;
}

/* ------------------------------------------------------ image dimensions */
/* Header readers, so the transform needs no image library at runtime. */

function pngSize(buf) {
  if (buf.length < 24 || buf.readUInt32BE(0) !== 0x89504e47) return null;
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

function jpegSize(buf) {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marker = buf[i + 1];
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      i += 2;
      continue;
    }
    const len = buf.readUInt16BE(i + 2);
    const isSof =
      marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSof) return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
    i += 2 + len;
  }
  return null;
}

function webpSize(buf) {
  if (buf.length < 30) return null;
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') return null;
  const fmt = buf.toString('ascii', 12, 16);
  if (fmt === 'VP8X') {
    return { w: buf.readUIntLE(24, 3) + 1, h: buf.readUIntLE(27, 3) + 1 };
  }
  if (fmt === 'VP8 ') {
    return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
  }
  if (fmt === 'VP8L') {
    const b = buf.readUInt32LE(21);
    return { w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1 };
  }
  return null;
}

const dimCache = new Map();

function dimsFor(srcPath) {
  if (dimCache.has(srcPath)) return dimCache.get(srcPath);
  let out = null;
  try {
    const rel = decodeURIComponent(srcPath.split('?')[0]).replace(/^\//, '');
    const buf = fs.readFileSync(path.join(PUBLIC, rel));
    const ext = path.extname(rel).toLowerCase();
    out = ext === '.png' ? pngSize(buf) : ext === '.webp' ? webpSize(buf) : jpegSize(buf);
  } catch (err) {
    out = null;
  }
  dimCache.set(srcPath, out);
  return out;
}

/** Encode a public-relative path the way the existing markup does (spaces as %20). */
function encodePath(rel) {
  return '/' + rel.split('/').map(encodeURIComponent).join('/');
}

function webpSibling(srcPath) {
  const clean = decodeURIComponent(srcPath.split('?')[0]).replace(/^\//, '');
  if (!/\.(png|jpe?g)$/i.test(clean)) return null;
  const candidate = clean.replace(/\.(png|jpe?g)$/i, '.webp');
  return fs.existsSync(path.join(PUBLIC, candidate)) ? encodePath(candidate) : null;
}

/* ------------------------------------------------------------ link rules */

const PAGES = fs
  .readdirSync(PUBLIC)
  .filter((f) => f.endsWith('.html'))
  .sort();
const SLUGS = new Set(PAGES.map((f) => path.basename(f, '.html')));

/**
 * Every href/src that points at one of our own pages becomes root-relative and
 * extensionless, so no internal click costs a redirect hop.
 */
function rewriteLinks(html) {
  return html.replace(/(href|src)="([^"]*)"/g, (whole, attr, value) => {
    if (/^(https?:|mailto:|tel:|#|data:|\/\/)/i.test(value)) return whole;

    const cut = value.search(/[?#]/);
    const pathPart = cut === -1 ? value : value.slice(0, cut);
    const suffix = cut === -1 ? '' : value.slice(cut);
    const bare = pathPart.replace(/^\.?\//, '');

    if (/\.html$/i.test(bare)) {
      const slug = bare.replace(/\.html$/i, '');
      if (!SLUGS.has(slug)) return whole;
      return attr + '="' + (slug === 'index' ? '/' : '/' + slug) + suffix + '"';
    }
    if (/^(images|css|js)\//i.test(bare)) return attr + '="/' + bare + suffix + '"';
    return whole;
  });
}

/**
 * Hero images are set as inline background-image, which the <img> pass never
 * sees. Same treatment: root-relative, and the WebP sibling where one exists.
 */
function rewriteInlineBackgrounds(html) {
  return html.replace(/url\((['"]?)([^'")]+)\1\)/gi, (whole, quote, value) => {
    if (/^(https?:|data:|\/\/)/i.test(value)) return whole;
    const bare = value.replace(/^\.?\//, '');
    if (!/^images\//i.test(bare)) return whole;

    const cut = bare.search(/[?#]/);
    const pathPart = cut === -1 ? bare : bare.slice(0, cut);
    const suffix = cut === -1 ? '' : bare.slice(cut);
    const webp = webpSibling('/' + pathPart);
    return 'url(' + quote + (webp || '/' + pathPart) + suffix + quote + ')';
  });
}

/**
 * /reviews is an App Router page, so it has no footer entry in the static
 * markup. Without one it would be reachable only from the sitemap and a single
 * redirect — add it to the Explore column so every page links to it.
 */
function ensureReviewsLink(html) {
  if (html.indexOf('href="/reviews"') !== -1) return html;
  return html.replace(
    /(<li><a href="\/success-stories">Success Stories<\/a><\/li>)/i,
    '$1\n<li><a href="/reviews">Client Reviews</a></li>',
  );
}

/* ----------------------------------------------------------------- head */

function setHead(html, url) {
  const abs = SITE + url;
  let out = html;

  out = out.replace(/<link rel="canonical" href="[^"]*">/i, '<link rel="canonical" href="' + abs + '">');
  out = out.replace(/(<meta property="og:url" content=")[^"]*(">)/i, '$1' + abs + '$2');

  if (out.indexOf(ROBOTS_MARK) === -1) {
    out = out.replace(
      /(<link rel="canonical"[^>]*>)/i,
      '$1\n<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"><!-- ' +
        ROBOTS_MARK +
        ' -->',
    );
  }
  return out;
}

/* --------------------------------------------------------------- images */

/** Site furniture — logos and the loading mark. Never the LCP element. */
const CHROME_CLASS = /\b(site-loader-logo|logo-img|ft-logo)\b/;

/**
 * Sizing, format and loading priority.
 *
 * Priority is the part worth being careful about: `fetchpriority="high"` is a
 * budget, and spending it on the nav logo is worse than not setting it at all,
 * because it competes with whatever the LCP element actually is. So chrome
 * loads eagerly but at normal priority, the first real content image gets the
 * high-priority hint, and everything after it defers.
 */
function fixImages(html) {
  let contentSeen = 0;
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    let out = tag;
    const srcMatch = out.match(/\bsrc="([^"]+)"/i);
    if (!srcMatch) return out;
    let src = srcMatch[1];

    const className = (out.match(/\bclass="([^"]*)"/i) || [, ''])[1];
    const isChrome = CHROME_CLASS.test(className);
    if (!isChrome) contentSeen += 1;
    const isLeadContent = !isChrome && contentSeen === 1;

    if (!/^https?:/i.test(src)) {
      const webp = webpSibling(src);
      if (webp) {
        const q = src.indexOf('?') === -1 ? '' : src.slice(src.indexOf('?'));
        out = out.replace(/\bsrc="[^"]+"/i, 'src="' + webp + q + '"');
        src = webp + q;
      }
      if (!/\bwidth="/i.test(out) || !/\bheight="/i.test(out)) {
        const d = dimsFor(src);
        if (d && d.w && d.h) {
          out = out.replace(/\swidth="[^"]*"/i, '').replace(/\sheight="[^"]*"/i, '');
          out = out.replace(/<img\b/i, '<img width="' + d.w + '" height="' + d.h + '"');
        }
      }
    }

    // Recompute every run so a change to these rules actually takes effect.
    out = out
      .replace(/\sloading="[^"]*"/i, '')
      .replace(/\sfetchpriority="[^"]*"/i, '')
      .replace(/\sdecoding="[^"]*"/i, '');

    // The footer mark and the light-nav variant are both off-screen or hidden
    // at first paint, so they defer even though they count as chrome.
    const deferredChrome = /\b(ft-logo|logo-img--light)\b/.test(className);
    const lazy = deferredChrome || (!isChrome && !isLeadContent);

    let attrs = ' loading="' + (lazy ? 'lazy' : 'eager') + '"';
    if (isLeadContent) attrs += ' fetchpriority="high"';
    attrs += ' decoding="async"';

    return out.replace(/<img\b/i, '<img' + attrs);
  });
}

/**
 * Most pages put their hero in an inline background-image, which no <img>
 * priority hint can reach. Preloading it is the only way to tell the browser
 * that the biggest thing on the page is worth fetching first.
 */
function preloadHero(html) {
  const cleaned = html.replace(
    /\n?<link rel="preload" as="image"[^>]*><!-- seo:hero -->/g,
    '',
  );
  const body = cleaned.slice(cleaned.indexOf('<body'));
  const match = body.match(/url\(['"]?(\/images\/[^'")]+)['"]?\)/i);
  if (!match) return cleaned;

  const tag =
    '\n<link rel="preload" as="image" href="' +
    match[1] +
    '" fetchpriority="high"><!-- seo:hero -->';
  return cleaned.replace(/(<link rel="stylesheet"[^>]*>)/i, '$1' + tag);
}

module.exports = {
  PUBLIC,
  SITE,
  ORG_ID,
  SITE_ID,
  GRAPH_OPEN,
  GRAPH_CLOSE,
  LINKED_MARK,
  PAGES,
  SLUGS,
  read,
  write,
  unesc,
  strip,
  urlFor,
  dimsFor,
  webpSibling,
  encodePath,
  rewriteLinks,
  rewriteInlineBackgrounds,
  setHead,
  fixImages,
  preloadHero,
  ensureReviewsLink,
};
