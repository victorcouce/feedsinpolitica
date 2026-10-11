import { ContentController, type PlatformAdapter } from './controller';
import { classify } from '../classifier/classify';
import { KEY, parseSettings } from '../../storage/settings';
import { isActive } from '../../features/sessions/session';
import type { Platform } from '../../platforms/registry';
import type { Settings, StatsResponse } from '../../types';

/** Arranque común de un content script de plataforma: ajustes, sesión, stats y limpieza. */
export async function runPlatform(
  ctx: { onInvalidated(cb: () => void): void },
  adapter: PlatformAdapter,
  platform: Platform,
): Promise<void> {
  const controller = new ContentController(adapter, classify);
  controller.onHidden = () => {
    chrome.runtime.sendMessage({ type: 'modopaz:total', n: 1 }).catch(() => {});
  };
  let expiry: ReturnType<typeof setTimeout> | null = null;

  const apply = (s: Settings) => {
    if (expiry) clearTimeout(expiry);
    expiry = null;
    if (s.platforms[platform] && isActive(s)) {
      controller.start(s.filterMode);
      controller.setMode(s.filterMode);
      if (s.session.endsAt !== null) {
        // La fecha persistida manda; el timer sólo adelanta la restauración local.
        expiry = setTimeout(() => apply(s), Math.min(s.session.endsAt - Date.now() + 100, 2 ** 31 - 1));
      }
    } else {
      controller.stop();
    }
  };

  // La insignia de la barra de Chrome refleja las ocultas de esta pestaña.
  let reported = -1;
  const report = () => {
    const n = controller.running ? controller.hiddenCount : 0;
    if (n === reported) return;
    reported = n;
    chrome.runtime.sendMessage({ type: 'modopaz:count', hidden: n }).catch(() => {});
  };
  const reportTimer = setInterval(report, 1000);

  const stored = await chrome.storage.local.get(KEY);
  apply(parseSettings(stored[KEY]));

  const onChanged = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area === 'local' && changes[KEY]) apply(parseSettings(changes[KEY].newValue));
  };
  chrome.storage.onChanged.addListener(onChanged);

  const onMessage = (msg: any, _s: unknown, reply: (r: StatsResponse) => void) => {
    if (msg?.type === 'modopaz:stats') reply({ hidden: controller.hiddenCount });
  };
  chrome.runtime.onMessage.addListener(onMessage);

  ctx.onInvalidated(() => {
    chrome.storage.onChanged.removeListener(onChanged);
    chrome.runtime.onMessage.removeListener(onMessage);
    if (expiry) clearTimeout(expiry);
    clearInterval(reportTimer);
    controller.stop();
  });
}
