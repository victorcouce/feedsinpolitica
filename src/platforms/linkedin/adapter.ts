import { createAdapter } from '../create-adapter';

/** Sin verificar: LinkedIn exige sesión y no se pudo inspeccionar. */
export const linkedinAdapter = createAdapter({
  items: 'div[data-urn^="urn:li:activity:"], div.feed-shared-update-v2',
  text: '.update-components-text, .feed-shared-update-v2__description, .update-components-article__title',
  placement: 'inside',
  author: (post) => [post.querySelector('.update-components-actor__title')?.textContent ?? ''],
});
