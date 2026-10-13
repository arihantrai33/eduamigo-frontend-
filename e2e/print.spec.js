import { test, expect } from '@playwright/test';
import { signIn } from './helpers';

// Printed documents: the app around them is left out, they use the full paper width, and they break into pages
// cleanly. The documents' data is mocked in the browser (long names and addresses, many rows); nothing is written.

const SCHOOL = { name: 'Shri Saraswati Vidya Mandir Senior Secondary Residential School and Junior College of Science', address: 'Plot 1234, Sector 21-B, Near Old Railway Over Bridge, Behind District Collectorate, Gaya Road, Chakand, Bihar 804404', phone: '+91 98765 43210', email: 'office@school.edu.in', principal: 'Dr. Meenakshi Sundaram' };
const columns = [{ key: 'ut1', label: 'Unit Test 1' }, { key: 'hy', label: 'Half Yearly' }];
const card = (subjects) => ({
  student: { _id: 's1', name: 'Venkataraghavan Subramaniam Ramachandran Iyer', class: '10', section: 'A', rollNumber: '1', dateOfBirth: '2011-04-05', parentName: 'Mr. Subramaniam Iyer' },
  attendance: { workingDays: 210, present: 198, percentage: 94.3 }, columns,
  subjects: Array.from({ length: subjects }, (_, k) => ({ subject: `Subject ${k + 1}`, passed: true, cells: { ut1: { obtained: 20, max: 25 }, hy: { obtained: 40, max: 50 } }, obtained: 60, max: 75, percentage: 80, grade: 'A' })),
  totals: { obtained: 60 * subjects, max: 75 * subjects, percentage: 80, grade: 'A', result: 'Pass', belowIn: [] }, rank: 1, classSize: 1,
  remarks: 'Steady progress; revise numericals regularly.',
});
const report = (subjects) => ({ school: SCHOOL, term: 'Term 1', academicYear: '2026-27', generatedOn: '2026-10-13', cards: [card(subjects)] });
const receipt = { school: SCHOOL, payment: { receiptNo: 'R-000123', paidAt: '2026-10-13T09:30:00Z', amount: 12500, mode: 'Bank transfer', reference: 'UTR SBIN0026101300012345678' }, student: { name: 'Venkataraghavan Subramaniam Ramachandran Iyer', class: '10', section: 'A', rollNumber: '1' }, fee: { feeType: 'Tuition', month: 'October', year: 2026, amount: 25000, academicYear: '2026-27', dueDate: '2026-10-10' }, paidToDate: 20000, balanceAfter: 5000 };
const tc = (rows) => ({ tcNumber: 'TC/2026/0001', issuedAt: '2026-10-13', school: { ...SCHOOL, city: 'Gaya' }, student: { name: 'Venkataraghavan Subramaniam Ramachandran Iyer', admissionNo: 'ADM/2014/00045', dateOfBirth: '2011-04-05', gender: 'Male', parentName: 'Mr. Subramaniam Iyer', address: SCHOOL.address, admittedOn: '2014-04-01', lastClass: '10-A', leftOn: '2026-03-31', reason: 'Parent transferred to another city', status: 'left' }, history: Array.from({ length: rows }, (_, i) => ({ session: `${1990 + i}-${String((91 + i) % 100).padStart(2, '0')}`, class: `${(i % 12) + 1}-A`, result: 'promoted' })) });

const mock = (page, pattern, data) => page.route(pattern, (r) => (r.request().method() === 'GET' ? r.fulfill({ json: { success: true, data } }) : r.fallback()));
const pdfPages = async (page) => ((await page.pdf({ preferCSSPageSize: true, printBackground: true })).toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;

// In print media: what of the app shell is still shown, and how wide the document is compared with the page.
async function printLayout(page, docSelector) {
  await page.emulateMedia({ media: 'print' });
  const out = await page.evaluate((sel) => {
    const shown = (el) => { const s = getComputedStyle(el); return s.display !== 'none' && s.visibility !== 'hidden' && el.getBoundingClientRect().height > 0; };
    const doc = document.querySelector(sel);
    // Read at once, as the printout is taken: html, body and every wrapper must already be white (the app's colour
    // transitions and the admin body's grey used to leave a grey block under the document).
    const notWhite = [];
    for (let el = doc.parentElement; el; el = el.parentElement) {
      const bg = getComputedStyle(el).backgroundColor;
      if (bg !== 'rgb(255, 255, 255)') notWhite.push(`${el.tagName}.${el.className} ${bg}`);
    }
    return {
      chrome: [...document.querySelectorAll('aside, nav, .ea-ask-fab, .no-print, [role="status"]')].filter(shown).map((e) => e.className || e.tagName),
      widthShare: doc.getBoundingClientRect().width / document.body.getBoundingClientRect().width,
      notWhite,
    };
  }, docSelector);
  return out;
}

test('a report card prints alone on one A4 page at full width; a long one breaks between rows', async ({ page }) => {
  await signIn(page, 'admin');
  await mock(page, '**/api/report-cards/student/**', report(12));
  await page.goto('/report-card?studentId=s1');
  await expect(page.getByText('Subject 12', { exact: true })).toBeVisible();
  const layout = await printLayout(page, '.rc-page');
  expect(layout.chrome).toEqual([]);
  expect(layout.notWhite).toEqual([]);
  expect(layout.widthShare).toBeGreaterThan(0.95); // it used to print in a 420 px column
  expect(await pdfPages(page)).toBe(1); // the footer used to fall onto a second page

  await page.emulateMedia({ media: 'screen' });
  await page.unrouteAll();
  await mock(page, '**/api/report-cards/student/**', report(40));
  await page.reload();
  await expect(page.getByText('Subject 40', { exact: true })).toBeVisible();
  await page.emulateMedia({ media: 'print' });
  expect(await pdfPages(page)).toBe(2);
  expect(await page.locator('.rc-table tr').first().evaluate((tr) => getComputedStyle(tr).breakInside)).toBe('avoid');
  expect(await page.locator('.rc-table thead').evaluate((t) => getComputedStyle(t).display)).toBe('table-header-group');
});

test('a fee receipt prints on one A5 page with every line', async ({ page }) => {
  await signIn(page, 'admin');
  await mock(page, '**/api/fees/f1/receipts/**', receipt);
  await page.goto('/receipt/f1/R-000123');
  await expect(page.getByText('Due date for this fee: 10 October 2026')).toBeVisible();
  const layout = await printLayout(page, '.rcpt');
  expect(layout.chrome).toEqual([]);
  expect(layout.notWhite).toEqual([]);
  expect(layout.widthShare).toBeGreaterThan(0.95);
  expect(await pdfPages(page)).toBe(1); // "Due date" used to be alone on page 2
});

test('a transfer certificate prints without the admin shell and continues onto a second page when long', async ({ page }) => {
  await signIn(page, 'admin');
  await mock(page, '**/api/students/abc/transfer-certificate', tc(45));
  await page.goto('/admin/tc/abc');
  await expect(page.getByText('TRANSFER CERTIFICATE', { exact: true })).toBeVisible();
  const layout = await printLayout(page, '.tc-sheet');
  expect(layout.chrome).toEqual([]); // sidebar and Ask button used to print
  expect(layout.notWhite).toEqual([]);
  expect(layout.widthShare).toBeGreaterThan(0.95);
  // The admin page scrolls inside a fixed-height box; printing used to stop at one page.
  expect(await pdfPages(page)).toBe(2);
  await page.emulateMedia({ media: 'screen' });
  await expect(page.locator('.ea-ask-fab')).toBeVisible(); // only printing leaves it out
});
