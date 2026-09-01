import { expect, test } from '@playwright/test';

test('@claim:demo-isolated demo uses only its own browser storage', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await page.locator('[data-tool]').first().click();
  await page.keyboard.press('ArrowRight');
  const keys = await page.evaluate(() => Object.keys(localStorage));
  expect(keys.some(key => key.startsWith('demo:run:'))).toBeTruthy();
  expect(keys.some(key => key.startsWith('dawn:run:'))).toBeFalsy();
});

test('@claim:keyboard-controls arrow keys make a move', async ({ page }) => {
  await page.goto('/demo');
  await page.locator('[data-tool]').first().click();
  await page.keyboard.press('ArrowRight');
  const run = await page.evaluate(() => JSON.parse(localStorage.getItem(`demo:run:${new Date().toISOString().slice(0, 10)}`) || '{}'));
  expect(run.log).toContain('R1E');
  await page.locator('[data-move="0,1"]').click();
  const tapped = await page.evaluate(() => JSON.parse(localStorage.getItem(`demo:run:${new Date().toISOString().slice(0, 10)}`) || '{}'));
  expect(tapped.log).toContain('R1S');
});

test('@claim:end-screen a run can reach its end screen and restart', async ({ page }) => {
  await page.goto('/demo');
  await page.evaluate(() => {
    const key = `demo:run:${new Date().toISOString().slice(0, 10)}`;
    localStorage.setItem(key, JSON.stringify({ phase:'end', room:6, tool:'Hook', player:{x:5,y:2}, health:2, coins:4, log:['R1E','R2E','R3E','R4E','R5E','CHASE','R6E'], message:'You crossed the final flag.', roomUsed:false, cleared:[], collected:[], enemy:null, finished:'escaped' }));
  });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'You escaped the sixth room.' })).toBeVisible();
  await page.getByRole('button', { name: 'Start a fresh practice run' }).click();
  await expect(page.getByRole('heading', { name: 'Choose one tool' })).toBeVisible();
});

test('@claim:local-only no third-party requests occur during a demo run', async ({ page, baseURL }) => {
  const requests: string[] = [];
  page.on('request', request => requests.push(request.url()));
  await page.goto('/demo');
  await page.locator('[data-tool]').first().click();
  await page.keyboard.press('ArrowRight');
  expect(requests.every(url => url.startsWith(baseURL!))).toBeTruthy();
});

test('@claim:shared-seed the daily seed matches across fresh players', async ({ browser }) => {
  const first = await browser.newPage();
  const second = await browser.newPage();
  await Promise.all([first.goto('/demo'), second.goto('/demo')]);
  const seeds = await Promise.all([first.locator('.run-meta b').textContent(), second.locator('.run-meta b').textContent()]);
  expect(seeds[0]).toBeTruthy();
  expect(seeds[0]).toBe(seeds[1]);
  await first.close();
  await second.close();
});

test('@claim:free-play the start screen has no payment or account flow', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Free to play')).toBeVisible();
  await expect(page.locator('input, [data-payment], [href*="checkout"]')).toHaveCount(0);
});

test('@claim:six-rooms the run panel states the fixed room count', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.getByText('6 ROOMS', { exact: true })).toBeVisible();
});
