const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '../app/lib/blogEnhance.ts'), 'utf8');
// Transform syntax only, matching the existing outage tests. No type validation.
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
const exported = {};
vm.runInNewContext(code, { exports: exported, require: name => {
  if (name === '../../data/reviewed-blog-summaries.json') return {};
  if (name === './rewriteBlogLinks') return { localBlogImage: value => value };
  throw Error(name);
}, URL });
test('related cards without images stay decorative and retain their descriptive link text', () => {
  const article = '<section><div class="related-posts-grid"></div></section>';
  const current = { slug: 'current', title: 'Current story' };
  const related = { slug: 'related', title: 'A readable related story', og_image: null };
  const result = exported.withRelatedPosts(article, current, [current, related]);
  assert.match(result, /class="blog-card-image-placeholder" aria-hidden="true"/);
  assert.doesNotMatch(result, /role="img"|aria-label=""/);
  assert.match(result, /href="\/blog\/related"/);
  assert.match(result, /A readable related story/);
});

test('upstream truncated descriptions end at a complete sentence', () => {
  assert.equal(exported.completeDescription('A complete fact. An unfinished descri', 'Article'), 'A complete fact.');
  assert.equal(exported.completeDescription('The grant explained:', 'The grant explained'), 'Read The grant explained from Baxter & Mason.');
});
test('article hierarchy starts below its title and author byline is plain metadata', () => {
  const input = '<h1 class="article-title">Title</h1><div class="article-content"><h3>Section</h3><p>Body</p><h4>Detail</h4></div><div class="author-bio"><h4>Written by Sally Blyth</h4></div><section class="related-posts"><h3>More to Read</h3></section>';
  const html = exported.normalizeArticleHeadings(input);
  assert.match(html, /<h1 class="article-title">Title<\/h1>/);
  assert.match(html, /<h2>Section<\/h2>/);
  assert.match(html, /<h3>Detail<\/h3>/);
  assert.match(html, /<p class="article-author-name">Written by Sally Blyth<\/p>/);
  assert.match(html, /<h2>More to Read<\/h2>/);
});
test('featured-image dimensions work when upstream adds another CSS class', () => {
  assert.match(exported.addImageSizes('<div class="article-featured-image ready"><img src="picture.webp" alt="Title"></div>'), /width="1280" height="720"/);
});
test('archive cards receive complete descriptions while links and titles are retained', () => {
  const html = exported.completeArchiveSummaries('<a href="/blog/test" class="blog-card"><h2 class="blog-card-title">A title</h2><p class="blog-card-excerpt">A sentence. Chopped wor</p></a>');
  assert.match(html, /href="\/blog\/test"/);
  assert.match(html, /<p class="blog-card-excerpt">A sentence.<\/p>/);
});

test('archive entities are not escaped twice', () => { assert.equal(exported.completeDescription('Buyer&#039;s guide &amp; advice. Chopped', 'Title'), "Buyer's guide & advice."); });

test('complete summaries preserve decimals and abbreviations', () => { assert.equal(exported.completeDescription('Prices rose 3.5% in 2026. An unfinished tail', 'Title'), 'Prices rose 3.5% in 2026.'); assert.equal(exported.completeDescription('Dr. Smith paid $1.25 million. A truncat', 'Title'), 'Dr. Smith paid $1.25 million.'); });
