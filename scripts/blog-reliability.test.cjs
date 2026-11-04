const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const fallback = require('../data/blog-fallbacks/the-impact-of-the-population-explosion-on-property-in-qld.json');
const identity = value => value;
function load(fetch) {
  const source = fs.readFileSync(require('node:path').join(__dirname, '../app/lib/blogSource.ts'), 'utf8');
  // Syntax transpilation only; no TypeScript program or type validation is run.
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const exports = {};
  const dependencies = {
    react: { cache: identity },
    '../../data/seo-descriptions.json': {},
    '../../data/reviewed-blog-summaries.json': require('../data/reviewed-blog-summaries.json'),
    '../../data/blog-fallbacks/the-impact-of-the-population-explosion-on-property-in-qld.json': fallback,
    './rewriteBlogLinks': { localBlogImage: identity, rewriteBlogLinks: identity },
    './seo': { SITE: 'https://www.baxtermason.com.au', ORG_ID: 'business' },
    './blogCanonical': { OLD_TO_CURRENT_POST_SLUG: {} },
    './blogEnhance': { addImageSizes: identity, stripFontImports: identity, withRelatedPosts: identity },
  };
  vm.runInNewContext(code, { exports, require: name => { if (!(name in dependencies)) throw Error(name); return dependencies[name]; }, fetch, Buffer, URL, AbortSignal, setTimeout });
  return exports;
}
test('an upstream outage uses the verified population article and original publication date', async () => {
  const calls = new Map();
  const api = load(async url => { calls.set(url, (calls.get(url) || 0) + 1); return new Response('Unavailable', { status: 503 }); });
  const post = await api.fetchPost(fallback.metadata.slug);
  assert.match(post.html, /The impact of the population explosion/);
  assert.equal(post.datePublished, fallback.metadata.published_at);
  assert.ok([...calls.values()].every(count => count === 2));
});
test('a confirmed withdrawal stays missing instead of resurrecting the cached article', async () => {
  const api = load(async () => new Response('Not found', { status: 404 }));
  assert.equal(await api.fetchPost(fallback.metadata.slug), null);
});
test('an unrelated unavailable article is not replaced by the saved fallback', async () => {
  const api = load(async () => new Response('Unavailable', { status: 503 }));
  await assert.rejects(() => api.fetchPost('unrelated-post'), /503/);
});
