import { runPlatform } from '../src/core/content/bootstrap';
import { PLATFORMS } from '../src/platforms/registry';
import { blueskyAdapter } from '../src/platforms/bluesky/adapter';

export default defineContentScript({
  matches: [...PLATFORMS.bluesky],
  runAt: 'document_idle',
  main: (ctx) => runPlatform(ctx, blueskyAdapter, 'bluesky'),
});
