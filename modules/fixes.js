// ============================================
// ДОПОЛНЕНИЕ v201 (модуль) — ШЕРИФ ВМЕСТО ДЕТЕКТИВА + УБРАТЬ «СПОРТЗАЛ» ИЗ СПРАВКИ
// ============================================
const _sm201 = window.showModal;
window.showModal = function (html, opts) {
  let h = html || '';
  h = h.replace(/детектив/gi, 'шериф');
  h = h.replace(/,?\s*Спортзал/gi, '');
  return _sm201(h, opts);
};
const _qb201 = qrBroadcast138;
window.qrBroadcast138 = function (msg) {
  if (msg && msg.title) msg.title = String(msg.title).replace(/детектива/gi, 'шерифа');
  return _qb201(msg);
};
console.log('🔧 fixes.js: шериф вместо детектива, спортзал убран');
// ============================================
// ДОПОЛНЕНИЕ v206 — ТОЧЕЧНЫЕ ДОЧИСТКИ ПО РЕВИЗИИ
// ============================================
// 1) музыка правил оживает
if (window.ASSETS && ASSETS.sounds && ASSETS.sounds.music && !ASSETS.music) ASSETS.music = ASSETS.sounds.music;
// 2) тултипы статов: без «Спортзала» и «детективов»
document.addEventListener('mouseover', () => {
  setTimeout(() => {
    const t = document.getElementById('statTip');
    if (t) t.innerHTML = t.innerHTML.replace(/,?\s*Спортзал/gi, '').replace(/детектив/gi, 'шериф');
  }, 0);
}, true);
// 3) автосейв при смене раунда (вернулся!)
const _et206 = window.endTurn;
window.endTurn = async function () {
  const r0 = window.S ? S.round : 0;
  const r = await _et206.apply(this, arguments);
  if (window.S && S.round !== r0 && window.MMSET && MMSET.autosave && typeof saveGameLocal === 'function') saveGameLocal();
  return r;
};
// 4) ПОЩАДА В СТЫЧКЕ — ТОЛЬКО У ПОБЕДИТЕЛЯ (вот он, баг «мира у проигравшего»)
const _sm206 = window.showModal;
window.showModal = function (html, opts) {
  let h = html || '';
  if (/ВСТРЕЧА НА КЛЕТКЕ/.test(h) && /Принять исход/.test(h)) {
    const pows = [...h.matchAll(/💪 (\d+)/g)].map(m => +m[1]);
    const names = [...h.matchAll(/<h3[^>]*>([^<]+)<\/h3>/g)].map(m => m[1].trim());
    const cur = window.S && S.players && S.players[S.cur] ? S.players[S.cur].name : '';
    const winner = (pows.length === 2 && names.length === 2 && pows[0] !== pows[1]) ? (pows[0] > pows[1] ? names[0] : names[1]) : '';
    if (winner && cur && winner !== cur) {
      h = h.replace(/<button data-v\s*=\s*"spare"[^>]*>[\s\S]{0,80}?<\/button>/, '<p style="opacity:.75;font-size:12px">🕊 Пощаду предлагает только победитель.</p>');
    }
  }
  return _sm206(h, opts);
};
console.log('🔧 fixes v206: музыка, тултипы, автосейв, пощада только у победителя');
// ============================================
// ДОПОЛНЕНИЕ v207 — ПОЩАДА В СТЫЧКЕ ТОЛЬКО У ПОБЕДИТЕЛЯ (точное попадание в кнопку spare)
// ============================================
const _sm207 = window.showModal;
window.showModal = function (html, opts) {
  let h = html || '';
  if (/ВСТРЕЧА НА КЛЕТКЕ/.test(h) && /пощадить/i.test(h)) {
    const pows = [...h.matchAll(/💪 (\d+)/g)].map(m => +m[1]);
    const names = [...h.matchAll(/<h3[^>]*>([^<]+)<\/h3>/g)].map(m => m[1].trim());
    const cur = window.S && S.players && S.players[S.cur] ? S.players[S.cur].name : '';
    const winner = (pows.length === 2 && names.length === 2 && pows[0] !== pows[1]) ? (pows[0] > pows[1] ? names[0] : names[1]) : '';
    if (winner && cur && winner !== cur) {
      h = h.replace(/<button[^>]*data-v\s*=\s*"spare"[^>]*>[\s\S]{0,80}?<\/button>/, '<p style="opacity:.75;font-size:12px">🕊 Пощаду может предложить только победитель.</p>');
    }
  }
  return _sm207(h, opts);
};
// ============================================
// ДОПОЛНЕНИЕ v206 (дозагрузка) — МУЗЫКА ПРАВИЛ, ТУЛТИПЫ, АВТОСЕЙВ
// ============================================
if (window.ASSETS && ASSETS.sounds && ASSETS.sounds.music && !ASSETS.music) ASSETS.music = ASSETS.sounds.music;
document.addEventListener('mouseover', () => {
  setTimeout(() => {
    const t = document.getElementById('statTip');
    if (t) t.innerHTML = t.innerHTML.replace(/,?\s*Спортзал/gi, '').replace(/детектив/gi, 'шериф');
  }, 0);
}, true);
const _et206 = window.endTurn;
window.endTurn = async function () {
  const r0 = window.S ? S.round : 0;
  const r = await _et206.apply(this, arguments);
  if (window.S && S.round !== r0 && window.MMSET && MMSET.autosave && typeof saveGameLocal === 'function') saveGameLocal();
  return r;
};
console.log('🔧 fixes v207: пощада только у победителя + добор v206');
