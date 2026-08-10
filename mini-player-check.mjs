// Temporary verification probe: does audio actually keep playing across a
// route change, and does the mini player show up off-homepage only?
// Launches its own Chrome on a throwaway profile/port so it never touches a
// browser the user may have open on 9222.
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

const PORT = 9334;
const ORIGIN = 'http://localhost:4319/blog/';
const profile = mkdtempSync(join(tmpdir(), 'mpchk-'));

const chromeBin = process.env.CHROME_BIN
  || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser']
    .find((p) => existsSync(p));
if (!chromeBin) { console.error('no chrome binary found'); process.exit(2); }

const chrome = spawn(chromeBin, [
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  '--headless=new',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-gpu',
  // Lets play() succeed without a real user gesture; we are testing whether
  // playback SURVIVES navigation, not the autoplay policy itself.
  '--autoplay-policy=no-user-gesture-required',
  '--mute-audio',
  'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function httpJson(path) {
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}${path}`);
      if (r.ok) return await r.json();
    } catch {}
    await sleep(250);
  }
  throw new Error(`devtools endpoint ${path} unreachable`);
}

let ws, msgId = 0;
const pending = new Map();
const send = (method, params = {}, sessionId) =>
  new Promise((resolve, reject) => {
    const id = ++msgId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });

function cleanup(code) {
  try { ws?.close(); } catch {}
  try { chrome.kill('SIGKILL'); } catch {}
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
  process.exit(code);
}

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`);
};

try {
  const version = await httpJson('/json/version');
  ws = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', rej, { once: true }); });
  ws.addEventListener('message', (ev) => { const raw = ev.data;
    const m = JSON.parse(raw.toString());
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
  await send('Emulation.setDeviceMetricsOverride',
    { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);

  const evalv = async (expr) => {
    const r = await send('Runtime.evaluate',
      { expression: expr, awaitPromise: true, returnByValue: true }, sessionId);
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' :: ' + expr.slice(0, 120));
    return r.result.value;
  };

  await send('Page.navigate', { url: ORIGIN }, sessionId);
  await sleep(3500);

  // 1. Homepage must NOT show the mini player.
  const onHomeMini = await evalv(`!!document.querySelector('aside[aria-label="音乐播放器"]')`);
  check('首页不显示迷你播放器', onHomeMini === false, `found=${onHomeMini}`);

  // Exactly one <audio> in the document, and it is the context's.
  const audioCount = await evalv(`document.querySelectorAll('audio').length`);
  check('全局只有一个 <audio>', audioCount === 1, `count=${audioCount}`);

  // 2. Press play on the homepage card.
  await evalv(`(() => {
    const b = [...document.querySelectorAll('button[aria-label="播放"]')][0];
    if (!b) throw new Error('play button not found');
    b.click(); return true;
  })()`);
  await sleep(2200);

  const afterPlay = await evalv(`(() => {
    const a = document.querySelector('audio');
    return { t: a.currentTime, paused: a.paused, src: a.getAttribute('src') };
  })()`);
  check('首页点击后开始播放', afterPlay.paused === false && afterPlay.t > 0,
    `t=${afterPlay.t.toFixed(2)} paused=${afterPlay.paused}`);

  // 3. Navigate away via a real in-app link click (not location.href, which
  //    would be a full reload and would legitimately kill playback).
  await evalv(`(() => {
    const a = [...document.querySelectorAll('a[href]')]
      .find(x => new URL(x.href, location.href).pathname.replace(/\\/$/, '').endsWith('/posts'));
    if (!a) throw new Error('no /posts link');
    a.click(); return true;
  })()`);
  await sleep(2600);

  const afterNav = await evalv(`(() => {
    const a = document.querySelector('audio');
    return {
      path: location.pathname,
      t: a ? a.currentTime : null,
      paused: a ? a.paused : null,
      audios: document.querySelectorAll('audio').length,
      mini: !!document.querySelector('aside[aria-label="音乐播放器"]'),
      title: document.querySelector('aside[aria-label="音乐播放器"]')?.textContent?.slice(0, 40) ?? null,
    };
  })()`);

  check('切页后路由已变', afterNav.path.includes('/posts'), `path=${afterNav.path}`);
  check('切页后音频未暂停', afterNav.paused === false, `paused=${afterNav.paused}`);
  check('切页后进度继续前进', afterNav.t > afterPlay.t,
    `${afterPlay.t.toFixed(2)} → ${afterNav.t?.toFixed(2)}`);
  check('切页后仍只有一个 <audio>', afterNav.audios === 1, `count=${afterNav.audios}`);
  check('非首页显示迷你播放器', afterNav.mini === true, `mini=${afterNav.mini}`);

  // 4. Mini player controls drive the same element.
  const beforePause = await evalv(`document.querySelector('audio').currentTime`);
  await evalv(`(() => {
    const el = document.querySelector('aside[aria-label="音乐播放器"] button[aria-label="暂停"]');
    if (!el) throw new Error('mini pause button not found');
    el.click(); return true;
  })()`);
  await sleep(900);
  const afterPause = await evalv(`(() => {
    const a = document.querySelector('audio');
    return { paused: a.paused, t: a.currentTime };
  })()`);
  check('迷你播放器暂停按钮生效', afterPause.paused === true,
    `paused=${afterPause.paused} t=${beforePause.toFixed(2)}→${afterPause.t.toFixed(2)}`);

  // 5. Expanded controls render.
  await evalv(`(() => {
    const el = document.querySelector('aside[aria-label="音乐播放器"] button[aria-label="展开播放器"]');
    if (!el) throw new Error('expand button not found');
    el.click(); return true;
  })()`);
  await sleep(700);
  const expanded = await evalv(`(() => {
    const a = document.querySelector('aside[aria-label="音乐播放器"]');
    return {
      seek: !!a.querySelector('input[aria-label="播放进度"]'),
      prev: !!a.querySelector('button[aria-label="上一首"]'),
      mute: !!a.querySelector('button[aria-label="静音"]'),
      collapse: !!a.querySelector('button[aria-label="收起播放器"]'),
    };
  })()`);
  check('展开后进度条与控件齐全',
    expanded.seek && expanded.prev && expanded.mute && expanded.collapse,
    JSON.stringify(expanded));

  // 6. Returning to the homepage hides the mini player again and keeps state.
  await evalv(`(() => {
    const a = [...document.querySelectorAll('a[href]')]
      .find(x => { const p = new URL(x.href, location.href).pathname.replace(/\\/$/, ''); return p === '/blog' || p === ''; });
    if (!a) throw new Error('no home link');
    a.click(); return true;
  })()`);
  await sleep(2400);
  const backHome = await evalv(`(() => ({
    path: location.pathname,
    mini: !!document.querySelector('aside[aria-label="音乐播放器"]'),
    audios: document.querySelectorAll('audio').length,
    t: document.querySelector('audio')?.currentTime ?? null,
  }))()`);
  check('回首页后迷你播放器消失',
    backHome.mini === false && backHome.path.replace(/\/$/, '').endsWith('/blog'),
    `path=${backHome.path} mini=${backHome.mini}`);
  check('回首页后进度未被重置', backHome.t >= afterPause.t - 0.05,
    `${afterPause.t.toFixed(2)} → ${backHome.t?.toFixed(2)}`);

  const logs = await evalv(`(window.__errs || []).length`);

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  cleanup(failed.length ? 1 : 0);
} catch (err) {
  console.error('probe error:', err.message);
  cleanup(2);
}
