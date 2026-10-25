// A live walk through EduAmigo as real people, in four visible Chrome windows at once (school office, teacher, student, parent):
// something is done in one window, and the other windows are looked at to see whether the right people got it and the wrong people did not.
//
//   node e2e/live-check.mjs [--web http://localhost:5173] [--api http://localhost:8190/api] [--school GVPS] [--pace 600]
//
// It changes the demo it points at (notices, homework, attendance, a fee payment, messages, a profile photo, a bus trip), so use a demo,
// never a real school. Where a step is done through the API instead of the screen the report says so. Writes a report next to this file's docs.
import { chromium } from '@playwright/test';
import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : d; };
const WEB = arg('web', 'http://localhost:5173');
const API = arg('api', 'http://localhost:8190/api');
const SCHOOL = arg('school', 'GVPS');
const PACE = Number(arg('pace', 600));
const PASSWORD = 'Demo@1234';
const STAMP = new Date().toISOString().slice(11, 19).replace(/:/g, '');
const results = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- API helpers (used to find the people, to check what the server holds, and for the few steps with no simple screen) ----------
async function http(method, url, token, body) {
  const res = await fetch(`${API}${url}`, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}
const login = async (identifier) => (await http('POST', '/users/login', null, { schoolCode: SCHOOL, identifier, password: PASSWORD })).body.token;

function png() {
  const w = 40; const h = 40;
  const raw = Buffer.concat(Array.from({ length: h }, () => Buffer.concat([Buffer.from([0]), Buffer.from(Array.from({ length: w }, () => [13, 148, 160]).flat())])));
  const crc = (buf) => { let c = ~0; for (const b of buf) { c ^= b; for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1; } return (~c) >>> 0; };
  const chunk = (t, d) => { const len = Buffer.alloc(4); len.writeUInt32BE(d.length); const body = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(body)); return Buffer.concat([len, body, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const file = path.join(os.tmpdir(), `live-check-${process.pid}.png`);
  fs.writeFileSync(file, Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
  return file;
}

// ---------- the four windows ----------
let bounds = [0, 0, 1470, 956];
try { bounds = execSync(`osascript -e 'tell application "Finder" to get bounds of window of desktop'`).toString().trim().split(/,\s*/).map(Number); } catch { /* not a Mac: use the default */ }
const SW = bounds[2]; const SH = bounds[3];
const W = Math.floor(SW / 2); const H = Math.floor((SH - 30) / 2);
const ROLES = [['ADMIN (school office)', 0, 30], ['TEACHER', W, 30], ['STUDENT', 0, 30 + H], ['PARENT', W, 30 + H]];
const browsers = []; const win = {};

async function openWindows() {
  for (const [label, x, y] of ROLES) {
    const b = await chromium.launch({ channel: 'chrome', headless: false, slowMo: 120, args: [`--window-position=${x},${y}`, `--window-size=${W},${H}`, '--force-device-scale-factor=0.5', '--no-first-run'] });
    const ctx = await b.newContext({ viewport: null });
    await ctx.addInitScript((code) => localStorage.setItem('eduamigo_school', JSON.stringify({ code, name: code })), SCHOOL);
    await ctx.addInitScript((text) => {
      const mount = () => {
        if (!document.body || document.getElementById('lc-banner')) return;
        const d = document.createElement('div'); d.id = 'lc-banner';
        d.style.cssText = 'position:fixed;z-index:2147483647;left:50%;bottom:10px;transform:translateX(-50%);max-width:92%;padding:8px 16px;border-radius:999px;background:#111827;color:#fff;font:700 15px system-ui;box-shadow:0 8px 24px rgba(0,0,0,.35);pointer-events:none;text-align:center';
        d.textContent = text; document.body.appendChild(d);
      };
      document.addEventListener('DOMContentLoaded', mount); setInterval(mount, 500);
    }, label);
    const page = await ctx.newPage();
    browsers.push(b); win[label.split(' ')[0]] = page;
  }
}
const say = async (role, text) => { try { await win[role].evaluate((t) => { const d = document.getElementById('lc-banner'); if (d) d.textContent = t; }, `${role}: ${text}`); } catch { /* the page is changing */ } };

async function signIn(role, identifier) {
  const p = win[role];
  await say(role, `signing in as ${identifier}`);
  await p.goto(`${WEB}/login`);
  await p.getByLabel('Email, mobile number or admission number').fill(identifier);
  await p.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await p.getByRole('button', { name: 'Sign in', exact: true }).click();
  await p.waitForURL((u) => !/\/(login|select-school)/.test(u.pathname), { timeout: 20000 });
  await sleep(PACE);
}

// ---------- checks ----------
let section = '';
const group = (name) => { section = name; console.log(`\n=== ${name}`); };
async function check(name, fn, how = 'screen') {
  let ok = false; let detail = '';
  try { const r = await fn(); ok = r === undefined ? true : !!r; } catch (e) { detail = String(e.message || e).split('\n')[0].slice(0, 160); }
  results.push({ section, name, ok, how, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${how !== 'screen' ? ` [${how}]` : ''}${detail ? `  (${detail})` : ''}`);
}
// A text is on the page after a reload (allow time for polling screens).
async function sees(role, url, text, { timeout = 12000 } = {}) {
  const p = win[role];
  await p.goto(`${WEB}${url}`);
  await sleep(PACE);
  await p.getByText(text, { exact: false }).first().waitFor({ state: 'visible', timeout });
  return true;
}
async function doesNotSee(role, url, text) {
  const p = win[role];
  await p.goto(`${WEB}${url}`);
  await sleep(PACE + 1200);
  return (await p.getByText(text, { exact: false }).count()) === 0;
}

// ---------- the walk ----------
async function main() {
  console.log(`EduAmigo live check\n  app ${WEB}\n  api ${API}\n  school ${SCHOOL}\n  screen ${SW}x${SH}`);
  const health = await fetch(`${API}/health`).then((r) => r.status).catch(() => 0);
  if (health !== 200) throw new Error(`The API at ${API} is not answering`);

  // who is who
  const adminTok = await login('admin@gvps.demo');
  const teacherTok = await login('teacher@gvps.demo');
  const riyaTok = await login('1');
  const kabirTok = await login('2');
  const aaravTok = await login('3');
  if (![adminTok, teacherTok, riyaTok, kabirTok, aaravTok].every(Boolean)) throw new Error('Could not sign in to the demo accounts (is this the GVPS demo with the standard password?)');
  const students = (await http('GET', '/students?limit=60', adminTok)).body.data;
  const riya = students.find((s) => s.name.startsWith('Riya'));
  const kabir = students.find((s) => s.name.startsWith('Kabir'));
  const aarav = students.find((s) => s.name.startsWith('Aarav'));
  const fees = (await http('GET', `/fees/${riya._id}`, adminTok)).body.data;
  const busFee = fees.find((f) => f.status !== 'Paid'); // any fee Riya still owes

  await openWindows();
  console.log(`  window ${W}x${H}, page width ${await win.ADMIN.evaluate(() => innerWidth)} css px`);
  await signIn('ADMIN', 'admin@gvps.demo');
  await signIn('TEACHER', 'teacher@gvps.demo');
  await signIn('STUDENT', '1');
  await signIn('PARENT', '9876543210');
  const A = win.ADMIN; const T = win.TEACHER; const S = win.STUDENT; const P = win.PARENT;

  // The parent looks at Riya (the other child is Kabir).
  const pickChild = async (name) => { await P.goto(`${WEB}/parent/home`); await sleep(PACE); await P.getByRole('tab', { name: new RegExp(name) }).click(); await sleep(PACE); };
  await pickChild('Riya');

  // ---- 1. Notices from the school office reach only the people they are for
  group('1. Notices from the office reach only their audience');
  const noticeStudents = `Notice for students ${STAMP}`;
  const noticeParents = `Notice for parents ${STAMP}`;
  const sendNotice = async (title, target) => {
    await say('ADMIN', `sending "${title}"`);
    await A.goto(`${WEB}/admin/communications`); await sleep(PACE);
    await A.getByRole('button', { name: /Send Notification/ }).first().click(); await sleep(400);
    await A.locator('#notif-title').fill(title); await A.locator('#notif-message').fill('Live check message. Please ignore.');
    await A.getByRole('dialog').getByRole('button', { name: target, exact: true }).click(); await sleep(300);
    await A.getByRole('dialog').getByRole('button', { name: 'Send Now' }).click(); await sleep(PACE + 800);
  };
  await sendNotice(noticeStudents, 'Students');
  await check('students see a notice sent to Students', () => sees('STUDENT', '/student/notifications', noticeStudents));
  await check('parents do NOT see the notice sent to Students', () => doesNotSee('PARENT', '/parent/notifications', noticeStudents));
  await check('teachers do NOT see the notice sent to Students', () => doesNotSee('TEACHER', '/teacher/notifications', noticeStudents));
  await sendNotice(noticeParents, 'Parents');
  await check('parents see a notice sent to Parents', () => sees('PARENT', '/parent/notifications', noticeParents));
  await check('students do NOT see the notice sent to Parents', () => doesNotSee('STUDENT', '/student/notifications', noticeParents));

  // ---- 2. Homework
  group('2. Homework given by a teacher reaches exactly the right students');
  const hwClass = `Class worksheet ${STAMP}`;
  const hwRiya = `Only for Riya ${STAMP}`;
  const giveHomework = async (title, chosen) => {
    await say('TEACHER', `giving homework "${title}"`);
    await T.goto(`${WEB}/teacher/homework`); await sleep(PACE);
    await T.getByText('+ Give homework').click(); await sleep(400);
    await T.getByLabel('Title').fill(title);
    await T.getByLabel('Due date').fill(new Date(Date.now() + 2 * 86400000).toLocaleDateString('en-CA'));
    if (chosen) { await T.getByLabel('Chosen students').check(); await sleep(900); await T.getByLabel(new RegExp(chosen)).check(); await sleep(300); }
    await T.getByRole('button', { name: 'Send homework' }).click(); await sleep(PACE + 800);
  };
  await giveHomework(hwClass, null);
  await giveHomework(hwRiya, 'Riya Sharma');
  await check('student Riya sees the class homework', () => sees('STUDENT', '/student/homework', hwClass));
  await check('student Riya sees the homework meant only for her', () => sees('STUDENT', '/student/homework', hwRiya));
  await check('parent (child Riya) sees both', async () => (await sees('PARENT', '/parent/homework', hwClass)) && (await sees('PARENT', '/parent/homework', hwRiya)));
  await check('classmate Kabir sees the class homework but NOT the one for Riya', async () => {
    const l = (await http('GET', '/homework/my', kabirTok)).body.data.map((h) => h.title);
    return l.includes(hwClass) && !l.includes(hwRiya);
  }, 'API as Kabir');
  await check('classmate Aarav sees the class homework but NOT the one for Riya', async () => {
    const l = (await http('GET', '/homework/my', aaravTok)).body.data.map((h) => h.title);
    return l.includes(hwClass) && !l.includes(hwRiya);
  }, 'API as Aarav');
  await check('the parent switching to Kabir no longer sees the homework meant for Riya', async () => {
    await pickChild('Kabir');
    const ok = (await sees('PARENT', '/parent/homework', hwClass)) && (await doesNotSee('PARENT', '/parent/homework', hwRiya));
    await pickChild('Riya');
    return ok;
  });
  await check('the school office sees the homework of every teacher', () => sees('ADMIN', '/admin/homework', hwClass));
  await check('the student marks it done and the teacher sees the count rise', async () => {
    await say('STUDENT', 'marking the class homework done');
    await S.goto(`${WEB}/student/homework`); await sleep(PACE);
    await S.locator('.hw-card', { hasText: hwClass }).getByRole('button', { name: /Mark as done/ }).click(); await sleep(PACE);
    await T.goto(`${WEB}/teacher/homework`); await sleep(PACE);
    await T.locator('.hw-card', { hasText: hwClass }).getByText(/1 of \d+ done/).waitFor({ timeout: 10000 });
    return true;
  });

  // ---- 3. Attendance
  group('3. Attendance marked by the teacher shows for the student and the parent');
  const absentBefore = async (page, url) => { await page.goto(`${WEB}${url}`); await sleep(PACE + 600); return page.locator('text=Absent').first().locator('xpath=following::*[1]').innerText().catch(() => ''); };
  await say('TEACHER', 'marking Riya absent today');
  await T.goto(`${WEB}/teacher/attendance`); await sleep(PACE + 800);
  await T.getByRole('button', { name: 'Absent: Riya Sharma' }).click(); await sleep(400);
  await T.getByRole('button', { name: /(Save|Update) Attendance/ }).click(); await sleep(PACE + 1000);
  await check('the student sees the absence on My Attendance', async () => {
    const att = (await http('GET', '/attendance/my-summary', riyaTok)).body.data;
    await S.goto(`${WEB}/student/attendance`); await sleep(PACE + 800);
    return att.absent >= 1 && (await S.getByText(/Absent/).count()) > 0;
  }, 'screen + API');
  await check('the parent sees the same absence for Riya', async () => {
    await P.goto(`${WEB}/parent/attendance`); await sleep(PACE + 800);
    const a = (await http('GET', `/attendance/student/${riya._id}/summary`, (await login('9876543210')))).body.summary;
    return a.absent >= 1 && (await P.getByText(/Absent/).count()) > 0;
  }, 'screen + API');
  await check('the office attendance report counts the school day', async () => {
    const now = new Date();
    const r = (await http('GET', `/attendance/report?month=${now.getMonth() + 1}&year=${now.getFullYear()}`, adminTok)).body;
    await A.goto(`${WEB}/admin/attendance-reports`); await sleep(PACE + 1000);
    const text = await A.locator('main, .ea-admin-main').first().innerText();
    const m = text.match(/TOTAL ABSENT\s*\n?\s*(\d+)/i);
    return r.success !== false && m && Number(m[1]) >= 1;
  }, 'screen + API');

  // ---- 4. Fees
  group('4. A fee recorded by the office shows for the student and the parent only');
  if (busFee) {
    await say('ADMIN', 'recording a part-payment of a fee Riya owes');
    const pay = await http('PATCH', `/fees/${busFee._id}/pay`, adminTok, { amount: Math.min(500, busFee.amount), mode: 'Cash' });
    await check('the office records the payment', () => pay.status === 200 && pay.body.success, 'API as the office');
    await check('the student sees the payment on Fee Status', async () => { await S.goto(`${WEB}/student/fee`); await sleep(PACE + 800); return (await S.getByText(/Paid|Partial|500/i).count()) > 0; });
    await check('the parent is told "Fee payment received"', () => sees('PARENT', '/parent/notifications', 'Fee payment received'));
    await check('another student (Aarav) sees nothing about it', async () => !(await http('GET', '/fees/my', aaravTok)).body.data.some((f) => f._id === busFee._id));
  } else console.log('(no unpaid bus fee left for Riya: skipped)');

  // ---- 5. Chat
  group('5. Messages go to the right person, with a photo');
  const hello = `Hello from the parent ${STAMP}`;
  const reply = `Reply from the teacher ${STAMP}`;
  await say('PARENT', 'messaging the class teacher');
  await P.goto(`${WEB}/parent/chat`); await sleep(PACE + 600);
  await P.locator('.cs-contact', { hasText: 'Anita' }).first().click(); await sleep(400);
  await P.getByLabel('Message to Anita Verma').fill(hello);
  await P.getByRole('button', { name: 'Send message' }).click(); await sleep(PACE);
  await check('the teacher gets the message from the parent', async () => {
    await T.goto(`${WEB}/teacher/chat`); await sleep(PACE + 600);
    await T.locator('.cs-contact', { hasText: 'Sharma' }).first().click();
    await T.locator('.cs-bubble', { hasText: hello }).waitFor({ timeout: 10000 });
    return true;
  });
  await say('TEACHER', 'replying');
  await T.getByLabel(/Message to /).fill(reply);
  await T.getByRole('button', { name: 'Send message' }).click(); await sleep(PACE);
  await check('the parent gets the teacher\'s reply', async () => { await P.locator('.cs-bubble', { hasText: reply }).waitFor({ timeout: 12000 }); return true; });
  await check('the student does not see the parent\'s conversation', async () => {
    await S.goto(`${WEB}/student/chat`); await sleep(PACE + 800);
    return (await S.getByText(hello).count()) === 0;
  });
  await check('a student has no "Concerns" tab (it is for parents and staff)', async () => (await S.getByRole('tab', { name: /Concerns/ }).count()) === 0);

  // ---- 6. A concern raised with the parent
  group('6. A concern raised by the teacher goes to the child\'s parent only');
  const concern = `Talking in class ${STAMP}`;
  await say('TEACHER', 'raising a concern about Riya');
  await T.getByRole('button', { name: 'Back to contacts' }).click(); await sleep(400);
  await T.getByRole('tab', { name: /Concerns/ }).click(); await sleep(500);
  await T.getByRole('button', { name: /Raise a concern/ }).click(); await sleep(500);
  await T.getByPlaceholder('Search a student').fill('Riya'); await sleep(500);
  await T.locator('.cs-pick button', { hasText: 'Riya' }).first().click();
  await T.getByPlaceholder('e.g. Talking in class').fill(concern);
  await T.getByRole('button', { name: 'Send to parents' }).click(); await sleep(PACE + 800);
  await check('the parent sees the concern under Chat > Concerns', async () => {
    await P.goto(`${WEB}/parent/chat`); await sleep(PACE + 600);
    await P.getByRole('tab', { name: /Concerns/ }).click();
    await P.getByText(concern).waitFor({ timeout: 10000 });
    return true;
  });
  await check('the parent can reply and the status changes', async () => {
    await P.getByLabel('Reply').first().fill('Thank you, I will speak with her.');
    await P.getByRole('button', { name: 'Reply', exact: true }).first().click(); await sleep(PACE + 600);
    return (await P.getByText(/Parent replied/).count()) > 0;
  });
  await check('the concern is held for Riya\'s parent, with the school\'s name on it', async () => {
    const mine = await http('GET', `/complaints/child?studentId=${riya._id}`, await login('9876543210'));
    return mine.body.data.some((c) => c.subject === concern && c.raisedBy);
  }, 'API');

  // ---- 7. Profile photo
  group('7. A profile photo set by the student shows to the people who look at them');
  await say('STUDENT', 'setting a profile photo');
  await S.goto(`${WEB}/student/profile`); await sleep(PACE + 600);
  await S.locator('.ea-avatar-picker input[type=file]').setInputFiles(png()); await sleep(PACE + 800);
  await check('the student sees it on their own profile and header', async () => { await S.reload(); await sleep(PACE + 800); await S.locator('.ea-avatar-picker img').first().waitFor({ timeout: 8000 }); return true; });
  await check('the teacher sees it in the chat list', async () => {
    await T.getByRole('tab', { name: /Chats/ }).click(); await T.reload(); await sleep(PACE + 1500);
    await T.locator('.cs-contact', { hasText: 'Riya' }).first().locator('img').waitFor({ timeout: 12000 });
    return true;
  });
  await check('the office student list shows the photo', async () => {
    const list = (await http('GET', '/students?limit=60', adminTok)).body.data;
    return /\/api\/photos\//.test(list.find((s) => s.name.startsWith('Riya')).photo || '');
  }, 'API as the office');

  // ---- 8. The school bus
  group('8. The school bus, live');
  const buses = (await http('GET', '/transport', adminTok)).body.data;
  const bus = buses.find((b) => /4521/.test(b.busNumber)) || buses[0];
  await say('STUDENT', 'opening Live Bus (no trip yet)');
  await S.goto(`${WEB}/student/bus`); await sleep(PACE + 1500);
  await check('before the trip, the student sees "not on route"', async () => /not on route/i.test(await S.getByTestId('bus-live-badge').innerText()));
  const sim = spawn('node', ['src/scripts/simulateBus.js', bus.driverToken, '--api', API, '--kmh', '40', '--no-end'], { cwd: path.resolve(process.cwd(), '../eduamigo-backend'), stdio: 'ignore' });
  await say('ADMIN', 'a driver phone starts the trip (simulated)');
  await sleep(14000);
  await check('the student sees the bus LIVE on the map', async () => { await S.goto(`${WEB}/student/bus`); await sleep(PACE + 1500); return /live/i.test(await S.getByTestId('bus-live-badge').innerText()); });
  await check('the parent sees the same bus LIVE', async () => { await P.goto(`${WEB}/parent/bus`); await sleep(PACE + 1500); return /live/i.test(await P.getByTestId('bus-live-badge').innerText()); });
  await check('the home dashboard says "On route now" only now', async () => { await S.goto(`${WEB}/student/home`); await sleep(PACE + 1500); return (await S.getByText('On route now').count()) > 0; });
  sim.kill();
  await http('PATCH', `/transport/driver/${bus.driverToken}/end-trip`, null, {});
  await sleep(2500);
  await check('after the trip ends the student sees "not on route" again', async () => { await S.goto(`${WEB}/student/bus`); await sleep(PACE + 1500); return /not on route/i.test(await S.getByTestId('bus-live-badge').innerText()); });

  // ---- 9. Another school sees none of it
  group('9. Another school sees none of this');
  const platform = (await http('POST', '/platform/login', null, { email: 'owner@eduamigo.demo', password: PASSWORD })).body.token;
  const schools = (await http('GET', '/platform/schools', platform)).body.data;
  const list = Array.isArray(schools) ? schools : schools.items || [];
  const other = list.find((s) => s.code !== SCHOOL && s.code !== 'NPS' && s.isActive !== false);
  if (platform && other) {
    const session = (await http('POST', `/platform/schools/${other._id}/support-session`, platform, { reason: 'Live check: confirming this school cannot see another school\'s notices' })).body;
    const notes = (await http('GET', '/notifications/my', session.token)).body.data || [];
    await check(`${other.code} (another school) has none of today's notices`, () => !notes.some((n) => [noticeStudents, noticeParents].includes(n.title)), 'API, support session');
    const hw = await http('GET', '/homework', session.token);
    await check(`${other.code} sees none of the homework`, () => !(hw.body.data || []).some((h) => [hwClass, hwRiya].includes(h.title)), 'API, support session');
  }

  // ---- report
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length} of ${results.length} checks passed${failed.length ? `, ${failed.length} FAILED:` : '.'}`);
  failed.forEach((f) => console.log(` - [${f.section}] ${f.name} ${f.detail}`));
  const lines = ['# Live check', '', `Run: ${new Date().toISOString()} against ${WEB} (API ${API}), school ${SCHOOL}.`, '', `**${results.length - failed.length} of ${results.length} checks passed.**`, ''];
  let cur = '';
  for (const r of results) { if (r.section !== cur) { cur = r.section; lines.push('', `## ${cur}`, ''); } lines.push(`- ${r.ok ? 'PASS' : '**FAIL**'}: ${r.name}${r.how !== 'screen' ? ` _(${r.how})_` : ''}${r.detail ? ` (${r.detail})` : ''}`); }
  const out = path.resolve(process.cwd(), 'docs/production-readiness/LIVE_CHECK.md');
  fs.writeFileSync(out, `${lines.join('\n')}\n`);
  console.log(`\nReport: ${out}`);
  await sleep(6000);
}

main().catch((e) => { console.error('\nStopped:', e.message); process.exitCode = 1; }).finally(async () => { for (const b of browsers) await b.close().catch(() => {}); });
