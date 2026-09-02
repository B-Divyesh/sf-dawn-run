import { expect, Page, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

const demoPlayer = async (page: Page) => {
  await page.goto('/demo');
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('demo:player', 'aaa'); });
  await page.reload();
};
const east = async (page: Page, count = 5) => { for (let step = 0; step < count; step++) await page.keyboard.press('ArrowRight'); };
const lanternRunFromToolChoice = async (page: Page) => {
  await page.getByRole('button', { name: /Lantern/ }).click();
  for (let room = 1; room <= 5; room++) { await page.getByRole('button', { name: /Use Lantern/ }).click(); await east(page); }
  await expect(page.getByRole('heading', { name: 'Cash out or take the final chase?' })).toBeVisible();
};
const lanternRunToFive = async (page: Page) => {
  await demoPlayer(page);
  await lanternRunFromToolChoice(page);
};
const win = async (page: Page) => {
  await lanternRunToFive(page);
  await page.getByRole('button', { name: 'Run the final chase' }).click();
  await page.getByRole('button', { name: /Use Lantern/ }).click();
  await east(page);
  await expect(page.getByRole('heading', { name: 'You escaped the sixth room.' })).toBeVisible();
};
const freezeDate = async (page: Page, iso: string) => page.addInitScript(({ iso: value }) => {
  const RealDate = Date;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  class FixedDate extends RealDate { constructor(...args: any[]) { super(...(args.length ? args : [value])); } static now() { return new RealDate(value).valueOf(); } }
  // @ts-expect-error test browser Date replacement
  window.Date = FixedDate;
}, { iso });

test('@claim:demo-isolated header demo stays isolated and exit clears every demo key', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Demo' }).click();
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await page.locator('[data-tool]').first().click();
  await page.keyboard.press('ArrowRight');
  expect(await page.evaluate(() => Object.keys(localStorage).some(key => key.startsWith('demo:run:')))).toBeTruthy();
  expect(await page.evaluate(() => Object.keys(localStorage).some(key => key.startsWith('dawn:run:')))).toBeFalsy();
  await page.getByRole('button', { name: 'Start for real' }).click();
  await expect(page).toHaveURL('/');
  expect(await page.evaluate(() => Object.keys(localStorage).some(key => key.startsWith('demo:')))).toBeFalsy();
});

test('@claim:keyboard-controls keyboard and touch controls move the player', async ({ page }) => {
  await demoPlayer(page);
  await page.locator('[data-tool]').first().click();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('gridcell', { name: /Row 3, column 2: you are here/ })).toBeVisible();
  await page.getByRole('button', { name: 'Move Right' }).click();
  await expect(page.getByRole('gridcell', { name: /Row 3, column 3: you are here/ })).toBeVisible();
});

test('@claim:end-screen title to win, loss, cash-out, and restart use only game input', async ({ page }) => {
  await win(page);
  await page.getByRole('button', { name: 'Start a fresh practice run' }).click();
  await expect(page.getByRole('heading', { name: 'Choose one tool' })).toBeVisible();
  await demoPlayer(page);
  await page.locator('[data-tool]').first().click();
  for (let hit = 0; hit < 3; hit++) { await page.keyboard.press('ArrowUp'); if (hit < 2) await page.keyboard.press('ArrowDown'); }
  await expect(page.getByRole('heading', { name: 'The watcher ended this run.' })).toBeVisible();
  await lanternRunToFive(page);
  await page.getByRole('button', { name: /Cash out with/ }).click();
  await expect(page.getByRole('heading', { name: 'You cashed out after five rooms.' })).toBeVisible();
});

test('@claim:shared-seed a displayed date seed produces matching rooms and a new date changes them', async ({ browser }) => {
  const captureRoute = async (iso: string) => {
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      await freezeDate(page, iso);
      await page.addInitScript(() => localStorage.setItem('demo:player', 'aaa'));
      await page.goto('/demo');
      const displayedSeed = await page.locator('.run-meta b').innerText();
      await page.locator('[data-tool]').first().click();
      const cells = await page.locator('[role="gridcell"]').evaluateAll(items => items.map(item => item.getAttribute('aria-label')));
      return { displayedSeed, cells };
    } finally {
      await context.close();
    }
  };

  // Keep each independent client isolated and sequential. Concurrent pages made
  // this claim contend with service-worker startup and hid the removed seed UI.
  const sameA = await captureRoute('2026-09-01T12:00:00.000Z');
  const sameB = await captureRoute('2026-09-01T12:00:00.000Z');
  const changed = await captureRoute('2026-09-02T12:00:00.000Z');
  expect(sameA.displayedSeed).toBe(sameB.displayedSeed);
  expect(sameA.cells).toEqual(sameB.cells);
  expect(changed.displayedSeed).not.toBe(sameA.displayedSeed);
  expect(changed.cells).not.toEqual(sameA.cells);
});

test('@claim:tool-offers every player chooses one of three working tools', async ({ page }) => {
  for (const player of ['aaa', 'bbb', 'ccc']) {
    await page.goto('/demo');
    await page.evaluate(value => { localStorage.clear(); localStorage.setItem('demo:player', value); }, player);
    await page.reload();
    await expect(page.locator('[data-tool]')).toHaveCount(3);
    await expect(page.getByRole('button', { name: /Hook/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Dash/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Lantern/ })).toBeVisible();
  }

  await page.getByRole('button', { name: /Hook/ }).click();
  const hookPath = await page.locator('[data-cell]').evaluateAll(items => {
    const cells = items.map(item => {
      const [x, y] = (item.getAttribute('data-cell') || '0,0').split(',').map(Number);
      return { x, y, wall: item.classList.contains('wall'), hazard: item.classList.contains('hazard') };
    });
    const key = (x: number, y: number) => `${x},${y}`;
    const blocked = new Set(cells.filter(cell => cell.wall || cell.hazard).map(cell => key(cell.x, cell.y)));
    const targets = new Set<string>();
    for (const wall of cells.filter(cell => cell.wall)) {
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const x = wall.x + dx;
        const y = wall.y + dy;
        if (x >= 0 && x < 6 && y >= 0 && y < 5 && !blocked.has(key(x, y))) targets.add(key(x, y));
      }
    }
    const queue = [{ x: 0, y: 2, moves: [] as string[] }];
    const seen = new Set([key(0, 2)]);
    const directions = [{ dx: 1, dy: 0, key: 'ArrowRight' }, { dx: -1, dy: 0, key: 'ArrowLeft' }, { dx: 0, dy: 1, key: 'ArrowDown' }, { dx: 0, dy: -1, key: 'ArrowUp' }];
    while (queue.length) {
      const current = queue.shift()!;
      if (targets.has(key(current.x, current.y))) return current.moves;
      for (const direction of directions) {
        const x = current.x + direction.dx;
        const y = current.y + direction.dy;
        if (x < 0 || x >= 6 || y < 0 || y >= 5 || blocked.has(key(x, y)) || seen.has(key(x, y))) continue;
        seen.add(key(x, y));
        queue.push({ x, y, moves: [...current.moves, direction.key] });
      }
    }
    return [];
  });
  expect(hookPath.length).toBeGreaterThan(0);
  for (const key of hookPath) await page.keyboard.press(key);
  await page.getByRole('button', { name: 'Use Hook' }).click();
  await expect(page.getByText('The hook clears a route.')).toBeVisible();

  await demoPlayer(page);
  await page.getByRole('button', { name: /Dash/ }).click();
  await page.getByRole('button', { name: 'Use Dash' }).click();
  await expect(page.getByRole('gridcell', { name: 'Row 3, column 3: you are here' })).toBeVisible();

  await demoPlayer(page);
  await page.getByRole('button', { name: /Lantern/ }).click();
  await page.keyboard.press('ArrowUp');
  await expect(page.locator('.hud')).toContainText('HEALTH ●●○');
  await page.getByRole('button', { name: 'Use Lantern' }).click();
  await expect(page.locator('.hud')).toContainText('HEALTH ●●●');
});

test('@claim:comparison copy/share/import flow compares a completed result', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (value: string) => { (window as Window & { copiedResult?: string }).copiedResult = value; } } }));
  await win(page);
  const data = await page.locator('#replay-data').innerText();
  await page.getByRole('button', { name: 'Copy result' }).click();
  await expect(page.getByText('Result copied. Paste it into Compare a copied result.')).toBeVisible();
  expect(await page.evaluate(() => (window as Window & { copiedResult?: string }).copiedResult)).toContain('Dawn Run v1');
  await page.locator('#comparison-input').fill(data.replace('Replay data: ', ''));
  await page.getByRole('button', { name: 'Compare result' }).click();
  await expect(page.locator('#comparison-result')).toContainText('Same daily route.');
  await page.getByRole('button', { name: 'Save for comparison' }).click();
  expect(await page.evaluate(() => Object.keys(localStorage).some(key => key.startsWith('demo:comparison:')))).toBeTruthy();
});

test('@claim:resume-touch an interrupted mobile run reloads and resumes with a touch target', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const page = await context.newPage();
  await demoPlayer(page); await page.locator('[data-tool]').first().click(); await page.getByRole('button', { name: 'Move Right' }).click();
  await page.getByRole('button', { name: 'Pause' }).click(); await page.reload();
  await expect(page.getByRole('heading', { name: 'Resume your run' })).toBeVisible();
  await page.getByRole('button', { name: 'Resume run' }).tap();
  await page.getByRole('button', { name: 'Move Right' }).tap();
  await expect(page.getByRole('gridcell', { name: /Row 3, column 3: you are here/ })).toBeVisible();
  await context.close();
});

test('@claim:accessible-board every playable coordinate is exposed to assistive technology', async ({ page }) => {
  await demoPlayer(page); await page.locator('[data-tool]').first().click();
  await expect(page.getByRole('grid', { name: /Room 1 tactical board/ })).toBeVisible();
  await expect(page.getByRole('gridcell')).toHaveCount(30);
  await expect(page.getByRole('gridcell', { name: /Row 3, column 1: you are here/ })).toBeVisible();
  await expect(page.getByRole('gridcell', { name: /Row 3, column 6: exit flag/ })).toBeVisible();
});

test('@claim:local-only no third-party requests occur during a full demo win', async ({ page, baseURL }) => {
  const requests: string[] = []; page.on('request', request => requests.push(request.url()));
  await win(page); expect(requests.every(url => url.startsWith(baseURL!))).toBeTruthy();
});

test('@claim:storage-recovery malformed and incomplete stored runs recover to tool selection', async ({ page }) => {
  await page.goto('/demo');
  await page.evaluate(() => localStorage.setItem(`demo:run:${new Date().toISOString().slice(0, 10)}`, '{}'));
  await page.reload(); await expect(page.getByRole('heading', { name: 'Choose one tool' })).toBeVisible();
  await page.evaluate(() => localStorage.setItem(`demo:run:${new Date().toISOString().slice(0, 10)}`, '{bad json'));
  await page.reload(); await expect(page.getByRole('heading', { name: 'Choose one tool' })).toBeVisible();
});

test('@claim:frame-rate the fixed simulation heartbeat keeps at least 55 fps', async ({ page }) => {
  await page.goto('/demo');
  const fps = await page.evaluate(() => new Promise<number>(resolve => { const frames: number[] = []; const sample = (now: number) => { frames.push(now); if (frames.length === 61) { const duration = frames[60] - frames[0]; resolve(60000 / duration); } else requestAnimationFrame(sample); }; requestAnimationFrame(sample); }));
  expect(fps).toBeGreaterThanOrEqual(55);
});

test('@claim:run-duration a fast 37-action Lantern reference run finishes in under 10 seconds', async ({ page }) => {
  await demoPlayer(page);
  const started = Date.now();
  await lanternRunFromToolChoice(page);
  await page.getByRole('button', { name: 'Run the final chase' }).click();
  await page.getByRole('button', { name: /Use Lantern/ }).click();
  await east(page);
  await expect(page.getByRole('heading', { name: 'You escaped the sixth room.' })).toBeVisible();
  const elapsed = Date.now() - started;
  const duration = page.locator('#run-duration');
  await expect(duration).toBeVisible();
  expect(Number(await duration.getAttribute('data-seconds'))).toBeLessThan(10);
  expect(elapsed).toBeLessThan(10_000);
  await expect(page.locator('.score')).toContainText('37 moves');
  await page.goto('/');
  await expect(page.getByText('Fast 37-action Lantern runs finish in under 10 seconds')).toBeVisible();
});

test('@claim:offline-reload a demo reload works offline after its first visit', async ({ browser }) => {
  const context = await browser.newContext({ serviceWorkers: 'allow' });
  try {
    const page = await context.newPage();
    await page.goto('/');
    await page.evaluate(() => navigator.serviceWorker.ready);
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    await page.reload();
    await expect(page.locator('h1')).toHaveText('Play a six-room daily run');
    const cachedPaths = await page.evaluate(async () => (await caches.open('dawn-run-20260902-repair-3')).keys().then(keys => keys.map(key => new URL(key.url).pathname)));
    expect(cachedPaths).toContain('/index.html');
    expect(cachedPaths).toContain('/demo');
    expect(cachedPaths.some(path => path.startsWith('/assets/'))).toBeTruthy();

    await context.setOffline(true);
    await page.goto('/demo', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL('/demo');
    await expect(page.locator('h1')).toHaveText('Play a six-room daily run');
    await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  } finally {
    await context.setOffline(false);
    await context.close();
  }
});

test('static delivery config protects CSP, real 404s, immutable assets, and service-worker updates', () => {
  const config = JSON.parse(readFileSync('public/staticwebapp.config.json', 'utf8')) as { routes: Array<{ route: string; headers?: Record<string, string> }>; globalHeaders: Record<string, string>; responseOverrides: Record<string, { rewrite: string; statusCode: number }> };
  expect(config.globalHeaders['Content-Security-Policy']).toContain("frame-ancestors 'none'");
  expect(config.routes.find(route => route.route === '/assets/*')?.headers?.['Cache-Control']).toContain('immutable');
  expect(config.responseOverrides['404']).toEqual({ rewrite: '/404.html', statusCode: 404 });
  const worker = readFileSync('public/sw.js', 'utf8'); expect(worker).toContain("dawn-run-20260902-repair-3"); expect(worker).toContain('caches.delete');
});

test('@claim:free-play the start screen has no payment or account flow', async ({ page }) => {
  await page.goto('/'); await expect(page.getByText('Free to play')).toBeVisible(); await expect(page.locator('input, [data-payment], [href*="checkout"]')).toHaveCount(0);
});

test('@claim:six-rooms the run panel states the fixed room count', async ({ page }) => {
  await page.goto('/demo'); await expect(page.getByText('6 ROOMS', { exact: true })).toBeVisible();
});
