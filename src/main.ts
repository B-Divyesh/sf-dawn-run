import './style.css';
import { BOARD_HEIGHT, BOARD_WIDTH, MAX_HEALTH, REQUIRED_BEACONS, TOOLS, applyAction, createGame, hashString, replayText, roomFor, scoreGame, seedForDate, selectTool, toolOffers, type GameState, type Point } from '../api/game-core.js';

type Tool = 'Hook' | 'Dash' | 'Lantern' | 'Decoy' | 'Cloak';
type Settings = { coordinates: boolean; reducedEffects: boolean; nickname: string };
type HistoryItem = { id: string; date: string; result: string; score: number; tool: string; moves: number; duration: number; replay: string; published: boolean };
type LeaderboardItem = { rank?: number; nickname: string; score: number; result: string; tool: string; durationSeconds: number; replay: string; verified: boolean; createdAt?: string };

const app = document.querySelector<HTMLDivElement>('#app')!;
const today = new Date().toISOString().slice(0, 10);
const seed = seedForDate(today);
const pendingPlayerId = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
const demo = () => location.pathname === '/demo' || new URLSearchParams(location.search).get('demo') === '1';
const prefix = () => demo() ? 'demo:' : 'dawn:';
const runKey = () => `${prefix()}run:${today}`;
const settingsKey = () => `${prefix()}settings`;
const historyKey = () => `${prefix()}history`;
const playerKey = () => `${prefix()}player`;
const previewPlayer = () => demo() ? 'dawn-run-sample-player' : pendingPlayerId;
const same = (a: Point, b: Point) => a.x === b.x && a.y === b.y;
const pointKey = (room: number, value: Point) => `${room}:${value.x},${value.y}`;
const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]!);

function playerId() {
  const existing = localStorage.getItem(playerKey());
  if (existing) return existing;
  const created = demo() ? 'dawn-run-sample-player' : pendingPlayerId;
  localStorage.setItem(playerKey(), created);
  return created;
}

function defaultSettings(): Settings {
  const storedPlayer = localStorage.getItem(playerKey());
  const code = storedPlayer ? hashString(storedPlayer).toString(36).slice(0, 4).toUpperCase().padStart(4, '0') : demo() ? 'DEMO' : 'DAWN';
  return { coordinates: false, reducedEffects: false, nickname: `Walker-${code}` };
}

function cleanNickname(value: string) {
  return value.replace(/[^a-zA-Z0-9 _-]/g, '').trim().slice(0, 16);
}

function loadSettings(): Settings {
  const fallback = defaultSettings();
  try {
    const value = JSON.parse(localStorage.getItem(settingsKey()) || 'null') as Partial<Settings> | null;
    return value && typeof value.coordinates === 'boolean' && typeof value.reducedEffects === 'boolean' && typeof value.nickname === 'string'
      ? { coordinates: value.coordinates, reducedEffects: value.reducedEffects, nickname: cleanNickname(value.nickname) || fallback.nickname }
      : fallback;
  } catch { return fallback; }
}

function validGame(value: unknown): value is GameState {
  if (!value || typeof value !== 'object') return false;
  const state = value as Partial<GameState>;
  return state.version === 2 && state.date === today && ['choose', 'play', 'cashout', 'end', 'pause'].includes(state.phase || '') && Number.isInteger(state.room) && state.room! >= 1 && state.room! <= 6 && (state.tool === null || TOOLS.includes(state.tool || '')) && !!state.player && Number.isInteger(state.player.x) && Number.isInteger(state.player.y) && Number.isInteger(state.health) && Number.isInteger(state.beacons) && Array.isArray(state.log) && state.log.every(item => typeof item === 'string') && typeof state.message === 'string' && typeof state.roomUsed === 'boolean' && Array.isArray(state.cleared) && Array.isArray(state.collected) && Number.isInteger(state.turn) && Number.isInteger(state.enemyDelay) && Number.isInteger(state.shield);
}

function sampleGame() {
  const sample = selectTool(createGame(today), 'Hook', Date.now() - 58_000) as GameState;
  const directions = [{ token: 'R', dx: 1, dy: 0 }, { token: 'D', dx: 0, dy: 1 }, { token: 'L', dx: -1, dy: 0 }, { token: 'U', dx: 0, dy: -1 }];
  const pathTo = (target: Point) => {
    const room = roomFor(seed, sample.room);
    const blocked = new Set([...room.walls, ...room.hazards].map(point => `${point.x},${point.y}`));
    blocked.delete(`${target.x},${target.y}`);
    const queue = [{ ...sample.player, path: [] as string[] }];
    const seen = new Set([`${sample.player.x},${sample.player.y}`]);
    while (queue.length) {
      const current = queue.shift()!;
      if (same(current, target)) return current.path;
      for (const direction of directions) {
        const next = { x: current.x + direction.dx, y: current.y + direction.dy };
        const nextKey = `${next.x},${next.y}`;
        if (next.x < 0 || next.x >= BOARD_WIDTH || next.y < 0 || next.y >= BOARD_HEIGHT || blocked.has(nextKey) || seen.has(nextKey)) continue;
        seen.add(nextKey); queue.push({ ...next, path: [...current.path, direction.token] });
      }
    }
    return [];
  };
  const firstRoom = roomFor(seed, 1);
  for (const target of [...firstRoom.beacons, firstRoom.exit]) for (const action of pathTo(target)) applyAction(sample, action, seed, Date.now() - 30_000);
  const roomTwo = roomFor(seed, 2);
  for (const action of pathTo(roomTwo.beacons[0])) applyAction(sample, action, seed, Date.now() - 10_000);
  sample.message = 'Sample run in progress. One beacon is lit in room two; guide the walker to the other two.';
  return sample;
}

function loadGame() {
  try {
    const stored = localStorage.getItem(runKey());
    const parsed: unknown = stored ? JSON.parse(stored) : null;
    const validStored = validGame(parsed);
    const loaded = validStored ? parsed : demo() ? sampleGame() : createGame(today);
    if (validStored && loaded.phase === 'play') {
      loaded.pausedFrom = 'play';
      loaded.phase = 'pause';
      loaded.message = 'Your saved run is paused. Resume when you are ready.';
    }
    return loaded;
  } catch { return demo() ? sampleGame() : createGame(today); }
}

function loadHistory(): HistoryItem[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(historyKey()) || '[]');
    return Array.isArray(parsed) ? parsed.filter(item => item && typeof item === 'object').slice(0, 8) as HistoryItem[] : [];
  } catch { return []; }
}

let settings = loadSettings();
let game = loadGame();
let runHistory = loadHistory();
const sampleLeaderboard = (): LeaderboardItem[] => [
  { rank: 1, nickname: 'PineFox', score: 1390, result: 'escaped', tool: 'Hook', durationSeconds: 354, replay: 'Sample verified replay', verified: true },
  { rank: 2, nickname: 'SunMoth', score: 1325, result: 'escaped', tool: 'Decoy', durationSeconds: 382, replay: 'Sample verified replay', verified: true },
];
let leaderboard: LeaderboardItem[] = demo() ? sampleLeaderboard() : [];
let leaderboardMessage = demo() ? 'Two sample results are shown. They are bundled with the demo.' : 'Load today’s verified scores when you are online.';
let leaderboardBusy = false;
let discardingDemo = false;

function saveGame() { localStorage.setItem(runKey(), JSON.stringify(game)); }
function saveSettings() {
  localStorage.setItem(settingsKey(), JSON.stringify(settings));
  document.documentElement.classList.toggle('reduced-effects', settings.reducedEffects);
}

function recordHistory() {
  if (game.phase !== 'end' || !game.finished) return;
  const replay = replayText(game, seed);
  const id = hashString(replay).toString(36);
  const duration = game.startedAt && game.finishedAt ? Math.max(0, Math.round((game.finishedAt - game.startedAt) / 1000)) : 0;
  if (!runHistory.some(item => item.id === id)) {
    runHistory = [{ id, date: today, result: game.finished, score: scoreGame(game), tool: game.tool || 'None', moves: game.log.length, duration, replay, published: false }, ...runHistory].slice(0, 8);
    localStorage.setItem(historyKey(), JSON.stringify(runHistory));
  }
}

function choose(tool: Tool) {
  if (!toolOffers(playerId(), today).includes(tool)) return;
  game = selectTool(createGame(today), tool) as GameState;
  saveGame();
  renderGame('[role="grid"]');
}

function runAction(action: string, preferredFocus?: string) {
  const priorPhase = game.phase;
  applyAction(game, action, seed);
  if (game.phase === 'end' && priorPhase !== 'end') recordHistory();
  saveGame();
  const fallback = game.phase === 'end' ? '#result-heading' : game.phase === 'cashout' ? '[data-action="final"]' : '[role="grid"]';
  renderGame(game.phase === 'play' ? preferredFocus || fallback : fallback);
}

function pause() {
  if (game.phase !== 'play') return;
  game.pausedFrom = 'play'; game.phase = 'pause'; game.message = 'Paused. Resume when you are ready.';
  saveGame(); renderGame('[data-action="resume"]');
}
function resume() {
  if (game.phase !== 'pause') return;
  game.phase = game.pausedFrom || 'play'; game.message = 'Run resumed.';
  saveGame(); renderGame('[role="grid"]');
}
function restart() {
  if (demo()) { resetDemo(); return; }
  localStorage.removeItem(runKey()); game = createGame(today); leaderboard = [];
  leaderboardMessage = 'Load today’s verified scores when you are online.';
  renderGame('[data-tool]');
}
function clearDemo() { Object.keys(localStorage).filter(key => key.startsWith('demo:')).forEach(key => localStorage.removeItem(key)); }
function resetDemo() { discardingDemo = true; clearDemo(); location.assign('/demo'); }
function goReal() { discardingDemo = true; clearDemo(); location.assign('/'); }

async function copyText(text: string) {
  try { if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); return; } } catch { /* selection fallback */ }
  const area = document.createElement('textarea'); area.value = text; area.className = 'copy-buffer'; area.setAttribute('readonly', ''); document.body.append(area); area.select();
  const copied = document.execCommand('copy'); area.remove(); if (!copied) throw new Error('copy unavailable');
}
async function copyResult() {
  try { await copyText(replayText(game, seed)); game.message = 'Result copied. Paste it into Compare a copied result.'; }
  catch { game.message = 'Copy is unavailable here. Select the replay text to copy it.'; }
  saveGame(); renderGame('[data-action="copy"]');
}
async function shareResult() {
  const canShare = typeof navigator.share === 'function';
  try { if (canShare) await navigator.share({ title: 'Dawn Run result', text: replayText(game, seed) }); else await copyText(replayText(game, seed)); game.message = canShare ? 'Share sheet opened.' : 'Result copied to share.'; }
  catch { game.message = 'Sharing was cancelled. Your result remains on this device.'; }
  saveGame(); renderGame('[data-action="share"]');
}

function parseReplay(value: string) {
  const match = /date=([^|]+)\s*\|\s*seed=([^|]+)\s*\|\s*tool=([^|]+)\s*\|\s*result=(escaped|cashed out|caught)\s*\|\s*score=(\d+)\s*\|\s*time=(\d+)s\s*\|\s*replay=(.+)$/i.exec(value.trim());
  return match ? { date: match[1].trim(), seed: match[2].trim(), tool: match[3].trim(), result: match[4].toLowerCase(), score: Number(match[5]), time: Number(match[6]), replay: match[7].trim() } : null;
}
function compareResult() {
  const input = document.querySelector<HTMLInputElement>('#comparison-input'); const output = document.querySelector<HTMLElement>('#comparison-result'); if (!output) return;
  const parsed = parseReplay(input?.value.replace(/^Replay data:\s*/i, '') || '');
  if (!parsed) { output.textContent = 'That text is not a complete Dawn Run result. Copy the whole result and try again.'; return; }
  output.textContent = `${parsed.seed === seed ? 'Same daily route.' : 'Different daily route.'} Their ${parsed.tool} run ${parsed.result} with ${parsed.score} points in ${parsed.time} seconds. Move record: ${parsed.replay}.`;
}

function submissionPayload() {
  return {
    nickname: settings.nickname, date: today, seed, tool: game.tool, result: game.finished, score: scoreGame(game),
    durationSeconds: game.startedAt && game.finishedAt ? Math.max(0, Math.round((game.finishedAt - game.startedAt) / 1000)) : 0,
    actions: game.log, demo: demo(),
  };
}

async function publishScore() {
  if (leaderboardBusy || game.phase !== 'end') return;
  const input = document.querySelector<HTMLInputElement>('#nickname');
  const nickname = cleanNickname(input?.value || settings.nickname);
  if (nickname.length < 2) { leaderboardMessage = 'Enter a nickname with 2–16 letters or numbers.'; renderGame('#nickname'); return; }
  settings.nickname = nickname; saveSettings(); leaderboardBusy = true;
  leaderboardMessage = demo() ? 'Checking the sample move record…' : 'Checking and publishing your score…'; renderGame('[data-action="publish"]');
  try {
    const response = await fetch('/api/scores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(submissionPayload()) });
    const body = await response.json() as { message?: string; entries?: LeaderboardItem[] };
    if (!response.ok) throw new Error(body.message || `The score service returned ${response.status}.`);
    leaderboard = body.entries || [];
    leaderboardMessage = demo() ? 'Sample move record checked. Demo data was not published.' : body.message || 'Your verified score is published.';
    if (!demo()) {
      runHistory = runHistory.map((item, index) => index === 0 ? { ...item, published: true } : item);
      localStorage.setItem(historyKey(), JSON.stringify(runHistory));
    }
  } catch (error) {
    leaderboardMessage = navigator.onLine ? `The score could not be published. ${error instanceof Error ? error.message : 'Try again.'}` : 'You are offline. Your result is safe in local history; publish it when you reconnect.';
  } finally { leaderboardBusy = false; renderGame('[data-action="publish"]'); }
}

async function loadLeaderboard() {
  if (leaderboardBusy) return;
  leaderboardBusy = true; leaderboardMessage = 'Loading today’s verified scores…'; renderGame('[data-action="load-scores"]');
  try {
    const response = await fetch(`/api/scores?date=${encodeURIComponent(today)}&demo=${demo() ? '1' : '0'}`);
    const body = await response.json() as { message?: string; entries?: LeaderboardItem[] };
    if (!response.ok) throw new Error(body.message || `The score service returned ${response.status}.`);
    leaderboard = body.entries || []; leaderboardMessage = body.message || (leaderboard.length ? 'Today’s verified scores are ready.' : 'No verified scores yet today.');
  } catch (error) {
    leaderboardMessage = navigator.onLine ? `Scores are unavailable. ${error instanceof Error ? error.message : 'Try again.'}` : 'Scores are unavailable offline. Your local run still works.';
  } finally { leaderboardBusy = false; renderGame('[data-action="load-scores"]'); }
}

function toolCard(tool: string) {
  const text: Record<string, string> = { Hook: 'Clear one rock beside you.', Dash: 'Move east two tiles once per room.', Lantern: 'Restore up to two health once per room.', Decoy: 'Delay the watcher for six turns.', Cloak: 'Block the next watcher hit.' };
  return `<button class="tool" data-tool="${tool}"><span class="tool-name">${tool}</span><span>${text[tool]}</span></button>`;
}

function roomBeaconCount() { return game.collected.filter(item => item.startsWith(`${game.room}:`)).length; }

function board() {
  const room = roomFor(seed, game.room);
  const rows = Array.from({ length: BOARD_HEIGHT }, (_, y) => {
    const cells = Array.from({ length: BOARD_WIDTH }, (_, x) => {
      const cell = { x, y }; let type = 'ground'; let label = 'open route';
      if (same(cell, room.exit)) { type = 'exit'; label = roomBeaconCount() === REQUIRED_BEACONS ? 'open exit flag' : `closed exit flag, ${REQUIRED_BEACONS - roomBeaconCount()} beacons remain`; }
      if (room.walls.some(wall => same(wall, cell)) && !game.cleared.includes(pointKey(game.room, cell))) { type = 'wall'; label = 'rock, blocked'; }
      if (room.beacons.some(beacon => same(beacon, cell)) && !game.collected.includes(pointKey(game.room, cell))) { type = 'beacon'; label = 'unlit beacon, required'; }
      if (room.hazards.some(hazard => same(hazard, cell))) { type = 'hazard'; label = 'bramble, costs one health'; }
      if (game.room > 1 && same(game.enemy || room.enemy, cell)) { type = 'enemy'; label = 'watcher'; }
      if (same(game.player, cell)) { type = 'player'; label = 'you are here'; }
      const icon = type === 'player' ? '●' : type === 'exit' ? '⚑' : type === 'wall' ? '▦' : type === 'beacon' ? '✦' : type === 'hazard' ? '✕' : type === 'enemy' ? '◉' : '';
      const coordinate = settings.coordinates ? `<small aria-hidden="true">${String.fromCharCode(65 + x)}${y + 1}</small>` : '';
      return `<div class="tile ${type}" role="gridcell" data-cell="${x},${y}" aria-label="Row ${y + 1}, column ${x + 1}: ${label}"><span aria-hidden="true">${icon}</span>${coordinate}</div>`;
    }).join('');
    return `<div class="board-row" role="row">${cells}</div>`;
  }).join('');
  return `<section class="board-wrap" aria-label="Room ${game.room} board"><p class="map-key" id="board-key"><span><i class="dot you"></i>You</span><span><i class="dot light"></i>Beacon</span><span><i class="dot flag"></i>Exit</span><span><i class="dot watch"></i>Watcher</span></p><div class="board" role="grid" tabindex="0" aria-label="Room ${game.room} tactical board, nine columns and seven rows. ${roomBeaconCount()} of three beacons lit." aria-describedby="board-key">${rows}</div></section>`;
}

function formatDuration(seconds: number) { return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }
function durationSeconds() { return game.startedAt && game.finishedAt ? Math.max(0, Math.round((game.finishedAt - game.startedAt) / 1000)) : 0; }

function leaderboardView() {
  const rows = leaderboard.map((item, index) => `<tr><td>${item.rank || index + 1}</td><td>${escapeHtml(item.nickname)}</td><td>${item.score}</td><td>${escapeHtml(item.tool)}</td><td>${formatDuration(item.durationSeconds)}</td><td><details class="table-replay"><summary>View move record</summary><code>${escapeHtml(item.replay)}</code></details></td></tr>`).join('');
  return `<section class="leaderboard" aria-labelledby="leaderboard-heading"><h3 id="leaderboard-heading">Today’s verified scores</h3><p>Publish sends your nickname, date, tool, score, time, and move record to Dawn Run. Published entries expire after seven days.</p><label for="nickname">Public nickname</label><input id="nickname" maxlength="16" autocomplete="nickname" value="${escapeHtml(settings.nickname)}"><div class="actions"><button class="primary" data-action="publish" ${leaderboardBusy ? 'disabled' : ''}>${demo() ? 'Check sample submission' : 'Publish verified score'}</button><button class="secondary" data-action="load-scores" ${leaderboardBusy ? 'disabled' : ''}>Load today’s scores</button></div><p id="leaderboard-status" class="status" aria-live="polite">${escapeHtml(leaderboardMessage)}</p>${rows ? `<div class="table-scroll"><table><caption>Verified move records for ${today}</caption><thead><tr><th>Rank</th><th>Nickname</th><th>Score</th><th>Tool</th><th>Time</th><th>Move record</th></tr></thead><tbody>${rows}</tbody></table></div>` : ''}${demo() ? '<p class="small">Demo submissions are checked against sample standings but are never published.</p>' : ''}</section>`;
}

function endView() {
  const heading = game.finished === 'escaped' ? 'You escaped the sixth room.' : game.finished === 'cashed out' ? 'You cashed out after five rooms.' : 'The watcher ended this run.';
  const seconds = durationSeconds();
  return `<section class="game-panel result"><p class="eyebrow">DAILY RUN ${game.finished === 'escaped' ? 'COMPLETE' : 'ENDED'}</p><h2 id="result-heading" tabindex="-1">${heading}</h2><dl class="score"><div><dt>Score</dt><dd>${scoreGame(game)}</dd></div><div><dt>Health</dt><dd>${game.health}/${MAX_HEALTH}</dd></div><div><dt>Route</dt><dd>${game.log.length} turns</dd></div><div><dt>Time</dt><dd id="run-duration" data-seconds="${seconds}">${formatDuration(seconds)}</dd></div></dl><p class="replay" id="replay-data"><b>Move record:</b> ${escapeHtml(replayText(game, seed))}</p><p class="status" aria-live="polite">${escapeHtml(game.message)}</p><div class="actions"><button class="primary" data-action="copy">Copy result</button><button class="secondary" data-action="share">Share result</button></div>${leaderboardView()}<section class="comparison" aria-labelledby="comparison-heading"><h3 id="comparison-heading">Compare a copied result</h3><label for="comparison-input">Paste a Dawn Run result</label><div class="comparison-row"><input id="comparison-input" autocomplete="off"><button class="secondary" data-action="compare">Compare result</button></div><p id="comparison-result" aria-live="polite">Compare the map code, tool, score, time, and move record with another player.</p></section><button class="primary" data-action="restart">${demo() ? 'Restart this sample run' : 'Start a fresh practice run'}</button></section>`;
}

function gameView() {
  if (game.phase === 'choose') {
    const offered = toolOffers(localStorage.getItem(playerKey()) || previewPlayer(), today);
    return `<section class="game-panel choose"><div class="run-meta"><span>Today’s map code: <b>${seed}</b></span><span>6 ROOMS · 18 BEACONS</span></div><h2>Choose one tool</h2><p>Your three-tool offer is set by this browser. Another player can receive a different set on the same map.</p><div class="tool-grid">${offered.map(toolCard).join('')}</div><p class="small">The map stays shared.</p></section>`;
  }
  if (game.phase === 'cashout') return `<section class="game-panel result"><p class="eyebrow">ROOM FIVE COMPLETE</p><h2>Cash out or take the final chase?</h2><p>Your current score is <strong>${scoreGame(game)}</strong>. The last watcher moves faster when a beacon lights.</p><div class="actions"><button class="primary" data-action="final">Run the final chase</button><button class="secondary" data-action="cash">Cash out with ${scoreGame(game)}</button></div></section>`;
  if (game.phase === 'end') return endView();
  if (game.phase === 'pause') return `<section class="game-panel result"><p class="eyebrow">RUN PAUSED</p><h2>Resume your run</h2><p>Your room, score, tool, and lit beacons are saved in this browser.</p><button class="primary" data-action="resume">Resume run</button><p class="small">Press Escape or tap Resume run.</p></section>`;
  const directions = [['↑', 0, -1, 'Up'], ['←', -1, 0, 'Left'], ['↓', 0, 1, 'Down'], ['→', 1, 0, 'Right']] as const;
  const moveNames: Record<string, string> = { R: 'right', D: 'down', L: 'left', U: 'up' };
  const recentMoves = game.log.slice(-5).map(action => moveNames[action] || action.toLowerCase()).join(', ');
  const sampleProgress = demo() ? `<section class="sample-progress" aria-labelledby="sample-progress-heading"><h3 id="sample-progress-heading">Sample run in progress</h3><p><b>Recent moves:</b> ${recentMoves}. One beacon is already lit.</p><h3>Sample standings</h3><ol>${sampleLeaderboard().map(item => `<li><span>${item.nickname} · ${item.tool}</span><b>${item.score}</b></li>`).join('')}</ol><button class="secondary" data-action="reset-demo">Restart this sample run</button></section>` : '';
  return `<section class="game-panel play"><div class="run-meta"><span>Today’s map code: <b>${seed}</b></span><span>6 ROOMS · 18 BEACONS</span></div><h2 class="game-heading">Room ${game.room} in progress</h2><div class="hud"><span>ROOM <b>${game.room}/6</b></span><span>HEALTH <b>${'●'.repeat(game.health)}${'○'.repeat(MAX_HEALTH - game.health)}</b></span><span>BEACONS <b>${roomBeaconCount()}/${REQUIRED_BEACONS}</b></span><span>SCORE <b>${scoreGame(game)}</b></span></div>${board()}<p class="status" aria-live="polite">${escapeHtml(game.message)}</p><div class="actions"><button class="primary" data-action="tool" ${game.roomUsed ? 'disabled aria-disabled="true"' : ''}>Use ${game.tool}${game.roomUsed ? ' (used)' : ''}</button><button class="secondary" data-action="pause">Pause</button></div><div class="controls" aria-label="Move controls">${directions.map(([symbol, x, y, name]) => `<button aria-label="Move ${name}" data-move="${x},${y}">${symbol}</button>`).join('')}</div><p class="small input-note">Light all three beacons. Then reach the flag. Arrow keys or these controls move.</p>${sampleProgress}</section>`;
}

function progressView() {
  const best = runHistory.length ? Math.max(...runHistory.map(item => item.score)) : 0;
  const rows = runHistory.map(item => `<li><span>${item.date} · ${escapeHtml(item.tool)} · ${escapeHtml(item.result)}</span><b>${item.score}</b><small>${item.moves} turns · ${formatDuration(item.duration)}${item.published ? ' · published' : ''}</small></li>`).join('');
  return `<details class="progress-panel"><summary>Settings and run history</summary><div class="settings"><h2>Game settings</h2><label><input type="checkbox" data-setting="coordinates" ${settings.coordinates ? 'checked' : ''}> Show board coordinates</label><label><input type="checkbox" data-setting="reducedEffects" ${settings.reducedEffects ? 'checked' : ''}> Reduce visual effects</label><p class="small">Settings stay in this browser. Your three-tool offer stays tied to this browser.</p></div><div class="history"><h2>Recent runs</h2><p>Best score: <strong>${best || 'No score yet'}</strong></p>${rows ? `<ol>${rows}</ol>` : '<p>Finished runs will appear here.</p>'}</div></details>`;
}

function shell(content: string) {
  return `<a class="skip" href="#main">Skip to the game</a><header><a class="wordmark" href="/" data-nav>Dawn <i>Run</i></a><nav aria-label="Main navigation"><a href="/demo" data-nav>Demo</a><a href="/#how" data-nav>How it works</a><a href="/privacy" data-nav>Privacy</a></nav></header>${demo() ? `<div class="demo-banner" role="status">Demo — sample data, nothing is saved <span><button data-action="reset-demo">Reset demo</button><button data-action="real">Start for real</button></span></div>` : ''}<main id="main" tabindex="-1">${content}</main><footer><span>A six-room tactical route for one player.</span><span class="footer-links"><a href="/privacy" data-nav>Privacy</a><a href="/terms" data-nav>Terms</a></span><span>Built by Param Factory · v2.1</span><small>The background illustration is original generated art.</small></footer><div class="route-live" aria-live="polite"></div>`;
}

function landing() {
  const demoIntro = demo() ? `<p class="demo-kicker">READY TO PLAY</p><h1 tabindex="-1">Continue a sample run</h1><p class="lede">Room two is underway with Hook selected, one beacon lit, and two sample scores ready to compare.</p>` : `<h1 tabindex="-1">Play a six-room daily run</h1><p class="lede">For people who want a 5–7 minute tactical game to compare each day.</p><div class="actions"><button class="primary" data-action="sample">Try it with sample data</button><span class="button-note">Opens a sample game already in progress. Sample play stays separate from your runs.</span></div><ul class="facts"><li>Free to play</li><li>18 beacons on one shared map</li><li>Works offline after the first visit</li><li>Scores publish only when you choose</li></ul>`;
  return shell(`<section class="hero${demo() ? ' demo-hero' : ''}"><div class="hero-copy">${demoIntro}</div><div class="hero-game"><div class="hero-art" aria-label="A printed sunrise route map with the daily game">${gameView()}</div>${progressView()}</div></section><section id="how" class="how" tabindex="-1"><h2>How the daily run works</h2><ol><li><b>Pick one offered tool.</b> Each browser gets three from five tools.</li><li><b>Light 18 beacons.</b> Avoid rocks and brambles while the watcher follows you.</li><li><b>Publish a verified result.</b> Submit a nickname and a record of your moves after the run.</li></ol></section><section class="plain"><h2>What Dawn Run sends</h2><p>Your current run, settings, and eight recent results stay in this browser. Dawn Run sends a score only after you choose Publish verified score.</p></section>`);
}

function privacy() {
  return shell(`<article class="legal"><h1 tabindex="-1">Privacy at Dawn Run</h1><p>Dawn Run stores your current run, settings, player code, and eight recent results in this browser.</p><p>Nothing is published until you choose Publish verified score. Publication sends your nickname, date, tool, score, time, and move record to Dawn Run.</p><p>Published entries use your chosen nickname and expire after seven days. Dawn Run does not use analytics, advertising, accounts, or third-party scripts.</p><p>The demo uses separate keys that start with <code>demo:</code>. Reset demo and Start for real remove those keys. Demo submissions are not stored.</p><p><a href="/" data-nav>Return to the daily run</a>.</p></article>`);
}

function terms() {
  return shell(`<article class="legal"><h1 tabindex="-1">Terms for Dawn Run</h1><p>Dawn Run is a free browser game for personal play.</p><p>Dawn Run checks each published score against its move record. Published scores expire after seven days.</p><p>Changed or abusive submissions may be rejected. The game and score service are provided as-is.</p><p><a href="/" data-nav>Return to the daily run</a>.</p></article>`);
}

function setMeta(path: string) {
  const title = path === '/privacy' ? 'Privacy — Dawn Run' : path === '/terms' ? 'Terms — Dawn Run' : demo() ? 'Demo — Dawn Run' : 'Dawn Run — Play a six-room daily run';
  const description = path === '/privacy' ? 'How Dawn Run stores and publishes game data.' : path === '/terms' ? 'Terms for the Dawn Run browser game.' : demo() ? 'Try an isolated sample Dawn Run.' : 'Play a 5–7 minute tactical route and publish a verified daily score.';
  document.title = title;
  document.querySelector('meta[name="description"]')?.setAttribute('content', description);
  const canonicalPath = demo() ? '/demo' : path;
  document.querySelector('link[rel="canonical"]')?.setAttribute('href', `https://dawn-run.sociobot.in${canonicalPath}`);
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
  document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
  document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', title);
  document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', description);
}

function render(options: { routeFocus?: boolean; focus?: string } = {}) {
  const path = location.pathname; setMeta(path); document.documentElement.classList.toggle('reduced-effects', settings.reducedEffects);
  document.body.classList.toggle('is-demo', demo());
  app.innerHTML = path === '/privacy' ? privacy() : path === '/terms' ? terms() : landing();
  document.querySelector<HTMLElement>('.route-live')!.textContent = document.title;
  requestAnimationFrame(() => {
    if (location.hash === '#how') {
      const target = document.querySelector<HTMLElement>('#how'); target?.scrollIntoView({ block: 'start' }); target?.focus({ preventScroll: true });
    } else if (options.routeFocus) document.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
    else if (options.focus) document.querySelector<HTMLElement>(options.focus)?.focus({ preventScroll: true });
  });
}

function focusSelector(element: Element | null) {
  if (!(element instanceof HTMLElement)) return undefined;
  if (element.id) return `#${CSS.escape(element.id)}`;
  for (const name of ['action', 'move']) if (element.dataset[name]) return `[data-${name}="${CSS.escape(element.dataset[name] || '')}"]`;
  if (element.getAttribute('role') === 'grid') return '[role="grid"]';
  return undefined;
}
function renderGame(preferred?: string) { const prior = focusSelector(document.activeElement); render({ focus: preferred || prior }); }
function navigate(href: string) {
  window.history.pushState({}, '', href); settings = loadSettings(); game = loadGame(); runHistory = loadHistory(); render({ routeFocus: true });
}

document.addEventListener('click', event => {
  const target = (event.target as HTMLElement).closest<HTMLElement>('[data-action],[data-tool],[data-move],[data-nav]'); if (!target) return;
  if (target.dataset.nav !== undefined) { event.preventDefault(); navigate((target as HTMLAnchorElement).getAttribute('href') || '/'); return; }
  const action = target.dataset.action;
  if (target.dataset.tool) choose(target.dataset.tool as Tool);
  else if (target.dataset.move) { const [x, y] = target.dataset.move.split(',').map(Number); const token = x === 1 ? 'R' : x === -1 ? 'L' : y === 1 ? 'D' : 'U'; runAction(token, `[data-move="${target.dataset.move}"]`); }
  else if (action === 'tool') runAction('T');
  else if (action === 'pause') pause();
  else if (action === 'resume') resume();
  else if (action === 'final') runAction('CHASE');
  else if (action === 'cash') runAction('CASH');
  else if (action === 'restart') restart();
  else if (action === 'sample') location.assign('/demo');
  else if (action === 'reset-demo') resetDemo();
  else if (action === 'real') goReal();
  else if (action === 'copy') void copyResult();
  else if (action === 'share') void shareResult();
  else if (action === 'compare') compareResult();
  else if (action === 'publish') void publishScore();
  else if (action === 'load-scores') void loadLeaderboard();
});

document.addEventListener('change', event => {
  const input = (event.target as HTMLElement).closest<HTMLInputElement>('[data-setting]'); if (!input) return;
  if (input.dataset.setting === 'coordinates') settings.coordinates = input.checked;
  if (input.dataset.setting === 'reducedEffects') settings.reducedEffects = input.checked;
  saveSettings();
});

window.addEventListener('popstate', () => { settings = loadSettings(); game = loadGame(); runHistory = loadHistory(); render({ routeFocus: true }); });
window.addEventListener('keydown', event => {
  if (event.key === 'Escape') { if (game.phase === 'pause') resume(); else if (game.phase === 'play') pause(); return; }
  const keys: Record<string, string> = { ArrowUp: 'U', ArrowDown: 'D', ArrowLeft: 'L', ArrowRight: 'R' };
  if (keys[event.key] && game.phase === 'play') { event.preventDefault(); runAction(keys[event.key], focusSelector(document.activeElement)); }
});
document.addEventListener('visibilitychange', () => {
  const hasPersistedRun = Boolean(localStorage.getItem(runKey()));
  if (!discardingDemo && document.hidden && game.phase === 'play' && (!demo() || hasPersistedRun)) pause();
});

let last = performance.now(); let accumulator = 0;
function loop(now: number) { accumulator += Math.min(250, now - last); last = now; while (accumulator >= 1000 / 60) accumulator -= 1000 / 60; requestAnimationFrame(loop); }
requestAnimationFrame(loop);
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'));
render();
