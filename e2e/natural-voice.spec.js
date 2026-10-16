import { test, expect } from '@playwright/test';
import { Buffer } from 'node:buffer';
import { signIn } from './helpers';

// The natural (neural) voice of the AI Tutor: an answer asked by voice is read in pieces from /api/learning/speak (the first
// piece is one sentence so speech starts quickly), and falls back to the device's own voice whenever the natural one cannot be
// used. /api/learning is mocked: no provider is contacted and nothing is written.

const CONTEXT = (natural) => ({ class: '10', section: 'A', subjects: ['Science'], exams: [], capabilities: { webResearch: false, historyDays: 180, ai: { available: true, reason: null }, voice: { natural } } });
const S1 = 'Plants make glucose from sunlight, water and carbon dioxide.';
const S2 = 'This happens in the green parts of the leaf.';
const S3 = 'Oxygen is released as a by-product.';
const S4 = 'The whole process is called photosynthesis.';
const ANSWER = `${S1} ${S2} ${S3} ${S4} [S1]`;
const nd = (events) => `${events.map((e) => JSON.stringify(e)).join('\n')}\n`;

// 0.3 s of silence, 16-bit mono at 8 kHz: a valid WAV the browser really decodes and plays.
const silentWav = (seconds = 0.3) => {
  const data = Buffer.alloc(Math.round(16000 * seconds));
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(8000, 24); h.writeUInt32LE(16000, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
};

const fakeSpeech = () => {
  window.__spoken = [];
  window.__plays = 0;
  window.__speech = { next: 'ok', transcript: 'what is photosynthesis' };
  class FakeRec {
    start() { setTimeout(() => { this.onstart?.(); this.onresult?.({ resultIndex: 0, results: [Object.assign([{ transcript: window.__speech.transcript }], { isFinal: true })] }); this.onspeechend?.(); this.onend?.(); }, 30); }
    abort() { this.onend?.(); }
  }
  window.SpeechRecognition = FakeRec;
  window.webkitSpeechRecognition = FakeRec;
  window.SpeechSynthesisUtterance = function U(text) { this.text = text; };
  const synth = {
    speaking: false,
    getVoices: () => [{ lang: 'en-IN', name: 'Test' }, { lang: 'hi-IN', name: 'Test Hindi' }],
    speak(u) { window.__spoken.push(u.text); setTimeout(() => u.onstart?.(), 5); setTimeout(() => u.onend?.(), 20); },
    cancel() {},
  };
  Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function p() { window.__plays += 1; return play.call(this); };
  try { localStorage.setItem('ea-voice-consent', 'yes'); } catch { /* no storage */ }
};

async function setup(page, { natural = true, speak = 'ok', seconds = 0.3, delay = 0 } = {}) {
  const speakCalls = [];
  const speakTimes = [];
  await page.addInitScript(fakeSpeech);
  await signIn(page, 'student');
  await page.route('**/api/learning/**', async (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api\/learning/, '');
    if (path === '/context') return route.fulfill({ json: { success: true, data: CONTEXT(natural) } });
    if (path === '/speak') {
      speakCalls.push(JSON.parse(route.request().postData()).text);
      speakTimes.push(Date.now());
      if (delay) await new Promise((r) => setTimeout(r, delay));
      if (speak === 'fail') return route.fulfill({ status: 503, json: { success: false, code: 'VOICE_UNAVAILABLE', message: 'The natural voice is not available right now.' } });
      return route.fulfill({ status: 200, contentType: 'audio/wav', body: silentWav(seconds) });
    }
    if (path === '/chat') {
      return route.fulfill({ status: 200, contentType: 'application/x-ndjson', body: nd([
        { type: 'meta', conversationId: 'c1', language: 'en', materialsChecked: false, sources: [] },
        { type: 'delta', text: ANSWER },
        { type: 'final', text: ANSWER, conversationId: 'c1', used: [], checks: [], diagrams: [], confidence: { level: 'high', label: 'High confidence', reason: 'Standard material.' }, timings: { totalMs: 300 } },
      ]) });
    }
    return route.fulfill({ json: { success: true, data: [] } });
  });
  await page.goto('/student/learn');
  speakCalls.times = speakTimes;
  return speakCalls;
}
const askByVoice = async (page) => {
  await page.getByRole('button', { name: 'Ask with your voice' }).click();
  await expect(page.getByRole('log').getByText('what is photosynthesis')).toBeVisible();
};

test('with the natural voice on, the answer is read from the server in pieces, in order, with no symbols', async ({ page }) => {
  const calls = await setup(page);
  await askByVoice(page);
  await expect.poll(() => calls.length).toBeGreaterThanOrEqual(2);
  // The first piece is one sentence (speech starts quickly); the rest follow together, in order.
  expect(calls[0]).toBe(S1);
  expect(calls.slice(1).join(' ')).toBe(`${S2} ${S3} ${S4}`);
  for (const c of calls) expect(c).not.toMatch(/\*|\[S1\]/);
  // It is really played, and the device's own voice is not used.
  await expect.poll(() => page.evaluate(() => window.__plays)).toBeGreaterThanOrEqual(2);
  expect(await page.evaluate(() => window.__spoken)).toEqual([]);
  // "Speaking…" shows while it plays and goes away when it has finished.
  await expect(page.getByRole('status').filter({ hasText: 'Speaking' })).toHaveCount(0, { timeout: 15000 });
  await expect.poll(() => page.getByRole('log').getAttribute('data-voice-first-audio-ms')).not.toBeNull();
});

test('if the natural voice fails, the answer is read by the device\'s voice, and it is not asked again for a while', async ({ page }) => {
  const calls = await setup(page, { speak: 'fail' });
  await askByVoice(page);
  await expect.poll(() => page.evaluate(() => window.__spoken.join(' '))).toContain('Plants make glucose from sunlight');
  const spoken = await page.evaluate(() => window.__spoken.join(' '));
  expect(spoken).toContain('The whole process is called photosynthesis');
  expect(spoken).not.toMatch(/\*|\[S1\]/);
  expect(await page.evaluate(() => window.__plays)).toBe(0);
  const first = calls.length;
  expect(first).toBeGreaterThanOrEqual(1);
  // A second spoken question goes straight to the device's voice.
  await page.evaluate(() => { window.__spoken = []; });
  await page.getByRole('button', { name: 'New chat' }).click();
  await askByVoice(page);
  await expect.poll(() => page.evaluate(() => window.__spoken.length)).toBeGreaterThan(0);
  expect(calls.length).toBe(first);
});

test('when the server has no natural voice, nothing is requested and the device\'s voice reads the answer', async ({ page }) => {
  const calls = await setup(page, { natural: false });
  await askByVoice(page);
  await expect.poll(() => page.evaluate(() => window.__spoken.join(' '))).toContain('Plants make glucose from sunlight');
  expect(calls).toHaveLength(0);
});

test('muted: nothing is requested and nothing is spoken', async ({ page }) => {
  const calls = await setup(page);
  await page.getByRole('button', { name: 'More voice options' }).click();
  await page.getByRole('switch', { name: 'Read answers aloud' }).click();
  await page.keyboard.press('Escape');
  await askByVoice(page);
  await expect(page.getByText('High confidence')).toBeVisible();
  await page.waitForTimeout(800);
  expect(calls).toHaveLength(0);
  expect(await page.evaluate(() => window.__spoken)).toEqual([]);
});

test('the next piece is made while the current one plays, so the voice runs on without a wait', async ({ page }) => {
  // Each piece plays for 2.5 s and takes 0.4 s to make. The second piece must be asked for as soon as the first starts to play,
  // not when it ends (that left a gap of the whole making time between the pieces).
  const calls = await setup(page, { seconds: 2.5, delay: 400 });
  await askByVoice(page);
  await expect.poll(() => calls.length, { timeout: 10000 }).toBeGreaterThanOrEqual(2);
  expect(calls.times[1] - calls.times[0]).toBeLessThan(1500);
  // ...and the gap between the end of one piece and the start of the next is short.
  await expect.poll(() => page.evaluate(() => window.__plays), { timeout: 15000 }).toBeGreaterThanOrEqual(2);
});
