// ============================================
// ДОПОЛНЕНИЕ v205 — АВТОНОМНЫЕ ДУБЛЁРЫ: ПАУЗА + ЗВОНКИ + ГОЛОС (с прозрачными логами)
// ============================================
(function () {
  // --- ПАУЗА: собственный детектор ---
  let b205 = null;
  function banner205(miss) {
    if (!miss.length) { if (b205) { b205.remove(); b205 = null; } return; }
    if (!b205) {
      b205 = document.createElement('div');
      b205.style.cssText = 'position:fixed;top:8px;left:50%;transform:translateX(-50%);z-index:470;background:#1a2340;border:2px solid #ff5252;color:#ffd54f;padding:10px 16px;border-radius:12px;font-weight:800;text-align:center;box-shadow:0 8px 24px rgba(0,0,0,.7)';
      document.body.appendChild(b205);
    }
    b205.innerHTML = '⏸ ПАУЗА — ждём телефон: ' + miss.join(', ');
  }
  setInterval(() => {
    try {
      if (!window.S || !S.players || !window.mmBus145 || S.isOver) { window.MM_PAUSE = false; banner205([]); return; }
      const now = Date.now();
      const ls = window.MM_LASTSEEN || {};
      const miss = S.players.filter(p => !p.isBot && mmBus145.joined && mmBus145.joined[p.name] && now - (ls[p.name] || 0) > 30000).map(p => p.name);
      window.MM_PAUSE = miss.length > 0;
      banner205(miss);
    } catch (e) { console.log('⏸v205 ошибка:', e); }
  }, 2000);

  // --- ГОЛОС УЛИЦ: собственные кнопки ведущего (справа внизу) ---
  setInterval(() => {
    if (window.MM_HOST !== 'human' || !window.S || S.isOver || document.getElementById('hv205')) return;
    const row = document.createElement('div');
    row.id = 'hv205';
    row.style.cssText = 'position:fixed;right:8px;bottom:8px;z-index:480;display:flex;gap:4px;flex-wrap:wrap;max-width:280px;background:#141a35;border:2px solid #7cfc9a;border-radius:12px;padding:8px';
    row.innerHTML = '<b style="width:100%;color:#7cfc9a;font-size:11px">🌆 Голос улиц (ведущий):</b>' +
      [['appear', '👁 Явление'], ['disappear', '🌫 Исчезновение'], ['curse', '🕯 Проклятие'], ['shuffle', '🔀 Тасовка'], ['chaos', '🌪 Хаос']]
      .map(v => '<button data-v205="' + v[0] + '" style="padding:6px 8px;background:#101632;border:1px solid #7cfc9a;color:#d8ffd8;border-radius:8px;cursor:pointer;font-size:11px">' + v[1] + '</button>').join('');
    document.body.appendChild(row);
    row.querySelectorAll('button').forEach(b => {
      b.onclick = () => { if (window.hostVoice195) { hostVoice195(b.getAttribute('data-v205')); console.log('🌆v205 голос:', b.getAttribute('data-v205')); } else console.log('🌆v205 hostVoice195 НЕ НАЙДЕНА'); };
    });
  }, 2000);

  // --- ЗВОНКИ: собственный планировщик ---
  setInterval(() => {
    try {
      if (!window.S || S.isOver || !window.mmBus145) return;
      if (Math.random() > 0.5) return;
      const humans = S.players.filter(p => !p.isBot && mmBus145.joined && mmBus145.joined[p.name]);
      console.log('📞v205 чек: телефоны у', humans.map(p => p.name).join(',') || 'никого', '· host=' + window.MM_HOST);
      if (window.MM_HOST === 'human' && (!humans.length || Math.random() < 0.3)) { if (window.hostCall197) { hostCall197(); console.log('📞v205 → звонок ведущему'); } return; }
      if (!humans.length) return;
      const p = humans[Math.floor(Math.random() * humans.length)];
      if (!window.buildEntry197) { console.log('📞v205 buildEntry197 НЕ НАЙДЕНА'); return; }
      const e = buildEntry197(p);
      window.pendingCall205 = { name: p.name, entry: e };
      mmSend145(p.name, { type: 'call', caller: e.caller });
      console.log('📞v205 → звонок', p.name, 'от', e.caller);
    } catch (err) { console.log('📞v205 ошибка:', err); }
  }, 15000);
})();
// ответы на звонки, инициированные v205
const _pc205 = phoneCmd141;
window.phoneCmd141 = function (d, conn) {
  if (d && (d.cmd === 'answer' || d.cmd === 'decline') && window.pendingCall205 && conn && conn._mmName === pendingCall205.name) {
    const e = pendingCall205.entry; window.pendingCall205 = null;
    const p = S.players.find(x => x.name === conn._mmName);
    if (d.cmd === 'answer') {
      if (window.applyFx197) applyFx197(p, e.fx);
      mmSend145(p.name, { type: 'calltext', text: '☎ ' + e.caller + ': «' + e.text + '»' });
      if (window.playLine198) playLine198(e.snd, e.text);
      log('☎ ' + p.name + ' ответил на звонок: ' + e.caller);
    } else {
      if (window.applyDecline201) applyDecline201(p, e.caller); else log('🔕 ' + p.name + ' сбросил звонок');
    }
    if (typeof updateUI === 'function') updateUI();
    return;
  }
  return _pc205(d, conn);
};
console.log('🤖 auto205.js: автономные пауза+звонки+голос');
