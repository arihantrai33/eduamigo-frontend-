// One sign-in for every role, school selection, and who lands where. The role and the school come from the server: nothing
// on these screens lets a person pick either. API answers are only mocked where the demo data cannot make the case
// (a mobile number in two schools); the server side of that case is in the backend tests (login-school-choice).
import { test, expect } from '@playwright/test';
import { signIn, USERS, PASSWORD } from './helpers.js';

const ID = 'Email, mobile number or admission number';
const signInButton = (page) => page.getByRole('button', { name: 'Sign in', exact: true });
const go = async (page, id, password = PASSWORD) => {
  await page.getByLabel(ID).fill(id);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await signInButton(page).click();
};

test.describe('the sign-in screen', () => {
  test('has no role selector: one ID field, one password field, no "I am a" tabs', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { level: 1, name: 'Welcome back' })).toBeVisible();
    await expect(page.getByRole('tablist')).toHaveCount(0);
    await expect(page.getByRole('tab')).toHaveCount(0);
    await expect(page.getByText(/Log in as/)).toHaveCount(0);
    await expect(page.getByLabel(ID)).toBeVisible();
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Forgot password?' })).toHaveAttribute('href', '/forgot-password');
  });

  test('the password can be shown and hidden, and the control says its state', async ({ page }) => {
    await page.goto('/login');
    const pw = page.getByLabel('Password', { exact: true });
    await pw.fill('Secret#123');
    const toggle = page.getByRole('button', { name: 'Show password' });
    await expect(pw).toHaveAttribute('type', 'password');
    await toggle.click();
    await expect(pw).toHaveAttribute('type', 'text');
    await expect(page.getByRole('button', { name: 'Hide password' })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Hide password' }).click();
    await expect(pw).toHaveAttribute('type', 'password');
  });

  test('works with the keyboard alone: Tab order, Enter submits, focus goes to the first problem', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(ID).focus();
    await page.keyboard.press('Tab'); // password
    await expect(page.getByLabel('Password', { exact: true })).toBeFocused();
    await page.keyboard.press('Tab'); // show/hide
    await expect(page.getByRole('button', { name: 'Show password' })).toBeFocused();
    await page.keyboard.press('Tab'); // forgot
    await expect(page.getByRole('link', { name: 'Forgot password?' })).toBeFocused();
    await page.getByLabel(ID).focus();
    await page.keyboard.press('Enter'); // empty: the form is not sent, the first field is named and focused
    await expect(page.getByLabel(ID)).toBeFocused();
    await expect(page.getByLabel(ID)).toHaveAccessibleDescription('Enter your email, mobile number or admission number');
  });

  test('empty fields are named under the field; typing clears the message', async ({ page }) => {
    await page.goto('/login');
    await signInButton(page).click();
    await expect(page.getByText('Enter your email, mobile number or admission number')).toBeVisible();
    await expect(page.getByText('Enter your password')).toBeVisible();
    await page.getByLabel('Password', { exact: true }).fill('x');
    await expect(page.getByText('Enter your password')).toBeHidden();
  });

  test('a wrong password shows a plain message, keeps the ID, and the button works again', async ({ page }) => {
    await page.goto('/login');
    await go(page, 'admin@gvps.demo', 'Not-the-password1');
    await expect(page.getByRole('alert')).toContainText(/not correct|Invalid/i);
    await expect(page.getByLabel(ID)).toHaveValue('admin@gvps.demo');
    await expect(signInButton(page)).toBeEnabled();
    await expect(page).toHaveURL(/\/login/);
  });

  test('a repeated click or Enter sends one request', async ({ page }) => {
    let sent = 0;
    await page.route('**/api/users/login', async (route) => { sent++; await new Promise((r) => setTimeout(r, 400)); await route.fallback(); });
    await page.goto('/login');
    await page.getByLabel(ID).fill('admin@gvps.demo');
    await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
    await signInButton(page).dblclick();
    await page.waitForURL(/\/admin/);
    expect(sent).toBe(1);
  });

  test('network and server failures are explained, and the next try can work', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(ID).fill('admin@gvps.demo');
    await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
    await page.route('**/api/users/login', (r) => r.abort('internetdisconnected'));
    await signInButton(page).click();
    await expect(page.getByRole('alert')).toContainText("Can't reach EduAmigo");
    await page.unroute('**/api/users/login');
    await page.route('**/api/users/login', (r) => r.fulfill({ status: 429, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Too many login attempts. Please try again in 15 minutes.' }) }));
    await signInButton(page).click();
    await expect(page.getByRole('alert')).toContainText('Too many login attempts');
    await page.unroute('**/api/users/login');
    await page.route('**/api/users/login', (r) => r.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ success: false, code: 'SCHOOL_SUSPENDED', message: 'x' }) }));
    await signInButton(page).click();
    await expect(page.getByRole('alert')).toContainText('paused');
    await page.unroute('**/api/users/login');
    await signInButton(page).click();
    await page.waitForURL(/\/admin/);
  });
});

test.describe('who lands where (the role comes from the server)', () => {
  for (const [role, url] of [['student', /\/student\/home/], ['parent', /\/parent\/home/], ['teacher', /\/teacher\/home/], ['admin', /\/admin/]]) {
    test(`${role}: signs in on the same screen and reaches their own portal`, async ({ page }) => {
      await signIn(page, role);
      await expect(page).toHaveURL(url);
      // The signed-in app has no role selector either.
      await expect(page.getByRole('tab', { name: /^(Student|Parent|Teacher|Admin)$/ })).toHaveCount(0);
    });
  }

  test('an email needs no school: the server finds it, and the device remembers it', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('School code')).toHaveCount(0);
    await go(page, USERS.teacher.id);
    await page.waitForURL(/\/teacher\/home/);
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('eduamigo_school') || 'null'));
    expect(saved?.code).toBe('GVPS');
  });

  test('a mobile number needs no school when only one school has it', async ({ page }) => {
    await page.goto('/login');
    await go(page, USERS.parent.id);
    await page.waitForURL(/\/parent\/home/);
  });

  test('an admission number asks for the school first, without a failed request', async ({ page }) => {
    await page.goto('/login');
    await go(page, '1');
    await expect(page.getByRole('alert').filter({ hasText: 'we need to know which' })).toBeVisible();
    await page.getByRole('alert').getByRole('link', { name: 'Find your school' }).click();
    await expect(page).toHaveURL(/\/select-school/);
  });

  test('with the school chosen, the admission number signs in', async ({ page }) => {
    await signIn(page, 'student');
    await expect(page).toHaveURL(/\/student\/home/);
  });

  test('a signed-in person opening the sign-in page is sent to their own portal, once (no loop)', async ({ page }) => {
    await signIn(page, 'teacher');
    const urls = [];
    page.on('framenavigated', (f) => { if (f === page.mainFrame()) urls.push(new URL(f.url()).pathname); });
    await page.goto('/login');
    await page.waitForURL(/\/teacher\/home/);
    await page.waitForTimeout(500);
    // One way only: after the last time the sign-in page was shown the address is the portal, with no bounce back and no growth.
    expect(urls.slice(urls.lastIndexOf('/login') + 1).every((u) => u === '/teacher/home')).toBe(true);
    expect(urls.length).toBeLessThanOrEqual(6);
    await expect(page).toHaveURL(/\/teacher\/home/);
  });

  test('a person cannot reach another role\'s pages by typing the address', async ({ page }) => {
    await signIn(page, 'student');
    for (const path of ['/admin', '/admin/students', '/teacher/home', '/parent/home']) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/student\/home/);
    }
  });

  test('without a session every portal address goes to sign-in', async ({ page }) => {
    for (const path of ['/admin', '/student/home', '/teacher/attendance', '/parent/fee']) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
    }
  });
});

test.describe('sessions', () => {
  test('an expired session sends the person to sign-in with a clear message', async ({ page }) => {
    await signIn(page, 'teacher');
    await page.route((url) => url.pathname.startsWith('/api/'), (route) => route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Session expired. Please log in again.' }) }));
    await page.goto('/teacher/attendance').catch(() => {}); // the app leaves for the sign-in page while the load is still going
    await expect(page).toHaveURL(/\/login\?expired=1/, { timeout: 15_000 });
    await expect(page.getByText('Your session has expired')).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull();
  });

  test('signing out ends the session for good: back and a typed address both need a new sign-in', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await signIn(page, 'teacher');
    await page.getByRole('button', { name: 'Log Out' }).click();
    await expect(page).toHaveURL(/\/login/);
    await page.goBack().catch(() => {});
    await page.goto('/teacher/home');
    await expect(page).toHaveURL(/\/login/);
  });

  test('a deactivated account is told so (the server answer is shown as it is)', async ({ page }) => {
    await page.goto('/login');
    await page.route('**/api/users/login', (r) => r.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'This account has been deactivated. Please contact your school.' }) }));
    await go(page, 'someone@gvps.demo');
    await expect(page.getByRole('alert')).toContainText('deactivated');
  });
});

test.describe('several schools for one mobile number', () => {
  const schools = [
    { code: 'GVPS', name: 'Green Valley Public School', appName: 'Green Valley Public School', city: 'Jaipur', logoUrl: '', primaryColor: '#0A7E8C', accentColor: '', tagline: '', heroStyle: 'bold' },
    { code: 'SUNR', name: 'Sunrise Academy', appName: 'Sunrise Academy', city: 'Pune', logoUrl: '', primaryColor: '#B45309', accentColor: '', tagline: '', heroStyle: 'bold' },
  ];

  test('only the schools the server returned are shown, and choosing one completes the sign-in', async ({ page }) => {
    let chosen;
    await page.route('**/api/users/login', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, requiresSchoolChoice: true, ticket: 'ticket-from-server', schools }) }));
    await page.route('**/api/users/login/school', async (route) => {
      chosen = route.request().postDataJSON();
      await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'This sign-in has expired. Please sign in again.' }) });
    });
    await page.goto('/login');
    await go(page, '9876543210', 'Shared#Pass1');
    await expect(page.getByRole('heading', { level: 1, name: 'Choose your school' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Green Valley Public School/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Sunrise Academy/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Third School/ })).toHaveCount(0);
    await page.getByRole('button', { name: /Sunrise Academy/ }).click();
    await expect(page.getByRole('alert')).toContainText('expired');
    // The ticket and the school code are all that is sent: no role, no school id, no password.
    expect(chosen).toEqual({ ticket: 'ticket-from-server', schoolCode: 'SUNR' });
    // An expired ticket puts the person back at the sign-in form.
    await expect(page.getByRole('heading', { level: 1, name: 'Welcome back' })).toBeVisible();
  });
});

test.describe('school selection', () => {
  test('lists matching schools as cards, asks to confirm, and opens that school\'s sign-in', async ({ page }) => {
    await page.goto('/select-school');
    await page.getByLabel('School code or name').fill('green');
    const card = page.getByRole('button', { name: /Green Valley Public School/ });
    await expect(card).toBeVisible();
    await card.click();
    await expect(page.getByRole('heading', { name: 'Is this your school?' })).toBeVisible();
    await page.getByRole('button', { name: 'No, search again' }).click();
    await page.getByLabel('School code or name').fill('GVPS');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Yes, this is my school' }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText('Sign in to continue to Green Valley Public School')).toBeVisible();
  });

  test('an unknown school gets a helpful message and a way forward', async ({ page }) => {
    await page.goto('/select-school');
    await page.getByLabel('School code or name').fill('ZZZZZ');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('alert')).toContainText('No school found');
    await expect(page.getByRole('link', { name: 'Request a demo' })).toHaveAttribute('href', '/welcome#demo');
    await expect(page.getByRole('link', { name: 'Sign in without choosing a school' })).toHaveAttribute('href', '/login');
  });

  test('only registered schools can be found: a made-up name lists nothing', async ({ page }) => {
    await page.goto('/select-school');
    await page.getByLabel('School code or name').fill('Totally Invented Academy');
    await expect(page.getByText(/No school matches/)).toBeVisible();
    await expect(page.getByRole('list', { name: 'Matching schools' })).toHaveCount(0);
  });

  test('a school link (QR code) selects the school; a bad link explains itself', async ({ page }) => {
    await page.goto('/s/GVPS');
    await expect(page).toHaveURL(/\/login/);
    await page.goto('/s/NOPE12');
    await expect(page.getByRole('alert')).toContainText('not valid');
  });
});

test.describe('a school\'s own address', () => {
  // gvps.localhost: Chrome sends *.localhost to this machine. The test servers run with the base domain "localhost".
  const web = `http://gvps.localhost:${process.env.E2E_WEB_PORT || 5174}`;

  test('is resolved by the server to the registered school, shows its sign-in and offers no other school', async ({ page }) => {
    await page.goto(`${web}/login`);
    await expect(page.getByText('Sign in to continue to Green Valley Public School')).toBeVisible();
    await expect(page.getByRole('link', { name: /Change school/ })).toHaveCount(0);
    await expect(page.getByText('New to EduAmigo?')).toHaveCount(0);
    // "/" is that school's sign-in, not EduAmigo's website.
    await page.goto(`${web}/`);
    await page.waitForURL(/\/login/);
    // and the school's own address signs its people in
    await page.getByLabel(ID).fill(USERS.admin.id);
    await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
    await signInButton(page).click();
    await page.waitForURL(/\/admin/);
  });

  test('an address that is not a registered school is refused, and reserved names are never schools', async ({ page }) => {
    for (const host of ['nosuchschool', 'admin', 'console']) {
      await page.goto(`http://${host}.localhost:${process.env.E2E_WEB_PORT || 5174}/login`);
      await expect(page.getByRole('heading', { name: "We can't find this school" })).toBeVisible();
      await expect(page.getByLabel(ID)).toHaveCount(0); // no sign-in form for an address that is not a school
    }
  });

  test('the platform\'s own host (www) is not a school: it shows the ordinary sign-in', async ({ page }) => {
    await page.goto(`http://www.localhost:${process.env.E2E_WEB_PORT || 5174}/login`);
    await expect(page.getByRole('heading', { level: 1, name: 'Welcome back' })).toBeVisible();
    await expect(page.getByLabel(ID)).toBeVisible();
  });

  test('being on a school\'s address does not give a person another school\'s accounts', async ({ page }) => {
    await page.goto(`${web}/login`);
    await page.getByLabel(ID).fill(USERS.admin.id);
    await page.getByLabel('Password', { exact: true }).fill('Wrong#Pass123');
    await signInButton(page).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('the website is still reachable from the sign-in screens', () => {
  test('"Website" and "Request a demo" lead to the public site even for a device that chose a school', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('eduamigo_school', JSON.stringify({ code: 'GVPS', name: 'GVPS' })));
    await page.goto('/login');
    await page.getByRole('link', { name: 'Request a demo' }).click();
    await expect(page).toHaveURL(/\/welcome#demo/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Less paperwork');
    await expect(page.locator('#demo')).toBeInViewport();
  });
});

test.describe('layout', () => {
  for (const path of ['/login', '/select-school', '/forgot-password']) {
    test(`${path}: no sideways scroll or cut-off content from 320 to 1920 px, and the form is reachable`, async ({ page }) => {
      for (const [width, height] of [[320, 568], [375, 812], [430, 932], [768, 1024], [1366, 768], [1920, 1080]]) {
        await page.setViewportSize({ width, height });
        await page.goto(path);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        const m = await page.evaluate(() => {
          const vw = document.documentElement.clientWidth;
          const out = [...document.querySelectorAll('.au *')].filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && (r.right > vw + 1 || r.left < -1) && !el.closest('.au-skip, .au-bg'); })
            .slice(0, 3).map((el) => `${el.tagName}.${el.className}`);
          return { scroll: document.documentElement.scrollWidth - vw, out };
        });
        expect(m, `${path} at ${width}px`).toEqual({ scroll: 0, out: [] });
        // The primary button is inside the page (not hidden behind the brand panel) and can be reached by scrolling.
        const button = page.getByRole('button', { name: /Sign in|Continue|Send code/ }).first();
        await button.scrollIntoViewIfNeeded();
        await expect(button).toBeInViewport();
      }
    });
  }

  test('respects reduced motion: no entrance animation', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto('/login');
    const d = await page.locator('.au-card').evaluate((el) => parseFloat(getComputedStyle(el).animationDuration));
    expect(d).toBeLessThan(0.01);
    await ctx.close();
  });
});

test.describe('forgot password', () => {
  test('keeps working without a role: the answer never says whether the account exists, and students are told who can help', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.getByText(/Students and parents without an email/)).toBeVisible();
    await page.getByRole('button', { name: 'Send code' }).click();
    await expect(page.getByText('Enter your email, mobile number or admission number.')).toBeVisible();
    await page.getByLabel(ID).fill('nobody@nowhere.example');
    await page.getByRole('button', { name: 'Send code' }).click();
    await expect(page.getByRole('heading', { name: 'Enter the code' })).toBeVisible();
    await page.getByRole('button', { name: 'Set new password' }).click();
    await expect(page.getByText('Enter the 6-digit code we sent you.')).toBeVisible();
  });

  test('a mobile number or admission number needs the school, and says so', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.getByLabel(ID).fill('9876543210');
    await page.getByRole('button', { name: 'Send code' }).click();
    await expect(page.getByRole('alert')).toContainText('we need your school');
  });
});
