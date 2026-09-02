import { expect, test } from '@playwright/test';
import axe from 'axe-core';

for (const path of ['/', '/demo', '/privacy', '/terms', '/404.html']) {
  test(`accessibility baseline ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.addScriptTag({ content: axe.source });
    const results = await page.evaluate(async () => (window as unknown as { axe: typeof axe }).axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } }));
    const serious = results.violations.filter(item => item.impact === 'serious' || item.impact === 'critical');
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });
}

test('real routes set titles, metadata, focus, history, and legal links', async ({ page }) => {
  const routes = [
    ['/', 'Dawn Run — Play a six-room daily run', 'https://dawn-run.sociobot.in/'],
    ['/demo', 'Demo — Dawn Run', 'https://dawn-run.sociobot.in/demo'],
    ['/privacy', 'Privacy — Dawn Run', 'https://dawn-run.sociobot.in/privacy'],
    ['/terms', 'Terms — Dawn Run', 'https://dawn-run.sociobot.in/terms'],
  ];
  for (const [path, title, canonical] of routes) {
    await page.goto(path); await expect(page).toHaveTitle(title); await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /\S/); await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', canonical);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', title); await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute('content', title);
    await expect(page.getByRole('contentinfo').getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy'); await expect(page.getByRole('contentinfo').getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/terms');
  }
  await page.goto('/'); await page.getByRole('link', { name: 'Privacy' }).first().click(); await expect(page.getByRole('heading', { name: 'Privacy at Dawn Run' })).toBeFocused(); await page.goBack(); await expect(page.getByRole('heading', { name: 'Play a six-room daily run' })).toBeFocused();
});

test('designed 404 has complete shell and route metadata', async ({ page }) => {
  await page.goto('/404.html'); await expect(page).toHaveTitle('Page not found — Dawn Run'); await expect(page.locator('h1')).toHaveText('This route is not on today’s map');
  await expect(page.getByRole('banner')).toBeVisible(); await expect(page.getByRole('contentinfo')).toBeVisible(); await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/favicon.svg');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /og-card\.svg$/); await expect(page.getByRole('link', { name: 'Try the sample run' })).toHaveAttribute('href', '/demo');
});

test('active game has no serious or critical axe violations', async ({ page }) => {
  await page.goto('/demo');
  await page.addScriptTag({ content: axe.source });
  const results = await page.evaluate(async () => (window as unknown as { axe: typeof axe }).axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } }));
  const serious = results.violations.filter(item => item.impact === 'serious' || item.impact === 'critical');
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  await expect(page.getByRole('row')).toHaveCount(7);
  await expect(page.getByRole('gridcell')).toHaveCount(63);
});

test('demo banner and active sample have no axe violations at any impact', async ({ page }) => {
  await page.goto('/demo');
  await page.addScriptTag({ content: axe.source });
  const results = await page.evaluate(async () => (window as unknown as { axe: typeof axe }).axe.run(document));
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
});

test('load has no console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/demo');
  await page.waitForTimeout(300);
  expect(errors).toEqual([]);
});

test('initial Tab starts at the skip link and client navigation focuses the new heading', async ({ page }) => {
  await page.goto('/');
  expect(await page.evaluate(() => document.activeElement?.tagName)).toBe('BODY');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to the game' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: /Dawn Run/ })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Demo' })).toBeFocused();
  await page.getByRole('link', { name: 'Demo' }).click();
  await expect(page.getByRole('heading', { name: 'Continue a sample run' })).toBeFocused();
});

test('active game rerenders preserve the relevant keyboard focus', async ({ page }) => {
  await page.goto('/demo');
  await page.getByRole('grid').focus();
  await expect(page.getByRole('grid')).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('grid')).toBeFocused();
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
  await page.goto('/demo');
  await expect(page.getByRole('heading', { name: 'Room 2 in progress' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBeTruthy();
  const activeUndersized = await page.locator('a, button, input, summary').evaluateAll(elements => elements.flatMap(element => {
    const box = element.getBoundingClientRect(); const style = getComputedStyle(element); const visible = box.width > 0 && box.height > 0 && style.visibility !== 'hidden';
    return visible && (box.width < 44 || box.height < 44) ? [{ label: (element.textContent || element.getAttribute('aria-label') || '').trim(), width: box.width, height: box.height }] : [];
  }));
  expect(activeUndersized, 'active game has undersized targets').toEqual([]);
});
