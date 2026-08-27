/**
 * Focused SEO pass: header Reviews link, suburb proof CTA, cache bumps.
 * Does not rewrite JSON-LD graphs.
 */
const fs = require("fs");
const path = require("path");
const lib = require("./seo-lib");

const PUBLIC = path.join(__dirname, "..", "public");

function bumpCaches(html) {
  return html
    .replace(/main\.js\?v=\d+/g, "main.js?v=23")
    .replace(/css\/styles\.css\?v=\d+/g, "css/styles.css?v=57")
    .replace(/css\/home\.css\?v=\d+/g, "css/home.css?v=31");
}

let changed = 0;
const files = fs.readdirSync(PUBLIC).filter((file) => file.endsWith(".html"));

for (const file of files) {
  const dest = path.join(PUBLIC, file);
  const original = fs.readFileSync(dest, "utf8");
  let html = lib.ensureReviewsNav(original);
  if (/-buyers-agent\.html$/.test(file)) {
    html = lib.addSuburbProof(html);
  }
  html = bumpCaches(html);
  if (html !== original) {
    fs.writeFileSync(dest, html);
    changed += 1;
  }
}

console.log("html files scanned : " + files.length);
console.log("html files updated : " + changed);
