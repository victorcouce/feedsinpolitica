import { ALARM, KEY, TOTAL_KEY, getSettings, getTotal, saveSettings } from '../src/storage/settings';
import { expire, isActive } from '../src/features/sessions/session';

async function checkExpiry() {
  const s = await getSettings();
  const next = expire(s);
  if (next !== s) await saveSettings(next);
  await syncIcon();
}

/** Icono de la app; en gris y atenuado cuando está en pausa. */
async function drawIcon(size: number, on: boolean): Promise<ImageData> {
  const res = await fetch(chrome.runtime.getURL(`/icon/${size}.png`));
  const bitmap = await createImageBitmap(await res.blob());
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext('2d')!;
  if (!on) {
    ctx.filter = 'grayscale(1)';
    ctx.globalAlpha = 0.55;
  }
  ctx.drawImage(bitmap, 0, 0, size, size);
  return ctx.getImageData(0, 0, size, size);
}

async function syncIcon() {
  const on = isActive(await getSettings());
  await chrome.action.setIcon({ imageData: { 16: await drawIcon(16, on), 32: await drawIcon(32, on) } });
  await chrome.action.setBadgeBackgroundColor({ color: '#2F6B3E' });
  if (chrome.action.setBadgeTextColor) await chrome.action.setBadgeTextColor({ color: '#FFFFFF' });
  if (!on) await chrome.action.setBadgeText({ text: '' });
}

// Las sumas se encadenan para que dos mensajes simultáneos no se pisen.
let totalQueue: Promise<unknown> = Promise.resolve();
function addToTotal(n: number) {
  totalQueue = totalQueue.then(async () => chrome.storage.local.set({ [TOTAL_KEY]: (await getTotal()) + n }));
}

export default defineBackground(() => {
  chrome.runtime.onInstalled.addListener(checkExpiry);
  chrome.runtime.onStartup.addListener(checkExpiry);
  chrome.alarms.onAlarm.addListener((a) => {
    if (a.name === ALARM) checkExpiry();
  });
  chrome.storage.onChanged.addListener((c, area) => {
    if (area === 'local' && c[KEY]) {
      syncIcon();
    }
  });
  chrome.runtime.onMessage.addListener((msg, sender) => {
    if (msg?.type === 'modopaz:total') {
      addToTotal(Math.max(0, Math.floor(Number(msg.n) || 0)));
      return;
    }
    if (msg?.type !== 'modopaz:count' || sender.tab?.id === undefined) return;
    const n = Number(msg.hidden) || 0;
    chrome.action.setBadgeText({ tabId: sender.tab.id, text: n > 0 ? (n > 99 ? '99+' : String(n)) : '' });
  });
  syncIcon();
});
