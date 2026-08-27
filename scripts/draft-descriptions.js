/**
 * Draft meta descriptions for pages whose description is still the date stamp
 * and read time the old template emitted.
 *
 *   node scripts/draft-descriptions.js         # report only
 *   node scripts/draft-descriptions.js --write # merge into data/meta-overrides.json
 *
 * Each draft comes from the page's own opening copy, trimmed to a sentence
 * boundary under 155 characters. They are written into meta-overrides.json so
 * they can be edited by hand afterwards; seo-rewrite.js applies whatever is
 * there.
 */
const fs = require('fs');
const path = require('path');

const PUBLIC = path.join(__dirname, '..', 'public');
const OVERRIDES = path.join(__dirname, '..', 'data', 'meta-overrides.json');
const WRITE = process.argv.includes('--write');
const LIMIT = 155;

const BOILERPLATE = /min read|Success Story\s*·|^[A-Z][a-z]+ \d{1,2}, 20\d\d/;

const unesc = (s) =>
  String(s)
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;|&rsquo;|&#8217;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

const text = (s) => unesc(String(s).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

/** Paragraphs of real prose: no date lines, no nav crumbs, no one-word chips. */
function leadParagraphs(html) {
  const body = html.slice(Math.max(0, html.search(/<main\b|<section\b/i)));
  const paras = [...body.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => text(m[1]));
  return paras.filter(
    (p) =>
      p.length > 60 &&
      !BOILERPLATE.test(p) &&
      !/^(No obligation|Free ·|Copyright)/i.test(p),
  );
}

/** Trim to a sentence if one fits, otherwise to a word boundary. */
function condense(raw) {
  const clean = raw.replace(/\s+/g, ' ').trim();
  if (clean.length <= LIMIT) return clean;

  const sentences = clean.match(/[^.!?]+[.!?]/g) || [];
  let built = '';
  for (const s of sentences) {
    if ((built + s).trim().length > LIMIT) break;
    built += s;
  }
  built = built.trim();
  if (built.length >= 80) return built;

  let cut = clean.slice(0, LIMIT);
  cut = cut.slice(0, cut.lastIndexOf(' '));
  // Do not leave the sentence hanging on a joining word.
  const DANGLING =
    /\s+(a|an|the|and|but|or|to|of|for|with|that|this|their|his|her|its|as|at|in|on|by|from|after|before|when|while|so|because|both|he|she|they|we|you|it|was|were|is|are|had|has|have|would|could|should|will|can|not|just|only|very|more|most|-)$/i;
  while (DANGLING.test(cut)) cut = cut.replace(DANGLING, '');
  return cut.replace(/[,;:–—-]+$/, '').trim() + '.';
}

const existing = fs.existsSync(OVERRIDES) ? JSON.parse(fs.readFileSync(OVERRIDES, 'utf8')) : {};
const drafted = {};
const failed = [];

for (const file of fs.readdirSync(PUBLIC).filter((f) => f.endsWith('.html')).sort()) {
  const slug = path.basename(file, '.html');
  if (existing[slug] && existing[slug].description) continue;

  const html = fs.readFileSync(path.join(PUBLIC, file), 'utf8');
  const current = unesc((html.match(/<meta name="description" content="([^"]*)"/) || [, ''])[1]);
  if (!BOILERPLATE.test(current)) continue;

  const paras = leadParagraphs(html);
  if (!paras.length) {
    failed.push(slug);
    continue;
  }
  drafted[slug] = condense(paras.join(' '));
}

console.log('pages needing a description: ' + (Object.keys(drafted).length + failed.length));
for (const slug of Object.keys(drafted)) {
  console.log('  ' + slug.padEnd(38) + ' [' + String(drafted[slug].length).padStart(3) + '] ' + drafted[slug]);
}
if (failed.length) console.log('no usable copy found: ' + failed.join(', '));

if (WRITE) {
  for (const slug of Object.keys(drafted)) {
    existing[slug] = Object.assign({}, existing[slug], { description: drafted[slug] });
  }
  const ordered = {};
  for (const key of Object.keys(existing).sort()) ordered[key] = existing[key];
  fs.writeFileSync(OVERRIDES, JSON.stringify(ordered, null, 2) + '\n');
  console.log('\nmerged ' + Object.keys(drafted).length + ' descriptions into data/meta-overrides.json');
}
