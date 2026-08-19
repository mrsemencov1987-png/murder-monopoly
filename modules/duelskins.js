// ============================================
// ДОПОЛНЕНИЕ v190 (модуль) — СКИНЫ: БАФЫ/ДЕБАФЫ, ПОСТОЯННЫЕ И ВРЕМЕННЫЕ
// ============================================
const BUFFS190 = {
  crown:        { stat: 'reputation',  delta: 1,  rounds: 0 },
  cross:        { stat: 'reputation',  delta: 1,  rounds: 0 },
  backpack:     { stat: 'connections', delta: 1,  rounds: 0 },
  ushanka:      { stat: 'fatigue',     delta: -1, rounds: 0 },
  corrupt:      { stat: 'reputation',  delta: -1, rounds: 0 },
  void_blade:   { stat: 'fear',        delta: 1,  rounds: 0 },
  eternal_flame:{ stat: 'adrenaline',  delta: 1,  rounds: 0 },
  watch:        { stat: 'reputation',  delta: 1,  rounds: 3 },
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

// ============================================
// ДОПОЛНЕНИЕ v200 — МИР ТОЛЬКО У ПОБЕДИТЕЛЯ (маркер: «принять исход» = окно проигравшего)
// ============================================
const _sm200 = window.showModal;
window.showModal = function (html, opts) {
  let h = html || '';
  if (/разойтись миром/i.test(h) && /принять исход/i.test(h)) {
    h = h.replace(/<button\b[^>]*>[\s\S]{0,220}?разойтись миром[\s\S]{0,220}?<\/button>/gi, '');
    h += '<p style="margin-top:8px;opacity:.75;font-size:13px">🕊 Пощада в этом городе — редкость. Проигравший принимает исход.</p>';
  }
  return _sm200(h, opts);
};
(function () {
  function sweep200() {
    document.querySelectorAll('button, [onclick]').forEach(el => {
      const t = el.textContent || '';
      if (!/разойтись миром/i.test(t)) return;
      let up = el.parentElement, depth = 0, found = false;
      while (up && depth < 7) {
        if (/принять исход/i.test(up.textContent || '')) { found = true; break; }
        up = up.parentElement; depth++;
      }
      if (found) { el.style.display = 'none'; el.disabled = true; }
    });
  }
  new MutationObserver(sweep200).observe(document.body, { childList: true, subtree: true });
  setInterval(sweep200, 700);
})();
console.log('⚖️🗡 duelskins.js v200: мир только у победителя + бафы скинов');
