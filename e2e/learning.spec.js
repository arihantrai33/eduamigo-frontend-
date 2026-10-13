import { test, expect } from '@playwright/test';
import { signIn } from './helpers';

// Learning AI screens with a mocked /api/learning (no AI provider is called, nothing is written) and, for Voice Learning,
// a scripted stand-in for the browser's speech recognition and speech synthesis.

const CONTEXT = { class: '10', section: 'A', subjects: ['Mathematics', 'Science'], exams: [{ _id: 'e1', title: 'Half Yearly', subject: 'Science', date: '2026-11-20', examType: 'Half Yearly' }], capabilities: { webResearch: false, historyDays: 180 } };
const ndjson = (events) => `${events.map((e) => JSON.stringify(e)).join('\n')}\n`;
const ANSWER = [
  { type: 'meta', conversationId: 'c1', language: 'en', materialsChecked: true, sources: [{ ref: 'S1', title: 'Chapter 6: Photosynthesis', type: 'Notes', subject: 'Science', part: 1 }] },
  { type: 'delta', text: 'Plants make **glucose** from light [S1]. ' },
  { type: 'delta', text: 'x = 4.\n```check\n{"type":"equation"' },
  { type: 'final', text: 'Plants make **glucose** from light [S1]. <img src=x onerror="window.__xss=1">\n\n[[diagram:0]]\n\nx = 4.', conversationId: 'c1',
    used: [{ ref: 'S1', title: 'Chapter 6: Photosynthesis', type: 'Notes', subject: 'Science', part: 1 }],
    checks: [{ status: 'passed', kind: 'equation', detail: 'x = 4 checked by substitution' }],
    diagrams: [{ type: 'cycle', title: 'Water cycle', steps: ['Evaporation', 'Condensation', 'Precipitation'], alt: 'Water cycle: Evaporation, then Condensation, then Precipitation.' }],
    confidence: { level: 'high', label: 'High confidence', reason: 'Consistent with your school material: Chapter 6: Photosynthesis.' }, timings: { totalMs: 900 } },
];

async function mockLearning(page, { chat = () => ANSWER } = {}) {
  const calls = [];
  await page.route('**/api/learning/**', async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname.replace(/^\/api\/learning/, '');
    const body = req.postData() ? JSON.parse(req.postData()) : null;
    calls.push({ method: req.method(), path, body });
    if (path === '/context') return route.fulfill({ json: { success: true, data: CONTEXT } });
    if (path === '/chat') {
      const out = await chat(body);
      if (out.status) return route.fulfill({ status: out.status, json: out.json });
      return route.fulfill({ status: 200, contentType: 'application/x-ndjson', body: ndjson(out) });
    }
    if (path === '/conversations' && req.method() === 'GET') return route.fulfill({ json: { success: true, data: [{ _id: 'c1', title: 'What is photosynthesis', subject: 'Science', mode: 'tutor', updatedAt: '2026-10-14T08:00:00Z', turns: 2 }] } });
    if (path === '/progress') return route.fulfill({ json: { success: true, data: { practice: { sets: 2, answered: 7, recent: [] }, topics: [{ subject: 'maths', topic: 'decimals', right: 1, total: 4, accuracy: 25 }], weak: [{ subject: 'maths', topic: 'decimals', right: 1, total: 4, accuracy: 25 }], strong: [], tutorConversations: 3, plan: null } } });
    return route.fulfill({ status: 404, json: { success: false, message: `not mocked: ${path}` } });
  });
  return calls;
}

// A stand-in for SpeechRecognition / speechSynthesis. window.__speech.next = 'ok' | 'denied' | 'silence' sets what the next
// listen does; spoken text is recorded in window.__spoken.
const fakeSpeech = () => {
  window.__spoken = [];
  window.__cancelled = 0;
  window.__speech = { next: 'ok', transcript: 'what is photosynthesis' };
  class FakeRec {
    start() {
      setTimeout(() => {
        this.onstart?.();
        const mode = window.__speech.next;
        if (mode === 'denied') { this.onerror?.({ error: 'not-allowed' }); this.onend?.(); return; }
        if (mode === 'ok') this.onresult?.({ resultIndex: 0, results: [Object.assign([{ transcript: window.__speech.transcript }], { isFinal: true })] });
        this.onspeechend?.();
        this.onend?.();
      }, 30);
    }
    abort() { this.onend?.(); }
  }
  window.SpeechRecognition = FakeRec;
  window.webkitSpeechRecognition = FakeRec;
  window.SpeechSynthesisUtterance = function U(text) { this.text = text; };
  const synth = {
    speaking: false,
    getVoices: () => [{ lang: 'en-IN', name: 'Test' }, { lang: 'hi-IN', name: 'Test Hindi' }],
    speak(u) { window.__spoken.push(u.text); setTimeout(() => u.onstart?.(), 5); if (!window.__holdSpeech) setTimeout(() => u.onend?.(), 20); else window.__held = u; },
    cancel() { window.__cancelled += 1; window.__held?.onend?.(); window.__held = null; },
  };
  Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
};

test.describe('AI Tutor', () => {
  test('answer: Markdown without raw HTML, source chip and list, checks, reliability, a diagram; hidden blocks never shown', async ({ page }) => {
    await signIn(page, 'student');
    const calls = await mockLearning(page);
    await page.goto('/student/learn');
    await expect(page.getByRole('heading', { name: 'Learning AI' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'AI Tutor' })).toHaveAttribute('aria-selected', 'true');
    await page.getByLabel('Subject').selectOption('Science');
    await page.getByLabel('Your question').fill('What is photosynthesis?');
    await page.getByRole('button', { name: 'Send' }).click();
    const log = page.getByRole('log', { name: 'Conversation' });
    await expect(log.getByText('What is photosynthesis?')).toBeVisible();
    await expect(log.locator('strong', { hasText: 'glucose' })).toBeVisible();
    await expect(log.getByRole('link', { name: 'Source S1' })).toBeVisible();
    await expect(log.getByText('Checked: x = 4 checked by substitution')).toBeVisible();
    await expect(log.getByText('High confidence')).toBeVisible();
    await expect(log.getByRole('img', { name: /Water cycle: Evaporation/ })).toBeVisible();
    await log.getByText('From your school material (1)').click();
    await expect(log.locator('li', { hasText: 'Chapter 6: Photosynthesis' })).toBeVisible();
    await expect(log).not.toContainText('```');
    await expect(log).not.toContainText('"type":"equation"');
    expect(await page.evaluate(() => window.__xss)).toBeUndefined();
    expect(await log.locator('img').count()).toBe(0);
    expect(calls.find((c) => c.path === '/chat').body).toMatchObject({ message: 'What is photosynthesis?', subject: 'Science', mode: 'tutor', voice: false });
  });

  test('Guided Learning, a follow-up in the same chat, an honest error with Try again, history', async ({ page }) => {
    await signIn(page, 'student');
    let n = 0;
    const calls = await mockLearning(page, {
      chat: () => { n += 1; return n === 2 ? [{ type: 'meta', conversationId: 'c1' }, { type: 'error', code: 'AI_FAILED', message: 'The AI Tutor could not answer just now. Nothing was guessed; please try again.' }] : ANSWER; },
    });
    await page.goto('/student/learn');
    await page.getByRole('button', { name: 'Guided Learning' }).click();
    await expect(page.getByRole('button', { name: 'Guided Learning' })).toHaveAttribute('aria-pressed', 'true');
    const box = page.getByLabel('Your question');
    await box.fill('solve 2x + 3 = 11');
    await box.press('Enter');
    await expect(page.getByText('High confidence')).toBeVisible();
    await box.fill('aur simple samjhao');
    await box.press('Enter');
    await expect(page.getByRole('alert').filter({ hasText: 'could not answer just now' })).toBeVisible();
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(page.getByText('High confidence')).toHaveCount(2);
    const chats = calls.filter((c) => c.path === '/chat').map((c) => c.body);
    expect(chats[0]).toMatchObject({ mode: 'guided' });
    expect(chats[1]).toMatchObject({ conversationId: 'c1', message: 'aur simple samjhao' });
    expect(chats[2]).toMatchObject({ conversationId: 'c1', message: 'aur simple samjhao' });
    await page.getByRole('button', { name: 'History' }).click();
    await expect(page.getByRole('dialog', { name: 'Chat history' })).toContainText('Kept for 180 days');
    await expect(page.getByRole('button', { name: 'Delete chat: What is photosynthesis' })).toBeVisible();
  });

  test('a refused request (feature off, limit reached) shows the server\'s reason', async ({ page }) => {
    await signIn(page, 'student');
    await mockLearning(page, { chat: () => ({ status: 429, json: { success: false, message: "Your school has used this month's AI questions. The limit resets on the 1st." } }) });
    await page.goto('/student/learn');
    await page.getByLabel('Your question').fill('x');
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(page.getByRole('alert')).toContainText("used this month's AI questions");
  });

  test('"Continue in AI Tutor" from Ask fills the question without sending it; old Revise links open Learning AI', async ({ page }) => {
    await signIn(page, 'student');
    const calls = await mockLearning(page);
    await page.goto('/student/learn?q=Explain%20fractions');
    await expect(page.getByLabel('Your question')).toHaveValue('Explain fractions');
    expect(calls.filter((c) => c.path === '/chat')).toHaveLength(0);
    await page.goto('/student/revise');
    await expect(page).toHaveURL(/\/student\/learn$/);
  });

  test('tabs work with the arrow keys', async ({ page }) => {
    await signIn(page, 'student');
    await mockLearning(page);
    await page.goto('/student/learn');
    await page.getByRole('tab', { name: 'AI Tutor' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'Practice & Assessment' })).toBeFocused();
    await expect(page.getByRole('tab', { name: 'Practice & Assessment' })).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('End');
    await expect(page.getByRole('tab', { name: 'Learning Progress' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText('Needs more practice')).toBeVisible();
    await page.getByRole('button', { name: 'Practise' }).click();
    await expect(page.getByRole('tab', { name: 'Practice & Assessment' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByLabel('Topic or chapter')).toHaveValue('decimals');
  });
});

test.describe('Voice Learning', () => {
  test.beforeEach(async ({ page }) => { await page.addInitScript(fakeSpeech); });

  test('privacy notice first; spoken question goes through the same chat; the answer is read without symbols; latency recorded', async ({ page }) => {
    await signIn(page, 'student');
    const calls = await mockLearning(page);
    await page.goto('/student/learn');
    await page.getByRole('button', { name: 'Ask with your voice' }).click();
    await expect(page.getByRole('dialog', { name: 'Voice privacy' })).toContainText('EduAmigo receives only the text, not the audio');
    await page.getByRole('button', { name: 'I understand, use my voice' }).click();
    await expect(page.getByRole('log').getByText('what is photosynthesis')).toBeVisible();
    await expect(page.getByText('High confidence')).toBeVisible();
    expect(calls.find((c) => c.path === '/chat').body).toMatchObject({ message: 'what is photosynthesis', voice: true });
    await expect.poll(() => page.evaluate(() => window.__spoken.join(' '))).toContain('Plants make glucose from light');
    const spoken = await page.evaluate(() => window.__spoken.join(' '));
    expect(spoken).not.toMatch(/\*|\[S1\]|```|check/);
    await expect.poll(() => page.getByRole('log').getAttribute('data-voice-first-text-ms')).not.toBeNull();
    await expect.poll(() => page.getByRole('log').getAttribute('data-voice-first-audio-ms')).not.toBeNull();
  });

  test('permission denied and silence: said plainly, nothing is sent', async ({ page }) => {
    await signIn(page, 'student');
    const calls = await mockLearning(page);
    await page.addInitScript(() => { try { localStorage.setItem('ea-voice-consent', 'yes'); } catch { /* */ } });
    await page.goto('/student/learn');
    await page.evaluate(() => { window.__speech.next = 'denied'; });
    await page.getByRole('button', { name: 'Ask with your voice' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Microphone permission is off' })).toBeVisible();
    await page.getByRole('status').filter({ hasText: 'Microphone permission is off' }).getByRole('button', { name: 'OK' }).click();
    await page.evaluate(() => { window.__speech.next = 'silence'; });
    await page.getByRole('button', { name: 'Ask with your voice' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'I did not hear anything' })).toBeVisible();
    expect(calls.filter((c) => c.path === '/chat')).toHaveLength(0);
  });

  test('muted answers are not spoken; speaking stops when the student starts talking again', async ({ page }) => {
    await signIn(page, 'student');
    await mockLearning(page);
    await page.addInitScript(() => { try { localStorage.setItem('ea-voice-consent', 'yes'); } catch { /* */ } });
    await page.goto('/student/learn');
    await page.getByRole('button', { name: 'Mute spoken answers' }).click();
    await page.getByRole('button', { name: 'Ask with your voice' }).click();
    await expect(page.getByText('High confidence')).toBeVisible();
    expect(await page.evaluate(() => window.__spoken.length)).toBe(0);

    await page.getByRole('button', { name: 'Turn spoken answers on' }).click();
    await page.evaluate(() => { window.__holdSpeech = true; });
    await page.getByRole('button', { name: 'Ask with your voice' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Speaking' })).toBeVisible();
    const before = await page.evaluate(() => window.__cancelled);
    await page.getByRole('button', { name: 'Stop speaking' }).click();
    expect(await page.evaluate(() => window.__cancelled)).toBeGreaterThan(before);
    await expect(page.getByRole('status').filter({ hasText: 'Speaking' })).toHaveCount(0);
  });

  test('a browser without speech recognition says so and typing still works', async ({ page }) => {
    await page.addInitScript(() => { delete window.SpeechRecognition; delete window.webkitSpeechRecognition; });
    await signIn(page, 'student');
    await mockLearning(page);
    await page.goto('/student/learn');
    await expect(page.getByText('Voice input is not available in this browser; typing works.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ask with your voice' })).toHaveCount(0);
    await page.getByLabel('Your question').fill('hello');
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(page.getByText('High confidence')).toBeVisible();
  });
});

test.describe('speech text', () => {
  test('Markdown, citations and maths are turned into words', async ({ page }) => {
    await page.goto('/select-school');
    const out = await page.evaluate(async () => {
      const { speakable, takeSentences } = await import('/src/pages/student/learn/speakable.js');
      return {
        en: speakable('**Area** = l × b. So x² + 3 = 12 [S1] and 3/4 of it. See https://example.com\n- point one'),
        hi: speakable('क्षेत्रफल = l × b', 'hi'),
        split: takeSentences('Pi is 3.14 roughly. Next one! And the rest'),
      };
    });
    expect(out.en).toBe('Area equals l times b. So x squared plus 3 equals 12 and 3 over 4 of it. See point one');
    expect(out.hi).toBe('क्षेत्रफल बराबर l गुणा b');
    expect(out.split).toEqual({ sentences: ['Pi is 3.14 roughly.', 'Next one!'], rest: ' And the rest' });
  });
});

test.describe('Practice & Assessment and Revision Planner screens', () => {
  async function mockPractice(page) {
    const calls = [];
    const set = { _id: 'p1', subject: 'Mathematics', topic: 'Fractions', difficulty: 'medium', dropped: 1, usedMaterial: [{ title: 'Fractions worksheet' }],
      questions: [{ id: 'q1', format: 'numeric', difficulty: 'medium', topic: 'Fractions', prompt: 'Write 3/4 as a decimal.', hasHint: true, attempts: 0, last: null }],
      summary: { answered: 0, total: 1, score: 0, marked: 0, nextDifficulty: 'medium' } };
    let plan = null;
    await page.route('**/api/learning/**', async (route) => {
      const req = route.request();
      const path = new URL(req.url()).pathname.replace(/^\/api\/learning/, '');
      const body = req.postData() ? JSON.parse(req.postData()) : null;
      calls.push({ method: req.method(), path, body });
      const ok = (data, status = 200) => route.fulfill({ status, json: { success: true, data } });
      if (path === '/context') return ok(CONTEXT);
      if (path === '/progress') return ok({ practice: { sets: 0, answered: 0, recent: [] }, topics: [], weak: [], strong: [], tutorConversations: 0, plan: null });
      if (path === '/practice' && req.method() === 'GET') return ok([]);
      if (path === '/practice' && req.method() === 'POST') return ok(set, 201);
      if (path === '/practice/p1/answer') {
        return body.answer === '0.75'
          ? ok({ verdict: 'correct', feedback: 'Correct.', answer: '0.75', solution: '3 ÷ 4 = 0.75', summary: { answered: 1, total: 1, score: 1, marked: 1, nextDifficulty: 'hard' } })
          : ok({ verdict: 'incorrect', feedback: 'Not quite.', hint: 'Divide 3 by 4.', attempts: 1, summary: set.summary });
      }
      if (path === '/plan' && req.method() === 'GET') return ok(plan);
      if (path === '/plan' && req.method() === 'POST') {
        plan = { _id: 'pl1', title: body.examName || 'Revision plan', examDate: body.examDate, examSource: 'student', startDate: '2026-10-14', minutesPerDay: body.minutesPerDay, restDays: body.restDays,
          warnings: ['These topics did not fit before the exam with 30 minutes a day: Science: Light.'], done: 0, total: 2,
          items: [{ id: 'i1', subject: 'Maths', topic: 'Fractions', minutes: 45, date: '2026-10-15', kind: 'study', done: false }, { id: 'i2', subject: 'All subjects', topic: 'Final review of all topics', minutes: 30, date: '2026-10-16', kind: 'review', done: false }] };
        return ok(plan, 201);
      }
      if (path === '/plan/pl1/items/i1') { plan = { ...plan, done: 1, items: plan.items.map((i) => (i.id === 'i1' ? { ...i, done: true } : i)) }; return ok(plan); }
      return route.fulfill({ status: 404, json: { success: false, message: `not mocked: ${path}` } });
    });
    return calls;
  }

  test('practice: no keys up front, a hint after a wrong try, the solution after a right one, a harder set suggested', async ({ page }) => {
    await signIn(page, 'student');
    const calls = await mockPractice(page);
    await page.goto('/student/learn?tab=practice');
    await page.getByLabel('Subject').fill('Mathematics');
    await page.getByLabel('Topic or chapter').fill('Fractions');
    await page.getByRole('button', { name: 'Start practice' }).click();
    await expect(page.getByText('Write 3/4 as a decimal.')).toBeVisible();
    await expect(page.getByText('did not pass the answer checks')).toBeVisible();
    await expect(page.getByText('Based on your school material: Fractions worksheet.')).toBeVisible();
    const answer = page.getByLabel('Your answer to question 1');
    await answer.fill('0.8');
    await page.getByRole('button', { name: 'Check answer' }).click();
    await expect(page.getByText('Hint: Divide 3 by 4.')).toBeVisible();
    await expect(page.getByText('3 ÷ 4 = 0.75')).toHaveCount(0);
    await answer.fill('0.75');
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(page.getByText('3 ÷ 4 = 0.75')).toBeVisible();
    await expect(page.getByRole('button', { name: 'New hard set' })).toBeVisible();
    expect(calls.find((c) => c.path === '/practice' && c.method === 'POST').body).toMatchObject({ subject: 'Mathematics', topic: 'Fractions', count: 5 });
  });

  test('planner: own exam date, warnings shown, a task can be ticked off', async ({ page }) => {
    await signIn(page, 'student');
    const calls = await mockPractice(page);
    await page.goto('/student/learn?tab=planner');
    await page.getByLabel('I will enter the date').check();
    await page.getByLabel('Exam date').fill('2026-10-17');
    await page.getByLabel('Subject 1', { exact: true }).fill('Maths');
    await page.getByLabel('Topic 1', { exact: true }).fill('Fractions');
    await page.getByRole('button', { name: 'Make my plan' }).click();
    await expect(page.getByText('did not fit before the exam')).toBeVisible();
    await expect(page.getByText('the date you entered')).toBeVisible();
    await page.getByLabel(/Study Maths: Fractions/).click();
    await expect(page.getByLabel(/Study Maths: Fractions/)).toBeChecked();
    await expect(page.getByText('1 of 2 done')).toBeVisible();
    expect(calls.find((c) => c.path === '/plan' && c.method === 'POST').body).toMatchObject({ examDate: '2026-10-17', topics: [{ subject: 'Maths', topic: 'Fractions' }], minutesPerDay: 60, restDays: [0] });
  });
});
