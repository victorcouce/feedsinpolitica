import { defineConfig } from 'wxt';
import { ALL_MATCHES } from './src/platforms/registry';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'FeedSinPolítica',
    description: 'Oculta publicaciones políticas en redes sociales, de forma local y reversible. Menos ruido. Más calma.',
    permissions: ['storage', 'alarms'],
    host_permissions: ALL_MATCHES,
  },
});
