import { test, expect } from '@playwright/test';
import { schoolTheme, brandCssVars, LIGHT_SURFACE, DARK_SURFACE } from '../src/utils/theme.js';

// The brand colour as text (--brand-text, --brand-text-dark) keeps 4.5:1 for any school colour, light or dark, on the
// surfaces it sits on: the light canvas, white cards, and in the dark portal the card and the brand tint of a pill.

const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
const mix = (a, b, t) => `#${[1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, '0')).join('')}`;

const BRANDS = {
  'the demo school teal': '#0A7E8C', 'light teal': '#5EEAD4', 'yellow': '#F5B301', 'pale pink': '#FBCFE8', 'white': '#FFFFFF',
  'navy': '#1E3A8A', 'red': '#DC2626', 'green': '#16A34A', 'purple': '#7C3AED', 'light grey': '#D1D5DB', 'black': '#000000',
};

for (const [name, hex] of Object.entries(BRANDS)) {
  for (const heroStyle of ['bold', 'light']) {
    test(`brand text for ${name} (${heroStyle}) meets 4.5:1 in the light and the dark portal`, () => {
      const t = schoolTheme({ primaryColor: hex, heroStyle });
      const vars = brandCssVars(t);
      expect(vars['--brand-text']).toMatch(/^#[0-9a-f]{6}$/i);
      // Light portal: on the canvas, white cards and the soft brand tint.
      for (const bg of [LIGHT_SURFACE, '#FFFFFF', t.soft]) expect(ratio(vars['--brand-text'], bg), `${vars['--brand-text']} on ${bg}`).toBeGreaterThanOrEqual(4.5);
      // Dark portal: on the card, the page and the brand tint of a pill or an active link.
      const tint = mix(DARK_SURFACE, t.primary, 0.28);
      for (const bg of [DARK_SURFACE, '#0F172A', tint]) expect(ratio(vars['--brand-text-dark'], bg), `${vars['--brand-text-dark']} on ${bg}`).toBeGreaterThanOrEqual(4.5);
    });
  }
}

test('a brand colour that already reads well is kept as it is', () => {
  const t = schoolTheme({ primaryColor: '#1E3A8A', heroStyle: 'bold' });
  expect(t.text.toLowerCase()).toBe('#1e3a8a');
});
