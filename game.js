// ============================================
// MURDER MONOPOLY — GAME.JS (ФИНАЛЬНАЯ ЧИСТАЯ СБОРКА, ЧАСТЬ 1/2)
// ============================================
const U = window.Utils;
let S = null, soundCache = null, imageCache = null;
const PCOLORS = ['#ff5252', '#4fc3f7', '#aed581', '#ffd54f', '#ff8a65', '#b39ddb'];
const TOKEN_URLS = [];
const TIME_ICONS = { morning: '🌅', day: '☀️', evening: '🌆', night: '🌙' };
const TIME_NAMES = { morning: 'Утро', day: 'День', evening: 'Вечер', night: 'Ночь' };
const VOICE_LINES = [
  'Город шепчет... и он знает твоё имя.',
  'Тени сгущаются. Никто не спит в этом районе.',
  'Слышишь шаги за спиной? Это не ветер.',
  'В этом городе у каждого есть секрет. Твой — тоже.',
  'Фонари мигают... кто-то вышел на охоту.',
  'Дождь смывает следы, но не память.',
  'Улицы помнят всё. И они готовы говорить.',
  'Окна смотрят на тебя. Не оборачивайся.'
];
const GENDER_PREF = [];
const TOKEN_CHOICE = [];

class Player {
  constructor(name, role, index, isBot, tokenUrl) {
    this.name = name; this.role = role; this.index = index; this.isBot = isBot;
    this.color = PCOLORS[index]; this.tokenUrl = tokenUrl; this.gender = 'm';
    this.pos = 0; this.coins = GAME_CONFIG.startingCoins; this.tokens = GAME_CONFIG.startingTokens; this.income = 0;
    this.suspect = new U.Stat(GAME_CONFIG.startingSuspect, 0, 15);
    this.fatigue = new U.Stat(0, 0, 5); this.fear = new U.Stat(0, 0, 5);
    this.reputation = new U.Stat(0, -5, 5); this.adrenaline = new U.Stat(0, 0, 3); this.connections = new U.Stat(0, 0, 3);
    this.skins = []; this.sets = []; this.morals = [];
    this.chips = { witness: 1, alibi: 1, ulika: 1, dopros: 1, zasada: 1 };
    this.jail = 0; this.jailStreak = 0; this.stealth = 0; this.powerBonus = 0; this.damage = 0; this.defense = 0;
    this.double = false; this.protect = false; this.usedChip = false; this.morUsed = false;
    this.avoid = false; this.discred = false; this.muted = false; this.blocked = false;
    this.vRoof = false; this.vCrime = false; this.vPol = false; this.vStart = false;
  }
}
function resolveGender(i) {
  const g = GENDER_PREF[i] || 'r';
  return g === 'r' ? (Math.random() < 0.5 ? 'm' : 'f') : g;
}
function assignRoles(count) {
  const roles = [ROLES.SHERIFF, ROLES.MURDERER];
  while (roles.length < count) roles.push(ROLES.CIVILIAN);
  if (count >= 5) roles[roles.length - 1] = ROLES.COP;
  return U.shuffle(roles);
}
function initDecks() {
  return {
    witness: U.shuffle([...WITNESS_DECK, ...WITNESS_DECK]),
    alibi: U.shuffle([...ALIBI_DECK, ...ALIBI_DECK]),
    ulika: U.shuffle([...ULIKA_DECK, ...ULIKA_DECK]),
    dopros: U.shuffle([...DOPROS_DECK, ...DOPROS_DECK]),
    zasada: U.shuffle([...ZASADA_DECK, ...ZASADA_DECK]),
    taj: U.shuffle([...TAJ_DECK]),
    shop: U.shuffle([...SHOP_DECK])
  };
}
function startGame() {
  const count = parseInt(document.getElementById('playerCount').value);
  const roundLimit = parseInt(document.getElementById('roundLimit').value);
  const botsEnabled = document.getElementById('botsEnabled').checked;
  const voiceEnabled = document.getElementById('voiceEnabled').checked;
  const players = [];
  const roles = assignRoles(count);
  for (let i = 0; i < count; i++) {
    const nameInput = document.getElementById('playerName_' + i);
    const name = nameInput ? nameInput.value.trim() : '';
    const isBot = botsEnabled && !name;
    const p = new Player(name || (isBot ? 'Бот ' + (i + 1) : 'Игрок ' + (i + 1)), roles[i], i, isBot, TOKEN_URLS[i] || null);
    p.gender = resolveGender(i);
    players.push(p);
  }
  S = {
    players, cur: 0, round: 1, roundLimit, timeOfDay: TIME_OF_DAY.MORNING,
    voiceEnabled, voiceCounter: 0, isOver: false, isBusy: false,
    lastChip: null, lastZas: null, ownedCells: {}, logs: [], rollMark: '',
    decks: initDecks(), morDeck: U.shuffle([...MORAL_DECK, ...MORAL_DECK]), morDiscard: []
  };
  S.players.forEach(p => { if (S.morDeck.length) p.morals.push(S.morDeck.pop()); }); // по 1 карте морали
  enterGameScreen();
  log('🌆 Игра началась! Тени сгущаются...');
}
function enterGameScreen() {
  buildBoard();
  document.getElementById('setupScreen').style.display = 'none';
  document.getElementById('gameScreen').style.display = 'flex';
  updateUI();
  if (S.players[S.cur].isBot && !S.isOver) setTimeout(botTurn, 1000);
}

// === ПОЛЕ ===
function perimeterGridPos(idx) {
  if (idx <= 8) return { r: '1', c: String(idx + 1) };
  if (idx <= 15) return { r: String(idx - 7), c: '9' };
  if (idx <= 24) return { r: '9', c: String(25 - idx) };
  return { r: String(33 - idx), c: '1' };
}
function getCellData(idx) {
  const M = [
    { type: 'start', name: 'СТАРТ', color: '#2e7d32', img: ASSETS.images.cells.start },
    { type: 'skin', name: 'Wooden Knife', color: '#b0b7c3', price: 40, skinId: 'wooden_knife' },
    { type: 'skin', name: 'Stone Dagger', color: '#b0b7c3', price: 50, skinId: 'stone_dagger' },
    { type: 'skin', name: 'Iron Blade', color: '#b0b7c3', price: 60, skinId: 'iron_blade' },
    { type: 'coin', name: 'МОНЕТА', color: '#fafafa', img: ASSETS.images.cells.coin },
    { type: 'skin', name: 'Blue Claw', color: '#42a5f5', price: 80, skinId: 'blue_claw' },
    { type: 'skin', name: 'Steel Fang', color: '#42a5f5', price: 90, skinId: 'steel_fang' },
    { type: 'skin', name: 'Crystal Shard', color: '#42a5f5', price: 100, skinId: 'crystal_shard' },
    { type: 'roof', name: 'НЕБОСКРЁБ', color: '#8e1414', img: ASSETS.images.cells.roof },
    { type: 'skin', name: 'Viper Fang', color: '#66bb6a', price: 120, skinId: 'viper_fang' },
    { type: 'tunnel', name: 'ТОННЕЛЬ', color: '#546e7a', img: ASSETS.images.cells.tunnel },
    { type: 'skin', name: 'Shadow Cloak', color: '#66bb6a', price: 140, skinId: 'shadow_cloak' },
    { type: 'skin', name: 'Phantom Blade', color: '#66bb6a', price: 160, skinId: 'phantom_blade' },
    { type: 'skin', name: 'Blaze Knife', color: '#ef5350', price: 180, skinId: 'blaze_knife' },
    { type: 'hospital', name: 'БОЛЬНИЦА', color: '#00838f', img: ASSETS.images.cells.hospital },
    { type: 'skin', name: 'Blaze Gun', color: '#ef5350', price: 200, skinId: 'blaze_gun' },
    { type: 'crime', name: 'ПРЕСТУПЛЕНИЕ', color: '#8e1414', img: ASSETS.images.cells.crime },
    { type: 'skin', name: 'Fire Wing', color: '#f06292', price: 250, skinId: 'fire_wing' },
    { type: 'skin', name: 'Elderwood Scythe', color: '#ffa726', price: 350, skinId: 'elderwood_scythe' },
    { type: 'skin', name: "Nik's Scythe", color: '#ffa726', price: 400, skinId: 'niks_scythe' },
    { type: 'stash', name: 'ТАЙНИК', color: '#6a1b9a', img: ASSETS.images.cells.stash },
    { type: 'skin', name: 'Eternal Flame', color: '#ffd700', price: 500, skinId: 'eternal_flame' },
    { type: 'skin', name: 'Void Blade', color: '#ffd700', price: 700, skinId: 'void_blade' },
    { type: 'skin', name: 'Chroma Light', color: '#ffd700', price: 600, skinId: 'chroma_light' },
    { type: 'police', name: 'ПОЛИЦИЯ', color: '#1a3f8f', img: ASSETS.images.cells.police },
    { type: 'skin', name: 'Gold Wing', color: '#f06292', price: 300, skinId: 'gold_wing' },
    { type: 'psychologist', name: 'ПСИХОЛОГ', color: '#6a1b9a', img: ASSETS.images.cells.psychologist },
    { type: 'skin', name: 'Ice Wing', color: '#f06292', price: 200, skinId: 'ice_wing' },
    { type: 'skin', name: 'Corrupt', color: '#ffa726', price: 450, skinId: 'corrupt' },
    { type: 'skin', name: 'Blaze Shield', color: '#ef5350', price: 220, skinId: 'blaze_shield' },
    { type: 'shop', name: 'МАГАЗИН СКИНОВ', color: '#e65100', img: ASSETS.images.cells.shop },
    { type: 'skin', name: 'Коронка', color: '#b0b7c3', price: 80, skinId: 'crown' }
  ];
  return M[idx % M.length];
}
function buildBoard() {
  const board = document.getElementById('board');
  board.innerHTML = '';
  const center = document.createElement('div');
  center.className = 'cell center-area';
  center.style.gridArea = '2 / 2 / 9 / 9';
  center.innerHTML = '<div class="center-bg" id="centerBg"></div><div class="center-logo">MM</div>' +
    '<div class="stacks">' +
    '<div class="stack" onclick="useChip(\'witness\')"><span>👁</span><span>Свидетель</span></div>' +
    '<div class="stack" onclick="useChip(\'alibi\')"><span>⏳</span><span>Алиби</span></div>' +
    '<div class="stack" onclick="useChip(\'ulika\')"><span>🔍</span><span>Улика</span></div>' +
    '<div class="stack" onclick="useChip(\'dopros\')"><span>🎤</span><span>Допрос</span></div>' +
    '<div class="stack" onclick="useChip(\'zasada\')"><span>💣</span><span>Засада</span></div>' +
    '</div><div class="hint">← Наведи на стак — подсказка. Нажми — карта →</div>';
  board.appendChild(center);
  for (let idx = 0; idx < 32; idx++) {
    const d = getCellData(idx);
    const cell = document.createElement('div');
    cell.className = 'cell'; cell.id = 'cell_' + idx; cell.dataset.idx = idx;
    cell.style.background = d.color;
    const pos = perimeterGridPos(idx);
    cell.style.gridRow = pos.r; cell.style.gridColumn = pos.c;
    let content = '<span class="cell-label">' + d.name + '</span>';
    if (d.price) content += '<span class="cell-price">' + d.price + '</span>';
    content += '<span class="tokens"></span>';
    cell.innerHTML = content;
    if (d.img) imageCache.get(d.img).then(img => { if (img) { const bg = document.createElement('img'); bg.className = 'cell-img'; bg.src = img.src; cell.prepend(bg); } });
    cell.onclick = () => handleCellClick(idx);
    board.appendChild(cell);
  }
  addSkyline();
  decorateStacks();
  applyStackIcons();
  renderTokens();
}
function renderTokens() {
  document.querySelectorAll('.tokens').forEach(t => t.innerHTML = '');
  if (!S) return;
  S.players.forEach(p => {
    const cell = document.getElementById('cell_' + p.pos);
    if (cell) {
      const tc = cell.querySelector('.tokens');
      if (tc) {
        const t = document.createElement('div');
        if (p.tokenUrl) { t.className = 'cell-token-img'; t.innerHTML = '<img src="' + p.tokenUrl + '" style="border-color:' + p.color + '">'; }
        else { t.className = 'cell-token'; t.style.background = p.color; }
        tc.appendChild(t);
      }
    }
  });
}
function handleCellClick(idx) { const d = getCellData(idx); showPreview({ type: d.type, name: d.name, price: d.price }); }

// === ИНТЕРФЕЙС ===
function statColor(ratio) {
  const r = Math.max(0, Math.min(1, ratio));
  return 'hsl(' + (120 * (1 - r)) + ', 85%, 55%)';
}
function portraitLevel(s) { return s >= 15 ? 15 : s >= 13 ? 13 : s >= 10 ? 10 : s >= 6 ? 6 : s >= 3 ? 3 : 0; }
const portraitProbe = {};
function probePath(path, isVideo) {
  if (portraitProbe[path] !== undefined) return Promise.resolve(portraitProbe[path]);
  return new Promise(res => {
    const el = isVideo ? document.createElement('video') : new Image();
    const ok = () => { portraitProbe[path] = path; res(path); };
    const no = () => { portraitProbe[path] = null; res(null); };
    if (isVideo) { el.onloadeddata = ok; el.onerror = no; el.src = path; el.load(); }
    else { el.onload = ok; el.onerror = no; el.src = path; }
  });
}
async function findPortrait(p, lvl) {
  const g = p.gender || 'm';
  const cands = [
    ['img/portraits/' + g + '_' + lvl + '.mp4', true],
    ['img/portraits/suspect_' + lvl + '.mp4', true],
    ['img/portraits/' + g + '_' + lvl + '.png', false],
    ['img/portraits/suspect_' + lvl + '.png', false]
  ];
  for (const c of cands) { const f = await probePath(c[0], c[1]); if (f) return { path: f, isVid: c[1] }; }
  return null;
}
function updateUI() {
  if (!S) return;
  const p = S.players[S.cur];
  document.getElementById('roundDisplay').textContent = 'Раунд ' + S.round + '/' + (S.roundLimit || '∞');
  document.getElementById('currentPlayerName').textContent = p.name;
  const ti = document.getElementById('timeIcon');
  const tl = document.getElementById('timeLabel');
  if (ti) ti.textContent = TIME_ICONS[S.timeOfDay] || '☀️';
  if (tl) tl.textContent = TIME_NAMES[S.timeOfDay] || 'День';
  document.body.dataset.time = S.timeOfDay;
  updatePortrait(p); updatePlayerStats(p); updateSuspectsList();
  document.getElementById('rollBtn').disabled = S.isBusy || p.jail > 0 || S.rollMark === S.round + '-' + S.cur;
  document.getElementById('endBtn').disabled = S.isBusy;
  document.getElementById('accuseBtn').disabled = S.isBusy || (p.suspect.get() < 10 && p.role !== ROLES.SHERIFF);
  const mb = document.getElementById('morBtn');
  if (mb) mb.disabled = S.isBusy || p.morals.length === 0 || p.morUsed;
  renderTokens();
  renderMiniMap(); renderMorHand(); renderCardCounts();
}
function updatePortrait(p) {
  const img = document.getElementById('portraitImg');
  const vid = document.getElementById('portraitVideo');
  const emo = document.getElementById('portraitEmoji');
  const name = document.getElementById('portraitName');
  const sus = document.getElementById('portraitSus');
  const s = p.suspect.get();
  const lvl = portraitLevel(s);
  if (name) name.textContent = p.name;
  if (sus) { sus.textContent = s + '/15'; sus.classList.toggle('critical', s >= 15); }
  if (emo) emo.textContent = s >= 15 ? '🤬' : s >= 13 ? '👿' : s >= 10 ? '😡' : s >= 6 ? '😠' : s >= 3 ? '😐' : '😊';
  findPortrait(p, lvl).then(found => {
    if (!found) return;
    if (found.isVid) {
      if (vid) { vid.src = found.path; vid.style.display = 'block'; vid.play().catch(() => {}); }
      if (img) img.style.display = 'none';
      if (emo) emo.style.display = 'none';
    } else {
      if (img) { img.src = found.path; img.style.display = 'block'; }
      if (vid) vid.style.display = 'none';
      if (emo) emo.style.display = 'none';
    }
  });
}
function updatePlayerStats(p) {
  const c = document.getElementById('playerStats');
  if (!c) return;
  const power = calculatePower(p);
  const items = [
    ['💰', 'Монеты', p.coins, Math.min(1, p.coins / 1000)],
    ['🚨', 'Подозрения', p.suspect.get() + '/15', p.suspect.get() / 15],
    ['🎟', 'Жетоны', p.tokens, Math.min(1, p.tokens / 3)],
    ['😫', 'Усталость', p.fatigue.get() + '/5', p.fatigue.get() / 5],
    ['😨', 'Страх', p.fear.get() + '/5', p.fear.get() / 5],
    ['⭐', 'Репутация', p.reputation.get(), (p.reputation.get() + 5) / 10],
    ['⚡', 'Адреналин', p.adrenaline.get() + '/3', p.adrenaline.get() / 3],
    ['🤝', 'Связи', p.connections.get() + '/3', p.connections.get() / 3],
    ['🗡', 'Сила', power, Math.min(1, power / 30)]
  ];
  c.innerHTML = items.map(it =>
    '<div class="stat-item"><span>' + it[0] + ' ' + it[1] + '</span><span class="stat-val" style="color:' + statColor(it[3]) + '">' + it[2] + '</span></div>'
  ).join('');
}
function updateSuspectsList() {
  const c = document.getElementById('suspectsTop');
  if (!c) return;
  c.innerHTML = [...S.players].sort((a, b) => b.suspect.get() - a.suspect.get()).map(p =>
    '<div class="suspect-item"><span style="color:' + p.color + '">' + p.name + '</span>' +
    '<div class="bar"><span style="width:' + (p.suspect.get() / 15) * 100 + '%;background:' + (p.suspect.get() >= 10 ? '#ff1744' : '#ff5252') + '"></span></div>' +
    '<span>' + p.suspect.get() + '</span></div>'
  ).join('');
}
// --- Свободный блок: мини-схема + мораль + счётчик карт ---
function ensureFreePanel() {
  let box = document.getElementById('freePanel');
  if (box) return box;
  const side = document.querySelector('.side-panel');
  if (!side) return null;
  const panels = side.querySelectorAll('.panel');
  let target = panels[panels.length - 1];
  if (!target || target.querySelector('#log')) { target = document.createElement('div'); target.className = 'panel'; side.appendChild(target); }
  target.id = 'freePanel';
  target.innerHTML = '<h3>🗺 Кто где стоит</h3><div class="mini-map" id="miniMap"></div>' +
    '<h3 style="margin-top:10px">Мораль: <span id="handName"></span></h3><div class="mor-hand" id="morHand"></div>';
  return box || target;
}
function renderMiniMap() {
  const box = ensureFreePanel(); if (!box) return;
  const mm = document.getElementById('miniMap'); if (!mm) return;
  if (!mm.dataset.built) {
    let html = '';
    for (let idx = 0; idx < 32; idx++) {
      const pos = perimeterGridPos(idx);
      const d = getCellData(idx);
      html += '<div class="mm-cell" data-idx="' + idx + '" style="grid-row:' + pos.r + ';grid-column:' + pos.c + ';background:' + d.color + '"></div>';
    }
    mm.innerHTML = html;
    mm.dataset.built = '1';
  }
  mm.querySelectorAll('.mm-tok').forEach(t => t.remove());
  if (!S) return;
  S.players.forEach(p => {
    const cell = mm.querySelector('.mm-cell[data-idx="' + p.pos + '"]');
    if (cell) { const t = document.createElement('span'); t.className = 'mm-tok' + (p.index === S.cur ? ' cur' : ''); t.style.background = p.color; cell.appendChild(t); }
  });
}
function renderCardCounts() {
  if (!S) return;
  const anchor = document.querySelector('.action-buttons');
  if (!anchor) return;
  let el = document.getElementById('cardCounts');
  if (el && el.nextElementSibling !== anchor) { el.remove(); el = null; }
  if (!el) { el = document.createElement('div'); el.id = 'cardCounts'; el.style.cssText = 'margin:0 0 10px'; anchor.parentNode.insertBefore(el, anchor); }
  el.innerHTML = '<div style="color:#d4af37;font-weight:800;font-size:12px;margin-bottom:4px">🎴 Карты игроков</div>' +
    S.players.map(p =>
      '<div style="display:flex;justify-content:space-between;gap:6px;font-size:10px;padding:3px 4px;border-bottom:1px dashed rgba(212,175,55,.2)">' +
      '<span style="color:' + p.color + ';font-weight:700;white-space:nowrap">' + p.name + '</span>' +
      '<span style="white-space:nowrap">👁' + p.chips.witness + ' ⏳' + p.chips.alibi + ' 🔍' + p.chips.ulika + ' 🎤' + p.chips.dopros + ' 💣' + p.chips.zasada + ' 🎭' + p.morals.length + '</span></div>'
    ).join('');
}
// --- Рука морали: веер + 3D-переворот + свои фото ---
function renderMorHand() {
  const box = ensureFreePanel(); if (!box) return;
  const hand = document.getElementById('morHand');
  const hn = document.getElementById('handName');
  if (!hand || !S) return;
  const p = S.players[S.cur];
  if (hn) hn.textContent = p.name;
  if (p.isBot) { hand.innerHTML = '<div style="font-size:11px;opacity:.6;padding:6px">🤖 У бота ' + p.morals.length + ' карт(и) морали</div>'; return; }
  if (!p.morals.length) { hand.innerHTML = '<div style="font-size:11px;opacity:.6;padding:6px">Нет карт морали — новую получишь на Старте (выбор из трёх)</div>'; return; }
  const n = p.morals.length;
  const mid = (n - 1) / 2;
  hand.innerHTML = p.morals.map((c, i) => {
    const rot = (i - mid) * 9;
    const ty = Math.abs(i - mid) * 7;
    return '<button class="mor-card" data-mi="' + i + '" style="--rot:' + rot + 'deg;--ty:' + ty + 'px" ' + (p.morUsed ? 'disabled' : 'onclick="playMorCard(' + i + ')"') + '>' +
      '<div class="mor-inner" style="position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform .7s cubic-bezier(.3,.9,.4,1)">' +
      '<div style="position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;background:#0d1226 url(\'img/ui/moral-frame.png\') center/100% 100% no-repeat;border-radius:10px"></div>' +
      '<div style="position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;transform:rotateY(180deg);border-radius:10px;border:2px solid #d4af37;background:linear-gradient(180deg,#1a2340,#0d1226);display:flex;flex-direction:column;overflow:hidden">' +
      '<img class="mor-front-img" alt="" style="display:none;width:100%;height:52%;object-fit:cover;border-bottom:2px solid #d4af37">' +
      '<div class="mor-front-ph" style="height:52%;display:flex;align-items:center;justify-content:center;font-size:40px">' + c.icon + '</div>' +
      '<div style="flex:1;overflow-y:auto;padding:6px 7px;font-size:9px;line-height:1.45;color:#eee;text-align:left"><b style="color:#d4af37">' + c.name + '</b><br>⚙️ ' + c.effect + '<br>' + c.desc + '</div>' +
      '</div></div></button>';
  }).join('');
  hand.querySelectorAll('.mor-card').forEach((el, i) => {
    const c = p.morals[i];
    if (!c) return;
    const path = 'img/morals/' + c.id + '.png';
    imageCache.get(path).then(im => {
      if (im) {
        const ph = el.querySelector('.mor-front-img'); if (ph) { ph.src = path; ph.style.display = 'block'; }
        const pl = el.querySelector('.mor-front-ph'); if (pl) pl.style.display = 'none';
      }
    });
  });
}
function playMoralSound(c) {
  const path = 'snd/morals/' + c.id + '.mp3';
  soundCache.load(path).then(a => {
    if (a) { a.volume = 1; a.currentTime = 0; a.play().catch(() => {}); }
    else tts(c.name + '. ' + c.effect);
  });
}
function playMorCard(i) {
  if (!S || S.isBusy || S.isOver) return;
  const p = S.players[S.cur];
  if (p.isBot || p.morUsed || !p.morals[i]) return;
  const card = p.morals.splice(i, 1)[0];
  S.morDiscard.push(card); p.morUsed = true;
  playMoralSound(card);
  applyMoral(p, card).then(() => { log('🎭 ' + p.name + ' сыграл «' + card.name + '»'); updateUI(); });
}

// === ХОД ===
function stepSleep(ms) { return U.sleep(MMSET.fastbots && S && S.players[S.cur].isBot ? Math.max(30, ms / 3) : ms); }
const FACE_ROT = { 1: [0, 0], 2: [0, 180], 3: [0, -90], 4: [0, 90], 5: [-90, 0], 6: [90, 0] };
let diceRX = 0, diceRY = 0;
function setDiceFace(n, animate) {
  const cube = document.getElementById('diceCube');
  if (!cube) return;
  const t = FACE_ROT[n] || [0, 0];
  if (!animate) {
    cube.style.transition = 'none';
    diceRX = t[0]; diceRY = t[1];
    cube.style.transform = 'rotateX(' + diceRX + 'deg) rotateY(' + diceRY + 'deg)';
    return;
  }
  const ex = ((diceRX % 360) + 360) % 360;
  const ey = ((diceRY % 360) + 360) % 360;
  const dx = (((t[0] - ex) % 360) + 360) % 360;
  const dy = (((t[1] - ey) % 360) + 360) % 360;
  diceRX += dx + 360; diceRY += dy + 360;
  cube.style.transition = 'transform .8s cubic-bezier(.2,.8,.3,1)';
  cube.style.transform = 'rotateX(' + diceRX + 'deg) rotateY(' + diceRY + 'deg)';
}
async function rollDice() {
  if (!S || S.isBusy || S.isOver) return;
  S.isBusy = true;
  S.rollMark = S.round + '-' + S.cur; // один бросок за ход
  const p = S.players[S.cur];
  document.getElementById('rollBtn').disabled = true;
  playSound('effects', 'dice');
  for (let i = 0; i < 10; i++) { setDiceFace(U.random(1, 6), false); await stepSleep(70); }
  let steps = U.random(1, 6);
  if (p.fatigue.isMax()) steps = Math.max(1, steps - 2);
  steps += p.adrenaline.get();
  if (p.double) { steps = Math.min(12, steps * 2); p.double = false; }
  setDiceFace(Math.min(steps, 6), true);
  log('🎲 ' + p.name + ' бросил ' + steps);
  let passedStart = false;
  for (let i = 0; i < steps; i++) {
    p.pos = (p.pos + 1) % GAME_CONFIG.boardSize;
    if (p.pos === 0) { passedStart = true; p.coins += 200 + p.income; p.suspect.add(-1); p.connections.add(1); p.reputation.add(1); p.fatigue.add(-1); log('🟢 ' + p.name + ' на Старте (+' + (200 + p.income) + ' монет)'); }
    renderTokens(); await stepSleep(150);
  }
  if (passedStart && p.pos === 0) await morOffer(p);
  const meet = S.players.find(pl => pl !== p && pl.pos === p.pos);
  if (meet) { log('👥 ' + p.name + ' встретил ' + meet.name); playSound('effects', 'meet'); p.fear.add(1); p.adrenaline.add(1); if (!p.isBot) await showModal('<h2>👥 Встреча!</h2><p>' + p.name + ' и ' + meet.name + ' на одной клетке!</p><button data-v="ok">OK</button>'); }
  await land(p);
  S.isBusy = false;
  document.getElementById('endBtn').disabled = false;
  updateUI();
}
async function land(p) {
  const cell = getCellData(p.pos);
  playSound('cells', cell.type);
  switch (cell.type) {
    case 'skin': await handleSkinCell(p, cell); break;
    case 'coin': { const c = U.random(50, 100); p.coins += c; log('🪙 ' + p.name + ' +' + c + ' монет'); } break;
    case 'stash': await handleStash(p); break;
    case 'shop': if (!p.isBot) await openShop(p); break;
    case 'tunnel': if (p.fear.get() < 5) { p.pos = 0; p.coins += 200; log('🚇 ' + p.name + ' ушёл на Старт'); } else { p.pos = 24; p.suspect.set(0); p.jail++; log('🚇 ' + p.name + ' → Полиция'); } break;
    case 'police': p.suspect.set(0); p.jail++; p.fatigue.add(1); log('🚔 ' + p.name + ' в Полиции'); break;
    case 'roof': p.vRoof = true; log('🏙 ' + p.name + ' на Небоскрёбе'); break;
    case 'crime': { p.vCrime = true; p.fear.add(1); p.adrenaline.add(1); const t = U.randomChoice(S.players.filter(pl => pl !== p)); if (t) { t.suspect.add(1); log('👣 ' + p.name + ' → +1 подозрение ' + t.name); } } break;
    case 'hospital': if (p.coins >= 50) { p.coins -= 50; p.fatigue.add(-2); p.fear.add(-2); log('🏥 ' + p.name + ' в Больнице'); } break;
    case 'psychologist': if (p.coins >= 30) { p.coins -= 30; p.fear.add(-1); p.reputation.add(1); log('🧠 ' + p.name + ' у Психолога'); } break;
    case 'gym': if (p.coins >= 40) { p.coins -= 40; p.fatigue.add(-1); p.adrenaline.add(1); log('💪 ' + p.name + ' в Спортзале'); } break;
  }
  if (p.suspect.get() >= 10 && p.pos !== 24 && !p.avoid) {
    if (!p.isBot) {
      const ch = await showModal('<h2>🚨 ' + p.suspect.get() + '+ подозрений!</h2><p>Заплатить 500 монет?</p><button data-v="pay">💰 Да</button><button data-v="go">🚔 В полицию</button>');
      if (ch === 'pay') { p.coins -= 500; p.avoid = true; } else { p.pos = 24; p.jail++; }
    } else { if (p.coins >= 500) { p.coins -= 500; p.avoid = true; } else { p.pos = 24; p.jail++; } }
  }
  if (p.suspect.isMax()) await finalDuel();
  updateUI();
}
async function handleSkinCell(p, cell) {
  const ownerIdx = S.players.findIndex(pl => pl.skins.includes(cell.skinId));
  if (ownerIdx === -1) {
    if (p.coins >= cell.price) {
      if (p.isBot) buySkin(p, cell);
      else { const ch = await showModal('<h2>🗡 ' + cell.name + '</h2><p>Цена: ' + cell.price + '</p><button data-v="buy">Купить</button><button data-v="no">Нет</button>'); if (ch === 'buy') buySkin(p, cell); }
    }
  } else if (ownerIdx !== p.index) {
    const fee = 30; p.coins = Math.max(0, p.coins - fee); S.players[ownerIdx].coins += fee;
    log('💸 ' + p.name + ' платит ' + fee + ' → ' + S.players[ownerIdx].name);
  }
}
function buySkin(p, cell) {
  p.coins -= cell.price; p.skins.push(cell.skinId); S.ownedCells[p.pos] = p.index;
  p.reputation.add(1); p.connections.add(1); playSound('effects', 'buy');
  log('🛒 ' + p.name + ' купил ' + cell.name);
  const skin = SKINS[cell.skinId];
  if (skin) {
    if (skin.damage) p.damage += skin.damage;
    if (skin.defense) p.defense += skin.defense;
    if (skin.effects) { if (skin.effects.reputation) p.reputation.add(skin.effects.reputation); if (skin.effects.fear) p.fear.add(skin.effects.fear); }
  }
  checkSet(p);
}
function checkSet(p) {
  for (const set of Object.values(SETS)) {
    if (p.sets.includes(set.id)) continue;
    const r = set.requirements;
    const w = p.skins.filter(id => SKINS[id] && SKINS[id].category === 'weapon').length;
    const a = p.skins.filter(id => SKINS[id] && SKINS[id].category === 'armor').length;
    const ac = p.skins.filter(id => SKINS[id] && SKINS[id].category === 'accessory').length;
    let ok = true;
    if (r.weapons && w < r.weapons) ok = false;
    if (r.armor && a < r.armor) ok = false;
    if (r.accessories && ac < r.accessories) ok = false;
    if (ok) { p.sets.push(set.id); if (set.bonus.damage) p.damage += set.bonus.damage; if (set.bonus.defense) p.defense += set.bonus.defense; if (set.bonus.reputation) p.reputation.add(set.bonus.reputation); log('🧩 ' + p.name + ' собрал сет: ' + set.name + '!'); }
  }
}
async function handleStash(p) {
  const card = S.decks.taj.shift(); S.decks.taj.push(card);
  const text = card[0], effects = card[1];
  playSound('cards', 'taj');
  tts(text);
  if (!p.isBot) await showModal('<h2>🟣 ТАЙНИК</h2><p>«' + text + '»</p><button data-v="ok">OK</button>');
  applyEffects(p, effects);
  log('🟣 ' + p.name + ': ' + text);
}
async function openShop(p) {
  const items = S.decks.shop.slice(0, 6);
  let html = '<h2>🛒 МАГАЗИН</h2><p>Монеты: ' + p.coins + '</p><div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center">';
  items.forEach((it, i) => { html += '<button data-v="' + i + '" style="padding:8px;background:#222;border:1px solid #d4af37;color:#fff;border-radius:4px">' + it[0] + '<br>' + it[1] + '💰</button>'; });
  html += '</div><button data-v="close">Выйти</button>';
  const ch = await showModal(html);
  if (ch !== 'close' && items[ch]) {
    const it = items[ch];
    if (p.coins >= it[1]) {
      p.coins -= it[1];
      if (it[2].chips) it[2].chips.forEach(c => p.chips[c] = (p.chips[c] || 0) + 1);
      if (it[2].suspect) p.suspect.add(it[2].suspect);
      if (it[2].protect) p.protect = true;
      log('🛒 ' + p.name + ' купил ' + it[0]);
    }
  }
}

// === КАРТЫ ДЕЙСТВИЙ ===
async function useChip(type) {
  if (!S || S.isBusy || S.isOver) return;
  const p = S.players[S.cur];
  if (p.chips[type] <= 0 || p.usedChip) return;
  S.isBusy = true; p.chips[type]--; p.usedChip = true; S.lastChip = p;
  const deck = S.decks[type]; const card = deck.shift(); deck.push(card);
  playSound('cards', type);
  let text = '', effect = '', target = null;
  const cardText = card[0], targetCode = card[1], val1 = card[2], val2 = card[3];
  if (type === 'witness') { target = pickTarget(p, targetCode); target.suspect.add(1); p.coins += val1; text = cardText; effect = '+1 подозрение ' + target.name + ', +' + val1 + ' монет'; }
  else if (type === 'alibi') { p.suspect.add(-1); p.coins += 400; p.pos = 0; text = cardText; effect = '−1 подозрение, +400 монет, на Старт'; }
  else if (type === 'ulika' || type === 'dopros') { target = pickTarget(p, targetCode); target.suspect.add(val1); p.coins = Math.max(0, p.coins - val2); text = cardText; effect = '+' + val1 + ' ' + target.name + ', −' + val2 + ' монет'; }
  else if (type === 'zasada') { target = pickTarget(p, targetCode); target.suspect.add(val1); target.fear.add(1); p.coins = Math.max(0, p.coins - val2); S.lastZas = { source: p, target: target }; text = cardText; effect = '+' + val1 + ' ' + target.name + ', −' + val2 + ' монет'; }
  tts(text);
  if (!p.isBot) await showModal('<h2>' + type.toUpperCase() + '</h2><p>«' + text + '»</p><p style="color:#d4af37">' + effect + '</p><button data-v="ok">OK</button>');
  log('🃏 ' + p.name + ': ' + text);
  S.isBusy = false;
  updateUI();
}
function pickTarget(p, code) {
  const others = S.players.filter(pl => pl !== p);
  switch (code) {
    case 'L': return S.players[(p.index + 1) % S.players.length];
    case 'R': return S.players[(p.index - 1 + S.players.length) % S.players.length];
    case 'MINC': return [...S.players].sort((a, b) => a.coins - b.coins)[0];
    case 'MAXC': return [...S.players].sort((a, b) => b.coins - a.coins)[0];
    case 'MAXS': return [...S.players].sort((a, b) => b.skins.length - a.skins.length)[0];
    case 'MINS': return [...S.players].sort((a, b) => a.skins.length - b.skins.length)[0];
    default: return U.randomChoice(others);
  }
}

// === МОРАЛЬ ===
async function morOffer(p) {
  if (S.morDeck.length < 3) { S.morDeck = U.shuffle([...S.morDeck, ...S.morDiscard]); S.morDiscard = []; }
  const opts = S.morDeck.splice(0, 3);
  if (!opts.length) return;
  if (p.isBot) { const c = U.randomChoice(opts); p.morals.push(c); S.morDeck.push(...opts.filter(x => x !== c)); log('🎭 ' + p.name + ' взял «' + c.name + '»'); return; }
  let html = '<h2>🎭 Карты Морали</h2><p>Выбери одну:</p><div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">';
  opts.forEach((c, i) => { html += '<button data-v="' + i + '" style="padding:10px;background:#222;border:1px solid #d4af37;color:#fff;border-radius:4px;min-width:100px"><div style="font-size:24px">' + c.icon + '</div><div>' + c.name + '</div><div style="font-size:10px;opacity:.7">' + c.effect + '</div></button>'; });
  html += '</div><button data-v="skip">Пропустить</button>';
  const ch = await showModal(html);
  if (ch !== 'skip' && opts[ch]) { const card = opts[ch]; p.morals.push(card); S.morDeck.push(...opts.filter((_, i) => i !== parseInt(ch))); log('🎭 ' + p.name + ' взял «' + card.name + '»'); }
  else S.morDeck.push(...opts);
}
async function morOpen() {
  if (!S || S.isBusy || S.isOver) return;
  const p = S.players[S.cur];
  if (!p.morals.length || p.morUsed) return;
  let html = '<h2>🎭 Мораль (' + p.morals.length + ')</h2><div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">';
  p.morals.forEach((c, i) => { html += '<button data-v="' + i + '" style="padding:10px;background:#222;border:1px solid #d4af37;color:#fff;border-radius:4px"><div style="font-size:24px">' + c.icon + '</div><div>' + c.name + '</div></button>'; });
  html += '</div><button data-v="close">Закрыть</button>';
  const ch = await showModal(html);
  if (ch !== 'close') {
    const card = p.morals.splice(parseInt(ch), 1)[0];
    S.morDiscard.push(card); p.morUsed = true;
    playMoralSound(card);
    await applyMoral(p, card);
    log('🎭 ' + p.name + ' сыграл «' + card.name + '»');
  }
  updateUI();
}
async function applyMoral(p, card) {
  switch (card.fx) {
    case 'conscience': if (p.role === ROLES.MURDERER) p.suspect.add(2); else p.suspect.add(-2); break;
    case 'redeem': if (p.role === ROLES.MURDERER) { p.role = ROLES.CIVILIAN; p.jail = 3; p.jailStreak = 0; log('🕊 ' + p.name + ' сдался'); } break;
    case 'power': if (p.role === ROLES.CIVILIAN && p.suspect.get() >= 10) { const m = S.players.find(pl => pl.role === ROLES.MURDERER); if (m) m.role = ROLES.CIVILIAN; p.role = ROLES.MURDERER; log('🔪 ' + p.name + ' стал Убийцей!'); } break;
    case 'truth': if (p.role === ROLES.CIVILIAN && p.suspect.get() >= 5) { const s = S.players.find(pl => pl.role === ROLES.SHERIFF); if (s) s.role = ROLES.CIVILIAN; p.role = ROLES.SHERIFF; p.powerBonus += 2; p.suspect.set(0); log('🚔 ' + p.name + ' стал Шерифом!'); } break;
    case 'corrupt': if (p.role === ROLES.SHERIFF && p.suspect.get() >= 7) { p.role = ROLES.COP; log('🦹 ' + p.name + ' стал Продажным копом'); } break;
    case 'fatigue': if (p.role === ROLES.SHERIFF) { p.role = ROLES.CIVILIAN; p.coins = 0; log('🕊 ' + p.name + ' ушёл в отставку'); } break;
    case 'doubt': if (p.role !== ROLES.CIVILIAN) { p.role = ROLES.CIVILIAN; log('🕊 ' + p.name + ' стал Мирным'); } break;
    case 'revenge': if (S.lastZas && S.lastZas.target === p) { S.lastZas.source.suspect.add(3); log('⚔️ Месть!'); } break;
    case 'lie': p.protect = true; break;
    case 'silence': p.stealth++; break;
    case 'confess': S.players.forEach(pl => pl.suspect.set(0)); if (p.role === ROLES.MURDERER) win('detectives', '🕊 ' + p.name + ' признался!'); else p.jail = 3; break;
    case 'intercede': p.protect = true; break;
    case 'manip': { const t = U.randomChoice(S.players.filter(pl => pl !== p)); if (t) { const mv = Math.min(2, p.suspect.get()); p.suspect.add(-mv); t.suspect.add(mv); } } break;
    case 'paranoia': { const t = U.randomChoice(S.players.filter(pl => pl !== p)); if (t && !p.isBot) await showModal('<h2>👁 Роль ' + t.name + '</h2><h1>' + ROLE_LABELS[t.role] + '</h1><button data-v="ok">OK</button>'); } break;
    case 'distrust': { const t = U.randomChoice(S.players.filter(pl => pl !== p)); if (t) t.blocked = true; } break;
    case 'forgive': { const t = U.randomChoice(S.players); if (t) t.suspect.add(-3); } break;
    case 'victim': { const t = U.randomChoice(S.players); if (t) { p.coins = 0; t.suspect.add(-5); } } break;
    case 'intuition': { const t = U.randomChoice(S.players.filter(pl => pl !== p)); if (t && !p.isBot) await showModal('<h2>🔮 ' + t.name + '</h2><p>Алиби: ' + (t.chips.alibi > 0 ? 'ЕСТЬ' : 'НЕТ') + '</p><button data-v="ok">OK</button>'); } break;
    case 'chaos': S.players.forEach(pl => pl.suspect.set(U.random(0, 5))); break;
    case 'chance': { const d = U.random(1, 6); if (d <= 3) p.suspect.add(-2); else { const t = U.randomChoice(S.players.filter(pl => pl !== p)); if (t) t.suspect.add(2); } } break;
  }
  if (!p.isBot) await showModal('<h2>' + card.icon + ' ' + card.name + '</h2><p>' + card.desc + '</p><button data-v="ok">OK</button>');
}

// === СИЛА И ДУЭЛИ ===
function calculatePower(p) {
  let power = p.damage + p.defense;
  power += Math.floor(p.reputation.get() / 2);
  power += p.adrenaline.get();
  power -= Math.floor(p.fatigue.get() / 2);
  power -= p.fear.get();
  power += ROLE_BONUSES[p.role] || 0;
  power += p.powerBonus;
  const tb = TIME_BONUSES[S.timeOfDay] ? TIME_BONUSES[S.timeOfDay][p.role] : null;
  if (tb && tb.power) power += tb.power;
  return Math.max(0, power);
}
async function finalDuel() {
  const sheriff = S.players.find(p => p.role === ROLES.SHERIFF);
  const murderer = S.players.find(p => p.role === ROLES.MURDERER);
  if (!sheriff || !murderer) return;
  sheriff.pos = 24; murderer.pos = 24;
  const sp = calculatePower(sheriff), mp = calculatePower(murderer);
  playSound('effects', 'duel');
  await showModal('<h1 style="color:#ff1744">🔴 ФИНАЛЬНАЯ ДУЭЛЬ!</h1><p>🚔 ' + sheriff.name + ': ' + sp + ' ⚔️ ' + murderer.name + ': ' + mp + '</p><button data-v="ok">Начать!</button>');
  if (sp > mp) win('detectives', '🚔 ' + sheriff.name + ' поймал убийцу!');
  else if (mp > sp) {
    sheriff.reputation.add(-2); sheriff.fatigue.add(2); sheriff.fear.add(2); sheriff.coins = Math.max(0, sheriff.coins - 100);
    murderer.suspect.add(-5); murderer.reputation.add(1); murderer.coins += 100;
    for (let i = 0; i < 3; i++) await morOffer(sheriff);
    log('🔥 ' + murderer.name + ' сбежал!');
  } else { sheriff.suspect.add(1); murderer.suspect.add(1); log('⚖️ Ничья!'); }
  updateUI();
}
async function accuseOpen() {
  if (!S || S.isBusy || S.isOver) return;
  const p = S.players[S.cur];
  if (p.suspect.get() < 10 && p.role !== ROLES.SHERIFF) return;
  const targets = S.players.filter(pl => pl !== p && pl.suspect.get() >= 10);
  if (!targets.length) { await showModal('<p>Нет целей с 10+ подозрений</p><button data-v="ok">OK</button>'); return; }
  let html = '<h2>🚔 Обвинение</h2><div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">';
  targets.forEach((t, i) => { html += '<button data-v="' + i + '" style="padding:8px;background:#222;border:1px solid #ff5252;color:#fff;border-radius:4px">' + t.name + ' (' + t.suspect.get() + ')</button>'; });
  html += '</div><button data-v="close">Отмена</button>';
  const ch = await showModal(html);
  if (ch !== 'close') {
    const acc = targets[parseInt(ch)];
    if (acc.role === ROLES.MURDERER) win('detectives', '🎯 ' + p.name + ' вычислил убийцу!');
    else if (acc.role === ROLES.COP && acc.suspect.get() >= 10) { acc.role = ROLES.CIVILIAN; log('🦹 ' + acc.name + ' разоблачён!'); }
    else { p.coins = 0; p.skins = []; p.sets = []; p.jail += 2; log('❌ ' + p.name + ' ошибся!'); }
  }
  updateUI();
}

// === РАУНДЫ ===
async function endTurn() {
  if (!S || S.isBusy || S.isOver) return;
  const p = S.players[S.cur];
  p.fatigue.add(1); p.adrenaline.add(-1); p.usedChip = false; p.morUsed = false;
  document.getElementById('endBtn').disabled = true;
  let guard = 0;
  while (guard++ < S.players.length + 2) {
    S.cur = (S.cur + 1) % S.players.length;
    if (S.cur === 0) {
      S.round++; updateTime(); await investigationPhase();
      if (MMSET.autosave) saveGameLocal(); // автосейв каждый раунд
      if (S.roundLimit > 0 && S.round > S.roundLimit) { checkWin(); return; }
    }
    const next = S.players[S.cur];
    if (next.jail > 0) { next.jail--; next.jailStreak++; if (next.role === ROLES.MURDERER && next.jailStreak >= 5) { win('detectives', '🚔 Убийца арестован!'); return; } log('⛓ ' + next.name + ' в полиции'); continue; }
    next.jailStreak = 0; break;
  }
  if (S.voiceEnabled) { S.voiceCounter++; if (S.voiceCounter >= U.random(2, 5)) { S.voiceCounter = 0; await voiceOfTheStreets(); } }
  updateUI();
  if (S.players[S.cur].isBot && !S.isOver) setTimeout(botTurn, MMSET.fastbots ? 300 : 1000);
}
async function botTurn() {
  if (!S || S.isOver || window.QR_HOLD) { if (S && !S.isOver && window.QR_HOLD) setTimeout(botTurn, 800); return; }
  await rollDice(); await stepSleep(500); await endTurn();
}
function updateTime() {
  const phase = Math.floor((S.round - 1) / GAME_CONFIG.timeChangeInterval) % 4;
  const newTime = TIME_ORDER[phase];
  if (newTime !== S.timeOfDay) { S.timeOfDay = newTime; applyTimeBonuses(); log((TIME_ICONS[S.timeOfDay] || '') + ' Наступает: ' + (TIME_NAMES[S.timeOfDay] || '') + '!'); }
}
function applyTimeBonuses() {
  const b = TIME_BONUSES[S.timeOfDay];
  S.players.forEach(p => { const x = b[p.role] || {}; if (x.power) p.powerBonus += x.power; if (x.reputation) p.reputation.add(x.reputation); if (x.suspect) p.suspect.add(x.suspect); if (x.fear) p.fear.add(x.fear); if (x.stealth) p.stealth += x.stealth; });
}
async function investigationPhase() {
  log('⚖️ Фаза расследования');
  for (const p of S.players) {
    if (p.tokens <= 0 || p.muted || p.discred || p.blocked) continue;
    while (p.tokens > 0) {
      const targets = S.players.filter(pl => pl !== p && pl.suspect.get() < 15);
      if (!targets.length) break;
      if (p.isBot) { const t = U.randomChoice(targets); t.suspect.add(1); p.tokens--; log('👁 ' + p.name + ' → +1 ' + t.name); }
      else {
        let html = '<h2>⚖️ ' + p.name + '</h2><p>Жетонов: ' + p.tokens + '</p><div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">';
        targets.forEach((t, i) => { html += '<button data-v="' + i + '" style="padding:6px;background:#222;border:1px solid ' + t.color + ';color:#fff;border-radius:4px">' + t.name + ' (' + t.suspect.get() + ')</button>'; });
        html += '</div><button data-v="skip">Готово</button>';
        const ch = await showModal(html);
        if (ch === 'skip') break;
        const t = targets[parseInt(ch)]; if (t) { t.suspect.add(1); p.tokens--; log('👁 ' + p.name + ' → +1 ' + t.name); }
      }
    }
  }
  const sheriff = S.players.find(p => p.role === ROLES.SHERIFF && !p.discred && !p.isBot);
  if (sheriff) {
    const targets = S.players.filter(p => p !== sheriff && p.suspect.get() >= 10);
    if (targets.length) {
      let html = '<h2>🚔 Шериф ' + sheriff.name + '</h2><div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">';
      targets.forEach((t, i) => { html += '<button data-v="' + i + '" style="padding:6px;background:#222;border:1px solid #ff5252;color:#fff;border-radius:4px">' + t.name + '</button>'; });
      html += '</div><button data-v="skip">Пропустить</button>';
      const ch = await showModal(html);
      if (ch !== 'skip') {
        const acc = targets[parseInt(ch)]; let votes = 0;
        for (const v of S.players) {
          if (v === sheriff || v.isBot || v.muted || v.discred) continue;
          const vote = await showModal('<h2>🗳 ' + v.name + '</h2><p>Виновен ' + acc.name + '?</p><button data-v="yes">ДА</button><button data-v="no">НЕТ</button>');
          if (vote === 'yes') votes++;
        }
        if (votes > S.players.length / 2) await accuseOpen(); else log('🗳 Обвинение отклонено');
      }
    }
  }
  S.players.forEach(p => p.blocked = false);
}

// === ГОЛОС УЛИЦ ===
function pickVoice() {
  try {
    const vs = speechSynthesis.getVoices().filter(v => v.lang && v.lang.toLowerCase().startsWith('ru'));
    if (MMSET.voiceSrc === 'family') return vs.find(v => /irina|alice|алис|yandex|google|жен|female/i.test(v.name)) || vs[0] || null;
    return vs.find(v => /dmitr|pavel|male|муж/i.test(v.name)) || vs[0] || null;
  } catch (e) { return null; }
}
function tts(text) {
  try {
    if (!S || !S.voiceEnabled || !window.speechSynthesis) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ru-RU';
    if (MMSET.voiceSrc === 'family') { u.rate = 1; u.pitch = 1; } else { u.rate = .85; u.pitch = .6; }
    const vv = pickVoice(); if (vv) u.voice = vv;
    u.volume = MMSET.voice / 100;
    speechSynthesis.speak(u);
  } catch (e) {}
}
function speakLine(text, idx) {
  const mp3 = 'snd/voice/phrases/' + (idx + 1) + '.mp3';
  soundCache.load(mp3).then(a => { if (a) { a.volume = 1; a.currentTime = 0; a.play().catch(() => {}); } else tts(text); });
}
async function pickVoiceImg(type, idx) {
  const cands = ['img/voice/' + (idx + 1) + '.png', 'img/voice/' + type + '.png', 'img/voice/voice.png'];
  for (const p of cands) { const im = await imageCache.get(p); if (im) return p; }
  return null;
}
function showVoicePlate(imgPath, phrase, eff) {
  return new Promise(resolve => {
    let plate = document.getElementById('voicePlate');
    if (!plate) { plate = document.createElement('div'); plate.id = 'voicePlate'; plate.className = 'voice-plate'; document.body.appendChild(plate); }
    plate.innerHTML = (imgPath ? '<div class="voice-img"><img src="' + imgPath + '"></div>' : '') +
      '<div class="voice-body"><div class="voice-title">ГОЛОС УЛИЦ</div>' +
      '<div class="voice-phrase">«' + phrase + '»</div>' +
      '<div class="voice-event">' + eff.label + ' — ' + eff.description + '</div>' +
      '<button class="voice-ok">👂 Я услышал...</button></div>';
    requestAnimationFrame(() => plate.classList.add('on'));
    plate.querySelector('.voice-ok').onclick = () => { plate.classList.remove('on'); if (window.speechSynthesis) speechSynthesis.cancel(); resolve(); };
  });
}
async function voiceOfTheStreets() {
  const type = U.randomChoice(Object.keys(VOICE_EFFECTS));
  const eff = VOICE_EFFECTS[type];
  playSound('voice', 'appear');
  const idx = U.random(0, VOICE_LINES.length - 1);
  const phrase = VOICE_LINES[idx];
  speakLine(phrase, idx);
  const imgPath = await pickVoiceImg(type, idx);
  log('👻 Голос улиц: ' + eff.label);
  await showVoicePlate(imgPath, phrase, eff);
  switch (type) {
    case 'chaos': S.players.forEach(p => { p.fatigue.add(U.random(1, 2)); p.fear.add(U.random(1, 2)); p.suspect.add(U.random(-2, 2)); }); break;
    case 'target': { const t = U.randomChoice(S.players); t.fatigue.add(2); t.fear.add(2); t.suspect.add(2); log('🎯 ' + t.name + ' под ударом!'); } break;
    case 'curse': { const t = U.randomChoice(S.players); t.fatigue.add(2); t.fear.add(2); t.reputation.add(-2); t.suspect.add(2); log('💀 ' + t.name + ' проклят!'); } break;
    case 'bless': { const t = U.randomChoice(S.players); t.fatigue.add(-2); t.fear.add(-2); t.reputation.add(2); t.suspect.add(-2); log('✨ ' + t.name + ' благословлён!'); } break;
    case 'shuffle': { const pos = U.shuffle(S.players.map(p => p.pos)); S.players.forEach((p, i) => p.pos = pos[i]); log('🌀 Игроки перемешаны!'); } break;
    case 'steal': S.players.forEach(p => { p.coins = Math.max(0, p.coins - 50); }); log('💰 Все потеряли по 50 монет!'); break;
  }
  playSound('voice', 'disappear');
  updateUI();
}

// === ПОБЕДА ===
function checkWin() { const m = S.players.find(p => p.role === ROLES.MURDERER); if (m && m.suspect.get() < 15) win('murderer', '🔪 Убийца остался нераскрытым!'); else win('detectives', '🏆 Детективы победили!'); }
function win(side, msg) {
  S.isOver = true;
  localStorage.removeItem('mm_save');
  playSound('effects', side === 'detectives' ? 'win' : 'lose');
  showModal('<h1 style="color:' + (side === 'detectives' ? '#4caf50' : '#ff1744') + '">' + (side === 'detectives' ? '🏆 ПОБЕДА ДЕТЕКТИВОВ!' : '💀 ПОБЕДА УБИЙЦЫ!') + '</h1><p>' + msg + '</p><button onclick="location.reload()">🔄 Заново</button>');
}

// === ВСПОМОГАТЕЛЬНЫЕ ===
function applyEffects(p, fx) {
  if (!fx) return;
  if (fx.coins) p.coins += fx.coins; if (fx.suspect) p.suspect.add(fx.suspect);
  if (fx.fatigue) p.fatigue.add(fx.fatigue); if (fx.fear) p.fear.add(fx.fear);
  if (fx.reputation) p.reputation.add(fx.reputation); if (fx.adrenaline) p.adrenaline.add(fx.adrenaline);
  if (fx.chips) fx.chips.forEach(c => p.chips[c] = (p.chips[c] || 0) + 1);
  if (fx.stealth) p.stealth += fx.stealth; if (fx.double) p.double = true; if (fx.protect) p.protect = true; if (fx.clearSuspect) p.suspect.set(0);
}
async function showModal(html) {
  return new Promise(resolve => {
    const ov = document.getElementById('overlay');
    ov.style.display = 'flex';
    ov.innerHTML = '<div class="modal-card">' + html + '</div>';
    ov.querySelectorAll('button[data-v]').forEach(b => { b.onclick = () => { ov.style.display = 'none'; resolve(b.dataset.v); }; });
  });
}
function log(msg) { const el = document.getElementById('log'); if (el) { el.innerHTML += '<div class="log-entry">• ' + msg + '</div>'; el.scrollTop = el.scrollHeight; } }
function playSound(category, key) {
  if (!S || !S.voiceEnabled) return;
  let path = '';
  if (category === 'effects') path = ASSETS.sounds.effects[key];
  else if (category === 'cells') path = ASSETS.sounds.cells[key];
  else if (category === 'cards') path = ASSETS.sounds.cards[key];
  else if (category === 'voice') path = ASSETS.sounds.voice[key];
  if (path) soundCache.play(path);
}
function showPreview(data) {
  const pv = document.getElementById('preview'); if (!pv) return;
  const c = pv.querySelector('.preview-content');
  c.innerHTML = '<h3>' + data.name + '</h3>' + (data.price ? '<p>Цена: ' + data.price + '</p>' : '');
  pv.classList.add('on');
  setTimeout(() => pv.classList.remove('on'), 2000);
}

// === МУЗЫКА (ЧИСТЫЙ ПЛЕЕР: тихо в заставке → плавный вход на правилах) ===
const musicPlayer = {
  list: (typeof ASSETS !== 'undefined' && ASSETS.sounds && ASSETS.sounds.music) ? ASSETS.sounds.music : [],
  idx: 0, audio: null, vol: 0.5, playing: false, _f: null,
  init() {
    if (this.audio) return;
    this.audio = new Audio();
    this.audio.volume = 0;
    this.audio.onended = () => this.next();
    this.audio.onerror = () => { this.next(); };
  },
  start() { if (this.playing) return; this.play(); },
  play() {
    if (!this.list.length) return;
    this.init();
    this.audio.src = this.list[this.idx];
    this.audio.play().catch(() => {});
    this.playing = true;
    this.fadeTo(this.vol, 2500); // плавное вступление
    this.refreshBtn();
  },
  fadeTo(v, t) {
    const a = this.audio; if (!a) return;
    clearInterval(this._f);
    const steps = 25, dv = (v - a.volume) / steps;
    let i = 0;
    this._f = setInterval(() => {
      i++; a.volume = Math.max(0, Math.min(1, a.volume + dv));
      if (i >= steps) { a.volume = v; clearInterval(this._f); }
    }, (t || 1500) / steps);
  },
  pause() { if (this.audio) this.audio.pause(); this.playing = false; this.refreshBtn(); },
  next() { if (!this.list.length) return; this.idx = (this.idx + 1) % this.list.length; if (this.playing) { this.audio.src = this.list[this.idx]; this.audio.play().catch(() => {}); } },
  prev() { if (!this.list.length) return; this.idx = (this.idx - 1 + this.list.length) % this.list.length; if (this.playing) { this.audio.src = this.list[this.idx]; this.audio.play().catch(() => {}); } },
  toggleMute() { this.init(); this.audio.muted = !this.audio.muted; const b = document.getElementById('musicToggleBtn'); if (b) b.textContent = this.audio.muted ? '🔇' : '🔊'; },
  refreshBtn() { const b = document.getElementById('musicPauseBtn'); if (b) b.textContent = this.playing ? '❚❚' : '▶'; }
};
window.musicPause = () => { if (musicPlayer.playing) musicPlayer.pause(); else musicPlayer.play(); };
window.musicNext = () => musicPlayer.next();
window.musicPrev = () => musicPlayer.prev();
window.musicToggle = () => musicPlayer.toggleMute();

// === ФОНЫ И ЛОГО ===
function probeVideo(path) {
  return new Promise(resolve => {
    const v = document.createElement('video');
    v.onloadedmetadata = () => resolve(true);
    v.onerror = () => resolve(false);
    v.src = path; v.load();
  });
}
async function applyAutoBackground() {
  const videos = ['img/ui/bg.mp4', 'img/ui/bg.webm'];
  for (const vp of videos) {
    if (await probeVideo(vp)) {
      let v = document.getElementById('bgVideo');
      if (!v) { v = document.createElement('video'); v.id = 'bgVideo'; v.muted = true; v.loop = true; v.autoplay = true; v.playsInline = true; document.body.prepend(v); }
      v.src = vp; v.play().catch(() => {});
      document.body.classList.add('has-bg');
      return;
    }
  }
  const imgs = ['img/ui/bg.png', 'img/ui/bg.jpg', 'img/ui/bg.webp'];
  for (const ip of imgs) {
    const im = await imageCache.get(ip);
    if (im) {
      document.body.style.backgroundImage = "url('" + ip + "')";
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundAttachment = 'fixed';
      document.body.classList.add('has-bg');
      return;
    }
  }
}
async function applyAutoLogo() {
  const logos = ['img/ui/logo.png', 'img/ui/logo.jpg', 'img/ui/logo.svg', 'img/ui/logo.webp'];
  for (const p of logos) {
    const im = await imageCache.get(p);
    if (im) { document.querySelectorAll('.main-logo, .mini-logo').forEach(el => { el.src = p; el.style.display = ''; }); return; }
  }
}

// === СОХРАНЕНИЯ ===
function serializeGame() {
  const players = S.players.map(p => ({
    name: p.name, role: p.role, index: p.index, isBot: p.isBot, color: p.color, tokenUrl: p.tokenUrl, gender: p.gender || 'm',
    pos: p.pos, coins: p.coins, tokens: p.tokens, income: p.income,
    suspect: p.suspect.get(), fatigue: p.fatigue.get(), fear: p.fear.get(),
    reputation: p.reputation.get(), adrenaline: p.adrenaline.get(), connections: p.connections.get(),
    skins: p.skins, sets: p.sets, morals: p.morals, chips: p.chips,
    jail: p.jail, jailStreak: p.jailStreak, stealth: p.stealth, powerBonus: p.powerBonus,
    damage: p.damage, defense: p.defense, double: p.double, protect: p.protect,
    usedChip: p.usedChip, morUsed: p.morUsed, avoid: p.avoid, discred: p.discred,
    muted: p.muted, blocked: p.blocked, vRoof: p.vRoof, vCrime: p.vCrime, vPol: p.vPol, vStart: p.vStart
  }));
  return JSON.stringify({
    v: 1, players, cur: S.cur, round: S.round, roundLimit: S.roundLimit, timeOfDay: S.timeOfDay,
    voiceEnabled: S.voiceEnabled, voiceCounter: S.voiceCounter, ownedCells: S.ownedCells,
    decks: S.decks, morDeck: S.morDeck, morDiscard: S.morDiscard,
    lastZas: S.lastZas ? { s: S.lastZas.source.index, t: S.lastZas.target.index } : null
  });
}
function deserializeGame(json) {
  const d = JSON.parse(json);
  const players = d.players.map(pd => {
    const p = new Player(pd.name, pd.role, pd.index, pd.isBot, pd.tokenUrl);
    p.color = pd.color; p.gender = pd.gender;
    p.pos = pd.pos; p.coins = pd.coins; p.tokens = pd.tokens; p.income = pd.income;
    p.skins = pd.skins; p.sets = pd.sets; p.morals = pd.morals; p.chips = pd.chips;
    p.jail = pd.jail; p.jailStreak = pd.jailStreak; p.stealth = pd.stealth; p.powerBonus = pd.powerBonus;
    p.damage = pd.damage; p.defense = pd.defense; p.double = pd.double; p.protect = pd.protect;
    p.usedChip = pd.usedChip; p.morUsed = pd.morUsed; p.avoid = pd.avoid; p.discred = pd.discred;
    p.muted = pd.muted; p.blocked = pd.blocked; p.vRoof = pd.vRoof; p.vCrime = pd.vCrime; p.vPol = pd.vPol; p.vStart = pd.vStart;
    p.suspect.set(pd.suspect); p.fatigue.set(pd.fatigue); p.fear.set(pd.fear);
    p.reputation.set(pd.reputation); p.adrenaline.set(pd.adrenaline); p.connections.set(pd.connections);
    return p;
  });
  S = {
    players, cur: d.cur, round: d.round, roundLimit: d.roundLimit, timeOfDay: d.timeOfDay,
    voiceEnabled: d.voiceEnabled, voiceCounter: d.voiceCounter,
    isOver: false, isBusy: false, lastChip: null, rollMark: '',
    lastZas: d.lastZas ? { source: players[d.lastZas.s], target: players[d.lastZas.t] } : null,
    ownedCells: d.ownedCells || {}, logs: [], decks: d.decks, morDeck: d.morDeck, morDiscard: d.morDiscard
  };
}
function saveGameLocal() { if (!S || S.isOver) return; localStorage.setItem('mm_save', serializeGame()); log('💾 Игра сохранена!'); }
function loadGameLocal() {
  const json = localStorage.getItem('mm_save');
  if (!json) return false;
  try { deserializeGame(json); } catch (e) { alert('❌ Сохранение повреждено!'); return false; }
  enterGameScreen(); log('📂 Игра загружена!'); return true;
}
function exportCode() {
  if (!S) return;
  const code = btoa(unescape(encodeURIComponent(serializeGame())));
  showModal('<h2>📤 Код сохранения</h2><p style="font-size:12px;opacity:.7">⚠️ В коде открыты роли — не пересылай другим игрокам!</p><textarea id="exportArea" readonly style="width:100%;height:120px;background:#0d1226;color:#eee;border:1px solid #d4af37;border-radius:8px;padding:8px;font-size:11px">' + code + '</textarea><button data-v="copy">📋 Копировать</button><button data-v="ok">Закрыть</button>').then(v => {
    if (v === 'copy') { const ta = document.getElementById('exportArea'); ta.select(); try { navigator.clipboard.writeText(ta.value); } catch (e) { document.execCommand('copy'); } }
  });
}
function importCode(code) {
  const json = decodeURIComponent(escape(atob(code.trim())));
  deserializeGame(json);
  enterGameScreen(); log('📥 Игра загружена из кода!');
}

// === НАСТРОЙКИ МЕНЮ: ИМЕНА + ПОЛ + ФИШКИ ===
function updatePlayerNames() {
  const count = parseInt(document.getElementById('playerCount').value);
  const container = document.getElementById('playerNames');
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;gap:6px;align-items:center;';
    const input = document.createElement('input');
    input.id = 'playerName_' + i;
    input.placeholder = 'Игрок ' + (i + 1) + ' (пусто = бот)';
    input.maxLength = 12;
    input.style.cssText = 'flex:1;padding:8px 12px;border-radius:8px;border:1px solid rgba(212,175,55,.35);background:#0d1226;color:#fff;font-size:13px;';
    const sel = document.createElement('select');
    sel.title = 'Пол персонажа';
    sel.style.cssText = 'width:74px;padding:8px 4px;border-radius:8px;border:1px solid ' + PCOLORS[i] + ';background:#0d1226;color:#eee;font-size:14px;cursor:pointer;';
    sel.innerHTML = '<option value="r">🎲</option><option value="m">👨</option><option value="f">👩</option>';
    if (GENDER_PREF[i]) sel.value = GENDER_PREF[i];
    sel.onchange = () => { GENDER_PREF[i] = sel.value; };
    wrap.appendChild(input); wrap.appendChild(sel);
    container.appendChild(wrap);
  }
  buildTokenSelector();
}
function renderTokPreview(i) {
  const el = document.getElementById('tokPrev_' + i);
  if (!el) return;
  const n = TOKEN_CHOICE[i];
  const path = 'img/tokens/' + n + '.png';
  imageCache.get(path).then(ok => {
    if (ok) { el.innerHTML = '<img src="' + path + '" style="width:54px;height:54px;object-fit:contain;border:2px solid ' + PCOLORS[i] + ';border-radius:50%">'; TOKEN_URLS[i] = path; }
    else { el.innerHTML = '<div style="width:46px;height:46px;border-radius:50%;background:' + PCOLORS[i] + ';border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;color:#000">' + n + '</div>'; TOKEN_URLS[i] = null; }
  });
}
function buildTokenSelector() {
  const box = document.getElementById('tokenSelector');
  if (!box) return;
  const count = parseInt(document.getElementById('playerCount').value);
  box.innerHTML = '<div style="font-size:13px;color:#dfe6ff;font-weight:600;margin:10px 0 8px">🎲 Фишки игроков (◀ ▶ — выбрать)</div>';
  const grid = document.createElement('div');
  grid.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:10px;';
  for (let i = 0; i < count; i++) {
    if (TOKEN_CHOICE[i] == null) TOKEN_CHOICE[i] = i + 1;
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:6px;justify-content:center;background:#0d1226;border:1px solid ' + PCOLORS[i] + ';border-radius:10px;padding:8px;';
    row.innerHTML = '<button type="button" class="tok-arrow" data-i="' + i + '" data-d="-1">◀</button>' +
      '<div id="tokPrev_' + i + '" style="width:58px;height:58px;display:flex;align-items:center;justify-content:center;"></div>' +
      '<button type="button" class="tok-arrow" data-i="' + i + '" data-d="1">▶</button>';
    grid.appendChild(row);
  }
  box.appendChild(grid);
  box.querySelectorAll('.tok-arrow').forEach(b => {
    b.onclick = () => { const i = +b.dataset.i, d = +b.dataset.d; TOKEN_CHOICE[i] = ((TOKEN_CHOICE[i] - 1 + d + 6) % 6) + 1; renderTokPreview(i); };
  });
  for (let i = 0; i < count; i++) renderTokPreview(i);
}

// === ГЛОБАЛЬНЫЕ ДЛЯ HTML ===
window.roll = rollDice;
window.endTurn = endTurn;
window.accuseOpen = accuseOpen;
window.morOpen = morOpen;
window.useChip = useChip;
window.playMorCard = playMorCard;
window.toggleView = () => document.getElementById('board').classList.toggle('flat');

// === КОНЕЦ ЧАСТИ 1/2 ===
// ============================================
// MURDER MONOPOLY — GAME.JS (ФИНАЛЬНАЯ ЧИСТАЯ СБОРКА, ЧАСТЬ 2/2)
// ============================================

// === НАСТРОЙКИ (MMSET) + СМЕННЫЕ ИКОНКИ ===
window.MMSET = Object.assign({ music: 80, neon: 40, voice: 80, text: 100, sfx: true, tts: true, intro: true, bgvideo: true, autosave: true, fastbots: false, gate: true, voiceSrc: 'robot' }, JSON.parse(localStorage.getItem('mm_settings') || '{}'));
function saveSet() { localStorage.setItem('mm_settings', JSON.stringify(MMSET)); }
function voiceOn() {
  if (!MMSET.sfx) return false;
  if (S) return S.voiceEnabled;
  const c = document.getElementById('voiceEnabled');
  return c ? c.checked : true;
}
window.MM_ICONS = {
  rules: [null, null, null, null, null, null, null, null, null], // 0 цель,1 роли,2 ход,3 подозрения,4 карты,5 мораль,6 скины,7 время,8 монеты
  stacks: { witness: null, alibi: null, ulika: null, dopros: null, zasada: null }
};
function applyRuleIcons() { document.querySelectorAll('.rule-ico').forEach((el, i) => { const p = MM_ICONS.rules[i]; if (p) el.innerHTML = '<img src="' + p + '" class="ico-img">'; }); }
function applyStackIcons() { Object.keys(MM_ICONS.stacks).forEach(t => { const p = MM_ICONS.stacks[t]; if (!p) return; document.querySelectorAll('.stack[onclick*="' + t + '"]').forEach(st => { const sp = st.querySelector('span'); if (sp) sp.innerHTML = '<img src="' + p + '" class="ico-img">'; }); }); }

// === ВСПЛЫВАШКИ: КЛЕТКИ ===
const CELL_DESC = {
  start: 'Старт: проходя мимо, получай +200 монет, −1 подозрение',
  coin: 'Монета: получи 50–100 монет',
  roof: 'Небоскрёб: ты на крыше! Тени скрывают тебя',
  tunnel: 'Тоннель: страх < 5 — на Старт, иначе в Полицию',
  crime: 'Преступление: +1 страх, +1 адреналин, +1 подозрение случайному игроку',
  stash: 'Тайник: тяни карту тайника — там сокровища!',
  police: 'Полиция: подозрения = 0, но ты в участке',
  shop: 'Магазин скинов: покупай товары и фишки',
  hospital: 'Больница: −2 усталости, −2 страха (50 монет)',
  psychologist: 'Психолог: −1 страх, +1 репутация (30 монет)',
  gym: 'Спортзал: −1 усталость, +1 адреналин (40 монет)',
  skin: 'Клетка скина: купи оружие или плати владельцу аренду'
};
const CELL_EMO = { start: '🟢', coin: '🪙', roof: '🏙️', tunnel: '🚇', crime: '👣', stash: '🎁', police: '🚔', shop: '🛒', hospital: '🏥', psychologist: '🧠', gym: '💪', skin: '🗡' };
const CELL_LORE = {
  start: 'Старт — сердце квартала. Отсюда все выходят в ночь и сюда возвращаются на рассвете. Проходя мимо, получаешь 200 монет и немного стираешь следы (−1 подозрение).',
  roof: 'Небоскрёб — крыша города. Ветер свистит между антенн, внизу мигает неон. Отсюда видно всё: кто куда идёт и кто за кем следит. Тени скрывают тебя от чужих глаз.',
  tunnel: 'Тоннель — тёмный проход под городом. Пахнет сыростью и тайной. Нервы крепкие (страх < 5) — выйдешь на Старте. Страшно — заблудишься и окажешься в Полиции.',
  crime: 'Преступление — место, где прошлой ночью что-то случилось. Мел в форме тела, запах пороха. Каждый, кто заходит, оставляет следы — и вешает +1 подозрение на случайного игрока.',
  stash: 'Тайник — старый схрон в кирпичной кладке. Только свои знают, где искать. Внутри — монеты, амулеты или чужие секреты.',
  police: 'Полиция — участок с кофейным автоматом и лампой, которая не гаснет. Здесь обнуляют подозрения, но свобода стоит ночи в камере.',
  shop: 'Магазин скинов — лавка старьёвщика за углом. На витрине — легендарные клинки и крылья. Всё, чтобы выжить в этом городе… за монеты.',
  hospital: 'Больница — белые стены и запах хлорки. Врачи не задают вопросов. Подлатают, снимут усталость и страх — было бы чем заплатить (50 монет).',
  psychologist: 'Психолог — тихий кабинет с мягким креслом. Здесь можно выдохнуть, собраться с мыслями и вернуть доброе имя (30 монет).',
  gym: 'Спортзал — железо, пот и рёв мотивации. Снимает усталость, заряжает адреналином. Убийцы тоже качаются (40 монет).'
};
let tipEl = null, tipHideT = null, ambientAudio = null, ambientTimer = null;
function ensureTip() {
  if (!tipEl) { tipEl = document.createElement('div'); tipEl.id = 'cellTip'; document.body.appendChild(tipEl); }
  return tipEl;
}
function stopAmbient() { if (ambientAudio) { ambientAudio.pause(); ambientAudio.currentTime = 0; ambientAudio = null; } }
function fadeAmbient() {
  if (!ambientAudio) return;
  const a = ambientAudio;
  let v = a.volume;
  const iv = setInterval(() => {
    v -= 0.04;
    if (v <= 0 || ambientAudio !== a) { clearInterval(iv); a.pause(); a.currentTime = 0; if (ambientAudio === a) ambientAudio = null; }
    else a.volume = v;
  }, 60);
}
async function showCellTip(idx, cellEl) {
  const d = getCellData(idx);
  const tip = ensureTip();
  clearTimeout(tipHideT);
  stopAmbient();
  clearTimeout(ambientTimer);
  const isSpecial = d.type !== 'skin' && d.type !== 'coin';
  let imgPath = null;
  if (d.skinId && window.SKINS && SKINS[d.skinId] && window.getSkinImage) imgPath = getSkinImage(d.skinId, SKINS[d.skinId].category);
  if (!imgPath && d.img) imgPath = d.img;
  let owner = '';
  if (d.skinId && S) { const o = S.players.find(p => p.skins.includes(d.skinId)); if (o) owner = '👑 Владелец: ' + o.name; }
  if (isSpecial) {
    tip.classList.add('big');
    tip.innerHTML = '<div class="tip-head">' + d.name + '</div><div class="tip-img">' + (CELL_EMO[d.type] || '❓') + '</div>' +
      '<div class="tip-effect">⚙️ ЧТО ДАЁТ: ' + (CELL_DESC[d.type] || '') + '</div>' +
      '<div class="tip-lore">' + (CELL_LORE[d.type] || '') + '</div>' +
      '<div class="tip-hint">🔊 короткий звук локации</div>';
    const amb = ASSETS.sounds.cells[d.type];
    if (amb && (!S || S.voiceEnabled)) {
      const a = await soundCache.load(amb);
      if (a) { ambientAudio = a; a.loop = false; a.volume = 0.25; a.currentTime = 0; a.play().catch(() => {}); ambientTimer = setTimeout(fadeAmbient, 2600); }
    }
  } else {
    tip.classList.remove('big');
    tip.innerHTML = '<div class="tip-head">' + d.name + (d.price ? ' <span class="tip-price">· ' + d.price + '💰</span>' : '') + '</div>' +
      '<div class="tip-body"><div class="tip-img">' + (CELL_EMO[d.type] || '🗡') + '</div>' +
      '<div class="tip-info"><div class="tip-desc">' + (CELL_DESC[d.type] || '') + '</div>' + (owner ? '<div class="tip-owner">' + owner + '</div>' : '') + '</div></div>';
    const snd = d.type === 'coin' ? ASSETS.sounds.cells.coin : ASSETS.sounds.effects.hover;
    if (snd && (!S || S.voiceEnabled)) soundCache.play(snd, 0.15);
  }
  if (imgPath) imageCache.get(imgPath).then(im => { if (im) { const box = tip.querySelector('.tip-img'); if (box) box.innerHTML = '<img src="' + imgPath + '">'; } });
  const r = cellEl.getBoundingClientRect();
  tip.style.left = Math.min(window.innerWidth - 340, Math.max(8, r.right + 12)) + 'px';
  tip.style.top = Math.min(window.innerHeight - (isSpecial ? 500 : 180), Math.max(8, r.top - 10)) + 'px';
  tip.classList.add('on');
}
// === ВСПЛЫВАШКИ: СТАКИ ===
const CHIP_INFO = {
  witness: { name: 'СВИДЕТЕЛЬ', emo: '👁', mech: 'Карта свидетеля: +1 подозрение указанному игроку и монеты за показания.', lore: 'На улицах всегда найдётся тот, кто видел лишнее: старуха у подъезда, ночной сторож, случайный прохожий. За пару монет их память становится твоим оружием.' },
  alibi: { name: 'АЛИБИ', emo: '⏳', mech: '−1 подозрение, +400 монет и возврат на Старт.', lore: '«В ту ночь я был дома». Правильные слова, сказанные в нужное время, стирают следы лучше дождя.' },
  ulika: { name: 'УЛИКА', emo: '🔍', mech: 'Карта улики: +1–2 подозрения цели, но платишь монеты за экспертизу.', lore: 'Окурок, пуговица, обрывок ткани. Мелочи, которые оставляют даже лучшие. Особенно лучшие.' },
  dopros: { name: 'ДОПРОС', emo: '🎤', mech: 'Карта допроса: +1–2 подозрения цели, −монеты на «кофе» для свидетелей.', lore: 'Лампа, стул, тишина. Под давлением заговорит каждый. Вопрос лишь в том, что он скажет о тебе.' },
  zasada: { name: 'ЗАСАДА', emo: '💣', mech: 'Карта засады: +1–2 подозрения и +1 страх цели, −монеты. Запоминает обидчика для мести.', lore: 'Терпение — оружие. Тень у ворот ждёт час, два, ночь. А потом город узнаёт новое имя подозреваемого.' }
};
let stackSnd = null, stackSndT = null;
function stopStackSnd() { clearTimeout(stackSndT); if (stackSnd) { stackSnd.pause(); stackSnd.currentTime = 0; stackSnd = null; } }
async function showStackTip(type, el) {
  const tip = ensureTip();
  clearTimeout(tipHideT);
  const same = tip.dataset.tipKind === 'stack' && tip.dataset.tipType === type && tip.classList.contains('on');
  if (same) return;
  tip.dataset.tipKind = 'stack';
  tip.dataset.tipType = type;
  const info = CHIP_INFO[type];
  tip.classList.add('big');
  tip.innerHTML = '<div class="tip-head">' + info.name + '</div><div class="tip-img">' + info.emo + '</div>' +
    '<div class="tip-effect">⚙️ ЧТО ДАЁТ: ' + info.mech + '</div><div class="tip-lore">' + info.lore + '</div><div class="tip-hint">🔊 короткий звук карты</div>';
  const cands = ['img/chips/' + type + '.png', 'img/cards/' + type + '.png'];
  for (const pth of cands) { const im = await imageCache.get(pth); if (im) { const box = tip.querySelector('.tip-img'); if (box) box.innerHTML = '<img src="' + pth + '">'; break; } }
  stopStackSnd();
  const snd = ASSETS.sounds.cards[type];
  if (snd && (!S || S.voiceEnabled)) {
    const a = await soundCache.load(snd);
    if (a) { stackSnd = a; a.loop = false; a.volume = 0.25; a.currentTime = 0; a.play().catch(() => {}); stackSndT = setTimeout(stopStackSnd, 3000); }
  }
  const r = el.getBoundingClientRect();
  tip.style.left = Math.min(window.innerWidth - 340, Math.max(8, r.left - 40)) + 'px';
  tip.style.top = Math.max(8, r.top - 470) + 'px';
  tip.classList.add('on');
}
function decorateStacks() {
  ['witness', 'alibi', 'ulika', 'dopros', 'zasada'].forEach(t => {
    const els = document.querySelectorAll('.stack[onclick*="' + t + '"]');
    if (!els.length) return;
    const cands = ['img/chips/' + t + '.png', 'img/cards/' + t + '.png'];
    (async () => { for (const pth of cands) { const im = await imageCache.get(pth); if (im) { els.forEach(el => { el.style.backgroundImage = 'url(' + pth + ')'; el.style.backgroundSize = 'cover'; el.style.backgroundPosition = 'center'; el.classList.add('has-img'); }); break; } } })();
  });
}
// === ВСПЛЫВАШКИ: ХАРАКТЕРИСТИКИ ===
const STAT_LORE = [
  { name: '💰 МОНЕТЫ', desc: 'Твоя наличность: покупка скинов, Больница, Психолог, штрафы. На Старте +200 и доход. Ошибёшься с обвинением — сгорят в ноль!' },
  { name: '🚨 ПОДОЗРЕНИЯ', desc: 'Главная шкала розыска (0–15). 10+ — тебя можно обвинить, 15 — ФИНАЛЬНАЯ ДУЭЛЬ. Снижаются на Старте, в Больнице и картами.' },
  { name: '🎟 ЖЕТОНЫ', desc: 'Твои «голоса детектива» (3 на старте). Тратишь в фазе расследования в конце раунда: +1 подозрение любому игроку.' },
  { name: '😫 УСТАЛОСТЬ', desc: '0–5. Растёт каждый ход и от событий. На максимуме бросок кубика −2. Отдых лечит: Старт (−1) и Больница (−2).' },
  { name: '😨 СТРАХ', desc: '0–5. Твои нервы. Высокий страх закрывает Тоннель (уедешь в Полицию) и бьёт по силе: −1 за каждое очко.' },
  { name: '⭐ РЕПУТАЦИЯ', desc: 'От −5 до +5. Доброе имя: +1 к силе за каждые 2 очка. Отрицательная — позор и слабость в дуэли.' },
  { name: '⚡ АДРЕНАЛИН', desc: '0–3. Заряжает: +1 к кубикам и +1 к силе за очко. Но сгорает по 1 в конце каждого хода.' },
  { name: '🤝 СВЯЗИ', desc: '0–3. Знакомства в городе: растут на Старте, дают доход и уважение, входят в сеты Коллекционера.' },
  { name: '🗡 СИЛА', desc: 'Итог для дуэлей: оружие + защита + репутация÷2 + адреналин − усталость÷2 − страх + бонусы роли, сетов и времени суток.' }
];
// === ЗВУКИ НАВЕДЕНИЯ (hover.mp3 или мягкий синтез) ===
let hoverCtx = null, hoverLast = 0, lastBtnHover = null, lastFlipCard = null;
function synthHoverFallback(freq) {
  try {
    if (!hoverCtx) hoverCtx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = hoverCtx;
    if (ctx.state === 'suspended') ctx.resume();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = (freq || 720) + Math.random() * 40;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.16);
    o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + 0.18);
  } catch (e) {}
}
function softHover(freq) {
  const now = performance.now();
  if (now - hoverLast < 90) return;
  hoverLast = now;
  if (!voiceOn()) return;
  soundCache.load('snd/effects/hover.mp3').then(a => {
    if (a) { a.volume = .15; a.currentTime = 0; a.play().catch(() => {}); }
    else synthHoverFallback(freq);
  });
}
function flipSwish(vol) {
  try {
    if (!hoverCtx) hoverCtx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = hoverCtx;
    if (ctx.state === 'suspended') ctx.resume();
    const dur = 0.25;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) { const t = i / len; d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 1.8); }
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1;
    f.frequency.setValueAtTime(700, ctx.currentTime);
    f.frequency.exponentialRampToValueAtTime(3500, ctx.currentTime + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    src.connect(f); f.connect(g); g.connect(ctx.destination);
    src.start();
  } catch (e) {}
}
function speakMor(c) {
  try {
    if (!window.speechSynthesis) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(c.name + '. ' + c.effect);
    u.lang = 'ru-RU'; u.rate = 0.85; u.pitch = 0.6; u.volume = MMSET.voice / 100;
    speechSynthesis.speak(u);
  } catch (e) {}
}
// === ГОРОД, ЧАСЫ, КУБИК ===
function addSkyline() {
  const board = document.getElementById('board');
  if (!board || document.getElementById('skyline')) return;
  const W = 900, H = 80;
  const neons = ['#00cfff', '#ff004c', '#ffe600', '#7b2dff', '#00ff88'];
  let x = 0, inner = '';
  while (x < W) {
    const bw = 20 + Math.random() * 45;
    const bh = 20 + Math.random() * 55;
    inner += '<rect x="' + x + '" y="' + (H - bh) + '" width="' + (bw - 4) + '" height="' + bh + '" fill="#070c1c"/>';
    if (Math.random() < 0.3) {
      inner += '<rect x="' + (x + (bw - 4) / 2) + '" y="' + (H - bh - 10) + '" width="2" height="10" fill="#070c1c"/>';
      inner += '<circle cx="' + (x + (bw - 4) / 2 + 1) + '" cy="' + (H - bh - 11) + '" r="2" fill="' + neons[Math.floor(Math.random() * neons.length)] + '" opacity=".8"/>';
    }
    const wc = 2 + Math.floor(Math.random() * 5);
    for (let i = 0; i < wc; i++) {
      inner += '<rect x="' + (x + 3 + Math.random() * Math.max(4, bw - 12)) + '" y="' + (H - bh + 4 + Math.random() * Math.max(4, bh - 10)) + '" width="3" height="4" fill="' + neons[Math.floor(Math.random() * neons.length)] + '" opacity="' + (0.25 + Math.random() * 0.5).toFixed(2) + '"/>';
    }
    x += bw;
  }
  const div = document.createElement('div');
  div.id = 'skyline';
  div.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none">' + inner + '</svg>';
  board.prepend(div);
}
// === СТРАНИЦА ПРАВИЛ + ОКНО + ПЛАШКА ===
const RULE_DATA = [
  { t: 'ЦЕЛЬ', d: 'Город охвачен страхом: среди вас скрывается убийца. Задача шерифа — вычислить его: довести шкалу подозрения до пятнадцати и победить в финальной дуэли. Задача убийцы — обратная: выжить, перевести подозрения на других и тихо разбогатеть. Если к финалу убийца не раскрыт — он победил.' },
  { t: 'РОЛИ', d: 'Каждый получает роль секретно. Шериф — закон: он может обвинять и ведёт финальную дуэль. Убийца — тень: его сила растёт ночью. Мирный — житель: выживает и может неожиданно изменить всё через карты морали. Продажный коп — двойной агент, играет за себя. Никто не должен знать твою роль — город не прощает ошибок.' },
  { t: 'ХОД', d: 'Нажми «Бросить» — кубик бросается один раз за ход. Фишка идёт по кольцу города, и каждая клетка — событие: монеты, больница, полиция, тайник, магазин скинов. Потом «Завершить» — и город передаёт ход следующему. Встретил другого на клетке — плюс один страх и плюс один адреналин: этот город не любит свидетелей.' },
  { t: 'ПОДОЗРЕНИЯ', d: 'Это шкала внимания города, от ноля до пятнадцати. Десять и выше — тебя можно обвинить; ошибочное обвинение сжигает монеты обвинителя. Пятнадцать — финальная дуэль: шериф против убийцы, сила против силы. В конце каждого раунда — расследование: трать жетоны и вешай подозрения на тех, кому не веришь.' },
  { t: 'КАРТЫ ДЕЙСТВИЙ', d: 'В центре поля — пять стаков: Свидетель, Алиби, Улика, Допрос и Засада. Один раз за ход тяни одну. Свидетель указывает пальцем и приносит монеты. Алиби стирает подозрения и возвращает на Старт. Улика и Допрос усиливают след. Засада пугает и запоминается жертвой. Карты говорят — слушай их.' },
  { t: 'МОРАЛЬ', d: 'Эти карты меняют судьбу. Совесть, Месть, Манипуляция, Правда — некоторые меняют даже роль: мирный может стать убийцей, шериф — продажным копом. В начале игры у тебя одна карта, на Старте выбираешь новую из трёх. Наведи — карта перевернётся и расскажет о себе. Сыграть можно одну за ход.' },
  { t: 'СКИНЫ И СЕТЫ', d: 'Клетки с оружием разбросаны по полю. Купил клинок — сила в дуэлях растёт. Встал на чужой клинок — плати аренду владельцу. Собери сет одного цвета — получи бонусы к силе и защите. Хороший арсенал выигрывает дуэли, но богач — всегда цель.' },
  { t: 'ВРЕМЯ СУТОК', d: 'Город живёт: утро, день, вечер и ночь. Каждое время даёт бонусы ролям: ночью убийца сильнее и тише, днём шериф зорче. Следи за часами и значком времени в шапке — время здесь тоже оружие.' },
  { t: 'МОНЕТЫ', d: 'Проход Старта — двести монет и доход. Больница лечит усталость и страх за пятьдесят, психолог снимает страх за тридцать, спортзал заряжает адреналином за сорок. Ошибка в обвинении — монеты сгорают в ноль. Жадность убивает не хуже клинка.' }
];
function probeVid(path) {
  return new Promise(res => { const el = document.createElement('video'); el.onloadeddata = () => res(true); el.onerror = () => res(false); el.src = path; el.load(); });
}
function ruleTts(text) {
  try {
    const cb = document.getElementById('voiceEnabled');
    if (cb && !cb.checked) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ru-RU';
    if (MMSET.voiceSrc === 'family') { u.rate = 1; u.pitch = 1; } else { u.rate = .85; u.pitch = .6; }
    u.volume = MMSET.voice / 100;
    speechSynthesis.speak(u);
  } catch (e) {}
}
let ruleAudio = null, rulePopupIdx = -1, neonFile = null, introTheme = null;
function stopRuleVoice() { if (ruleAudio) { ruleAudio.pause(); ruleAudio.currentTime = 0; ruleAudio = null; } if (window.speechSynthesis) speechSynthesis.cancel(); }
function voiceRule(i, text) {
  stopRuleVoice();
  const a = new Audio('snd/rules/' + i + '.mp3');
  let done = false;
  a.oncanplaythrough = () => { if (done) return; done = true; ruleAudio = a; a.volume = .95; a.play().catch(() => {}); };
  a.onerror = () => { if (done) return; done = true; ruleTts(text); };
  a.load();
}
function neonFileStart() {
  neonFileStop();
  const a = new Audio('snd/ui/neon.mp3');
  a.loop = true; a.volume = MMSET.neon / 100;
  a.oncanplaythrough = () => { if (neonFile === a) a.play().catch(() => {}); };
  a.onerror = () => {};
  a.load();
  neonFile = a;
}
function neonFileStop() { if (neonFile) { neonFile.pause(); neonFile = null; } }
function introThemeStart() {
  if (introTheme) return;
  const a = new Audio('snd/ui/intro.mp3');
  introTheme = a; a.volume = .9;
  a.play().catch(() => {});
}
function introThemeStop() { if (introTheme) { introTheme.pause(); introTheme = null; } }
async function hoodImg() {
  const cands = ['img/voice/voice.png', 'img/voice/hooded.png', 'img/voice/1.png'];
  for (const c of cands) { const im = await imageCache.get(c); if (im) return c; }
  return null;
}
function showRulePopup(i) {
  let p = document.getElementById('rulePopup');
  if (!p) { p = document.createElement('div'); p.id = 'rulePopup'; document.body.appendChild(p); }
  const r = RULE_DATA[i];
  p.innerHTML = '<div class="rp-shine"></div><div class="rp-body">' +
    '<div class="rp-left"><div class="rp-voice" id="rpVoice">🕵️</div><div class="rp-media" id="rpMedia">место под картинку / видео</div></div>' +
    '<div class="rp-right"><div class="rp-title">' + r.t + '</div><div class="rp-text">' + r.d + '</div></div></div>';
  p.classList.add('on');
  hoodImg().then(src => { if (src) { const box = document.getElementById('rpVoice'); if (box) box.innerHTML = '<img src="' + src + '">'; } });
  (async () => {
    const box = document.getElementById('rpMedia'); if (!box) return;
    if (await probeVid('img/rules/' + i + '.mp4')) { box.innerHTML = '<video src="img/rules/' + i + '.mp4" muted loop autoplay playsinline></video>'; return; }
    const im = await imageCache.get('img/rules/' + i + '.png');
    if (im) box.innerHTML = '<img src="img/rules/' + i + '.png">';
  })();
  voiceRule(i, r.d);
}
function hideRulePopup() { if (rulePopupIdx === -1) return; rulePopupIdx = -1; const p = document.getElementById('rulePopup'); if (p) p.classList.remove('on'); stopRuleVoice(); }
function rulesVoicePlate() {
  if (document.getElementById('rulesVoicePlate')) return;
  const pl = document.createElement('div');
  pl.id = 'rulesVoicePlate';
  pl.innerHTML = '<div class="rvp-img">🕵️</div><div><div class="rvp-name">ГОЛОС УЛИЦ</div><div class="rvp-txt">Здравствуй… Я — Голос Улиц. Я вижу всё в этом городе и помню всех. Наведи курсор на карточки законов — и я расскажу тебе всё. Но помни: у стен есть уши.</div></div>';
  document.body.appendChild(pl);
  hoodImg().then(src => { if (src) { const b = pl.querySelector('.rvp-img'); if (b) b.innerHTML = '<img src="' + src + '">'; } });
  const a = new Audio('snd/rules/voice_hello.mp3');
  let done = false;
  a.oncanplaythrough = () => { if (done) return; done = true; a.volume = .95; a.play().catch(() => {}); };
  a.onerror = () => { if (done) return; done = true; ruleTts(pl.querySelector('.rvp-txt').textContent); };
  a.load();
}
function showRulesScreen() {
  if (document.getElementById('rulesScreen')) return;
  const r = document.createElement('div');
  r.id = 'rulesScreen';
  r.innerHTML = '<div class="rules-wrap"><div class="rules-title">MURDER MONOPOLY</div>' +
    '<div class="rules-sub">НУАР • ROBLOX MM2 • ПРАВИЛА ГОРОДА</div><div class="rules-grid">' +
    RULE_DATA.map((rd, i) => '<div class="rule-card"><div class="rule-head"><span class="rule-ico">' + ['🎯', '🎭', '🎲', '', '🃏', '🎴', '🗡', '', '💰'][i] + '</span>' + rd.t + '</div><p>' + rd.d + '</p></div>').join('') +
    '</div><div class="rules-btn-row"><button id="rulesGoBtn">🎬 К ИГРЕ</button></div>' +
    '<div class="rules-note">Город наблюдает за тобой. Играй осторожно…</div></div>';
  document.body.appendChild(r);
  document.getElementById('setupScreen').style.display = 'none';
  r.querySelector('#rulesGoBtn').onclick = () => {
    r.remove();
    document.getElementById('setupScreen').style.display = 'flex';
    neonFileStop(); introThemeStop(); stopRuleVoice(); hideRulePopup();
    const pl = document.getElementById('rulesVoicePlate'); if (pl) pl.remove();
    const fab = document.getElementById('settingsFab'); if (fab) fab.style.display = 'none';
  };
  // фон-медиа
  if (MMSET.bgvideo) {
    probeVid('img/ui/rules_bg.mp4').then(ok => {
      if (ok) { const v = document.createElement('video'); v.src = 'img/ui/rules_bg.mp4'; v.muted = true; v.loop = true; v.autoplay = true; v.playsInline = true; v.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;object-fit:cover;z-index:-1;opacity:.35;'; r.appendChild(v); v.play().catch(() => {}); }
      else imageCache.get('img/ui/rules_bg.png').then(im => { if (im) r.style.backgroundImage = "url('img/ui/rules_bg.png')"; });
    });
  }
  rulesVoicePlate();
  applyRuleIcons();
  neonFileStart();
  setTimeout(() => { if (document.getElementById('rulesScreen')) introThemeStart(); }, 2000);   // фон правил
  setTimeout(() => { if (document.getElementById('rulesScreen') && window.musicPlayer) musicPlayer.start(); }, 2500); // музыка плавно
  const fab = document.getElementById('settingsFab'); if (fab) fab.style.display = 'flex';
}
// === ГЕЙТ + ЗАСТАВКА ===
function showGate() {
  const g = document.createElement('div');
  g.id = 'gateScreen';
  g.innerHTML = '<div class="gate-mm">MM</div><div class="gate-tag">MURDER MONOPOLY</div><button id="gateBtn">▶ Войти в город</button>';
  document.body.prepend(g);
  g.querySelector('#gateBtn').onclick = () => {
    window.MM_GATE_DONE = true;
    try { window.MM_AC = window.MM_AC || new (window.AudioContext || window.webkitAudioContext)(); window.MM_AC.resume(); } catch (e) {}
    g.remove();
    showIntro();
  };
}
function showIntro() {
  if (MMSET.gate && !window.MM_GATE_DONE) { showGate(); return; }
  if (!MMSET.intro) { showRulesScreen(); return; }
  if (document.getElementById('introScreen')) return;
  const wrap = document.createElement('div');
  wrap.id = 'introScreen';
  wrap.innerHTML = '<video id="introVideo" autoplay playsinline style="width:100%;height:100%;object-fit:cover"></video>' +
    '<div class="intro-ph" id="introPh" style="display:none"><div class="mm">MM</div><div class="tag">MURDER MONOPOLY</div><div class="path">🎬 видео: img/ui/intro.mp4</div></div>' +
    '<button class="intro-btn mute">🔊</button><button class="intro-btn skip">Пропустить ▶▶</button>';
  document.body.prepend(wrap);
  const v = wrap.querySelector('#introVideo');
  const ph = wrap.querySelector('#introPh');
  let killed = false, timer = setTimeout(kill, 30000);
  function kill() { if (killed) return; killed = true; clearTimeout(timer); wrap.remove(); showRulesScreen(); }
  v.onerror = () => { v.style.display = 'none'; ph.style.display = 'flex'; clearTimeout(timer); setTimeout(kill, 8000); };
  v.onended = kill;
  v.src = 'img/ui/intro.mp4';
  v.muted = false; // звук самого видео — да; музыка/фон — только в правилах
  v.play().catch(() => { v.muted = true; v.play().catch(() => {}); });
  wrap.querySelector('.skip').onclick = kill;
  wrap.querySelector('.mute').onclick = function () { v.muted = !v.muted; this.textContent = v.muted ? '🔇' : '🔊'; };
}
// === РЕЖИМЫ МЕНЮ + РОЛИ + QR ===
let QR_MODE = false;
window.QR_HOLD = false;
function showQrReveal() {
  if (!S) return;
  window.QR_HOLD = true;
  let html = '<h2>📱 Отсканируйте свои роли</h2><p style="font-size:12px;opacity:.7">Каждый игрок сканирует СВОЙ QR — роль откроется на телефоне секретно. Не показывайте экран другим!</p><div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center">';
  S.players.forEach(p => {
    const data = encodeURIComponent('🎭 MURDER MONOPOLY | ' + p.name + ' | РОЛЬ: ' + ROLE_LABELS[p.role] + ' | Секретно! Не показывай другим.');
    html += '<div style="background:#fff;padding:6px;border-radius:8px;color:#000;font-size:11px;font-weight:700;text-align:center"><img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=' + data + '" style="width:120px;height:120px;display:block"><div>' + p.name + '</div></div>';
  });
  html += '</div><button data-v="ok">✅ Все получили роли — начать!</button>';
  showModal(html).then(() => { window.QR_HOLD = false; updateUI(); if (S.players[S.cur].isBot) setTimeout(botTurn, 800); });
}
const ROLE_HINTS = {
  sheriff: 'Ты вычисляешь убийцу и можешь обвинять. Финальная дуэль — на тебе.',
  murderer: 'Ты УБИЙЦА! Не попадись: сей подозрения на других и зарабатывай.',
  civilian: 'Ты мирный житель. Выживай, зарабатывай и помогай следствию.',
  cop: 'Ты продажный коп. Своя игра: деньги, власть и чужие секреты.'
};
async function revealRolesLocal() {
  const humans = S.players.filter(p => !p.isBot);
  if (!humans.length) return;
  window.QR_HOLD = true;
  for (const p of humans) {
    await showModal('<h2>🤫 ' + p.name + '</h2><p>Сейчас откроется твоя СЕКРЕТНАЯ роль. Убедись, что никто не подглядывает!</p><button data-v="ready">👀 Показать роль</button>');
    await showModal('<h1 style="color:' + (p.role === ROLES.MURDERER ? '#ff1744' : p.role === ROLES.SHERIFF ? '#4fc3f7' : '#aed581') + '">' + ROLE_LABELS[p.role] + '</h1><p>' + (ROLE_HINTS[p.role] || '') + '</p><button data-v="ok">🙈 Скрыть и передать устройство</button>');
  }
  window.QR_HOLD = false;
  updateUI();
  if (S.players[S.cur].isBot && !S.isOver) setTimeout(botTurn, 800);
}
// === НАСТРОЙКИ ===
function openSettings() {
  showModal('<h2>⚙️ Настройки</h2>' +
    '<div class="set-row"><span>🚪 Гейт «Войти в город»</span><input type="checkbox" id="setGate"></div>' +
    '<div class="set-row"><span>🎬 Заставка</span><input type="checkbox" id="setIntro"></div>' +
    '<div class="set-row"><span>🎙 Озвучка</span><input type="checkbox" id="setTts"></div>' +
    '<div class="set-row"><span>🗣 Голос озвучки</span><select id="setVoiceSrc"><option value="robot">🤖 Робот</option><option value="family">👨‍👩‍👧 МамПапиАлиса</option></select></div>' +
    '<div class="set-row"><span>🔔 Звуки интерфейса</span><input type="checkbox" id="setSfx"></div>' +
    '<div class="set-row"><span>🌆 Видео-фоны</span><input type="checkbox" id="setBg"></div>' +
    '<div class="set-row"><span>💾 Автосейв каждый раунд</span><input type="checkbox" id="setSave"></div>' +
    '<div class="set-row"><span>⚡ Быстрые боты</span><input type="checkbox" id="setFast"></div>' +
    '<div class="set-row"><span>🎵 Музыка</span><input type="range" id="setMusic" min="0" max="100"></div>' +
    '<div class="set-row"><span>💡 Треск неона</span><input type="range" id="setNeon" min="0" max="100"></div>' +
    '<div class="set-row"><span>🗣 Громкость голоса</span><input type="range" id="setVoice" min="0" max="100"></div>' +
    '<div class="set-row"><span>🔠 Размер текста</span><input type="range" id="setText" min="80" max="130"></div>' +
    '<button data-v="ok">✅ Готово</button>');
  const q = id => document.getElementById(id);
  q('setGate').checked = MMSET.gate; q('setIntro').checked = MMSET.intro; q('setTts').checked = MMSET.tts;
  q('setVoiceSrc').value = MMSET.voiceSrc;
  q('setSfx').checked = MMSET.sfx; q('setBg').checked = MMSET.bgvideo; q('setSave').checked = MMSET.autosave; q('setFast').checked = MMSET.fastbots;
  q('setMusic').value = MMSET.music; q('setNeon').value = MMSET.neon; q('setVoice').value = MMSET.voice; q('setText').value = MMSET.text;
  q('setGate').onchange = e => { MMSET.gate = e.target.checked; saveSet(); };
  q('setIntro').onchange = e => { MMSET.intro = e.target.checked; saveSet(); };
  q('setTts').onchange = e => { MMSET.tts = e.target.checked; const c = document.getElementById('voiceEnabled'); if (c) c.checked = MMSET.tts; if (S) S.voiceEnabled = MMSET.tts; saveSet(); };
  q('setVoiceSrc').onchange = e => { MMSET.voiceSrc = e.target.value; saveSet(); };
  q('setSfx').onchange = e => { MMSET.sfx = e.target.checked; saveSet(); };
  q('setBg').onchange = e => { MMSET.bgvideo = e.target.checked; saveSet(); };
  q('setSave').onchange = e => { MMSET.autosave = e.target.checked; saveSet(); };
  q('setFast').onchange = e => { MMSET.fastbots = e.target.checked; saveSet(); };
  q('setMusic').oninput = e => { MMSET.music = +e.target.value; if (window.musicPlayer) { musicPlayer.vol = MMSET.music / 100; if (musicPlayer.audio) musicPlayer.audio.volume = musicPlayer.vol; } saveSet(); };
  q('setNeon').oninput = e => { MMSET.neon = +e.target.value; if (neonFile) neonFile.volume = MMSET.neon / 100; saveSet(); };
  q('setVoice').oninput = e => { MMSET.voice = +e.target.value; saveSet(); };
  q('setText').oninput = e => { MMSET.text = +e.target.value; document.body.style.zoom = MMSET.text / 100; saveSet(); };
}
// === ГЛОБАЛЬНЫЕ СЛУШАТЕЛИ (наведения) ===
document.addEventListener('mouseover', e => {
  const t = e.target;
  // кнопки — hover.mp3
  const b = t.closest('button, .hbtn');
  if (b) { if (b !== lastBtnHover) { lastBtnHover = b; if (voiceOn()) soundCache.play('snd/effects/hover.mp3', .3); } return; }
  lastBtnHover = null;
  // мораль — переворот + шшух + голос
  const card = t.closest('.mor-card');
  if (card) {
    const inner = card.querySelector('.mor-inner');
    if (inner) inner.style.transform = 'rotateY(180deg)';
    if (tipEl) tipEl.classList.remove('on');
    if (card !== lastFlipCard) {
      lastFlipCard = card;
      if (voiceOn()) flipSwish(0.35);
      const p = S && S.players[S.cur];
      const c = p && p.morals[+card.dataset.mi];
      if (c && S && S.voiceEnabled) {
        const a = new Audio('snd/morals/' + c.id + '.mp3');
        let done = false;
        a.oncanplaythrough = () => { if (done) return; done = true; a.volume = .9; a.play().catch(() => {}); };
        a.onerror = () => { if (done) return; done = true; speakMor(c); };
        a.load();
      }
    }
    return;
  }
  if (lastFlipCard && !t.closest('.mor-hand')) lastFlipCard = null;
  // стаки
  const st = t.closest('.stack');
  if (st) { const m = (st.getAttribute('onclick') || '').match(/useChip\('(\w+)'\)/); if (m) showStackTip(m[1], st); softHover(660); return; }
  // клетки
  const cell = t.closest('.cell');
  if (cell && !cell.classList.contains('center-area') && cell.dataset.idx != null) { showCellTip(+cell.dataset.idx, cell); softHover(760); return; }
  // уход — скрыть/стоп
  clearTimeout(tipHideT);
  tipHideT = setTimeout(() => { if (tipEl) tipEl.classList.remove('on'); }, 250);
  stopAmbient(); stopStackSnd();
});
document.addEventListener('mouseout', e => {
  const card = e.target.closest('.mor-card');
  if (card && !card.contains(e.relatedTarget)) {
    const inner = card.querySelector('.mor-inner');
    if (inner) inner.style.transform = '';
    lastFlipCard = null;
  }
});
document.addEventListener('click', () => { if (ambientAudio) stopAmbient(); }, true);
window.addEventListener('blur', () => { stopAmbient(); stopStackSnd(); });
// статус-подсказки
document.addEventListener('DOMContentLoaded', () => {
  const ps = document.getElementById('playerStats');
  if (!ps) return;
  const hideStat = () => { clearTimeout(tipHideT); tipHideT = setTimeout(() => { if (tipEl) tipEl.classList.remove('on'); }, 200); };
  ps.addEventListener('mouseover', e => {
    const item = e.target.closest('.stat-item');
    if (!item) { hideStat(); return; }
    const idx = [...ps.querySelectorAll('.stat-item')].indexOf(item);
    const info = STAT_LORE[idx];
    if (!info) return;
    const tip = ensureTip();
    clearTimeout(tipHideT);
    stopAmbient(); stopStackSnd();
    tip.classList.remove('big');
    tip.dataset.tipKind = 'stat';
    tip.innerHTML = '<div class="tip-head">' + info.name + '</div><div class="tip-desc" style="font-size:12px;line-height:1.5">' + info.desc + '</div>';
    const r = item.getBoundingClientRect();
    tip.style.left = Math.max(8, Math.min(window.innerWidth - 300, r.left - 290)) + 'px';
    tip.style.top = Math.max(8, r.top - 30) + 'px';
    tip.classList.add('on');
  });
  ps.addEventListener('mouseleave', hideStat);
});
// === ИНИЦИАЛИЗАЦИЯ ===
document.addEventListener('DOMContentLoaded', () => {
  soundCache = new U.SoundCache();
  imageCache = new U.ImageCache();
  const pc = document.getElementById('playerCount');
  if (pc) { pc.addEventListener('change', updatePlayerNames); updatePlayerNames(); }
  const r = document.getElementById('musicVolume');
  if (r) r.addEventListener('input', () => { musicPlayer.vol = (+r.value) / 100; if (musicPlayer.audio) musicPlayer.audio.volume = musicPlayer.vol; const lbl = document.getElementById('volumeLabel'); if (lbl) lbl.textContent = r.value + '%'; });
  const inp = document.getElementById('bgFile');
  if (inp) inp.addEventListener('change', () => {
    const f = inp.files && inp.files[0];
    if (!f) return;
    const holder = document.getElementById('centerBg');
    if (!holder) { alert('Сначала начни игру, потом выбирай фон 😉'); return; }
    const url = URL.createObjectURL(f);
    holder.innerHTML = '';
    if (f.type.startsWith('video')) { const v = document.createElement('video'); v.src = url; v.muted = true; v.loop = true; v.autoplay = true; v.playsInline = true; holder.appendChild(v); v.play().catch(() => {}); }
    else { const im = document.createElement('img'); im.src = url; holder.appendChild(im); }
    log('🌆 Фон центра поля обновлён!');
  });
  const hr = document.querySelector('.header-right');
  if (hr) {
    const g = document.createElement('button'); g.id = 'settingsGearIn'; g.className = 'hbtn'; g.title = 'Настройки'; g.textContent = '⚙️'; g.onclick = openSettings; hr.insertBefore(g, hr.firstChild);
    const b1 = document.createElement('button'); b1.className = 'hbtn'; b1.title = 'Сохранить игру'; b1.textContent = '💾'; b1.onclick = saveGameLocal; hr.appendChild(b1);
    const b2 = document.createElement('button'); b2.className = 'hbtn'; b2.title = 'Код сохранения (перенос)'; b2.textContent = '📤'; b2.onclick = exportCode; hr.appendChild(b2);
  }
  const sa = document.querySelector('.setup-actions');
  if (sa) {
    const oldBtn = sa.querySelector('.btn-primary');
    if (oldBtn) oldBtn.style.display = 'none';
    const box = document.createElement('div');
    box.className = 'mode-buttons';
    box.innerHTML =
      '<button class="hbtn-big" id="modeLocal">🎲 Локальная игра<span class="mb-sub">все за одним экраном</span></button>' +
      '<button class="hbtn-big" id="modeQr">📱 Игра с QR<span class="mb-sub">ТВ, ПК + смартфон</span></button>' +
      '<button class="hbtn-big" id="modeNet">🌐 Игра по сети<span class="mb-sub">создать комнату</span></button>';
    sa.parentNode.insertBefore(box, sa);
    const qrBox = document.getElementById('qrEnabled');
    box.querySelector('#modeLocal').onclick = () => { QR_MODE = !!(qrBox && qrBox.checked); startGame(); if (QR_MODE) showQrReveal(); else revealRolesLocal(); };
    box.querySelector('#modeQr').onclick = () => { if (qrBox) qrBox.checked = true; QR_MODE = true; startGame(); showQrReveal(); };
    box.querySelector('#modeNet').onclick = () => showModal('<h2>🌐 Игра по сети</h2><p>Чтобы устройства синхронизировались, нужен сервер — это отдельный большой шаг. А пока — режим с QR: смартфоны участвуют как вторые экраны с секретными ролями!</p><button data-v="ok">Понятно</button>');
    if (localStorage.getItem('mm_save')) { const c1 = document.createElement('button'); c1.className = 'btn-secondary'; c1.textContent = '📂 Продолжить игру'; c1.onclick = loadGameLocal; sa.appendChild(c1); }
    const c2 = document.createElement('button'); c2.className = 'btn-secondary'; c2.textContent = '📥 Из кода';
    c2.onclick = () => showModal('<h2>📥 Вставь код сохранения</h2><textarea id="importArea" style="width:100%;height:120px;background:#0d1226;color:#eee;border:1px solid #d4af37;border-radius:8px;padding:8px;font-size:11px"></textarea><button data-v="ok">Загрузить</button>').then(v => { if (v === 'ok') { try { importCode(document.getElementById('importArea').value); } catch (e) { alert('❌ Код повреждён!'); } } });
    sa.appendChild(c2);
    const rb = document.createElement('button'); rb.id = 'rulesBtn'; rb.className = 'btn-secondary'; rb.textContent = '📜 Правила'; rb.onclick = showRulesScreen; sa.appendChild(rb);
  }
  // плавающая шестерёнка (для правил)
  if (!document.getElementById('settingsFab')) {
    const b = document.createElement('button');
    b.id = 'settingsFab'; b.title = 'Настройки'; b.textContent = '⚙️';
    b.onclick = openSettings;
    b.style.display = 'none';
    document.body.appendChild(b);
  }
  // часы нуар
  const hc = document.querySelector('.header-center');
  if (hc && !document.getElementById('noirClock')) {
    const c = document.createElement('div');
    c.id = 'noirClock'; c.className = 'time-display';
    hc.appendChild(c);
    const tick = () => { const d = new Date(); c.innerHTML = '🕰 ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + '<span class="clk-ss">:' + String(d.getSeconds()).padStart(2, '0') + '</span>'; };
    tick(); setInterval(tick, 1000);
  }
  // 3D-кубик
  const d = document.getElementById('diceDisplay');
  if (d && !document.getElementById('diceCube')) {
    d.innerHTML = '<div class="dice-scene"><div class="dice-cube" id="diceCube">' +
      '<div class="dice-face" style="transform:rotateY(0deg) translateZ(34px)">⚀</div>' +
      '<div class="dice-face" style="transform:rotateY(180deg) translateZ(34px)">⚁</div>' +
      '<div class="dice-face" style="transform:rotateY(90deg) translateZ(34px)">⚂</div>' +
      '<div class="dice-face" style="transform:rotateY(-90deg) translateZ(34px)">⚃</div>' +
      '<div class="dice-face" style="transform:rotateX(90deg) translateZ(34px)">⚄</div>' +
      '<div class="dice-face" style="transform:rotateX(-90deg) translateZ(34px)">⚅</div>' +
      '</div></div>';
  }
  // применение настроек
  if (window.musicPlayer) musicPlayer.vol = MMSET.music / 100;
  const vc = document.getElementById('voiceEnabled'); if (vc) vc.checked = MMSET.tts;
  document.body.style.zoom = MMSET.text / 100;
  applyAutoBackground();
  applyAutoLogo();
  // СТАРТ ЦЕПОЧКИ: гейт → заставка → правила
  showIntro();
});
window.startGame = startGame;
// === КОНЕЦ GAME.JS ===
// ============================================
// ДОПОЛНЕНИЕ v62 — РАЗБЛОКИРОВКА МУЗЫКИ ПЕРВЫМ КЛИКОМ
// ============================================
document.addEventListener('click', function mmUnlockMusic() {
  if (!window.musicPlayer || !musicPlayer.list.length) return;
  const mp = musicPlayer;
  if (!mp.audio) {
    mp.audio = new Audio(mp.list[0]);
    mp.audio.volume = 0; // тихая разблокировка внутри жеста
    mp.audio.play().then(() => {
      mp.audio.pause(); // во время заставки — тишина
      mp.audio.currentTime = 0;
      mp.audio.volume = (window.MMSET ? MMSET.music : 80) / 100;
    }).catch(() => {});
  }
  document.removeEventListener('click', mmUnlockMusic);
}, true);
// ============================================
// ДОПОЛНЕНИЕ v63 — МУЗЫКА ИГРАЕТ С ЗАСТАВКИ (старт с первого клика)
// ============================================
window.MM_MUSIC_OK = true; // разблокируем все старые «защиты»
const _si63 = window.showIntro;
window.showIntro = function () { _si63(); window.MM_INTRO_ACTIVE = false; }; // заставка больше не глушит музыку
document.addEventListener('click', function mmMusicFromStart() {
  if (window.musicPlayer && musicPlayer.list.length && !musicPlayer.playing) {
    musicPlayer.vol = (window.MMSET ? MMSET.music : 80) / 100;
    musicPlayer.play(); // первый клик (гейт) = жест → музыка пошла
    document.removeEventListener('click', mmMusicFromStart, true);
  }
}, true);
// ============================================
// ДОПОЛНЕНИЕ v64 — МУЗЫКА С ЗАСТАВКИ (разблокировать базовый автостарт)
// ============================================
window.MM_MUSIC_OK = true; // разблокируем обёртки v58/v59
try {
  // MM_INTRO_ACTIVE теперь ВСЕГДА false — никакие «глушилки» музыку не трогают
  Object.defineProperty(window, 'MM_INTRO_ACTIVE', { get: () => false, set: () => {}, configurable: true });
} catch (e) { window.MM_INTRO_ACTIVE = false; }
// Страховка: если первый клик прошёл, а музыка не стартовала (например, гейт выключен)
document.addEventListener('pointerdown', () => {
  setTimeout(() => {
    if (window.musicPlayer && musicPlayer.list.length && !musicPlayer.playing && musicPlayer.audio) {
      musicPlayer.audio.volume = (window.MMSET ? MMSET.music : 80) / 100;
      musicPlayer.audio.play().catch(() => {});
      musicPlayer.playing = true;
      if (musicPlayer.refreshBtn) musicPlayer.refreshBtn();
    }
  }, 400);
}, { once: true });
// ============================================
// ДОПОЛНЕНИЕ v66 — ГАЛОЧКИ В ОДНУ СТРОЙКУ (через DOM, надёжно)
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  const boxes = ['botsEnabled', 'qrEnabled', 'voiceEnabled']
    .map(id => document.getElementById(id))
    .filter(Boolean)
    .map(inp => inp.closest('.option-group'))
    .filter(Boolean);
  if (boxes.length < 2) return;
  const parent = boxes[0].parentNode;
  const anchor = boxes[boxes.length - 1].nextElementSibling;
  const row = document.createElement('div');
  row.id = 'checksRow';
  row.style.cssText = 'display:flex;gap:26px;align-items:center;flex-wrap:wrap;margin:12px 0;';
  parent.insertBefore(row, anchor);
  boxes.forEach(b => {
    b.style.cssText = 'display:flex;align-items:center;gap:8px;margin:0;';
    const lbl = b.querySelector('label');
    if (lbl) { lbl.style.margin = '0'; lbl.style.whiteSpace = 'nowrap'; }
    row.appendChild(b);
  });
});
// ============================================
// ДОПОЛНЕНИЕ v69 — ЕДИНЫЙ ЛОГО img/ui/logo.png ВЕЗДЕ + ШАПКА ПО ЛИНИИ
// ============================================
function applyLogoEverywhere() {
  imageCache.get('img/ui/logo.png').then(im => {
    if (!im) return;
    document.querySelectorAll('.mini-logo, .main-logo').forEach(el => { el.src = 'img/ui/logo.png'; el.style.display = ''; });
    const gm = document.querySelector('#gateScreen .gate-mm');
    if (gm && !gm.dataset.logo) { gm.dataset.logo = '1'; gm.innerHTML = '<img src="img/ui/logo.png" class="gate-logo" alt="MM">'; }
  });
}
const _sg69 = window.showGate;
window.showGate = function () { _sg69(); applyLogoEverywhere(); };
document.addEventListener('DOMContentLoaded', () => {
  const hl = document.querySelector('.header-left');
  if (hl && !hl.querySelector('img.mini-logo')) {
    const im = document.createElement('img');
    im.className = 'mini-logo'; im.alt = 'MM'; im.style.display = 'none';
    hl.prepend(im);
  }
  applyLogoEverywhere();
});
// ============================================
// ДОПОЛНЕНИЕ v70 — ФИНАЛЬНЫЙ ПАКЕТ: МУЗЫКА САМА + ЛОГО ВЕЗДЕ + ГАЛОЧКИ В РЯД
// ============================================
// 1) Музыка стартует с первого клика (гейт) и больше НИКОМ не блокируется
window.MM_MUSIC_OK = true;
try { Object.defineProperty(window, 'MM_INTRO_ACTIVE', { get: () => false, set: () => {}, configurable: true }); } catch (e) { window.MM_INTRO_ACTIVE = false; }
document.addEventListener('pointerdown', () => {
  setTimeout(() => {
    if (window.musicPlayer && musicPlayer.list.length && !musicPlayer.playing) {
      musicPlayer.vol = (window.MMSET ? MMSET.music : 80) / 100;
      if (musicPlayer.audio) musicPlayer.audio.volume = musicPlayer.vol;
      musicPlayer.play();
    }
  }, 300);
}, { once: true });
// 2) Единый логотип img/ui/logo.png: гейт + шапка + меню
function applyLogoEverywhere() {
  imageCache.get('img/ui/logo.png').then(im => {
    if (!im) return;
    document.querySelectorAll('.mini-logo, .main-logo').forEach(el => { el.src = 'img/ui/logo.png'; el.style.display = ''; });
    const gm = document.querySelector('#gateScreen .gate-mm');
    if (gm && !gm.dataset.logo) { gm.dataset.logo = '1'; gm.innerHTML = '<img src="img/ui/logo.png" class="gate-logo" alt="MM">'; }
  });
}
const _sg70 = window.showGate;
window.showGate = function () { _sg70(); applyLogoEverywhere(); };
// 3) Галочки «Боты / QR-роли / Озвучка» — в одну стройку
document.addEventListener('DOMContentLoaded', () => {
  const hl = document.querySelector('.header-left');
  if (hl && !hl.querySelector('img.mini-logo')) {
    const im = document.createElement('img');
    im.className = 'mini-logo'; im.alt = 'MM'; im.style.display = 'none';
    hl.prepend(im);
  }
  applyLogoEverywhere();
  const boxes = ['botsEnabled', 'qrEnabled', 'voiceEnabled']
    .map(id => document.getElementById(id)).filter(Boolean)
    .map(inp => inp.closest('.option-group')).filter(Boolean);
  if (boxes.length >= 2) {
    const parent = boxes[0].parentNode;
    const anchor = boxes[boxes.length - 1].nextElementSibling;
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:26px;align-items:center;flex-wrap:wrap;margin:12px 0;';
    parent.insertBefore(row, anchor);
    boxes.forEach(b => {
      b.style.cssText = 'display:flex;align-items:center;gap:8px;margin:0;';
      const lbl = b.querySelector('label');
      if (lbl) { lbl.style.margin = '0'; lbl.style.whiteSpace = 'nowrap'; }
      row.appendChild(b);
    });
  }
});
// ============================================
// ДОПОЛНЕНИЕ v75 — ФИНАЛЬНАЯ КОМПОЗИЦИЯ: РУКА, ДОСЬЕ, ГОЛОС СПРАВА ×2
// ============================================
// Старые рендеры — в офф (рука теперь своя)
function renderMorHand() {}
function renderMiniMap() {}
function renderCardCounts() { const el = document.getElementById('cardCounts'); if (el) el.remove(); }
function rebuildFreePanel75(box) {
  box.dataset.v75 = '1';
  box.innerHTML = '<h3 data-fixed="1">🎴 Рука: <span id="handName"></span></h3>' +
    '<div class="hand-sec"><div class="hand-title">🗡 СКИНЫ</div><div class="hand-row" id="handSkins"></div></div>' +
    '<div class="hand-sec"><div class="hand-title">🃏 КАРТЫ ДЕЙСТВИЙ</div><div class="hand-row" id="handChips"></div></div>' +
    '<div class="hand-sec"><div class="hand-title">🎭 МОРАЛЬ</div><div class="hand-row" id="morHand"></div></div>';
}
const _efp75 = window.ensureFreePanel;
window.ensureFreePanel = function () {
  const box = _efp75();
  if (box && !box.dataset.v75) rebuildFreePanel75(box);
  return box;
};
function handCardHTML(kind, key, i, rot, backCls, frontHTML) {
  return '<div class="hcard" data-kind="' + kind + '" data-key="' + key + '" data-i="' + i + '" style="--rot:' + rot + 'deg">' +
    '<div class="hcard-inner"><div class="hcard-back ' + backCls + '"></div><div class="hcard-front">' + frontHTML + '</div></div></div>';
}
function renderHand() {
  if (!S) return;
  const p = S.players[S.cur];
  const hn = document.getElementById('handName'); if (hn) hn.textContent = p.name;
  const sk = document.getElementById('handSkins');
  if (sk) {
    sk.innerHTML = p.skins.length ? p.skins.map((id, i) => {
      const skin = (window.SKINS && SKINS[id]) || {};
      const img = window.getSkinImage ? getSkinImage(id, skin.category) : null;
      const rot = (i - (p.skins.length - 1) / 2) * 6;
      return handCardHTML('skin', id, i, rot, 'back-skin', (img ? '<img class="hf-img" src="' + img + '">' : '<div class="hf-emo">🗡</div>') + '<div class="hf-name">' + (skin.name || id) + '</div>');
    }).join('') : '<div class="hand-empty">пока нет</div>';
  }
  const ch = document.getElementById('handChips');
  if (ch) {
    const types = ['witness', 'alibi', 'ulika', 'dopros', 'zasada'];
    const emo = { witness: '👁', alibi: '⏳', ulika: '🔍', dopros: '🎤', zasada: '💣' };
    const nm = { witness: 'Свидетель', alibi: 'Алиби', ulika: 'Улика', dopros: 'Допрос', zasada: 'Засада' };
    const owned = types.filter(t => p.chips[t] > 0);
    ch.innerHTML = owned.length ? owned.map((t, i) => {
      const rot = (i - (owned.length - 1) / 2) * 6;
      return handCardHTML('chip', t, i, rot, 'back-chip', '<img class="hf-img hf-chipimg" data-t="' + t + '" style="display:none"><div class="hf-emo">' + emo[t] + '</div><div class="hf-name">' + nm[t] + '</div><span class="hand-cnt">' + p.chips[t] + '</span>');
    }).join('') : '<div class="hand-empty">пока нет</div>';
    owned.forEach(t => imageCache.get('img/chips/' + t + '.png').then(im => {
      if (im) document.querySelectorAll('.hf-chipimg[data-t="' + t + '"]').forEach(el => { el.src = 'img/chips/' + t + '.png'; el.style.display = 'block'; if (el.nextElementSibling) el.nextElementSibling.style.display = 'none'; });
    }));
  }
  const mh = document.getElementById('morHand');
  if (mh) {
    if (p.isBot) { mh.innerHTML = '<div class="hand-empty">🤖 у бота ' + p.morals.length + '</div>'; return; }
    if (!p.morals.length) { mh.innerHTML = '<div class="hand-empty">нет карт — на Старте выбор из трёх</div>'; return; }
    mh.innerHTML = p.morals.map((c, i) => {
      const rot = (i - (p.morals.length - 1) / 2) * 6;
      return handCardHTML('mor', c.id, i, rot, 'back-mor', '<img class="hf-img hf-morimg" data-mi="' + i + '" style="display:none"><div class="hf-emo">' + c.icon + '</div><div class="hf-name">' + c.name + '</div>');
    }).join('');
    p.morals.forEach((c, i) => imageCache.get('img/morals/' + c.id + '.png').then(im => {
      if (im) document.querySelectorAll('.hf-morimg[data-mi="' + i + '"]').forEach(el => { el.src = 'img/morals/' + c.id + '.png'; el.style.display = 'block'; if (el.nextElementSibling) el.nextElementSibling.style.display = 'none'; });
    }));
  }
}
// Клик: 1-й — проворот 360 и открытие; 2-й — действие. Ховер — только лифт!
document.addEventListener('click', e => {
  const hc = e.target.closest('.hcard');
  if (!hc) return;
  if (!hc.classList.contains('open')) { hc.classList.add('open'); return; }
  const kind = hc.dataset.kind;
  if (kind === 'mor') playMorCard(+hc.dataset.i);
  else if (kind === 'chip') useChip(hc.dataset.key);
  else hc.classList.remove('open');
});
// Досье в пустом блоке справа
function renderDossier() {
  if (!S) return;
  const rp = document.querySelector('.right-panel');
  if (!rp) return;
  let box = document.getElementById('dossierPanel');
  if (!box) { box = document.createElement('div'); box.id = 'dossierPanel'; box.className = 'panel'; rp.appendChild(box); }
  const p = S.players[S.cur];
  const eff = [];
  if (p.stealth > 0) eff.push('🕶 скрытность ×' + p.stealth);
  if (p.protect) eff.push('🛡 защита');
  if (p.avoid) eff.push('💰 откуп');
  if (p.double) eff.push('⚡ двойной бросок');
  if (p.blocked) eff.push('🚫 блокирован');
  if (p.muted) eff.push('🔇 нем');
  box.innerHTML = '<h3>🕵️ Досье: ' + p.name + '</h3>' +
    '<div class="dz-row"><span>Роль:</span><button id="dzRole" class="dz-btn">👁 показать</button><span id="dzRoleVal" style="display:none;color:#ffd54f;font-weight:800">' + (window.ROLE_LABELS ? ROLE_LABELS[p.role] : p.role) + '</span></div>' +
    '<div class="dz-row"><span>🧩 Сеты:</span><b>' + (p.sets.length ? p.sets.join(', ') : 'нет') + '</b></div>' +
    '<div class="dz-row"><span>✨ Эффекты:</span><b>' + (eff.length ? eff.join(' · ') : 'нет') + '</b></div>' +
    '<div class="dz-row"><span>💵 Доход на Старте:</span><b>+' + (200 + p.income) + '</b></div>';
  const b = box.querySelector('#dzRole');
  if (b) b.onclick = () => { const v = box.querySelector('#dzRoleVal'); const show = v.style.display === 'none'; v.style.display = show ? 'inline' : 'none'; b.textContent = show ? '🙈 скрыть' : '👁 показать'; };
}
const _ui75 = window.updateUI;
window.updateUI = function () { _ui75(); renderHand(); renderDossier(); };
// ============================================
// ДОПОЛНЕНИЕ v76 — РУКА КАРТАМИ (ховер-лифт, клик=360+открытие) + ДОСЬЕ
// ============================================
function renderMorHand() {}
function renderMiniMap() {}
function renderCardCounts() { const el = document.getElementById('cardCounts'); if (el) el.remove(); }
function rebuildFreePanel76(box) {
  box.dataset.v76 = '1';
  box.innerHTML = '<h3 data-fixed="1">🎴 Рука: <span id="handName"></span></h3>' +
    '<div class="hand-sec"><div class="hand-title">🗡 СКИНЫ</div><div class="hand-row" id="handSkins"></div></div>' +
    '<div class="hand-sec"><div class="hand-title">🃏 КАРТЫ ДЕЙСТВИЙ</div><div class="hand-row" id="handChips"></div></div>' +
    '<div class="hand-sec"><div class="hand-title">🎭 МОРАЛЬ</div><div class="hand-row" id="morHand"></div></div>';
}
const _efp76 = window.ensureFreePanel;
window.ensureFreePanel = function () {
  const box = _efp76();
  if (box && !box.dataset.v76) rebuildFreePanel76(box);
  return box;
};
function handCardHTML(kind, key, i, rot, backCls, frontHTML) {
  return '<div class="hcard" data-kind="' + kind + '" data-key="' + key + '" data-i="' + i + '" style="--rot:' + rot + 'deg">' +
    '<div class="hcard-inner"><div class="hcard-back ' + backCls + '"></div><div class="hcard-front">' + frontHTML + '</div></div></div>';
}
function renderHand() {
  if (!S) return;
  const p = S.players[S.cur];
  const hn = document.getElementById('handName'); if (hn) hn.textContent = p.name;
  const sk = document.getElementById('handSkins');
  if (sk) {
    sk.innerHTML = p.skins.length ? p.skins.map((id, i) => {
      const skin = (window.SKINS && SKINS[id]) || {};
      const img = window.getSkinImage ? getSkinImage(id, skin.category) : null;
      const rot = (i - (p.skins.length - 1) / 2) * 6;
      return handCardHTML('skin', id, i, rot, 'back-skin', (img ? '<img class="hf-img" src="' + img + '">' : '<div class="hf-emo">🗡</div>') + '<div class="hf-name">' + (skin.name || id) + '</div>');
    }).join('') : '<div class="hand-empty">пока нет</div>';
  }
  const ch = document.getElementById('handChips');
  if (ch) {
    const types = ['witness', 'alibi', 'ulika', 'dopros', 'zasada'];
    const emo = { witness: '👁', alibi: '⏳', ulika: '🔍', dopros: '🎤', zasada: '💣' };
    const nm = { witness: 'Свидетель', alibi: 'Алиби', ulika: 'Улика', dopros: 'Допрос', zasada: 'Засада' };
    const owned = types.filter(t => p.chips[t] > 0);
    ch.innerHTML = owned.length ? owned.map((t, i) => {
      const rot = (i - (owned.length - 1) / 2) * 6;
      return handCardHTML('chip', t, i, rot, 'back-chip', '<img class="hf-img hf-chipimg" data-t="' + t + '" style="display:none"><div class="hf-emo">' + emo[t] + '</div><div class="hf-name">' + nm[t] + '</div><span class="hand-cnt">' + p.chips[t] + '</span>');
    }).join('') : '<div class="hand-empty">пока нет</div>';
    owned.forEach(t => imageCache.get('img/chips/' + t + '.png').then(im => {
      if (im) document.querySelectorAll('.hf-chipimg[data-t="' + t + '"]').forEach(el => { el.src = 'img/chips/' + t + '.png'; el.style.display = 'block'; if (el.nextElementSibling) el.nextElementSibling.style.display = 'none'; });
    }));
  }
  const mh = document.getElementById('morHand');
  if (mh) {
    if (p.isBot) { mh.innerHTML = '<div class="hand-empty">🤖 у бота ' + p.morals.length + '</div>'; return; }
    if (!p.morals.length) { mh.innerHTML = '<div class="hand-empty">нет карт — на Старте выбор из трёх</div>'; return; }
    mh.innerHTML = p.morals.map((c, i) => {
      const rot = (i - (p.morals.length - 1) / 2) * 6;
      return handCardHTML('mor', c.id, i, rot, 'back-mor', '<img class="hf-img hf-morimg" data-mi="' + i + '" style="display:none"><div class="hf-emo">' + c.icon + '</div><div class="hf-name">' + c.name + '</div>');
    }).join('');
    p.morals.forEach((c, i) => imageCache.get('img/morals/' + c.id + '.png').then(im => {
      if (im) document.querySelectorAll('.hf-morimg[data-mi="' + i + '"]').forEach(el => { el.src = 'img/morals/' + c.id + '.png'; el.style.display = 'block'; if (el.nextElementSibling) el.nextElementSibling.style.display = 'none'; });
    }));
  }
}
document.addEventListener('click', e => {
  const hc = e.target.closest('.hcard');
  if (!hc) return;
  if (!hc.classList.contains('open')) { hc.classList.add('open'); return; }
  const kind = hc.dataset.kind;
  if (kind === 'mor') playMorCard(+hc.dataset.i);
  else if (kind === 'chip') useChip(hc.dataset.key);
  else hc.classList.remove('open');
});
function renderDossier() {
  if (!S) return;
  const rp = document.querySelector('.right-panel');
  if (!rp) return;
  let box = document.getElementById('dossierPanel');
  if (!box) { box = document.createElement('div'); box.id = 'dossierPanel'; box.className = 'panel'; rp.appendChild(box); }
  const p = S.players[S.cur];
  const eff = [];
  if (p.stealth > 0) eff.push('🕶 скрытность ×' + p.stealth);
  if (p.protect) eff.push('🛡 защита');
  if (p.avoid) eff.push('💰 откуп');
  if (p.double) eff.push('⚡ двойной бросок');
  if (p.blocked) eff.push('🚫 блокирован');
  if (p.muted) eff.push('🔇 нем');
  box.innerHTML = '<h3>🕵️ Досье: ' + p.name + '</h3>' +
    '<div class="dz-row"><span>Роль:</span><button id="dzRole" class="dz-btn">👁 показать</button><span id="dzRoleVal" style="display:none;color:#ffd54f;font-weight:800">' + (window.ROLE_LABELS ? ROLE_LABELS[p.role] : p.role) + '</span></div>' +
    '<div class="dz-row"><span>🧩 Сеты:</span><b>' + (p.sets.length ? p.sets.join(', ') : 'нет') + '</b></div>' +
    '<div class="dz-row"><span>✨ Эффекты:</span><b>' + (eff.length ? eff.join(' · ') : 'нет') + '</b></div>' +
    '<div class="dz-row"><span>💵 Доход на Старте:</span><b>+' + (200 + p.income) + '</b></div>';
  const b = box.querySelector('#dzRole');
  if (b) b.onclick = () => { const v = box.querySelector('#dzRoleVal'); const show = v.style.display === 'none'; v.style.display = show ? 'inline' : 'none'; b.textContent = show ? '🙈 скрыть' : '👁 показать'; };
}
const _ui76 = window.updateUI;
window.updateUI = function () { _ui76(); renderHand(); renderDossier(); };
// ============================================
// ДОПОЛНЕНИЕ v77 — ВЕРНУТЬ ПАНЕЛЬ «РУКА» НА МЕСТО
// ============================================
const _rh77 = window.renderHand;
window.renderHand = function () {
  if (window.ensureFreePanel) ensureFreePanel(); // сначала создаём/пересобираем панель
  _rh77();
};
// ============================================
// ДОПОЛНЕНИЕ v78 — КАРТЫ РУКИ: ХОВЕР = ЛИЦО+ЗУМ+ОЗВУЧКА; ГОЛОС — ВНИЗ ПОД ПОЛЕ
// ============================================
function renderHand() {
  if (!S) return;
  const p = S.players[S.cur];
  const hn = document.getElementById('handName'); if (hn) hn.textContent = p.name;
  const sk = document.getElementById('handSkins');
  if (sk) {
    sk.innerHTML = p.skins.length ? p.skins.map((id, i) => {
      const skin = (window.SKINS && SKINS[id]) || {};
      const img = window.getSkinImage ? getSkinImage(id, skin.category) : null;
      const rot = (i - (p.skins.length - 1) / 2) * 6;
      return '<div class="hcard" data-kind="skin" data-key="' + id + '" data-i="' + i + '" style="--rot:' + rot + 'deg">' +
        '<div class="hcard-inner"><div class="hcard-back back-skin"></div>' +
        '<div class="hcard-front">' + (img ? '<img class="hf-img" src="' + img + '">' : '<div class="hf-emo">🗡</div>') +
        '<div class="hf-name">' + (skin.name || id) + '</div>' +
        '<div class="hf-txt">⚔️ ' + (skin.damage || 0) + ' · 🛡 ' + (skin.defense || 0) + '</div></div></div></div>';
    }).join('') : '<div class="hand-empty">пока нет</div>';
  }
  const ch = document.getElementById('handChips');
  if (ch) {
    const types = ['witness', 'alibi', 'ulika', 'dopros', 'zasada'];
    const emo = { witness: '👁', alibi: '⏳', ulika: '🔍', dopros: '🎤', zasada: '💣' };
    const nm = { witness: 'Свидетель', alibi: 'Алиби', ulika: 'Улика', dopros: 'Допрос', zasada: 'Засада' };
    const owned = types.filter(t => p.chips[t] > 0);
    ch.innerHTML = owned.length ? owned.map((t, i) => {
      const rot = (i - (owned.length - 1) / 2) * 6;
      const info = (window.CHIP_INFO && CHIP_INFO[t]) ? CHIP_INFO[t] : { mech: '' };
      return '<div class="hcard" data-kind="chip" data-key="' + t + '" data-i="' + i + '" style="--rot:' + rot + 'deg">' +
        '<div class="hcard-inner"><div class="hcard-back back-chip"></div>' +
        '<div class="hcard-front"><img class="hf-img hf-chipimg" data-t="' + t + '" style="display:none"><div class="hf-emo">' + emo[t] + '</div>' +
        '<div class="hf-name">' + nm[t] + '</div><div class="hf-txt">' + info.mech + '</div>' +
        '<span class="hand-cnt">' + p.chips[t] + '</span></div></div></div>';
    }).join('') : '<div class="hand-empty">пока нет</div>';
    owned.forEach(t => imageCache.get('img/chips/' + t + '.png').then(im => {
      if (im) document.querySelectorAll('.hf-chipimg[data-t="' + t + '"]').forEach(el => { el.src = 'img/chips/' + t + '.png'; el.style.display = 'block'; if (el.nextElementSibling) el.nextElementSibling.style.display = 'none'; });
    }));
  }
  const mh = document.getElementById('morHand');
  if (mh) {
    if (p.isBot) { mh.innerHTML = '<div class="hand-empty">🤖 у бота ' + p.morals.length + '</div>'; return; }
    if (!p.morals.length) { mh.innerHTML = '<div class="hand-empty">нет карт — на Старте выбор из трёх</div>'; return; }
    mh.innerHTML = p.morals.map((c, i) => {
      const rot = (i - (p.morals.length - 1) / 2) * 6;
      return '<div class="hcard" data-kind="mor" data-key="' + c.id + '" data-i="' + i + '" style="--rot:' + rot + 'deg">' +
        '<div class="hcard-inner"><div class="hcard-back back-mor"></div>' +
        '<div class="hcard-front"><img class="hf-img hf-morimg" data-mi="' + i + '" style="display:none"><div class="hf-emo">' + c.icon + '</div>' +
        '<div class="hf-name">' + c.name + '</div><div class="hf-txt">⚙️ ' + c.effect + ' · ' + c.desc + '</div></div></div></div>';
    }).join('');
    p.morals.forEach((c, i) => imageCache.get('img/morals/' + c.id + '.png').then(im => {
      if (im) document.querySelectorAll('.hf-morimg[data-mi="' + i + '"]').forEach(el => { el.src = 'img/morals/' + c.id + '.png'; el.style.display = 'block'; if (el.nextElementSibling) el.nextElementSibling.style.display = 'none'; });
    }));
  }
}
// Клик — сразу действие (мораль сыграть / карту действий тянуть / скин превью)
document.addEventListener('click', e => {
  const hc = e.target.closest('.hcard');
  if (!hc) return;
  const kind = hc.dataset.kind;
  if (kind === 'mor') playMorCard(+hc.dataset.i);
  else if (kind === 'chip') useChip(hc.dataset.key);
  else if (kind === 'skin' && window.SKINS && SKINS[hc.dataset.key]) showPreview({ name: SKINS[hc.dataset.key].name });
});
// Ховер — озвучка текста карты (mp3 или робот)
let lastHandSnd = null;
document.addEventListener('mouseover', e => {
  const hc = e.target.closest('.hcard');
  if (!hc) { lastHandSnd = null; return; }
  if (hc === lastHandSnd) return;
  lastHandSnd = hc;
  if (!voiceOn()) return;
  const kind = hc.dataset.kind, key = hc.dataset.key, i = +hc.dataset.i;
  if (kind === 'mor' && S) {
    const c = S.players[S.cur].morals[i];
    if (c) {
      const a = new Audio('snd/morals/' + c.id + '.mp3');
      let done = false;
      a.oncanplaythrough = () => { if (!done) { done = true; a.volume = .9; a.play().catch(() => {}); } };
      a.onerror = () => { if (!done) { done = true; tts(c.name + '. ' + c.effect); } };
      a.load();
    }
  } else if (kind === 'chip') {
    const snd = (window.ASSETS && ASSETS.sounds.cards && ASSETS.sounds.cards[key]) || null;
    if (snd) soundCache.play(snd, .5);
    else if (window.CHIP_INFO && CHIP_INFO[key]) tts(CHIP_INFO[key].mech);
  } else if (kind === 'skin' && window.SKINS && SKINS[key]) {
    tts(SKINS[key].name + '. Урон ' + (SKINS[key].damage || 0) + ', защита ' + (SKINS[key].defense || 0));
  }
});
// ============================================
// ДОПОЛНЕНИЕ v79 — ЕДИНЫЙ ФАСАД КАРТ РУКИ + РАБОЧИЙ «ВИД ПОЛЯ»
// ============================================
function renderHand() {
  if (!S) return;
  if (window.ensureFreePanel) ensureFreePanel();
  const p = S.players[S.cur];
  const hn = document.getElementById('handName'); if (hn) hn.textContent = p.name;
  const mk = (kind, key, i, rot, emo, name, txt, cnt) =>
    '<div class="hcard" data-kind="' + kind + '" data-key="' + key + '" data-i="' + i + '" style="--rot:' + rot + 'deg">' +
    '<div class="hcard-inner"><div class="hcard-back ' + (kind === 'mor' ? 'back-mor' : kind === 'chip' ? 'back-chip' : 'back-skin') + '"></div>' +
    '<div class="hcard-front"><div class="hf-art"><span class="hf-emo">' + emo + '</span><img class="hf-late" data-kind="' + kind + '" data-key="' + key + '" data-i="' + i + '" style="display:none" alt=""></div>' +
    '<div class="hf-name">' + name + '</div><div class="hf-txt">⚙️ ' + txt + '</div>' +
    (cnt ? '<span class="hand-cnt">' + cnt + '</span>' : '') +
    '</div></div></div>';
  const fan = (n, i) => (i - (n - 1) / 2) * 6;
  // Скины
  const sk = document.getElementById('handSkins');
  if (sk) {
    sk.innerHTML = p.skins.length ? p.skins.map((id, i) => {
      const s = (window.SKINS && SKINS[id]) || {};
      return mk('skin', id, i, fan(p.skins.length, i), '🗡', s.name || id, 'Урон ' + (s.damage || 0) + ' · Защита ' + (s.defense || 0));
    }).join('') : '<div class="hand-empty">пока нет</div>';
  }
  // Карты действий
  const ch = document.getElementById('handChips');
  if (ch) {
    const types = ['witness', 'alibi', 'ulika', 'dopros', 'zasada'];
    const emo = { witness: '👁', alibi: '⏳', ulika: '🔍', dopros: '🎤', zasada: '💣' };
    const nm = { witness: 'Свидетель', alibi: 'Алиби', ulika: 'Улика', dopros: 'Допрос', zasada: 'Засада' };
    const owned = types.filter(t => p.chips[t] > 0);
    ch.innerHTML = owned.length ? owned.map((t, i) => {
      const info = (window.CHIP_INFO && CHIP_INFO[t]) ? CHIP_INFO[t] : { mech: '' };
      return mk('chip', t, i, fan(owned.length, i), emo[t], nm[t], info.mech, p.chips[t]);
    }).join('') : '<div class="hand-empty">пока нет</div>';
  }
  // Мораль
  const mh = document.getElementById('morHand');
  if (mh) {
    if (p.isBot) { mh.innerHTML = '<div class="hand-empty">🤖 у бота ' + p.morals.length + '</div>'; }
    else if (!p.morals.length) { mh.innerHTML = '<div class="hand-empty">нет карт — на Старте выбор из трёх</div>'; }
    else {
      mh.innerHTML = p.morals.map((c, i) => mk('mor', c.id, i, fan(p.morals.length, i), c.icon, c.name, c.effect + '. ' + c.desc)).join('');
    }
  }
  // Арт подтягивается асинхронно (мораль / фишки / скины)
  document.querySelectorAll('.hf-late').forEach(img => {
    const k = img.dataset.kind, key = img.dataset.key;
    let cands = [];
    if (k === 'mor') cands = ['img/morals/' + key + '.png'];
    else if (k === 'chip') cands = ['img/chips/' + key + '.png', 'img/cards/' + key + '.png'];
    else if (window.getSkinImage && window.SKINS && SKINS[key]) cands = [getSkinImage(key, SKINS[key].category)];
    (async () => {
      for (const path of cands) {
        const im = await imageCache.get(path);
        if (im) {
          img.src = path; img.style.display = 'block';
          const emo = img.previousElementSibling; if (emo) emo.style.display = 'none';
          break;
        }
      }
    })();
  });
}
// «❖ Вид поля»: плоско ↔ 3D-наклон
window.toggleView = () => {
  const b = document.getElementById('board');
  if (b) b.classList.toggle('tilt');
};
// ============================================
// ДОПОЛНЕНИЕ v80 — КАРТЫ РУКИ = КАК МОРАЛЬ (инлайн-стили) + УБРАТЬ КНОПКУ «МОРАЛЬ»
// ============================================
function hcCard(kind, key, i, rot, emo, name, txt, cnt) {
  return '<div class="hcard" data-kind="' + kind + '" data-key="' + key + '" data-i="' + i + '" style="width:120px;aspect-ratio:44/63;perspective:700px;cursor:pointer;position:relative;margin-left:-16px;transition:transform .25s;transform:rotate(' + rot + 'deg)">' +
    '<div class="hc-in" style="position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform .8s cubic-bezier(.3,.9,.4,1)">' +
    '<div style="position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;background:#0d1226 url(\'img/ui/moral-frame.png\') center/100% 100% no-repeat;border-radius:10px"></div>' +
    '<div style="position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;transform:rotateY(180deg);border-radius:10px;border:2px solid #d4af37;background:linear-gradient(180deg,#1a2340,#0d1226);display:flex;flex-direction:column;overflow:hidden">' +
    '<img class="hc-art" data-kind="' + kind + '" data-key="' + key + '" data-i="' + i + '" alt="" style="display:none;width:100%;height:52%;object-fit:cover;border-bottom:2px solid #d4af37">' +
    '<div class="hc-ph" style="height:52%;display:flex;align-items:center;justify-content:center;font-size:40px">' + emo + '</div>' +
    '<div style="color:#d4af37;font-weight:800;font-size:11px;text-align:center;padding:3px 2px">' + name + '</div>' +
    '<div style="flex:1;overflow:hidden;padding:2px 6px 4px;font-size:9px;line-height:1.4;color:#eee;text-align:center">⚙️ ' + txt + '</div>' +
    (cnt ? '<span style="position:absolute;top:-8px;right:-8px;background:#d4af37;color:#14100a;font-size:11px;font-weight:900;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center">' + cnt + '</span>' : '') +
    '</div></div></div>';
}
window.renderHand = function () {
  if (!S) return;
  if (window.ensureFreePanel) ensureFreePanel();
  const p = S.players[S.cur];
  const hn = document.getElementById('handName'); if (hn) hn.textContent = p.name;
  const fan = (n, i) => (i - (n - 1) / 2) * 6;
  const sk = document.getElementById('handSkins');
  if (sk) {
    sk.innerHTML = p.skins.length ? p.skins.map((id, i) => {
      const s = (window.SKINS && SKINS[id]) || {};
      return hcCard('skin', id, i, fan(p.skins.length, i), '🗡', s.name || id, 'Урон ' + (s.damage || 0) + ' · Защита ' + (s.defense || 0));
    }).join('') : '<div style="font-size:11px;opacity:.5">пока нет</div>';
  }
  const ch = document.getElementById('handChips');
  if (ch) {
    const types = ['witness', 'alibi', 'ulika', 'dopros', 'zasada'];
    const emo = { witness: '👁', alibi: '⏳', ulika: '🔍', dopros: '🎤', zasada: '💣' };
    const nm = { witness: 'Свидетель', alibi: 'Алиби', ulika: 'Улика', dopros: 'Допрос', zasada: 'Засада' };
    const owned = types.filter(t => p.chips[t] > 0);
    ch.innerHTML = owned.length ? owned.map((t, i) => {
      const info = (window.CHIP_INFO && CHIP_INFO[t]) ? CHIP_INFO[t] : { mech: '' };
      return hcCard('chip', t, i, fan(owned.length, i), emo[t], nm[t], info.mech, p.chips[t]);
    }).join('') : '<div style="font-size:11px;opacity:.5">пока нет</div>';
  }
  const mh = document.getElementById('morHand');
  if (mh) {
    if (p.isBot) mh.innerHTML = '<div style="font-size:11px;opacity:.5">🤖 у бота ' + p.morals.length + '</div>';
    else if (!p.morals.length) mh.innerHTML = '<div style="font-size:11px;opacity:.5">нет карт — на Старте выбор из трёх</div>';
    else mh.innerHTML = p.morals.map((c, i) => hcCard('mor', c.id, i, fan(p.morals.length, i), c.icon, c.name, c.effect + '. ' + c.desc)).join('');
  }
  document.querySelectorAll('.hc-art').forEach(img => {
    const k = img.dataset.kind, key = img.dataset.key;
    let cands = [];
    if (k === 'mor') cands = ['img/morals/' + key + '.png'];
    else if (k === 'chip') cands = ['img/chips/' + key + '.png', 'img/cards/' + key + '.png'];
    else if (window.getSkinImage && window.SKINS && SKINS[key]) cands = [getSkinImage(key, SKINS[key].category)];
    (async () => {
      for (const path of cands) {
        const im = await imageCache.get(path);
        if (im) {
          img.src = path; img.style.display = 'block';
          const ph = img.nextElementSibling; if (ph && ph.classList.contains('hc-ph')) ph.style.display = 'none';
          break;
        }
      }
    })();
  });
};
// Ховер: проворот лицом + подъём + зум (инлайном, без CSS)
document.addEventListener('mouseover', e => {
  const hc = e.target.closest('.hcard');
  if (!hc) return;
  const inn = hc.querySelector('.hc-in');
  if (inn) inn.style.transform = 'rotateY(540deg)';
  hc.style.zIndex = 10;
  hc.style.transform = hc.style.transform.replace(/ translateY\([^)]*\)| scale\([^)]*\)/g, '') + ' translateY(-14px) scale(1.35)';
});
document.addEventListener('mouseout', e => {
  const hc = e.target.closest('.hcard');
  if (!hc || hc.contains(e.relatedTarget)) return;
  const inn = hc.querySelector('.hc-in');
  if (inn) inn.style.transform = '';
  hc.style.zIndex = '';
  hc.style.transform = hc.style.transform.replace(/ translateY\([^)]*\)| scale\([^)]*\)/g, '');
});
// Кнопку «Мораль» — убираем навсегда
function hideMorBtn() { const b = document.getElementById('morBtn'); if (b) b.style.display = 'none'; }
document.addEventListener('DOMContentLoaded', hideMorBtn);
const _ui80 = window.updateUI;
window.updateUI = function () { _ui80(); hideMorBtn(); };
// ============================================
// ДОПОЛНЕНИЕ v83 — КАРТЫ ДЕЙСТВИЙ КАК МОРАЛЬ + РАЗНЫЕ РУБАШКИ
// ============================================
const HAND_BACKS = {
  mor: ['img/ui/moral-frame.png'],                 // рубашка морали (твоя рамка)
  chip: ['img/ui/back-chip.png', 'img/cards/back.png'], // рубашка карт действий
  skin: ['img/ui/back-skin.png', 'img/skins/back.png']  // рубашка скинов
};
const HAND_EMO = { mor: '🎭', chip: '🃏', skin: '🗡' };
function hcCard83(kind, key, i, rot, emo, name, txt, cnt) {
  return '<div class="hcard" data-kind="' + kind + '" data-key="' + key + '" data-i="' + i + '" style="width:120px;aspect-ratio:44/63;perspective:700px;cursor:pointer;position:relative;margin-left:-16px;transition:transform .25s;transform:rotate(' + rot + 'deg)">' +
    '<div class="hc-in" style="position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform .8s cubic-bezier(.3,.9,.4,1)">' +
    '<div class="hc-back" data-kind="' + kind + '" style="position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:10px;border:2px solid #d4af37;background:linear-gradient(160deg,#1a2340,#0d1226) center/100% 100% no-repeat;display:flex;align-items:center;justify-content:center;font-size:34px"><span class="hc-bemo">' + HAND_EMO[kind] + '</span></div>' +
    '<div style="position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;transform:rotateY(180deg);border-radius:10px;border:2px solid #d4af37;background:linear-gradient(180deg,#1a2340,#0d1226);display:flex;flex-direction:column;overflow:hidden">' +
    '<img class="hc-art" data-kind="' + kind + '" data-key="' + key + '" data-i="' + i + '" alt="" style="display:none;width:100%;height:50%;object-fit:cover;border-bottom:2px solid #d4af37">' +
    '<div class="hc-ph" style="height:50%;display:flex;align-items:center;justify-content:center;font-size:36px">' + emo + '</div>' +
    '<div style="color:#d4af37;font-weight:800;font-size:11px;text-align:center;padding:3px 2px 1px">' + name + '</div>' +
    '<div class="hc-txt" style="flex:1;overflow-y:auto;padding:2px 6px 5px;font-size:9.5px;line-height:1.35;color:#eee;text-align:center">⚙️ ' + txt + '</div>' +
    (cnt ? '<span style="position:absolute;top:-8px;right:-8px;background:#d4af37;color:#14100a;font-size:11px;font-weight:900;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center">' + cnt + '</span>' : '') +
    '</div></div></div>';
}
window.renderHand = function () {
  if (!S) return;
  if (window.ensureFreePanel) ensureFreePanel();
  const p = S.players[S.cur];
  const hn = document.getElementById('handName'); if (hn) hn.textContent = p.name;
  const fan = (n, i) => (i - (n - 1) / 2) * 6;
  const sk = document.getElementById('handSkins');
  if (sk) {
    sk.innerHTML = p.skins.length ? p.skins.map((id, i) => {
      const s = (window.SKINS && SKINS[id]) || {};
      return hcCard83('skin', id, i, fan(p.skins.length, i), '🗡', s.name || id, 'Урон ' + (s.damage || 0) + ' · Защита ' + (s.defense || 0));
    }).join('') : '<div style="font-size:11px;opacity:.5">пока нет</div>';
  }
  const ch = document.getElementById('handChips');
  if (ch) {
    const types = ['witness', 'alibi', 'ulika', 'dopros', 'zasada'];
    const emo = { witness: '👁', alibi: '⏳', ulika: '🔍', dopros: '🎤', zasada: '💣' };
    const nm = { witness: 'Свидетель', alibi: 'Алиби', ulika: 'Улика', dopros: 'Допрос', zasada: 'Засада' };
    const owned = types.filter(t => p.chips[t] > 0);
    ch.innerHTML = owned.length ? owned.map((t, i) => {
      const info = (window.CHIP_INFO && CHIP_INFO[t]) ? CHIP_INFO[t] : { mech: '' };
      return hcCard83('chip', t, i, fan(owned.length, i), emo[t], nm[t], info.mech, p.chips[t]);
    }).join('') : '<div style="font-size:11px;opacity:.5">пока нет</div>';
  }
  const mh = document.getElementById('morHand');
  if (mh) {
    if (p.isBot) mh.innerHTML = '<div style="font-size:11px;opacity:.5">🤖 у бота ' + p.morals.length + '</div>';
    else if (!p.morals.length) mh.innerHTML = '<div style="font-size:11px;opacity:.5">нет карт — на Старте выбор из трёх</div>';
    else mh.innerHTML = p.morals.map((c, i) => hcCard83('mor', c.id, i, fan(p.morals.length, i), c.icon, c.name, c.effect + '. ' + c.desc)).join('');
  }
  // Фото на фасадах
  document.querySelectorAll('.hc-art').forEach(img => {
    const k = img.dataset.kind, key = img.dataset.key;
    let cands = [];
    if (k === 'mor') cands = ['img/morals/' + key + '.png'];
    else if (k === 'chip') cands = ['img/chips/' + key + '.png', 'img/cards/' + key + '.png'];
    else if (window.getSkinImage && window.SKINS && SKINS[key]) cands = [getSkinImage(key, SKINS[key].category)];
    (async () => {
      for (const path of cands) {
        const im = await imageCache.get(path);
        if (im) {
          img.src = path; img.style.display = 'block';
          const ph = img.nextElementSibling; if (ph && ph.classList.contains('hc-ph')) ph.style.display = 'none';
          break;
        }
      }
    })();
  });
  // Разные рубашки по типам
  Object.keys(HAND_BACKS).forEach(k => {
    (async () => {
      for (const path of HAND_BACKS[k]) {
        const im = await imageCache.get(path);
        if (im) {
          document.querySelectorAll('.hc-back[data-kind="' + k + '"]').forEach(b => {
            b.style.backgroundImage = 'url(' + path + ')';
            const e = b.querySelector('.hc-bemo'); if (e) e.style.display = 'none';
          });
          break;
        }
      }
    })();
  });
};
// ============================================
// ДОПОЛНЕНИЕ v84 — РОВНАЯ РУКА + ТЕКСТ И ОЗВУЧКА КАРТ ДЕЙСТВИЙ
// ============================================
const HAND_TEXT = {
  witness: '+1 подозрение по показанию свидетеля и монеты за информацию',
  alibi: '−1 подозрение, +400 монет и возврат на Старт',
  ulika: '+1–2 подозрения цели, −монеты на экспертизу',
  dopros: '+1–2 подозрения цели, −монеты на «кофе» для свидетелей',
  zasada: '+1–2 подозрения и +1 страх цели, −монеты'
};
const HAND_NM = { witness: 'Свидетель', alibi: 'Алиби', ulika: 'Улика', dopros: 'Допрос', zasada: 'Засада' };
const short84 = (s, n) => (s && s.length > n) ? s.slice(0, n - 1) + '…' : (s || '');
// защита от двойной озвучки (две системы сразу)
const _tts84 = window.tts;
let lastTts84 = 0;
window.tts = function (text) {
  const now = Date.now();
  if (now - lastTts84 < 500) return;
  lastTts84 = now;
  _tts84(text);
};
window.renderHand = function () {
  if (!S) return;
  if (window.ensureFreePanel) ensureFreePanel();
  const p = S.players[S.cur];
  const hn = document.getElementById('handName'); if (hn) hn.textContent = p.name;
  const fan = (n, i) => (i - (n - 1) / 2) * 3; // лёгкий наклон, без веера-хаоса
  const mk = (kind, key, i, rot, emo, name, txt, cnt) =>
    '<div class="hcard" data-kind="' + kind + '" data-key="' + key + '" data-i="' + i + '" style="width:112px;aspect-ratio:44/63;perspective:700px;cursor:pointer;position:relative;transition:transform .25s;transform:rotate(' + rot + 'deg)">' +
    '<div class="hc-in" style="position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform .8s cubic-bezier(.3,.9,.4,1)">' +
    '<div class="hc-back" data-kind="' + kind + '" style="position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:10px;border:2px solid #d4af37;background:linear-gradient(160deg,#1a2340,#0d1226) center/100% 100% no-repeat;display:flex;align-items:center;justify-content:center;font-size:34px"><span class="hc-bemo">' + emo + '</span></div>' +
    '<div style="position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;transform:rotateY(180deg);border-radius:10px;border:2px solid #d4af37;background:linear-gradient(180deg,#1a2340,#0d1226);display:flex;flex-direction:column;overflow:hidden">' +
    '<img class="hc-art" data-kind="' + kind + '" data-key="' + key + '" data-i="' + i + '" alt="" style="display:none;width:100%;height:46%;object-fit:cover;border-bottom:2px solid #d4af37">' +
    '<div class="hc-ph" style="height:46%;display:flex;align-items:center;justify-content:center;font-size:32px">' + emo + '</div>' +
    '<div style="color:#d4af37;font-weight:800;font-size:11px;text-align:center;padding:3px 2px 1px">' + name + '</div>' +
    '<div class="hc-txt" style="flex:1;overflow:hidden;padding:2px 6px 5px;font-size:9px;line-height:1.35;color:#eee;text-align:center">⚙️ ' + txt + '</div>' +
    (cnt ? '<span style="position:absolute;top:-8px;right:-8px;background:#d4af37;color:#14100a;font-size:11px;font-weight:900;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center">' + cnt + '</span>' : '') +
    '</div></div></div>';
  const sk = document.getElementById('handSkins');
  if (sk) {
    sk.innerHTML = p.skins.length ? p.skins.map((id, i) => {
      const s = (window.SKINS && SKINS[id]) || {};
      return mk('skin', id, i, fan(p.skins.length, i), '🗡', s.name || id, 'Урон ' + (s.damage || 0) + ' · Защита ' + (s.defense || 0));
    }).join('') : '<div style="font-size:11px;opacity:.5">пока нет</div>';
  }
  const ch = document.getElementById('handChips');
  if (ch) {
    const emo = { witness: '👁', alibi: '⏳', ulika: '🔍', dopros: '🎤', zasada: '💣' };
    const owned = ['witness', 'alibi', 'ulika', 'dopros', 'zasada'].filter(t => p.chips[t] > 0);
    ch.innerHTML = owned.length ? owned.map((t, i) =>
      mk('chip', t, i, fan(owned.length, i), emo[t], HAND_NM[t], HAND_TEXT[t], p.chips[t])
    ).join('') : '<div style="font-size:11px;opacity:.5">пока нет</div>';
  }
  const mh = document.getElementById('morHand');
  if (mh) {
    if (p.isBot) mh.innerHTML = '<div style="font-size:11px;opacity:.5">🤖 у бота ' + p.morals.length + '</div>';
    else if (!p.morals.length) mh.innerHTML = '<div style="font-size:11px;opacity:.5">нет карт — на Старте выбор из трёх</div>';
    else mh.innerHTML = p.morals.map((c, i) => mk('mor', c.id, i, fan(p.morals.length, i), c.icon, c.name, short84(c.effect + '. ' + c.desc, 90))).join('');
  }
  // арт + рубашки
  document.querySelectorAll('.hc-art').forEach(img => {
    const k = img.dataset.kind, key = img.dataset.key;
    let cands = [];
    if (k === 'mor') cands = ['img/morals/' + key + '.png'];
    else if (k === 'chip') cands = ['img/chips/' + key + '.png', 'img/cards/' + key + '.png'];
    else if (window.getSkinImage && window.SKINS && SKINS[key]) cands = [getSkinImage(key, SKINS[key].category)];
    (async () => {
      for (const path of cands) {
        const im = await imageCache.get(path);
        if (im) { img.src = path; img.style.display = 'block'; const ph = img.nextElementSibling; if (ph && ph.classList.contains('hc-ph')) ph.style.display = 'none'; break; }
      }
    })();
  });
  const BACKS = { mor: ['img/ui/moral-frame.png'], chip: ['img/ui/back-chip.png', 'img/cards/back.png'], skin: ['img/ui/back-skin.png', 'img/skins/back.png'] };
  Object.keys(BACKS).forEach(k => {
    (async () => {
      for (const path of BACKS[k]) {
        const im = await imageCache.get(path);
        if (im) { document.querySelectorAll('.hc-back[data-kind="' + k + '"]').forEach(b => { b.style.backgroundImage = 'url(' + path + ')'; const e = b.querySelector('.hc-bemo'); if (e) e.style.display = 'none'; }); break; }
      }
    })();
  });
};
// Озвучка карт действий: snd/cards/<тип>.mp3, пока нет — робот читает РЕПЛИКУ из колоды
document.addEventListener('mouseover', e => {
  const hc = e.target.closest('.hcard');
  if (!hc || hc.dataset.kind !== 'chip') return;
  if (hc.dataset.v84 === '1') return;
  hc.dataset.v84 = '1';
  setTimeout(() => { hc.dataset.v84 = ''; }, 600);
  if (!voiceOn()) return;
  const key = hc.dataset.key;
  soundCache.load('snd/cards/' + key + '.mp3').then(a => {
    if (!a && S && S.decks && S.decks[key] && S.decks[key].length) {
      const q = S.decks[key][U.random(0, S.decks[key].length - 1)];
      tts(HAND_NM[key] + '. ' + (q[0] || ''));
    }
  });
}, true); // capture — раньше старых слушателей
// ============================================
// ДОПОЛНЕНИЕ v85 — ОЗВУЧКА = ТЕКСТ НА КАРТЕ (и блокируем старую «случайную» читалку)
// ============================================
window.addEventListener('mouseover', e => {
  const hc = e.target.closest ? e.target.closest('.hcard') : null;
  if (!hc || hc.dataset.kind !== 'chip') return;
  hc.dataset.v84 = '1'; // глушим v84 (случайные реплики из колоды)
  setTimeout(() => { hc.dataset.v84 = ''; }, 700);
  if (hc.dataset.v85 === '1') return;
  hc.dataset.v85 = '1';
  setTimeout(() => { hc.dataset.v85 = ''; }, 600);
  if (!voiceOn()) return;
  const key = hc.dataset.key;
  soundCache.load('snd/cards/' + key + '.mp3').then(a => {
    if (!a) tts(HAND_NM[key] + '. ' + HAND_TEXT[key]); // голос = текст на карте
  });
}, true); // window-capture: срабатывает РАНЬШЕ слушателя v84
// ============================================
// ДОПОЛНЕНИЕ v86 — ПОФРАЗОВАЯ ОЗВУЧКА ИЗ ПАПОК snd/cards (ВСЕ КОЛОДЫ)
// ============================================
function deckIndex86(deck, text) { if (!deck) return -1; for (let i = 0; i < deck.length; i++) if (deck[i][0] === text) return i; return -1; }
function playPhrase86(folder, idx, fallback) {
  if (idx < 0) { if (fallback) fallback(); return; }
  soundCache.load('snd/cards/' + folder + '/' + (idx + 1) + '.mp3').then(a => {
    if (a) { a.volume = 1; a.currentTime = 0; a.play().catch(() => {}); }
    else if (fallback) fallback();
  });
}
// Карты действий: фраза из папки → общий файл типа → робот
async function useChip(type) {
  if (!S || S.isBusy || S.isOver) return;
  const p = S.players[S.cur];
  if (p.chips[type] <= 0 || p.usedChip) return;
  S.isBusy = true; p.chips[type]--; p.usedChip = true; S.lastChip = p;
  const deck = S.decks[type]; const card = deck.shift(); deck.push(card);
  playSound('cards', type);
  let text = '', effect = '', target = null;
  const cardText = card[0], targetCode = card[1], val1 = card[2], val2 = card[3];
  if (type === 'witness') { target = pickTarget(p, targetCode); target.suspect.add(1); p.coins += val1; text = cardText; effect = '+1 подозрение ' + target.name + ', +' + val1 + ' монет'; }
  else if (type === 'alibi') { p.suspect.add(-1); p.coins += 400; p.pos = 0; text = cardText; effect = '−1 подозрение, +400 монет, на Старт'; }
  else if (type === 'ulika' || type === 'dopros') { target = pickTarget(p, targetCode); target.suspect.add(val1); p.coins = Math.max(0, p.coins - val2); text = cardText; effect = '+' + val1 + ' ' + target.name + ', −' + val2 + ' монет'; }
  else if (type === 'zasada') { target = pickTarget(p, targetCode); target.suspect.add(val1); target.fear.add(1); p.coins = Math.max(0, p.coins - val2); S.lastZas = { source: p, target: target }; text = cardText; effect = '+' + val1 + ' ' + target.name + ', −' + val2 + ' монет'; }
  const base = { witness: WITNESS_DECK, alibi: ALIBI_DECK, ulika: ULIKA_DECK, dopros: DOPROS_DECK, zasada: ZASADA_DECK }[type];
  playPhrase86(type, deckIndex86(base, cardText), () => {
    soundCache.load('snd/cards/' + type + '.mp3').then(b => {
      if (b) { b.volume = 1; b.currentTime = 0; b.play().catch(() => {}); }
      else tts(text);
    });
  });
  if (!p.isBot) await showModal('<h2>' + type.toUpperCase() + '</h2><p>«' + text + '»</p><p style="color:#d4af37">' + effect + '</p><button data-v="ok">OK</button>');
  log('🃏 ' + p.name + ': ' + text);
  S.isBusy = false;
  updateUI();
}
// Тайник: фраза из папки taj
async function handleStash(p) {
  const card = S.decks.taj.shift(); S.decks.taj.push(card);
  const text = card[0], effects = card[1];
  playSound('cards', 'taj');
  playPhrase86('taj', deckIndex86(TAJ_DECK, text), () => tts(text));
  if (!p.isBot) await showModal('<h2>🟣 ТАЙНИК</h2><p>«' + text + '»</p><button data-v="ok">OK</button>');
  applyEffects(p, effects);
  log('🟣 ' + p.name + ': ' + text);
}
// Мораль: snd/morals/<id>.mp3 → snd/cards/mor/<№>.mp3 → робот
function playMoralSound(c) {
  soundCache.load('snd/morals/' + c.id + '.mp3').then(a => {
    if (a) { a.volume = 1; a.currentTime = 0; a.play().catch(() => {}); }
    else playPhrase86('mor', (window.MORAL_DECK ? MORAL_DECK.findIndex(m => m.id === c.id) : -1), () => tts(c.name + '. ' + c.effect));
  });
}
// ============================================
// ДОПОЛНЕНИЕ v87 — ОЗВУЧКА ПОСЛЕ ПРИМЕНЕНИЯ + СТАКИ С ПОЛЯ УБРАНЫ
// ============================================
const pp87 = (typeof playPhrase86 === 'function') ? playPhrase86 : (f, i, fb) => { if (fb) fb(); };
const di87 = (typeof deckIndex86 === 'function') ? deckIndex86 : () => -1;
// 1) Карты с поля — убираем (центр = лого + фон)
const _bb87 = window.buildBoard;
window.buildBoard = function () {
  _bb87();
  document.querySelectorAll('#board .stacks, #board .hint').forEach(el => el.remove());
};
// 2) Карты действий: голос — ПОСЛЕ применения
async function useChip(type) {
  if (!S || S.isBusy || S.isOver) return;
  const p = S.players[S.cur];
  if (p.chips[type] <= 0 || p.usedChip) return;
  S.isBusy = true; p.chips[type]--; p.usedChip = true; S.lastChip = p;
  const deck = S.decks[type]; const card = deck.shift(); deck.push(card);
  playSound('cards', type);
  let text = '', effect = '', target = null;
  const cardText = card[0], targetCode = card[1], val1 = card[2], val2 = card[3];
  if (type === 'witness') { target = pickTarget(p, targetCode); target.suspect.add(1); p.coins += val1; text = cardText; effect = '+1 подозрение ' + target.name + ', +' + val1 + ' монет'; }
  else if (type === 'alibi') { p.suspect.add(-1); p.coins += 400; p.pos = 0; text = cardText; effect = '−1 подозрение, +400 монет, на Старт'; }
  else if (type === 'ulika' || type === 'dopros') { target = pickTarget(p, targetCode); target.suspect.add(val1); p.coins = Math.max(0, p.coins - val2); text = cardText; effect = '+' + val1 + ' ' + target.name + ', −' + val2 + ' монет'; }
  else if (type === 'zasada') { target = pickTarget(p, targetCode); target.suspect.add(val1); target.fear.add(1); p.coins = Math.max(0, p.coins - val2); S.lastZas = { source: p, target: target }; text = cardText; effect = '+' + val1 + ' ' + target.name + ', −' + val2 + ' монет'; }
  if (!p.isBot) await showModal('<h2>' + type.toUpperCase() + '</h2><p>«' + text + '»</p><p style="color:#d4af37">' + effect + '</p><button data-v="ok">OK</button>');
  log('🃏 ' + p.name + ': ' + text);
  S.isBusy = false;
  updateUI();
  if (S.voiceEnabled) {
    const base = { witness: WITNESS_DECK, alibi: ALIBI_DECK, ulika: ULIKA_DECK, dopros: DOPROS_DECK, zasada: ZASADA_DECK }[type];
    pp87(type, di87(base, cardText), () => {
      soundCache.load('snd/cards/' + type + '.mp3').then(b => {
        if (b) { b.volume = 1; b.currentTime = 0; b.play().catch(() => {}); }
        else tts(text);
      });
    });
  }
}
// 3) Мораль: голос — ПОСЛЕ применения
function playMorCard(i) {
  if (!S || S.isBusy || S.isOver) return;
  const p = S.players[S.cur];
  if (p.isBot || p.morUsed || !p.morals[i]) return;
  const card = p.morals.splice(i, 1)[0];
  S.morDiscard.push(card); p.morUsed = true;
  applyMoral(p, card).then(() => {
    log('🎭 ' + p.name + ' сыграл «' + card.name + '»');
    updateUI();
    if (S.voiceEnabled) playMoralSound(card);
  });
}
// 4) Тайник: голос — ПОСЛЕ применения
async function handleStash(p) {
  const card = S.decks.taj.shift(); S.decks.taj.push(card);
  const text = card[0], effects = card[1];
  playSound('cards', 'taj');
  if (!p.isBot) await showModal('<h2>🟣 ТАЙНИК</h2><p>«' + text + '»</p><button data-v="ok">OK</button>');
  applyEffects(p, effects);
  log('🟣 ' + p.name + ': ' + text);
  updateUI();
  if (S.voiceEnabled) pp87('taj', di87(TAJ_DECK, text), () => tts(text));
}
// 5) При наведении голос — ТОЛЬКО у скинов (карты действий и мораль молчат до применения)
document.addEventListener('mouseover', e => {
  const hc = e.target.closest ? e.target.closest('.hcard') : null;
  window.MM_HOVERCARD = hc ? hc.dataset.kind : null;
}, true);
const _vo87 = window.voiceOn;
window.voiceOn = function () {
  if (window.MM_HOVERCARD && window.MM_HOVERCARD !== 'skin') return false;
  return _vo87();
};
// ============================================
// ДОПОЛНЕНИЕ v88 — ОЗВУЧКА СТРОГО ПОСЛЕ ПРИМЕНЕНИЯ, ХОВЕР — НЕМОЙ (КРОМЕ СКИНОВ)
// ============================================
// 1) Карты с поля убираем (если ещё остались)
const _bb88 = window.buildBoard;
window.buildBoard = function () {
  _bb88();
  document.querySelectorAll('#board .stacks, #board .hint').forEach(el => el.remove());
};
// 2) Чип-карты помечаем «озвученными» — старые ховер-читалки их пропускают
const _rh88 = window.renderHand;
window.renderHand = function () {
  _rh88();
  document.querySelectorAll('.hcard[data-kind="chip"]').forEach(el => { el.dataset.v84 = '1'; });
};
// 3) voiceOn: при наведении на руку молчим (скины — исключение)
document.addEventListener('mouseover', e => {
  const hc = e.target.closest ? e.target.closest('.hcard') : null;
  window.MM_HOVERCARD = hc ? hc.dataset.kind : null;
}, true);
const _vo88 = window.voiceOn;
window.voiceOn = function () {
  if (window.MM_HOVERCARD && window.MM_HOVERCARD !== 'skin') return false;
  return _vo88();
};
// 4) Голос карты: фраза из папки → общий файл типа → робот
function speakCard88(type, cardText) {
  if (!S || !S.voiceEnabled) return;
  const base = { witness: WITNESS_DECK, alibi: ALIBI_DECK, ulika: ULIKA_DECK, dopros: DOPROS_DECK, zasada: ZASADA_DECK }[type];
  let idx = -1;
  if (base) { for (let i = 0; i < base.length; i++) if (base[i][0] === cardText) { idx = i; break; } }
  const tryType = () => soundCache.load('snd/cards/' + type + '.mp3').then(b => {
    if (b) { b.volume = 1; b.currentTime = 0; b.play().catch(() => {}); } else tts(cardText);
  });
  if (idx >= 0) soundCache.load('snd/cards/' + type + '/' + (idx + 1) + '.mp3').then(a => {
    if (a) { a.volume = 1; a.currentTime = 0; a.play().catch(() => {}); } else tryType();
  });
  else tryType();
}
function speakTaj88(text) {
  if (!S || !S.voiceEnabled) return;
  let idx = -1;
  if (window.TAJ_DECK) { for (let i = 0; i < TAJ_DECK.length; i++) if (TAJ_DECK[i][0] === text) { idx = i; break; } }
  if (idx >= 0) soundCache.load('snd/cards/taj/' + (idx + 1) + '.mp3').then(a => {
    if (a) { a.volume = 1; a.currentTime = 0; a.play().catch(() => {}); } else tts(text);
  });
  else tts(text);
}
// 5) Карты действий: окно открылось → город читает
async function useChip(type) {
  if (!S || S.isBusy || S.isOver) return;
  const p = S.players[S.cur];
  if (p.chips[type] <= 0 || p.usedChip) return;
  S.isBusy = true; p.chips[type]--; p.usedChip = true; S.lastChip = p;
  const deck = S.decks[type]; const card = deck.shift(); deck.push(card);
  playSound('cards', type);
  let text = '', effect = '', target = null;
  const cardText = card[0], targetCode = card[1], val1 = card[2], val2 = card[3];
  if (type === 'witness') { target = pickTarget(p, targetCode); target.suspect.add(1); p.coins += val1; text = cardText; effect = '+1 подозрение ' + target.name + ', +' + val1 + ' монет'; }
  else if (type === 'alibi') { p.suspect.add(-1); p.coins += 400; p.pos = 0; text = cardText; effect = '−1 подозрение, +400 монет, на Старт'; }
  else if (type === 'ulika' || type === 'dopros') { target = pickTarget(p, targetCode); target.suspect.add(val1); p.coins = Math.max(0, p.coins - val2); text = cardText; effect = '+' + val1 + ' ' + target.name + ', −' + val2 + ' монет'; }
  else if (type === 'zasada') { target = pickTarget(p, targetCode); target.suspect.add(val1); target.fear.add(1); p.coins = Math.max(0, p.coins - val2); S.lastZas = { source: p, target: target }; text = cardText; effect = '+' + val1 + ' ' + target.name + ', −' + val2 + ' монет'; }
  speakCard88(type, text); // 🎙 окно открылось — город зачитывает
  if (!p.isBot) await showModal('<h2>' + type.toUpperCase() + '</h2><p>«' + text + '»</p><p style="color:#d4af37">' + effect + '</p><button data-v="ok">OK</button>');
  log('🃏 ' + p.name + ': ' + text);
  S.isBusy = false;
  updateUI();
}
// 6) Тайник: так же
async function handleStash(p) {
  const card = S.decks.taj.shift(); S.decks.taj.push(card);
  const text = card[0], effects = card[1];
  playSound('cards', 'taj');
  speakTaj88(text); // 🎙
  if (!p.isBot) await showModal('<h2>🟣 ТАЙНИК</h2><p>«' + text + '»</p><button data-v="ok">OK</button>');
  applyEffects(p, effects);
  log('🟣 ' + p.name + ': ' + text);
  updateUI();
}
// 7) Мораль: так же
function playMorCard(i) {
  if (!S || S.isBusy || S.isOver) return;
  const p = S.players[S.cur];
  if (p.isBot || p.morUsed || !p.morals[i]) return;
  const card = p.morals.splice(i, 1)[0];
  S.morDiscard.push(card); p.morUsed = true;
  playMoralSound(card); // 🎙 окно открылось — город читает
  applyMoral(p, card).then(() => { log('🎭 ' + p.name + ' сыграл «' + card.name + '»'); updateUI(); });
}
// ============================================
// ДОПОЛНЕНИЕ v89 — ХОВЕР НЕМЕЙ, МОРАЛЬ ЧИТАЕТ ТЕКСТ (НЕ ХАРАКТЕРИСТИКИ)
// ============================================
// 1) Флаг «на чём курсор» (дублирую на всякий случай) + сброс при клике
document.addEventListener('mouseover', e => {
  const hc = e.target.closest ? e.target.closest('.hcard') : null;
  window.MM_HOVERCARD = hc ? hc.dataset.kind : null;
}, true);
document.addEventListener('click', () => { window.MM_HOVERCARD = null; }, true);
// 2) tts-калитка: пока курсор на картах руки (кроме скинов) — робот молчит
const _tts89 = window.tts;
window.tts = function (text) {
  if (window.MM_HOVERCARD && window.MM_HOVERCARD !== 'skin') return;
  return _tts89(text);
};
// 3) Мораль: голос читает ИМЯ + ТЕКСТ (как на скрине), а не характеристики
function playMoralSound(c) {
  soundCache.load('snd/morals/' + c.id + '.mp3').then(a => {
    if (a) { a.volume = 1; a.currentTime = 0; a.play().catch(() => {}); }
    else {
      const idx = (window.MORAL_DECK ? MORAL_DECK.findIndex(m => m.id === c.id) : -1);
      const phrase = () => tts(c.name + '. ' + c.desc); // «Жертва. Возьмите всё. Только дайте мне шанс начать сначала.»
      if (idx >= 0) soundCache.load('snd/cards/mor/' + (idx + 1) + '.mp3').then(b => {
        if (b) { b.volume = 1; b.currentTime = 0; b.play().catch(() => {}); }
        else phrase();
      });
      else phrase();
    }
  });
}
// ============================================
// ДОПОЛНЕНИЕ v90 — СКИНЫ БЕЗ ОЗВУЧКИ, МОРАЛЬ ЗА КРУГ, ЖЕТОНЫ 1/ХОД
// ============================================
// 1) Рука немая при наведении (включая скины)
const _tts90 = window.tts;
window.tts = function (text) {
  if (window.MM_HOVERCARD) return; // курсор на карте руки — тишина
  return _tts90(text);
};
// 2) Прошёл круг → выбор доп. карты морали (не только при посадке на Старт)
async function rollDice() {
  if (!S || S.isBusy || S.isOver) return;
  S.isBusy = true;
  const p = S.players[S.cur];
  document.getElementById('rollBtn').disabled = true;
  playSound('effects', 'dice');
  for (let i = 0; i < 10; i++) { setDiceFace(U.random(1, 6), false); await U.sleep(70); }
  let steps = U.random(1, 6);
  if (p.fatigue.isMax()) steps = Math.max(1, steps - 2);
  steps += p.adrenaline.get();
  if (p.double) { steps = Math.min(12, steps * 2); p.double = false; }
  setDiceFace(Math.min(steps, 6), true);
  log('🎲 ' + p.name + ' бросил ' + steps);
  let passedStart = false;
  for (let i = 0; i < steps; i++) {
    p.pos = (p.pos + 1) % GAME_CONFIG.boardSize;
    if (p.pos === 0) { passedStart = true; p.coins += 200 + p.income; p.suspect.add(-1); p.connections.add(1); p.reputation.add(1); p.fatigue.add(-1); log('🟢 ' + p.name + ' на Старте (+' + (200 + p.income) + ' монет)'); }
    renderTokens(); await U.sleep(150);
  }
  if (passedStart) await morOffer(p); // 🎭 круг пройден — выбор из трёх
  const meet = S.players.find(pl => pl !== p && pl.pos === p.pos);
  if (meet) { log('👥 ' + p.name + ' встретил ' + meet.name); playSound('effects', 'meet'); p.fear.add(1); p.adrenaline.add(1); if (!p.isBot) await showModal('<h2>👥 Встреча!</h2><p>' + p.name + ' и ' + meet.name + ' на одной клетке!</p><button data-v="ok">OK</button>'); }
  await land(p);
  S.isBusy = false;
  document.getElementById('endBtn').disabled = false;
  updateUI();
}
// 3) Жетоны: 1 за раунд + только добавленные картами/Голосом улиц
async function investigationPhase() {
  log('⚖️ Фаза расследования');
  for (const p of S.players) {
    if (p.tokens <= 0 || p.muted || p.discred || p.blocked) continue;
    const gain = (p._tokRound != null) ? Math.max(0, p.tokens - p._tokRound) : 0;
    const limit = 1 + gain; // базовый 1 + бонусные жетоны
    let spent = 0;
    while (p.tokens > 0 && spent < limit) {
      const targets = S.players.filter(pl => pl !== p && pl.suspect.get() < 15);
      if (!targets.length) break;
      if (p.isBot) { const t = U.randomChoice(targets); t.suspect.add(1); p.tokens--; spent++; log('👁 ' + p.name + ' → +1 ' + t.name); }
      else {
        let html = '<h2>⚖️ ' + p.name + '</h2><p>Жетонов: ' + p.tokens + ' · можно потратить: ' + (limit - spent) + '</p><div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">';
        targets.forEach((t, i) => { html += '<button data-v="' + i + '" style="padding:6px;background:#222;border:1px solid ' + t.color + ';color:#fff;border-radius:4px">' + t.name + ' (' + t.suspect.get() + ')</button>'; });
        html += '</div><button data-v="skip">Готово</button>';
        const ch = await showModal(html);
        if (ch === 'skip') break;
        const t = targets[parseInt(ch)]; if (t) { t.suspect.add(1); p.tokens--; spent++; log('👁 ' + p.name + ' → +1 ' + t.name); }
      }
    }
    if (p.tokens > 0 && spent >= limit) log('🎟 ' + p.name + ': лимит жетонов за раунд — 1 (+бонусные). Осталось ' + p.tokens);
  }
  const sheriff = S.players.find(p => p.role === ROLES.SHERIFF && !p.discred && !p.isBot);
  if (sheriff) {
    const targets = S.players.filter(p => p !== sheriff && p.suspect.get() >= 10);
    if (targets.length) {
      let html = '<h2>🚔 Шериф ' + sheriff.name + '</h2><div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">';
      targets.forEach((t, i) => { html += '<button data-v="' + i + '" style="padding:6px;background:#222;border:1px solid #ff5252;color:#fff;border-radius:4px">' + t.name + '</button>'; });
      html += '</div><button data-v="skip">Пропустить</button>';
      const ch = await showModal(html);
      if (ch !== 'skip') {
        const acc = targets[parseInt(ch)]; let votes = 0;
        for (const v of S.players) {
          if (v === sheriff || v.isBot || v.muted || v.discred) continue;
          const vote = await showModal('<h2>🗳 ' + v.name + '</h2><p>Виновен ' + acc.name + '?</p><button data-v="yes">ДА</button><button data-v="no">НЕТ</button>');
          if (vote === 'yes') votes++;
        }
        if (votes > S.players.length / 2) await accuseOpen(); else log('🗳 Обвинение отклонено');
      }
    }
  }
  S.players.forEach(p => { p.blocked = false; p._tokRound = p.tokens; });
}
// ============================================
// ДОПОЛНЕНИЕ v91 — ОДИН БРОСОК (НАМЕРТВО) + ДУЭЛЬ-ВИТРИНА ПРИ ВСТРЕЧЕ
// ============================================
function skinStats91(p) {
  let dmg = 0, def = 0;
  const rows = p.skins.map(id => {
    const s = (window.SKINS && SKINS[id]) || {};
    dmg += s.damage || 0; def += s.defense || 0;
    return '<div class="md-skin"><span>' + (s.name || id) + '</span><span>⚔️' + (s.damage || 0) + ' 🛡' + (s.defense || 0) + '</span></div>';
  });
  return { rows, dmg, def };
}
async function showMeetDuel(a, b) {
  const A = skinStats91(a), B = skinStats91(b);
  await showModal('<h2>⚔️ ВСТРЕЧА НА КЛЕТКЕ!</h2><p style="text-align:center;opacity:.7">Взгляды скрестились… город замер.</p>' +
    '<div style="display:flex;gap:12px;justify-content:center;align-items:stretch;flex-wrap:wrap">' +
    '<div class="md-col" style="border-color:' + a.color + '"><h3 style="color:' + a.color + '">' + a.name + '</h3>' +
    (A.rows.join('') || '<div class="md-skin"><span>нет скинов</span><span>—</span></div>') +
    '<div class="md-total">⚔️ ' + A.dmg + ' · 🛡 ' + A.def + ' · 💪 ' + calculatePower(a) + '</div></div>' +
    '<div class="md-vs">VS</div>' +
    '<div class="md-col" style="border-color:' + b.color + '"><h3 style="color:' + b.color + '">' + b.name + '</h3>' +
    (B.rows.join('') || '<div class="md-skin"><span>нет скинов</span><span>—</span></div>') +
    '<div class="md-total">⚔️ ' + B.dmg + ' · 🛡 ' + B.def + ' · 💪 ' + calculatePower(b) + '</div></div>' +
    '</div><button data-v="ok">😮 Разойтись</button>');
}
async function rollDice() {
  if (!S || S.isBusy || S.isOver) return;
  const mark = S.round + '-' + S.cur;
  if (S.rollMark === mark) return; // 🎲 ОДИН бросок за ход — намертво
  S.rollMark = mark;
  S.isBusy = true;
  const p = S.players[S.cur];
  document.getElementById('rollBtn').disabled = true;
  playSound('effects', 'dice');
  for (let i = 0; i < 10; i++) { setDiceFace(U.random(1, 6), false); await U.sleep(70); }
  let steps = U.random(1, 6);
  if (p.fatigue.isMax()) steps = Math.max(1, steps - 2);
  steps += p.adrenaline.get();
  if (p.double) { steps = Math.min(12, steps * 2); p.double = false; }
  setDiceFace(Math.min(steps, 6), true);
  log('🎲 ' + p.name + ' бросил ' + steps);
  let passedStart = false;
  for (let i = 0; i < steps; i++) {
    p.pos = (p.pos + 1) % GAME_CONFIG.boardSize;
    if (p.pos === 0) { passedStart = true; p.coins += 200 + p.income; p.suspect.add(-1); p.connections.add(1); p.reputation.add(1); p.fatigue.add(-1); log('🟢 ' + p.name + ' на Старте (+' + (200 + p.income) + ' монет)'); }
    renderTokens(); await U.sleep(150);
  }
  if (passedStart) await morOffer(p); // круг пройден — выбор морали
  const meet = S.players.find(pl => pl !== p && pl.pos === p.pos);
  if (meet) {
    log('👥 ' + p.name + ' встретил ' + meet.name);
    playSound('effects', 'meet');
    p.fear.add(1); p.adrenaline.add(1);
    if (!(p.isBot && meet.isBot)) await showMeetDuel(p, meet); // 🥊 витрина скинов
  }
  await land(p);
  S.isBusy = false;
  document.getElementById('endBtn').disabled = false;
  updateUI();
}
// ============================================
// ДОПОЛНЕНИЕ v92 — ДУЭЛЬ С ВЕРДИКТОМ + ПОДСВЕТКА КУПЛЕННЫХ СКИНОВ
// ============================================
function duelCol92(p, pow, isW, isL, ch) {
  let dmg = 0, def = 0;
  const rows = p.skins.map(id => {
    const s = (window.SKINS && SKINS[id]) || {};
    dmg += s.damage || 0; def += s.defense || 0;
    return '<div class="md-skin"><span>' + (s.name || id) + '</span><span>⚔️' + (s.damage || 0) + ' 🛡' + (s.defense || 0) + '</span></div>';
  }).join('') || '<div class="md-skin"><span>нет скинов</span><span>—</span></div>';
  const verdict = isW ? '<div class="md-verdict win">🏆 ПОБЕДИТЕЛЬ</div>' : isL ? '<div class="md-verdict lose">💀 ПРОИГРАВШИЙ</div>' : '<div class="md-verdict draw">🤝 НИЧЬЯ</div>';
  return '<div class="md-col" style="border-color:' + p.color + (isW ? ';box-shadow:0 0 20px rgba(255,213,79,.45)' : isL ? ';opacity:.9' : '') + '">' +
    '<h3 style="color:' + p.color + '">' + p.name + '</h3>' + verdict + rows +
    '<div class="md-total">⚔️ ' + dmg + ' · 🛡 ' + def + ' · 💪 ' + pow + '</div>' +
    (ch && ch.length ? '<div class="md-ch">' + ch.map(x => '<span>' + x + '</span>').join('') + '</div>' : '') + '</div>';
}
async function showMeetDuel(a, b) {
  const pa = calculatePower(a), pb = calculatePower(b);
  let winner = null, loser = null;
  if (pa > pb) { winner = a; loser = b; } else if (pb > pa) { winner = b; loser = a; }
  const ch = {};
  if (winner) {
    // ПОБЕДИТЕЛЬ (баланс по твоему ТЗ)
    winner.reputation.add(-1); winner.fear.add(-1); winner.suspect.add(1); winner.fatigue.add(1); winner.adrenaline.add(1);
    ch[winner.index] = ['⭐ −1', '😨 −1', '🚨 +1', '😫 +1', '⚡ +1'];
    // ПРОИГРАВШИЙ
    loser.skipNext = true; loser.fear.add(1); loser.fatigue.add(-1); loser.suspect.add(-1);
    ch[loser.index] = ['⏭ пропустит ход', '😨 +1', '😫 −1', '🚨 −1'];
    // скин можно потерять в дуэли
    if (loser.skins.length) {
      const sid = loser.skins.splice(U.random(0, loser.skins.length - 1), 1)[0];
      const sk = (window.SKINS && SKINS[sid]) || {};
      loser.damage = Math.max(0, loser.damage - (sk.damage || 0));
      loser.defense = Math.max(0, loser.defense - (sk.defense || 0));
      ch[loser.index].push('🗡 потерял: ' + (sk.name || sid));
      log('🗡 ' + loser.name + ' потерял скин «' + (sk.name || sid) + '» в стычке');
    }
    log('⚔️ ' + winner.name + ' победил в стычке: ' + loser.name);
  } else log('⚖️ Ничья в стычке: ' + a.name + ' и ' + b.name);
  updateUI();
  await showModal('<h2>⚔️ ВСТРЕЧА НА КЛЕТКЕ!</h2>' +
    '<p style="text-align:center;opacity:.7">' + (winner ? 'Город видел стычку… и запомнил её.' : 'Взгляды скрестились… никто не уступил.') + '</p>' +
    '<div style="display:flex;gap:12px;justify-content:center;align-items:stretch;flex-wrap:wrap">' +
    duelCol92(a, pa, winner === a, loser === a, ch[a.index]) +
    '<div class="md-vs">VS</div>' +
    duelCol92(b, pb, winner === b, loser === b, ch[b.index]) +
    '</div><button data-v="ok">😮 Разойтись</button>');
}
// Проигравший пропускает ход
async function endTurn() {
  if (!S || S.isBusy || S.isOver) return;
  const p = S.players[S.cur];
  p.fatigue.add(1); p.adrenaline.add(-1); p.usedChip = false; p.morUsed = false;
  document.getElementById('endBtn').disabled = true;
  document.getElementById('rollBtn').disabled = false;
  let guard = 0;
  while (guard++ < S.players.length * 2 + 2) {
    S.cur = (S.cur + 1) % S.players.length;
    if (S.cur === 0) { S.round++; updateTime(); await investigationPhase(); if (S.roundLimit > 0 && S.round > S.roundLimit) { checkWin(); return; } }
    const next = S.players[S.cur];
    if (next.jail > 0) { next.jail--; next.jailStreak++; if (next.role === ROLES.MURDERER && next.jailStreak >= 5) { win('detectives', '🚔 Убийца арестован!'); return; } log('⛓ ' + next.name + ' в полиции'); continue; }
    next.jailStreak = 0;
    if (next.skipNext) { next.skipNext = false; log('⏭ ' + next.name + ' пропускает ход — последствия стычки'); continue; }
    break;
  }
  if (S.voiceEnabled) { S.voiceCounter++; if (S.voiceCounter >= U.random(2, 5)) { S.voiceCounter = 0; await voiceOfTheStreets(); } }
  updateUI();
  if (S.players[S.cur].isBot && !S.isOver) setTimeout(botTurn, 1000);
}
// Подсветка купленных клеток: чей скин — того и цвет
function paintOwnedCells() {
  if (!S) return;
  for (let idx = 0; idx < 32; idx++) {
    const d = getCellData(idx);
    const cell = document.getElementById('cell_' + idx);
    if (!cell || d.type !== 'skin') continue;
    const owner = S.players.find(pl => pl.skins.includes(d.skinId));
    if (owner) {
      cell.style.boxShadow = '0 0 0 3px ' + owner.color + ', 0 0 16px ' + owner.color;
      let tag = cell.querySelector('.own-tag');
      if (!tag) { tag = document.createElement('span'); tag.className = 'own-tag'; cell.appendChild(tag); }
      tag.style.background = owner.color;
      tag.textContent = owner.name.charAt(0).toUpperCase();
      tag.title = 'Куплено: ' + owner.name;
    } else {
      cell.style.boxShadow = '';
      const tag = cell.querySelector('.own-tag'); if (tag) tag.remove();
    }
  }
}
const _ui92 = window.updateUI;
window.updateUI = function () { _ui92(); paintOwnedCells(); };
// ============================================
// ДОПОЛНЕНИЕ v94 — ДУЭЛЬ: «ПРИНЯТЬ ИСХОД» ИЛИ «РАЗОЙТИСЬ» (ПОЩАДА)
// ============================================
function duelCol94(p, pow, isW, isL, ch) {
  let dmg = 0, def = 0;
  const rows = p.skins.map(id => {
    const s = (window.SKINS && SKINS[id]) || {};
    dmg += s.damage || 0; def += s.defense || 0;
    return '<div class="md-skin"><span>' + (s.name || id) + '</span><span>⚔️' + (s.damage || 0) + ' 🛡' + (s.defense || 0) + '</span></div>';
  }).join('') || '<div class="md-skin"><span>нет скинов</span><span>—</span></div>';
  const verdict = isW ? '<div class="md-verdict win">🏆 ПОБЕДИТЕЛЬ</div>' : isL ? '<div class="md-verdict lose">💀 ПРОИГРАВШИЙ</div>' : '<div class="md-verdict draw">🤝 НИЧЬЯ</div>';
  return '<div class="md-col" style="border-color:' + p.color + (isW ? ';box-shadow:0 0 20px rgba(255,213,79,.45)' : isL ? ';opacity:.9' : '') + '">' +
    '<h3 style="color:' + p.color + '">' + p.name + '</h3>' + verdict + rows +
    '<div class="md-total">⚔️ ' + dmg + ' · 🛡 ' + def + ' · 💪 ' + pow + '</div>' +
    (ch && ch.length ? '<div class="md-ch">' + ch.map(x => '<span>' + x + '</span>').join('') + '</div>' : '') + '</div>';
}
async function showMeetDuel(a, b) {
  const pa = calculatePower(a), pb = calculatePower(b);
  let winner = null, loser = null;
  if (pa > pb) { winner = a; loser = b; } else if (pb > pa) { winner = b; loser = a; }
  // 1) окно выбора: драться или пощадить
  const ch = await showModal('<h2>⚔️ ВСТРЕЧА НА КЛЕТКЕ!</h2>' +
    '<p style="text-align:center;opacity:.7">' + (winner ? 'Сила против силы — город замер… Решай!' : 'Взгляды скрестились… никто не уступил.') + '</p>' +
    '<div style="display:flex;gap:12px;justify-content:center;align-items:stretch;flex-wrap:wrap">' +
    duelCol94(a, pa, winner === a, loser === a, null) + '<div class="md-vs">VS</div>' + duelCol94(b, pb, winner === b, loser === b, null) + '</div>' +
    '<button data-v="fight">⚔️ Принять исход</button><button data-v="spare">😮 Разойтись (пощадить)</button>');
  // 2а) пощада — без последствий
  if (ch === 'spare') { log('😮 ' + a.name + ' и ' + b.name + ' разошлись мирно — пощада в этом городе редкость'); return; }
  // 2б) ничья
  if (!winner) { log('⚖️ Ничья в стычке: ' + a.name + ' и ' + b.name); await showModal('<h2>⚖️ НИЧЬЯ</h2><p>Силы равны… оба разошлись, стиснув зубы.</p><button data-v="ok">OK</button>'); return; }
  // 2в) принять исход — применяем последствия
  winner.reputation.add(-1); winner.fear.add(-1); winner.suspect.add(1); winner.fatigue.add(1); winner.adrenaline.add(1);
  const wCh = ['⭐ −1', '😨 −1', '🚨 +1', '😫 +1', '⚡ +1'];
  loser.skipNext = true; loser.fear.add(1); loser.fatigue.add(-1); loser.suspect.add(-1);
  const lCh = ['⏭ пропустит ход', '😨 +1', '😫 −1', '🚨 −1'];
  if (loser.skins.length) {
    const sid = loser.skins.splice(U.random(0, loser.skins.length - 1), 1)[0];
    const sk = (window.SKINS && SKINS[sid]) || {};
    loser.damage = Math.max(0, loser.damage - (sk.damage || 0));
    loser.defense = Math.max(0, loser.defense - (sk.defense || 0));
    lCh.push('🗡 потерял: ' + (sk.name || sid));
    log('🗡 ' + loser.name + ' потерял скин «' + (sk.name || sid) + '» в стычке');
  }
  log('⚔️ ' + winner.name + ' победил в стычке: ' + loser.name);
  updateUI();
  // 3) окно с вердиктом и изменениями
  await showModal('<h2>🏆 ИСХОД СТЫЧКИ</h2>' +
    '<div style="display:flex;gap:12px;justify-content:center;align-items:stretch;flex-wrap:wrap">' +
    duelCol94(winner, calculatePower(winner), true, false, wCh) +
    duelCol94(loser, calculatePower(loser), false, true, lCh) + '</div>' +
    '<button data-v="ok">😮 Что ж…</button>');
}
// ============================================
// ДОПОЛНЕНИЕ v95 — МУЗЫКА К ДУЭЛЯМ (стычка + финальная)
// ============================================
let duelAudio = null, duelDucked = null;
function duelMusicStart() {
  duelMusicStop();
  const cands = ['snd/ui/duel.mp3', 'snd/music/duel.mp3'];
  (async () => {
    for (const p of cands) {
      const a = await soundCache.load(p);
      if (a) {
        duelAudio = a;
        a.loop = true; a.volume = .8; a.currentTime = 0;
        a.play().catch(() => {});
        // основную музыку — в тень на время дуэли
        if (window.musicPlayer && musicPlayer.audio) {
          duelDucked = musicPlayer.audio.volume;
          musicPlayer.audio.volume = Math.max(0, duelDucked * .3);
        }
        return;
      }
    }
  })();
}
function duelMusicStop() {
  if (duelAudio) { duelAudio.pause(); duelAudio.currentTime = 0; duelAudio = null; }
  if (duelDucked != null && window.musicPlayer && musicPlayer.audio) { musicPlayer.audio.volume = duelDucked; duelDucked = null; }
}
// Стычка на клетке
const _md95 = window.showMeetDuel;
window.showMeetDuel = async function (a, b) {
  duelMusicStart();
  try { return await _md95(a, b); } finally { duelMusicStop(); }
};
// Финальная дуэль
const _fd95 = window.finalDuel;
window.finalDuel = async function () {
  duelMusicStart();
  try { return await _fd95(); } finally { duelMusicStop(); }
};
// ============================================
// ДОПОЛНЕНИЕ v96 — ПОЯСНЕНИЯ К СТАТАМ + ВЕЖЛИВЫЕ ЗВУКИ КЛЕТОК
// ============================================
// --- 1) Тултип характеристик ---
const STAT_HELP = [
  { n: '💰 МОНЕТЫ', what: 'Твоя наличность.', eff: 'Покупка скинов, оплата Больницы/Психолога.', fill: '+ Старт (+200 и доход), клетка «Монета», карты. − покупки, штрафы, ложное обвинение.' },
  { n: '🚨 ПОДОЗРЕНИЯ', what: 'Шкала розыска 0–15.', eff: '10+ — тебя можно обвинить; 15 — ФИНАЛЬНАЯ ДУЭЛЬ.', fill: '− Старт, Алиби, Больница. + карты действий, жетоны расследования, Голос Улиц.' },
  { n: '🎟 ЖЕТОНЫ', what: 'Твои «голоса детектива» (3 на старте).', eff: 'Тратятся в расследовании: +1 подозрение любому игроку. Лимит: 1 за раунд + бонусные.', fill: '+ магазин, тайники, Голос Улиц. − расследование.' },
  { n: '😫 УСТАЛОСТЬ', what: '0–5. Твоя выносливость.', eff: 'На максимуме бросок кубика −2; снижает Силу (÷2).', fill: '+ каждый ход, стычки, события. − Старт (−1), Больница (−2), Спортзал (−1).' },
  { n: '😨 СТРАХ', what: '0–5. Твои нервы.', eff: '−1 к Силе за очко; при 5 закрывается Тоннель (уедешь в Полицию).', fill: '+ встречи, Преступление, Голос Улиц. − Больница (−2), Психолог (−1).' },
  { n: '⭐ РЕПУТАЦИЯ', what: 'Доброе имя, от −5 до +5.', eff: '+1 к Силе за каждые 2 очка; отрицательная — слабость в дуэли.', fill: '+ Старт, покупка скинов, Психолог. − ложное обвинение, Голос Улиц.' },
  { n: '⚡ АДРЕНАЛИН', what: '0–3. Твой запал.', eff: '+1 к кубику и +1 к Силе за очко.', fill: '+ встречи, Преступление, Спортзал. − сгорает 1 в конце каждого хода.' },
  { n: '🤝 СВЯЗИ', what: '0–3. Знакомства в городе.', eff: 'Входят в сеты Коллекционера, дают уважение и доход.', fill: '+ Старт, некоторые карты. Почти не тратятся.' },
  { n: '🗡 СИЛА', what: 'Итог для стычек и дуэлей.', eff: 'Считается: оружие + защита + репутация÷2 + адреналин − усталость÷2 − страх + бонусы роли, сетов и времени суток.', fill: 'Растёт от скинов, сетов, адреналина и репутации; падает от усталости и страха.' }
];
let statTipEl = null;
function hideStatTip() { if (statTipEl) statTipEl.classList.remove('on'); }
document.addEventListener('mouseover', e => {
  const item = e.target.closest('.stat-item');
  if (!item) { hideStatTip(); return; }
  const ps = document.getElementById('playerStats');
  if (!ps) return;
  const idx = [...ps.querySelectorAll('.stat-item')].indexOf(item);
  const h = STAT_HELP[idx];
  if (!h) return;
  if (window.tipEl) tipEl.classList.remove('on'); // старая всплывашка не мешает
  if (!statTipEl) { statTipEl = document.createElement('div'); statTipEl.id = 'statTip'; document.body.appendChild(statTipEl); }
  statTipEl.innerHTML = '<div class="st-head">' + h.n + '</div>' +
    '<div class="st-row"><b>Что это:</b> ' + h.what + '</div>' +
    '<div class="st-row"><b>На что влияет:</b> ' + h.eff + '</div>' +
    '<div class="st-row"><b>Как меняется:</b> ' + h.fill + '</div>';
  const r = item.getBoundingClientRect();
  statTipEl.style.left = Math.max(8, Math.min(window.innerWidth - 300, r.left - 300)) + 'px';
  statTipEl.style.top = Math.max(8, r.top - 20) + 'px';
  statTipEl.classList.add('on');
});
// --- 2) Вежливые звуки клеток ---
let ambGen96 = 0;
function stopAmbient() {
  ambGen96++; // инвалидирует все «висящие» попытки запуска
  if (ambientAudio) { ambientAudio.pause(); ambientAudio.currentTime = 0; ambientAudio = null; }
}
async function showCellTip(idx, cellEl) {
  const d = getCellData(idx);
  const tip = ensureTip();
  clearTimeout(tipHideT);
  stopAmbient();
  clearTimeout(ambientTimer);
  const gen = ambGen96;
  const isSpecial = d.type !== 'skin' && d.type !== 'coin';
  let imgPath = null;
  if (d.skinId && window.SKINS && SKINS[d.skinId] && window.getSkinImage) imgPath = getSkinImage(d.skinId, SKINS[d.skinId].category);
  if (!imgPath && d.img) imgPath = d.img;
  let owner = '';
  if (d.skinId && S) { const o = S.players.find(p => p.skins.includes(d.skinId)); if (o) owner = '👑 Владелец: ' + o.name; }
  if (isSpecial) {
    tip.classList.add('big');
    tip.innerHTML = '<div class="tip-head">' + d.name + '</div><div class="tip-img">' + (CELL_EMO[d.type] || '❓') + '</div>' +
      '<div class="tip-effect">⚙️ ЧТО ДАЁТ: ' + (CELL_DESC[d.type] || '') + '</div>' +
      '<div class="tip-lore">' + (CELL_LORE[d.type] || '') + '</div>' +
      '<div class="tip-hint">🔊 короткий звук локации</div>';
    const amb = ASSETS.sounds.cells[d.type];
    if (amb && (!S || S.voiceEnabled)) {
      soundCache.load(amb).then(a => {
        if (!a || gen !== ambGen96) return; // курсор уже ушёл — не играем
        ambientAudio = a; a.loop = false; a.volume = 0.25; a.currentTime = 0;
        a.play().catch(() => {});
        ambientTimer = setTimeout(fadeAmbient, 1500); // ~1.5 сек и плавно в тишину
      });
    }
  } else {
    tip.classList.remove('big');
    tip.innerHTML = '<div class="tip-head">' + d.name + (d.price ? ' <span class="tip-price">· ' + d.price + '💰</span>' : '') + '</div>' +
      '<div class="tip-body"><div class="tip-img">' + (CELL_EMO[d.type] || '🗡') + '</div>' +
      '<div class="tip-info"><div class="tip-desc">' + (CELL_DESC[d.type] || '') + '</div>' + (owner ? '<div class="tip-owner">' + owner + '</div>' : '') + '</div></div>';
    const snd = d.type === 'coin' ? ASSETS.sounds.cells.coin : ASSETS.sounds.effects.hover;
    if (snd && (!S || S.voiceEnabled)) soundCache.play(snd, 0.15);
  }
  if (imgPath) imageCache.get(imgPath).then(im => { if (im) { const box = tip.querySelector('.tip-img'); if (box) box.innerHTML = '<img src="' + imgPath + '">'; } });
  const r = cellEl.getBoundingClientRect();
  tip.style.left = Math.min(window.innerWidth - 340, Math.max(8, r.right + 12)) + 'px';
  tip.style.top = Math.min(window.innerHeight - (isSpecial ? 500 : 180), Math.max(8, r.top - 10)) + 'px';
  tip.classList.add('on');
}
// Попадание на клетку: звук прерывается сам, не играет целиком
let cellSndEl96 = null, cellSndT96 = null;
function playCellSnd96(path) {
  stopAmbient();
  clearTimeout(cellSndT96);
  if (cellSndEl96) cellSndEl96.pause();
  soundCache.load(path).then(a => {
    if (!a) return;
    cellSndEl96 = a; a.loop = false; a.volume = .5; a.currentTime = 0;
    a.play().catch(() => {});
    cellSndT96 = setTimeout(() => {
      const el = a; let v = el.volume;
      const iv = setInterval(() => { v -= .06; if (v <= 0 || cellSndEl96 !== el) { clearInterval(iv); el.pause(); } else el.volume = v; }, 70);
    }, 1800);
  });
}
function playSound(category, key) {
  if (!S || !S.voiceEnabled) return;
  let path = '';
  if (category === 'effects') path = ASSETS.sounds.effects[key];
  else if (category === 'cells') path = ASSETS.sounds.cells[key];
  else if (category === 'cards') path = ASSETS.sounds.cards[key];
  else if (category === 'voice') path = ASSETS.sounds.voice[key];
  if (!path) return;
  if (category === 'cells') { playCellSnd96(path); return; }
  soundCache.play(path);
}
// ============================================
// ДОПОЛНЕНИЕ v98 — КАРТЫ ПО ЛОКАЦИЯМ + ТАЙМЕР ХОДА 1:00 + ТОЛТИП ВРЕМЕНИ
// ============================================
// 1) Карты действий — только на своих локациях
const CHIP_LOCS = {
  witness: ['psychologist', 'hospital'],
  alibi: ['psychologist', 'hospital'],
  ulika: ['tunnel', 'police', 'crime'],
  dopros: ['tunnel', 'police', 'crime'],
  zasada: ['tunnel', 'police', 'crime']
};
const CHIP_LOCS_NAMES = { psychologist: 'Психолог', hospital: 'Больница', tunnel: 'Тоннель', police: 'Полиция', crime: 'Преступление' };
async function useChip(type) {
  if (!S || S.isBusy || S.isOver) return;
  const p = S.players[S.cur];
  if (p.isBot) return;
  if (p.chips[type] <= 0 || p.usedChip) return;
  const need = CHIP_LOCS[type];
  const hereCell = getCellData(p.pos);
  if (need && need.indexOf(hereCell.type) === -1) {
    await showModal('<h2>🚫 Не то место</h2><p>Эта карта играется только на локациях: <b style="color:#ffd54f">' + need.map(n => CHIP_LOCS_NAMES[n]).join(', ') + '</b>. Ты сейчас: ' + (CHIP_LOCS_NAMES[hereCell.type] || hereCell.name) + '.</p><button data-v="ok">OK</button>');
    return;
  }
  S.isBusy = true; p.chips[type]--; p.usedChip = true; S.lastChip = p;
  const deck = S.decks[type]; const card = deck.shift(); deck.push(card);
  playSound('cards', type);
  let text = '', effect = '', target = null;
  const cardText = card[0], targetCode = card[1], val1 = card[2], val2 = card[3];
  if (type === 'witness') { target = pickTarget(p, targetCode); target.suspect.add(1); p.coins += val1; text = cardText; effect = '+1 подозрение ' + target.name + ', +' + val1 + ' монет'; }
  else if (type === 'alibi') { p.suspect.add(-1); p.coins += 400; p.pos = 0; text = cardText; effect = '−1 подозрение, +400 монет, на Старт'; }
  else if (type === 'ulika' || type === 'dopros') { target = pickTarget(p, targetCode); target.suspect.add(val1); p.coins = Math.max(0, p.coins - val2); text = cardText; effect = '+' + val1 + ' ' + target.name + ', −' + val2 + ' монет'; }
  else if (type === 'zasada') { target = pickTarget(p, targetCode); target.suspect.add(val1); target.fear.add(1); p.coins = Math.max(0, p.coins - val2); S.lastZas = { source: p, target: target }; text = cardText; effect = '+' + val1 + ' ' + target.name + ', −' + val2 + ' монет'; }
  if (S.voiceEnabled) {
    const base = { witness: WITNESS_DECK, alibi: ALIBI_DECK, ulika: ULIKA_DECK, dopros: DOPROS_DECK, zasada: ZASADA_DECK }[type];
    let idx = -1;
    if (base) { for (let i = 0; i < base.length; i++) if (base[i][0] === cardText) { idx = i; break; } }
    const tryType = () => soundCache.load('snd/cards/' + type + '.mp3').then(b => {
      if (b) { b.volume = 1; b.currentTime = 0; b.play().catch(() => {}); } else tts(text);
    });
    if (idx >= 0) soundCache.load('snd/cards/' + type + '/' + (idx + 1) + '.mp3').then(a => {
      if (a) { a.volume = 1; a.currentTime = 0; a.play().catch(() => {}); } else tryType();
    });
    else tryType();
  }
  await showModal('<h2>' + type.toUpperCase() + '</h2><p>«' + text + '»</p><p style="color:#d4af37">' + effect + '</p><button data-v="ok">OK</button>');
  log('🃏 ' + p.name + ': ' + text);
  S.isBusy = false;
  updateUI();
}
// Замочки на картах, если ты не на нужной локации
const _ui98 = window.updateUI;
window.updateUI = function () {
  _ui98();
  if (!S) return;
  const here = getCellData(S.players[S.cur].pos).type;
  document.querySelectorAll('.hcard[data-kind="chip"]').forEach(el => {
    const need = CHIP_LOCS[el.dataset.key];
    const locked = need && need.indexOf(here) === -1;
    el.classList.toggle('locked', !!locked);
    el.title = locked ? '🔒 Только: ' + need.map(n => CHIP_LOCS_NAMES[n]).join(', ') : '';
  });
};
// 2) Таймер хода 1:00 — слева от эмодзи времени, в стиле нуар-часов
let turnStart98 = 0, turnMark98 = '';
document.addEventListener('DOMContentLoaded', () => {
  const hc = document.querySelector('.header-center');
  if (!hc || document.getElementById('turnTimer')) return;
  const t = document.createElement('div');
  t.id = 'turnTimer'; t.className = 'time-display';
  hc.insertBefore(t, hc.firstChild);
  setInterval(() => {
    const el = document.getElementById('turnTimer');
    if (!el) return;
    if (!S || S.isOver) { el.innerHTML = '⏳ 1:00'; el.classList.remove('low'); return; }
    const mark = S.round + '-' + S.cur;
    if (mark !== turnMark98) { turnMark98 = mark; turnStart98 = Date.now(); }
    if (S.isBusy) turnStart98 += 1000; // окна открыты — таймер дышит вместе с тобой
    let left = 60 - Math.floor((Date.now() - turnStart98) / 1000);
    if (left <= 0) {
      const p = S.players[S.cur];
      turnStart98 = Date.now();
      if (!p.isBot && !S.isBusy) { log('⏰ ' + p.name + ': время вышло — ход завершается'); endTurn(); }
    }
    left = Math.max(0, left);
    el.innerHTML = '⏳ ' + Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0');
    el.classList.toggle('low', left <= 10);
  }, 1000);
});
// 3) Поясняющее окошко на эмодзи времени суток
let ttTimeEl = null;
function hideTTTime() { if (ttTimeEl) ttTimeEl.classList.remove('on'); }
function timeBonusText98() {
  const b = (window.TIME_BONUSES && S) ? TIME_BONUSES[S.timeOfDay] : null;
  if (!b) return '<div class="tt-row">Сейчас без бонусов.</div>';
  const names = { sheriff: '🚔 Шериф', murderer: '🔪 Убийца', civilian: '🕊 Мирный', cop: '🦹 Продажный коп' };
  const out = [];
  Object.keys(names).forEach(r => {
    const x = b[r]; if (!x) return;
    const seg = [];
    if (x.power) seg.push('💪+' + x.power);
    if (x.reputation) seg.push('⭐+' + x.reputation);
    if (x.suspect) seg.push('🚨+' + x.suspect);
    if (x.fear) seg.push('😨+' + x.fear);
    if (x.stealth) seg.push('🕶+' + x.stealth);
    if (seg.length) out.push('<div class="tt-row">' + names[r] + ': ' + seg.join(' ') + '</div>');
  });
  return out.join('') || '<div class="tt-row">Сейчас без бонусов.</div>';
}
document.addEventListener('mouseover', e => {
  const td = e.target.closest('.time-display');
  if (!td || !td.querySelector('#timeIcon')) { hideTTTime(); return; }
  if (!ttTimeEl) { ttTimeEl = document.createElement('div'); ttTimeEl.id = 'ttTime'; document.body.appendChild(ttTimeEl); }
  ttTimeEl.innerHTML = '<div class="tt-head">🌆 ВРЕМЯ ГОРОДА: ' + (window.TIME_NAMES && S ? TIME_NAMES[S.timeOfDay] : '') + '</div>' +
    '<div class="tt-row"><b>Что это:</b> город живёт: утро → день → вечер → ночь, смена каждые ' + (window.GAME_CONFIG ? GAME_CONFIG.timeChangeInterval : 4) + ' раунда.</div>' +
    '<div class="tt-row"><b>Зачем здесь:</b> время даёт бонусы РОЛЯМ — второе оружие после клинка.</div>' +
    '<div class="tt-row"><b>Бонусы сейчас:</b></div>' + timeBonusText98() +
    '<div class="tt-row">Проверяй перед дуэлями и обвинениями!</div>';
  const r = td.getBoundingClientRect();
  ttTimeEl.style.left = Math.max(8, Math.min(window.innerWidth - 320, r.left - 100)) + 'px';
  ttTimeEl.style.top = (r.bottom + 10) + 'px';
  ttTimeEl.classList.add('on');
});
// ============================================
// ДОПОЛНЕНИЕ v99 — НЕБОСКРЁБ (ПРИЛИВ СИЛ), ПАНИЧЕСКИЙ СТРАХ, ПОНЯТНЫЙ ТАЙНИК
// ============================================
// --- Пантический страх: выдать / снять ---
function applyPanic99(p) {
  p.panic = 2;
  p.fear.add(1); p.fatigue.add(1);
  log('😱 ' + p.name + ': ПАНИЧЕСКИЙ СТРАХ (+1 страх, +1 усталость). Снимут Больница/Психолог, иначе — 2 хода');
}
function curePanic99(p) {
  if (p.panic > 0) { p.panic = 0; p.fear.add(-1); p.fatigue.add(-1); log('💆 ' + p.name + ': панический страх снят'); }
}
// --- Человек-читаемый список эффектов тайника ---
function fxText99(fx) {
  if (!fx) return 'ничего';
  const out = [];
  if (fx.coins) out.push((fx.coins > 0 ? '+' : '') + fx.coins + ' 💰 монет');
  if (fx.suspect) out.push((fx.suspect > 0 ? '+' : '') + fx.suspect + ' 🚨 подозрения');
  if (fx.fatigue) out.push((fx.fatigue > 0 ? '+' : '') + fx.fatigue + ' 😫 усталости');
  if (fx.fear) out.push((fx.fear > 0 ? '+' : '') + fx.fear + ' 😨 страха');
  if (fx.reputation) out.push((fx.reputation > 0 ? '+' : '') + fx.reputation + ' ⭐ репутации');
  if (fx.adrenaline) out.push((fx.adrenaline > 0 ? '+' : '') + fx.adrenaline + ' ⚡ адреналина');
  if (fx.chips) out.push('🃏 карты: ' + fx.chips.join(', '));
  if (fx.stealth) out.push('🕶 скрытность +' + fx.stealth);
  if (fx.double) out.push('🎲 двойной бросок');
  if (fx.protect) out.push('🛡 защита');
  if (fx.clearSuspect) out.push('🧼 обнуление подозрений');
  return out.length ? out.join(' · ') : 'ничего';
}
// --- Бросок: +2 от прилива сил ---
async function rollDice() {
  if (!S || S.isBusy || S.isOver) return;
  const mark = S.round + '-' + S.cur;
  if (S.rollMark === mark) return;
  S.rollMark = mark;
  S.isBusy = true;
  const p = S.players[S.cur];
  document.getElementById('rollBtn').disabled = true;
  playSound('effects', 'dice');
  for (let i = 0; i < 10; i++) { setDiceFace(U.random(1, 6), false); await U.sleep(70); }
  let steps = U.random(1, 6);
  if (p.fatigue.isMax()) steps = Math.max(1, steps - 2);
  steps += p.adrenaline.get();
  if (p.roofDiceBonus) { steps += p.roofDiceBonus; log('🏙 Прилив сил: +' + p.roofDiceBonus + ' к кубику'); p.roofDiceBonus = 0; }
  if (p.double) { steps = Math.min(12, steps * 2); p.double = false; }
  setDiceFace(Math.min(steps, 6), true);
  log('🎲 ' + p.name + ' бросил ' + steps);
  let passedStart = false;
  for (let i = 0; i < steps; i++) {
    p.pos = (p.pos + 1) % GAME_CONFIG.boardSize;
    if (p.pos === 0) { passedStart = true; p.coins += 200 + p.income; p.suspect.add(-1); p.connections.add(1); p.reputation.add(1); p.fatigue.add(-1); log('🟢 ' + p.name + ' на Старте (+' + (200 + p.income) + ' монет)'); }
    renderTokens(); await U.sleep(150);
  }
  if (passedStart) await morOffer(p);
  const meet = S.players.find(pl => pl !== p && pl.pos === p.pos);
  if (meet) {
    log('👥 ' + p.name + ' встретил ' + meet.name);
    playSound('effects', 'meet');
    p.fear.add(1); p.adrenaline.add(1);
    if (!(p.isBot && meet.isBot) && window.showMeetDuel) await showMeetDuel(p, meet);
  }
  await land(p);
  S.isBusy = false;
  document.getElementById('endBtn').disabled = false;
  updateUI();
}
// --- Клетки: новые эффекты ---
async function land(p) {
  const cell = getCellData(p.pos);
  playSound('cells', cell.type);
  switch (cell.type) {
    case 'skin': await handleSkinCell(p, cell); break;
    case 'coin': { const c = U.random(50, 100); p.coins += c; log('🪙 ' + p.name + ' +' + c + ' монет'); } break;
    case 'stash': await handleStash(p); break;
    case 'shop': if (!p.isBot) await openShop(p); break;
    case 'tunnel':
      if (p.fear.get() < 5) { p.pos = 0; p.coins += 200; log('🚇 ' + p.name + ' ушёл на Старт'); }
      else { p.pos = 24; p.suspect.set(0); p.jail++; log('🚇 ' + p.name + ' → Полиция'); }
      applyPanic99(p);
      break;
    case 'police': p.suspect.set(0); p.jail++; p.fatigue.add(1); log('🚔 ' + p.name + ' в Полиции'); applyPanic99(p); break;
    case 'roof':
      p.vRoof = true;
      p.roofDiceBonus = 2;
      p.chips.witness = (p.chips.witness || 0) + 1;
      p.tempWitness = true;
      log('🏙 ' + p.name + ': ПРИЛИВ СИЛ! +2 к следующему броску и временный «Свидетель» (сгорит в конце хода)');
      if (!p.isBot) await showModal('<h2>🏙 НЕБОСКРЁБ</h2><p><b>Прилив сил:</b> +2 к следующему броску кубика и временная карта «Свидетель».</p><p style="color:#ff8a65">⚠️ Не сыграешь «Свидетеля» до конца хода — карта сгорит!</p><button data-v="ok">OK</button>');
      break;
    case 'crime': { p.vCrime = true; p.fear.add(1); p.adrenaline.add(1); const t = U.randomChoice(S.players.filter(pl => pl !== p)); if (t) { t.suspect.add(1); log('👣 ' + p.name + ' → +1 подозрение ' + t.name); } } break;
    case 'hospital': if (p.coins >= 50) { p.coins -= 50; p.fatigue.add(-2); p.fear.add(-2); log('🏥 ' + p.name + ' в Больнице'); } curePanic99(p); break;
    case 'psychologist': if (p.coins >= 30) { p.coins -= 30; p.fear.add(-1); p.reputation.add(1); log('🧠 ' + p.name + ' у Психолога'); } curePanic99(p); break;
    case 'gym': if (p.coins >= 40) { p.coins -= 40; p.fatigue.add(-1); p.adrenaline.add(1); log('💪 ' + p.name + ' в Спортзале'); } break;
  }
  if (p.suspect.get() >= 10 && p.pos !== 24 && !p.avoid) {
    if (!p.isBot) {
      const ch = await showModal('<h2>🚨 ' + p.suspect.get() + '+ подозрений!</h2><p>Заплатить 500 монет?</p><button data-v="pay">💰 Да</button><button data-v="go">🚔 В полицию</button>');
      if (ch === 'pay') { p.coins -= 500; p.avoid = true; } else { p.pos = 24; p.jail++; }
    } else { if (p.coins >= 500) { p.coins -= 500; p.avoid = true; } else { p.pos = 24; p.jail++; } }
  }
  if (p.suspect.isMax()) await finalDuel();
  updateUI();
}
// --- Конец хода: сгорание свидетеля, спад паники, сброс прилива ---
async function endTurn() {
  if (!S || S.isBusy || S.isOver) return;
  const p = S.players[S.cur];
  p.fatigue.add(1); p.adrenaline.add(-1); p.usedChip = false; p.morUsed = false;
  if (p.tempWitness) {
    p.tempWitness = false;
    if (p.chips.witness > 0) { p.chips.witness--; log('🔥 ' + p.name + ': временный «Свидетель» сгорел'); }
  }
  p.roofDiceBonus = 0;
  if (p.panic > 0) { p.panic--; if (p.panic === 0) log('😮‍💨 ' + p.name + ': панический страх прошёл сам'); }
  document.getElementById('endBtn').disabled = true;
  document.getElementById('rollBtn').disabled = false;
  let guard = 0;
  while (guard++ < S.players.length * 2 + 2) {
    S.cur = (S.cur + 1) % S.players.length;
    if (S.cur === 0) { S.round++; updateTime(); await investigationPhase(); if (S.roundLimit > 0 && S.round > S.roundLimit) { checkWin(); return; } }
    const next = S.players[S.cur];
    if (next.jail > 0) { next.jail--; next.jailStreak++; if (next.role === ROLES.MURDERER && next.jailStreak >= 5) { win('detectives', '🚔 Убийца арестован!'); return; } log('⛓ ' + next.name + ' в полиции'); continue; }
    next.jailStreak = 0;
    if (next.skipNext) { next.skipNext = false; log('⏭ ' + next.name + ' пропускает ход — последствия стычки'); continue; }
    break;
  }
  if (S.voiceEnabled) { S.voiceCounter++; if (S.voiceCounter >= U.random(2, 5)) { S.voiceCounter = 0; await voiceOfTheStreets(); } }
  updateUI();
  if (S.players[S.cur].isBot && !S.isOver) setTimeout(botTurn, 1000);
}
// --- Сыграл временного свидетеля — он не сгорит ---
const _uc99 = window.useChip;
window.useChip = async function (type) {
  const p = S && S.players[S.cur];
  const before = p ? p.chips.witness : 0;
  await _uc99(type);
  if (p && type === 'witness' && p.chips.witness < before) p.tempWitness = false;
};
// --- Тайник: теперь видно, ЧТО выпало ---
async function handleStash(p) {
  const card = S.decks.taj.shift(); S.decks.taj.push(card);
  const text = card[0], effects = card[1];
  playSound('cards', 'taj');
  if (!p.isBot) await showModal('<h2>🟣 ТАЙНИК</h2><p>«' + text + '»</p><p style="color:#ffd54f;font-weight:800">Что получишь: ' + fxText99(effects) + '</p><button data-v="ok">Забрать</button>');
  applyEffects(p, effects);
  log('🟣 ' + p.name + ': ' + text + ' → ' + fxText99(effects));
  updateUI();
  if (S.voiceEnabled) {
    let idx = -1;
    if (window.TAJ_DECK) { for (let i = 0; i < TAJ_DECK.length; i++) if (TAJ_DECK[i][0] === text) { idx = i; break; } }
    if (idx >= 0) soundCache.load('snd/cards/taj/' + (idx + 1) + '.mp3').then(a => { if (a) { a.volume = 1; a.currentTime = 0; a.play().catch(() => {}); } else tts(text); });
    else tts(text);
  }
}
// ============================================
// ДОПОЛНЕНИЕ v100 — ДОСЬЕ ПОКАЗЫВАЕТ ВСЕ ЭФФЕКТЫ (включая новые)
// ============================================
function renderDossier() {
  if (!S) return;
  const rp = document.querySelector('.right-panel');
  if (!rp) return;
  let box = document.getElementById('dossierPanel');
  if (!box) { box = document.createElement('div'); box.id = 'dossierPanel'; box.className = 'panel'; rp.appendChild(box); }
  const p = S.players[S.cur];
  const eff = [];
  if (p.stealth > 0) eff.push('🕶 скрытность ×' + p.stealth);
  if (p.protect) eff.push('🛡 защита');
  if (p.avoid) eff.push('💰 откуп');
  if (p.double) eff.push('⚡ двойной бросок');
  if (p.blocked) eff.push('🚫 блокирован');
  if (p.muted) eff.push('🔇 нем');
  if (p.panic > 0) eff.push('😱 панический страх (' + p.panic + ' х.)');
  if (p.roofDiceBonus) eff.push('🏙 прилив сил: +' + p.roofDiceBonus + ' к броску');
  if (p.tempWitness) eff.push('🔥 временный «Свидетель» — сгорит в конце хода');
  if (p.skipNext) eff.push('⏭ пропустит следующий ход');
  box.innerHTML = '<h3>🕵️ Досье: ' + p.name + '</h3>' +
    '<div class="dz-row"><span>Роль:</span><button id="dzRole" class="dz-btn">👁 показать</button><span id="dzRoleVal" style="display:none;color:#ffd54f;font-weight:800">' + (window.ROLE_LABELS ? ROLE_LABELS[p.role] : p.role) + '</span></div>' +
    '<div class="dz-row"><span>🧩 Сеты:</span><b>' + (p.sets.length ? p.sets.join(', ') : 'нет') + '</b></div>' +
    '<div class="dz-row"><span>✨ Эффекты:</span><b>' + (eff.length ? eff.join(' · ') : 'нет') + '</b></div>' +
    '<div class="dz-row"><span>💵 Доход на Старте:</span><b>+' + (200 + p.income) + '</b></div>';
  const b = box.querySelector('#dzRole');
  if (b) b.onclick = () => { const v = box.querySelector('#dzRoleVal'); const show = v.style.display === 'none'; v.style.display = show ? 'inline' : 'none'; b.textContent = show ? '🙈 скрыть' : '👁 показать'; };
}
// ============================================
// ДОПОЛНЕНИЕ v101 — ГОЛОС УЛИЦ РАССКАЗЫВАЕТ ПОДРОБНО (полные тексты законов)
// ============================================
if (window.RULE_DATA) {
  const ADD = [
    'Подробно: шкала подозрения 0–15. При 10+ игрока можно обвинить; ошибочное обвинение сжигает монеты обвинителя в ноль, лишает всех скинов и сажает на два хода. При 15 — финальная дуэль: шериф против убийцы, сила против силы, победитель и проигравший получают последствия. Убийца побеждает, если дожил до финала нераскрытым, или если шериф пять раз загремел в полицию.',
    'Подробно: Шериф — может обвинять и ведёт дуэль, днём зорче. Убийца — сила растёт ночью, побеждает тишиной и богатством. Мирный — выживает, а картами морали может стать даже убийцей или шерифом. Продажный коп — играет за себя, разоблачается при 10+ подозрений. Роли секретны: в локальной игре раскрываются по очереди с устройства, с QR — каждый сканирует свою.',
    'Подробно: бросок — один раз за ход. Усталость 5 режет бросок на −2, адреналин даёт +1, «прилив сил» с Небоскрёба +2 к следующему броску и временного «Свидетеля». Проход Старта: +200 и доход, −1 подозрение, выбор карты морали из трёх — и за каждый пройденный круг. Встреча на клетке: +1 страх, +1 адреналин и стычка — «Принять исход» или «Разойтись» (пощадить).',
    'Подробно: поднимают подозрения карты действий, жетоны расследования, Голос Улиц и преступления. Снижают: Старт, Алиби, Больница, карты прощения. При 10+ — выбор: заплатить 500 монет или в полицию. В расследовании тратится 1 жетон за раунд плюс бонусные жетоны, полученные картами и Голосом Улиц.',
    'Подробно: Свидетель и Алиби играются только на Психологе и в Больнице; Улика, Допрос и Засада — только на Тоннеле, Полиции и Преступлении. Одна карта за ход, озвучка звучит после применения. Засада запоминает обидчика — карта мести сработает по нему.',
    'Подробно: сыграть можно одну за ход, озвучка — после применения: город читает текст карты. Новая — на Старте и за пройденный круг, выбор из трёх. Наведи — карта перевернётся и покажет себя. Некоторые меняют роли: Совесть, Правда, Коррупция, Искупление, Отставка.',
    'Подробно: купленная клетка светится цветом владельца — видно, чьё оружие. В стычке проигравший может потерять случайный скин. Аренда чужой клетки — 30 монет владельцу. Сеты одного цвета дают бонусы к силе и защите — следи за коллекцией в досье.',
    'Подробно: смена каждые несколько раундов: утро → день → вечер → ночь. Бонусы действуют на роли: наведи курсор на эмодзи времени в шапке — окошко покажет текущие бонусы Шерифа, Убийцы, Мирного и Копа. Сила в дуэлях учитывает время суток — выбирай момент для стычек.',
    'Подробно: доход прибавляется на Старте. Больница 50 монет лечит усталость и страх и снимает панический страх, Психолог 30 — страх и тоже лечит панику, Спортзал 40 — усталость и адреналин. Тайник показывает в окне, что именно даст: монеты, карты, эффекты. Ошибка в обвинении — монеты в ноль, потеря скинов и два хода в полиции.'
  ];
  RULE_DATA.forEach((r, i) => { if (ADD[i] && r.d.indexOf('Подробно:') === -1) r.d += ' ' + ADD[i]; });
}
// ============================================
// ДОПОЛНЕНИЕ v103 — НАДЁЖНОЕ ОКНО ПРАВИЛ ПРИ НАВЕДЕНИИ (инлайн, не зависит от CSS)
// ============================================
let rp103 = null, rpIdx103 = -1, rpAud103 = null;
function rpStopVoice103() { if (rpAud103) { rpAud103.pause(); rpAud103 = null; } if (window.speechSynthesis) speechSynthesis.cancel(); }
function rpHide103() { rpIdx103 = -1; rpStopVoice103(); if (rp103) rp103.style.opacity = '0'; const old = document.getElementById('rulePopup'); if (old) old.classList.remove('on'); }
async function rpShow103(i) {
  const R = (window.RULE_DATA && RULE_DATA[i]) ? RULE_DATA[i] : { t: '', d: '' };
  if (window.hideRulePopup) { try { hideRulePopup(); } catch (e) {} } // глушим старое окно и его голос
  if (!rp103) {
    rp103 = document.createElement('div');
    rp103.style.cssText = 'position:fixed;z-index:370;left:50%;top:50%;transform:translate(-50%,-50%);width:min(880px,95vw);max-height:86vh;background:linear-gradient(160deg,#141a35,#0a0e20);border:3px solid #d4af37;border-radius:16px;box-shadow:0 0 40px rgba(212,175,55,.35),0 20px 60px rgba(0,0,0,.85);opacity:0;transition:opacity .2s;overflow:hidden;';
    document.body.appendChild(rp103);
  }
  rp103.innerHTML = '<div style="display:flex;gap:16px;padding:20px;max-height:86vh;box-sizing:border-box">' +
    '<div style="flex:0 0 300px;display:flex;flex-direction:column;gap:12px">' +
    '<div id="rp103voice" style="height:220px;border-radius:10px;border:2px solid rgba(212,175,55,.5);background:#000;display:flex;align-items:center;justify-content:center;font-size:60px;overflow:hidden">🕵️</div>' +
    '<div id="rp103media" style="flex:1;min-height:180px;border-radius:10px;border:1px solid rgba(212,175,55,.35);background:#000;display:flex;align-items:center;justify-content:center;color:#4a5570;font-size:10px;text-align:center;overflow:hidden">место под картинку / видео</div></div>' +
    '<div style="flex:1;min-width:0;display:flex;flex-direction:column">' +
    '<div style="color:#d4af37;font-size:26px;font-weight:900;letter-spacing:3px;margin-bottom:10px;text-shadow:0 0 12px rgba(212,175,55,.5)">' + R.t + '</div>' +
    '<div style="flex:1;overflow-y:auto;color:#dfe6ff;font-size:15px;line-height:1.7;padding-right:8px">' + R.d + '</div></div></div>';
  rp103.style.opacity = '1';
  (async () => { // аватар Голоса Улиц
    const cands = ['img/voice/voice.png', 'img/voice/hooded.png', 'img/voice/1.png'];
    for (const c of cands) { const im = await imageCache.get(c); if (im) { const b = document.getElementById('rp103voice'); if (b) b.innerHTML = '<img src="' + c + '" style="width:100%;height:100%;object-fit:cover">'; break; } }
  })();
  (async () => { // твой медиа-слот
    const box = document.getElementById('rp103media'); if (!box) return;
    const v = document.createElement('video');
    const okV = await new Promise(res => { v.onloadeddata = () => res(true); v.onerror = () => res(false); v.src = 'img/rules/' + i + '.mp4'; v.load(); });
    if (okV) { v.muted = true; v.loop = true; v.autoplay = true; v.playsInline = true; v.style.cssText = 'width:100%;height:100%;object-fit:cover'; box.innerHTML = ''; box.appendChild(v); return; }
    const im = await imageCache.get('img/rules/' + i + '.png');
    if (im) box.innerHTML = '<img src="img/rules/' + i + '.png" style="width:100%;height:100%;object-fit:cover">';
  })();
  rpStopVoice103(); // голос: твой mp3, нет — робот с подробным текстом
  const a = new Audio('snd/rules/' + i + '.mp3');
  let done = false;
  a.oncanplaythrough = () => { if (!done) { done = true; rpAud103 = a; a.volume = .95; a.play().catch(() => {}); } };
  a.onerror = () => { if (!done) { done = true; tts(R.t + '. ' + R.d); } };
  a.load();
}
document.addEventListener('mouseover', e => {
  const card = e.target.closest ? e.target.closest('.rule-card') : null;
  if (!card) { rpHide103(); return; }
  const i = [...document.querySelectorAll('.rule-card')].indexOf(card);
  if (i < 0 || i === rpIdx103) return;
  rpIdx103 = i;
  rpShow103(i);
});
// ============================================
// ДОПОЛНЕНИЕ v104 — ПАНЕЛЬ «ЖЕТОНЫ ДЕТЕКТИВА» ПОД ДОСЬЕ
// ============================================
function renderTokensPanel() {
  if (!S) return;
  const rp = document.querySelector('.right-panel');
  if (!rp) return;
  let box = document.getElementById('tokensPanel');
  if (!box) { box = document.createElement('div'); box.id = 'tokensPanel'; box.className = 'panel'; rp.appendChild(box); }
  const p = S.players[S.cur];
  const max = Math.max(3, p.tokens);
  let html = '<h3>🎟 Жетоны: ' + p.name + '</h3><div class="tk-row">';
  for (let i = 0; i < max; i++) html += '<div class="tk-tok' + (i < p.tokens ? ' on' : ' off') + '">🎟️</div>';
  html += '</div><div class="tk-hint">Тратятся в расследовании: 1 за раунд + бонусные (карты, Голос Улиц)</div>';
  box.innerHTML = html;
  imageCache.get('img/ui/token.png').then(im => {
    if (im) document.querySelectorAll('.tk-tok').forEach(el => { el.classList.add('img'); el.style.backgroundImage = 'url(img/ui/token.png)'; el.textContent = ''; });
  });
}
const _ui104 = window.updateUI;
window.updateUI = function () { _ui104(); renderTokensPanel(); };
// ============================================
// ДОПОЛНЕНИЕ v105 — ОКНО ПРАВИЛ: ТЕКСТ И ГОЛОС ВЕРНУЛИСЬ (RULE_DATA читается верно)
// ============================================
async function rpShow103(i) {
  const R = (typeof RULE_DATA !== 'undefined' && RULE_DATA[i]) ? RULE_DATA[i] : { t: 'ЗАКОН ГОРОДА', d: '' };
  if (window.hideRulePopup) { try { hideRulePopup(); } catch (e) {} }
  if (!rp103) {
    rp103 = document.createElement('div');
    rp103.style.cssText = 'position:fixed;z-index:370;left:50%;top:50%;transform:translate(-50%,-50%);width:min(880px,95vw);max-height:86vh;background:linear-gradient(160deg,#141a35,#0a0e20);border:3px solid #d4af37;border-radius:16px;box-shadow:0 0 40px rgba(212,175,55,.35),0 20px 60px rgba(0,0,0,.85);opacity:0;transition:opacity .2s;overflow:hidden;';
    document.body.appendChild(rp103);
  }
  rp103.innerHTML = '<div style="display:flex;gap:16px;padding:20px;max-height:86vh;box-sizing:border-box">' +
    '<div style="flex:0 0 300px;display:flex;flex-direction:column;gap:12px">' +
    '<div id="rp103voice" style="height:220px;border-radius:10px;border:2px solid rgba(212,175,55,.5);background:#000;display:flex;align-items:center;justify-content:center;font-size:60px;overflow:hidden">🕵️</div>' +
    '<div id="rp103media" style="flex:1;min-height:180px;border-radius:10px;border:1px solid rgba(212,175,55,.35);background:#000;display:flex;align-items:center;justify-content:center;color:#4a5570;font-size:10px;text-align:center;overflow:hidden">место под картинку / видео</div></div>' +
    '<div style="flex:1;min-width:0;display:flex;flex-direction:column">' +
    '<div style="color:#d4af37;font-size:26px;font-weight:900;letter-spacing:3px;margin-bottom:10px;text-shadow:0 0 12px rgba(212,175,55,.5)">' + R.t + '</div>' +
    '<div style="flex:1;overflow-y:auto;color:#dfe6ff;font-size:15px;line-height:1.7;padding-right:8px">' + R.d + '</div></div></div>';
  rp103.style.opacity = '1';
  (async () => {
    const cands = ['img/voice/voice.png', 'img/voice/hooded.png', 'img/voice/1.png'];
    for (const c of cands) { const im = await imageCache.get(c); if (im) { const b = document.getElementById('rp103voice'); if (b) b.innerHTML = '<img src="' + c + '" style="width:100%;height:100%;object-fit:cover">'; break; } }
  })();
  (async () => {
    const box = document.getElementById('rp103media'); if (!box) return;
    const v = document.createElement('video');
    const okV = await new Promise(res => { v.onloadeddata = () => res(true); v.onerror = () => res(false); v.src = 'img/rules/' + i + '.mp4'; v.load(); });
    if (okV) { v.muted = true; v.loop = true; v.autoplay = true; v.playsInline = true; v.style.cssText = 'width:100%;height:100%;object-fit:cover'; box.innerHTML = ''; box.appendChild(v); return; }
    const im = await imageCache.get('img/rules/' + i + '.png');
    if (im) box.innerHTML = '<img src="img/rules/' + i + '.png" style="width:100%;height:100%;object-fit:cover">';
  })();
  rpStopVoice103();
  const a = new Audio('snd/rules/' + i + '.mp3');
  let done = false;
  a.oncanplaythrough = () => { if (!done) { done = true; rpAud103 = a; a.volume = .95; a.play().catch(() => {}); } };
  a.onerror = () => {
    if (!done) {
      done = true;
      const full = R.t + '. ' + R.d; // теперь с настоящим текстом
      if (window.ruleTts) ruleTts(full); else tts(full);
    }
  };
  a.load();
}
// ============================================
// ДОПОЛНЕНИЕ v106 — ПРИВЕТСТВИЕ ГОЛОСА УЛИЦ ЗВУЧИТ + ХОВЕР БОЛЬШЕ НЕ ГЛУШИТ
// ============================================
// Глушим голос ТОЛЬКО когда реально закрывается окно закона
function rpHide103() {
  const was = rpIdx103 !== -1;
  rpIdx103 = -1;
  if (was) {
    rpStopVoice103();
    if (rp103) rp103.style.opacity = '0';
    const old = document.getElementById('rulePopup'); if (old) old.classList.remove('on');
  }
}
// Приветствие: твой hello.mp3, нет — робот/МамПапиАлиса
function speakGreeting106() {
  const cb = document.getElementById('voiceEnabled');
  const voxOn = (window.MMSET ? MMSET.voice : true) && (!cb || cb.checked);
  if (!voxOn) return;
  const hello = 'Здравствуй... Я — Голос Улиц. Я вижу всё в этом городе и помню всех. Наведи курсор на карточки законов — и я расскажу тебе всё. Но помни: у стен есть уши.';
  const a = new Audio('snd/rules/hello.mp3');
  let done = false;
  a.oncanplaythrough = () => { if (!done) { done = true; a.volume = .95; a.play().catch(() => {}); } };
  a.onerror = () => { if (!done) { done = true; if (window.ruleTts) ruleTts(hello); else tts(hello); } };
  a.load();
}
const _sr106 = window.showRulesScreen;
window.showRulesScreen = function () {
  _sr106();
  setTimeout(speakGreeting106, 700); // плашка появилась — голос вступает
};
// ============================================
// ДОПОЛНЕНИЕ v107 — ОКНО ПРАВИЛ НЕ БЛОКИРУЕТ КНОПКУ «К ИГРЕ»
// ============================================
const _rs107 = rpShow103;
rpShow103 = async function (i) {
  await _rs107(i);
  if (rp103) { rp103.classList.add('rp103x'); rp103.style.pointerEvents = 'none'; } // видно, но клики проходят сквозь
};
function rpHide103() {
  const was = rpIdx103 !== -1;
  rpIdx103 = -1;
  if (was) rpStopVoice103();
  if (rp103) { rp103.style.opacity = '0'; rp103.style.pointerEvents = 'none'; }
  const old = document.getElementById('rulePopup'); if (old) old.classList.remove('on');
}
// ============================================
// ДОПОЛНЕНИЕ v109 — МУЖСКОЙ РОБОТ В ПРАВИЛАХ + QR ОТДЕЛЬНЫМИ ПЛАШКАМИ
// ============================================
// 1) Голос правил = городской мужской робот (низкий питч, как в игре)
function ruleTts(text) {
  if (!window.speechSynthesis) return;
  const voxOn = (window.MMSET ? MMSET.voice : true);
  if (!voxOn) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ru-RU';
  u.rate = .9;
  u.pitch = .25; // «железный» мужской тембр, как в игре
  u.volume = 1;
  const pick = () => {
    const vs = speechSynthesis.getVoices();
    const male = vs.find(v => /ru/i.test(v.lang) && /pavel|male|yuri|dmitr|aleksandr|alexander/i.test(v.name));
    const anyRu = vs.find(v => /ru/i.test(v.lang));
    const v = male || anyRu;
    if (v) u.voice = v;
    speechSynthesis.speak(u);
  };
  if (speechSynthesis.getVoices().length) pick();
  else speechSynthesis.onvoiceschanged = () => pick();
}
// 2) QR — отдельная плашка каждому игроку, по очереди
async function showQRScreen() {
  const humans = S.players.filter(p => !p.isBot);
  for (let i = 0; i < humans.length; i++) {
    const p = humans[i];
    const url = await pairUrl(p.index);
    await showModal(
      '<h2>📱 ' + p.name + ' — отсканируй свою роль</h2>' +
      '<p>Передай устройство игроку <b style="color:' + p.color + '">' + p.name + '</b>. Остальные — не подглядывать!</p>' +
      '<div style="display:flex;justify-content:center;padding:12px"><div style="background:#fff;padding:10px;border-radius:12px;box-shadow:0 0 30px rgba(212,175,55,.4)">' +
      '<img src="' + url + '" style="width:260px;height:260px;display:block">' +
      '<div style="color:#000;text-align:center;font-weight:900;letter-spacing:1px;padding-top:6px">' + p.name + '</div></div></div>' +
      '<p style="text-align:center;opacity:.6;font-size:12px">Плашка ' + (i + 1) + ' из ' + humans.length + ' · роль откроется только на телефоне</p>' +
      '<button data-v="next">✅ ' + p.name + ' отсканировал — дальше</button>');
  }
  await showModal('<h2>✅ Все получили роли</h2><p>' + (humans.length ? 'Люди готовы. ' : '') + '🤖 Боты получили роли автоматически.</p><p style="opacity:.7">Город просыпается…</p><button data-v="go">🎲 Начать!</button>');
}
// ============================================
// ДОПОЛНЕНИЕ v110 — QR: ОТДЕЛЬНЫЕ ПЛАШКИ, КАЖДЫЙ ×3 КРУПНЕЕ, ПО ОЧЕРЕДИ
// ============================================
window.showQRScreen = async function () {
  const humans = S.players.filter(p => !p.isBot);
  for (let i = 0; i < humans.length; i++) {
    const p = humans[i];
    const url = await pairUrl(p.index);
    await showModal(
      '<h2>📱 ' + p.name + ' — отсканируй свою роль</h2>' +
      '<p>Передай устройство игроку <b style="color:' + p.color + '">' + p.name + '</b>. Остальные — не подглядывать!</p>' +
      '<div style="display:flex;justify-content:center;padding:14px"><div style="background:#fff;padding:14px;border-radius:16px;box-shadow:0 0 40px rgba(212,175,55,.45)">' +
      '<img src="' + url + '" style="width:min(430px,72vw);height:auto;display:block">' +
      '<div style="color:#000;text-align:center;font-weight:900;letter-spacing:2px;font-size:20px;padding-top:8px">' + p.name + '</div></div></div>' +
      '<p style="text-align:center;opacity:.6;font-size:12px">Плашка ' + (i + 1) + ' из ' + humans.length + ' · роль откроется только на телефоне</p>' +
      '<button data-v="next">✅ ' + p.name + ' отсканировал — дальше</button>');
  }
  await showModal('<h2>✅ Все получили роли</h2><p>' + (humans.length ? 'Люди готовы. ' : '') + '🤖 Боты получили роли автоматически.</p><p style="opacity:.7">Город просыпается…</p><button data-v="go">🎲 Начать!</button>');
};
// ============================================
// ДОПОЛНЕНИЕ v111 — QR ПЕРЕХВАТОМ (работает всегда) + ВРЕМЕННЫЙ СВИДЕТЕЛЬ В РУКЕ
// ============================================
// 1) Перехват старого QR-окна на уровне showModal
const _sm111 = window.showModal;
window.showModal = function (html, opts) {
  if (typeof html === 'string' && html.indexOf('Отсканируйте свои роли') !== -1) return qrSeq111(html);
  return _sm111(html, opts);
};
async function qrSeq111(oldHtml) {
  const t = document.createElement('template');
  t.innerHTML = oldHtml;
  const items = [...t.content.querySelectorAll('img')].map((im, i) => {
    let name = '';
    if (im.parentElement) { const d = im.parentElement.querySelector('div'); if (d) name = d.textContent.trim(); }
    if (!name) name = im.alt || ('Игрок ' + (i + 1));
    return { src: im.getAttribute('src'), name: name };
  }).filter(x => x.src);
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    await _sm111('<h2>📱 ' + it.name + ' — отсканируй свою роль</h2>' +
      '<p>Передай устройство игроку <b>' + it.name + '</b>. Остальные — не подглядывать!</p>' +
      '<div style="display:flex;justify-content:center;padding:14px"><div style="background:#fff;padding:14px;border-radius:16px;box-shadow:0 0 40px rgba(212,175,55,.45)">' +
      '<img src="' + it.src + '" style="width:min(430px,72vw);height:auto;display:block">' +
      '<div style="color:#000;text-align:center;font-weight:900;letter-spacing:2px;font-size:20px;padding-top:8px">' + it.name + '</div></div></div>' +
      '<p style="text-align:center;opacity:.6;font-size:12px">Плашка ' + (i + 1) + ' из ' + items.length + ' · роль откроется только на телефоне</p>' +
      '<button data-v="next">✅ ' + it.name + ' отсканировал — дальше</button>');
  }
  return _sm111('<h2>✅ Все получили роли</h2><p>🤖 Боты получили роли автоматически.</p><p style="opacity:.7">Город просыпается…</p><button data-v="go">🎲 Начать!</button>');
}
// 2) Временный «Свидетель» с Небоскрёба: в руке и играется ГДЕ УГОДНО
const _uc111 = window.useChip;
window.useChip = async function (type) {
  const p = S && S.players ? S.players[S.cur] : null;
  let bypass = false;
  if (p && type === 'witness' && p.tempWitness && typeof CHIP_LOCS !== 'undefined') {
    CHIP_LOCS.__w = CHIP_LOCS.witness; CHIP_LOCS.witness = null; bypass = true;
  }
  try { return await _uc111(type); }
  finally { if (bypass) CHIP_LOCS.witness = CHIP_LOCS.__w; }
};
const _ui111 = window.updateUI;
window.updateUI = function () {
  _ui111();
  if (S && S.players && S.players[S.cur] && S.players[S.cur].tempWitness) {
    document.querySelectorAll('.hcard[data-kind="chip"][data-key="witness"]').forEach(el => {
      el.classList.remove('locked');
      el.style.opacity = '1'; el.style.filter = 'none';
      el.title = '🔥 Временная карта — играется где угодно до конца хода!';
    });
  }
};
// ============================================
// ДОПОЛНЕНИЕ v112 — РУКА: ОДИН АВТОРИТЕТНЫЙ РЕНДЕР (счёт, замки, 🔥 свидетель, чей ход)
// ============================================
window.renderHand = function () {
  if (!S) return;
  if (window.ensureFreePanel) ensureFreePanel();
  const p = S.players[S.cur];
  const hn = document.getElementById('handName'); if (hn) hn.textContent = p.name;
  const here = getCellData(p.pos).type;
  const LOCS = (typeof CHIP_LOCS !== 'undefined') ? CHIP_LOCS : null;
  const LOCN = (typeof CHIP_LOCS_NAMES !== 'undefined') ? CHIP_LOCS_NAMES : {};
  const fan = (n, i) => (i - (n - 1) / 2) * 4;
  const mk = (kind, key, i, rot, emo, name, txt, cnt, locked, extra) =>
    '<div class="hcard" data-kind="' + kind + '" data-key="' + key + '" data-i="' + i + '" title="' + (locked ? '🔒 Только: ' + extra : extra) + '" style="width:112px;aspect-ratio:44/63;perspective:700px;cursor:pointer;position:relative;transition:transform .25s;transform:rotate(' + rot + 'deg);' + (locked ? 'opacity:.45;filter:grayscale(.7);' : '') + '">' +
    '<div class="hc-in" style="position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform .8s cubic-bezier(.3,.9,.4,1)">' +
    '<div class="hc-back" data-kind="' + kind + '" style="position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:10px;border:2px solid #d4af37;background:linear-gradient(160deg,#1a2340,#0d1226) center/100% 100% no-repeat;display:flex;align-items:center;justify-content:center;font-size:34px"><span class="hc-bemo">' + emo + '</span></div>' +
    '<div style="position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;transform:rotateY(180deg);border-radius:10px;border:2px solid #d4af37;background:linear-gradient(180deg,#1a2340,#0d1226);display:flex;flex-direction:column;overflow:hidden;' + (kind === 'chip' && key === 'witness' && p.tempWitness ? 'box-shadow:0 0 18px rgba(255,193,7,.9);' : '') + '">' +
    '<img class="hc-art" data-kind="' + kind + '" data-key="' + key + '" data-i="' + i + '" alt="" style="display:none;width:100%;height:46%;object-fit:cover;border-bottom:2px solid #d4af37">' +
    '<div class="hc-ph" style="height:46%;display:flex;align-items:center;justify-content:center;font-size:32px">' + emo + '</div>' +
    '<div style="color:#d4af37;font-weight:800;font-size:11px;text-align:center;padding:3px 2px 1px">' + name + '</div>' +
    '<div style="flex:1;overflow:hidden;padding:2px 6px 5px;font-size:9px;line-height:1.35;color:#eee;text-align:center">⚙️ ' + txt + '</div>' +
    (cnt ? '<span style="position:absolute;top:-8px;right:-8px;background:#d4af37;color:#14100a;font-size:11px;font-weight:900;border-radius:50%;min-width:20px;height:20px;display:flex;align-items:center;justify-content:center;z-index:2">' + cnt + '</span>' : '') +
    (locked ? '<span style="position:absolute;top:2px;right:2px;font-size:12px;z-index:3">🔒</span>' : '') +
    (kind === 'chip' && key === 'witness' && p.tempWitness ? '<span style="position:absolute;top:2px;left:2px;font-size:12px;z-index:3">🔥</span>' : '') +
    '</div></div></div>';
  const sk = document.getElementById('handSkins');
  if (sk) {
    sk.innerHTML = p.skins.length ? p.skins.map((id, i) => {
      const s = (window.SKINS && SKINS[id]) || {};
      return mk('skin', id, i, fan(p.skins.length, i), '🗡', s.name || id, 'Урон ' + (s.damage || 0) + ' · Защита ' + (s.defense || 0), 0, false, '');
    }).join('') : '<div style="font-size:11px;opacity:.5">пока нет</div>';
  }
  const ch = document.getElementById('handChips');
  if (ch) {
    const types = ['witness', 'alibi', 'ulika', 'dopros', 'zasada'];
    const emo = { witness: '👁', alibi: '⏳', ulika: '🔍', dopros: '🎤', zasada: '💣' };
    const nm = { witness: 'Свидетель', alibi: 'Алиби', ulika: 'Улика', dopros: 'Допрос', zasada: 'Засада' };
    const HT = { witness: '+1 подозрение по показанию и монеты', alibi: '−1 подозрение, +400 монет, на Старт', ulika: '+1–2 подозрения цели, −монеты', dopros: '+1–2 подозрения цели, −монеты', zasada: '+1–2 подозрения и +1 страх цели' };
    const owned = types.filter(t => p.chips[t] > 0);
    ch.innerHTML = owned.length ? owned.map((t, i) => {
      const need = LOCS ? LOCS[t] : null;
      const locked = need && need.indexOf(here) === -1 && !(t === 'witness' && p.tempWitness);
      const lockT = need ? need.map(n => LOCN[n] || n).join(', ') : '';
      return mk('chip', t, i, fan(owned.length, i), emo[t], nm[t], HT[t], p.chips[t], locked, lockT);
    }).join('') : '<div style="font-size:11px;opacity:.5">пока нет</div>';
  }
  const mh = document.getElementById('morHand');
  if (mh) {
    if (p.isBot) mh.innerHTML = '<div style="font-size:11px;opacity:.5">🤖 у бота ' + p.morals.length + '</div>';
    else if (!p.morals.length) mh.innerHTML = '<div style="font-size:11px;opacity:.5">нет карт — на Старте выбор из трёх</div>';
    else mh.innerHTML = p.morals.map((c, i) => mk('mor', c.id, i, fan(p.morals.length, i), c.icon, c.name, (c.effect || '') + '. ' + (c.desc || ''), 0, false, '')).join('');
  }
  document.querySelectorAll('.hc-art').forEach(img => {
    const k = img.dataset.kind, key = img.dataset.key;
    let cands = [];
    if (k === 'mor') cands = ['img/morals/' + key + '.png'];
    else if (k === 'chip') cands = ['img/chips/' + key + '.png', 'img/cards/' + key + '.png'];
    else if (window.getSkinImage && window.SKINS && SKINS[key]) cands = [getSkinImage(key, SKINS[key].category)];
    (async () => {
      for (const path of cands) {
        const im = await imageCache.get(path);
        if (im) { img.src = path; img.style.display = 'block'; const ph = img.nextElementSibling; if (ph && ph.classList.contains('hc-ph')) ph.style.display = 'none'; break; }
      }
    })();
  });
  const BACKS = { mor: ['img/ui/moral-frame.png'], chip: ['img/ui/back-chip.png', 'img/cards/back.png'], skin: ['img/ui/back-skin.png', 'img/skins/back.png'] };
  Object.keys(BACKS).forEach(k => {
    (async () => {
      for (const path of BACKS[k]) {
        const im = await imageCache.get(path);
        if (im) { document.querySelectorAll('.hc-back[data-kind="' + k + '"]').forEach(b => { b.style.backgroundImage = 'url(' + path + ')'; const e = b.querySelector('.hc-bemo'); if (e) e.style.display = 'none'; }); break; }
      }
    })();
  });
};
// ============================================
// ДОПОЛНЕНИЕ v113 — ВЫБОР МОРАЛИ: КАРТЫ КАК В РУКЕ (рубашка → лицо при наведении)
// ============================================
async function morOffer(p) {
  if (!S || S.isOver || !window.MORAL_DECK) return;
  const pool = MORAL_DECK.slice();
  for (let i = pool.length - 1; i > 0; i--) { const j = U.random(0, i); const t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
  const opts = pool.slice(0, 3);
  if (p.isBot) { const c = U.randomChoice(opts); p.morals.push(c); log('🎭 ' + p.name + ' выбрал «' + c.name + '»'); updateUI(); return; }
  const cardsHtml = opts.map((c, i) =>
    '<button data-v="' + i + '" style="background:none;border:none;padding:0;margin:0 6px;cursor:pointer">' +
    '<div class="hcard" data-kind="mor" data-key="' + c.id + '" style="width:150px;aspect-ratio:44/63;perspective:700px;cursor:pointer;position:relative;">' +
    '<div class="hc-in" style="position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform .8s cubic-bezier(.3,.9,.4,1)">' +
    '<div class="hc-back" data-kind="mor" style="position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:10px;border:2px solid #d4af37;background:#0d1226 url(\'img/ui/moral-frame.png\') center/100% 100% no-repeat;display:flex;align-items:center;justify-content:center;font-size:34px"><span class="hc-bemo">' + c.icon + '</span></div>' +
    '<div style="position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;transform:rotateY(180deg);border-radius:10px;border:2px solid #d4af37;background:linear-gradient(180deg,#1a2340,#0d1226);display:flex;flex-direction:column;overflow:hidden">' +
    '<img class="mo-art" data-key="' + c.id + '" alt="" style="display:none;width:100%;height:46%;object-fit:cover;border-bottom:2px solid #d4af37">' +
    '<div class="hc-ph" style="height:46%;display:flex;align-items:center;justify-content:center;font-size:32px">' + c.icon + '</div>' +
    '<div style="color:#d4af37;font-weight:800;font-size:12px;text-align:center;padding:3px 2px 1px">' + c.name + '</div>' +
    '<div style="flex:1;overflow:hidden;padding:2px 6px 5px;font-size:9.5px;line-height:1.35;color:#eee;text-align:center">⚙️ ' + (c.effect || '') + '. ' + (c.desc || '') + '</div>' +
    '</div></div></div></button>').join('');
  const pr = showModal('<h2>🎭 Карты Морали</h2><p>Выбери одну. Наведи курсор — карта перевернётся лицом и расскажет о себе.</p>' +
    '<div style="display:flex;justify-content:center;align-items:flex-end;flex-wrap:wrap;padding:14px 0 6px">' + cardsHtml + '</div>' +
    '<button data-v="skip">Пропустить</button>');
  setTimeout(() => { // подтягиваем арт, пока окно открыто
    document.querySelectorAll('.mo-art').forEach(img => {
      const key = img.dataset.key;
      imageCache.get('img/morals/' + key + '.png').then(im => {
        if (im) { img.src = 'img/morals/' + key + '.png'; img.style.display = 'block'; const ph = img.nextElementSibling; if (ph && ph.classList.contains('hc-ph')) ph.style.display = 'none'; }
      });
    });
  }, 60);
  const ch = await pr;
  if (ch !== 'skip' && opts[parseInt(ch)]) {
    p.morals.push(opts[parseInt(ch)]);
    log('🎭 ' + p.name + ' выбрал «' + opts[parseInt(ch)].name + '»');
  }
  updateUI();
}
// ============================================
// ДОПОЛНЕНИЕ v114 — МАГАЗИН: СКИНЫ КАК КАРТЫ (арт, статы, цена)
// ============================================
const _sm114 = window.showModal;
window.showModal = function (html, opts) {
  if (typeof html === 'string' && html.indexOf('МАГАЗИН') !== -1) return shopPretty114(html, opts);
  return _sm114(html, opts);
};
function shopPretty114(oldHtml, opts) {
  const t = document.createElement('template');
  t.innerHTML = oldHtml;
  const btns = [...t.content.querySelectorAll('button[data-v]')];
  const exit = btns.find(b => /Выйти|close|exit/i.test(b.textContent));
  const items = btns.filter(b => b !== exit && window.SKINS && SKINS[b.dataset.v]);
  const coins = (oldHtml.match(/Монеты:[^0-9]*([0-9]+)/) || [])[1] || '0';
  const cards = items.map(b => {
    const id = b.dataset.v, s = SKINS[id];
    const dead = b.disabled || b.hasAttribute('disabled');
    const inner =
      '<div style="width:140px;aspect-ratio:44/63;border-radius:10px;border:2px solid #d4af37;background:linear-gradient(180deg,#1a2340,#0d1226);display:flex;flex-direction:column;overflow:hidden;box-shadow:0 6px 16px rgba(0,0,0,.6);' + (dead ? 'opacity:.4;filter:grayscale(.7);' : '') + '">' +
      '<img class="sh-art" data-id="' + id + '" alt="" style="display:none;width:100%;height:50%;object-fit:cover;border-bottom:2px solid #d4af37">' +
      '<div class="sh-ph" style="height:50%;display:flex;align-items:center;justify-content:center;font-size:34px">🗡</div>' +
      '<div style="color:#d4af37;font-weight:800;font-size:11px;text-align:center;padding:4px 2px 1px">' + (s.name || id) + '</div>' +
      '<div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:3px;padding:2px 6px 6px;font-size:10px;color:#eee;text-align:center">' +
      '<div>⚔️ ' + (s.damage || 0) + ' · 🛡 ' + (s.defense || 0) + '</div>' +
      '<div style="color:#ffe082;font-weight:900;font-size:13px;text-shadow:0 0 8px rgba(255,224,130,.4)">' + (s.price || 0) + ' 💰</div></div></div>';
    return dead
      ? '<div style="margin:6px">' + inner + '</div>'
      : '<button data-v="' + id + '" style="background:none;border:none;padding:0;margin:6px;cursor:pointer" title="Купить: ' + (s.name || id) + '">' + inner + '</button>';
  }).join('');
  const pr = _sm114('<h2>🛒 МАГАЗИН</h2><p>Монеты: <b style="color:#ffe082">' + coins + '</b> · клик по карте — покупка</p>' +
    '<div style="display:flex;flex-wrap:wrap;justify-content:center;align-items:flex-end;padding:8px 0">' + cards + '</div>' +
    (exit ? '<button data-v="' + exit.dataset.v + '">Выйти</button>' : ''), opts);
  setTimeout(() => {
    document.querySelectorAll('.sh-art').forEach(img => {
      const id = img.dataset.id, s = SKINS[id];
      const path = window.getSkinImage ? getSkinImage(id, s.category) : null;
      if (path) imageCache.get(path).then(im => {
        if (im) { img.src = path; img.style.display = 'block'; const ph = img.nextElementSibling; if (ph && ph.classList.contains('sh-ph')) ph.style.display = 'none'; }
      });
    });
  }, 60);
  return pr;
}
// ============================================
// ДОПОЛНЕНИЕ v115 — МАГАЗИН: КАРТОЧКИ ВЕРНУЛИСЬ (разбор по тексту кнопок)
// ============================================
const _sm115 = window.showModal;
window.showModal = function (html, opts) {
  if (typeof html === 'string' && html.indexOf('МАГАЗИН') !== -1) return shopPretty115(html, opts);
  return _sm115(html, opts);
};
function shopPretty115(oldHtml, opts) {
  const t = document.createElement('template');
  t.innerHTML = oldHtml;
  const btns = [...t.content.querySelectorAll('button[data-v]')];
  const exit = btns.find(b => /Выйти|close|exit/i.test(b.textContent));
  const items = btns.filter(b => b !== exit && !/Выйти/i.test(b.textContent));
  const coins = (oldHtml.match(/Монеты:[^0-9]*([0-9]+)/) || [])[1] || '0';
  const cards = items.map(b => {
    const dv = b.dataset.v;
    const txt = b.textContent.replace(/\s+/g, ' ').trim();
    const price = (txt.match(/([0-9]+)/) || [])[1] || '';
    const name = txt.replace(/[0-9]+/g, '').replace(/💰/g, '').trim() || dv;
    let s = null, sKey = null;
    if (window.SKINS) {
      if (SKINS[dv]) { s = SKINS[dv]; sKey = dv; }
      else {
        const low = name.toLowerCase();
        sKey = Object.keys(SKINS).find(k => (SKINS[k].name || '').toLowerCase() === low || k.toLowerCase() === low) || null;
        if (sKey) s = SKINS[sKey];
      }
    }
    const dead = b.disabled || b.hasAttribute('disabled');
    const inner =
      '<div style="width:140px;aspect-ratio:44/63;border-radius:10px;border:2px solid #d4af37;background:linear-gradient(180deg,#1a2340,#0d1226);display:flex;flex-direction:column;overflow:hidden;box-shadow:0 6px 16px rgba(0,0,0,.6);' + (dead ? 'opacity:.4;filter:grayscale(.7);' : '') + '">' +
      '<img class="sh-art" data-key="' + (sKey || '') + '" alt="" style="display:none;width:100%;height:50%;object-fit:cover;border-bottom:2px solid #d4af37">' +
      '<div class="sh-ph" style="height:50%;display:flex;align-items:center;justify-content:center;font-size:34px">🗡</div>' +
      '<div style="color:#d4af37;font-weight:800;font-size:11px;text-align:center;padding:4px 2px 1px">' + (s ? (s.name || name) : name) + '</div>' +
      '<div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:3px;padding:2px 6px 6px;font-size:10px;color:#eee;text-align:center">' +
      (s ? '<div>⚔️ ' + (s.damage || 0) + ' · 🛡 ' + (s.defense || 0) + '</div>' : '') +
      '<div style="color:#ffe082;font-weight:900;font-size:13px;text-shadow:0 0 8px rgba(255,224,130,.4)">' + (price || (s ? s.price : '')) + ' 💰</div></div></div>';
    return dead
      ? '<div style="margin:6px" title="Недоступно">' + inner + '</div>'
      : '<button data-v="' + dv + '" style="background:none;border:none;padding:0;margin:6px;cursor:pointer" title="Купить: ' + name + '">' + inner + '</button>';
  }).join('');
  const pr = _sm115('<h2>🛒 МАГАЗИН</h2><p>Монеты: <b style="color:#ffe082">' + coins + '</b> · клик по карте — покупка</p>' +
    '<div style="display:flex;flex-wrap:wrap;justify-content:center;align-items:flex-end;padding:8px 0">' + (cards || '<p style="opacity:.6">Сегодня всё раскупили…</p>') + '</div>' +
    (exit ? '<button data-v="' + exit.dataset.v + '">Выйти</button>' : ''), opts);
  setTimeout(() => {
    document.querySelectorAll('.sh-art').forEach(img => {
      const key = img.dataset.key;
      if (!key || !window.SKINS || !SKINS[key]) return;
      const path = window.getSkinImage ? getSkinImage(key, SKINS[key].category) : null;
      if (path) imageCache.get(path).then(im => {
        if (im) { img.src = path; img.style.display = 'block'; const ph = img.nextElementSibling; if (ph && ph.classList.contains('sh-ph')) ph.style.display = 'none'; }
      });
    });
  }, 60);
  return pr;
}
// ============================================
// ДОПОЛНЕНИЕ v118 — АТМОСФЕРНЫЕ ТЕКСТЫ С ЮМОРОМ ДЛЯ КАЖДОГО ЗАКОНА
// ============================================
if (window.RULE_DATA) {
  const HUM = [
    '🌃 Голос Улиц шепчет: город не прощает слабости — испугался, значит уже наполовину виновен. Детектив, ошибшийся именем, платит собственным кошельком и скинами, а убийца в это время улыбается и копит на твой гроб. Дожил до финала нераскрытым — победил; в некрологе напишут «умер от естественного подозрения».',
    '🌃 Голос Улиц шепчет: роль — как нижнее бельё: своё и никому не показывай. Шериф днём делает вид, что всё под контролем; убийца ночью считает чужие монеты; мирный просто хочет дожить до понедельника, но карты морали развернут его судьбу быстрее, чем маршрутку на Крыше. Продажный коп, как всегда, играет за себя — город удивлён, да.',
    '🌃 Голос Улиц шепчет: кубик бросай один раз — город любит решительных и не любит тех, кто переспрашивает. Усталость тянет на дно, адреналин толкает в спину, «прилив сил» с Небоскрёба подкинет +2. Прошёл Старт — получай жалованье и мораль. Встретил соседа по клетке — дерись или щади; город запомнит и то, и другое, но уважает только первое… шучу, второе тоже.',
    '🌃 Голос Улиц шепчет: подозрение — это внимание города, а внимание здесь дороже аренды. Десять плюс — тебя можно обвинить, и если обвинитель ошибся, он заплатит монетами, скинами и двумя сменами в полиции: город любит симметрию. Пятнадцать — финальная дуэль, и там уже не до смеха. Хочешь тише ехать — меньше свети кошельком.',
    '🌃 Голос Улиц шепчет: пять колод — пять привычек города. Свидетель и Алиби шепчутся у Психолога и в Больнице; Улика, Допрос и Засада предпочитают Тоннель, Полицию и Преступление. Одна карта за ход, голос — после применения. Не сыграл временную карту до конца хода — она сгорела; город не ждёт, у него ещё убийство не раскрыто.',
    '🌃 Голос Улиц шепчет: мораль в этом городе — валюта, и у неё инфляция. Совесть, Месть, Коррупция, Искупление — некоторые карты меняют роль быстрее, чем настроение у Бота 3: вчера мирный, сегодня убийца, завтра — на обложке вечерней газеты. Наведи курсор — карта перевернётся и расскажет о себе; город любит исповеди, особенно чужие.',
    '🌃 Голос Улиц шепчет: клинок — не роскошь, а аргумент. Купил клетку — она светится твоим цветом, и весь район знает, чей это нож. Встал на чужое — плати аренду: город уважает собственность, особенно вооружённую. Сет одного цвета — бонусы к силе и защите. Хороший арсенал выигрывает дуэли, но богатый — всегда цель; такие здесь соседи.',
    '🌃 Голос Улиц шепчет: утро — для кофе и алиби, день — для патрулей шерифа, вечер — для сделок, ночь — для работы убийцы. Время меняется каждые несколько раундов и раздаёт бонусы ролям, как бармен — бесплатную выпивку постоянным клиентам. Наведи на эмодзи в шапке — город подскажет, кому сейчас хорошо. Ночью убийца сильнее и тише; днём шериф зорче. Выбирай момент дуэли, как выбираешь нож — внимательно.',
    '🌃 Голос Улиц шепчет: монеты — кислород города. Старт — зарплата, Больница — дорого, зато жив, Психолог — дешевле, зато выговоришься. Тайник честно показывает, что даст: город не обманывает на мелочах, он копит на крупное. Ошибся с обвинением — монеты в ноль, скины вон, и две смены в полиции: жадность убивает не хуже клинка, только медленнее.'
  ];
  RULE_DATA.forEach((r, i) => { if (HUM[i] && r.d.indexOf('🌃') === -1) r.d += ' ' + HUM[i]; });
}
// ============================================
// ДОПОЛНЕНИЕ v119 — ТЕКСТЫ С ЮМОРОМ (чиню доступ к RULE_DATA) 
// ============================================
if (typeof RULE_DATA !== 'undefined') {
  const HUM = [
    '🌃 Голос Улиц шепчет: город не прощает слабости — испугался, значит уже наполовину виновен. Шериф, ошибшийся именем, платит собственным кошельком и скинами, а убийца в это время улыбается и копит на твой гроб. Дожил до финала нераскрытым — победил; в некрологе напишут «умер от естественного подозрения. Шериф, запомни: Ошибочное обвинение стоит дорого. Ты платишь не только монетами, но и своим авторитетом. А убийца в это время улыбается в углу, пьёт твой кофе и копит на твой собственный гроб. Да, в этом городе даже похороны платные.Убийца, слушай сюда:Твоя задача — не просто не попасться. Твоя задача — сделать так, чтобы подозрение упало на того, кто громче всех кричит «Я не убивал!». Слабаки всегда кричат громче. А ты молчи. Ты — тень. Ты — тот, кого не видели, но все боятся.Но помните все:Это всего лишь игра. Даже если ты проиграешь — ты запомнишь этот вечер. Особенно если проиграешь из-за того, что твой собственный ребёнок подставил тебя картой «Засада». Город смеётся над такими. И мы смеёмся вместе с ним.».',
    '🌃 Голос Улиц шепчет: роль — как нижнее бельё: своё и никому не показывай. Шериф днём делает вид, что всё под контролем; убийца ночью считает чужие монеты; мирный просто хочет дожить до понедельника, но карты морали развернут его судьбу быстрее, чем маршрутку на Крыше. Продажный коп, как всегда, играет за себя — город удивлён, да.',
    '🌃 Голос Улиц шепчет: кубик бросай один раз — город любит решительных и не любит тех, кто переспрашивает. Усталость тянет на дно, адреналин толкает в спину, «прилив сил» с Небоскрёба подкинет +2. Прошёл Старт — получай жалованье и мораль. Встретил соседа по клетке — дерись или щади; город запомнит и то, и другое, но уважает только первое… шучу, второе тоже.',
    '🌃 Голос Улиц шепчет: подозрение — это внимание города, а внимание здесь дороже аренды. Десять плюс — тебя можно обвинить, и если обвинитель ошибся, он заплатит монетами, скинами и двумя сменами в полиции: город любит симметрию. Пятнадцать — финальная дуэль, и там уже не до смеха. Хочешь тише ехать — меньше свети кошельком.',
    '🌃 Голос Улиц шепчет: пять колод — пять привычек города. Свидетель и Алиби шепчутся у Психолога и в Больнице; Улика, Допрос и Засада предпочитают Тоннель, Полицию и Преступление. Одна карта за ход, голос — после применения. Не сыграл временную карту до конца хода — она сгорела; город не ждёт, у него ещё убийство не раскрыто.',
    '🌃 Голос Улиц шепчет: мораль в этом городе — валюта, и у неё инфляция. Совесть, Месть, Коррупция, Искупление — некоторые карты меняют роль быстрее, чем настроение у Бота 3: вчера мирный, сегодня убийца, завтра — на обложке вечерней газеты. Наведи курсор — карта перевернётся и расскажет о себе; город любит исповеди, особенно чужие.',
    '🌃 Голос Улиц шепчет: клинок — не роскошь, а аргумент. Купил клетку — она светится твоим цветом, и весь район знает, чей это нож. Встал на чужое — плати аренду: город уважает собственность, особенно вооружённую. Сет одного цвета — бонусы к силе и защите. Хороший арсенал выигрывает дуэли, но богатый — всегда цель; такие здесь соседи.',
    '🌃 Голос Улиц шепчет: утро — для кофе и алиби, день — для патрулей шерифа, вечер — для сделок, ночь — для работы убийцы. Время меняется каждые несколько раундов и раздаёт бонусы ролям, как бармен — бесплатную выпивку постоянным клиентам. Наведи на эмодзи в шапке — город подскажет, кому сейчас хорошо. Ночью убийца сильнее и тише; днём шериф зорче. Выбирай момент дуэли, как выбираешь нож — внимательно.',
    '🌃 Голос Улиц шепчет: монеты — кислород города. Старт — зарплата, Больница — дорого, зато жив, Психолог — дешевле, зато выговоришься. Тайник честно показывает, что даст: город не обманывает на мелочах, он копит на крупное. Ошибся с обвинением — монеты в ноль, скины вон, и две смены в полиции: жадность убивает не хуже клинка, только медленнее.'
  ];
  RULE_DATA.forEach((r, i) => { if (HUM[i] && r.d.indexOf('🌃') === -1) r.d += ' ' + HUM[i]; });
}
// ============================================
// ДОПОЛНЕНИЕ v120 — НА ЭКРАНЕ ПРАВИЛ КОРОТКИЙ ТЕКСТ, ПОЛНЫЙ — ТОЛЬКО В ОКНЕ
// ============================================
const _sr120 = window.showRulesScreen;
window.showRulesScreen = function () {
  _sr120();
  setTimeout(() => {
    const cards = document.querySelectorAll('.rule-card');
    cards.forEach((c, i) => {
      const R = (typeof RULE_DATA !== 'undefined') ? RULE_DATA[i] : null;
      if (!R) return;
      let short = R.d;
      let cut = short.indexOf(' Подробно:'); if (cut !== -1) short = short.slice(0, cut);
      cut = short.indexOf(' 🌃'); if (cut !== -1) short = short.slice(0, cut);
      const p = c.querySelector('p');
      if (p) p.textContent = short.trim() + '…';
    });
  }, 60);
};
// ============================================
// ДОПОЛНЕНИЕ v122 — ФОНОВАЯ МУЗЫКА УЖЕ НА ЭКРАНЕ ПРАВИЛ
// ============================================
function startBgMusic122() {
  try {
    if (window.MMSET && MMSET.music === false) return; // музыка выключена в настройках
    if (!window.musicPlayer || !musicPlayer.audio) { if (window.startMusic) startMusic(); return; }
    const a = musicPlayer.audio;
    // если трек ещё не выбран игрой — берём первый из ассетов
    if (!a.src || a.src === window.location.href) {
      const list = (window.ASSETS && ASSETS.music) ? ASSETS.music : null;
      if (list) a.src = Array.isArray(list) ? list[0] : (list.main || Object.values(list)[0]);
    }
    if (!a.src || a.src === window.location.href) return;
    a.loop = true;
    if (!a.volume || a.volume <= 0) a.volume = 0.4;
    if (a.paused) a.play().catch(() => {});
  } catch (e) {}
}
const _sr122 = window.showRulesScreen;
window.showRulesScreen = function () {
  _sr122();
  setTimeout(startBgMusic122, 400); // плашка приветствия + музыка вместе
};
// ============================================
// ДОПОЛНЕНИЕ v123 — МУЗЫКА НА ПРАВИЛАХ: СЛУЧАЙНЫЙ ТРЕК + РОТАЦИЯ ВСЕХ ШЕСТИ
// ============================================
function startBgMusic122() {
  try {
    if (window.MMSET && MMSET.music === false) return; // выключена в настройках
    if (!window.musicPlayer || !musicPlayer.audio) return;
    const a = musicPlayer.audio;
    const list = (window.ASSETS && ASSETS.music && ASSETS.music.length) ? ASSETS.music : null;
    if (!list) return;
    if (!a._rot123) { // ротация: трек кончился → следующий случайный
      a._rot123 = true;
      a.addEventListener('ended', () => {
        a.src = list[U.random(0, list.length - 1)];
        if (!a.volume || a.volume <= 0) a.volume = .4;
        a.play().catch(() => {});
      });
    }
    if (a.paused) {
      if (!a.src || a.src === window.location.href || a.error) a.src = list[U.random(0, list.length - 1)];
      a.loop = false; // не зацикливаем — пусть сменяются
      if (!a.volume || a.volume <= 0) a.volume = .4;
      a.play().catch(() => {});
    }
  } catch (e) {}
}
// ============================================
// ДОПОЛНЕНИЕ v124 — МУЗЫКА НА ПРАВИЛАХ: НАДЁЖНЫЙ СТАРТ (typeof + клик-страховка)
// ============================================
function startBgMusic122() {
  try {
    if (window.MMSET && MMSET.music === false) return; // выключена в настройках
    const mp = (typeof musicPlayer !== 'undefined') ? musicPlayer : (window.musicPlayer || null);
    if (!mp || !mp.audio) return;
    const a = mp.audio;
    const list = (typeof ASSETS !== 'undefined' && ASSETS.music && ASSETS.music.length) ? ASSETS.music : null;
    if (!list) return;
    if (!a._rot124) { // ротация шести треков
      a._rot124 = true;
      a.addEventListener('ended', () => {
        a.src = list[U.random(0, list.length - 1)];
        if (!a.volume || a.volume <= 0) a.volume = .4;
        a.play().catch(() => {});
      });
    }
    if (a.paused) {
      if (!a.src || a.src === window.location.href || a.error) a.src = list[U.random(0, list.length - 1)];
      a.loop = false;
      if (!a.volume || a.volume <= 0) a.volume = .4;
      a.play().catch(() => {});
    }
  } catch (e) {}
}
const _sr124 = window.showRulesScreen;
window.showRulesScreen = function () {
  _sr124();
  setTimeout(startBgMusic122, 400); // правила открылись — тема стартует
  const once = () => { setTimeout(startBgMusic122, 100); document.removeEventListener('click', once); };
  document.addEventListener('click', once); // первый клик = браузер разрешает звук
};
// ============================================
// ДОПОЛНЕНИЕ v125 — АВТОНОМНАЯ МУЗЫКА НА ПРАВИЛАХ (не зависит от старых цепочек)
// ============================================
let bg125 = null, yielded125 = false;
function startRulesMusic125() {
  const list = (typeof ASSETS !== 'undefined' && ASSETS.music && ASSETS.music.length) ? ASSETS.music : null;
  if (!list) return;
  if (!bg125) {
    bg125 = new Audio();
    bg125.addEventListener('ended', () => { // ротация шести треков
      bg125.src = list[U.random(0, list.length - 1)];
      bg125.volume = .4;
      bg125.play().catch(() => {});
    });
    const mp = (typeof musicPlayer !== 'undefined') ? musicPlayer : null;
    if (mp && mp.audio) mp.audio.addEventListener('play', () => { // игра включила свою музыку — уступаем эфир
      yielded125 = true;
      if (bg125) bg125.pause();
    });
  }
  if (bg125.paused && !yielded125) {
    if (!bg125.src || bg125.src === window.location.href || bg125.error) bg125.src = list[U.random(0, list.length - 1)];
    bg125.volume = .4;
    bg125.play().catch(() => {});
  }
}
setInterval(() => {
  const r = document.getElementById('rulesScreen');
  if (!r) return;
  const vis = r.classList.contains('on') || (r.offsetParent !== null);
  if (vis && !yielded125 && (!bg125 || bg125.paused)) {
    if (!(window.MMSET && MMSET.music === false)) startRulesMusic125();
  }
}, 1000);
// ============================================
// ДОПОЛНЕНИЕ v126 — МУЗЫКА ПРАВИЛ: НАДЁЖНАЯ ВИДИМОСТЬ + КЛИК + ДИАГНОСТИКА
// ============================================
let bg126 = null, yielded126 = false;
function rulesVis126() {
  const r = document.getElementById('rulesScreen');
  if (!r) return false;
  const cs = getComputedStyle(r);
  return cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0;
}
function startRulesMusic126() {
  const list = (typeof ASSETS !== 'undefined' && ASSETS.music && ASSETS.music.length) ? ASSETS.music : null;
  if (!list) return;
  if (!bg126) {
    bg126 = new Audio();
    bg126.addEventListener('ended', () => { bg126.src = list[U.random(0, list.length - 1)]; bg126.volume = .4; bg126.play().catch(() => {}); });
    const mp = (typeof musicPlayer !== 'undefined') ? musicPlayer : null;
    if (mp && mp.audio) mp.audio.addEventListener('play', () => { yielded126 = true; if (bg126) bg126.pause(); }); // штатная музыка включилась — уступаем
  }
  if (!yielded126 && bg126.paused) {
    if (!bg126.src || bg126.src === window.location.href || bg126.error) bg126.src = list[U.random(0, list.length - 1)];
    bg126.volume = .4;
    bg126.play()
      .then(() => console.log('🎼 музыка правил: ИГРАЕТ'))
      .catch(e => console.log('🎼 музыка правил: браузер заблокировал →', e && e.name));
  }
}
setInterval(() => {
  if (rulesVis126() && !yielded126 && (!bg126 || bg126.paused) && !(window.MMSET && MMSET.music === false)) startRulesMusic126();
}, 800);
document.addEventListener('click', () => {
  if (rulesVis126() && !yielded126 && !(window.MMSET && MMSET.music === false)) setTimeout(startRulesMusic126, 50);
});
// ============================================
// ДОПОЛНЕНИЕ v127 — МУЗЫКА ПРАВИЛ: ДЕТЕКТОР ПО КНОПКЕ «К ИГРЕ»
// ============================================
let bg127 = null, yielded127 = false;
function rulesVis127() {
  const el = document.getElementById('rulesGoBtn') || document.getElementById('rulesScreen');
  return !!el && el.offsetParent !== null; // кнопка видна = правила открыты
}
function startRulesMusic127() {
  const list = (typeof ASSETS !== 'undefined' && ASSETS.music && ASSETS.music.length) ? ASSETS.music : null;
  if (!list) return;
  if (!bg127) {
    bg127 = new Audio();
    bg127.addEventListener('ended', () => { bg127.src = list[U.random(0, list.length - 1)]; bg127.volume = .4; bg127.play().catch(() => {}); });
    const mp = (typeof musicPlayer !== 'undefined') ? musicPlayer : null;
    if (mp && mp.audio) mp.audio.addEventListener('play', () => { yielded127 = true; if (bg127) bg127.pause(); }); // штатная включилась — уступаем
  }
  if (!yielded127 && bg127.paused) {
    if (!bg127.src || bg127.src === window.location.href || bg127.error) bg127.src = list[U.random(0, list.length - 1)];
    bg127.volume = .4;
    bg127.play()
      .then(() => console.log('🎼 музыка правил: ИГРАЕТ'))
      .catch(e => console.log('🎼 заблокировано →', e && e.name));
  }
}
setInterval(() => {
  if (rulesVis127() && !yielded127 && (!bg127 || bg127.paused) && !(window.MMSET && MMSET.music === false)) startRulesMusic127();
}, 800);
document.addEventListener('click', () => {
  if (rulesVis127() && !yielded127 && !(window.MMSET && MMSET.music === false)) setTimeout(startRulesMusic127, 50);
});
// ============================================
// ДОПОЛНЕНИЕ v128 — МУЗЫКА ПРАВИЛ: СТАРТ ПРЯМО ВНУТРИ КЛИКА (не блокируется)
// ============================================
let bg128 = null, yielded128 = false;
function rulesVis128() {
  const el = document.getElementById('rulesGoBtn') || document.getElementById('rulesScreen');
  return !!el && el.offsetParent !== null;
}
function startRulesMusic128() {
  const list = (typeof ASSETS !== 'undefined' && ASSETS.music && ASSETS.music.length) ? ASSETS.music : null;
  if (!list) return;
  if (!bg128) {
    bg128 = new Audio();
    bg128.addEventListener('ended', () => { bg128.src = list[U.random(0, list.length - 1)]; bg128.volume = .4; bg128.play().catch(() => {}); });
    const mp = (typeof musicPlayer !== 'undefined') ? musicPlayer : null;
    if (mp && mp.audio) mp.audio.addEventListener('play', () => { yielded128 = true; if (bg128) bg128.pause(); }); // штатная (пауза) включилась — уступаем
  }
  if (!yielded128 && bg128.paused) {
    if (!bg128.src || bg128.src === window.location.href || bg128.error) bg128.src = list[U.random(0, list.length - 1)];
    bg128.volume = .4;
    bg128.play().then(() => console.log('🎼 ИГРАЕТ')).catch(e => console.log('🎼 блок →', e && e.name));
  }
}
function tryRulesMusic128() {
  // глушим прежние самоделки, чтобы не двоилось
  if (typeof bg126 !== 'undefined' && bg126) bg126.pause();
  if (typeof bg127 !== 'undefined' && bg127) bg127.pause();
  if (rulesVis128() && !yielded128 && !(window.MMSET && MMSET.music === false)) startRulesMusic128(); // play() ВНУТРИ жеста
}
document.addEventListener('pointerdown', tryRulesMusic128, true);
document.addEventListener('click', tryRulesMusic128, true);
setInterval(() => { // фоновая подстраховка (вдруг жест уже был разрешён раньше)
  if (rulesVis128() && !yielded128 && (!bg128 || bg128.paused) && !(window.MMSET && MMSET.music === false)) startRulesMusic128();
}, 1000);
// ============================================
// ДОПОЛНЕНИЕ v129 — МУЗЫКА ПРАВИЛ: РЕТРАЙ ПО КЛИКУ, ЕСЛИ БРАУЗЕР ЗАБЛОКИРОВАЛ
// ============================================
function startRulesMusic128() {
  const list = (typeof ASSETS !== 'undefined' && ASSETS.music && ASSETS.music.length) ? ASSETS.music : null;
  if (!list) return;
  if (!bg128) {
    bg128 = new Audio();
    bg128.addEventListener('ended', () => { bg128.src = list[U.random(0, list.length - 1)]; bg128.volume = .4; bg128.play().catch(() => {}); });
    const mp = (typeof musicPlayer !== 'undefined') ? musicPlayer : null;
    if (mp && mp.audio) mp.audio.addEventListener('play', () => { yielded128 = true; if (bg128) bg128.pause(); });
  }
  if (!yielded128 && bg128.paused) {
    if (!bg128.src || bg128.src === window.location.href || bg128.error) bg128.src = list[U.random(0, list.length - 1)];
    bg128.volume = .4;
    bg128.play()
      .then(() => console.log('🎼 ИГРАЕТ'))
      .catch(e => {
        console.log('🎼 блок →', e && e.name, '— жду клика');
        const retry = () => {
          document.removeEventListener('pointerdown', retry);
          if (bg128 && bg128.paused && !yielded128) bg128.play().then(() => console.log('🎼 ИГРАЕТ после клика')).catch(() => {});
        };
        document.addEventListener('pointerdown', retry, { capture: true });
      });
  }
}
// ============================================
// ДОПОЛНЕНИЕ v130 — КНОПКА «МУЗЫКА ГОРОДА» НА ПРАВИЛАХ + СВОЙ ТРЕК ПРАВИЛ
// ============================================
let bg130 = null, yielded130 = false, readySrc130 = null;
function rulesVis130() {
  const c = document.querySelector('.rule-card');
  if (c) return c.offsetParent !== null;
  const el = document.getElementById('rulesGoBtn') || document.getElementById('rulesScreen');
  return !!el && el.offsetParent !== null;
}
function pickRulesSrc130(cb) {
  const cands = ['snd/music/rules.mp3', 'snd/rules_music/theme.mp3'];
  let i = 0;
  const next = () => {
    if (i >= cands.length) {
      const list = (typeof ASSETS !== 'undefined' && ASSETS.music && ASSETS.music.length) ? ASSETS.music : null;
      cb(list ? list[U.random(0, list.length - 1)] : null);
      return;
    }
    const p = cands[i++];
    const t = new Audio();
    t.oncanplaythrough = () => cb(p);
    t.onerror = () => next();
    t.src = p; t.load();
  };
  next();
}
function ensureBtn130() {
  let b = document.getElementById('rulesMusicBtn');
  if (!b) {
    b = document.createElement('button');
    b.id = 'rulesMusicBtn';
    b.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:400;padding:10px 16px;background:linear-gradient(180deg,#1a2340,#0d1226);border:2px solid #d4af37;color:#ffd54f;font-weight:800;border-radius:10px;cursor:pointer;display:none;box-shadow:0 6px 18px rgba(0,0,0,.6);letter-spacing:1px;';
    b.textContent = '🔇 Музыка города';
    document.body.appendChild(b);
    b.addEventListener('click', () => { // play() ВНУТРИ жеста — блокировка невозможна
      if (bg130 && !bg130.paused) { bg130.pause(); b.textContent = '🔇 Музыка города'; return; }
      if (!bg130) {
        bg130 = new Audio();
        bg130.addEventListener('ended', () => { if (readySrc130) { bg130.src = readySrc130; bg130.volume = .4; bg130.play().catch(() => {}); } });
        const mp = (typeof musicPlayer !== 'undefined') ? musicPlayer : null;
        if (mp && mp.audio) mp.audio.addEventListener('play', () => { yielded130 = true; if (bg130) bg130.pause(); }); // штатная включилась — уступаем
      }
      if (readySrc130) bg130.src = readySrc130;
      else if (typeof ASSETS !== 'undefined' && ASSETS.music && ASSETS.music.length) bg130.src = ASSETS.music[0];
      bg130.volume = .4;
      bg130.play().then(() => { b.textContent = '🔊 Музыка города'; }).catch(() => {});
    });
  }
  return b;
}
setInterval(() => {
  const vis = rulesVis130();
  const b = ensureBtn130();
  b.style.display = vis ? 'block' : 'none';
  if (vis && !readySrc130) pickRulesSrc130(s => { readySrc130 = s; }); // греем трек заранее
}, 600);
// ============================================
// ДОПОЛНЕНИЕ v131 — МУЗЫКА ПРАВИЛ ЗАТИХАЕТ ПРИ ПЕРЕХОДЕ В ИГРУ
// ============================================
setInterval(() => {
  if (typeof rulesVis130 === 'function' && !rulesVis130() && typeof bg130 !== 'undefined' && bg130 && !bg130.paused) {
    bg130.pause(); // ушли с правил — музыка правил молчит
    const b = document.getElementById('rulesMusicBtn');
    if (b) b.textContent = '🔇 Музыка города';
  }
}, 600);
// ============================================
// ДОПОЛНЕНИЕ v132 — КЛЕТКИ СКИНОВ НА ПОЛЕ: КАСТОМНЫЙ АРТ ВМЕСТО СЕРОЙ ПЛИТКИ
// ============================================
function paintSkinCells132() {
  if (!S || !window.SKINS) return;
  for (let idx = 0; idx < GAME_CONFIG.boardSize; idx++) {
    const d = getCellData(idx);
    const cell = document.getElementById('cell_' + idx);
    if (!d || !cell || d.type !== 'skin') continue;
    const s = SKINS[d.skinId] || {};
    const path = window.getSkinImage ? getSkinImage(d.skinId, s.category) : null;
    if (!path) continue;
    imageCache.get(path).then(im => {
      if (!im) return;
      cell.style.background = '#0d1226 url(' + path + ') center/cover no-repeat';
      cell.classList.add('skin-art');
      // имя — маленькая табличка внизу, не закрывает арт
      [...cell.querySelectorAll('*')].forEach(el => {
        if (el.children.length === 0 && (s.name || '###') !== '###' && el.textContent.trim().indexOf(s.name) !== -1) {
          el.style.cssText += ';position:absolute;left:0;right:0;bottom:0;top:auto!important;background:rgba(5,8,20,.78);color:#ffd54f;font-size:8px;padding:1px 3px;text-align:center;letter-spacing:.5px;';
        }
      });
    });
  }
}
const _ui132 = window.updateUI;
window.updateUI = function () { _ui132(); paintSkinCells132(); };
// ============================================
// ДОПОЛНЕНИЕ v133 — ТАБЛИЧКА КЛЕТКИ СКИНА: РИСУЕМ САМИ, КИРИЛЛИЦА ОК
// ============================================
function paintSkinCells132() {
  if (!S || !window.SKINS) return;
  for (let idx = 0; idx < GAME_CONFIG.boardSize; idx++) {
    const d = getCellData(idx);
    const cell = document.getElementById('cell_' + idx);
    if (!d || !cell || d.type !== 'skin') continue;
    const s = SKINS[d.skinId] || {};
    const path = window.getSkinImage ? getSkinImage(d.skinId, s.category) : null;
    cell.style.position = 'relative';
    // своя табличка — всегда на месте
    let plate = cell.querySelector('.skin-plate-132');
    if (!plate) { plate = document.createElement('div'); plate.className = 'skin-plate-132'; cell.appendChild(plate); }
    plate.textContent = (s.name || d.skinId) + (s.price ? ' · ' + s.price + '💰' : '');
    plate.style.cssText = 'position:absolute;left:0;right:0;bottom:0;background:rgba(5,8,20,.82);color:#ffd54f;font-size:8px;padding:1px 3px;text-align:center;letter-spacing:.5px;z-index:2;border-top:1px solid rgba(212,175,55,.4);';
    // родную табличку (имя/цену) прячем, чтобы не двоилось
    [...cell.querySelectorAll('*')].forEach(el => {
      if (el === plate || el.children.length) return;
      const t = el.textContent.trim();
      if (t && ((s.name && t.indexOf(s.name) !== -1) || t === String(s.price))) el.style.visibility = 'hidden';
    });
    // арт, если положил файл
    if (path) imageCache.get(path).then(im => {
      if (im) { cell.style.background = '#0d1226 url(' + path + ') center/cover no-repeat'; cell.classList.add('skin-art'); }
    });
  }
}
// ============================================
// ДОПОЛНЕНИЕ v134 — УБИРАЕМ ЦЕНТРОВУЮ НАДПИСЬ С КЛЕТКИ СКИНА
// ============================================
const _ui134 = window.updateUI;
window.updateUI = function () {
  _ui134();
  if (!S || !window.SKINS) return;
  for (let idx = 0; idx < GAME_CONFIG.boardSize; idx++) {
    const d = getCellData(idx);
    const cell = document.getElementById('cell_' + idx);
    if (!d || !cell || d.type !== 'skin') continue;
    const plate = cell.querySelector('.skin-plate-132');
    [...cell.querySelectorAll('*')].forEach(el => {
      if (plate && el === plate) return;
      if (el.children.length) return;
      const t = el.textContent.trim();
      if (t.length > 3) el.style.visibility = 'hidden'; // центральное имя и прочие длинные надписи — вон
    });
  }
};
// ============================================
// ДОПОЛНЕНИЕ v135 — QR-LIVE: РОЛИ НА ТЕЛЕФОНЫ ЧЕРЕЗ PEERJS (GitHub Pages)
// ============================================
function loadPeerJS135() {
  return new Promise((res, rej) => {
    if (window.Peer) return res();
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
    s.onload = () => res(); s.onerror = () => rej(new Error('no peerjs'));
    document.head.appendChild(s);
  });
}
window.showQRScreen = async function () {
  const humans = S.players.filter(p => !p.isBot);
  let peer = null, phoneUrl = '';
  try {
    await loadPeerJS135();
    const roomId = ('MM' + Math.random().toString(36).replace(/[^a-z0-9]/gi, '') + 'X').slice(0, 10).toUpperCase();
    peer = new Peer(roomId);
    await new Promise((res, rej) => { peer.on('open', res); peer.on('error', rej); setTimeout(() => rej(new Error('timeout')), 7000); });
    phoneUrl = location.href.split('#')[0].replace(/[^/]*$/, '') + 'phone.html#room=' + roomId;
  } catch (e) { peer = null; }
  const qrSrc = 'https://api.qrserver.com/v1/create-qr-code/?size=430x430&data=' + encodeURIComponent(phoneUrl || (location.href.split('#')[0].replace(/[^/]*$/, '') + 'phone.html'));
  const conns = [];
  if (peer) peer.on('connection', conn => {
    conn.on('open', () => {
      const p = humans[conns.length];
      conns.push(conn);
      if (p) {
        conn.send({ type: 'role', name: p.name, role: p.role, color: p.color });
        const el = document.getElementById('qr135-' + (conns.length - 1));
        if (el) { el.textContent = '✅ ' + p.name + ' — роль на телефоне'; el.style.color = '#7cfc9a'; }
      }
    });
  });
  const rows = humans.map((p, i) => '<div id="qr135-' + i + '" style="font-size:13px;color:#8a93af;padding:2px 0">⏳ ' + p.name + ' — не подключился</div>').join('');
  await showModal('<h2>📱 Игра с QR — живая</h2>' +
    '<p>Каждый сканирует ОДИН QR со своего телефона — роль придёт секретно (порядок: ' + humans.map(h => h.name).join(', ') + ').</p>' +
    '<div style="display:flex;justify-content:center;padding:10px"><div style="background:#fff;padding:12px;border-radius:14px"><img src="' + qrSrc + '" style="width:min(380px,70vw);display:block"></div></div>' +
    '<div style="text-align:center">' + rows + '</div>' +
    '<button data-v="go">🎲 Начать!</button><button data-v="skip">🙈 Без телефонов</button>');
  if (peer) window.MM_PEER = peer; // держим связь для следующих этапов
};
// ============================================
// ДОПОЛНЕНИЕ v136 — QR-ПЛАШКИ: СВЕЖИЙ QR КАЖДОМУ, НИ ОДНОЙ ПУСТОЙ
// ============================================
async function qrSeq111(oldHtml) {
  const t = document.createElement('template');
  t.innerHTML = oldHtml;
  const parsed = [...t.content.querySelectorAll('img')].map((im, i) => {
    let n = '';
    if (im.parentElement) { const d = im.parentElement.querySelector('div'); if (d) n = d.textContent.trim(); }
    return { name: n || im.alt || ('Игрок ' + (i + 1)), oldSrc: im.getAttribute('src'), i: i };
  });
  const items = [];
  for (const p of parsed) {
    let src = p.oldSrc;
    if (window.pairUrl && S) { // свежий QR напрямую, без reliance на старое окно
      const pl = S.players.find(x => x.name === p.name) || S.players[p.i];
      if (pl) { try { src = await pairUrl(pl.index); } catch (e) {} }
    }
    if (src) items.push({ name: p.name, src: src });
  }
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    await _sm111('<h2>📱 ' + it.name + ' — отсканируй свою роль</h2>' +
      '<p>Передай устройство игроку <b>' + it.name + '</b>. Остальные — не подглядывать!</p>' +
      '<div style="display:flex;justify-content:center;padding:14px"><div style="background:#fff;padding:14px;border-radius:16px;box-shadow:0 0 40px rgba(212,175,55,.45)">' +
      '<img src="' + it.src + '" onerror="this.style.opacity=.25;this.alt=\'❌ QR не загрузился — нажми дальше и вернись\'" style="width:min(430px,72vw);height:auto;display:block">' +
      '<div style="color:#000;text-align:center;font-weight:900;letter-spacing:2px;font-size:20px;padding-top:8px">' + it.name + '</div></div></div>' +
      '<p style="text-align:center;opacity:.6;font-size:12px">Плашка ' + (i + 1) + ' из ' + items.length + ' · роль откроется только на телефоне</p>' +
      '<button data-v="next">✅ ' + it.name + ' отсканировал — дальше</button>');
  }
  return _sm111('<h2>✅ Все получили роли</h2><p>🤖 Боты получили роли автоматически.</p><p style="opacity:.7">Город просыпается…</p><button data-v="go">🎲 Начать!</button>');
}
// ============================================
// ДОПОЛНЕНИЕ v137 — QR РИСУЮТСЯ ЛОКАЛЬНО (QRious), БЕЗ ВНЕШНИХ СЕРВИСОВ
// ============================================
function loadQRious137() {
  return new Promise((res, rej) => {
    if (window.QRious) return res();
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js';
    s.onload = () => res(); s.onerror = () => rej(new Error('no qrious'));
    document.head.appendChild(s);
  });
}
async function qrSeq111(oldHtml) {
  try { await loadQRious137(); } catch (e) {}
  const t = document.createElement('template');
  t.innerHTML = oldHtml;
  const parsed = [...t.content.querySelectorAll('img')].map((im, i) => {
    let n = '';
    if (im.parentElement) { const d = im.parentElement.querySelector('div'); if (d) n = d.textContent.trim(); }
    return { name: n || ('Игрок ' + (i + 1)), oldSrc: im.getAttribute('src'), i: i };
  });
  const items = [];
  for (const p of parsed) {
    let src = p.oldSrc;
    if (window.pairUrl && S) {
      const pl = S.players.find(x => x.name === p.name) || S.players[p.i];
      if (pl) { try { src = await pairUrl(pl.index); } catch (e) {} }
    }
    // если src — ссылка (а не картинка), рисуем QR сами локально
    if (src && src.indexOf('data:image') !== 0 && window.QRious) {
      try { src = new QRious({ value: src, size: 460, level: 'M' }).toDataURL(); } catch (e) {}
    }
    if (src) items.push({ name: p.name, src: src });
  }
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    await _sm111('<h2>📱 ' + it.name + ' — отсканируй свою роль</h2>' +
      '<p>Передай устройство игроку <b>' + it.name + '</b>. Остальные — не подглядывать!</p>' +
      '<div style="display:flex;justify-content:center;padding:14px"><div style="background:#fff;padding:14px;border-radius:16px;box-shadow:0 0 40px rgba(212,175,55,.45)">' +
      '<img src="' + it.src + '" style="width:min(430px,72vw);height:auto;display:block">' +
      '<div style="color:#000;text-align:center;font-weight:900;letter-spacing:2px;font-size:20px;padding-top:8px">' + it.name + '</div></div></div>' +
      '<p style="text-align:center;opacity:.6;font-size:12px">Плашка ' + (i + 1) + ' из ' + items.length + ' · роль откроется только на телефоне</p>' +
      '<button data-v="next">✅ ' + it.name + ' отсканировал — дальше</button>');
  }
  return _sm111('<h2>✅ Все получили роли</h2><p>🤖 Боты получили роли автоматически.</p><p style="opacity:.7">Город просыпается…</p><button data-v="go">🎲 Начать!</button>');
}
// ============================================
// ДОПОЛНЕНИЕ v138 — ТЕЛЕФОН = ВТОРОЙ ЭКРАН, МОНИТОР = ПОЛЕ + ПОРТРЕТЫ
// ============================================
function qrBroadcast138(msg) {
  const peer = window.MM_PEER;
  if (!peer || !peer.connections) return;
  try { Object.keys(peer.connections).forEach(k => { (peer.connections[k] || []).forEach(c => { if (c.open) c.send(msg); }); }); } catch (e) {}
}
function qrAnyOpen138() {
  const peer = window.MM_PEER;
  if (!peer || !peer.connections) return false;
  return Object.keys(peer.connections).some(k => (peer.connections[k] || []).some(c => c.open));
}
function qrMinimal138() {
  if (document.getElementById('qrbar138')) return;
  const bar = document.createElement('div');
  bar.id = 'qrbar138';
  bar.style.cssText = 'position:fixed;left:50%;bottom:10px;transform:translateX(-50%);z-index:300;display:flex;gap:10px;';
  document.body.appendChild(bar);
  ['rollBtn', 'endBtn'].forEach(id => { const el = document.getElementById(id); if (el) bar.appendChild(el); });
  document.body.classList.add('qrlive-min');
}
function qrState138() {
  if (!S || !window.MM_PEER) return;
  if (qrAnyOpen138()) qrMinimal138(); else return;
  const logEl = document.getElementById('log') || document.querySelector('.log');
  const lastLog = logEl && logEl.firstElementChild ? logEl.firstElementChild.textContent.trim() : '';
  qrBroadcast138({
    type: 'state', round: S.round,
    turn: S.players[S.cur] ? S.players[S.cur].name : '',
    lastLog: lastLog,
    players: S.players.map(p => ({
      name: p.name, color: p.color, isBot: !!p.isBot, coins: p.coins,
      suspect: p.suspect && p.suspect.get ? p.suspect.get() : p.suspect,
      fatigue: p.fatigue && p.fatigue.get ? p.fatigue.get() : p.fatigue,
      fear: p.fear && p.fear.get ? p.fear.get() : p.fear,
      tokens: p.tokens
    }))
  });
}
const _ui138 = window.updateUI;
window.updateUI = function () { _ui138(); qrState138(); };
// ============================================
// ДОПОЛНЕНИЕ v139 — QR ВЕДЁТ НА ТЕЛЕФОН, А НЕ НА КАРТИНКУ QR
// ============================================
function normQr139(src) {
  if (!src) return null;
  if (src.indexOf('data:image') === 0) return src; // уже картинка
  // это ссылка на qr-картинку сервиса → вытаскиваем из неё настоящую data-ссылку
  if (src.indexOf('qrserver') !== -1 || src.indexOf('create-qr-code') !== -1) {
    const m = src.match(/[?&]data=([^&]+)/);
    if (m) { try { src = decodeURIComponent(m[1].replace(/\+/g, ' ')); } catch (e) {} }
  }
  // рисуем QR локально (QRious) — без лимитов и пустых плашек
  if (window.QRious) { try { return new QRious({ value: src, size: 460, level: 'M' }).toDataURL(); } catch (e) {} }
  return src;
}
async function qrSeq111(oldHtml) {
  try { await loadQRious137(); } catch (e) {}
  const t = document.createElement('template');
  t.innerHTML = oldHtml;
  const parsed = [...t.content.querySelectorAll('img')].map((im, i) => {
    let n = '';
    if (im.parentElement) { const d = im.parentElement.querySelector('div'); if (d) n = d.textContent.trim(); }
    return { name: n || ('Игрок ' + (i + 1)), oldSrc: im.getAttribute('src'), i: i };
  });
  const items = [];
  for (const p of parsed) {
    let src = p.oldSrc;
    if (window.pairUrl && S) {
      const pl = S.players.find(x => x.name === p.name) || S.players[p.i];
      if (pl) { try { src = await pairUrl(pl.index); } catch (e) {} }
    }
    src = normQr139(src);
    if (src) items.push({ name: p.name, src: src });
  }
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    await _sm111('<h2>📱 ' + it.name + ' — отсканируй свою роль</h2>' +
      '<p>Передай устройство игроку <b>' + it.name + '</b>. Остальные — не подглядывать!</p>' +
      '<div style="display:flex;justify-content:center;padding:14px"><div style="background:#fff;padding:14px;border-radius:16px;box-shadow:0 0 40px rgba(212,175,55,.45)">' +
      '<img src="' + it.src + '" style="width:min(430px,72vw);height:auto;display:block">' +
      '<div style="color:#000;text-align:center;font-weight:900;letter-spacing:2px;font-size:20px;padding-top:8px">' + it.name + '</div></div></div>' +
      '<p style="text-align:center;opacity:.6;font-size:12px">Плашка ' + (i + 1) + ' из ' + items.length + ' · роль откроется только на телефоне</p>' +
      '<button data-v="next">✅ ' + it.name + ' отсканировал — дальше</button>');
  }
  return _sm111('<h2>✅ Все получили роли</h2><p>🤖 Боты получили роли автоматически.</p><p style="opacity:.7">Город просыпается…</p><button data-v="go">🎲 Начать!</button>');
}
// ============================================
// ДОПОЛНЕНИЕ v140 — QR ПЛАШЕК СОДЕРЖИТ РОЛЬ НАПРЯМУЮ (без матрёшки)
// ============================================
async function qrSeq111(oldHtml) {
  try { await loadQRious137(); } catch (e) {}
  const base = location.href.split('#')[0].replace(/[^/]*$/, '') + 'phone.html';
  const list = S.players.filter(p => !p.isBot);
  const items = list.map(p => {
    let src = '';
    try {
      src = new QRious({ value: base + '#r=' + btoa(unescape(encodeURIComponent(JSON.stringify({ n: p.name, r: p.role, c: p.color })))), size: 460, level: 'M' }).toDataURL();
    } catch (e) {}
    return { name: p.name, src: src };
  }).filter(x => x.src);
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    await _sm111('<h2>📱 ' + it.name + ' — отсканируй свою роль</h2>' +
      '<p>Передай устройство игроку <b>' + it.name + '</b>. Остальные — не подглядывать!</p>' +
      '<div style="display:flex;justify-content:center;padding:14px"><div style="background:#fff;padding:14px;border-radius:16px;box-shadow:0 0 40px rgba(212,175,55,.45)">' +
      '<img src="' + it.src + '" style="width:min(430px,72vw);height:auto;display:block">' +
      '<div style="color:#000;text-align:center;font-weight:900;letter-spacing:2px;font-size:20px;padding-top:8px">' + it.name + '</div></div></div>' +
      '<p style="text-align:center;opacity:.6;font-size:12px">Плашка ' + (i + 1) + ' из ' + items.length + ' · роль откроется только на телефоне</p>' +
      '<button data-v="next">✅ ' + it.name + ' отсканировал — дальше</button>');
  }
  return _sm111('<h2>✅ Все получили роли</h2><p>🤖 Боты получили роли автоматически.</p><p style="opacity:.7">Город просыпается…</p><button data-v="go">🎲 Начать!</button>');
}
// ============================================
// ДОПОЛНЕНИЕ v141 — ОДИН QR НА ВСЕХ + ТЕЛЕФОН-ПУЛЬТ (кубик/ход с телефона)
// ============================================
function phoneCmd141(d, conn) {
  if (!S || !d || !d.cmd) return;
  const cur = S.players[S.cur];
  if (!cur || cur.isBot || cur.name !== conn._mmName) return; // только свой ход
  if (d.cmd === 'roll') { const b = document.getElementById('rollBtn'); if (b && !b.disabled && !S.isBusy) rollDice(); }
  if (d.cmd === 'end') { const b = document.getElementById('endBtn'); if (b && !b.disabled) endTurn(); }
}
window.showQRScreen = async function () {
  const humans = S.players.filter(p => !p.isBot);
  let peer = null, phoneUrl = '';
  try {
    await loadPeerJS135();
    await loadQRious137();
    const roomId = ('MM' + Math.random().toString(36).replace(/[^a-z0-9]/gi, '') + 'X').slice(0, 10).toUpperCase();
    peer = new Peer(roomId);
    await new Promise((res, rej) => { peer.on('open', res); peer.on('error', rej); setTimeout(() => rej(new Error('timeout')), 7000); });
    phoneUrl = location.href.split('#')[0].replace(/[^/]*$/, '') + 'phone.html#room=' + roomId;
  } catch (e) { peer = null; }
  if (!peer) return qrSeq111(''); // PeerJS не завёлся — старые надёжные плашки
  window.MM_PEER = peer;
  const qrSrc = new QRious({ value: phoneUrl, size: 460, level: 'M' }).toDataURL();
  const conns = [];
  peer.on('connection', conn => {
    conn.on('open', () => {
      const p = humans[conns.length];
      conns.push(conn);
      if (p) { conn._mmName = p.name; conn.send({ type: 'role', name: p.name, role: p.role, color: p.color }); }
      const el = document.getElementById('qr141-' + (conns.length - 1));
      if (el) { el.textContent = '✅ ' + (p ? p.name : 'гость') + ' — на связи: роль и пульт на телефоне'; el.style.color = '#7cfc9a'; }
    });
    conn.on('data', d => phoneCmd141(d, conn));
  });
  const rows = humans.map((p, i) => '<div id="qr141-' + i + '" style="font-size:13px;color:#8a93af;padding:2px 0">⏳ ' + p.name + ' — не в сети</div>').join('');
  const ch = await showModal('<h2>📱 Один QR на всех</h2><p>Каждый сканирует со своего телефона: секретная роль + живой пульт (🎲 кубик, ✅ ход, статистика, события).</p>' +
    '<div style="display:flex;justify-content:center;padding:10px"><div style="background:#fff;padding:12px;border-radius:14px"><img src="' + qrSrc + '" style="width:min(380px,70vw);display:block"></div></div>' +
    '<div style="text-align:center">' + rows + '</div>' +
    '<button data-v="go">🎲 Начать!</button><button data-v="seq">🙈 Плашки по очереди</button>');
  if (ch === 'seq') return qrSeq111('');
};
// ============================================
// ДОПОЛНЕНИЕ v142 — ПЛАШКИ + ЖИВОЙ ПУЛЬТ ОДНОВРЕМЕННО (room внутри QR плашки)
// ============================================
async function qrSeq111(oldHtml) {
  try { await loadQRious137(); } catch (e) {}
  let roomId = '';
  try {
    await loadPeerJS135();
    roomId = ('MM' + Math.random().toString(36).replace(/[^a-z0-9]/gi, '') + 'X').slice(0, 10).toUpperCase();
    const peer = new Peer(roomId);
    await new Promise((res, rej) => { peer.on('open', res); peer.on('error', rej); setTimeout(() => rej(new Error('t')), 5000); });
    window.MM_PEER = peer;
    peer.on('connection', conn => {
      conn.on('data', d => {
        if (d && d.type === 'hello' && d.name) {
          conn._mmName = d.name;
          const p = S && S.players.find(x => x.name === d.name);
          if (p) conn.send({ type: 'role', name: p.name, role: p.role, color: p.color });
        } else phoneCmd141(d, conn);
      });
    });
  } catch (e) { roomId = ''; } // нет PeerJS — плашки работают офлайн
  const base = location.href.split('#')[0].replace(/[^/]*$/, '') + 'phone.html';
  const list = S.players.filter(p => !p.isBot);
  const items = list.map(p => {
    let src = '';
    try {
      const link = base + '#r=' + btoa(unescape(encodeURIComponent(JSON.stringify({ n: p.name, r: p.role, c: p.color })))) + (roomId ? '&room=' + roomId : '');
      src = new QRious({ value: link, size: 460, level: 'M' }).toDataURL();
    } catch (e) {}
    return { name: p.name, src: src };
  }).filter(x => x.src);
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    await _sm111('<h2>📱 ' + it.name + ' — отсканируй свою роль</h2>' +
      '<p>Передай устройство игроку <b>' + it.name + '</b>. Остальные — не подглядывать!</p>' +
      '<div style="display:flex;justify-content:center;padding:14px"><div style="background:#fff;padding:14px;border-radius:16px;box-shadow:0 0 40px rgba(212,175,55,.45)">' +
      '<img src="' + it.src + '" style="width:min(430px,72vw);height:auto;display:block">' +
      '<div style="color:#000;text-align:center;font-weight:900;letter-spacing:2px;font-size:20px;padding-top:8px">' + it.name + '</div></div></div>' +
      '<p style="text-align:center;opacity:.6;font-size:12px">Плашка ' + (i + 1) + ' из ' + items.length + ' · роль и пульт откроются на телефоне</p>' +
      '<button data-v="next">✅ ' + it.name + ' отсканировал — дальше</button>');
  }
  return _sm111('<h2>✅ Все получили роли</h2><p>🤖 Боты получили роли автоматически.</p><p style="opacity:.7">Город просыпается…</p><button data-v="go">🎲 Начать!</button>');
}
// ============================================
// ДОПОЛНЕНИЕ v143 — КОД ПОДКЛЮЧАЕТ ТВОИ АРТЫ: ДЕЙСТВИЯ + МОРАЛЬ + ПОРТРЕТЫ
// ============================================
function artPath143(kind, key) {
  if (kind === 'chip') return 'img/chips/' + key + '.png';
  if (kind === 'mor') return 'img/morals/' + key + '.png';
  if (kind === 'skin' && window.SKINS && SKINS[key]) return window.getSkinImage ? getSkinImage(key, SKINS[key].category) : 'img/skins/' + key + '.png';
  return null;
}
function injectArts143(root) {
  (root || document).querySelectorAll('img.hc-art, img.mo-art').forEach(img => {
    if (img.dataset.done143) return;
    const key = img.dataset.key;
    if (!key) return;
    const path = img.classList.contains('mo-art') ? 'img/morals/' + key + '.png' : artPath143(img.dataset.kind, key);
    if (!path) return;
    img.dataset.done143 = '1';
    imageCache.get(path).then(im => {
      if (im) {
        img.src = path;
        img.style.display = 'block';
        const ph = img.nextElementSibling;
        if (ph && ph.classList && ph.classList.contains('hc-ph')) ph.style.display = 'none';
      }
    });
  });
  // портреты: любой элемент с data-name/title = имя игрока получает лицо
  if (window.S && S.players) S.players.forEach(p => {
    document.querySelectorAll('[data-name="' + p.name + '"], [title="' + p.name + '"]').forEach(el => {
      if (el.dataset.face143) return;
      el.dataset.face143 = '1';
      imageCache.get('img/faces/' + p.name + '.png').then(im => {
        if (im) {
          el.style.backgroundImage = 'url(img/faces/' + p.name + '.png)';
          el.style.backgroundSize = 'cover';
          el.style.backgroundPosition = 'center';
        }
      });
    });
  });
}
const _ui143 = window.updateUI;
window.updateUI = function () { _ui143(); injectArts143(); };
// и во всплывающих окнах (выбор морали и т.д.)
const _sm143 = window.showModal;
window.showModal = function (html, opts) {
  const pr = _sm143(html, opts);
  setTimeout(() => injectArts143(), 80);
  return pr;
};
// ============================================
// ДОПОЛНЕНИЕ v144 — PEERJS С ТРЁХ CDN + ДИАГНОСТИКА В КОНСОЛЬ
// ============================================
function loadPeerJS135() {
  return new Promise((res, rej) => {
    if (window.Peer) { console.log('📡 PeerJS уже на борту'); return res(); }
    const urls = [
      'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js',
      'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.4/peerjs.min.js'
    ];
    let i = 0;
    const next = () => {
      if (i >= urls.length) { console.log('❌ PeerJS: все CDN недоступны'); return rej(new Error('no peerjs cdn')); }
      const u = urls[i++];
      const s = document.createElement('script');
      s.src = u;
      s.onload = () => { if (window.Peer) { console.log('📡 PeerJS загружен с', u); res(); } else next(); };
      s.onerror = () => { console.log('⚠️ CDN не ответил:', u); next(); };
      document.head.appendChild(s);
    };
    next();
  });
}
// ============================================
// ДОПОЛНЕНИЕ v145 — ЖИВОЙ КАНАЛ ЧЕРЕЗ MQTT (вместо PeerJS/WebRTC)
// ============================================
let mmBus145 = null;
function mmLoad145() {
  return new Promise((res, rej) => {
    if (window.mqtt) return res();
    const urls = ['https://cdn.jsdelivr.net/npm/mqtt@5.7.0/dist/mqtt.min.js', 'https://unpkg.com/mqtt@5.7.0/dist/mqtt.min.js'];
    let i = 0;
    const next = () => { if (i >= urls.length) return rej(new Error('no mqtt')); const s = document.createElement('script'); s.src = urls[i++]; s.onload = () => window.mqtt ? res() : next(); s.onerror = next; document.head.appendChild(s); };
    next();
  });
}
async function mmStartPc145() {
  await mmLoad145();
  const room = ('MM' + Math.random().toString(36).replace(/[^a-z0-9]/gi, '') + 'X').slice(0, 10).toUpperCase();
  const client = mqtt.connect('wss://broker.hivemq.com:8884/mqtt', { clientId: 'pc' + Math.random().toString(36).slice(2, 8), reconnectPeriod: 5000 });
  await new Promise((res, rej) => { const t = setTimeout(() => rej(new Error('mqtt timeout')), 6000); client.on('connect', () => { clearTimeout(t); res(); }); client.on('error', rej); });
  client.subscribe('mm145/' + room + '/up');
  mmBus145 = { client: client, room: room, joined: {} };
  client.on('message', (topic, payload) => {
    try {
      const m = JSON.parse(payload.toString());
      if (m.type === 'hello' && m.name) {
        mmBus145.joined[m.name] = true;
        const p = S && S.players.find(x => x.name === m.name);
        if (p) mmSend145(m.name, { type: 'role', name: p.name, role: p.role, color: p.color });
        console.log('📱 Телефон подключился:', m.name);
      } else if (m.name && m.d) phoneCmd141(m.d, { _mmName: m.name });
    } catch (e) {}
  });
  return room;
}
function mmSend145(name, obj) { if (mmBus145) mmBus145.client.publish('mm145/' + mmBus145.room + '/down/' + name, JSON.stringify(obj)); }
function qrBroadcast138(msg) { if (mmBus145) mmBus145.client.publish('mm145/' + mmBus145.room + '/down/all', JSON.stringify(msg)); }
function qrAnyOpen138() { return !!(mmBus145 && Object.keys(mmBus145.joined).length); }
async function qrSeq111(oldHtml) {
  try { await loadQRious137(); } catch (e) {}
  let room = '';
  try { room = await mmStartPc145(); console.log('🌐 Комната MQTT создана:', room); } catch (e) { console.log('❌ MQTT не завёлся:', e && e.message); }
  const base = location.href.split('#')[0].replace(/[^/]*$/, '') + 'phone.html';
  const list = S.players.filter(p => !p.isBot);
  const items = list.map(p => {
    let src = '';
    try {
      const link = base + '#r=' + btoa(unescape(encodeURIComponent(JSON.stringify({ n: p.name, r: p.role, c: p.color })))) + (room ? '&room=' + room : '');
      src = new QRious({ value: link, size: 460, level: 'M' }).toDataURL();
    } catch (e) {}
    return { name: p.name, src: src };
  }).filter(x => x.src);
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    await _sm111('<h2>📱 ' + it.name + ' — отсканируй свою роль</h2>' +
      '<p>Передай устройство игроку <b>' + it.name + '</b>. Остальные — не подглядывать!</p>' +
      '<div style="display:flex;justify-content:center;padding:14px"><div style="background:#fff;padding:14px;border-radius:16px;box-shadow:0 0 40px rgba(212,175,55,.45)">' +
      '<img src="' + it.src + '" style="width:min(430px,72vw);height:auto;display:block">' +
      '<div style="color:#000;text-align:center;font-weight:900;letter-spacing:2px;font-size:20px;padding-top:8px">' + it.name + '</div></div></div>' +
      '<p style="text-align:center;opacity:.6;font-size:12px">Плашка ' + (i + 1) + ' из ' + items.length + ' · роль и пульт откроются на телефоне</p>' +
      '<button data-v="next">✅ ' + it.name + ' отсканировал — дальше</button>');
  }
  return _sm111('<h2>✅ Все получили роли</h2><p>🤖 Боты получили роли автоматически.</p><p style="opacity:.7">Город просыпается…</p><button data-v="go">🎲 Начать!</button>');
}
// ============================================
// ДОПОЛНЕНИЕ v146 — УБИРАЮ ХВОСТ PEERJS: ПЛАШКИ+MQTT СРАЗУ, БЕЗ 7 СЕКУНД ОЖИДАНИЯ
// ============================================
window.showQRScreen = function () { return qrSeq111(''); };
// ============================================
// ДОПОЛНЕНИЕ v147 — ПЕРЕБОР БРОКЕРОВ: HIVEMQ → EMQX → MOSQUITTO
// ============================================
function mmConnect147(url, prefix) {
  return new Promise((res, rej) => {
    const c = mqtt.connect(url, { clientId: prefix + Math.random().toString(36).slice(2, 8), reconnectPeriod: 60000, connectTimeout: 5000 });
    const t = setTimeout(() => { c.end(true); rej(new Error('timeout ' + url)); }, 5000);
    c.on('connect', () => { clearTimeout(t); res(c); });
    c.on('error', e => { clearTimeout(t); c.end(true); rej(e); });
  });
}
const MM_BROKERS147 = ['wss://mqtt.eclipseprojects.io:443/mqtt', 'wss://broker.hivemq.com:8884/mqtt', 'wss://broker.emqx.io:8084/mqtt'];
async function mmStartPc145() {
  await mmLoad145();
  const room = ('MM' + Math.random().toString(36).replace(/[^a-z0-9]/gi, '') + 'X').slice(0, 10).toUpperCase();
  let client = null;
  for (const u of MM_BROKERS147) {
    try { client = await mmConnect147(u, 'pc'); console.log('🌐 Брокер ПК:', u); break; } catch (e) { console.log('⚠️ Брокер не ответил:', u); }
  }
  if (!client) throw new Error('all brokers dead');
  client.subscribe('mm145/' + room + '/up');
  mmBus145 = { client: client, room: room, joined: {} };
  client.on('message', (topic, payload) => {
    try {
      const m = JSON.parse(payload.toString());
      if (m.type === 'hello' && m.name) {
        mmBus145.joined[m.name] = true;
        const p = S && S.players.find(x => x.name === m.name);
        if (p) mmSend145(m.name, { type: 'role', name: p.name, role: p.role, color: p.color });
        console.log('📱 Телефон подключился:', m.name);
      } else if (m.name && m.d) phoneCmd141(m.d, { _mmName: m.name });
    } catch (e) {}
  });
  return room;
}
// ============================================
// ДОПОЛНЕНИЕ v148 — НАДЁЖНАЯ ТРАНСЛЯЦИЯ СОСТОЯНИЯ НА ТЕЛЕФОНЫ
// ============================================
function qrState138() {
  try {
    if (!S || !mmBus145 || !Object.keys(mmBus145.joined).length) return;
    const now = Date.now();
    if (now - (window._mm148t || 0) < 800) return;
    window._mm148t = now;
    const cur = S.players[S.cur] || {};
    const logEl = document.querySelector('#log div, .log div, .log-line, .chronicle div');
    qrBroadcast138({
      type: 'state',
      round: S.round || S.turnCount || 1,
      turn: cur.name || '',
      lastLog: logEl ? logEl.textContent.trim() : '',
      players: S.players.map(p => ({
        name: p.name,
        coins: p.coins != null ? p.coins : p.money,
        suspect: p.suspect != null ? p.suspect : p.suspicion,
        fatigue: p.fatigue != null ? p.fatigue : p.tired,
        fear: p.fear != null ? p.fear : p.scared,
        tokens: p.tokens != null ? p.tokens : 0
      }))
    });
  } catch (e) {}
}
// ============================================
// ДОПОЛНЕНИЕ v149 — QR НЕСЁТ НОМЕР БРОКЕРА: ПК И ТЕЛЕФОН В ОДНОЙ ВСЕЛЕННОЙ
// ============================================
async function mmStartPc145() {
  await mmLoad145();
  const room = ('MM' + Math.random().toString(36).replace(/[^a-z0-9]/gi, '') + 'X').slice(0, 10).toUpperCase();
  let client = null, b = 0;
  for (let i = 0; i < MM_BROKERS147.length; i++) {
    try { client = await mmConnect147(MM_BROKERS147[i], 'pc'); b = i; console.log('🌐 Брокер ПК:', MM_BROKERS147[i]); break; }
    catch (e) { console.log('⚠️ Брокер не ответил:', MM_BROKERS147[i]); }
  }
  if (!client) throw new Error('all brokers dead');
  client.subscribe('mm145/' + room + '/up');
  mmBus145 = { client: client, room: room, joined: {}, b: b };
  client.on('message', (topic, payload) => {
    try {
      const m = JSON.parse(payload.toString());
      if (m.type === 'hello' && m.name) {
        mmBus145.joined[m.name] = true;
        const p = S && S.players.find(x => x.name === m.name);
        if (p) mmSend145(m.name, { type: 'role', name: p.name, role: p.role, color: p.color });
        console.log('📱 Телефон подключился:', m.name);
      } else if (m.name && m.d) phoneCmd141(m.d, { _mmName: m.name });
    } catch (e) {}
  });
  return room;
}
async function qrSeq111(oldHtml) {
  try { await loadQRious137(); } catch (e) {}
  let room = '';
  try { room = await mmStartPc145(); console.log('🌐 Комната MQTT создана:', room); } catch (e) { console.log('❌ MQTT не завёлся:', e && e.message); }
  const base = location.href.split('#')[0].replace(/[^/]*$/, '') + 'phone.html';
  const bIdx = mmBus145 ? mmBus145.b : 0;
  const list = S.players.filter(p => !p.isBot);
  const items = list.map(p => {
    let src = '';
    try {
      const link = base + '#r=' + btoa(unescape(encodeURIComponent(JSON.stringify({ n: p.name, r: p.role, c: p.color })))) + (room ? '&room=' + room + '&b=' + bIdx : '');
      src = new QRious({ value: link, size: 460, level: 'M' }).toDataURL();
    } catch (e) {}
    return { name: p.name, src: src };
  }).filter(x => x.src);
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    await _sm111('<h2>📱 ' + it.name + ' — отсканируй свою роль</h2>' +
      '<p>Передай устройство игроку <b>' + it.name + '</b>. Остальные — не подглядывать!</p>' +
      '<div style="display:flex;justify-content:center;padding:14px"><div style="background:#fff;padding:14px;border-radius:16px;box-shadow:0 0 40px rgba(212,175,55,.45)">' +
      '<img src="' + it.src + '" style="width:min(430px,72vw);height:auto;display:block">' +
      '<div style="color:#000;text-align:center;font-weight:900;letter-spacing:2px;font-size:20px;padding-top:8px">' + it.name + '</div></div></div>' +
      '<p style="text-align:center;opacity:.6;font-size:12px">Плашка ' + (i + 1) + ' из ' + items.length + ' · роль и пульт откроются на телефоне</p>' +
      '<button data-v="next">✅ ' + it.name + ' отсканировал — дальше</button>');
  }
  return _sm111('<h2>✅ Все получили роли</h2><p>🤖 Боты получили роли автоматически.</p><p style="opacity:.7">Город просыпается…</p><button data-v="go">🎲 Начать!</button>');
}
// ============================================
// ДОПОЛНЕНИЕ v150 — ЧИСЛА ВМЕСТО [object Object] НА ТЕЛЕФОНЕ
// ============================================
function num150(v) {
  if (typeof v === 'number') return v;
  if (v && typeof v.get === 'function') return v.get();
  if (v && typeof v.value === 'number') return v.value;
  return 0;
}
function qrState138() {
  try {
    if (!S || !mmBus145 || !Object.keys(mmBus145.joined).length) return;
    const now = Date.now();
    if (now - (window._mm148t || 0) < 800) return;
    window._mm148t = now;
    const cur = S.players[S.cur] || {};
    const logEl = document.querySelector('#log div, .log div, .log-line, .chronicle div');
    qrBroadcast138({
      type: 'state',
      round: S.round || S.turnCount || 1,
      turn: cur.name || '',
      lastLog: logEl ? logEl.textContent.trim() : '',
      players: S.players.map(p => ({
        name: p.name,
        coins: num150(p.coins != null ? p.coins : p.money),
        suspect: num150(p.suspect),
        fatigue: num150(p.fatigue),
        fear: num150(p.fear),
        tokens: num150(p.tokens)
      }))
    });
  } catch (e) {}
}
// ============================================
// ДОПОЛНЕНИЕ v151 — ТВ-РЕЖИМ: АВТОПОДГОН ПОЛЯ + КНОПКИ МАСШТАБА
// ============================================
(function () {
  let k = 1;
  function board151() {
    return document.getElementById('board') || document.querySelector('.board') || document.getElementById('boardWrap') || document.querySelector('.board-wrap');
  }
  function apply151() { const b = board151(); if (b) b.style.zoom = k; }
  function auto151() {
    const b = board151(); if (!b) return;
    b.style.zoom = 1;
    const aw = window.innerWidth - 16, ah = window.innerHeight - 16;
    const bw = b.offsetWidth, bh = b.offsetHeight;
    if (bw && bh) { k = Math.min(aw / bw, ah / bh); k = Math.max(.35, Math.min(k, 2.5)); apply151(); }
  }
  window.addEventListener('resize', auto151);
  setTimeout(auto151, 1200);
  setTimeout(auto151, 3500);
  const bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;top:8px;left:8px;z-index:500;display:flex;gap:6px;';
  bar.innerHTML =
    '<button id="zmin151" style="width:38px;height:38px;border-radius:10px;border:2px solid #d4af37;background:#101632;color:#ffd54f;font-size:20px;font-weight:900;cursor:pointer">−</button>' +
    '<button id="zauto151" style="width:38px;height:38px;border-radius:10px;border:2px solid #d4af37;background:#101632;color:#ffd54f;font-size:18px;font-weight:900;cursor:pointer">⤢</button>' +
    '<button id="zplus151" style="width:38px;height:38px;border-radius:10px;border:2px solid #d4af37;background:#101632;color:#ffd54f;font-size:20px;font-weight:900;cursor:pointer">＋</button>';
  document.body.appendChild(bar);
  document.getElementById('zmin151').onclick = () => { k = Math.max(.35, k - .15); apply151(); };
  document.getElementById('zplus151').onclick = () => { k = Math.min(2.5, k + .15); apply151(); };
  document.getElementById('zauto151').onclick = auto151;
})();
// ============================================
// ДОПОЛНЕНИЕ v152 — ЗЕРКАЛО ОКОН: КУПИТЬ/ЖЕТОНЫ/УСЛЫШАЛ С ТЕЛЕФОНА
// ============================================
let _mmBtns152 = [];
function mmModalClick152(i) { const b = _mmBtns152[i]; if (b) b.click(); }
const _sm152 = window.showModal;
window.showModal = function (html, opts) {
  const pr = _sm152(html, opts);
  setTimeout(() => {
    if (!mmBus145 || !Object.keys(mmBus145.joined).length) return;
    const btns = [...document.querySelectorAll('.modal button, #modal button, [class*="modal"] button')].filter(b => b.getClientRects().length);
    if (!btns.length) return;
    _mmBtns152 = btns;
    const h2 = document.querySelector('.modal h2, #modal h2, [class*="modal"] h2');
    qrBroadcast138({ type: 'modal', title: h2 ? h2.textContent.trim() : 'Запрос города', buttons: btns.map(b => b.textContent.trim()) });
  }, 120);
  return pr;
};
// ============================================
// ДОПОЛНЕНИЕ v153 — РУКА НА ТЕЛЕФОНЕ + КОМАНДЫ МОДАЛ/КАРТА
// ============================================
function phoneCmd141(d, conn) {
  if (!S || !d || !d.cmd) return;
  if (d.cmd === 'modal') { mmModalClick152(d.i | 0); return; }
  const cur = S.players[S.cur];
  if (!cur || cur.isBot || cur.name !== conn._mmName) return;
  if (d.cmd === 'roll') { const b = document.getElementById('rollBtn'); if (b && !b.disabled && !S.isBusy) rollDice(); }
  if (d.cmd === 'end') { const b = document.getElementById('endBtn'); if (b && !b.disabled) endTurn(); }
  if (d.cmd === 'play') { const el = document.querySelector('[data-key="' + d.key + '"]'); if (el) el.click(); }
}
function qrState138() {
  try {
    if (!S || !mmBus145 || !Object.keys(mmBus145.joined).length) return;
    const now = Date.now();
    if (now - (window._mm148t || 0) < 800) return;
    window._mm148t = now;
    const cur = S.players[S.cur] || {};
    const logEl = document.querySelector('#log div, .log div, .log-line, .chronicle div');
    qrBroadcast138({
      type: 'state', round: S.round || S.turnCount || 1, turn: cur.name || '',
      lastLog: logEl ? logEl.textContent.trim() : '',
      players: S.players.map(p => ({
        name: p.name, coins: num150(p.coins != null ? p.coins : p.money),
        suspect: num150(p.suspect), fatigue: num150(p.fatigue), fear: num150(p.fear), tokens: num150(p.tokens)
      }))
    });
    if (cur && !cur.isBot && mmBus145.joined[cur.name]) {
      const cards = (cur.hand || []).map(it => {
        const key = typeof it === 'string' ? it : (it.key || it.id || '');
        const nm = (window.CHIPS && CHIPS[key] && CHIPS[key].name) || (window.SKINS && SKINS[key] && SKINS[key].name) ||
          (window.MORAL_DECK && MORAL_DECK.find ? ((MORAL_DECK.find(m => m.id === key) || {}).name) : '') || key;
        return { key: key, name: nm };
      });
      mmSend145(cur.name, { type: 'hand', cards: cards });
    }
  } catch (e) {}
}
// ============================================
// ДОПОЛНЕНИЕ v155 — ТВ-СПАСАТЕЛЬ: ВЕРНУТЬ ПОЛЕ ИЗ «ПИЛЮЛИ»
// ============================================
(function () {
  function board155() {
    return document.getElementById('board') || document.querySelector('.board') || document.getElementById('boardWrap') || document.querySelector('.board-wrap');
  }
  window.tvRescue155 = function () {
    const b = board155(); if (!b) return;
    let el = b;
    for (let i = 0; i < 4 && el; i++) { el.style.transform = 'none'; el.style.zoom = '1'; el = el.parentElement; }
    b.style.width = '1000px'; b.style.height = '1000px';
    b.style.minWidth = '1000px'; b.style.flex = 'none';
    const wrap = b.parentElement;
    const aw = (wrap && wrap.clientWidth > 200 ? wrap.clientWidth : window.innerWidth - 380);
    const ah = window.innerHeight - 140;
    const k = Math.max(.3, Math.min(aw / 1000, ah / 1000, 2));
    b.style.zoom = k;
    window.dispatchEvent(new Event('resize'));
  };
  const btn = document.createElement('button');
  btn.textContent = '📺';
  btn.title = 'Вернуть поле';
  btn.style.cssText = 'position:fixed;top:8px;left:132px;z-index:500;width:38px;height:38px;border-radius:10px;border:2px solid #d4af37;background:#101632;color:#ffd54f;font-size:18px;font-weight:900;cursor:pointer';
  btn.onclick = window.tvRescue155;
  document.body.appendChild(btn);
  setTimeout(window.tvRescue155, 2500); // авто-спасение после загрузки
})();
// ============================================
// ДОПОЛНЕНИЕ v156 — ДЕРЖАТЬ СВЯЗЬ + РУКА ПО ЛЮБОМУ ИМЕНИ СВОЙСТВА
// ============================================
function mmConnect147(url, prefix) {
  return new Promise((res, rej) => {
    const c = mqtt.connect(url, { clientId: prefix + Math.random().toString(36).slice(2, 8), reconnectPeriod: 3000, connectTimeout: 5000, keepalive: 30, clean: true });
    const t = setTimeout(() => { c.end(true); rej(new Error('timeout ' + url)); }, 5000);
    c.on('connect', () => { clearTimeout(t); res(c); });
    c.on('error', e => { clearTimeout(t); c.end(true); rej(e); });
  });
}
function qrState138() {
  try {
    if (!S || !mmBus145 || !Object.keys(mmBus145.joined).length) return;
    const now = Date.now();
    if (now - (window._mm148t || 0) < 800) return;
    window._mm148t = now;
    const cur = S.players[S.cur] || {};
    const logEl = document.querySelector('#log div, .log div, .log-line, .chronicle div');
    qrBroadcast138({
      type: 'state', round: S.round || S.turnCount || 1, turn: cur.name || '',
      lastLog: logEl ? logEl.textContent.trim() : '',
      players: S.players.map(p => ({
        name: p.name, coins: num150(p.coins != null ? p.coins : p.money),
        suspect: num150(p.suspect), fatigue: num150(p.fatigue), fear: num150(p.fear), tokens: num150(p.tokens)
      }))
    });
    if (cur && !cur.isBot && mmBus145.joined[cur.name]) {
      const handSrc = cur.hand || cur.cards || cur.handCards || [];
      const cards = handSrc.map(it => {
        const key = typeof it === 'string' ? it : (it.key || it.id || it.type || '');
        const nm = (window.CHIPS && CHIPS[key] && CHIPS[key].name) || (window.SKINS && SKINS[key] && SKINS[key].name) ||
          (window.MORAL_DECK && MORAL_DECK.find ? ((MORAL_DECK.find(m => m.id === key) || {}).name) : '') || key;
        return { key: key, name: nm };
      });
      mmSend145(cur.name, { type: 'hand', cards: cards });
    }
  } catch (e) {}
}
// ============================================
// ДОПОЛНЕНИЕ v157 — КАНАЛ ЧЕРЕЗ NTFY.SH (HTTPS 443, БЕЗ АККАУНТОВ)
// ============================================
const MM_NTFY = 'https://ntfy.sh';
async function mmStartPc145() {
  const room = ('MM' + Math.random().toString(36).replace(/[^a-z0-9]/gi, '') + 'X').slice(0, 10).toUpperCase();
  mmBus145 = {
    room: room, joined: {},
    client: { publish: (t, s) => fetch(MM_NTFY + '/' + t, { method: 'POST', body: s, headers: { 'Content-Type': 'text/plain' } }) }
  };
  const es = new EventSource(MM_NTFY + '/mm145_' + room + '_up/sse');
  es.onmessage = e => {
    try {
      const outer = JSON.parse(e.data);
      const m = JSON.parse(outer.message);
      if (m.type === 'hello' && m.name) {
        mmBus145.joined[m.name] = true;
        const p = S && S.players.find(x => x.name === m.name);
        if (p) mmSend145(m.name, { type: 'role', name: p.name, role: p.role, color: p.color });
        console.log('📱 Телефон подключился:', m.name);
      } else if (m.name && m.d) phoneCmd141(m.d, { _mmName: m.name });
    } catch (err) {}
  };
  console.log('🌐 Комната ntfy создана:', room);
  return room;
}
function mmSend145(name, obj) { if (mmBus145) mmBus145.client.publish('mm145_' + mmBus145.room + '_down_' + name, JSON.stringify(obj)); }
function qrBroadcast138(msg) { if (mmBus145) mmBus145.client.publish('mm145_' + mmBus145.room + '_down_all', JSON.stringify(msg)); }
function qrAnyOpen138() { return !!(mmBus145 && Object.keys(mmBus145.joined).length); }
// ============================================
// ДОПОЛНЕНИЕ v158 — РУКА ИЗ DOM, ГОЛОС-АВТОЗАТЫЧКА, ЗУМ К ЛОГО, АДАПТАЦИЯ
// ============================================
// 1) Рука читается из DOM — работает при любом имени свойства
function handFromDom158() {
  const seen = {}, cards = [];
  document.querySelectorAll('[data-key]').forEach(el => {
    const key = el.getAttribute('data-key');
    if (!key || seen[key]) return;
    if (!el.closest('.hand, .hand-panel, [class*="hand"], #hand')) return;
    seen[key] = 1;
    const nm = (window.CHIPS && CHIPS[key] && CHIPS[key].name) || (window.SKINS && SKINS[key] && SKINS[key].name) || key;
    cards.push({ key: key, name: nm });
  });
  return cards;
}
function qrState138() {
  try {
    if (!S || !mmBus145 || !Object.keys(mmBus145.joined).length) return;
    const now = Date.now();
    if (now - (window._mm148t || 0) < 800) return;
    window._mm148t = now;
    const cur = S.players[S.cur] || {};
    const logEl = document.querySelector('#log div, .log div, .log-line, .chronicle div');
    qrBroadcast138({
      type: 'state', round: S.round || S.turnCount || 1, turn: cur.name || '',
      lastLog: logEl ? logEl.textContent.trim() : '',
      players: S.players.map(p => ({
        name: p.name, coins: num150(p.coins != null ? p.coins : p.money),
        suspect: num150(p.suspect), fatigue: num150(p.fatigue), fear: num150(p.fear), tokens: num150(p.tokens)
      }))
    });
    if (cur && !cur.isBot && mmBus145.joined[cur.name]) {
      mmSend145(cur.name, { type: 'hand', cards: handFromDom158() });
    }
  } catch (e) {}
}
// 2) «Голос улиц»: окно само гаснет через 9 сек, если никто не нажал
const _sm158 = window.showModal;
window.showModal = function (html, opts) {
  const pr = _sm158(html, opts);
  if (/услышал/i.test(html || '')) {
    setTimeout(() => {
      const btn = [...document.querySelectorAll('.modal button, #modal button, [class*="modal"] button')].find(b => /услышал/i.test(b.textContent));
      if (btn) btn.click();
    }, 9000);
  }
  return pr;
};
// 3) Зум-кнопки — к лого, а не поверх него
(function () {
  const min = document.getElementById('zmin151');
  const bar = min ? min.parentElement : null;
  const h1 = document.querySelector('h1') || document.querySelector('.logo');
  if (bar && h1) {
    bar.style.position = 'static';
    bar.style.display = 'inline-flex';
    bar.style.marginLeft = '10px';
    bar.style.verticalAlign = 'middle';
    h1.parentNode.insertBefore(bar, h1.nextSibling);
  }
})();
// 4) Универсальная адаптация под узкие экраны (телефон в локальном режиме)
(function () {
  const stl = document.createElement('style');
  stl.textContent = '@media (max-width:900px){body{overflow:auto!important}main,.main,#main,.layout,.wrap{flex-direction:column!important;height:auto!important;overflow:visible!important}[class*="panel"]{width:100%!important;max-width:100%!important}}';
  document.head.appendChild(stl);
  function adapt158() {
    const w = window.innerWidth;
    const b = document.getElementById('board') || document.querySelector('.board');
    if (b && w < 1100) b.style.zoom = Math.max(.3, (w - 20) / 1050);
  }
  window.addEventListener('resize', adapt158);
  setTimeout(adapt158, 1200); setTimeout(adapt158, 3000);
})();
// ============================================
// ДОПОЛНЕНИЕ v159 — ШАПКА, ПРЕВЬЮ КАРТ, ВИДЕО-АВТОЗАПУСК, СВОЁ МЕДИА
// ============================================
// 1) Зум + ТВ — в шапку, в строку с лого
(function () {
  const h1 = document.querySelector('h1') || document.querySelector('.logo');
  if (!h1) return;
  const header = h1.closest('header') || h1.parentElement;
  const min = document.getElementById('zmin151');
  const bar = min ? min.parentElement : null;
  const tv = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === '📺' && b.style.position === 'fixed');
  if (bar) {
    bar.style.position = 'static'; bar.style.display = 'inline-flex'; bar.style.marginLeft = '8px'; bar.style.verticalAlign = 'middle'; bar.style.gap = '6px';
    if (tv) { tv.style.position = 'static'; bar.appendChild(tv); }
    header.insertBefore(bar, h1.nextSibling);
  }
})();
// 2) Превью карты на мониторе + применение вторым тапом
function phoneCmd141(d, conn) {
  if (!S || !d || !d.cmd) return;
  if (d.cmd === 'modal') { mmModalClick152(d.i | 0); return; }
  if (d.cmd === 'preview') {
    document.querySelectorAll('.mm-preview159').forEach(el => el.classList.remove('mm-preview159'));
    if (d.key) {
      const el = document.querySelector('[data-key="' + d.key + '"]');
      if (el) { el.classList.add('mm-preview159'); el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    }
    return;
  }
  const cur = S.players[S.cur];
  if (!cur || cur.isBot || cur.name !== conn._mmName) return;
  if (d.cmd === 'roll') { const b = document.getElementById('rollBtn'); if (b && !b.disabled && !S.isBusy) rollDice(); }
  if (d.cmd === 'end') { const b = document.getElementById('endBtn'); if (b && !b.disabled) endTurn(); }
  if (d.cmd === 'play') {
    document.querySelectorAll('.mm-preview159').forEach(el => el.classList.remove('mm-preview159'));
    const el = document.querySelector('[data-key="' + d.key + '"]'); if (el) el.click();
  }
}
const stl159 = document.createElement('style');
stl159.textContent = '.mm-preview159{outline:3px solid #7cfc9a!important;outline-offset:2px;border-radius:8px;box-shadow:0 0 24px rgba(124,252,154,.8)!important}';
document.head.appendChild(stl159);
// 3) Рука с описаниями для телефона
function handFromDom158() {
  const seen = {}, cards = [];
  document.querySelectorAll('[data-key]').forEach(el => {
    const key = el.getAttribute('data-key');
    if (!key || seen[key]) return;
    if (!el.closest('.hand, .hand-panel, [class*="hand"], #hand')) return;
    seen[key] = 1;
    const c = (window.CHIPS && CHIPS[key]) || (window.SKINS && SKINS[key]) || {};
    const cardEl = el.closest('[class*="card"], .hcard');
    cards.push({ key: key, name: c.name || key, desc: c.desc || c.text || (cardEl ? cardEl.textContent.trim().slice(0, 140) : '') });
  });
  return cards;
}
// 4) Видео: автозапуск везде (ТВ тоже), muted+loop+playsinline
(function () {
  function fixVids159() {
    document.querySelectorAll('video').forEach(v => {
      v.muted = true; v.defaultMuted = true; v.loop = true;
      v.setAttribute('playsinline', ''); v.setAttribute('autoplay', '');
      const p = v.play(); if (p && p.catch) p.catch(() => {});
    });
  }
  fixVids159(); setTimeout(fixVids159, 1500); setTimeout(fixVids159, 4000);
  window.addEventListener('click', fixVids159); window.addEventListener('keydown', fixVids159);
})();
// 5) Кнопка 🎬 — подменить медиа на своё (только ПК)
(function () {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'video/*,audio/*'; inp.style.display = 'none';
  document.body.appendChild(inp);
  let target159 = null;
  inp.onchange = () => { const f = inp.files[0]; if (f && target159) { target159.src = URL.createObjectURL(f); target159.play().catch(() => {}); } };
  const btn = document.createElement('button');
  btn.textContent = '🎬';
  btn.title = 'Своё медиа';
  btn.style.cssText = 'width:38px;height:38px;border-radius:10px;border:2px solid #d4af37;background:#101632;color:#ffd54f;font-size:18px;font-weight:900;cursor:pointer';
  btn.onclick = async () => {
    const ch = await showModal('<h2>🎬 Своё медиа</h2><p>Какой элемент заменить вашим файлом?</p><button data-v="bg">🌆 Фон игры (bg)</button><button data-v="rules">📜 Фон правил</button><button data-v="center">🎯 Центр поля</button>');
    target159 = ch === 'bg' ? document.querySelector('video#bgVideo, video.bg, body > video, #bg video') :
      ch === 'rules' ? document.querySelector('video#rulesBg, video.rules, #rules video, .rules video') :
      document.querySelector('#board video, .board video, .center video, #center video');
    if (target159) inp.click();
    else console.log('🎬 Элемент не найден — скажи мне его id');
  };
  const min = document.getElementById('zmin151');
  if (min) min.parentElement.appendChild(btn);
})();
// ============================================
// ДОПОЛНЕНИЕ v160 — КНОПКИ В ИГРОВУЮ ШАПКУ, ГОЛОС 3 СЕК, АДАПТАЦИЯ ПОД ТЕЛЕФОН
// ============================================
// 1) Зум/ТВ/🎬 — в шапку игры (.header-left), на меню скрыты
(function () {
  function place160() {
    const min = document.getElementById('zmin151');
    const bar = min ? min.parentElement : null;
    if (!bar) return;
    const gs = document.getElementById('gameScreen');
    const hl = document.querySelector('#gameScreen .header-left');
    const gameOn = gs && gs.style.display !== 'none';
    bar.style.display = gameOn ? 'inline-flex' : 'none';
    if (hl && bar.parentElement !== hl) {
      bar.style.position = 'static'; bar.style.marginLeft = '8px'; bar.style.verticalAlign = 'middle'; bar.style.gap = '6px';
      hl.appendChild(bar);
    }
  }
  setInterval(place160, 2000); setTimeout(place160, 800);
})();
// 2) «Голос улиц» — гаснет через 3 секунды
const _sm160 = window.showModal;
window.showModal = function (html, opts) {
  const pr = _sm160(html, opts);
  if (/услышал/i.test(html || '')) {
    setTimeout(() => {
      const btn = [...document.querySelectorAll('#overlay button, .modal button, [class*="modal"] button')].find(b => /услышал/i.test(b.textContent));
      if (btn) btn.click();
    }, 3000);
  }
  return pr;
};
// 3) Настоящая адаптация под узкие экраны (по реальной разметке)
(function () {
  const stl = document.createElement('style');
  stl.textContent = '@media (max-width:900px){' +
    'body{overflow:auto!important}' +
    '#gameScreen{height:auto!important;overflow:visible!important;display:block!important}' +
    '.game-header{flex-wrap:wrap;height:auto!important;padding:6px!important;gap:6px}' +
    '.header-left,.header-center,.header-right{width:auto!important}' +
    '.header-right{flex-wrap:wrap;justify-content:flex-start}' +
    '.game-main{flex-direction:column!important;height:auto!important;overflow:visible!important}' +
    '#boardWrapper{width:100%!important;overflow-x:auto!important}' +
    '.side-panel,.right-panel{width:100%!important;max-height:none!important;overflow:visible!important;position:static!important}' +
    '.bottom-panel{position:static!important}' +
    '#overlay>div,.modal{width:92vw!important;max-width:92vw!important;max-height:86vh!important;overflow:auto!important}' +
    '}';
  document.head.appendChild(stl);
  function adapt160() {
    const w = window.innerWidth;
    const b = document.getElementById('board');
    if (!b) return;
    if (w < 1100) {
      b.style.zoom = 1;
      const bw = b.offsetWidth;
      if (bw > w - 16) b.style.zoom = (w - 16) / bw;
    }
  }
  window.addEventListener('resize', adapt160);
  setTimeout(adapt160, 1200); setTimeout(adapt160, 3000); setTimeout(adapt160, 6000);
})();
// ============================================
// ДОПОЛНЕНИЕ v161 — ПОЛЕ НЕ НАЕЗЖАЕТ НА ПАНЕЛИ, QR КОМФОРТНОГО РАЗМЕРА
// ============================================
// 1) ТВ-спасатель меряет честно: минус боковые панели, потолок 1.25
window.tvRescue155 = function () {
  const b = document.getElementById('board') || document.querySelector('.board');
  if (!b) return;
  let el = b;
  for (let i = 0; i < 4 && el; i++) { el.style.transform = 'none'; el = el.parentElement; }
  b.style.width = '1000px'; b.style.height = '1000px'; b.style.minWidth = '1000px'; b.style.flex = 'none';
  const aw = Math.max(500, window.innerWidth - 780);
  const ah = Math.max(400, window.innerHeight - 150);
  const k = Math.max(.3, Math.min(aw / 1000, ah / 1000, 1.25));
  b.style.zoom = k;
};
// и автоподгон при загрузке/ресайзе — по тому же правилу
(function () {
  function fit161() {
    const w = window.innerWidth;
    const b = document.getElementById('board');
    if (!b) return;
    if (w >= 1100) { window.tvRescue155(); }
  }
  window.addEventListener('resize', fit161);
  setTimeout(fit161, 2600); setTimeout(fit161, 5000);
})();
// 2) QR поменьше — удобно сканировать с любого расстояния
(function () {
  const stl = document.createElement('style');
  stl.textContent = '#overlay div[style*="background:#fff"] img{width:min(300px,62vw)!important;height:auto!important}';
  document.head.appendChild(stl);
})();
// ============================================
// ДОПОЛНЕНИЕ v162 — РЕЖИМ МОНИТОРА: ПОЛЕ НА ЭКРАН, ОСТАЛЬНОЕ НА ТЕЛЕФОН
// ============================================
(function () {
  const stl = document.createElement('style');
  stl.textContent = 'body.mm-tv .side-panel,body.mm-tv .right-panel,body.mm-tv .bottom-panel{display:none!important}' +
    'body.mm-tv .game-main{display:block!important;height:auto!important}' +
    'body.mm-tv #boardWrapper{width:100%!important;margin:0 auto!important}';
  document.head.appendChild(stl);
  setInterval(() => {
    const on = !!(window.mmBus145 && Object.keys(mmBus145.joined).length);
    document.body.classList.toggle('mm-tv', on);
    const b = document.getElementById('board');
    if (on && b) {
      b.style.zoom = 1;
      const bw = b.offsetWidth || 1000;
      const k = Math.max(.3, Math.min((window.innerWidth - 40) / bw, (window.innerHeight - 130) / (b.offsetHeight || 1000), 1.6));
      b.style.zoom = k;
    }
  }, 1500);
})();
function phoneCmd141(d, conn) {
  if (!S || !d || !d.cmd) return;
  if (d.cmd === 'modal') { mmModalClick152(d.i | 0); return; }
  if (d.cmd === 'accuse') { if (window.accuseOpen) accuseOpen(); return; }
  if (d.cmd === 'mor') { if (window.morOpen) morOpen(); return; }
  if (d.cmd === 'preview') {
    document.querySelectorAll('.mm-preview159').forEach(el => el.classList.remove('mm-preview159'));
    if (d.key) { const el = document.querySelector('[data-key="' + d.key + '"]'); if (el) { el.classList.add('mm-preview159'); el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } }
    return;
  }
  const cur = S.players[S.cur];
  if (!cur || cur.isBot || cur.name !== conn._mmName) return;
  if (d.cmd === 'roll') { const b = document.getElementById('rollBtn'); if (b && !b.disabled && !S.isBusy) rollDice(); }
  if (d.cmd === 'end') { const b = document.getElementById('endBtn'); if (b && !b.disabled) endTurn(); }
  if (d.cmd === 'play') {
    document.querySelectorAll('.mm-preview159').forEach(el => el.classList.remove('mm-preview159'));
    const el = document.querySelector('[data-key="' + d.key + '"]'); if (el) el.click();
  }
}
function qrState138() {
  try {
    if (!S || !mmBus145 || !Object.keys(mmBus145.joined).length) return;
    const now = Date.now();
    if (now - (window._mm148t || 0) < 800) return;
    window._mm148t = now;
    const cur = S.players[S.cur] || {};
    const logEl = document.querySelector('#log div, .log div, .log-line, .chronicle div');
    qrBroadcast138({
      type: 'state', round: S.round || S.turnCount || 1, turn: cur.name || '',
      lastLog: logEl ? logEl.textContent.trim() : '',
      top: S.players.slice().sort((a, b) => num150(b.suspect) - num150(a.suspect)).slice(0, 3)
        .map(p => ({ name: p.name, sus: num150(p.suspect) })),
      players: S.players.map(p => ({
        name: p.name, coins: num150(p.coins != null ? p.coins : p.money),
        suspect: num150(p.suspect), fatigue: num150(p.fatigue), fear: num150(p.fear), tokens: num150(p.tokens)
      }))
    });
    if (cur && !cur.isBot && mmBus145.joined[cur.name]) {
      mmSend145(cur.name, { type: 'hand', cards: handFromDom158() });
    }
  } catch (e) {}
}
// ============================================
// ДОПОЛНЕНИЕ v163 — АДАПТАЦИЯ-МАКСИМУМ: СМАРТФОН/ПЛАНШЕТ/ТВ/ПЛАНШЕТ-АЛЬБОМ
// ============================================
(function () {
  const stl = document.createElement('style');
  stl.textContent =
    '@media (max-width:1200px){.game-main{gap:8px!important}.right-panel{width:260px!important}}' +
    '@media (max-width:900px){' +
    'html,body{overflow:auto!important;height:auto!important}' +
    '#gameScreen{display:flex!important;flex-direction:column!important;height:auto!important;overflow:visible!important}' +
    '.game-header{position:static!important;flex-wrap:wrap!important;height:auto!important;padding:6px!important;gap:6px}' +
    '.header-left h2{font-size:16px!important}' +
    '.header-center{order:3;width:100%!important;display:flex!important;flex-direction:row!important;gap:10px;justify-content:center;flex-wrap:wrap}' +
    '.header-right{order:2;margin-left:auto;flex-wrap:wrap;justify-content:flex-end}' +
    '.game-main{flex-direction:column!important;overflow:visible!important;height:auto!important}' +
    '#boardWrapper{width:100%!important;overflow-x:auto!important}' +
    '.side-panel{width:100%!important;position:static!important;max-height:none!important;overflow:visible!important}' +
    '.right-panel{width:100%!important;position:static!important;max-height:none!important;overflow:visible!important}' +
    '.bottom-panel{position:static!important}' +
    '.action-buttons{display:grid!important;grid-template-columns:1fr 1fr!important;gap:6px}' +
    '#overlay{overflow:auto!important;padding:10px 0!important}' +
    '#overlay>div,.modal{width:92vw!important;max-width:92vw!important;max-height:84vh!important;overflow:auto!important}' +
    '#mobileCardView .card-container{width:92vw!important}' +
    '}' +
    '@media (max-width:480px){' +
    '.header-right input[type=range]{width:70px!important}' +
    '.hbtn{padding:4px 6px!important;font-size:14px!important}' +
    '.header-left h2{font-size:13px!important}' +
    '}' +
    '@media (max-height:520px) and (orientation:landscape){' +
    '.game-header{padding:2px!important}.header-center{display:none!important}' +
    '}';
  document.head.appendChild(stl);
})();
// ============================================
// ДОПОЛНЕНИЕ v164 — АДАПТАЦИЯ ТОЧНАЯ: КОЛОНКА НА УЗКИХ, ПОЛЕ В СВОЕЙ ЯЧЕЙКЕ НА ТВ
// ============================================
(function () {
  const stl = document.createElement('style');
  stl.textContent =
    '@media (max-width:900px){' +
    'html,body{overflow:auto!important;height:auto!important}' +
    '#gameScreen{display:flex!important;flex-direction:column!important;height:auto!important;overflow:visible!important;position:static!important}' +
    '.game-header{position:static!important;flex-wrap:wrap!important;height:auto!important;padding:6px!important}' +
    '.game-main{display:flex!important;flex-direction:column!important;height:auto!important;overflow:visible!important;grid-template-columns:none!important}' +
    '#boardWrapper{width:100%!important;height:auto!important;overflow-x:auto!important}' +
    '.side-panel,.right-panel{width:100%!important;position:static!important;max-height:none!important;overflow:visible!important}' +
    '.bottom-panel{position:static!important}' +
    '.action-buttons{display:grid!important;grid-template-columns:1fr 1fr!important}' +
    '#overlay>div,.modal{width:92vw!important;max-width:92vw!important;max-height:84vh!important;overflow:auto!important}' +
    '}' +
    '@media (max-width:480px){.header-right input[type=range]{width:70px!important}.hbtn{padding:4px 6px!important;font-size:14px!important}.header-left h2{font-size:13px!important}}';
  document.head.appendChild(stl);
  function fit164() {
    const b = document.getElementById('board');
    const wrap = document.getElementById('boardWrapper');
    if (!b || !wrap) return;
    b.style.zoom = 1;
    const bw = b.offsetWidth || 1000, bh = b.offsetHeight || 1000;
    const aw = (wrap.clientWidth || window.innerWidth) - 8;
    const narrow = window.innerWidth < 1100;
    const ah = narrow ? Infinity : Math.max(400, window.innerHeight - 170);
    const k = Math.max(.25, Math.min(aw / bw, ah / bh, 1.6));
    b.style.zoom = k;
  }
  window.fitBoard164 = fit164;
  window.tvRescue155 = function () {
    const b = document.getElementById('board');
    if (!b) return;
    let el = b;
    for (let i = 0; i < 4 && el; i++) { el.style.transform = 'none'; el = el.parentElement; }
    fit164();
  };
  window.addEventListener('resize', fit164);
  setInterval(fit164, 2500);
  setTimeout(fit164, 1500); setTimeout(fit164, 4000);
})();
// ============================================
// ДОПОЛНЕНИЕ v165 — КЛИК ПО КУБИКУ = БРОСОК
// ============================================
(function () {
  let bound165 = false;
  setInterval(() => {
    const d = document.getElementById('diceDisplay') || document.getElementById('diceCube');
    if (!d || bound165) return;
    bound165 = true;
    const zone = d.closest('.panel') || d;
    zone.style.cursor = 'pointer';
    zone.title = '🎲 Нажми на кубик — бросок!';
    zone.addEventListener('click', () => {
      if (!S || S.isBusy || S.isOver) return;
      const p = S.players[S.cur];
      if (!p || p.isBot || p.jail > 0) return;
      const b = document.getElementById('rollBtn');
      if (b && b.disabled) return;
      if (window.roll) roll(); else if (window.rollDice) rollDice();
    });
    const stl = document.createElement('style');
    stl.textContent = '#diceDisplay:hover,#diceCube:hover{transform:scale(1.06);filter:drop-shadow(0 0 14px rgba(212,175,55,.7));transition:.15s}';
    document.head.appendChild(stl);
  }, 1000);
})();
// ============================================
// ДОПОЛНЕНИЕ v166 — ГОЛОС УЛИЦ НА ТЕЛЕФОНЕ: НЕ СЪЕЗЖАЕТ И НЕ ЗАКРЫВАЕТ ПРАВИЛА
// ============================================
(function () {
  const stl = document.createElement('style');
  stl.textContent =
    '@media (max-width:900px){' +
    '#overlay>div{display:flex!important;flex-direction:column!important;align-items:center!important;text-align:center!important;overflow-x:hidden!important}' +
    '#overlay>div img{max-width:82vw!important;max-height:38vh!important;width:auto!important;height:auto!important}' +
    '#overlay>div h1,#overlay>div h2,#overlay>div p,#overlay>div div,#overlay>div span{max-width:88vw!important;white-space:normal!important;word-wrap:break-word!important}' +
    '}';
  document.head.appendChild(stl);
})();
const _sm166 = window.showModal;
window.showModal = function (html, opts) {
  const isVoice = /голос улиц/i.test(html || '');
  function rulesOn166() {
    const r = document.getElementById('rulesScreen');
    if (!r) return false;
    const cs = getComputedStyle(r);
    return cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0;
  }
  if (isVoice && rulesOn166()) {
    return new Promise(res => {
      const t = setInterval(() => {
        if (!rulesOn166()) { clearInterval(t); _sm166(html, opts).then(res); }
      }, 700);
    });
  }
  return _sm166(html, opts);
};
// ============================================
// ДОПОЛНЕНИЕ v167 — ЖИВУЧИЙ КАНАЛ: АВТОПЕРЕПОДКЛЮЧЕНИЕ НА ПК
// ============================================
async function mmStartPc145() {
  const room = ('MM' + Math.random().toString(36).replace(/[^a-z0-9]/gi, '') + 'X').slice(0, 10).toUpperCase();
  mmBus145 = {
    room: room, joined: {},
    client: { publish: (t, s) => fetch(MM_NTFY + '/' + t, { method: 'POST', body: s, headers: { 'Content-Type': 'text/plain' } }) }
  };
  openES167();
  console.log('🌐 Комната ntfy создана:', room);
  return room;
}
function openES167() {
  if (!mmBus145) return;
  const es = new EventSource(MM_NTFY + '/mm145_' + mmBus145.room + '_up/sse');
  window._mmES167 = es;
  es.onmessage = e => {
    try {
      const outer = JSON.parse(e.data);
      const m = JSON.parse(outer.message);
      if (m.type === 'hello' && m.name) {
        mmBus145.joined[m.name] = true;
        const p = S && S.players.find(x => x.name === m.name);
        if (p) mmSend145(m.name, { type: 'role', name: p.name, role: p.role, color: p.color });
        console.log('📱 Телефон подключился:', m.name);
      } else if (m.name && m.d) phoneCmd141(m.d, { _mmName: m.name });
    } catch (err) {}
  };
  es.onerror = () => { if (es.readyState === 2) setTimeout(openES167, 3000); };
}
// ============================================
// ДОПОЛНЕНИЕ v169 — ДУЭЛЬ: ПРОИГРАВШИЙ НЕ ВЫБИРАЕТ МИР
// ============================================
const _sm169 = window.showModal;
window.showModal = function (html, opts) {
  let h = html || '';
  if (/разойтись миром/i.test(h)) {
    const p = S && S.players[S.cur];
    const sus = p && p.suspect ? (p.suspect.get ? p.suspect.get() : p.suspect) : 0;
    if (p && !p.isBot && sus >= 10) {
      h = h.replace(/<button\b[^>]*>[\s\S]{0,220}?разойтись миром[\s\S]{0,220}?<\/button>/gi, '');
      h += '<p style="margin-top:10px;opacity:.75;font-size:13px">🕊 Проигравший не выбирает мир. Мир выбирают победители.</p>';
    }
  }
  return _sm169(h, opts);
};
// ============================================
// ДОПОЛНЕНИЕ v171 — КАНАЛ НА MQTT: ВСЕ БРОКЕРЫ ОДНОВРЕМЕННО, БЕЗ ЛИМИТОВ
// ============================================
function loadMqtt171() {
  return new Promise((res, rej) => {
    if (window.mqtt) return res();
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/mqtt@5.10.1/dist/mqtt.min.js';
    s.onload = () => res(); s.onerror = () => rej(new Error('no mqtt'));
    document.head.appendChild(s);
  });
}
const MM_BROKERS171 = ['wss://broker.hivemq.com:8884/mqtt', 'wss://broker.emqx.io:8084/mqtt', 'wss://test.mosquitto.org:8081'];
const seen171 = {};
function onUp171(payload) {
  try {
    const key = payload;
    const now = Date.now();
    if (seen171[key] && now - seen171[key] < 800) return;
    seen171[key] = now;
    const m = JSON.parse(payload);
    if (m.type === 'hello' && m.name) {
      mmBus145.joined[m.name] = true;
      const p = S && S.players.find(x => x.name === m.name);
      if (p) mmSend145(m.name, { type: 'role', name: p.name, role: p.role, color: p.color });
      console.log('📱 Телефон подключился:', m.name);
    } else if (m.name && m.d) phoneCmd141(m.d, { _mmName: m.name });
  } catch (e) {}
}
async function mmStartPc145() {
  await loadMqtt171();
  const room = ('MM' + Math.random().toString(36).replace(/[^a-z0-9]/gi, '') + 'X').slice(0, 10).toUpperCase();
  mmBus145 = { room: room, joined: {}, clients: [] };
  MM_BROKERS171.forEach(url => {
    try {
      const c = mqtt.connect(url, { reconnectPeriod: 5000, connectTimeout: 6000 });
      c.on('connect', () => { c.subscribe('mm145_' + room + '_up'); });
      c.on('message', (t, buf) => onUp171(buf.toString()));
      mmBus145.clients.push(c);
    } catch (e) {}
  });
  console.log('🌐 Комната MQTT создана:', room);
  return room;
}
function mmSend145(name, obj) {
  if (!mmBus145) return;
  const s = JSON.stringify(obj);
  mmBus145.clients.forEach(c => { if (c.connected) c.publish('mm145_' + mmBus145.room + '_down_' + name, s); });
}
function qrBroadcast138(msg) {
  if (!mmBus145) return;
  const s = JSON.stringify(msg);
  mmBus145.clients.forEach(c => { if (c.connected) c.publish('mm145_' + mmBus145.room + '_down_all', s); });
}
// ============================================
// ДОПОЛНЕНИЕ v172 — ДВОЙНОЙ КАНАЛ: MQTT (3 CDN) + NTFY-РЕЗЕРВ
// ============================================
const MQTT_CDNS172 = ['https://unpkg.com/mqtt@5.10.1/dist/mqtt.min.js', 'https://cdn.jsdelivr.net/npm/mqtt@5.10.1/dist/mqtt.min.js', 'https://unpkg.com/mqtt@4.3.7/dist/mqtt.min.js'];
function loadMqtt171() {
  return new Promise(res => {
    if (window.mqtt) return res();
    let i = 0;
    const next = () => { if (i >= MQTT_CDNS172.length) return res(); const s = document.createElement('script'); s.src = MQTT_CDNS172[i++]; s.onload = () => res(); s.onerror = next; document.head.appendChild(s); };
    next();
  });
}
function ntfyPub172(topic, s) { fetch(MM_NTFY + '/' + topic, { method: 'POST', body: s }).catch(() => {}); }
async function mmStartPc145() {
  await loadMqtt171();
  const room = ('MM' + Math.random().toString(36).replace(/[^a-z0-9]/gi, '') + 'X').slice(0, 10).toUpperCase();
  mmBus145 = { room: room, joined: {}, clients: [], ntfyLast: 0 };
  if (window.mqtt) {
    MM_BROKERS171.forEach(url => {
      try {
        const c = mqtt.connect(url, { reconnectPeriod: 5000, connectTimeout: 6000 });
        c.on('connect', () => { c.subscribe('mm145_' + room + '_up'); console.log('📡 ПК на брокере:', url); });
        c.on('message', (t, buf) => onUp171(buf.toString()));
        mmBus145.clients.push(c);
      } catch (e) {}
    });
  } else console.log('⚠️ MQTT не загрузился — остаётся ntfy');
  const es = new EventSource(MM_NTFY + '/mm145_' + room + '_up/sse');
  es.onmessage = e => { try { const o = JSON.parse(e.data); onUp171(o.message); } catch (err) {} };
  console.log('🌐 Комната создана:', room, '(mqtt+ntfy)');
  return room;
}
function mmSend145(name, obj) {
  if (!mmBus145) return;
  const s = JSON.stringify(obj);
  mmBus145.clients.forEach(c => { if (c.connected) c.publish('mm145_' + mmBus145.room + '_down_' + name, s); });
  ntfyPub172('mm145_' + mmBus145.room + '_down_' + name, s);
}
function qrBroadcast138(msg) {
  if (!mmBus145) return;
  const s = JSON.stringify(msg);
  mmBus145.clients.forEach(c => { if (c.connected) c.publish('mm145_' + mmBus145.room + '_down_all', s); });
  const now = Date.now();
  if (msg.type !== 'state' || now - mmBus145.ntfyLast > 10000) {
    if (msg.type === 'state') mmBus145.ntfyLast = now;
    ntfyPub172('mm145_' + mmBus145.room + '_down_all', s);
  }
}
// ============================================
// ДОПОЛНЕНИЕ v173 — СТОРОЖ: ПРОИГРАВШИЙ ФИЗИЧЕСКИ НЕ ВИДИТ КНОПКУ МИРА
// ============================================
(function () {
  function sweep173() {
    const p = S && S.players[S.cur];
    if (!p || p.isBot) return;
    const sus = p.suspect ? (p.suspect.get ? p.suspect.get() : p.suspect) : 0;
    if (sus < 10) return;
    document.querySelectorAll('button').forEach(b => {
      if (/разойтись миром/i.test(b.textContent || '')) {
        b.style.display = 'none';
        b.disabled = true;
      }
    });
  }
  new MutationObserver(sweep173).observe(document.body, { childList: true, subtree: true });
  setInterval(sweep173, 700);
})();
// ============================================
// ДОПОЛНЕНИЕ v174 — QR НЕСЁТ И РОЛЬ, И АДРЕС КОМНАТЫ
// ============================================
async function qrSeq111(oldHtml) {
  try { await loadQRious137(); } catch (e) {}
  if (!mmBus145) { try { await mmStartPc145(); } catch (e) {} }
  const base = location.href.split('#')[0].replace(/[^/]*$/, '') + 'phone.html';
  const list = S.players.filter(p => !p.isBot);
  const items = list.map(p => {
    let src = '';
    try {
      const rolePart = btoa(unescape(encodeURIComponent(JSON.stringify({ n: p.name, r: p.role, c: p.color }))));
      const url = base + '#room=' + mmBus145.room + '&r=' + rolePart;
      src = new QRious({ value: url, size: 460, level: 'M' }).toDataURL();
    } catch (e) {}
    return { name: p.name, src: src };
  }).filter(x => x.src);
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    await _sm111('<h2>📱 ' + it.name + ' — отсканируй свою роль</h2>' +
      '<p>Передай устройство игроку <b>' + it.name + '</b>. Остальные — не подглядывать!</p>' +
      '<div style="background:#fff;padding:14px;border-radius:12px;display:inline-block"><img src="' + it.src + '" style="width:min(300px,62vw);display:block"></div>' +
      '<div>' + it.name + '</div>' +
      '<p>Плашка ' + (i + 1) + ' из ' + items.length + ' · роль и пульт придут на телефон</p>' +
      '<button data-val="ok">✅ ' + it.name + ' отсканировал — дальше</button>');
  }
  return _sm111('<h2>✅ Все получили роли</h2><p>🤖 Боты получили роли автоматически.</p><p>Город просыпается…</p><button data-val="start">🎲 Начать!</button>');
}
// ============================================
// ДОПОЛНЕНИЕ v175 — QR НЕСЁТ И РОЛЬ, И АДРЕС КОМНАТЫ (ИСПРАВЛЕНЫ КНОПКИ)
// ============================================
async function qrSeq111(oldHtml) {
  try { await loadQRious137(); } catch (e) {}
  if (!mmBus145) { try { await mmStartPc145(); } catch (e) {} }
  const base = location.href.split('#')[0].replace(/[^/]*$/, '') + 'phone.html';
  const list = S.players.filter(p => !p.isBot);
  const items = list.map(p => {
    let src = '';
    try {
      const rolePart = btoa(unescape(encodeURIComponent(JSON.stringify({ n: p.name, r: p.role, c: p.color }))));
      const url = base + '#room=' + mmBus145.room + '&r=' + rolePart;
      src = new QRious({ value: url, size: 460, level: 'M' }).toDataURL();
    } catch (e) {}
    return { name: p.name, src: src };
  }).filter(x => x.src);
  
  const sm = window.showModal; // используем актуальную версию
  const btnStyle = 'style="padding:12px 24px;margin-top:12px;font-size:16px;font-weight:bold;cursor:pointer;background:#d4af37;color:#0a0e20;border:none;border-radius:8px;"';
  
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    await sm('<h2>📱 ' + it.name + ' — отсканируй свою роль</h2>' +
      '<p>Передай устройство игроку <b>' + it.name + '</b>. Остальные — не подглядывать!</p>' +
      '<div style="background:#fff;padding:14px;border-radius:12px;display:inline-block;margin:10px 0"><img src="' + it.src + '" style="width:min(300px,62vw);display:block"></div>' +
      '<div style="font-weight:bold;font-size:18px;margin:8px 0">' + it.name + '</div>' +
      '<p>Плашка ' + (i + 1) + ' из ' + items.length + ' · роль и пульт придут на телефон</p>' +
      '<button data-val="ok" ' + btnStyle + '>✅ ' + it.name + ' отсканировал — дальше</button>');
  }
  return sm('<h2>✅ Все получили роли</h2><p>🤖 Боты получили роли автоматически.</p><p>Город просыпается…</p><button data-val="start" ' + btnStyle + '>🎲 Начать!</button>');
}
// ============================================
// ДОПОЛНЕНИЕ v176 — QR БУДЕТ ВСЕГДА: 3 CDN + ЗАПАСНОЙ ГЕНЕРАТОР
// ============================================
function loadQRious137() {
  return new Promise(res => {
    if (window.QRious) return res();
    const urls = ['https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js', 'https://cdn.jsdelivr.net/npm/qrious@4.0.2/dist/qrious.min.js', 'https://unpkg.com/qrious@4.0.2/dist/qrious.min.js'];
    let i = 0;
    const next = () => {
      if (i >= urls.length) return res();
      const s = document.createElement('script');
      s.src = urls[i++];
      s.onload = () => res();
      s.onerror = next;
      document.head.appendChild(s);
    };
    next();
  });
}
async function qrSeq111(oldHtml) {
  try { await loadQRious137(); } catch (e) {}
  console.log('🔳 QRious загружен:', !!window.QRious);
  if (!mmBus145) { try { await mmStartPc145(); } catch (e) {} }
  const base = location.href.split('#')[0].replace(/[^/]*$/, '') + 'phone.html';
  const list = S.players.filter(p => !p.isBot);
  const items = list.map(p => {
    let src = '';
    const rolePart = btoa(unescape(encodeURIComponent(JSON.stringify({ n: p.name, r: p.role, c: p.color }))));
    const url = base + '#room=' + (mmBus145 ? mmBus145.room : '') + '&r=' + rolePart;
    if (window.QRious) {
      try { src = new QRious({ value: url, size: 460, level: 'M' }).toDataURL(); } catch (e) {}
    }
    if (!src) src = 'https://api.qrserver.com/v1/create-qr-code/?size=430x430&data=' + encodeURIComponent(url);
    return { name: p.name, src: src, url: url };
  });
  const sm = window.showModal;
  const btnStyle = 'style="padding:12px 24px;margin-top:12px;font-size:16px;font-weight:bold;cursor:pointer;background:#d4af37;color:#0a0e20;border:none;border-radius:8px;"';
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    await sm('<h2>📱 ' + it.name + ' — отсканируй свою роль</h2>' +
      '<p>Передай устройство игроку <b>' + it.name + '</b>. Остальные — не подглядывать!</p>' +
      '<div style="background:#fff;padding:14px;border-radius:12px;display:inline-block;margin:10px 0"><img src="' + it.src + '" style="width:min(300px,62vw);display:block"></div>' +
      '<div style="font-weight:bold;font-size:18px;margin:8px 0">' + it.name + '</div>' +
      '<p>Плашка ' + (i + 1) + ' из ' + items.length + ' · роль и пульт придут на телефон</p>' +
      '<button data-val="ok" ' + btnStyle + '>✅ ' + it.name + ' отсканировал — дальше</button>');
  }
  return sm('<h2>✅ Все получили роли</h2><p>🤖 Боты получили роли автоматически.</p><p>Город просыпается…</p><button data-val="start" ' + btnStyle + '>🎲 Начать!</button>');
}
// ============================================
// ДОПОЛНЕНИЕ v177 — ПЛАШКИ-ТЕРМИНАТОР: QR ЛЮБОЙ ЦЕНОЙ + ССЫЛКА ТЕКСТОМ
// ============================================
async function qrSeq111(oldHtml) {
  try { await loadQRious137(); } catch (e) {}
  if (!mmBus145) { try { await mmStartPc145(); } catch (e) {} }
  const base = location.href.split('#')[0].replace(/[^/]*$/, '') + 'phone.html';
  const list = S.players.filter(p => !p.isBot);
  const items = list.map(p => {
    const rolePart = btoa(unescape(encodeURIComponent(JSON.stringify({ n: p.name, r: p.role, c: p.color }))));
    const url = base + '#room=' + (mmBus145.room + '&r=' + rolePart);
    let dataSrc = '';
    if (window.QRious) { try { dataSrc = new QRious({ value: url, size: 460, level: 'M' }).toDataURL(); } catch (e) {} }
    const netSrc = 'https://api.qrserver.com/v1/create-qr-code/?size=430x430&data=' + encodeURIComponent(url);
    console.log('🔳 QR для', p.name, '→', dataSrc ? 'локальный (' + dataSrc.length + ' симв.)' : 'внешний');
    return { name: p.name, src: dataSrc || netSrc, net: netSrc, url: url };
  });
  const sm = window.showModal;
  const btnStyle = 'style="padding:12px 24px;margin-top:12px;font-size:16px;font-weight:bold;cursor:pointer;background:#d4af37;color:#0a0e20;border:none;border-radius:8px;"';
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    console.log('🪧 Открываю плашку', i + 1, 'для', it.name);
    await sm('<h2>📱 ' + it.name + ' — отсканируй свою роль</h2>' +
      '<p>Передай устройство игроку <b>' + it.name + '</b>. Остальные — не подглядывать!</p>' +
      '<div style="background:#fff;padding:14px;border-radius:12px;display:inline-block;margin:10px 0">' +
      '<img src="' + it.src + '" onerror="this.onerror=null;this.src=\'' + it.net + '\';" style="width:min(300px,62vw);display:block">' +
      '</div>' +
      '<div style="font-weight:bold;font-size:18px;margin:8px 0">' + it.name + '</div>' +
      '<p style="font-size:11px;opacity:.7;word-break:break-all">если QR не сканируется — открой на телефоне вручную: ' + it.url + '</p>' +
      '<p>Плашка ' + (i + 1) + ' из ' + items.length + '</p>' +
      '<button data-val="ok" ' + btnStyle + '>✅ ' + it.name + ' отсканировал — дальше</button>');
  }
  return sm('<h2>✅ Все получили роли</h2><p>🤖 Боты получили роли автоматически.</p><p>Город просыпается…</p><button data-val="start" ' + btnStyle + '>🎲 Начать!</button>');
}
// ============================================
// ДОПОЛНЕНИЕ v178 — ПЛАШКИ СО СВОИМ ОВЕРЛЕЕМ: КНОПКИ РАБОТАЮТ ГАРАНТИРОВАННО
// ============================================
function showPlate178(html) {
  return new Promise(res => {
    const ov = document.getElementById('overlay');
    ov.style.display = 'flex';
    ov.innerHTML = '<div style="max-width:92vw;max-height:86vh;overflow:auto;padding:22px;background:#141a35;border:2px solid #d4af37;border-radius:14px;text-align:center;color:#dfe6ff;box-shadow:0 0 40px rgba(0,0,0,.7)">' + html + '</div>';
    ov.querySelectorAll('button').forEach(b => {
      b.onclick = () => { ov.style.display = 'none'; ov.innerHTML = ''; res(b.getAttribute('data-val')); };
    });
  });
}
async function qrSeq111(oldHtml) {
  try { await loadQRious137(); } catch (e) {}
  if (!mmBus145) { try { await mmStartPc145(); } catch (e) {} }
  const base = location.href.split('#')[0].replace(/[^/]*$/, '') + 'phone.html';
  const list = S.players.filter(p => !p.isBot);
  const items = list.map(p => {
    const rolePart = btoa(unescape(encodeURIComponent(JSON.stringify({ n: p.name, r: p.role, c: p.color }))));
    const url = base + '#room=' + mmBus145.room + '&r=' + rolePart;
    let dataSrc = '';
    if (window.QRious) { try { dataSrc = new QRious({ value: url, size: 460, level: 'M' }).toDataURL(); } catch (e) {} }
    const netSrc = 'https://api.qrserver.com/v1/create-qr-code/?size=430x430&data=' + encodeURIComponent(url);
    return { name: p.name, src: dataSrc || netSrc, net: netSrc, url: url };
  });
  const btnStyle = 'style="padding:12px 24px;margin-top:12px;font-size:16px;font-weight:bold;cursor:pointer;background:#d4af37;color:#0a0e20;border:none;border-radius:8px;"';
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    await showPlate178('<h2 style="color:#d4af37">📱 ' + it.name + ' — отсканируй свою роль</h2>' +
      '<p>Передай устройство игроку <b>' + it.name + '</b>. Остальные — не подглядывать!</p>' +
      '<div style="background:#fff;padding:14px;border-radius:12px;display:inline-block;margin:10px 0">' +
      '<img src="' + it.src + '" onerror="this.onerror=null;this.src=\'' + it.net + '\';" style="width:min(300px,62vw);display:block">' +
      '</div>' +
      '<div style="font-weight:bold;font-size:18px;margin:8px 0">' + it.name + '</div>' +
      '<p style="font-size:11px;opacity:.7;word-break:break-all">если QR не сканируется — открой вручную: ' + it.url + '</p>' +
      '<p>Плашка ' + (i + 1) + ' из ' + items.length + '</p>' +
      '<button data-val="ok" ' + btnStyle + '>✅ ' + it.name + ' отсканировал — дальше</button>');
  }
  return showPlate178('<h2 style="color:#d4af37">✅ Все получили роли</h2><p>🤖 Боты получили роли автоматически.</p><p>Город просыпается…</p><button data-val="start" ' + btnStyle + '>🎲 Начать!</button>');
}
