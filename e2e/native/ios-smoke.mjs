// iOS smoke test: the EduAmigo app in the Simulator against the demo backend on this computer (see README.md).
//   IOS_APP=<path to App.app> node e2e/native/ios-smoke.mjs [screenshots dir]
// It deletes and reinstalls the app, so it starts from a clean install.
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { SIM, APP_ID, sleep, sim, shot, connect, waitFor, type, clickText } from './ios-webview.mjs';

const APP = process.env.IOS_APP;
if (!APP || !fs.existsSync(APP)) { console.error('Set IOS_APP to the built App.app (see README.md).'); process.exit(2); }
const SHOTS = process.argv[2] || 'e2e/native/screenshots';
fs.mkdirSync(SHOTS, { recursive: true });

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
};
const launch = () => sim(`launch --terminate-running-process "${SIM}" ${APP_ID}`).split(': ')[1].trim();
const terminate = () => { try { sim(`terminate "${SIM}" ${APP_ID}`); } catch { /* not running */ } };
const reinstall = () => { terminate(); try { sim(`uninstall "${SIM}" ${APP_ID}`); } catch { /* not installed */ } sim(`install "${SIM}" "${APP}"`); };
const open = async () => { const pid = launch(); return connect(pid); };
const blur = (page) => page.evaluate('document.activeElement && document.activeElement.blur()');
const hasButton = (text) => `!![...document.querySelectorAll('button')].find((b) => b.textContent.trim() === ${JSON.stringify(text)})`;
const parentTab = `[...document.querySelectorAll('[role=tab]')].find((t) => t.textContent.trim() === 'Parent')`;

async function chooseSchool(page) {
  await type(page, '#school-query', 'GVPS');
  await clickText(page, 'Continue');
  const found = await waitFor(page, hasButton('Yes, this is my school'));
  await clickText(page, 'Yes, this is my school');
  return found;
}
async function signInParent(page) {
  await waitFor(page, `!!${parentTab}`);
  await page.evaluate(`${parentTab}.click()`);
  await waitFor(page, hasButton('Log in as Parent'));
  await type(page, '#login-id', '9876543210');
  await type(page, '#login-password', 'Demo@1234');
  await blur(page);
  await clickText(page, 'Log in as Parent');
  return waitFor(page, `location.pathname === '/parent/home'`, 20000);
}
const statusBarStyle = async (page) => {
  await page.evaluate(`window.__bar = null; Capacitor.Plugins.StatusBar.getInfo().then((i) => { window.__bar = i.style; })`);
  await sleep(400);
  return page.evaluate('window.__bar');
};

reinstall();
let page = await open();
check('app opens on the school search', await waitFor(page, `!!document.getElementById('school-query')`), await page.evaluate('location.pathname'));
await blur(page);
await sleep(600);
const insets = JSON.parse(await page.evaluate(`JSON.stringify((() => {
  const p = document.createElement('div');
  p.style.cssText = 'position:fixed;top:0;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)';
  document.body.appendChild(p); const cs = getComputedStyle(p); const r = { top: cs.paddingTop, bottom: cs.paddingBottom }; p.remove(); return r; })())`));
check('the screen reports its safe area (status bar, home indicator)', insets.top !== '0px', JSON.stringify(insets));
const stageTop = await page.evaluate(`Math.round(document.querySelector('.ea-solo__stage').getBoundingClientRect().top)`);
check('the page starts below the status bar', stageTop > 0, `stage top ${stageTop}px`);
shot(`${SHOTS}/ios-select-school.png`);
await type(page, '#school-query', 'GV');
await sleep(800);
const scale = await page.evaluate('visualViewport.scale');
check('tapping a text field does not zoom the page', scale === 1, `scale ${scale}`);
await blur(page);

check('the school is found through the API on this computer', await chooseSchool(page));
check('sign-in screen', await waitFor(page, `location.pathname === '/login'`));
await waitFor(page, `!!${parentTab}`);
const idField = JSON.parse(await page.evaluate(`JSON.stringify((() => { const el = document.getElementById('login-id');
  return { autocapitalize: el.getAttribute('autocapitalize'), autocorrect: el.getAttribute('autocorrect') }; })())`));
check('the login ID field does not capitalise or autocorrect (emails, admission numbers)', idField.autocapitalize === 'none' && idField.autocorrect === 'off', JSON.stringify(idField));
await sleep(600);
const light = await statusBarStyle(page);
check('status bar text is dark on the light theme', light === 'LIGHT', `style ${light}`);
await page.evaluate(`document.querySelector('[aria-label="Switch to dark mode"]').click()`);
await sleep(800);
const dark = await statusBarStyle(page);
const strip = await page.evaluate(`getComputedStyle(document.querySelector('.ea-solo')).backgroundColor`);
check('status bar text is light on the dark theme, over a dark strip', dark === 'DARK' && strip !== 'rgb(244, 246, 251)', `style ${dark}, strip ${strip}`);
shot(`${SHOTS}/ios-sign-in-dark.png`);
await page.evaluate(`document.querySelector('[aria-label="Switch to light mode"]').click()`);
await sleep(500);

check('parent signs in and lands on the parent home', await signInParent(page), await page.evaluate('location.pathname'));
await waitFor(page, `document.body.innerText.includes('Kabir')`, 10000);
await sleep(800);
shot(`${SHOTS}/ios-parent-home.png`);
const store = JSON.parse(await page.evaluate(`JSON.stringify({ plain: Object.keys(localStorage), token: !!localStorage.getItem('token') })`));
check('the app has a session', store.token);
check('the session is not in plain WebView storage (it is in the iOS Keychain)', !store.plain.includes('token') && !store.plain.includes('eduamigo_user'), `plain keys: ${store.plain.join(', ')}`);
const nav = JSON.parse(await page.evaluate(`JSON.stringify((() => { const n = document.querySelector('.ea-bottom-nav'); if (!n) return null;
  const r = n.getBoundingClientRect(); return { display: getComputedStyle(n).display, bottom: Math.round(r.bottom), height: Math.round(r.height), screen: innerHeight }; })())`));
check('tab bar at the bottom, clear of the home indicator', nav && nav.display !== 'none' && nav.bottom === nav.screen, JSON.stringify(nav));

await page.evaluate(`[...document.querySelectorAll('.ea-bottom-nav button')].find((b) => b.textContent.includes('Fees')).click()`);
check('Fees tab opens the fee screen', await waitFor(page, `location.pathname === '/parent/fee'`));
await waitFor(page, `document.body.innerText.includes('Fee Overview')`, 10000);
shot(`${SHOTS}/ios-parent-fee.png`);

// Chat with the keyboard up: the screen shrinks above the keyboard, the header stays in view.
await page.evaluate(`[...document.querySelectorAll('.ea-bottom-nav button')].find((b) => b.textContent.includes('Teachers')).click()`);
await waitFor(page, `location.pathname === '/parent/chat' && !!document.querySelector('[role=button]')`, 10000);
await sleep(500);
await page.evaluate(`document.querySelector('[role=button]').click()`);
await waitFor(page, `!!document.querySelector('[aria-label^="Message to"]')`, 10000);
await sleep(500);
await page.evaluate(`document.querySelector('[aria-label^="Message to"]').focus()`);
await sleep(1800);
const kb = JSON.parse(await page.evaluate(`JSON.stringify({ screen: innerHeight, scrolled: scrollY,
  box: Math.round(document.querySelector('[aria-label^="Message to"]').getBoundingClientRect().bottom),
  back: Math.round(document.querySelector('[aria-label="Back to contacts"]').getBoundingClientRect().top) })`));
check('keyboard open: the message box sits above it and the chat header stays in view', kb.screen < 700 && kb.scrolled === 0 && kb.box <= kb.screen && kb.back >= 0, JSON.stringify(kb));
shot(`${SHOTS}/ios-chat-keyboard.png`);
await blur(page);

// Close and reopen: the session comes back from the Keychain.
page.ws.close();
terminate();
page = await open();
check('after the app is closed and reopened the parent is still signed in', await waitFor(page, `location.pathname.startsWith('/parent')`, 20000), await page.evaluate('location.pathname'));

// School links: iOS asks "Open in EduAmigo?" before opening a custom-scheme link, which a script cannot answer.
// The link handling itself is shared with Android (android-smoke.mjs). Here: the scheme belongs to this app.
const bundle = sim(`get_app_container "${SIM}" ${APP_ID} app`);
const schemes = execSync(`plutil -extract CFBundleURLTypes json -o - "${bundle}/Info.plist"`, { encoding: 'utf8' });
check('eduamigo:// links are registered to the app', schemes.includes('"eduamigo"'), schemes.trim());

// Delete the app and install it again without signing out: iOS keeps Keychain items, the app must not reuse them.
page.ws.close();
reinstall();
page = await open();
await sleep(2500);
const after = await page.evaluate(`location.pathname + ' token:' + !!localStorage.getItem('token')`);
check('after the app is deleted and installed again, nobody is signed in', !after.includes('token:true') && !after.startsWith('/parent'), after);

// Sign out from the profile screen clears the secure session.
await waitFor(page, `!!document.getElementById('school-query')`);
await chooseSchool(page);
check('signs in again', await signInParent(page), await page.evaluate('location.pathname'));
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
terminate();
page = await open();
await sleep(2500);
check('after sign-out and reopening, nobody is signed in', !(await page.evaluate(`location.pathname.startsWith('/parent') || !!localStorage.getItem('token')`)), await page.evaluate('location.pathname'));
page.ws.close();

fs.writeFileSync(`${SHOTS}/ios-results.json`, JSON.stringify(results, null, 1));
const passed = results.filter((r) => r.ok).length;
console.log(`\n${passed}/${results.length} passed`);
process.exit(passed === results.length ? 0 : 1);
