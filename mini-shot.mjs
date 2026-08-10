// Screenshots the mini player on a post detail page at desktop and mobile
// widths, and reports what element sits directly under its corner — a fixed
// box in the bottom-right can silently cover a TOC toggle or a footer link.
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PORT = 9335;
const BASE = 'http://localhost:4319/blog';
const profile = mkdtempSync(join(tmpdir(), 'mshot-'));
const chromeBin = ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser']
  .find((p) => existsSync(p));

const chrome = spawn(chromeBin, [
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  '--headless=new', '--no-first-run', '--no-default-browser-check',
  '--disable-gpu', '--autoplay-policy=no-user-gesture-required', '--mute-audio',
  'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws, msgId = 0;
const pending = new Map();
const send = (method, params = {}, sessionId) =>
  new Promise((resolve, reject) => {
    const id = ++msgId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
const done = (c) => { try { ws?.close(); } catch {} try { chrome.kill('SIGKILL'); } catch {}
  try { rmSync(profile, { recursive: true, force: true }); } catch {} process.exit(c); };

try {
  let version;
  for (let i = 0; i < 40; i++) {
    try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) { version = await r.json(); break; } } catch {}
    await sleep(250);
  }
  ws = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.addEventListener('open', res, { once: true });
    ws.addEventListener('error', rej, { once: true });
  });
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const { resolve, reject } = pending.get(m.id);
      pending.delete(m.id);
      m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
    }
  });

  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  await send('Page.enable', {}, sessionId);
  await send('Runtime.enable', {}, sessionId);

  const evalv = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }, sessionId);
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
    return r.result.value;
  };

  for (const [label, w, h] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
    await send('Emulation.setDeviceMetricsOverride',
      { width: w, height: h, deviceScaleFactor: 1, mobile: label === 'mobile' }, sessionId);
    await send('Page.navigate', { url: `${BASE}/posts` }, sessionId);
    await sleep(3000);

    // Open the first post so we land on a page with a TOC and long content.
    await evalv(`(() => {
      const a = [...document.querySelectorAll('a[href]')]
        .find(x => /\\/posts\\/.+/.test(new URL(x.href, location.href).pathname));
      if (a) a.click(); return !!a; })()`);
    await sleep(3000);

    const box = await evalv(`(() => {
      const a = document.querySelector('aside[aria-label="音乐播放器"]');
      if (!a) return { missing: true, path: location.pathname };
      const r = a.getBoundingClientRect();
      // What is on top at the player's centre, and just outside its top-left?
      const inside = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      const near = document.elementFromPoint(Math.max(0, r.left - 12), r.top + r.height / 2);
      const cs = getComputedStyle(a);
      return {
        path: location.pathname,
        rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
        viewport: { w: innerWidth, h: innerHeight },
        overflowsRight: r.right > innerWidth + 0.5,
        overflowsBottom: r.bottom > innerHeight + 0.5,
        zIndex: cs.zIndex,
        topmostInside: inside ? inside.closest('aside[aria-label="音乐播放器"]') ? 'mini-player' : (inside.tagName + '.' + inside.className).slice(0, 60) : null,
        leftNeighbour: near ? (near.tagName + '.' + String(near.className)).slice(0, 60) : null,
      };
    })()`);
    console.log(label, JSON.stringify(box, null, 2));

    const shot = await send('Page.captureScreenshot', { format: 'png' }, sessionId);
    writeFileSync(`/tmp/mini-${label}.png`, Buffer.from(shot.data, 'base64'));
  }
  done(0);
} catch (e) { console.error('shot error:', e.message); done(2); }
