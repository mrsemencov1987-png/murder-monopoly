// ============================================
// ДОПОЛНЕНИЕ v187 (модуль) — ЧИСТЫЙ ВЫХОД И СБРОС ТАЙМЕРОВ
// ============================================
window.MM_TIMERS = [];
const _sto = window.setTimeout, _si = window.setInterval, _cto = window.clearTimeout, _csi = window.clearInterval;
window.setTimeout = function (fn, ms) { const id = _sto(() => { MM_TIMERS = MM_TIMERS.filter(x => x !== id); fn(); }, ms); MM_TIMERS.push(id); return id; };
window.setInterval = function (fn, ms) { const id = _si(fn, ms); MM_TIMERS.push(id); return id; };
window.clearAllTimers = function () {
  MM_TIMERS.forEach(id => { _cto(id); _csi(id); });
  MM_TIMERS = [];
  console.log('⏱ все таймеры очищены');
};
window.exitGame = function () {
  window.clearAllTimers();
  if (typeof S !== 'undefined') S = null;
  const gs = document.getElementById('gameScreen'); if (gs) gs.style.display = 'none';
  const ss = document.getElementById('setupScreen'); if (ss) ss.style.display = 'flex';
  console.log('🛑 игра остановлена');
};
console.log('🧹 cleanup.js загружен');
