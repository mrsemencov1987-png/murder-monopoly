// ============================================
// ДОПОЛНЕНИЕ v192 (модуль) — АВТОПАУЗА, ЕСЛИ ТЕЛЕФОН ОТВАЛИЛСЯ
// ============================================
window.MM_LASTSEEN = window.MM_LASTSEEN || {};
window.MM_PAUSE = false;
const _up192 = window.onUp171;
window.onUp171 = function (payload) {
  try {
    const m = JSON.parse(payload);
    if (m && m.type === 'hello' && m.name) MM_LASTSEEN[m.name] = Date.now();
  } catch (e) {}
  return _up192(payload);
};
let banner192 = null, lastKey192 = '', grace192 = {};
function missing192() {
  if (!window.mmBus145 || !window.S || !S.players || !mmBus145.joined) return [];
  const now = Date.now();
  return S.players
    .filter(p => !p.isBot && mmBus145.joined[p.name])
    .filter(p => (now - (MM_LASTSEEN[p.name] || 0) > 30000) && !(grace192[p.name] && now < grace192[p.name]))
    .map(p => p.name);
}
function hideBanner192() { if (banner192) { banner192.remove(); banner192 = null; lastKey192 = ''; } }
function showBanner192(miss, cur) {
  const key = miss.join('|') + (miss.indexOf(cur) !== -1 ? '!cur' : '');
  if (banner192 && key === lastKey192) return;
  lastKey192 = key;
  hideBanner192();
  banner192 = document.createElement('div');
  banner192.style.cssText = 'position:fixed;top:8px;left:50%;transform:translateX(-50%);z-index:470;background:#1a2340;border:2px solid #ff5252;color:#ffd54f;padding:10px 16px;border-radius:12px;font-weight:800;text-align:center;box-shadow:0 8px 24px rgba(0,0,0,.7);max-width:92vw';
  banner192.innerHTML = '⏸ ПАУЗА — ждём телефон: ' + miss.join(', ') +
    (cur && miss.indexOf(cur) !== -1 ? '<br><span style="color:#ff8a80">сейчас их ход!</span>' : '') +
    '<br><button id="force192" style="margin-top:6px;padding:6px 12px;background:#101632;border:1px solid #d4af37;color:#ffd54f;border-radius:8px;cursor:pointer">▶ Продолжить без телефона (60 сек)</button>';
  document.body.appendChild(banner192);
  document.getElementById('force192').onclick = () => {
    miss.forEach(n => { grace192[n] = Date.now() + 60000; });
    MM_PAUSE = false;
    hideBanner192();
    log('▶ Ведущий продолжил без телефона (60 сек)');
  };
}
setInterval(() => {
  if (!window.S || S.isOver) { if (MM_PAUSE) { MM_PAUSE = false; hideBanner192(); } return; }
  const miss = missing192();
  const cur = S.players && S.players[S.cur] ? S.players[S.cur].name : '';
  if (miss.length && !MM_PAUSE) { MM_PAUSE = true; log('⏸ Автопауза: телефон ' + miss.join(', ') + ' отвалился'); }
  if (!miss.length && MM_PAUSE) { MM_PAUSE = false; hideBanner192(); log('▶ Связь восстановлена — игра продолжается!'); }
  if (MM_PAUSE) showBanner192(miss, cur);
}, 1500);
// ворота: во время паузы ничего не двигается
const _rd192 = window.rollDice;
window.rollDice = function () { if (MM_PAUSE) return Promise.resolve(); return _rd192.apply(this, arguments); };
const _et192 = window.endTurn;
window.endTurn = function () { if (MM_PAUSE) return; return _et192.apply(this, arguments); };
const _bt192 = window.botTurn;
window.botTurn = function () { if (MM_PAUSE) { setTimeout(botTurn, 2000); return; } return _bt192.apply(this, arguments); };
['accuseOpen', 'morOpen'].forEach(fn => {
  if (window[fn]) { const o = window[fn]; window[fn] = function () { if (MM_PAUSE) return; return o.apply(this, arguments); }; }
});
console.log('⏸ pause.js: автопауза при обрыве телефона');
