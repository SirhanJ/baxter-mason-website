/**
 * Regenerates public/sitemap.xml and public/robots.txt from the static pages
 * in public/. Run with `node scripts/generate-sitemap.js` after adding pages.
 */
const fs = require('fs');
const path = require('path');

const ORIGIN = 'https://www.baxtermason.com.au';
const publicDir = path.join(__dirname, '..', 'public');

// Pages that exist only as build artefacts or are not meant to be indexed.
const EXCLUDE = new Set(['404.html', '500.html']);

function priorityFor(file) {
  if (file === 'index.html') return '1.0';
  if (file === 'privacy.html' || file === 'terms.html') return '0.3';
  if (file.startsWith('story-')) return '0.6';
  if (file.endsWith('-buyers-agent.html')) return '0.7';
  if (file.startsWith('blog-')) return '0.6';
  return '0.8';
}

function changefreqFor(file) {
  if (file === 'index.html' || file === 'success-stories.html') return 'weekly';
  if (file === 'privacy.html' || file === 'terms.html') return 'yearly';
  return 'monthly';
}

const today = new Date().toISOString().slice(0, 10);

const pages = fs
  .readdirSync(publicDir)
  .filter((f) => f.endsWith('.html') && !EXCLUDE.has(f))
  .sort();

const urls = pages.map((file) => ({
  loc: `${ORIGIN}/${file === 'index.html' ? '' : file}`,
  priority: priorityFor(file),
  changefreq: changefreqFor(file),
}));

// Blog lives on a Next.js route rather than a static file.
urls.push({ loc: `${ORIGIN}/blog`, priority: '0.8', changefreq: 'weekly' });

const body = urls
  .map(
    (u) =>
      `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${today}</lastmod>\n` +
      `    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`,
  )
  .join('\n');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;

const robots = `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`;

fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap, 'utf8');
fs.writeFileSync(path.join(publicDir, 'robots.txt'), robots, 'utf8');

console.log(`sitemap.xml written with ${urls.length} urls`);
