import { createAdapter } from '../create-adapter';

export const meneameAdapter = createAdapter({
  items: '.news-summary',
  text: 'h2, .news-content',
  placement: 'inside',
});
