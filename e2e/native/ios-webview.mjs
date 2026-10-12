// Drives the EduAmigo iOS app in the Simulator through its WebView inspector (debug builds only).
// ios_webkit_debug_proxy forwards the Simulator's inspector to http://localhost:9222 (see README.md).
// iOS wraps every inspector command in the Target domain, which this file hides.
import { execSync } from 'node:child_process';

export const SIM = process.env.IOS_SIMULATOR || 'iPhone 16';
export const APP_ID = 'in.eduamigo.app';
const PROXY = process.env.IOS_INSPECTOR || 'http://localhost:9222';

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const sim = (args) => execSync(`xcrun simctl ${args}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
export const shot = (file) => execSync(`xcrun simctl io "${SIM}" screenshot "${file}"`, { stdio: 'ignore' });

// The page of one app process (the proxy lists it as PID:<pid>).
export async function connect(pid) {
  for (let i = 0; i < 60; i++) {
    try {
      const pages = await (await fetch(`${PROXY}/json`)).json();
      const t = pages.find((p) => p.url.startsWith('capacitor://localhost') && (!pid || p.appId === `PID:${pid}`));
      if (t) {
        const ws = new WebSocket(t.webSocketDebuggerUrl);
        await new Promise((resolve, reject) => {
          ws.onopen = resolve; ws.onerror = reject;
          setTimeout(() => reject(new Error('inspector did not answer')), 5000);
        });
        let target = null;
        let id = 0;
        const pending = new Map();
        ws.onmessage = (e) => {
          const m = JSON.parse(e.data);
          if (m.method === 'Target.targetCreated') target = m.params.targetInfo.targetId;
          if (m.method === 'Target.dispatchMessageFromTarget') {
            const inner = JSON.parse(m.params.message);
            if (inner.id && pending.has(inner.id)) { pending.get(inner.id)(inner); pending.delete(inner.id); }
          }
        };
        for (let k = 0; k < 30 && !target; k++) await sleep(100);
        if (!target) { ws.close(); throw new Error('no page target'); }
        const send = (method, params = {}) => new Promise((resolve) => {
          const mine = ++id;
          pending.set(mine, resolve);
          ws.send(JSON.stringify({ id: 100000 + mine, method: 'Target.sendMessageToTarget', params: { targetId: target, message: JSON.stringify({ id: mine, method, params }) } }));
          setTimeout(() => { if (pending.has(mine)) { pending.delete(mine); resolve({ timeout: true }); } }, 5000);
        });
        const evaluate = async (expression) => {
          const res = await send('Runtime.evaluate', { expression, returnByValue: true });
          return res.result?.wasThrown ? undefined : res.result?.result?.value;
        };
        return { ws, send, evaluate };
      }
    } catch { /* the app is still starting */ }
    await sleep(500);
  }
  throw new Error(`no EduAmigo WebView at ${PROXY} (is ios_webkit_debug_proxy running?)`);
}

export const waitFor = async (page, expr, ms = 15000) => {
  const start = Date.now();
  while (Date.now() - start < ms) { if (await page.evaluate(expr)) return true; await sleep(300); }
  return false;
};
// React reads the value through the native setter and an input event.
export const type = (page, selector, text) => page.evaluate(`(() => {
  const el = document.querySelector(${JSON.stringify(selector)}); el.focus();
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, ${JSON.stringify(text)});
  el.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
export const clickText = (page, text) => page.evaluate(`(() => {
  const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === ${JSON.stringify(text)});
  if (!b) return false; b.click(); return true; })()`);
