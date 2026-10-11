import { runPlatform } from '../src/core/content/bootstrap';
import { PLATFORMS } from '../src/platforms/registry';
import { mastodonAdapter } from '../src/platforms/mastodon/adapter';

export default defineContentScript({
  matches: [...PLATFORMS.mastodon],
  runAt: 'document_idle',
  main: (ctx) => runPlatform(ctx, mastodonAdapter, 'mastodon'),
});
