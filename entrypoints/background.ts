import { ALARM, KEY, TOTAL_KEY, getSettings, getTotal, saveSettings } from '../src/storage/settings';
import { expire, isActive } from '../src/features/sessions/session';

const BUBBLE =
  'M20 8H44C51.7 8 58 14.3 58 22V34C58 41.7 51.7 48 44 48H28L18.6 55.5C17.3 56.5 15.5 55.6 15.5 54V47.2C9.9 45.3 6 40.1 6 34V22C6 14.3 12.3 8 20 8Z';

async function checkExpiry() {
  const s = await getSettings();
  const next = expire(s);
  if (next !== s) await saveSettings(next);
  await syncIcon();
}

/** Relleno = filtrando; contorno = en pausa. */
function drawIcon(size: number, on: boolean): ImageData {
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext('2d')!;
  ctx.scale(size / 64, size / 64);
  const path = new Path2D(BUBBLE);
  if (on) {
    ctx.fillStyle = '#5FA572';
    ctx.fill(path);
    ctx.fillStyle = '#161917';
  } else {
    ctx.strokeStyle = ctx.fillStyle = '#80868B';
    ctx.lineWidth = 5;
    ctx.stroke(path);
  }
  ctx.beginPath();
  ctx.roundRect(19, 24.5, 26, 7, 3.5);
  ctx.fill();
  return ctx.getImageData(0, 0, size, size);
}

async function syncIcon() {
  const on = isActive(await getSettings());
  await chrome.action.setIcon({ imageData: { 16: drawIcon(16, on), 32: drawIcon(32, on) } });
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
