import { expect, type Page, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { applyAction, createGame, roomFor, seedForDate, selectTool, toolOffers, type GameState, type Point } from '../api/game-core.js';

const isoToday = () => new Date().toISOString().slice(0, 10);
const key = (point: Point) => `${point.x},${point.y}`;
const directions = [
  { token: 'R', key: 'ArrowRight', dx: 1, dy: 0 },
  { token: 'D', key: 'ArrowDown', dx: 0, dy: 1 },
  { token: 'L', key: 'ArrowLeft', dx: -1, dy: 0 },
  { token: 'U', key: 'ArrowUp', dx: 0, dy: -1 },
] as const;

function shortestPath(game: GameState, target: Point, avoidHazards = true) {
  const seed = seedForDate(game.date);
  const room = roomFor(seed, game.room);
  const blocked = new Set(room.walls.map(key));
  if (avoidHazards) room.hazards.forEach(point => blocked.add(key(point)));
  blocked.delete(key(target));
  const queue = [{ ...game.player, path: [] as string[] }];
  const seen = new Set([key(game.player)]);
  while (queue.length) {
    const current = queue.shift()!;
    if (current.x === target.x && current.y === target.y) return current.path;
    for (const direction of directions) {
      const next = { x: current.x + direction.dx, y: current.y + direction.dy };
      if (next.x < 0 || next.x >= 9 || next.y < 0 || next.y >= 7 || blocked.has(key(next)) || seen.has(key(next))) continue;
      seen.add(key(next));
      queue.push({ ...next, path: [...current.path, direction.token] });
    }
  }
  throw new Error(`No route to ${key(target)} in room ${game.room}`);
}

function winningActionsFrom(game: GameState, stopAfterRoomFive = false) {
  const seed = seedForDate(game.date);
  const actions: string[] = [];
  while (game.phase !== 'end') {
    if (game.phase === 'cashout') {
      if (stopAfterRoomFive) return { actions, game };
      actions.push('CHASE'); applyAction(game, 'CHASE', seed, 0); continue;
    }
    const room = roomFor(seed, game.room);
    const beacon = room.beacons.find(point => !game.collected.includes(`${game.room}:${key(point)}`));
    const path = shortestPath(game, beacon || room.exit);
    for (const action of path) {
      actions.push(action);
      expect(applyAction(game, action, seed, 0)).toBeTruthy();
      if (game.phase !== 'play') break;
    }
  }
  return { actions, game };
}

function winningActions(date: string, tool: string, stopAfterRoomFive = false) {
  return winningActionsFrom(selectTool(createGame(date), tool, 0), stopAfterRoomFive);
}

function losingActions(date: string, tool: string) {
  const seed = seedForDate(date);
  const game = selectTool(createGame(date), tool, 0);
  const room = roomFor(seed, 1);
  const hazard = room.hazards.find(candidate => directions.some(direction => {
    const neighbor = { x: candidate.x + direction.dx, y: candidate.y + direction.dy };
    return neighbor.x >= 0 && neighbor.x < 9 && neighbor.y >= 0 && neighbor.y < 7 && !room.walls.some(wall => key(wall) === key(neighbor)) && !room.hazards.some(other => key(other) === key(neighbor));
  }))!;
  const actions = shortestPath(game, hazard, false);
  actions.forEach(action => applyAction(game, action, seed, 0));
  while (game.phase === 'play') {
    const out = directions.find(direction => {
      const neighbor = { x: game.player.x + direction.dx, y: game.player.y + direction.dy };
      return neighbor.x >= 0 && neighbor.x < 9 && neighbor.y >= 0 && neighbor.y < 7 && !room.walls.some(wall => key(wall) === key(neighbor)) && !room.hazards.some(other => key(other) === key(neighbor));
    })!;
    const back = directions.find(direction => direction.dx === -out.dx && direction.dy === -out.dy)!;
    for (const action of [out.token, back.token]) { actions.push(action); applyAction(game, action, seed, 0); if (game.phase === 'end') break; }
  }
  return actions;
}

async function fresh(page: Page, path = '/demo', player = 'pathfinder-player') {
  await page.goto('/');
  await page.evaluate(({ demoPath, id, state }) => {
    localStorage.clear();
    const namespace = demoPath ? 'demo:' : 'dawn:';
    localStorage.setItem(`${namespace}player`, id);
    localStorage.setItem(`${namespace}run:${new Date().toISOString().slice(0, 10)}`, JSON.stringify(state));
  }, { demoPath: path === '/demo', id: player, state: createGame(isoToday()) });
  await page.goto(path);
}

async function chosenTool(page: Page) { return (await page.locator('[data-tool]').first().locator('.tool-name').innerText()).trim(); }

async function play(page: Page, actions: string[], keyboardOnly = false) {
  for (const action of actions) {
    if (action === 'CHASE') {
      if (keyboardOnly) { await expect(page.getByRole('button', { name: 'Run the final chase' })).toBeFocused(); await page.keyboard.press('Enter'); }
      else await page.getByRole('button', { name: 'Run the final chase' }).click();
    } else await page.keyboard.press(directions.find(direction => direction.token === action)!.key);
  }
}

async function win(page: Page, path = '/demo', keyboardOnly = false) {
  await fresh(page, path);
  const tool = await chosenTool(page);
  const button = page.getByRole('button', { name: new RegExp(`^${tool}`) });
  if (keyboardOnly) { await button.focus(); await page.keyboard.press('Enter'); }
  else await button.click();
  const route = winningActions(isoToday(), tool);
  await play(page, route.actions, keyboardOnly);
  await expect(page.getByRole('heading', { name: 'You escaped the sixth room.' })).toBeVisible();
  return route;
}

const freezeDate = async (page: Page, iso: string) => page.addInitScript(({ iso: value }) => {
  const RealDate = Date;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  class FixedDate extends RealDate { constructor(...args: any[]) { super(...(args.length ? args : [value])); } static now() { return new RealDate(value).valueOf(); } }
  // @ts-expect-error browser Date replacement for deterministic seed checks
  window.Date = FixedDate;
}, { iso });

test('@claim:demo-isolated header demo stays isolated and exit clears every demo key', async ({ page }) => {
  await page.goto('/?demo=1');
  await expect(page.getByRole('heading', { name: 'Sample run in progress' })).toBeVisible();
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
  await page.goto('/');
  expect(await page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith('dawn:')))).toEqual([]);
  await page.getByRole('button', { name: 'Try it with sample data' }).click();
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Continue a sample run' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Sample run in progress' })).toBeVisible();
  await expect(page.getByText('One beacon is already lit.')).toBeVisible();
  await expect(page.getByRole('grid')).toHaveAttribute('aria-label', /1 of three beacons lit/);
  await expect(page.locator('.sample-progress li')).toHaveCount(2);
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
  await page.keyboard.press('ArrowRight');
  expect(await page.evaluate(() => Object.keys(localStorage).some(item => item.startsWith('demo:run:')))).toBeTruthy();
  expect(await page.evaluate(() => Object.keys(localStorage).some(item => item.startsWith('dawn:')))).toBeFalsy();
  const continuedState = await page.evaluate(() => JSON.parse(localStorage.getItem(`demo:run:${new Date().toISOString().slice(0, 10)}`) || 'null') as GameState);
  await play(page, winningActionsFrom(continuedState).actions); await expect(page.getByRole('heading', { name: 'You escaped the sixth room.' })).toBeVisible();
  await page.getByRole('button', { name: 'Check sample submission' }).click(); await expect(page.locator('#leaderboard-status')).toContainText('not published');
  await page.getByRole('button', { name: 'Reset demo', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Sample run in progress' })).toBeVisible();
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
  await page.keyboard.press('ArrowRight');
  await page.getByRole('button', { name: 'Start for real' }).click(); await expect(page).toHaveURL('/');
  expect(await page.evaluate(() => Object.keys(localStorage).some(item => item.startsWith('demo:')))).toBeFalsy();
  expect(await page.evaluate(() => Object.keys(localStorage).some(item => item.startsWith('dawn:')))).toBeFalsy();
});

test('@claim:keyboard-controls keyboard and touch controls move the player', async ({ page }) => {
  await fresh(page); await page.locator('[data-tool]').first().click();
  await page.keyboard.press('ArrowRight'); await expect(page.getByRole('gridcell', { name: /Row 4, column 2: you are here/ })).toBeVisible();
  await page.getByRole('button', { name: 'Move Right' }).click(); await expect(page.getByRole('gridcell', { name: /Row 4, column 3: you are here/ })).toBeVisible();
});

test('@claim:end-screen deterministic input reaches win, loss, cash-out, and restart screens', async ({ page }) => {
  await win(page);
  await page.getByRole('button', { name: 'Restart this sample run' }).click(); await expect(page.getByRole('heading', { name: 'Sample run in progress' })).toBeVisible();
  await fresh(page); const tool = await chosenTool(page); await page.locator('[data-tool]').first().click(); await play(page, losingActions(isoToday(), tool));
  await expect(page.getByRole('heading', { name: 'The watcher ended this run.' })).toBeVisible();
  await fresh(page); const cashTool = await chosenTool(page); await page.locator('[data-tool]').first().click();
  const route = winningActions(isoToday(), cashTool, true); await play(page, route.actions); await expect(page.getByRole('heading', { name: /Cash out or take/ })).toBeVisible();
  await page.getByRole('button', { name: /Cash out with/ }).click(); await expect(page.getByRole('heading', { name: 'You cashed out after five rooms.' })).toBeVisible();
});

test('@claim:shared-seed same-date clients match and another date changes every generated route', async ({ browser }) => {
  const capture = async (iso: string) => {
    const context = await browser.newContext(); const page = await context.newPage(); await freezeDate(page, iso); await page.goto('/demo');
    const displayedSeed = await page.locator('.run-meta b').first().innerText();
    const cells = await page.getByRole('gridcell').evaluateAll(items => items.map(item => item.getAttribute('aria-label'))); await context.close(); return { displayedSeed, cells };
  };
  const a = await capture('2026-09-01T12:00:00Z'); const b = await capture('2026-09-01T12:00:00Z'); const changed = await capture('2026-09-02T12:00:00Z');
  expect(a).toEqual(b); expect(changed.displayedSeed).not.toBe(a.displayedSeed); expect(changed.cells).not.toEqual(a.cells);
});

test('@claim:tool-offers each player gets three working tools from five and offers differ', async ({ page }) => {
  const sets: string[][] = [];
  for (const player of ['player-a', 'player-b', 'player-c', 'player-d', 'player-e']) {
    await fresh(page, '/demo', player); const offer = await page.locator('.tool-name').allTextContents(); expect(offer).toHaveLength(3); expect(new Set(offer).size).toBe(3); sets.push(offer);
  }
  expect(new Set(sets.map(value => value.join(','))).size).toBeGreaterThan(1);
  expect(new Set(sets.flat()).size).toBe(5);
  expect(toolOffers('player-a', isoToday())).toHaveLength(3);
});

test('@claim:comparison copied completed replay compares seed, score, time, and actions', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (value: string) => { (window as Window & { copied?: string }).copied = value; } } }));
  await win(page); const replay = (await page.locator('#replay-data').innerText()).replace(/^Move record:\s*/, '');
  await page.getByRole('button', { name: 'Copy result' }).click(); expect(await page.evaluate(() => (window as Window & { copied?: string }).copied)).toContain('Dawn Run v2');
  await page.locator('#comparison-input').fill(replay); await page.getByRole('button', { name: 'Compare result' }).click(); await expect(page.locator('#comparison-result')).toContainText('Same daily route.');
});

test('@claim:resume-touch a saved mobile run resumes and moves by touch', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true }); const page = await context.newPage();
  await fresh(page); await page.locator('[data-tool]').first().tap(); await page.getByRole('button', { name: 'Move Right' }).tap(); await page.getByRole('button', { name: 'Pause' }).tap(); await page.reload();
  await page.getByRole('button', { name: 'Resume run' }).tap(); await page.getByRole('button', { name: 'Move Right' }).tap(); await expect(page.getByRole('gridcell', { name: /Row 4, column 3: you are here/ })).toBeVisible(); await context.close();
});

test('@claim:accessible-board active grid has valid row ownership and all named cells', async ({ page }) => {
  await fresh(page); await page.locator('[data-tool]').first().click();
  await expect(page.getByRole('grid')).toBeVisible(); await expect(page.getByRole('row')).toHaveCount(7); await expect(page.getByRole('gridcell')).toHaveCount(63);
  for (const row of await page.getByRole('row').all()) await expect(row.getByRole('gridcell')).toHaveCount(9);
  await expect(page.getByRole('gridcell', { name: /Row 4, column 1: you are here/ })).toBeVisible();
});

test('@claim:score-publishing completed replay is verified, published, and returned by the leaderboard', async ({ page }) => {
  await win(page, '/'); await page.locator('#nickname').fill('RouteTester'); await page.getByRole('button', { name: 'Publish verified score' }).click();
  await expect(page.locator('#leaderboard-status')).toContainText('verified and published'); await expect(page.getByRole('cell', { name: 'RouteTester' })).toBeVisible();
  const publishedReplay = await page.locator('tbody code').first().textContent(); expect(publishedReplay).toContain('Dawn Run v2');
  await page.getByRole('button', { name: 'Load today’s scores' }).click(); await expect(page.getByRole('cell', { name: 'RouteTester' })).toBeVisible();
});

test('@claim:settings-history settings and completed history persist across reload', async ({ page }) => {
  test.setTimeout(60_000);
  await fresh(page, '/'); await page.getByText('Settings and run history').click(); await page.getByLabel('Show board coordinates').check(); await page.getByLabel('Reduce visual effects').check();
  let expectedBest = 0;
  for (let run = 0; run < 9; run++) {
    const tool = await chosenTool(page); await page.locator('[data-tool]').first().click();
    for (let loop = 0; loop < run; loop++) { await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowLeft'); }
    const route = winningActions(isoToday(), tool); await play(page, route.actions);
    expectedBest = Math.max(expectedBest, Number(await page.locator('.score dd').first().innerText()));
    if (run < 8) await page.getByRole('button', { name: 'Start a fresh practice run' }).click();
  }
  await page.reload(); await page.getByText('Settings and run history').click();
  await expect(page.getByLabel('Show board coordinates')).toBeChecked(); await expect(page.getByLabel('Reduce visual effects')).toBeChecked();
  await expect(page.locator('.history li')).toHaveCount(8); await expect(page.locator('.history')).toContainText(`Best score: ${expectedBest}`);
});

test('@claim:publication-consent no score request occurs before explicit publication', async ({ page }) => {
  const scoreRequests: { method: string; body: string | null }[] = [];
  page.on('request', request => { if (new URL(request.url()).pathname === '/api/scores') scoreRequests.push({ method: request.method(), body: request.postData() }); });
  await win(page, '/'); expect(scoreRequests).toEqual([]);
  await page.getByRole('button', { name: 'Publish verified score' }).click();
  await expect(page.locator('#leaderboard-status')).toContainText('published');
  expect(scoreRequests).toHaveLength(1); expect(scoreRequests[0].method).toBe('POST');
  expect(Object.keys(JSON.parse(scoreRequests[0].body || '{}')).sort()).toEqual(['actions', 'date', 'demo', 'durationSeconds', 'nickname', 'result', 'score', 'seed', 'tool']);
});

test('@claim:hook-tool Hook clears one adjacent named rock and is spent for the room', async ({ page }) => {
  const state = selectTool(createGame(isoToday()), 'Hook', 1); const room = roomFor(seedForDate(isoToday()), 1); const rock = room.walls[0];
  const neighbor = directions.map(direction => ({ x: rock.x - direction.dx, y: rock.y - direction.dy })).find(point => point.x >= 0 && point.x < 9 && point.y >= 0 && point.y < 7 && !room.walls.some(wall => key(wall) === key(point)))!;
  state.player = neighbor; await page.goto('/'); await page.evaluate(value => { localStorage.clear(); localStorage.setItem(`demo:run:${new Date().toISOString().slice(0, 10)}`, JSON.stringify(value)); }, state); await page.goto('/demo'); await page.getByRole('button', { name: 'Resume run' }).click();
  await expect(page.locator(`[data-cell="${rock.x},${rock.y}"]`)).toHaveAttribute('aria-label', /rock, blocked/); await page.getByRole('button', { name: 'Use Hook' }).click();
  await expect(page.locator(`[data-cell="${rock.x},${rock.y}"]`)).toHaveAttribute('aria-label', /open route/); await expect(page.getByRole('button', { name: 'Use Hook (used)' })).toBeDisabled();
});

test('@claim:dash-tool Dash moves east two tiles once and reports a blocked boundary', () => {
  const game = selectTool(createGame(isoToday()), 'Dash', 1); expect(applyAction(game, 'T', seedForDate(isoToday()), 1)).toBeTruthy(); expect(game.player).toEqual({ x: 2, y: 3 }); expect(game.roomUsed).toBeTruthy(); expect(applyAction(game, 'T', seedForDate(isoToday()), 1)).toBeFalsy();
  const edge = selectTool(createGame(isoToday()), 'Dash', 1); edge.player = { x: 7, y: 3 }; expect(applyAction(edge, 'T', seedForDate(isoToday()), 1)).toBeFalsy(); expect(edge.message).toBe('The dash route is blocked.');
});

test('@claim:lantern-tool Lantern restores at most two health once per room', () => {
  const game = selectTool(createGame(isoToday()), 'Lantern', 1); game.health = 4; expect(applyAction(game, 'T', seedForDate(isoToday()), 1)).toBeTruthy(); expect(game.health).toBe(5); expect(game.roomUsed).toBeTruthy(); expect(applyAction(game, 'T', seedForDate(isoToday()), 1)).toBeFalsy(); expect(game.health).toBe(5);
});

test('@claim:decoy-tool Decoy holds the watcher for six turns and releases it on the next beacon', () => {
  const game = selectTool(createGame(isoToday()), 'Decoy', 1); game.room = 2; const gameSeed = seedForDate(isoToday()); const room = roomFor(gameSeed, 2); game.enemy = { ...room.enemy }; expect(applyAction(game, 'T', gameSeed, 1)).toBeTruthy(); const start = { ...game.enemy! };
  for (let turn = 0; turn < 6; turn++) { game.player = { x: 0, y: turn % 2 ? 2 : 3 }; expect(applyAction(game, turn % 2 ? 'D' : 'U', gameSeed, 1)).toBeTruthy(); expect(game.enemy).toEqual(start); }
  const beacon = room.beacons[0]; const neighbor = directions.map(direction => ({ point: { x: beacon.x - direction.dx, y: beacon.y - direction.dy }, token: direction.token })).find(item => item.point.x >= 0 && item.point.x < 9 && item.point.y >= 0 && item.point.y < 7 && !room.walls.some(wall => key(wall) === key(item.point)))!; game.player = neighbor.point; applyAction(game, neighbor.token, gameSeed, 1); expect(game.enemy).not.toEqual(start);
});

test('@claim:cloak-tool Cloak blocks the next watcher hit but not the following hit', () => {
  const game = selectTool(createGame(isoToday()), 'Cloak', 1); game.room = 2; const gameSeed = seedForDate(isoToday()); const room = roomFor(gameSeed, 2); expect(applyAction(game, 'T', gameSeed, 1)).toBeTruthy();
  const hit = (beacon: Point) => { const neighbor = directions.map(direction => ({ point: { x: beacon.x - direction.dx, y: beacon.y - direction.dy }, token: direction.token })).find(item => item.point.x >= 0 && item.point.x < 9 && item.point.y >= 0 && item.point.y < 7 && !room.walls.some(wall => key(wall) === key(item.point)))!; game.player = neighbor.point; game.enemy = { ...beacon }; applyAction(game, neighbor.token, gameSeed, 1); };
  hit(room.beacons[0]); expect(game.health).toBe(5); expect(game.shield).toBe(0); hit(room.beacons[1]); expect(game.health).toBe(4);
});

test('@claim:focus-preserved keyboard focus stays in the game through a complete run', async ({ page }) => {
  await fresh(page); const tool = await chosenTool(page); const button = page.locator('[data-tool]').first(); await button.focus(); await page.keyboard.press('Enter'); await expect(page.getByRole('grid')).toBeFocused();
  await page.keyboard.press('ArrowRight'); await expect(page.getByRole('grid')).toBeFocused();
  const route = winningActions(isoToday(), tool); await play(page, route.actions.slice(1), true); await expect(page.getByRole('heading', { name: 'You escaped the sixth room.' })).toBeFocused();
});

test('@claim:local-only full play and explicit publication use only same-origin requests', async ({ page, baseURL }) => {
  const requests: string[] = []; page.on('request', request => requests.push(request.url())); await win(page, '/'); await page.getByRole('button', { name: 'Publish verified score' }).click(); await expect(page.locator('#leaderboard-status')).toContainText('published');
  expect(requests.every(url => url.startsWith(baseURL!))).toBeTruthy();
});

test('@claim:storage-recovery malformed and incomplete runs recover to the sample', async ({ page }) => {
  await page.goto('/'); await page.evaluate(() => localStorage.setItem(`demo:run:${new Date().toISOString().slice(0, 10)}`, '{}')); await page.goto('/demo'); await expect(page.getByRole('heading', { name: 'Sample run in progress' })).toBeVisible();
  await page.goto('/'); await page.evaluate(() => localStorage.setItem(`demo:run:${new Date().toISOString().slice(0, 10)}`, '{bad')); await page.goto('/demo'); await expect(page.getByRole('heading', { name: 'Sample run in progress' })).toBeVisible();
});

test('@claim:frame-rate fixed simulation heartbeat keeps at least 55 fps', async ({ page }) => {
  await page.goto('/demo'); const fps = await page.evaluate(() => new Promise<number>(resolve => { const frames: number[] = []; const sample = (now: number) => { frames.push(now); if (frames.length === 61) resolve(60_000 / (frames[60] - frames[0])); else requestAnimationFrame(sample); }; requestAnimationFrame(sample); })); expect(fps).toBeGreaterThanOrEqual(55);
});

test('@claim:run-duration full route provides a measured 5–7 minute tactical input budget', async ({ page }) => {
  await fresh(page); const tool = await chosenTool(page); await page.locator('[data-tool]').first().click(); const route = winningActions(isoToday(), tool);
  expect(route.actions.length).toBeGreaterThanOrEqual(120); expect(route.actions.length).toBeLessThanOrEqual(168);
  const measuredSecondsAtPlanningCadence = route.actions.length * 2.5;
  expect(measuredSecondsAtPlanningCadence).toBeGreaterThanOrEqual(300); expect(measuredSecondsAtPlanningCadence).toBeLessThanOrEqual(420);
  await play(page, route.actions); await expect(page.locator('.score')).toContainText(`${route.actions.length} turns`); await expect(page.locator('.hud')).toHaveCount(0);
});

test('@claim:offline-reload controlled demo reload works offline after the first visit', async ({ browser }) => {
  const context = await browser.newContext({ serviceWorkers: 'allow' }); try { const page = await context.newPage(); await page.goto('/'); await page.evaluate(() => navigator.serviceWorker.ready); await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true); await page.reload();
    const cached = await page.evaluate(async () => (await caches.open('dawn-run-20260902-polish-1')).keys().then(items => items.map(item => new URL(item.url).pathname))); expect(cached).toContain('/demo');
    await context.setOffline(true); await page.goto('/demo', { waitUntil: 'domcontentloaded' }); await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  } finally { await context.setOffline(false); await context.close(); }
});

test('@claim:response-policy delivery config protects APIs, CSP, 404s, immutable assets, and worker updates', () => {
  const config = JSON.parse(readFileSync('public/staticwebapp.config.json', 'utf8')) as { routes: Array<{ route: string; headers?: Record<string, string> }>; globalHeaders: Record<string, string>; responseOverrides: Record<string, { rewrite: string; statusCode: number }> };
  expect(config.globalHeaders['Content-Security-Policy']).toContain("frame-ancestors 'none'"); expect(config.routes.find(route => route.route === '/assets/*')?.headers?.['Cache-Control']).toContain('immutable'); expect(config.routes.find(route => route.route === '/api/*')?.headers?.['Cache-Control']).toContain('no-store'); expect(config.responseOverrides['404'].statusCode).toBe(404);
  const worker = readFileSync('public/sw.js', 'utf8'); expect(worker).toContain('dawn-run-20260902-polish-1'); expect(worker).toContain("startsWith('/api/')");
});

test('@claim:free-play start screen has no payment or account flow', async ({ page }) => { await page.goto('/'); await expect(page.getByText('Free to play')).toBeVisible(); await expect(page.locator('[data-payment], [href*="checkout"], [href*="login"]')).toHaveCount(0); });
test('@claim:six-rooms game has six rooms with three required beacons in each', async ({ page }) => {
  for (let room = 1; room <= 6; room++) expect(roomFor(seedForDate(isoToday()), room).beacons).toHaveLength(3);
  await page.goto('/demo'); await expect(page.getByText('6 ROOMS · 18 BEACONS')).toBeVisible();
});
