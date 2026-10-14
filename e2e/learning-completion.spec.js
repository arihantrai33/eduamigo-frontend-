import { test, expect } from '@playwright/test';
import { signIn } from './helpers';

// Tutor follow-ups, re-teaching after a hard practice set, honest AI-off banner, richer diagrams, voice timing and the admin AI
// usage tab. /api/learning and /api/ai-usage are mocked: no AI provider is called and nothing is written.

const CONTEXT = (ai = { available: true }) => ({ class: '10', section: 'A', subjects: ['Mathematics', 'Science'], exams: [], capabilities: { webResearch: false, historyDays: 180, ai } });
const ndjson = (events) => `${events.map((e) => JSON.stringify(e)).join('\n')}\n`;
const final = (extra = {}) => ({ type: 'final', text: 'Here is the answer.', conversationId: 'c1', used: [], checks: [], diagrams: [], timings: { totalMs: 400 }, ...extra });

async function mockLearning(page, { context = CONTEXT(), chat = () => [{ type: 'meta', conversationId: 'c1' }, final()], practice } = {}) {
  const calls = [];
  await page.route('**/api/learning/**', async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname.replace(/^\/api\/learning/, '');
    const body = req.postData() ? JSON.parse(req.postData()) : null;
    calls.push({ method: req.method(), path, body });
    const ok = (data, status = 200) => route.fulfill({ status, json: { success: true, data } });
    if (path === '/context') return ok(context);
    if (path === '/chat') {
      const out = await chat(body);
      if (out.status) return route.fulfill({ status: out.status, json: out.json });
      return route.fulfill({ status: 200, contentType: 'application/x-ndjson', body: ndjson(out) });
    }
    if (path === '/practice' && req.method() === 'GET') return ok([]);
    if (path === '/practice' && req.method() === 'POST' && practice) return ok(practice, 201);
    if (/^\/practice\/p1\/answer$/.test(path) && practice) return ok(practice.answerResult);
    return route.fulfill({ status: 404, json: { success: false, message: `not mocked: ${path}` } });
  });
  return calls;
}

const fakeSpeech = () => {
  window.__spoken = [];
  window.__cancelled = 0;
  window.__speech = { next: 'ok', transcript: 'what is photosynthesis' };
  class FakeRec {
    start() {
      setTimeout(() => {
        this.onstart?.();
        this.onresult?.({ resultIndex: 0, results: [Object.assign([{ transcript: window.__speech.transcript }], { isFinal: true })] });
        this.onspeechend?.();
        this.onend?.();
      }, 30);
    }
    abort() { this.onend?.(); }
  }
  window.SpeechRecognition = FakeRec;
  window.webkitSpeechRecognition = FakeRec;
  window.SpeechSynthesisUtterance = function U(text) { this.text = text; };
  Object.defineProperty(window, 'speechSynthesis', {
    value: {
      speaking: false,
      getVoices: () => window.__voices || [{ lang: 'en-IN', name: 'Test' }],
      speak(u) { window.__spoken.push(u.text); (window.__spokenVoice ||= []).push(u.voice ? u.voice.lang : `none:${u.lang}`); setTimeout(() => u.onstart?.(), 5); if (!window.__holdSpeech) setTimeout(() => u.onend?.(), 20); else window.__held = u; },
      cancel() { window.__cancelled += 1; window.__held?.onend?.(); window.__held = null; },
    },
    configurable: true,
  });
};

test.describe('AI Tutor follow-ups', () => {
  test('a revision request offers a practice button that opens a checked set for that topic, never a teacher ticket', async ({ page }) => {
    await signIn(page, 'student');
    const calls = await mockLearning(page, {
      chat: () => [{ type: 'meta', conversationId: 'c1', intent: 'practice' }, final({ text: 'I can make 5 questions on Fractions.', suggest: { action: 'practice', subject: 'Mathematics', topic: 'Fractions', count: 5 } })],
    });
    await page.goto('/student/learn');
    await page.getByLabel('Your question').fill('Ab isi concept ke 5 questions poochho');
    await page.getByRole('button', { name: 'Send' }).click();
    await page.getByRole('button', { name: /Start practice: Fractions \(5 questions\)/ }).click();
    await expect(page.getByRole('tab', { name: 'Practice & Assessment' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByLabel('Topic or chapter')).toHaveValue('Fractions');
    await expect(page.getByLabel('Questions')).toHaveValue('5');
    expect(calls.some((c) => /ticket|teacher/i.test(c.path))).toBe(false);
  });

  test('pressing Enter twice sends one question; the box stays usable afterwards', async ({ page }) => {
    await signIn(page, 'student');
    const calls = await mockLearning(page, {
      chat: async () => { await new Promise((r) => setTimeout(r, 400)); return [{ type: 'meta', conversationId: 'c1' }, final()]; },
    });
    await page.goto('/student/learn');
    const box = page.getByLabel('Your question');
    await box.fill('What is a fraction?');
    await box.press('Enter');
    await box.press('Enter');
    await expect(page.getByText('Here is the answer.')).toBeVisible();
    expect(calls.filter((c) => c.path === '/chat')).toHaveLength(1);
    await box.fill('And a decimal?');
    await expect(page.getByRole('button', { name: 'Send' })).toBeEnabled();
  });

  test('Escape stops the answer being read aloud', async ({ page }) => {
    await page.addInitScript(fakeSpeech);
    await page.addInitScript(() => { window.__holdSpeech = true; });
    await signIn(page, 'student');
    await mockLearning(page);
    await page.goto('/student/learn');
    await page.getByRole('button', { name: 'Ask with your voice' }).click();
    await page.getByRole('button', { name: 'I understand, use my voice' }).click();
    await expect.poll(() => page.evaluate(() => window.__spoken.length)).toBeGreaterThan(0);
    const before = await page.evaluate(() => window.__cancelled);
    await page.getByLabel('Your question').press('Escape');
    await expect.poll(() => page.evaluate(() => window.__cancelled)).toBeGreaterThan(before);
  });

  test('?voicedebug=1 shows the measured delay on this device; without it nothing is shown', async ({ page }) => {
    await page.addInitScript(fakeSpeech);
    await signIn(page, 'student');
    await mockLearning(page);
    await page.goto('/student/learn?voicedebug=1');
    await page.getByRole('button', { name: 'Ask with your voice' }).click();
    await page.getByRole('button', { name: 'I understand, use my voice' }).click();
    await expect(page.getByTestId('voice-timing')).toContainText('after you stopped speaking');
    await page.goto('/student/learn');
    await page.getByRole('button', { name: 'Ask with your voice' }).click();
    await expect(page.getByText('Here is the answer.')).toBeVisible();
    await expect(page.getByTestId('voice-timing')).toHaveCount(0);
  });
});

test.describe('Voice chosen for the language', () => {
  const VOICES = [{ lang: 'en-US', name: 'Basic US' }, { lang: 'en-IN', name: 'Rishi' }, { lang: 'hi-IN', name: 'Google हिन्दी' }, { lang: 'hi-IN', name: 'Compact Hindi' }];
  const ask = async (page, language, text) => {
    await signIn(page, 'student');
    await mockLearning(page, { chat: () => [{ type: 'meta', conversationId: 'c1', language }, { type: 'delta', text }, final({ text })] });
    await page.goto('/student/learn');
    await page.getByRole('button', { name: 'Ask with your voice' }).click();
    await page.getByRole('button', { name: 'I understand, use my voice' }).click();
    await expect.poll(() => page.evaluate(() => (window.__spokenVoice || []).length)).toBeGreaterThan(0);
  };

  test('a Hinglish or Hindi answer is spoken by the best Hindi voice, never the English one', async ({ page }) => {
    await page.addInitScript(fakeSpeech);
    await page.addInitScript((v) => { window.__voices = v; }, VOICES);
    await ask(page, 'hinglish', 'देखो, photosynthesis में plants sunlight से खाना बनाते हैं।');
    const used = await page.evaluate(() => window.__spokenVoice);
    expect(used.every((v) => v === 'hi-IN')).toBe(true);
    expect(await page.evaluate(() => window.__spoken.join(' '))).toContain('photosynthesis');
  });

  test('an English answer uses the Indian English voice', async ({ page }) => {
    await page.addInitScript(fakeSpeech);
    await page.addInitScript((v) => { window.__voices = v; }, VOICES);
    await ask(page, 'en', 'A fraction is a part of a whole.');
    expect(await page.evaluate(() => window.__spokenVoice)).toEqual(['en-IN']);
  });

  test('with no Hindi voice installed the student is told, instead of hearing an English accent without explanation', async ({ page }) => {
    await page.addInitScript(fakeSpeech);
    await page.addInitScript(() => { window.__voices = [{ lang: 'en-US', name: 'Basic US' }]; });
    await ask(page, 'hi', 'देखो, यह एक उदाहरण है।');
    await expect(page.getByText('This device has no Hindi voice installed')).toBeVisible();
  });
});

test.describe('Why an answer failed', () => {
  const failWith = (extra) => () => [{ type: 'meta', conversationId: 'c1' }, { type: 'error', code: 'AI_FAILED', ...extra }];
  const ask = async (page) => {
    await page.goto('/student/learn');
    await page.getByLabel('Your question').fill('What is a fraction?');
    await page.getByRole('button', { name: 'Send' }).click();
    return page.getByRole('alert');
  };

  test('a temporary network problem says so and offers Try again, which asks the same question again', async ({ page }) => {
    await signIn(page, 'student');
    let n = 0;
    const calls = await mockLearning(page, { chat: () => { n += 1; return n === 1 ? failWith({ reason: 'network', retryable: true, message: 'The AI Tutor could not reach the AI service because of a temporary network problem on the server. Please try again in a moment.' })() : [{ type: 'meta', conversationId: 'c1' }, final()]; } });
    const alert = await ask(page);
    await expect(alert).toContainText('Temporary network problem');
    await expect(alert).toContainText('temporary network problem on the server');
    await alert.getByRole('button', { name: 'Try again' }).click();
    await expect(page.getByText('Here is the answer.')).toBeVisible();
    expect(calls.filter((c) => c.path === '/chat').map((c) => c.body.message)).toEqual(['What is a fraction?', 'What is a fraction?']);
  });

  test('a busy service and a slow one are named differently from a network problem', async ({ page }) => {
    await signIn(page, 'student');
    await mockLearning(page, { chat: failWith({ reason: 'busy', retryable: true, message: 'The AI service is busy or temporarily unavailable. Please try again in a minute.' }) });
    const alert = await ask(page);
    await expect(alert).toContainText('The AI service is busy');
    await expect(alert).not.toContainText('network');
    await expect(alert.getByRole('button', { name: 'Try again' })).toBeVisible();
  });

  test('an AI that is set up wrongly is not something to retry', async ({ page }) => {
    await signIn(page, 'student');
    await mockLearning(page, { chat: failWith({ reason: 'config', retryable: false, message: "The AI Tutor cannot answer because the AI service is not set up correctly on this server. Please tell your school's administrator." }) });
    const alert = await ask(page);
    await expect(alert).toContainText('The AI service is not available');
    await expect(alert).toContainText("tell your school's administrator");
    await expect(alert.getByRole('button', { name: 'Try again' })).toHaveCount(0);
  });

  test('a school that used its AI allowance gets no Try again; one answer at a time offers it', async ({ page }) => {
    await signIn(page, 'student');
    let code = 'AI_LIMIT';
    await mockLearning(page, { chat: () => ({ status: 429, json: { success: false, code, message: code === 'AI_LIMIT' ? "Your school's monthly AI allowance has been used." : 'Please wait for the current answer to finish before asking again.' } }) });
    let alert = await ask(page);
    await expect(alert).toContainText('AI limit reached');
    await expect(alert.getByRole('button', { name: 'Try again' })).toHaveCount(0);
    await page.getByRole('button', { name: 'New chat' }).click();
    code = 'AI_BUSY';
    alert = await ask(page);
    await expect(alert).toContainText('Please wait for the current answer');
    await expect(alert.getByRole('button', { name: 'Try again' })).toBeVisible();
  });

  test('a lost connection between the browser and the server is a network problem with Try again', async ({ page }) => {
    await signIn(page, 'student');
    await mockLearning(page);
    await page.route('**/api/learning/chat', (route) => route.abort('connectionfailed'));
    const alert = await ask(page);
    await expect(alert).toContainText('Temporary network problem');
    await expect(alert.getByRole('button', { name: 'Try again' })).toBeVisible();
  });
});

test.describe('Honest AI availability', () => {
  test('a server with the AI off says so on the Learning AI screen, and the planner still opens', async ({ page }) => {
    await signIn(page, 'student');
    await mockLearning(page, { context: CONTEXT({ available: false, reason: 'off' }) });
    await page.goto('/student/learn');
    await expect(page.getByRole('status').filter({ hasText: 'switched off on this server' })).toBeVisible();
    await expect(page.getByRole('status').filter({ hasText: 'ASSISTANT_AI' })).toHaveCount(0);
    await page.getByRole('tab', { name: 'Revision Planner' }).click();
    await expect(page.getByRole('tab', { name: 'Revision Planner' })).toHaveAttribute('aria-selected', 'true');
  });

  test('no banner when the AI is available', async ({ page }) => {
    await signIn(page, 'student');
    await mockLearning(page);
    await page.goto('/student/learn');
    await expect(page.getByLabel('Your question')).toBeVisible();
    await expect(page.getByText('switched off on this server')).toHaveCount(0);
    await expect(page.getByText('No AI provider is configured')).toHaveCount(0);
  });
});

test.describe('Diagrams and hidden blocks', () => {
  test('a two-line graph has a legend and axis labels; a concept map is drawn; context blocks are never shown', async ({ page }) => {
    await signIn(page, 'student');
    await mockLearning(page, {
      chat: () => [
        { type: 'meta', conversationId: 'c1' },
        { type: 'delta', text: 'Compare the two lines. ```context\n{"topic":"Linear equations"' },
        final({
          text: 'Compare the two lines.\n\n[[diagram:0]]\n\n[[diagram:1]]',
          diagrams: [
            { type: 'graph', title: 'y = x and y = 2x', xMin: 0, xMax: 4, xLabel: 'x', yLabel: 'y', alt: 'Two straight lines through the origin; y = 2x rises faster than y = x.',
              series: [{ label: 'y = x', points: [[0, 0], [2, 2], [4, 4]] }, { label: 'y = 2x', points: [[0, 0], [2, 4], [4, 8]] }], points: [[0, 0], [2, 2], [4, 4]] },
            { type: 'conceptmap', title: 'Fractions', center: 'Fractions', branches: [{ label: 'Proper', children: ['3/4'] }, { label: 'Improper', children: ['5/4'] }, { label: 'Mixed', children: ['1 1/4'] }], alt: 'Concept map: Fractions branch into proper, improper and mixed fractions.' },
          ],
        }),
      ],
    });
    await page.goto('/student/learn');
    await page.getByLabel('Your question').fill('Graph y = x and y = 2x');
    await page.getByRole('button', { name: 'Send' }).click();
    const log = page.getByRole('log', { name: 'Conversation' });
    const graph = log.getByRole('img', { name: /Two straight lines through the origin/ });
    await expect(graph).toBeVisible();
    await expect(graph).toContainText('y = 2x');
    await expect(graph).toContainText('x');
    await expect(log.getByRole('img', { name: /Concept map: Fractions branch/ })).toBeVisible();
    await expect(log).not.toContainText('```');
    await expect(log).not.toContainText('"topic"');
  });
});

test.describe('Cycle diagrams with long step text', () => {
  test('the ring shows short names and the full steps are listed under the picture', async ({ page }) => {
    await signIn(page, 'student');
    await mockLearning(page, {
      chat: () => [{ type: 'meta', conversationId: 'c1' }, final({ text: 'The water cycle.\n\n[[diagram:0]]', diagrams: [{ type: 'cycle', title: 'Water cycle', alt: 'Water cycle: Evaporation, Condensation, Precipitation.',
        steps: ['Evaporation: water rises from seas', 'Condensation: vapour cools into clouds', 'Precipitation: rain falls to the ground'] }] })],
    });
    await page.goto('/student/learn');
    await page.getByLabel('Your question').fill('Draw the water cycle');
    await page.getByRole('button', { name: 'Send' }).click();
    const fig = page.getByRole('img', { name: /Water cycle: Evaporation/ });
    await expect(fig).toBeVisible();
    await expect(fig.locator('svg text', { hasText: 'Evaporation' })).toHaveText('Evaporation');
    await expect(fig.locator('.ea-diagram__legend li').first()).toHaveText('Evaporation: water rises from seas');
  });
});

test.describe('Re-teach after a hard practice set', () => {
  test('"Teach me this again" returns to the tutor with the question typed, not sent', async ({ page }) => {
    await signIn(page, 'student');
    const set = {
      _id: 'p1', subject: 'Mathematics', topic: 'Fractions', difficulty: 'medium', dropped: 0, usedMaterial: [],
      questions: [{ id: 'q1', format: 'numeric', difficulty: 'medium', topic: 'Fractions', prompt: 'Write 3/4 as a decimal.', hasHint: true, attempts: 0, last: null }],
      summary: { answered: 0, total: 1, score: 0, marked: 0, nextDifficulty: 'medium', enoughEvidence: false },
      answerResult: { verdict: 'incorrect', feedback: 'Not quite.', hint: 'Divide 3 by 4.', attempts: 1,
        summary: { answered: 1, total: 1, score: 0, marked: 1, enoughEvidence: true, struggling: true, nextDifficulty: 'easy', reteach: { subject: 'Mathematics', topics: ['Fractions'] } } },
    };
    const calls = await mockLearning(page, { practice: set });
    await page.goto('/student/learn?tab=practice');
    await page.getByLabel('Subject').fill('Mathematics');
    await page.getByRole('button', { name: 'Start practice' }).click();
    await page.getByLabel('Your answer to question 1').fill('0.8');
    await page.getByRole('button', { name: 'Check answer' }).click();
    await page.getByRole('button', { name: 'Teach me this again' }).click();
    await expect(page.getByRole('tab', { name: 'AI Tutor' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByLabel('Your question')).toHaveValue(/did not understand Fractions in Mathematics/);
    expect(calls.filter((c) => c.path === '/chat')).toHaveLength(0);
  });
});

test.describe('Admin: AI usage and cost', () => {
  const SUMMARY = {
    period: '2026-10',
    totals: { calls: 12, failed: 1, cacheHits: 3, inputTokens: 9000, outputTokens: 3000, tokens: 12000, costEstimate: 0, unpricedCalls: 12, estimatedTokenCalls: 2, voiceRequests: 4, audioSeconds: 0, currency: null },
    byFeature: [{ feature: 'tutor', label: 'AI Tutor', calls: 8, failed: 1, cacheHits: 3, inputTokens: 6000, outputTokens: 2000, costEstimate: 0, unpricedCalls: 8 }, { feature: 'ask', label: 'EduAmigo Ask', calls: 4, failed: 0, cacheHits: 0, inputTokens: 3000, outputTokens: 1000, costEstimate: 0, unpricedCalls: 4 }],
    limits: [
      { key: 'tokens', label: 'Monthly AI tokens', used: 12000, limit: 15000, unit: 'tokens', ratio: 0.8, state: 'warning' },
      { key: 'budget', label: 'Monthly AI cost budget', used: null, limit: 50, unit: 'cost', state: 'unenforceable', note: 'No model price is configured (AI_PRICING), so the cost cannot be estimated and this budget is not enforced.' },
    ],
    alerts: [{ key: 'tokens', level: 'warning', message: 'Monthly AI tokens: 80% used.' }, { key: 'budget', level: 'info', message: 'No model price is configured (AI_PRICING), so the cost cannot be estimated and this budget is not enforced.' }],
    cost: { kind: 'estimate', note: "Estimated from tokens x the prices configured for this deployment. It is not the provider's invoice; check the provider's billing portal for the actual charge.", pricesConfigured: false, currency: null, estimated: null, unpricedCalls: 12, tokensReportedByProvider: 10, tokensEstimatedCalls: 2, actualProviderBilling: null },
    voice: { requests: 4, providerBilledSeconds: 0, note: "Spoken questions use the browser's own speech service; no provider-billed voice session is configured." },
    zeroUse: false,
    provider: { available: true, reason: null },
  };

  test('shows calls, tokens, an honest "not priced" cost, limits with warnings, and no student content', async ({ page }) => {
    await signIn(page, 'admin');
    await page.route('**/api/ai-usage/summary**', (route) => route.fulfill({ json: { success: true, data: SUMMARY } }));
    await page.goto('/admin/ask');
    await page.getByRole('tab', { name: 'AI usage and cost' }).click();
    const panel = page.getByRole('region', { name: 'AI usage and cost' });
    await expect(panel).toContainText('This month (2026-10)');
    await expect(panel).toContainText('12,000');
    await expect(panel).toContainText('not priced');
    await expect(panel).toContainText("not the provider's invoice");
    await expect(panel).toContainText('No model prices are configured');
    await expect(panel).toContainText('Monthly AI tokens');
    await expect(panel).toContainText('80% used');
    await expect(panel).toContainText('cannot be enforced');
    await expect(panel.getByRole('row', { name: /AI Tutor/ })).toContainText('8');
    await expect(panel).toContainText('Nothing in this table contains what students asked');
  });

  test('a school that used no AI says no variable cost was incurred', async ({ page }) => {
    await signIn(page, 'admin');
    await page.route('**/api/ai-usage/summary**', (route) => route.fulfill({ json: { success: true, data: { ...SUMMARY, totals: { ...SUMMARY.totals, calls: 0, cacheHits: 0, tokens: 0, failed: 0 }, byFeature: [], limits: [], alerts: [], zeroUse: true } } }));
    await page.goto('/admin/ask');
    await page.getByRole('tab', { name: 'AI usage and cost' }).click();
    await expect(page.getByText('No AI was used this month. No variable AI cost was incurred.')).toBeVisible();
  });
});
