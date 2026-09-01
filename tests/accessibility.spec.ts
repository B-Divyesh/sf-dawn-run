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

test('all visible interactive targets meet the 44px mobile baseline', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ['/', '/demo', '/privacy', '/terms']) {
    await page.goto(path);
    const undersized = await page.locator('a, button, input').evaluateAll(elements => elements.flatMap(element => {
      const box = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      const visible = box.width > 0 && box.height > 0 && style.visibility !== 'hidden';
      return visible && (box.width < 44 || box.height < 44)
        ? [{ label: (element.textContent || element.getAttribute('aria-label') || '').trim(), width: box.width, height: box.height }]
        : [];
    }));
    expect(undersized, `${path} has undersized targets`).toEqual([]);
  }
});
