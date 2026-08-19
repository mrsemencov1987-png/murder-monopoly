// ============================================
// ДОПОЛНЕНИЕ v195 (модуль) — ГОЛОС УЛИЦ = ВЕДУЩИЙ: ГОРОД ГОВОРИТ ПО ТВОЕЙ ВОЛЕ
// ============================================
const _sm195 = window.showModal;
window.showModal = function (html, opts) {
  if (window.MM_HOST === 'human' && /голос улиц/i.test(html || '') && !window.MM_VOICE_ALLOW) {
    return Promise.resolve(null); // авто-голос молчит: ведущий сам решает
  }
  return _sm195(html, opts);
};
const VOICES195 = {
  appear:    { label: '👁 Явление',   img: 'img/voice/2.png',      fx(p) { p.suspect.add(1); return 'город видел его: +1 подозрение'; } },
  disappear: { label: '🌫 Исчезновение', img: 'img/voice/3.png',   fx(p) { p.coins = Math.max(0, p.coins - 20); return 'растворился в тумане: −20 монет'; } },
  curse:     { label: '🕯 Проклятие', img: 'img/voice/curse.png',  fx(p) { p.fear.add(1); return '+1 страх'; } },
  shuffle:   { label: '🔀 Тасовка',   img: 'img/voice/shuffle.png', fx(p) { if (p.hand && p.hand.length) { p.hand.splice(Math.floor(Math.random() * p.hand.length), 1); return 'туман забрал карту'; } return 'туман прошёл мимо'; } },
  chaos:     { label: '🌪 Хаос',      img: 'img/voice/chaos.png',  fxAll(S) { S.players.forEach(q => q.fear.add(1)); return 'всем +1 страх'; } }
};
window.hostVoice195 = function (key) {
  const v = VOICES195[key];
  if (!v || !window.S) return;
  const t = S.players[Math.floor(Math.random() * S.players.length)];
  const msg = v.fxAll ? v.fxAll(S) : v.fx(t);
  if (typeof log === 'function') log('🌆 Голос улиц: ' + (t && !v.fxAll ? t.name + ' — ' : '') + msg);
  if (typeof updateUI === 'function') updateUI();
  qrBroadcast138({ type: 'text', text: '🌆 Голос улиц: ' + (t && !v.fxAll ? t.name + ' — ' : '') + msg });
  window.MM_VOICE_ALLOW = true;
  _sm195('<h2>🌆 ГОЛОС УЛИЦ</h2>' +
    '<div style="background:#fff;padding:10px;border-radius:10px;display:inline-block"><img src="' + v.img + '" onerror="this.style.display=\'none\'" style="width:min(220px,50vw)"></div>' +
    '<p><b>' + (t && !v.fxAll ? t.name + ': ' : '') + '</b>' + msg + '</p>' +
    '<button data-val="ok">👂 Я услышал</button>');
  window.MM_VOICE_ALLOW = false;
};
// пульт ведущего: добавляем ряд кнопок Голоса
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
    '</div>' +
    '<div style="margin-top:4px;display:flex;gap:4px;flex-wrap:wrap">' +
    Object.keys(VOICES195).map(k => '<button data-hv="' + k + '" style="' + BS193 + '">' + VOICES195[k].label + '</button>').join('') +
    '</div>';
  document.getElementById('h-pause').onclick = () => { window.MM_PAUSE = !window.MM_PAUSE; log(MM_PAUSE ? '⏸ Ведущий поставил паузу' : '▶ Ведущий снял паузу'); };
  document.getElementById('h-rumor').onclick = () => { if (window.showRumor188) showRumor188(); };
  document.getElementById('h-cinema').onclick = () => { if (window.cinema188) cinema188('ШОУ', 'ведущий включает кино'); };
  p.querySelectorAll('[data-hv]').forEach(b => { b.onclick = () => hostVoice195(b.getAttribute('data-hv')); });
}
console.log('🌆 voicehost.js: Голос улиц теперь ведущий');
