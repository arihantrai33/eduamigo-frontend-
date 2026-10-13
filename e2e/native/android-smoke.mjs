// Android smoke test: the EduAmigo debug app in the emulator against the demo backend on this computer
// (http://10.0.2.2:8000 from the emulator, see README.md). It clears the app's data first.
//   node e2e/native/android-smoke.mjs [screenshots dir]
// Talks to the app's WebView through its DevTools socket (debug builds only).
import { execSync } from 'node:child_process';
import fs from 'node:fs';

const ADB = process.env.ANDROID_HOME ? `${process.env.ANDROID_HOME}/platform-tools/adb` : 'adb';
const APP_ID = 'in.eduamigo.app';
const adb = (args) => execSync(`"${ADB}" ${args}`, { encoding: 'utf8' }).trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SHOTS = process.argv[2] || 'e2e/native/screenshots';
fs.mkdirSync(SHOTS, { recursive: true });

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
};

async function connect() {
  for (let i = 0; i < 40; i++) {
    try {
      const pid = adb(`shell pidof ${APP_ID}`);
      adb('forward --remove-all');
      adb(`forward tcp:9229 localabstract:webview_devtools_remote_${pid}`);
      const t = (await (await fetch('http://localhost:9229/json')).json()).find((x) => x.type === 'page');
      if (t) {
        const ws = new WebSocket(t.webSocketDebuggerUrl);
        await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
        let id = 0;
        const pending = new Map();
        ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
        const send = (method, params = {}) => new Promise((resolve) => { const mine = ++id; pending.set(mine, resolve); ws.send(JSON.stringify({ id: mine, method, params })); });
        const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;
        return { ws, send, evaluate };
      }
    } catch { /* the app is still starting */ }
    await sleep(500);
  }
  throw new Error('could not reach the app WebView (is the emulator running with a debug build?)');
}
const waitFor = async (page, expr, ms = 15000) => {
  const start = Date.now();
  while (Date.now() - start < ms) { if (await page.evaluate(expr)) return true; await sleep(300); }
  return false;
};
// Types like a person: focus the field, then insert text through the input pipeline.
const type = async (page, selector, text) => { await page.evaluate(`document.querySelector(${JSON.stringify(selector)}).focus()`); await page.send('Input.insertText', { text }); };
const clickText = (page, text) => page.evaluate(`(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === ${JSON.stringify(text)}); if (!b) return false; b.click(); return true; })()`);
const shot = (name) => fs.writeFileSync(`${SHOTS}/${name}.png`, execSync(`"${ADB}" exec-out screencap -p`));
const restart = () => { adb(`shell am force-stop ${APP_ID}`); adb(`shell am start -n ${APP_ID}/.MainActivity`); };

adb(`shell pm clear ${APP_ID}`);
adb(`shell am start -n ${APP_ID}/.MainActivity`);
let page = await connect();
check('app opens on the school search', await waitFor(page, `location.pathname === '/select-school' && !!document.getElementById('school-query')`), await page.evaluate('location.pathname'));

await type(page, '#school-query', 'GVPS');
await clickText(page, 'Continue');
check('the school is found through the API on this computer', await waitFor(page, `!![...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Yes, this is my school')`));
await clickText(page, 'Yes, this is my school');
check('sign-in screen', await waitFor(page, `location.pathname === '/login'`));
await waitFor(page, `!![...document.querySelectorAll('[role=tab]')].find((t) => t.textContent.trim() === 'Parent')`);
await page.evaluate(`[...document.querySelectorAll('[role=tab]')].find((t) => t.textContent.trim() === 'Parent').click()`);
await sleep(300);
await type(page, '#login-id', '9876543210');
await type(page, '#login-password', 'Demo@1234');
await clickText(page, 'Log in as Parent');
check('parent signs in and lands on the parent home', await waitFor(page, `location.pathname === '/parent/home'`, 20000), await page.evaluate('location.pathname'));
await waitFor(page, `document.body.innerText.includes('Kabir')`, 10000);
shot('android-parent-home');

const store = JSON.parse(await page.evaluate(`JSON.stringify({ plain: Object.keys(localStorage), token: !!localStorage.getItem('token') })`));
check('the app has a session', store.token);
check('the session is not in plain WebView storage (it is in the Android Keystore)', !store.plain.includes('token') && !store.plain.includes('eduamigo_user'), `plain keys: ${store.plain.join(', ')}`);
check('tab bar on the phone', await page.evaluate(`!!document.querySelector('.ea-bottom-nav') && getComputedStyle(document.querySelector('.ea-bottom-nav')).display !== 'none'`));

await page.evaluate(`[...document.querySelectorAll('.ea-bottom-nav button')].find((b) => b.textContent.includes('Fees')).click()`);
check('Fees tab opens the fee screen', await waitFor(page, `location.pathname === '/parent/fee'`));
await waitFor(page, `document.body.innerText.includes('Fee Overview')`, 10000);
shot('android-parent-fee');
adb('shell input keyevent KEYCODE_BACK');
check('Android back button goes back', await waitFor(page, `location.pathname === '/parent/home'`));

// Chat with the real keyboard: tap the message box like a person.
await waitFor(page, `!![...document.querySelectorAll('.ea-bottom-nav button')].find((b) => b.textContent.includes('Teachers'))`);
await page.evaluate(`[...document.querySelectorAll('.ea-bottom-nav button')].find((b) => b.textContent.includes('Teachers')).click()`);
await waitFor(page, `location.pathname === '/parent/chat' && !!document.querySelector('[role=button]')`, 10000);
await sleep(500);
await page.evaluate(`document.querySelector('[role=button]').click()`);
await waitFor(page, `!!document.querySelector('[aria-label^="Message to"]')`, 10000);
await sleep(800);
const before = await page.evaluate('innerHeight');
// Where the message box is on the screen: its place in the page, scaled to screen pixels, plus where the WebView
// starts (below the status bar). The WebView's bounds come from the accessibility tree, which always lists the
// WebView itself (the fields inside it are listed only sometimes).
const box = JSON.parse(await page.evaluate(`JSON.stringify((() => { const b = document.querySelector('[aria-label^="Message to"]').getBoundingClientRect();
  return { x: b.left + b.width / 2, y: b.top + b.height / 2, dpr: devicePixelRatio }; })())`));
adb('shell uiautomator dump /sdcard/eduamigo-ui.xml');
const ui = adb('exec-out cat /sdcard/eduamigo-ui.xml');
const web = ui.match(/class="android\.webkit\.WebView"[^>]*?bounds="\[(\d+),(\d+)\]/);
const webLeft = web ? Number(web[1]) : 0;
const webTop = web ? Number(web[2]) : 0;
adb(`shell input tap ${Math.round(webLeft + box.x * box.dpr)} ${Math.round(webTop + box.y * box.dpr)}`);
await sleep(2000);
const kb = JSON.parse(await page.evaluate(`JSON.stringify({ focused: document.activeElement?.getAttribute('aria-label') || '', screen: innerHeight,
  box: Math.round(document.querySelector('[aria-label^="Message to"]').getBoundingClientRect().bottom),
  back: Math.round(document.querySelector('[aria-label="Back to contacts"]').getBoundingClientRect().top) })`));
check('keyboard open: the message box sits above it and the chat header stays in view', kb.focused.startsWith('Message to') && kb.screen < before && kb.box <= kb.screen && kb.back >= 0, JSON.stringify(kb));
shot('android-chat-keyboard');
adb('shell input keyevent KEYCODE_BACK');

// Close and reopen: the session comes back from the Keystore.
page.ws.close();
restart();
await sleep(1500);
page = await connect();
check('after the app is closed and reopened the parent is still signed in', await waitFor(page, `location.pathname.startsWith('/parent')`, 20000), await page.evaluate('location.pathname'));

// A school link opens the app on that school.
page.ws.close();
adb(`shell am start -a android.intent.action.VIEW -d "eduamigo://s/LFS" ${APP_ID}`);
await sleep(1500);
page = await connect();
const linked = await waitFor(page, `(JSON.parse(localStorage.getItem('eduamigo_school') || '{}').code || '') === 'LFS'`, 10000);
check('eduamigo://s/LFS opens the app on that school', linked, await page.evaluate(`location.pathname + ' (school ' + (JSON.parse(localStorage.getItem('eduamigo_school') || '{}').code || 'none') + ')'`));

// Sign out from the profile screen clears the secure session.
await page.evaluate(`location.assign('/parent/profile')`);
await sleep(1500);
page.ws.close();
page = await connect();
await waitFor(page, `[...document.querySelectorAll('div,button')].some((x) => /^Log ?out$/i.test(x.textContent.trim()))`, 10000);
await page.evaluate(`[...document.querySelectorAll('div,button')].reverse().find((x) => /^Log ?out$/i.test(x.textContent.trim())).click()`);
await sleep(800);
await page.evaluate(`(() => { const b = [...document.querySelectorAll('button')].find((x) => /^(Log ?out|Yes|Sign out)$/i.test(x.textContent.trim())); if (b) b.click(); })()`);
check('sign out returns to sign-in', await waitFor(page, `location.pathname === '/login' || location.pathname === '/select-school'`, 10000), await page.evaluate('location.pathname'));
page.ws.close();
restart();
await sleep(1500);
page = await connect();
await sleep(1500);
check('after sign-out and reopening, nobody is signed in', !(await page.evaluate(`location.pathname.startsWith('/parent') || !!localStorage.getItem('token')`)), await page.evaluate('location.pathname'));
page.ws.close();

fs.writeFileSync(`${SHOTS}/android-results.json`, JSON.stringify(results, null, 1));
const passed = results.filter((r) => r.ok).length;
console.log(`\n${passed}/${results.length} passed`);
process.exit(passed === results.length ? 0 : 1);
