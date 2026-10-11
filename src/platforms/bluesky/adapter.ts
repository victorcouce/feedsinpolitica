import { createAdapter } from '../create-adapter';

export const blueskyAdapter = createAdapter({
  items: '[data-testid^="feedItem-by-"]',
  text: '[data-testid="postText"]',
});
