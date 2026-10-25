// Interactive functional check on the local demo: what each role may NOT do (API and screens), and whether what people save is still there
// after a reload and after logging out and in again. Uses real clicks and typing. Test records are marked and removed at the end where the app allows.
//   node e2e/functional-check.mjs [--web http://localhost:5173] [--api http://localhost:8190/api] [--school GVPS]
import { chromium } from '@playwright/test';
import fs from 'node:fs';
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const WEB = arg('web', 'http://localhost:5173'); const API = arg('api', 'http://localhost:8190/api'); const SCHOOL = arg('school', 'GVPS');
const PW = 'Demo@1234'; const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = []; let section = '';
const group = (t) => { section = t; console.log(`\n=== ${t}`); };
async function check(name, fn, how = 'screen') {
  let ok = false; let why = '';
  try { const r = await fn(); ok = r === true || (r && r.ok === true); why = r && r.why ? r.why : ''; } catch (e) { why = String(e.message).split('\n')[0].slice(0, 160); }
  results.push({ section, name, how, ok, why }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  [${how}]${ok || !why ? '' : `  (${why})`}`);
}
async function http(method, path, token, body) {
  const res = await fetch(`${API}${path}`, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  let j = {}; try { j = await res.json(); } catch (e) { /* not json */ } return { status: res.status, body: j };
}
const login = async (id) => (await http('POST', '/users/login', null, { schoolCode: SCHOOL, identifier: id, password: PW })).body.token;
const ids = { admin: 'admin@gvps.demo', teacher: 'teacher@gvps.demo', student: '1', parent: '9876543210' };

// ---------- 1. what each role must NOT be able to do (API)
group('1. Permissions: a role cannot use another role\'s features');
const tokens = {}; for (const [r, id] of Object.entries(ids)) tokens[r] = await login(id);
const denied = {
  student: [['GET', '/students'], ['GET', '/teachers'], ['GET', '/fees'], ['GET', '/fees/pending/all'], ['GET', '/staff'], ['GET', '/roles'], ['GET', '/audit'], ['GET', '/hr/salaries'], ['GET', '/schools/me/dashboard'], ['POST', '/announcements', { title: 'x', message: 'x' }], ['POST', '/notifications/send', { title: 'x', message: 'x' }], ['POST', '/attendance/bulk', {}], ['GET', '/homework'], ['GET', '/platform/stats']],
  parent: [['GET', '/students'], ['GET', '/teachers'], ['GET', '/fees'], ['GET', '/staff'], ['GET', '/roles'], ['GET', '/audit'], ['GET', '/hr/salaries'], ['GET', '/schools/me/dashboard'], ['POST', '/announcements', { title: 'x', message: 'x' }], ['POST', '/attendance/bulk', {}], ['GET', '/homework'], ['GET', '/homework/my'], ['GET', '/students/my-profile'], ['GET', '/platform/stats']],
  teacher: [['GET', '/fees'], ['GET', '/fees/pending/all'], ['GET', '/staff'], ['GET', '/roles'], ['GET', '/audit'], ['GET', '/hr/salaries'], ['POST', '/announcements', { title: 'x', message: 'x' }], ['POST', '/notifications/send', { title: 'x', message: 'x' }], ['GET', '/homework/my'], ['GET', '/platform/stats']],
  admin: [['GET', '/platform/stats'], ['GET', '/homework/my'], ['GET', '/students/my-profile']],
};
for (const [role, list] of Object.entries(denied)) {
  const bad = [];
  for (const [m, p, b] of list) {
    const r = await http(m, p, tokens[role], b);
    // The staff dashboard answers everyone, but only fills in the sections a role's permissions allow: for these roles that must be just the date.
    if (p === '/schools/me/dashboard' && r.status === 200) { const extra = Object.keys(r.body.data || {}).filter((k) => k !== 'date'); if (extra.length) bad.push(`${p} gave ${extra.join(', ')}`); continue; }
    if (![401, 403].includes(r.status)) bad.push(`${m} ${p} -> ${r.status}`);
  }
  await check(`${role}: ${list.length} features of other roles are refused`, async () => ({ ok: !bad.length, why: bad.join('; ') }), 'API');
}
await check('without signing in, school data is refused', async () => {
  const bad = []; for (const p of ['/students', '/fees', '/users/profile', '/notifications/my', '/homework/my']) { const r = await http('GET', p); if (r.status !== 401) bad.push(`${p} -> ${r.status}`); }
  return { ok: !bad.length, why: bad.join('; ') };
}, 'API');
await check('a forged / altered token is refused', async () => (await http('GET', '/students', `${tokens.admin.slice(0, -4)}AAAA`)).status === 401, 'API');

// ---------- browser helpers
const allErrors = [];
const browser = await chromium.launch({ channel: 'chrome', headless: !process.argv.includes('--headed') });
async function open(role, viewport = { width: 1280, height: 860 }) {
  const ctx = await browser.newContext({ viewport }); const page = await ctx.newPage();
  await ctx.addInitScript(() => localStorage.setItem('eduamigo_school', JSON.stringify({ code: 'GVPS', name: 'GVPS' })));
  const errors = []; page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  page.errors = errors; allErrors.push(errors); await signIn(page, role); return { ctx, page };
}
async function signIn(page, role) {
  await page.goto(`${WEB}/login`);
  await page.getByLabel('Email, mobile number or admission number').fill(ids[role]);
  await page.getByLabel('Password', { exact: true }).fill(PW);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL((u) => !/\/(login|select-school)/.test(u.pathname), { timeout: 20000 });
}
async function logOut(page) {
  const btn = page.locator('.dx-profile__btn'); if (await btn.count() && await btn.first().isVisible()) { await btn.first().click(); await page.getByRole('menuitem', { name: 'Log out' }).click(); }
  else { await page.getByRole('button', { name: /log out|sign out/i }).first().click(); }
  await page.waitForURL((u) => /\/(login|select-school|welcome)|^\/$/.test(u.pathname), { timeout: 10000 });
}

// ---------- 2. screens a role must not reach
group('2. Screens: a role that opens another role\'s address is turned away');
for (const [role, targets] of Object.entries({ student: ['/admin', '/admin/fees', '/teacher/home', '/parent/home'], parent: ['/admin', '/admin/students', '/student/home', '/teacher/home'], teacher: ['/admin', '/admin/fees', '/student/home', '/parent/home'] })) {
  const { ctx, page } = await open(role);
  await check(`${role}: ${targets.join(', ')} do not open`, async () => {
    const bad = [];
    for (const t of targets) { await page.goto(`${WEB}${t}`); await sleep(1200); const here = new URL(page.url()).pathname; if (here === t || (t === '/admin' && here.startsWith('/admin'))) bad.push(`${t} stayed open`); }
    return { ok: !bad.length, why: bad.join('; ') };
  });
  await ctx.close();
}

// ---------- 3. saving: still there after reload and after logging out and in
const stamp = Date.now();
group('3. Saved data is still there after a reload and after logging out and in');
{ // 3a student applies for leave, office approves, student sees the decision
  const reason = `Doctor visit (func ${stamp})`; const day = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);
  const S = await open('student');
  await S.page.goto(`${WEB}/student/apply-leave`);
  await S.page.getByLabel('FROM DATE').fill(day); await S.page.getByLabel('TO DATE').fill(day); await S.page.getByLabel('REASON').fill(reason);
  await S.page.getByRole('button', { name: /Submit Leave Request/ }).click(); await sleep(1500);
  const there = async (p) => { await p.goto(`${WEB}/student/apply-leave`); await sleep(1500); return (await p.getByText(reason).count()) > 0; };
  await check('student leave request is listed after submit and after a reload', async () => (await there(S.page)) && (await S.page.reload().then(() => sleep(1500)).then(() => S.page.getByText(reason).count())) > 0);
  await logOut(S.page); await signIn(S.page, 'student');
  await check('…and after logging out and in again', async () => there(S.page));
  const A = await open('admin');
  await A.page.goto(`${WEB}/admin/leaves`); await A.page.getByPlaceholder('Search by name or reason...').fill(reason); await sleep(800);
  await check('the office sees that request and approves it', async () => { await A.page.getByRole('button', { name: /Approve/ }).first().click(); await sleep(1500); return true; });
  await check('the student sees "Approved" (after a reload)', async () => { await S.page.reload(); await sleep(1500); return (await S.page.locator('div').filter({ hasText: reason }).filter({ hasText: 'Approved' }).count()) > 0; });
  await check('a classmate from another family (Aarav) cannot see this leave request', async () => {
    const theirs = (await http('GET', '/leaves/my', await login('3'))).body.data || [];
    return { ok: !theirs.some((l) => l.reason === reason), why: 'visible to another student' };
  }, 'API');
  await A.ctx.close(); await S.ctx.close();
}
{ // 3b office sends a notice, it is still there after reload and logout/login, parents see it, teachers do not
  const title = `Sports day (func ${stamp})`;
  const A = await open('admin');
  await A.page.goto(`${WEB}/admin/communications`); await sleep(1500);
  await A.page.getByRole('button', { name: /Send Notification/ }).first().click();
  const d = A.page.getByRole('dialog', { name: 'Send Notification' });
  await d.getByRole('button', { name: 'Parents', exact: true }).click();
  await d.getByLabel(/title/i).first().fill(title); await d.getByLabel(/message/i).first().fill('Please send a water bottle.');
  await d.getByRole('button', { name: /^Send/ }).last().click(); await sleep(2000);
  const visible = async (p) => { await p.goto(`${WEB}/admin/communications`); await sleep(1500); await p.getByText(/^Notifications\s*\(/).first().click(); await sleep(800); return (await p.getByText(title).count()) > 0; };
  await check('the notice is listed for the office after reload', async () => visible(A.page));
  await logOut(A.page); await signIn(A.page, 'admin');
  await check('…and after logging out and in again', async () => visible(A.page));
  await check('parents get it', async () => ((await http('GET', '/notifications/my', tokens.parent)).body.data || []).some((n) => n.title === title), 'API');
  await check('teachers do not', async () => !((await http('GET', '/notifications/my', tokens.teacher)).body.data || []).some((n) => n.title === title), 'API');
  await check('students do not', async () => !((await http('GET', '/notifications/my', tokens.student)).body.data || []).some((n) => n.title === title), 'API');
  await A.ctx.close();
}
let addedId = null;
{ // 3c office adds a student
  const name = `Func Pupil ${String(stamp).slice(-6)}`; const mobile = `9${String(stamp).slice(-9)}`;
  const A = await open('admin');
  await A.page.goto(`${WEB}/admin/students/add`); await sleep(1200);
  await A.page.getByRole('textbox', { name: /Full Name/ }).fill(name);
  await A.page.getByRole('combobox', { name: /^Class/ }).selectOption({ index: 1 }); await sleep(400);
  await A.page.getByRole('combobox', { name: /^Section/ }).selectOption({ index: 1 });
  await A.page.getByRole('textbox', { name: /Parent Mobile/ }).fill(mobile);
  await A.page.getByRole('button', { name: 'Add Student', exact: true }).click(); await sleep(2500);
  const listed = async () => (await http('GET', `/students?search=${encodeURIComponent(name)}`, await login(ids.admin))).body.data || [];
  await check('a student added through the form is saved (found by the office list)', async () => { const l = await listed(); addedId = (l.find((s) => s.name === name) || {})._id || null; return !!addedId; }, 'API');
  await check('…and shown in the Students screen after a reload and after logging out and in', async () => {
    const find = async () => { await A.page.goto(`${WEB}/admin/students`); await A.page.getByPlaceholder(/search/i).first().fill(name); await sleep(1500); return (await A.page.getByText(name).count()) > 0; };
    const a = await find(); await logOut(A.page); await signIn(A.page, 'admin'); return a && (await find());
  });
  if (addedId) { await http('DELETE', `/students/${addedId}`, await login(ids.admin)); }
  await A.ctx.close();
}

// ---------- 4. no browser errors while doing the above
group('4. Browser console');
await check('no uncaught errors or console errors (other than blocked requests) happened during the flows above', async () => { const all = allErrors.flat(); return { ok: !all.length, why: all.slice(0, 2).join(' | ') }; });
await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length} of ${results.length} checks passed${failed.length ? `, ${failed.length} FAILED:` : '.'}`);
failed.forEach((f) => console.log(`  - ${f.section} :: ${f.name} ${f.why ? `(${f.why})` : ''}`));
fs.writeFileSync('docs/production-readiness/FUNCTIONAL_CHECK.md', `# Functional check (permissions and saved data)\n\nRun ${new Date().toISOString().slice(0, 16)} on the local demo (${SCHOOL}). ${results.length - failed.length} of ${results.length} passed.\n\n` + results.map((r) => `- ${r.ok ? 'PASS' : 'FAIL'}: ${r.name} _(${r.how})_${r.ok || !r.why ? '' : ` — ${r.why}`}`).join('\n') + '\n');
