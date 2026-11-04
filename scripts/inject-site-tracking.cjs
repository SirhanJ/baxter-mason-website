const fs = require('node:fs');
const path = require('node:path');
const SITE_ID = 'baxter-mason-property-buyers-agent';
const TAG = '<script async src="https://t.vexur.com.au/v1.js" data-site="' + SITE_ID + '"></script>';
const TRACKER = /<script\b(?=[^>]*\bsrc\s*=\s*["']https:\/\/t\.vexur\.com\.au\/v1\.js["'])[^>]*>\s*<\/script>/gi;
function injectTracking(html) {
  const existing = html.match(TRACKER) || [];
  for (const tag of existing) {
    if (!new RegExp('data-site=["\']' + SITE_ID + '["\']').test(tag)) throw new Error('Review unexpected Vexur tracking identity');
  }
  if (existing.length === 1) return html;
  if (!/<\/body\s*>/i.test(html)) throw new Error('HTML page has no closing body');
  return html.replace(TRACKER, '').replace(/<\/body\s*>/i, TAG + '\r\n</body>');
}
function injectDirectory(directory) {
  let count = 0;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) count += injectDirectory(file);
    else if (entry.isFile() && entry.name.endsWith('.html')) {
      const before = fs.readFileSync(file, 'utf8'); const after = injectTracking(before);
      if (after !== before) { fs.writeFileSync(file, after); count++; }
    }
  }
  return count;
}
if (require.main === module) console.log('Injected verified site tracking into ' + injectDirectory(path.resolve(__dirname, '../public')) + ' HTML pages');
module.exports = { injectTracking, injectDirectory, SITE_ID };
