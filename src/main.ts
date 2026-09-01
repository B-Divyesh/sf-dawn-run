import './style.css';

type Tool = 'Hook' | 'Dash' | 'Lantern';
type Phase = 'choose' | 'play' | 'cashout' | 'end' | 'pause';
type Point = { x: number; y: number };
type Room = { walls: Point[]; coins: Point[]; hazard: Point; enemy: Point };
type Game = { phase: Phase; room: number; tool: Tool | null; player: Point; health: number; coins: number; log: string[]; pausedFrom?: Phase; message: string; roomUsed: boolean; finished?: 'escaped' | 'cashed out' | 'caught'; cleared: string[]; collected: string[]; enemy: Point | null };

const app = document.querySelector<HTMLDivElement>('#app')!;
const demo = location.pathname === '/demo' || new URLSearchParams(location.search).get('demo') === '1';
const today = new Date().toISOString().slice(0, 10);
const key = `${demo ? 'demo:' : 'dawn:'}run:${today}`;
const idKey = demo ? 'demo:player' : 'dawn:player';
let playerId = localStorage.getItem(idKey);
if (!playerId) { playerId = Math.random().toString(36).slice(2, 8); localStorage.setItem(idKey, playerId); }

function hash(input: string) { let h = 2166136261; for (const c of input) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }
const seed = hash(today).toString(36).toUpperCase();
const toolSet: Tool[] = ['Hook', 'Dash', 'Lantern'];
const offers = [0, 1, 2].map(i => toolSet[(i + hash(playerId! + today)) % 3]);
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

function newGame(): Game { return { phase: 'choose', room: 1, tool: null, player: { x: 0, y: 2 }, health: 3, coins: 0, log: [], message: 'Pick one tool for all six rooms.', roomUsed: false, cleared: [], collected: [], enemy: null }; }
function load(): Game { try { const saved = localStorage.getItem(key); return saved ? JSON.parse(saved) as Game : newGame(); } catch { return newGame(); } }
let game = load();
function save() { localStorage.setItem(key, JSON.stringify(game)); }

function roomFor(number: number): Room {
  const layouts: Room[] = [
    { walls: [{x:2,y:1}], coins:[{x:1,y:3}], hazard:{x:3,y:2}, enemy:{x:4,y:0} },
    { walls: [{x:2,y:3},{x:3,y:3}], coins:[{x:3,y:1}], hazard:{x:4,y:2}, enemy:{x:3,y:4} },
    { walls: [{x:1,y:1},{x:3,y:2}], coins:[{x:2,y:4}], hazard:{x:4,y:1}, enemy:{x:4,y:4} },
    { walls: [{x:2,y:0},{x:2,y:2}], coins:[{x:3,y:3}], hazard:{x:4,y:3}, enemy:{x:3,y:0} },
    { walls: [{x:1,y:3},{x:3,y:1}], coins:[{x:2,y:1},{x:4,y:4}], hazard:{x:4,y:2}, enemy:{x:3,y:4} },
    { walls: [{x:1,y:1},{x:2,y:3},{x:3,y:1}], coins:[{x:2,y:0},{x:4,y:3}], hazard:{x:4,y:2}, enemy:{x:3,y:4} }
  ];
  return clone(layouts[number - 1]);
}
function same(a: Point, b: Point) { return a.x === b.x && a.y === b.y; }
function pointKey(room: number, p: Point) { return `${room}:${p.x},${p.y}`; }
function inBoard(p: Point) { return p.x >= 0 && p.x < 6 && p.y >= 0 && p.y < 5; }
function score() { return Math.max(0, (game.room - 1) * 100 + game.coins * 25 + game.health * 20); }
function directionLabel(dx: number, dy: number) { return dx === 1 ? 'E' : dx === -1 ? 'W' : dy === 1 ? 'S' : 'N'; }

function choose(tool: Tool) { game = newGame(); game.tool = tool; game.phase = 'play'; game.message = `${tool} packed. Reach the flag in each room.`; save(); render(); }
function move(dx: number, dy: number) {
  if (game.phase !== 'play') return;
  const room = roomFor(game.room); const next = { x: game.player.x + dx, y: game.player.y + dy };
  if (!inBoard(next) || room.walls.some(w => same(w, next) && !game.cleared.includes(pointKey(game.room, w)))) { game.message = 'That route is blocked. Try another tile or use your tool.'; render(); return; }
  game.player = next; game.log.push(`R${game.room}${directionLabel(dx,dy)}`);
  collectAndResolve(room);
  if (game.phase === 'play') enemyTurn(room);
  if (game.phase === 'play' && same(game.player, {x:5,y:2})) advance();
  save(); render();
}
function collectAndResolve(room: Room) {
  const coin = room.coins.find(c => same(c, game.player) && !game.collected.includes(pointKey(game.room,c)));
  if (coin) { game.collected.push(pointKey(game.room,coin)); game.coins++; game.message = 'You found a dawn token.'; }
  if (same(game.player, room.hazard)) { game.health--; game.message = 'The bramble cost one health.'; }
  if (game.health <= 0) end('caught');
}
function enemyTurn(room: Room) {
  if (game.room === 1) return;
  if (!game.enemy) game.enemy = clone(room.enemy);
  const steps = game.room === 6 ? 2 : 1;
  for (let i = 0; i < steps; i++) {
    const enemy: Point = game.enemy!; const dx = Math.sign(game.player.x - enemy.x); const dy = Math.sign(game.player.y - enemy.y);
    const candidate: Point = Math.abs(game.player.x - enemy.x) >= Math.abs(game.player.y - enemy.y) ? {x:enemy.x + dx,y:enemy.y} : {x:enemy.x,y:enemy.y + dy};
    if (inBoard(candidate) && !room.walls.some(w => same(w,candidate) && !game.cleared.includes(pointKey(game.room,w)))) game.enemy = candidate;
    const current: Point = game.enemy!;
    if (same(current, game.player)) { game.health--; game.message = 'The watcher caught up. Move on.'; game.enemy = {x: Math.max(0, current.x - 1), y: current.y}; if (game.health <= 0) { end('caught'); return; } }
  }
}
function useTool() {
  if (game.phase !== 'play' || game.roomUsed || !game.tool) return;
  const room = roomFor(game.room);
  if (game.tool === 'Hook') {
    const target = room.walls.find(w => Math.abs(w.x-game.player.x)+Math.abs(w.y-game.player.y) === 1 && !game.cleared.includes(pointKey(game.room,w)));
    if (!target) { game.message = 'Stand beside a rock to use the hook.'; render(); return; }
    game.cleared.push(pointKey(game.room,target)); game.log.push(`R${game.room}H`); game.roomUsed = true; game.message = 'The hook clears a route.';
  } else if (game.tool === 'Dash') {
    const target = {x: Math.min(5, game.player.x + 2), y: game.player.y};
    if (room.walls.some(w => same(w,target) && !game.cleared.includes(pointKey(game.room,w)))) { game.message='The dash route is blocked.'; render(); return; }
    game.player = target; game.log.push(`R${game.room}D`); game.roomUsed = true; game.message = 'You dash east two tiles.'; collectAndResolve(room); if (game.phase === 'play') enemyTurn(room); if (same(game.player,{x:5,y:2})) advance();
  } else { game.health = Math.min(3, game.health + 1); game.roomUsed = true; game.log.push(`R${game.room}L`); game.message = 'The lantern restores one health.'; }
  save(); render();
}
function advance() {
  if (game.room === 5) { game.phase = 'cashout'; game.message = 'You reached the fifth flag. Take the score or face the final chase.'; return; }
  if (game.room === 6) { end('escaped'); return; }
  game.room++; game.player = {x:0,y:2}; game.enemy = null; game.roomUsed = false; game.message = `Room ${game.room}. The watcher now moves after you.`;
}
function continueFinal() { game.phase='play'; game.room=6; game.player={x:0,y:2}; game.enemy=null; game.roomUsed=false; game.log.push('CHASE'); game.message='Final chase: the watcher moves twice after each step.'; save(); render(); }
function end(result: 'escaped' | 'cashed out' | 'caught') { game.phase='end'; game.finished=result; game.message = result === 'escaped' ? 'You crossed the final flag.' : result === 'cashed out' ? 'You banked a careful score.' : 'The dawn route closed behind you.'; }
function cashOut() { end('cashed out'); save(); render(); }
function restart() { localStorage.removeItem(key); game = newGame(); render(); }
function resetDemo() { localStorage.removeItem(key); localStorage.removeItem(idKey); location.assign('/demo'); }
function goReal() { if (demo) location.assign('/'); }

function cardTool(tool: Tool) { const desc: Record<Tool,string> = { Hook:'Clear one rock beside you.', Dash:'Move east two tiles once per room.', Lantern:'Restore one health once per room.' }; return `<button class="tool" data-tool="${tool}"><span class="tool-name">${tool}</span><span>${desc[tool]}</span></button>`; }
function board() {
  const room = roomFor(game.room); const cells = Array.from({length:30}, (_,i) => { const p={x:i%6,y:Math.floor(i/6)}; let type='ground'; let label='Open route';
    if (same(p,{x:5,y:2})) { type='exit'; label='Exit flag'; }
    if (room.walls.some(w=>same(w,p)) && !game.cleared.includes(pointKey(game.room,p))) { type='wall'; label='Rock'; }
    if (room.coins.some(c=>same(c,p)) && !game.collected.includes(pointKey(game.room,p))) { type='coin'; label='Dawn token'; }
    if (same(room.hazard,p)) { type='hazard'; label='Bramble, costs health'; }
    if (game.room > 1 && same(game.enemy || room.enemy,p)) { type='enemy'; label='Watcher'; }
    if (same(game.player,p)) { type='player'; label='You'; }
    return `<div class="tile ${type}" aria-label="${label}"><span aria-hidden="true">${type==='player'?'●':type==='exit'?'⚑':type==='wall'?'▦':type==='coin'?'✦':type==='hazard'?'✕':type==='enemy'?'◉':''}</span></div>`; }).join('');
  return `<section class="board-wrap" aria-label="Room ${game.room} board"><div class="map-key"><span><i class="dot you"></i>You</span><span><i class="dot flag"></i>Exit</span><span><i class="dot watch"></i>Watcher</span></div><div class="board">${cells}</div></section>`;
}
function gameView() {
  if (game.phase==='choose') return `<section class="game-panel choose"><div class="run-meta"><span>DAILY SEED <b>${seed}</b></span><span>6 ROOMS</span></div><h2>Choose one tool</h2><p>Each tool changes one small decision in every room.</p><div class="tool-grid">${offers.map(cardTool).join('')}</div><p class="small">The route is shared today. Your tool offer is personal.</p></section>`;
  if (game.phase==='cashout') return `<section class="game-panel result"><p class="eyebrow">ROOM FIVE COMPLETE</p><h2>Cash out or take the final chase?</h2><p>Your current score is <strong>${score()}</strong>. The last watcher moves twice per turn.</p><div class="actions"><button class="primary" data-action="final">Run the final chase</button><button class="secondary" data-action="cash">Cash out with ${score()}</button></div></section>`;
  if (game.phase==='end') return `<section class="game-panel result"><p class="eyebrow">DAILY RUN ${game.finished === 'escaped' ? 'COMPLETE' : 'ENDED'}</p><h2>${game.finished === 'escaped' ? 'You escaped the sixth room.' : game.finished === 'cashed out' ? 'You cashed out after five rooms.' : 'The watcher ended this run.'}</h2><dl class="score"><div><dt>Score</dt><dd>${score()}</dd></div><div><dt>Health</dt><dd>${game.health}/3</dd></div><div><dt>Route</dt><dd>${game.log.length} moves</dd></div></dl><p class="replay"><b>Replay data:</b> ${seed}.${game.tool}.${game.log.join('-') || 'none'}</p><button class="primary" data-action="restart">Start a fresh practice run</button><p class="small">Saved only in this browser. Copy the replay data to compare choices.</p></section>`;
  const controls = [['↑',0,-1,'Up'],['←',-1,0,'Left'],['↓',0,1,'Down'],['→',1,0,'Right']];
  return `<section class="game-panel play"><div class="hud"><span>ROOM <b>${game.room}/6</b></span><span>HEALTH <b>${'●'.repeat(game.health)}${'○'.repeat(3-game.health)}</b></span><span>SCORE <b>${score()}</b></span></div>${board()}<p class="status" aria-live="polite">${game.message}</p><div class="actions"><button class="primary" data-action="tool">Use ${game.tool}${game.roomUsed?' (used)':''}</button><button class="secondary" data-action="pause">Pause</button></div><div class="controls" aria-label="Move controls">${controls.map(([a,x,y,name])=>`<button aria-label="Move ${name}" data-move="${x},${y}">${a}</button>`).join('')}</div><p class="small input-note">Arrow keys move. Escape pauses.</p></section>`;
}
function shell(content: string, page: string) { return `<a class="skip" href="#main">Skip to the game</a><header><a class="wordmark" href="/" data-nav>Dawn <i>Run</i></a><nav aria-label="Main navigation"><a href="/demo" data-nav>Demo</a><a href="/#how" data-nav>How it works</a><a href="/privacy" data-nav>Privacy</a></nav></header>${demo?`<aside class="demo-banner" role="status">Demo — sample data, nothing is saved <span><button data-action="reset-demo">Reset demo</button><button data-action="real">Start for real</button></span></aside>`:''}<main id="main" tabindex="-1">${content}</main><footer><span>One shared route for a short daily tactical run.</span><span><a href="/privacy" data-nav>Privacy</a> <a href="/terms" data-nav>Terms</a></span><span>Built by Param Factory · v1.0</span><small>Illustration texture is original generated imagery.</small></footer><div class="route-live" aria-live="polite"></div>`; }
function landing() { return shell(`<section class="hero"><div class="hero-copy"><p class="eyebrow">A DAILY BROWSER GAME</p><h1 tabindex="-1">Play a six-room daily run</h1><p class="lede">For people who want a short tactical game to compare each day.</p><div class="actions"><button class="primary" data-action="sample">Try it with sample data</button><span class="button-note">Loads a sample run. Nothing is saved.</span></div><ul class="facts"><li>Free to play</li><li>One shared daily seed</li><li>Saved in this browser</li></ul></div><div class="hero-art" aria-label="A printed sunrise route map with a six-room game preview">${gameView()}</div></section><section id="how" class="how"><h2>How the daily run works</h2><ol><li><b>Pick a tool.</b> Choose a hook, dash, or lantern.</li><li><b>Route six rooms.</b> Use arrows, taps, or the controls.</li><li><b>Share your result.</b> Copy the seed and replay data after the run.</li></ol></section><section class="plain"><h2>What Dawn Run does not do</h2><p>Scores stay on your device. Replay data is shown after your run.</p></section>`, 'home'); }
function privacy() { return shell(`<article class="legal"><h1 tabindex="-1">Privacy at Dawn Run</h1><p>Dawn Run stores a current run, settings, and a random local player code in your browser.</p><p>The game does not send this data to a server. Clearing site data removes it.</p><p>The demo uses separate browser keys that start with <code>demo:</code>. Reset demo removes those keys.</p><p><a href="/" data-nav>Return to the daily run</a>.</p></article>`, 'privacy'); }
function terms() { return shell(`<article class="legal"><h1 tabindex="-1">Terms for Dawn Run</h1><p>Dawn Run is a free browser game. It is provided as-is for personal play.</p><p>Do not rely on local scores as permanent records. You may share your replay data with other players.</p><p><a href="/" data-nav>Return to the daily run</a>.</p></article>`, 'terms'); }
function render() { const path=location.pathname; document.title = path==='/privacy' ? 'Privacy — Dawn Run' : path==='/terms' ? 'Terms — Dawn Run' : demo ? 'Demo — Dawn Run' : 'Dawn Run — Play a six-room daily run'; app.innerHTML=path==='/privacy'?privacy():path==='/terms'?terms():landing(); requestAnimationFrame(() => document.querySelector<HTMLElement>('h1')?.focus({preventScroll:true})); }

document.addEventListener('click', event => { const target=(event.target as HTMLElement).closest<HTMLElement>('[data-action],[data-tool],[data-move],[data-nav]'); if (!target) return;
  if (target.dataset.nav !== undefined) { event.preventDefault(); history.pushState({},'',(target as HTMLAnchorElement).href); render(); return; }
  const action=target.dataset.action; if (target.dataset.tool) choose(target.dataset.tool as Tool); else if (target.dataset.move) { const [x,y]=target.dataset.move.split(',').map(Number); move(x,y); } else if (action==='tool') useTool(); else if(action==='pause') { game.pausedFrom=game.phase; game.phase='pause'; game.message='Paused. Press Escape to resume.'; render(); } else if(action==='final') continueFinal(); else if(action==='cash') cashOut(); else if(action==='restart') restart(); else if(action==='sample') location.assign('/demo'); else if(action==='reset-demo') resetDemo(); else if(action==='real') goReal(); });
window.addEventListener('popstate', render);
window.addEventListener('keydown', event => { if (event.key==='Escape' && game.phase==='pause') { game.phase=game.pausedFrom||'play'; game.message='Run resumed.'; save(); render(); return; } if (event.key==='Escape' && game.phase==='play') { game.pausedFrom='play'; game.phase='pause'; render(); return; } const keys: Record<string,[number,number]>={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]}; if(keys[event.key]) { event.preventDefault(); move(...keys[event.key]); } });
document.addEventListener('visibilitychange', () => { if (document.hidden && game.phase==='play') { game.pausedFrom='play'; game.phase='pause'; save(); render(); } });
// Fixed 60 Hz heartbeat keeps game timing stable as the board grows.
let last=performance.now(), acc=0; function loop(now:number) { acc+=Math.min(250,now-last); last=now; while(acc>=1000/60){ acc-=1000/60; } requestAnimationFrame(loop); } requestAnimationFrame(loop);
if ('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js'));
render();
