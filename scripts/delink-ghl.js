#!/usr/bin/env node
/**
 * Pull every GoHighLevel-hosted asset into the repo and repoint the markup at
 * the local copy.
 *
 *   node scripts/delink-ghl.js          # download + rewrite
 *   node scripts/delink-ghl.js --report # list what is still remote
 *
 * The site is moving off GoHighLevel entirely. Anything still served from
 * images.leadconnectorhq.com, the msgsndr bucket or filesafe.space stops
 * resolving the day that account closes — which for the lead-magnet PDFs means
 * the download links die, and for the images means broken pages.
 *
 * Downloaded images land in public/images/ghl/ and are picked up by
 * scripts/optimise-images.js on the next run; PDFs land in public/downloads/.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const IMG_DIR = path.join(PUBLIC, 'images', 'ghl');
const DOC_DIR = path.join(PUBLIC, 'downloads');
const REPORT_ONLY = process.argv.includes('--report');

const GHL_HOST =
  /https?:\/\/(?:images\.leadconnectorhq\.com|storage\.googleapis\.com\/msgsndr|assets\.cdn\.filesafe\.space)[^"')\s>]*/g;

/** images.leadconnectorhq.com proxies the real file; unwrap to the original. */
function originalUrl(url) {
  const proxied = url.match(/u_(https?:\/\/.+)$/);
  return proxied ? proxied[1] : url;
}

function localNameFor(url) {
  const clean = originalUrl(url).split('?')[0];
  const base = clean.split('/').pop() || 'asset';
  // GoHighLevel names everything with an opaque id, which is fine as a filename.
  return base.replace(/[^A-Za-z0-9._-]/g, '-');
}

const isDoc = (name) => /\.(pdf|docx?|xlsx?|csv)$/i.test(name);

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const request = (target, depth) => {
      if (depth > 5) return reject(new Error('too many redirects'));
      https
        .get(target, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            res.resume();
            return request(new URL(res.headers.location, target).href, depth + 1);
          }
          if (res.statusCode !== 200) {
            res.resume();
            return reject(new Error('HTTP ' + res.statusCode));
          }
          const chunks = [];
          res.on('data', (c) => chunks.push(c));
          res.on('end', () => {
            fs.writeFileSync(dest, Buffer.concat(chunks));
            resolve(fs.statSync(dest).size);
          });
        })
        .on('error', reject);
    };
    request(url, 0);
  });
}

async function run() {
  const files = fs.readdirSync(PUBLIC).filter((f) => f.endsWith('.html'));
  const urls = new Set();
  for (const file of files) {
    const html = fs.readFileSync(path.join(PUBLIC, file), 'utf8');
    for (const match of html.match(GHL_HOST) || []) urls.add(match);
  }

  console.log('remote GoHighLevel assets referenced: ' + urls.size);
  if (REPORT_ONLY) {
    [...urls].sort().forEach((u) => console.log('  ' + u));
    return;
  }

  fs.mkdirSync(IMG_DIR, { recursive: true });
  fs.mkdirSync(DOC_DIR, { recursive: true });

  /** remote url -> local public path */
  const mapping = new Map();
  let fetched = 0;
  let failed = 0;

  for (const url of urls) {
    const name = localNameFor(url);
    const doc = isDoc(name);
    const dest = path.join(doc ? DOC_DIR : IMG_DIR, name);
    const publicPath = (doc ? '/downloads/' : '/images/ghl/') + name;

    if (!fs.existsSync(dest)) {
      try {
        const bytes = await download(originalUrl(url), dest);
        fetched += 1;
        console.log('  saved ' + publicPath + ' (' + Math.round(bytes / 1024) + ' KB)');
      } catch (err) {
        failed += 1;
        console.log('  FAILED ' + url + ' — ' + err.message);
        continue;
      }
    }
    mapping.set(url, publicPath);
  }

  let rewritten = 0;
  for (const file of files) {
    const full = path.join(PUBLIC, file);
    const before = fs.readFileSync(full, 'utf8');
    let after = before;
    for (const [remote, local] of mapping) {
      after = after.split(remote).join(local);
    }
    if (after !== before) {
      fs.writeFileSync(full, after, 'utf8');
      rewritten += 1;
    }
  }

  console.log('downloaded : ' + fetched + (failed ? ' (' + failed + ' failed)' : ''));
  console.log('pages fixed: ' + rewritten);
  console.log('\nNow run: node scripts/optimise-images.js && node scripts/seo-rewrite.js');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
