/**
 * Reads an archive of the old GoHighLevel /post/ pages and writes the ones that
 * never made it into the new blog into data/legacy-posts.json.
 *
 *   node scripts/extract-legacy-posts.js <archive-dir> <archive.html>
 *
 * <archive-dir>  a directory of <old-slug>.html files saved off the live site
 * <archive.html> the rendered blog archive from the new blog service
 *
 * Posts whose title matches a post in the new blog are recorded as redirects in
 * data/post-redirects.json instead; the rest keep their original URL and are
 * rebuilt as static pages by scripts/build-legacy-posts.js.
 */
const fs = require('fs');
const path = require('path');

const [, , ARCHIVE_DIR, ARCHIVE_HTML] = process.argv;
if (!ARCHIVE_DIR || !ARCHIVE_HTML) {
  console.error('usage: node scripts/extract-legacy-posts.js <archive-dir> <archive.html>');
  process.exit(1);
}

const DATA = path.join(__dirname, '..', 'data');
fs.mkdirSync(DATA, { recursive: true });

const unesc = (s) =>
  String(s)
    .replace(/&#x2F;/gi, '/')
    .replace(/&#8217;|&rsquo;|&#0?39;|&apos;/g, "'")
    .replace(/&#8211;|&ndash;/g, '-')
    .replace(/&#8212;|&mdash;/g, '-')
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');

const norm = (t) =>
  unesc(t || '')
    .replace(/\s*[|–—-]\s*Baxter\s*&?\s*Mason.*$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const meta = (html, re) => {
  const m = html.match(re);
  return m ? unesc(m[1].trim()) : '';
};

const VOID = /^(img|br|hr|input|meta|link|source|area|base|col|embed|param|track|wbr)$/i;

/** Slice out the balanced element that carries id="blogPostContent". */
function articleBody(html) {
  const anchor = html.indexOf('id="blogPostContent"');
  if (anchor === -1) return '';
  const start = html.lastIndexOf('<', anchor);
  const re = /<(\/?)([a-z0-9]+)([^>]*?)(\/?)>/gi;
  re.lastIndex = start;
  let depth = 0;
  let m;
  while ((m = re.exec(html))) {
    const closing = m[1] === '/';
    const selfClosing = m[4] === '/' || VOID.test(m[2]);
    if (!closing && !selfClosing) depth += 1;
    else if (closing) depth -= 1;
    if (depth === 0) return html.slice(start, re.lastIndex);
  }
  return '';
}

const ALLOWED = /^(p|br|strong|b|em|i|u|ul|ol|li|h2|h3|h4|blockquote|a|img)$/i;

/**
 * Keep only the tags we are prepared to render inside our own template, and
 * only the attributes those tags actually need — the GoHighLevel export carries
 * inline styles and data-* noise that would fight our stylesheet.
 */
function sanitise(html) {
  let out = html;
  out = out.replace(/<(script|style|iframe|form|noscript)\b[\s\S]*?<\/\1>/gi, '');

  out = out.replace(/<(\/?)([a-z0-9]+)([^>]*?)(\/?)>/gi, (whole, close, tag, attrs, selfClose) => {
    if (!ALLOWED.test(tag)) return '';
    if (close) return '</' + tag.toLowerCase() + '>';

    const keep = [];
    const wanted = tag.toLowerCase() === 'a' ? ['href'] : tag.toLowerCase() === 'img' ? ['src', 'alt'] : [];
    for (const name of wanted) {
      const m = attrs.match(new RegExp('\\b' + name + '="([^"]*)"', 'i'));
      if (m && m[1]) keep.push(name + '="' + m[1] + '"');
    }
    if (tag.toLowerCase() === 'a' && !keep.length) return '';
    if (tag.toLowerCase() === 'img' && !keep.some((a) => a.startsWith('src='))) return '';
    if (tag.toLowerCase() === 'a') keep.push('rel="noopener"');
    return '<' + tag.toLowerCase() + (keep.length ? ' ' + keep.join(' ') : '') + (selfClose ? '/' : '') + '>';
  });

  out = out.replace(/<(p|h2|h3|h4|li|blockquote)>\s*(<br\s*\/?>)?\s*<\/\1>/gi, '');
  out = out.replace(/(?:<br\s*\/?>\s*){3,}/gi, '<br><br>');
  out = out.replace(/&nbsp;/g, ' ').replace(/[ \t]+/g, ' ');
  return out.trim();
}

const MONTHS = {
  january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
  july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
};

/** GoHighLevel renders the publish date as <span class="blog-date">July 01, 2024</span>. */
function publishedDate(html) {
  const m = html.match(/class="[^"]*blog-date[^"]*"[^>]*>\s*([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/i);
  if (!m) return '';
  const month = MONTHS[m[1].toLowerCase()];
  if (!month) return '';
  return m[3] + '-' + month + '-' + String(m[2]).padStart(2, '0');
}

/* ---------------------------------------------------------------- gather */

const her = {};
for (const file of fs.readdirSync(ARCHIVE_DIR).filter((f) => f.endsWith('.html'))) {
  const html = fs.readFileSync(path.join(ARCHIVE_DIR, file), 'utf8');
  const slug = file.replace(/\.html$/, '');
  const title =
    meta(html, /<meta property="og:title" content="([^"]*)"/i) ||
    meta(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  her[slug] = {
    slug,
    title,
    norm: norm(title),
    description: meta(html, /<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["']/i),
    image: meta(html, /<meta property="og:image" content="([^"]*)"/i),
    published:
      meta(html, /<meta property="article:published_time" content="([^"]*)"/i) || publishedDate(html),
    body: sanitise(articleBody(html)),
  };
}

const archive = fs.readFileSync(ARCHIVE_HTML, 'utf8');
const current = {};
for (const chunk of archive.split(/<a href="[^"]*\/blog\//).slice(1)) {
  const slug = chunk.slice(0, chunk.indexOf('"'));
  const m = chunk.match(/class="blog-card-title">([\s\S]*?)<\/h2>/);
  if (!m) continue;
  const title = unesc(m[1].replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
  current[norm(title)] = slug;
}

/* ----------------------------------------------------------------- split */

const redirects = {};
const legacy = [];
const dropped = [];

for (const slug of Object.keys(her).sort()) {
  const post = her[slug];
  const match = current[post.norm];
  if (match) {
    redirects[slug] = match;
    continue;
  }
  const words = post.body.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  if (words < 80) {
    dropped.push(slug);
    continue;
  }
  legacy.push({
    slug: post.slug,
    title: post.title,
    description: post.description,
    image: post.image,
    published: post.published,
    words,
    body: post.body,
  });
}

fs.writeFileSync(path.join(DATA, 'post-redirects.json'), JSON.stringify(redirects, null, 2) + '\n');
fs.writeFileSync(path.join(DATA, 'legacy-posts.json'), JSON.stringify(legacy, null, 2) + '\n');

console.log('archived posts read : ' + Object.keys(her).length);
console.log('redirect to new blog: ' + Object.keys(redirects).length);
console.log('rebuilt in place    : ' + legacy.length);
if (dropped.length) console.log('too thin to rebuild : ' + dropped.length + ' -> ' + dropped.join(', '));
