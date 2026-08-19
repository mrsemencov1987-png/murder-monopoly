// ============================================
// ДОПОЛНЕНИЕ v193 (модуль) — ВЕДУЩИЙ: ОТДЕЛЬНЫЙ ВЫБОР (НЕТ / ЧЕЛОВЕК / БОТ)
// ============================================
window.MM_HOST = 'off';
(function () {
  const inject = () => {
    const box = document.getElementById('setupScreen');
    if (!box || document.getElementById('hostRow193')) return;
    const row = document.createElement('div');
    row.id = 'hostRow193';
    row.style.cssText = 'display:flex;align-items:center;gap:8px;margin:6px 0;font-size:14px;color:#dfe6ff';
    row.innerHTML = '🎬 Ведущий: <select id="hostSel193" style="background:#101632;color:#ffd54f;border:1px solid #d4af37;border-radius:8px;padding:4px 8px"><option value="off">нет</option><option value="human">человек</option><option value="bot">бот</option></select>';
    const anchor = document.getElementById('botsEnabled');
    if (anchor && anchor.closest('div')) anchor.closest('div').after(row);
    else box.appendChild(row);
  };
  setInterval(inject, 1500);
  const _sg193 = window.startGame;
  window.startGame = function () {
    const sel = document.getElementById('hostSel193');
    window.MM_HOST = sel ? sel.value : 'off';
    const r = _sg193.apply(this, arguments);
    if (MM_HOST === 'human') buildHostPanel193();
    return r;
  };
})();
function buildHostPanel193() {
  if (document.getElementById('hostPanel193')) return;
  const p = document.createElement('div');
  p.id = 'hostPanel193';
  p.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:480;background:#141a35;border:2px solid #7cfc9a;border-radius:12px;padding:10px;color:#dfe6ff;font-size:12px;max-width:250px;box-shadow:0 8px 24px rgba(0,0,0,.7)';
  document.body.appendChild(p);
}
const BS193 = 'padding:5px 8px;background:#101632;border:1px solid #7cfc9a;color:#d8ffd8;border-radius:8px;cursor:pointer;font-size:11px';
function render193() {
  const p = document.getElementById('hostPanel193');
  if (!p || !window.S || !S.players) return;
  const R = window.ROLE_LABELS || {};
  p.innerHTML = '<b style="color:#7cfc9a">🎬 Пульт ведущего</b>' +
    S.players.map(pl => '<div>' + pl.name + ': <b>' + (R[pl.role] || pl.role) + '</b> · 🚨' + (pl.suspect && pl.suspect.get ? pl.suspect.get() : pl.suspect) + '</div>').join('') +
    '<div style="margin-top:6px;display:flex;gap:4px;flex-wrap:wrap">' +
    '<button id="h-pause" style="' + BS193 + '">⏸/▶ пауза</button>' +
    '<button id="h-rumor" style="' + BS193 + '">🗣 Слух</button>' +
    '<button id="h-cinema" style="' + BS193 + '">🎬 Кино</button>' +
    '</div>';
  document.getElementById('h-pause').onclick = () => { window.MM_PAUSE = !window.MM_PAUSE; log(MM_PAUSE ? '⏸ Ведущий поставил паузу' : '▶ Ведущий снял паузу'); };
  document.getElementById('h-rumor').onclick = () => { if (window.showRumor188) showRumor188(); else log('🗣 крючок showRumor188 не найден'); };
  document.getElementById('h-cinema').onclick = () => { if (window.cinema188) cinema188('ШОУ', 'ведущий включает кино'); else log('🎬 крючок cinema188 не найден'); };
}
setInterval(() => { if (window.MM_HOST === 'human' && window.S && !S.isOver) render193(); }, 2000);
console.log('🎬 host.js: ведущий — отдельный выбор');
