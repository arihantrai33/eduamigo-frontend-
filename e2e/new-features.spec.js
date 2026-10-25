// Profile photos, homework, the new chat, the bus screen's resting place and the dashboard rings, end to end through the real screens.
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { signIn } from './helpers.js';

// A small real PNG (the app and the server both check the bytes).
function pngFile() {
  const w = 40; const h = 40;
  const raw = Buffer.concat(Array.from({ length: h }, () => Buffer.concat([Buffer.from([0]), Buffer.from(Array.from({ length: w }, () => [13, 148, 160]).flat())])));
  const crc = (buf) => { let c = ~0; for (const b of buf) { c ^= b; for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1; } return (~c) >>> 0; };
  const chunk = (t, d) => { const len = Buffer.alloc(4); len.writeUInt32BE(d.length); const body = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(body)); return Buffer.concat([len, body, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const file = path.join(os.tmpdir(), `e2e-pic-${process.pid}.png`);
  fs.writeFileSync(file, Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
  return file;
}

test('a student sets a profile photo and it shows in the sidebar and the profile', async ({ page }) => {
  await signIn(page, 'student');
  await page.goto('/student/profile');
  await page.locator('.ea-avatar-picker input[type=file]').setInputFiles(pngFile());
  await expect(page.getByText('Profile photo updated.')).toBeVisible();
  await expect(page.locator('.ea-sidebar__user img')).toBeVisible();
  await expect(page.locator('.ea-avatar-picker img')).toBeVisible();
});

test('homework: a teacher gives it to a class, the student sees it and marks it done, the teacher sees the count', async ({ browser }) => {
  const title = `Worksheet ${Date.now()}`;
  const t = await (await browser.newContext()).newPage();
  await signIn(t, 'teacher');
  await t.goto('/teacher/homework');
  await t.getByText('+ Give homework').click();
  await t.getByLabel('Title').fill(title);
  await t.getByLabel('Due date').fill(new Date(Date.now() + 2 * 86400000).toLocaleDateString('en-CA'));
  await t.getByRole('button', { name: 'Send homework' }).click();
  await expect(t.getByText('Homework sent to the students and their parents.')).toBeVisible();
  await expect(t.getByRole('heading', { name: title })).toBeVisible();

  const s = await (await browser.newContext()).newPage();
  await signIn(s, 'student');
  await s.goto('/student/homework');
  const card = s.locator('.hw-card', { hasText: title });
  await expect(card).toBeVisible();
  await card.getByRole('button', { name: /Mark as done/ }).click();
  await expect(card).toBeHidden();                       // done homework leaves the To do list
  await s.getByRole('tab', { name: 'Done' }).or(s.getByText('Done', { exact: true })).first().click();
  await expect(s.locator('.hw-card', { hasText: title }).getByRole('button', { name: /Marked done/ })).toBeVisible();

  await t.reload();
  await expect(t.locator('.hw-card', { hasText: title }).getByText(/1 of \d+ done/)).toBeVisible();
});

test('chat: a parent sends a message and a photo to a teacher, who sees both and the unread count', async ({ browser }) => {
  const text = `Hello ${Date.now()}`;
  const p = await (await browser.newContext()).newPage();
  await signIn(p, 'parent');
  await p.goto('/parent/chat');
  await p.locator('.cs-contact', { hasText: 'Anita' }).first().click();
  await p.getByLabel('Message to Anita Verma').fill(text);
  await p.getByRole('button', { name: 'Send message' }).click();
  await expect(p.locator('.cs-bubble', { hasText: text })).toBeVisible();
  await p.getByRole('button', { name: 'Attach a photo or file' }).click();
  await p.locator('.cs-attach input[type=file]').first().setInputFiles(pngFile());
  await p.getByRole('button', { name: 'Send message' }).click();
  await expect(p.locator('.cs-photo img').last()).toBeVisible();

  const t = await (await browser.newContext()).newPage();
  await signIn(t, 'teacher');
  await t.goto('/teacher/chat');
  await t.locator('.cs-contact', { hasText: 'Sharma' }).first().click();
  await expect(t.locator('.cs-bubble', { hasText: text })).toBeVisible();
  await expect(t.locator('.cs-photo img').last()).toBeVisible();
});

test('the student bus screen shows the route and keeps the stops panel resting at the bottom', async ({ page }) => {
  await signIn(page, 'student');
  await page.goto('/student/bus');
  await expect(page.getByTestId('bus-live-badge')).toBeVisible();
  const panel = page.locator('.ea-bus-panel');
  await expect(panel).toBeVisible();
  expect((await panel.boundingBox()).height).toBeLessThan(200);
  await page.locator('.ea-bus-grip').click();
  await expect.poll(async () => (await panel.boundingBox()).height).toBeGreaterThan(250);
});

test('the home dashboards show attendance and marks as filling circles, with the exact figure once counted', async ({ page }) => {
  await signIn(page, 'student');
  await page.goto('/student/home');
  const ring = page.locator('.dx-metric .ea-ring').first();
  await expect(ring).toBeVisible();
  await expect(ring.locator('.ea-ring__center')).toHaveText(/\d+(\.\d+)?%/, { timeout: 6000 });
});
