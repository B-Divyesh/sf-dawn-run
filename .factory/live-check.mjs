import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';
import axe from 'axe-core';

const origin = process.argv[2] || 'https://dawn-run.sociobot.in';
const evidenceDir = process.argv[3] || '.factory/live-polish-1';
const browser = await chromium.launch({ headless: true });
const report = { origin, routes: {}, demo: {}, scoreRequestsBeforePublish: 0, offline: false, axeViolations: [], consoleErrors: [] };

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'allow' });
  const page = await context.newPage();
  const scoreRequests = [];
  page.on('request', request => { if (new URL(request.url()).pathname === '/api/scores') scoreRequests.push(request.url()); });
  page.on('console', message => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });

  await page.goto(`${origin}/`);
  assert.equal(await page.title(), 'Dawn Run — Play a six-room daily run');
  assert.deepEqual(await page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith('dawn:'))), []);
  await page.getByRole('button', { name: 'Try it with sample data' }).click();
  await page.getByRole('heading', { name: 'Sample run in progress' }).waitFor();
  assert.match(await page.getByRole('grid').getAttribute('aria-label'), /1 of three beacons lit/);
  assert.equal(await page.locator('.sample-progress li').count(), 2);
  assert.deepEqual(await page.evaluate(() => Object.keys(localStorage)), []);
  await page.screenshot({ path: `${evidenceDir}/cold-demo-desktop.png`, fullPage: true });

  await page.keyboard.press('ArrowRight');
  assert.equal(await page.evaluate(() => Object.keys(localStorage).some(key => key.startsWith('dawn:'))), false);
  await page.getByRole('button', { name: 'Reset demo', exact: true }).click();
  await page.getByRole('heading', { name: 'Sample run in progress' }).waitFor();
  assert.deepEqual(await page.evaluate(() => Object.keys(localStorage)), []);
  await page.getByRole('button', { name: 'Start for real' }).click();
  assert.equal(new URL(page.url()).pathname, '/');
  assert.deepEqual(await page.evaluate(() => Object.keys(localStorage)), []);
  assert.deepEqual(scoreRequests, []); report.scoreRequestsBeforePublish = scoreRequests.length;
  report.demo = { activeRoom: 2, litBeacons: 1, sampleRows: 2, resetLeavesKeys: 0, realKeysWritten: 0 };

  for (const [path, title] of [['/', 'Dawn Run — Play a six-room daily run'], ['/demo', 'Demo — Dawn Run'], ['/privacy', 'Privacy — Dawn Run'], ['/terms', 'Terms — Dawn Run']]) {
    const response = await page.goto(`${origin}${path}`);
    assert.equal(response?.status(), 200); assert.equal(await page.title(), title);
    assert.equal(await page.locator('h1').count(), 1); assert.equal(await page.locator('main').count(), 1);
    report.routes[path] = { status: response?.status(), title };
  }

  await page.goto(`${origin}/demo`); await page.evaluate(axe.source);
  const axeResult = await page.evaluate(async () => window.axe.run(document));
  report.axeViolations = axeResult.violations.map(violation => violation.id);
  assert.deepEqual(report.axeViolations, []);
  assert.deepEqual(report.consoleErrors, []);

  const missing = await page.goto(`${origin}/not-a-real-route-polish-1`);
  assert.equal(missing?.status(), 404); assert.equal(await page.title(), 'Page not found — Dawn Run');
  assert.equal(await page.locator('header').count(), 1); assert.equal(await page.locator('footer').count(), 1);
  assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), `${origin}/404`);
  report.routes['/not-a-real-route-polish-1'] = { status: 404, title: await page.title(), header: true, footer: true };
  await page.screenshot({ path: `${evidenceDir}/cold-404-desktop.png`, fullPage: true });
  await context.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const mobilePage = await mobile.newPage(); await mobilePage.goto(`${origin}/demo`);
  assert.equal(await mobilePage.getByRole('heading', { name: 'Room 2 in progress' }).isVisible(), true);
  assert.equal(await mobilePage.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
  await mobilePage.screenshot({ path: `${evidenceDir}/cold-demo-mobile.png`, fullPage: true }); await mobile.close();

  const offlineContext = await browser.newContext({ serviceWorkers: 'allow' }); const offlinePage = await offlineContext.newPage();
  await offlinePage.goto(`${origin}/`); await offlinePage.evaluate(() => navigator.serviceWorker.ready); await offlinePage.reload();
  await offlineContext.setOffline(true); await offlinePage.goto(`${origin}/demo`, { waitUntil: 'domcontentloaded' });
  assert.equal(await offlinePage.getByText('Demo — sample data, nothing is saved').isVisible(), true); report.offline = true;
  await offlineContext.setOffline(false); await offlineContext.close();
  const unexpectedConsoleErrors = report.consoleErrors.filter(message => !/Failed to load resource: the server responded with a status of 404/.test(message));
  assert.deepEqual(unexpectedConsoleErrors, []);
  report.expected404Console = report.consoleErrors.length;
  report.consoleErrors = unexpectedConsoleErrors;
  writeFileSync(`${evidenceDir}/cold-check.json`, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report));
} finally {
  await browser.close();
}
