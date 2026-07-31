const fs = require('fs');
const path = require('path');
const PUBLIC = path.join(__dirname, '..', 'public');
const TARGET_SRC = 'images/logos%20and%20sally%20stuff/Baxter-and-Mason-logo-nav.png';
const LT = String.fromCharCode(60);
const GT = String.fromCharCode(62);
const DQ = String.fromCharCode(34);
const SQ = String.fromCharCode(39);
const IMG_OPEN = LT + 'img';

function setSrc(attrs, target) {
  const low = attrs.toLowerCase();
  const i = low.indexOf('src=');
  if (i === -1) return attrs;
  let j = i + 4;
  while (j < attrs.length && attrs[j] === ' ') j += 1;
  if (j >= attrs.length) return attrs;
  const q = attrs[j];
  if (q !== DQ && q !== SQ) return attrs;
  const k = attrs.indexOf(q, j + 1);
  if (k === -1) return attrs;
  return attrs.slice(0, j + 1) + target + attrs.slice(k);
}

function bumpCss(html) {
  const key = 'css/styles.css?v=';
  let i = 0;
  let out = '';
  for (;;) {
    const k = html.indexOf(key, i);
    if (k === -1) {
      out += html.slice(i);
      break;
    }
    out += html.slice(i, k + key.length);
    let j = k + key.length;
    while (j < html.length) {
      const c = html.charCodeAt(j);
      if (c < 48 || c > 57) break;
      j += 1;
    }
    out += '44';
    i = j;
  }
  return out;
}

function fixHtml(html) {
  html = bumpCss(html);
  const parts = html.split(IMG_OPEN);
  if (parts.length === 1) return html;
  return parts
    .map((part, idx) => {
      if (idx === 0) return part;
      const gt = part.indexOf(GT);
      if (gt === -1) return IMG_OPEN + part;
      const attrs = part.slice(0, gt);
      const rest = part.slice(gt);
      if (!/\blogo-img--color\b/.test(attrs)) return IMG_OPEN + part;
      if (/\bsite-loader-logo\b/.test(attrs)) return IMG_OPEN + part;
      const newAttrs = setSrc(attrs, TARGET_SRC);
      return IMG_OPEN + newAttrs + rest;
    })
    .join('');
}

function findLogoAnchor(html) {
  const i = html.indexOf('logo-img--color');
  if (i === -1) return 'not found';
  const aStart = html.lastIndexOf(LT + 'a', i);
  const aEnd = html.indexOf(LT + '/a' + GT, i);
  if (aStart === -1 || aEnd === -1) return 'not found';
  return html.slice(aStart, aEnd + (LT + '/a' + GT).length);
}

const files = fs.readdirSync(PUBLIC).filter((f) => f.endsWith('.html'));
let changed = 0;
let sampleFile = null;
let sampleAnchor = null;

for (const file of files) {
  const fp = path.join(PUBLIC, file);
  const orig = fs.readFileSync(fp, 'utf8');
  const html = fixHtml(orig);
  if (html !== orig) {
    fs.writeFileSync(fp, html, 'utf8');
    changed += 1;
    if (!sampleFile) {
      sampleFile = file;
      sampleAnchor = findLogoAnchor(html);
    }
  }
}

console.log(
  JSON.stringify({ filesTotal: files.length, changed, sampleFile, sampleAnchor }, null, 2)
);
