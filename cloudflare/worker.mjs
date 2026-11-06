import nextWorker from '../.open-next/worker.js';
import { createSiteWorker } from './asset-routing.mjs';
export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from '../.open-next/worker.js';
export default createSiteWorker(nextWorker);
