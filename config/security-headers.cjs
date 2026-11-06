// Enforce only compatible object/base controls; observe the fuller policy in the browser.
// Host-only HSTS avoids making assumptions about other subdomains. No report receiver is configured.
module.exports = [
  {
    "key": "X-Content-Type-Options",
    "value": "nosniff"
  },
  {
    "key": "Referrer-Policy",
    "value": "strict-origin-when-cross-origin"
  },
  {
    "key": "Strict-Transport-Security",
    "value": "max-age=86400"
  },
  {
    "key": "Content-Security-Policy",
    "value": "object-src 'none'; base-uri 'self'"
  },
  {
    "key": "Content-Security-Policy-Report-Only",
    "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://embed.vexur.com.au https://app.vexur.com.au https://t.vexur.com.au https://www.googletagmanager.com https://connect.facebook.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https: wss:; frame-src https:; media-src 'self' blob: https:; worker-src 'self' blob:; object-src 'none'; base-uri 'self'"
  }
];
