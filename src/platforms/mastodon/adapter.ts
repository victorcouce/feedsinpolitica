import { createAdapter } from '../create-adapter';

export const mastodonAdapter = createAdapter({
  items: 'article[data-id]',
  text: '.status__content__text',
  author: (post) => {
    const name = post.querySelector('.display-name__html')?.textContent ?? '';
    const acct = post.querySelector('.display-name__account')?.textContent ?? '';
    return [name, acct.replace(/@[^@]*$/, '').replace(/^@/, '')];
  },
});
