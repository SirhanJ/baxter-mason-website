/**
 * Bring public/images down to a sane weight.
 *
 *   node scripts/optimise-images.js [--dry]
 *
 * For every JPEG/PNG under public/images this:
 *   - downscales the original in place to MAX_WIDTH and re-encodes it, so
 *     anything still pointing at the original (CSS backgrounds, og:image) gets
 *     a reasonable file rather than a 3.6 MB one;
 *   - writes a .webp sibling, which is what scripts/seo-lib.js swaps <img> over
 *     to during the SEO pass.
 *
 * Re-running is cheap: files already at or below the target are left alone.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..', 'public', 'images');
const MAX_WIDTH = 1600;
const JPEG_QUALITY = 82;
const WEBP_QUALITY = 78;
const DRY = process.argv.includes('--dry');

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.(jpe?g|png)$/i.test(entry.name)) out.push(full);
  }
  return out;
}

async function run() {
  const files = walk(ROOT).sort();
  let before = 0;
  let after = 0;
  let webpBytes = 0;
  let resized = 0;

  for (const file of files) {
    // Read into memory first: on Windows sharp keeps a path-backed source open,
    // which blocks writing back over the same file.
    const source = fs.readFileSync(file);
    const startSize = source.length;
    before += startSize;

    const meta = await sharp(source, { failOn: 'none' }).metadata();
    const needsResize = (meta.width || 0) > MAX_WIDTH;
    const isPng = /\.png$/i.test(file);

    // 1. Downscale + re-encode the original when it is oversized or heavy on disk.
    let current = source;
    if (!DRY && (needsResize || startSize > 300 * 1024)) {
      const pipeline = sharp(source, { failOn: 'none' }).rotate();
      if (needsResize) pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
      const buf = await (isPng
        ? pipeline.png({ compressionLevel: 9, palette: true }).toBuffer()
        : pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer());
      if (buf.length < startSize) {
        fs.writeFileSync(file, buf);
        current = buf;
        resized += 1;
      }
    }
    after += current.length;

    // 2. WebP sibling.
    const webp = file.replace(/\.(jpe?g|png)$/i, '.webp');
    if (!DRY && !fs.existsSync(webp)) {
      const buf = await sharp(current, { failOn: 'none' })
        .rotate()
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();
      fs.writeFileSync(webp, buf);
    }
    if (fs.existsSync(webp)) webpBytes += fs.statSync(webp).size;
  }

  const mb = (n) => (n / 1024 / 1024).toFixed(1) + ' MB';
  console.log('source images : ' + files.length);
  console.log('re-encoded    : ' + resized);
  console.log('originals     : ' + mb(before) + ' -> ' + mb(after));
  console.log('webp siblings : ' + mb(webpBytes));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
