#!/usr/bin/env node
/**
 * Refresh data/reviews.json straight from Google, with no GoHighLevel in the
 * loop.
 *
 *   GOOGLE_PLACES_API_KEY=... node scripts/refresh-reviews.js
 *   GOOGLE_PLACES_API_KEY=... node scripts/refresh-reviews.js --dry
 *
 * The reviews currently in the repo were captured from the GoHighLevel review
 * widget before that account closes. They keep working forever — they are
 * static data — but they will not pick up new reviews on their own. This is the
 * replacement path.
 *
 * A caveat worth knowing: the Places API returns at most five reviews per
 * place. The aggregate (rating and total count) is always accurate and is what
 * the AggregateRating markup uses, so that stays correct automatically. For the
 * individual reviews the script MERGES — anything Google returns is added or
 * updated, and reviews already in the file are kept rather than dropped. That
 * way the 30 captured here survive, and the set grows over time.
 *
 * Needs a Google Cloud API key with the Places API (New) enabled.
 * Set it in the shell, never in the repo.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const OUT = path.join(__dirname, '..', 'data', 'reviews.json');
const KEY = process.env.GOOGLE_PLACES_API_KEY;
const DRY = process.argv.includes('--dry');

// The business, as it appears on the Google Business Profile.
const BUSINESS = 'Baxter & Mason Property Buyers Agent';
const ADDRESS = '17 Baleara Street, Buddina QLD 4575, Australia';

function post(url, body, headers) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = https.request(
      url,
      {
        method: 'POST',
        headers: Object.assign(
          { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
          headers,
        ),
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode + ': ' + text.slice(0, 300)));
          try {
            resolve(JSON.parse(text));
          } catch (err) {
            reject(err);
          }
        });
      },
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function get(url, headers) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers }, (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode + ': ' + text.slice(0, 300)));
          try {
            resolve(JSON.parse(text));
          } catch (err) {
            reject(err);
          }
        });
      })
      .on('error', reject);
  });
}

const clean = (s) => String(s || '').replace(/ /g, ' ').replace(/[ \t]+/g, ' ').replace(/\s*\n\s*/g, '\n').trim();

/** Stable id so a review keeps its identity between refreshes. */
function idFor(author, date, body) {
  let hash = 0;
  const seed = author + '|' + date + '|' + body.slice(0, 80);
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return 'g' + hash.toString(16);
}

async function run() {
  if (!KEY) {
    console.error('Set GOOGLE_PLACES_API_KEY (Places API (New) must be enabled on the key).');
    process.exit(1);
  }

  const search = await post(
    'https://places.googleapis.com/v1/places:searchText',
    { textQuery: BUSINESS + ', ' + ADDRESS, maxResultCount: 1 },
    { 'X-Goog-Api-Key': KEY, 'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress' },
  );

  const place = (search.places || [])[0];
  if (!place) {
    console.error('No matching place. Check BUSINESS and ADDRESS at the top of this script.');
    process.exit(1);
  }
  console.log('matched: ' + place.displayName.text + ' — ' + place.formattedAddress);

  const details = await get(
    'https://places.googleapis.com/v1/places/' + place.id + '?languageCode=en',
    { 'X-Goog-Api-Key': KEY, 'X-Goog-FieldMask': 'rating,userRatingCount,reviews' },
  );

  const existing = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : { reviews: [] };
  const merged = new Map(existing.reviews.map((r) => [r.id, r]));

  let added = 0;
  for (const review of details.reviews || []) {
    const body = clean(review.originalText ? review.originalText.text : (review.text || {}).text);
    if (!body) continue;
    const author = clean((review.authorAttribution || {}).displayName) || 'Anonymous';
    const date = String(review.publishTime || '').slice(0, 10);
    const id = idFor(author, date, body);
    if (!merged.has(id)) added += 1;
    merged.set(id, { id, author, rating: review.rating, date, body });
  }

  const out = {
    _comment:
      'Google reviews shown on the site. Aggregate comes straight from the Google Business Profile; ' +
      'individual reviews are merged across refreshes because the Places API returns at most five at a time. ' +
      'Refresh with scripts/refresh-reviews.js. Only reviews in this file are marked up, because only these are rendered.',
    source: 'Google',
    aggregate: {
      ratingValue: details.rating,
      reviewCount: details.userRatingCount,
      bestRating: 5,
      worstRating: 1,
    },
    reviews: [...merged.values()].sort((a, b) => String(b.date).localeCompare(String(a.date))),
  };

  console.log('aggregate  : ' + out.aggregate.ratingValue + ' from ' + out.aggregate.reviewCount + ' reviews');
  console.log('reviews    : ' + out.reviews.length + ' (' + added + ' new this run)');

  if (DRY) {
    console.log('\n--dry: nothing written.');
    return;
  }
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
  console.log('\nwrote data/reviews.json — now run: node scripts/seo-rewrite.js');
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
