import { runPlatform } from '../src/core/content/bootstrap';
import { PLATFORMS } from '../src/platforms/registry';
import { youtubeAdapter } from '../src/platforms/youtube/adapter';

export default defineContentScript({
  matches: [...PLATFORMS.youtube],
  runAt: 'document_idle',
  main: (ctx) => runPlatform(ctx, youtubeAdapter, 'youtube'),
});
