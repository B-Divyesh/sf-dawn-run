import { expect, test } from '@playwright/test';
import axe from 'axe-core';

for (const path of ['/', '/demo', '/privacy', '/terms']) {
  test(`accessibility baseline ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.addScriptTag({ content: axe.source });
    const results = await page.evaluate(async () => (window as unknown as { axe: typeof axe }).axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } }));
    const serious = results.violations.filter(item => item.impact === 'serious' || item.impact === 'critical');
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });
}

test('load has no console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/demo');
  await page.waitForTimeout(300);
  expect(errors).toEqual([]);
});
