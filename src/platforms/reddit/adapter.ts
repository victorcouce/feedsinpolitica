import { createAdapter } from '../create-adapter';

/** Nuevo Reddit (`shreddit-post`) y old.reddit (`div.thing.link`). Sin verificar contra la web real. */
export const redditAdapter = createAdapter({
  items: 'shreddit-post, div.thing.link',
  text: '[slot="title"], [slot="text-body"], a.title, .usertext-body',
  author: (post) => [post.getAttribute('author') ?? post.getAttribute('data-author') ?? ''],
  extra: (post) => [post.getAttribute('post-title') ?? ''],
});
