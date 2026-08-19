// ============================================
// ДОПОЛНЕНИЕ v189 (модуль) — МИР РЕШАЕТ ТОЛЬКО ПОБЕДИТЕЛЬ
// ============================================
(function () {
  const LOSE = /ПОРАЖЕНИЕ|ПРОИГРАЛ|ПОВЕРЖЕН|РАСКРЫТ|ПОРАЖ/i;
  const WIN = /ПОБЕД|ВЫСТОЯЛ|ТРИУМФ|ВЫИГРАЛ/i;
  function sweep189() {
    document.querySelectorAll('button, [onclick]').forEach(el => {
      const t = el.textContent || '';
      if (!/разойтись миром/i.test(t)) return;
      let up = el.parentElement, ctx = '', depth = 0;
      while (up && depth < 7) {
        const txt = up.textContent || '';
        if (LOSE.test(txt) || WIN.test(txt)) { ctx = txt; break; }
        up = up.parentElement; depth++;
      }
      const loser = LOSE.test(ctx);
      const winner = WIN.test(ctx);
      if (loser || !winner) { el.style.display = 'none'; el.disabled = true; }
      else { el.style.display = ''; el.disabled = false; }
    });
  }
  new MutationObserver(sweep189).observe(document.body, { childList: true, subtree: true });
  setInterval(sweep189, 700);
})();

// ============================================
// ДОПОЛНЕНИЕ v190 (модуль) — СКИНЫ: БАФЫ/ДЕБАФЫ, ПОСТОЯННЫЕ И ВРЕМЕННЫЕ
// ============================================
const BUFFS190 = {
  crown:        { stat: 'reputation',  delta: 1,  rounds: 0 },  // постоянный
  cross:        { stat: 'reputation',  delta: 1,  rounds: 0 },
  backpack:     { stat: 'connections', delta: 1,  rounds: 0 },
  ushanka:      { stat: 'fatigue',     delta: -1, rounds: 0 },
  corrupt:      { stat: 'reputation',  delta: -1, rounds: 0 },  // дебаф-плата за силу
  void_blade:   { stat: 'fear',        delta: 1,  rounds: 0 },  // жуткое оружие пугает владельца
  eternal_flame:{ stat: 'adrenaline',  delta: 1,  rounds: 0 },
  watch:        { stat: 'reputation',  delta: 1,  rounds: 3 },  // временные
  sunglasses:   { stat: 'fear',        delta: -1, rounds: 2 },
  rubber_duck:  { stat: 'fear',        delta: -1, rounds: 2 },
  scarf:        { stat: 'fatigue',     delta: -1, rounds: 3 },
  earring:      { stat: 'adrenaline',  delta: 1,  rounds: 2 }
};
function applyBuff190(p, id) {
  const b = BUFFS190[id];
  if (!b || !p || !p[b.stat] || !p[b.stat].add) return;
  p[b.stat].add(b.delta);
  const sign = b.delta > 0 ? '+' : '';
  if (b.rounds) {
    p.buffs190 = p.buffs190 || [];
    p.buffs190.push({ stat: b.stat, delta: b.delta, until: S.round + b.rounds, name: (window.SKINS && SKINS[id]) ? SKINS[id].name : id });
    log('⏳ ' + p.name + ': ' + sign + b.delta + ' ' + b.stat + ' на ' + b.rounds + ' раунда(ов)');
  } else {
    log('✨ ' + p.name + ': постоянный эффект ' + sign + b.delta + ' ' + b.stat);
  }
}
const _buy190 = window.buySkin;
window.buySkin = function (p, cell) {
  _buy190(p, cell);
  applyBuff190(p, cell.skinId);
};
// выветривание временных эффектов
setInterval(() => {
  if (!window.S || !S.players) return;
  S.players.forEach(p => {
    if (!p.buffs190 || !p.buffs190.length) return;
    const left = [];
    p.buffs190.forEach(b => {
      if (S.round > b.until) {
        if (p[b.stat] && p[b.stat].add) p[b.stat].add(-b.delta);
        log('💨 ' + p.name + ': эффект «' + b.name + '» выветрился');
      } else left.push(b);
    });
    p.buffs190 = left;
  });
}, 2000);
// отображение активных бафов в статистике
const _ui190 = window.updateUI;
window.updateUI = function () {
  _ui190();
  const p = window.S && S.players && S.players[S.cur];
  const c = document.getElementById('playerStats');
  if (!p || !c || !p.buffs190 || !p.buffs190.length) return;
  c.innerHTML += p.buffs190.map(b =>
    '<div class="stat-item" style="opacity:.9">⏳ ' + (b.delta > 0 ? '+' : '') + b.delta + ' ' + b.stat + ' (' + (b.until - S.round) + ' р.)</div>'
  ).join('');
};
console.log('⚖️🗡 duelskins.js: мир только у победителя + бафы скинов');
