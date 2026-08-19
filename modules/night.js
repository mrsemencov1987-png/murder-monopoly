// ============================================
// ДОПОЛНЕНИЕ v202 — НОЧЬ/УБИЙСТВО + БАФЫ ВСЕМ СКИНАМ + ДУЭЛЬ-УСИЛЕНИЕ + ДИАГНОСТИКА ПАУЗЫ
// ============================================
// --- НОЧЬ: затемнение + попытка убийства ---
let lastNight202 = false, pendingSkin202 = null;
function isNight202() {
  if (!window.S) return false;
  const keys = ['timeOfDay', 'time', 'dayTime', 'timeofday', 'phase'];
  for (const k of keys) { if (S[k] && /ноч/i.test(S[k] + '')) return true; }
  const els = document.querySelectorAll('#timeHeader, .time, #time, #roundInfo, header');
  for (const el of els) { if (el && /ноч/i.test(el.textContent || '')) return true; }
  return false;
}
const st202 = document.createElement('style');
st202.textContent = 'body.mm-night #gameScreen{filter:brightness(.5) saturate(.75) hue-rotate(190deg);transition:filter 2s}';
document.head.appendChild(st202);
function nightKill202() {
  if (!window.S || S.isOver) return;
  const killer = S.players.find(x => x.role === 'murderer');
  if (!killer) return;
  const targets = S.players.filter(x => x.name !== killer.name);
  const t = targets[Math.floor(Math.random() * targets.length)];
  if (!t) return;
  if (t.role === 'sheriff') {
    const skin = t.skinId || t.skin;
    if (skin) { pendingSkin202 = { skin: skin, until: S.round + 1 }; t.skinId = null; if (t.skin) t.skin = null; log('🌙 Ночь: убийца снял скин с шерифа ' + t.name + '! Через круг он всплывёт у убийцы — внимательность!'); }
    else { log('🌙 Ночь: убийца навестил шерифа ' + t.name + ', но скина не нашёл.'); t.fear.add(1); }
  } else if (t.role === 'civilian') {
    const fm = (t.fear && t.fear.max) || 5;
    if (t.fear && t.fear.set) t.fear.set(fm); else if (t.fear) t.fear.add(5);
    if (t.fatigue) t.fatigue.add(1);
    const am = (killer.adrenaline && killer.adrenaline.max) || 3;
    if (killer.adrenaline && killer.adrenaline.set) killer.adrenaline.set(am); else if (killer.adrenaline) killer.adrenaline.add(3);
    log('🌙 Ночь: ' + t.name + ' — к психологу (страх на максимум). Убийца полон адреналина!');
  } else {
    log('🌙 Ночь прошла тихо… кто-то просто не спал.');
  }
  qrBroadcast138({ type: 'text', text: '🌙 Город погружается в ночь…' });
  if (typeof updateUI === 'function') updateUI();
}
setInterval(() => {
  const night = isNight202();
  document.body.classList.toggle('mm-night', night);
  if (night && !lastNight202) nightKill202();
  lastNight202 = night;
  if (pendingSkin202 && window.S && S.round >= pendingSkin202.until) {
    const m = S.players.find(x => x.role === 'murderer');
    if (m) { m.skinId = pendingSkin202.skin; if (m.skin !== undefined) m.skin = pendingSkin202.skin; log('🧥 Внимательность: скин «' + pendingSkin202.skin + '» теперь у убийцы ' + m.name + '!'); }
    pendingSkin202 = null;
    if (typeof updateUI === 'function') updateUI();
  }
}, 1500);
// --- БАФЫ ВСЕМ СКИНАМ: генеративно, детерминированно ---
function getBuff202(id) {
  if (window.BUFFS190 && BUFFS190[id]) return BUFFS190[id];
  const stats = ['reputation', 'fear', 'fatigue', 'adrenaline', 'connections'];
  let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return { stat: stats[Math.abs(h) % stats.length], delta: (Math.abs(h >> 3) % 2 === 0 ? 1 : -1), rounds: Math.abs(h >> 5) % 4 };
}
window.applyBuff190 = function (p, id) {
  const b = getBuff202(id);
  if (!b || !p || !p[b.stat] || !p[b.stat].add) return;
  p[b.stat].add(b.delta);
  const sign = b.delta > 0 ? '+' : '';
  if (b.rounds) {
    p.buffs190 = p.buffs190 || [];
    p.buffs190.push({ stat: b.stat, delta: b.delta, until: S.round + b.rounds, name: (window.SKINS && SKINS[id]) ? SKINS[id].name : id });
    log('⏳ ' + p.name + ': ' + sign + b.delta + ' ' + b.stat + ' на ' + b.rounds + ' раунда(ов)');
  } else log('✨ ' + p.name + ': постоянный эффект ' + sign + b.delta + ' ' + b.stat);
};
// --- ДУЭЛЬ: доп. защита — у обвинённого (sus>=10) мира нет ---
const _sm202 = window.showModal;
window.showModal = function (html, opts) {
  let h = html || '';
  if (/разойтись миром/i.test(h)) {
    const p = window.S && S.players && S.players[S.cur];
    const sus = p && p.suspect ? (p.suspect.get ? p.suspect.get() : p.suspect) : 0;
    if (sus >= 10) h = h.replace(/<button\b[^>]*>[\s\S]{0,220}?разойтись миром[\s\S]{0,220}?<\/button>/gi, '');
  }
  return _sm202(h, opts);
};
// --- ДИАГНОСТИКА ПАУЗЫ: видно, кто и когда последний раз стучал ---
setInterval(() => {
  if (!window.MM_LASTSEEN) return;
  const now = Date.now();
  const info = Object.keys(MM_LASTSEEN).map(k => k + ':' + Math.round((now - MM_LASTSEEN[k]) / 1000) + 's').join(', ');
  console.log('⏸ lastSeen: ' + (info || 'пусто') + ' · pause=' + window.MM_PAUSE);
}, 10000);
console.log('🌙 night.js v202: ночь+убийство, бафы всем скинам, дуэль-щит, диагностика паузы');
