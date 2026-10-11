import { createAdapter } from '../create-adapter';

export const mastodonAdapter = createAdapter({
  items: 'article[data-id]',
  text: '.status__content__text',
});
