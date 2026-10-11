import { runPlatform } from '../src/core/content/bootstrap';
import { PLATFORMS } from '../src/platforms/registry';
import { redditAdapter } from '../src/platforms/reddit/adapter';

export default defineContentScript({
  matches: [...PLATFORMS.reddit],
  runAt: 'document_idle',
  main: (ctx) => runPlatform(ctx, redditAdapter, 'reddit'),
});
