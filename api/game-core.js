export const BOARD_WIDTH = 9;
export const BOARD_HEIGHT = 7;
export const REQUIRED_BEACONS = 3;
export const MAX_HEALTH = 5;
export const TOOLS = ['Hook', 'Dash', 'Lantern', 'Decoy', 'Cloak'];

const copy = value => JSON.parse(JSON.stringify(value));
const same = (a, b) => a.x === b.x && a.y === b.y;
const key = point => `${point.x},${point.y}`;

export function hashString(input) {
  let value = 2166136261;
  for (const char of input) value = Math.imul(value ^ char.charCodeAt(0), 16777619);
  return value >>> 0;
}

function rng(seed) {
  return () => {
    seed |= 0;
    seed = seed + 0x6d2b79f5 | 0;
    let value = Math.imul(seed ^ seed >>> 15, 1 | seed);
    value = value + Math.imul(value ^ value >>> 7, 61 | value) ^ value;
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

export function seedForDate(date) {
  return hashString(date).toString(36).toUpperCase();
}

export function toolOffers(playerId, date) {
  const loadouts = [
    ['Hook', 'Dash', 'Lantern'],
    ['Dash', 'Lantern', 'Decoy'],
    ['Lantern', 'Decoy', 'Cloak'],
    ['Decoy', 'Cloak', 'Hook'],
    ['Cloak', 'Hook', 'Dash'],
  ];
  return [...loadouts[hashString(`${playerId}:${date}`) % loadouts.length]];
}

function routeBetween(from, to) {
  const points = [];
  let cursor = { ...from };
  while (cursor.x !== to.x) {
    cursor = { x: cursor.x + Math.sign(to.x - cursor.x), y: cursor.y };
    points.push(cursor);
  }
  while (cursor.y !== to.y) {
    cursor = { x: cursor.x, y: cursor.y + Math.sign(to.y - cursor.y) };
    points.push(cursor);
  }
  return points;
}

function choosePoint(random, choices, used = []) {
  const available = choices.filter(choice => !used.some(item => same(choice, item)));
  return copy(available[Math.floor(random() * available.length)] || choices[0]);
}

export function roomFor(seed, room) {
  const random = rng(hashString(`${seed}:room:${room}:v2`));
  const upper = [0, 1];
  const lower = [5, 6];
  const firstBand = room % 2 ? upper : lower;
  const secondBand = room % 2 ? lower : upper;
  const beacons = [
    { x: 2 + Math.floor(random() * 2), y: firstBand[Math.floor(random() * firstBand.length)] },
    { x: 4 + Math.floor(random() * 2), y: secondBand[Math.floor(random() * secondBand.length)] },
    { x: 6 + Math.floor(random() * 2), y: firstBand[Math.floor(random() * firstBand.length)] },
  ];
  const start = { x: 0, y: 3 };
  const exit = { x: 8, y: 3 };
  const protectedPath = [start, ...routeBetween(start, beacons[0]), ...routeBetween(beacons[0], beacons[1]), ...routeBetween(beacons[1], beacons[2]), ...routeBetween(beacons[2], exit)];
  const candidates = [];
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    for (let x = 1; x < BOARD_WIDTH - 1; x++) {
      const point = { x, y };
      if (!protectedPath.some(item => same(item, point)) && !beacons.some(item => same(item, point))) candidates.push(point);
    }
  }
  const walls = [];
  while (walls.length < 7 + room) walls.push(choosePoint(random, candidates, walls));
  const hazardChoices = [];
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    for (let x = 1; x < BOARD_WIDTH - 1; x++) {
      const point = { x, y };
      if (!walls.some(item => same(item, point)) && !beacons.some(item => same(item, point))) hazardChoices.push(point);
    }
  }
  const hazards = [];
  while (hazards.length < 3) hazards.push(choosePoint(random, hazardChoices, hazards));
  const enemy = choosePoint(random, [{ x: 8, y: 0 }, { x: 8, y: 6 }, { x: 7, y: 0 }, { x: 7, y: 6 }]);
  return { walls, beacons, hazards, enemy, start, exit };
}

export function createGame(date) {
  return {
    version: 2,
    date,
    phase: 'choose',
    room: 1,
    tool: null,
    player: { x: 0, y: 3 },
    health: MAX_HEALTH,
    beacons: 0,
    log: [],
    message: 'Pick one of your three tools for all six rooms.',
    roomUsed: false,
    cleared: [],
    collected: [],
    enemy: null,
    turn: 0,
    enemyDelay: 0,
    shield: 0,
  };
}

export function scoreGame(game) {
  return Math.max(0, (game.room - 1) * 150 + game.beacons * 35 + game.health * 25);
}

export function selectTool(game, tool, startedAt = Date.now()) {
  if (!TOOLS.includes(tool)) return game;
  const next = createGame(game.date);
  next.tool = tool;
  next.startedAt = startedAt;
  next.phase = 'play';
  next.message = `${tool} packed. Light all three beacons, then reach the flag.`;
  return next;
}

function pointKey(room, point) {
  return `${room}:${key(point)}`;
}

function finish(game, result, now) {
  game.phase = 'end';
  game.finished = result;
  game.finishedAt = now;
  game.message = result === 'escaped' ? 'You crossed the final flag.' : result === 'cashed out' ? 'You banked a careful score.' : 'The dawn route closed behind you.';
}

function collect(game, room) {
  const beacon = room.beacons.find(item => same(item, game.player) && !game.collected.includes(pointKey(game.room, item)));
  if (beacon) {
    game.collected.push(pointKey(game.room, beacon));
    game.beacons++;
    game.message = `Beacon lit. ${REQUIRED_BEACONS - game.collected.filter(item => item.startsWith(`${game.room}:`)).length} remain in this room.`;
  }
  if (room.hazards.some(item => same(item, game.player))) {
    game.health--;
    game.message = 'The bramble cost one health.';
  }
  if (game.health <= 0) finish(game, 'caught', Date.now());
  return Boolean(beacon);
}

function enemyTurn(game, room, beaconLit) {
  if (game.room < 2 || game.phase !== 'play') return;
  if (!game.enemy) game.enemy = copy(room.enemy);
  if (game.enemyDelay > 0) {
    game.enemyDelay--;
    return;
  }
  if (!beaconLit) return;
  const steps = game.room === 6 && beaconLit ? 2 : 1;
  for (let step = 0; step < steps; step++) {
    const watcher = game.enemy;
    const dx = Math.sign(game.player.x - watcher.x);
    const dy = Math.sign(game.player.y - watcher.y);
    const horizontal = Math.abs(game.player.x - watcher.x) >= Math.abs(game.player.y - watcher.y);
    const candidates = horizontal
      ? [{ x: watcher.x + dx, y: watcher.y }, { x: watcher.x, y: watcher.y + dy }]
      : [{ x: watcher.x, y: watcher.y + dy }, { x: watcher.x + dx, y: watcher.y }];
    const next = candidates.find(candidate => candidate.x >= 0 && candidate.x < BOARD_WIDTH && candidate.y >= 0 && candidate.y < BOARD_HEIGHT && !room.walls.some(wall => same(wall, candidate) && !game.cleared.includes(pointKey(game.room, wall))));
    if (next) game.enemy = next;
    if (same(game.enemy, game.player)) {
      if (game.shield > 0) {
        game.shield--;
        game.message = 'Your cloak turned aside the watcher.';
      } else {
        game.health--;
        game.message = 'The watcher caught up. You lost one health.';
      }
      game.enemy = copy(room.enemy);
      if (game.health <= 0) {
        finish(game, 'caught', Date.now());
        return;
      }
    }
  }
}

function roomBeaconCount(game) {
  return game.collected.filter(item => item.startsWith(`${game.room}:`)).length;
}

function advance(game, now) {
  if (game.room === 5) {
    game.phase = 'cashout';
    game.message = 'You reached the fifth flag. Take the score or face the final chase.';
    return;
  }
  if (game.room === 6) {
    finish(game, 'escaped', now);
    return;
  }
  game.room++;
  game.player = { x: 0, y: 3 };
  game.enemy = null;
  game.roomUsed = false;
  game.enemyDelay = 0;
  game.shield = 0;
  game.turn = 0;
  game.message = `Room ${game.room}. Light three beacons before you use the flag.`;
}

function applyMove(game, action, seed, now) {
  const vectors = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] };
  const [dx, dy] = vectors[action];
  const room = roomFor(seed, game.room);
  const next = { x: game.player.x + dx, y: game.player.y + dy };
  const blocked = next.x < 0 || next.x >= BOARD_WIDTH || next.y < 0 || next.y >= BOARD_HEIGHT || room.walls.some(wall => same(wall, next) && !game.cleared.includes(pointKey(game.room, wall)));
  if (blocked) {
    game.message = 'That route is blocked. Try another tile or use your tool.';
    return false;
  }
  game.player = next;
  game.log.push(action);
  game.turn++;
  const beaconLit = collect(game, room);
  enemyTurn(game, room, beaconLit);
  if (game.phase === 'play' && same(game.player, room.exit)) {
    if (roomBeaconCount(game) < REQUIRED_BEACONS) game.message = `The flag is closed. Light ${REQUIRED_BEACONS - roomBeaconCount(game)} more beacon${REQUIRED_BEACONS - roomBeaconCount(game) === 1 ? '' : 's'}.`;
    else advance(game, now);
  }
  return true;
}

function applyTool(game, seed) {
  if (game.roomUsed || !game.tool) {
    game.message = game.roomUsed ? "This room's tool use is spent." : 'Choose a tool first.';
    return false;
  }
  const room = roomFor(seed, game.room);
  if (game.tool === 'Hook') {
    const target = room.walls.find(wall => Math.abs(wall.x - game.player.x) + Math.abs(wall.y - game.player.y) === 1 && !game.cleared.includes(pointKey(game.room, wall)));
    if (!target) {
      game.message = 'Stand beside a rock to use the hook.';
      return false;
    }
    game.cleared.push(pointKey(game.room, target));
    game.message = 'The hook clears one rock.';
  } else if (game.tool === 'Dash') {
    const targets = [{ x: game.player.x + 1, y: game.player.y }, { x: game.player.x + 2, y: game.player.y }];
    if (targets.some(target => target.x >= BOARD_WIDTH || room.walls.some(wall => same(wall, target) && !game.cleared.includes(pointKey(game.room, wall))))) {
      game.message = 'The dash route is blocked.';
      return false;
    }
    game.player = targets[1];
    game.turn++;
    const beaconLit = collect(game, room);
    enemyTurn(game, room, beaconLit);
    if (game.phase === 'play' && same(game.player, room.exit)) {
      if (roomBeaconCount(game) < REQUIRED_BEACONS) game.message = `The flag is closed. Light ${REQUIRED_BEACONS - roomBeaconCount(game)} more beacons.`;
      else advance(game, Date.now());
    }
  } else if (game.tool === 'Lantern') {
    game.health = Math.min(MAX_HEALTH, game.health + 2);
    game.message = 'The lantern restores up to two health.';
  } else if (game.tool === 'Decoy') {
    game.enemyDelay += 6;
    game.message = 'The decoy delays the watcher for six turns.';
  } else {
    game.shield++;
    game.message = 'The cloak blocks the next watcher hit.';
  }
  game.roomUsed = true;
  game.log.push('T');
  return true;
}

export function applyAction(game, action, seed = seedForDate(game.date), now = Date.now()) {
  if (game.phase === 'cashout' && action === 'CHASE') {
    game.phase = 'play';
    game.room = 6;
    game.player = { x: 0, y: 3 };
    game.enemy = null;
    game.roomUsed = false;
    game.enemyDelay = 0;
    game.shield = 0;
    game.turn = 0;
    game.log.push('CHASE');
    game.message = 'Final chase: light three beacons while the watcher closes in.';
    return true;
  }
  if (game.phase === 'cashout' && action === 'CASH') {
    game.log.push('CASH');
    finish(game, 'cashed out', now);
    return true;
  }
  if (game.phase !== 'play') return false;
  if (action === 'T') return applyTool(game, seed);
  if (['U', 'D', 'L', 'R'].includes(action)) return applyMove(game, action, seed, now);
  return false;
}

export function replayText(game, seed = seedForDate(game.date)) {
  const duration = game.startedAt && game.finishedAt ? Math.max(0, Math.round((game.finishedAt - game.startedAt) / 1000)) : 0;
  return `Dawn Run v2 | date=${game.date} | seed=${seed} | tool=${game.tool} | result=${game.finished} | score=${scoreGame(game)} | time=${duration}s | replay=${game.log.join('.') || 'none'}`;
}

export function verifyReplay({ date, seed, tool, result, score, actions }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || seed !== seedForDate(date) || !TOOLS.includes(tool) || !Array.isArray(actions) || actions.length < 1 || actions.length > 600) return { valid: false, error: 'Replay fields are invalid.' };
  const game = selectTool(createGame(date), tool, 0);
  for (const action of actions) {
    const before = game.log.length;
    if (typeof action !== 'string' || !applyAction(game, action, seed, 0) || game.log.length !== before + 1) return { valid: false, error: 'Replay contains an invalid move.' };
  }
  const computedScore = scoreGame(game);
  if (game.phase !== 'end' || game.finished !== result || computedScore !== score) return { valid: false, error: 'Replay does not match its result or score.' };
  return { valid: true, game, score: computedScore };
}
