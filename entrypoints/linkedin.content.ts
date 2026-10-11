import { runPlatform } from '../src/core/content/bootstrap';
import { PLATFORMS } from '../src/platforms/registry';
import { linkedinAdapter } from '../src/platforms/linkedin/adapter';

export default defineContentScript({
  matches: [...PLATFORMS.linkedin],
  runAt: 'document_idle',
  main: (ctx) => runPlatform(ctx, linkedinAdapter, 'linkedin'),
});
