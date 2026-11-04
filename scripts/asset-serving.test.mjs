import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createSiteWorker, applySiteHeaders } from '../cloudflare/asset-routing.mjs';
const { injectTracking, SITE_ID } = createRequire(import.meta.url)('../scripts/inject-site-tracking.cjs');
const preview = 'https://vexur-baxter-mason-property-buyers-agent-import.ben-03a.workers.dev';
const htmlResponse = () => new Response('<h1>Static</h1>', {headers:{'Content-Type':'text/html','Cache-Control':'public, max-age=0'}});
test('static HTML carries exactly one verified tracker, even after repeated builds', () => {
 const html = '<html><body><main>Content</main></body></html>';
 const once = injectTracking(html);
 assert.equal(injectTracking(once), once);
 assert.equal((once.match(/https:\/\/t.vexur.com.au\/v1.js/g)||[]).length,1);
 assert.ok(once.includes('data-site="'+SITE_ID+'"'));
 assert.equal((injectTracking(once.replace('</body>', once.match(/<script.*?<\/script>/)[0]+'</body>')).match(/https:\/\/t.vexur.com.au\/v1.js/g)||[]).length,1);
 assert.throws(()=>injectTracking('<body><script src="https://t.vexur.com.au/v1.js" data-site="other"></script></body>'),/identity/);
});
test('static assets are served without entering Next; direct preview gets noindex', async () => {
 const worker=createSiteWorker({fetch(){assert.fail('Static asset entered SSR');}});
 const request=new Request(preview+'/contact');
 const response=await worker.fetch(request,{ASSETS:{fetch:async()=>htmlResponse()}},{});
 assert.equal(await response.text(),'<h1>Static</h1>');
 assert.equal(response.headers.get('X-Robots-Tag'),'noindex, follow');
 assert.equal(response.headers.get('Cache-Control'),'public, max-age=0');
 assert.equal(response.headers.get('X-Content-Type-Options'),'nosniff');
});
test('production proxy and direct production remain indexable while unrelated forwarded hosts do not', () => {
 for(const host of['www.baxtermason.com.au','baxtermason.com.au']) {
   assert.equal(applySiteHeaders(new Request(preview,{headers:{'x-forwarded-host':host}}),htmlResponse()).headers.get('X-Robots-Tag'),null);
   assert.equal(applySiteHeaders(new Request('https://'+host),htmlResponse()).headers.get('X-Robots-Tag'),null);
 }
 assert.match(applySiteHeaders(new Request(preview,{headers:{'x-forwarded-host':'unrelated.example'}}),htmlResponse()).headers.get('X-Robots-Tag'),/noindex/);
});
test('missing assets and POST reach the existing SSR handler with request and context intact', async () => {
 let calls=0,assetCalls=0; const ctx={test:true};
 const worker=createSiteWorker({async fetch(request,env,received){calls++;assert.equal(received,ctx);return new Response(request.method==='POST'?await request.text():'SSR',{headers:{'X-Robots-Tag':'noindex, follow'}});}});
 const env={ASSETS:{async fetch(){assetCalls++;return new Response('Missing',{status:404});}}};
 assert.equal(await (await worker.fetch(new Request('https://www.baxtermason.com.au/thank-you'),env,ctx)).text(),'SSR');
 assert.equal(await (await worker.fetch(new Request('https://www.baxtermason.com.au/api/example',{method:'POST',body:'stub only'}),env,ctx)).text(),'stub only');
 assert.equal(calls,2);assert.equal(assetCalls,1);
});
test('redirects, HEAD and intentional route noindex remain intact', () => {
 const response=applySiteHeaders(new Request(preview+'/old',{method:'HEAD'}),new Response(null,{status:301,headers:{Location:'/current'}}));
 assert.equal(response.status,301);assert.equal(response.headers.get('Location'),'/current');assert.equal(response.body,null);
 const intentional=applySiteHeaders(new Request('https://www.baxtermason.com.au/private'),new Response('Private',{headers:{'X-Robots-Tag':'noindex'}}));
 assert.equal(intentional.headers.get('X-Robots-Tag'),'noindex');
});
