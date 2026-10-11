import { runPlatform } from '../src/core/content/bootstrap';
import { PLATFORMS } from '../src/platforms/registry';
import { xAdapter } from '../src/platforms/x/adapter';

export default defineContentScript({
  matches: [...PLATFORMS.x],
  runAt: 'document_idle',
  main: (ctx) => runPlatform(ctx, xAdapter, 'x'),
});
