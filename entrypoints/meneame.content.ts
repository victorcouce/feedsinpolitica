import { runPlatform } from '../src/core/content/bootstrap';
import { PLATFORMS } from '../src/platforms/registry';
import { meneameAdapter } from '../src/platforms/meneame/adapter';

export default defineContentScript({
  matches: [...PLATFORMS.meneame],
  runAt: 'document_idle',
  main: (ctx) => runPlatform(ctx, meneameAdapter, 'meneame'),
});
