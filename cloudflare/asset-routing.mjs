import securityHeaders from '../config/security-headers.cjs';
const PREVIEW_HOST = 'vexur-baxter-mason-property-buyers-agent-import.ben-03a.workers.dev';
const PRODUCTION_HOSTS = new Set(['baxtermason.com.au', 'www.baxtermason.com.au']);

export function applySiteHeaders(request, response) {
  if (response.status === 101) return response;
  const headers = new Headers(response.headers);
  const forwardedHost = (request.headers.get('x-forwarded-host') || '').trim().toLowerCase();
  if (new URL(request.url).hostname === PREVIEW_HOST && !PRODUCTION_HOSTS.has(forwardedHost)) {
    headers.set('X-Robots-Tag', 'noindex, follow');
  }
  for (const { key, value } of securityHeaders) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

// Retain asset-first resolution inside the Worker so both asset HTML and SSR receive headers.
// ASSETS.fetch applies Cloudflare's existing HTML handling and redirects without reading bodies.
export function createSiteWorker(nextWorker) {
  return {
    async fetch(request, env, ctx) {
      if (request.method === 'GET' || request.method === 'HEAD') {
        const asset = await env.ASSETS.fetch(request);
        if (asset.status !== 404) return applySiteHeaders(request, asset);
        await asset.body?.cancel();
      }
      return applySiteHeaders(request, await nextWorker.fetch(request, env, ctx));
    },
  };
}
