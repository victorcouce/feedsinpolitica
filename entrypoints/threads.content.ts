import { runPlatform } from '../src/core/content/bootstrap';
import { PLATFORMS } from '../src/platforms/registry';
import { threadsAdapter } from '../src/platforms/threads/adapter';

export default defineContentScript({
  matches: [...PLATFORMS.threads],
  runAt: 'document_idle',
  main: (ctx) => runPlatform(ctx, threadsAdapter, 'threads'),
});
