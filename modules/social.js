// ============================================
// ДОПОЛНЕНИЕ v188 (модуль) — ГОРОДСКИЕ СЛУХИ + ШЁПОТ + КИНО-РЕЖИМ
// ============================================

// --- 1) ГОРОДСКИЕ СЛУХИ: раз в ~2 раунда город шепчет ---
(function () {
  let lastRound = 0;
  const TEXTS = [
    'прошлой ночью видели у переулка с чемоданом',
    'часто задерживается у Небоскрёба после заката',
    'заплатил кому-то за молчание',
    'сжёг бумаги в своём дворе',
    'ведёт себя слишком спокойно для этого города',
    'задаёт слишком много вопросов о чужих алиби'
  ];
  setInterval(() => {
    if (!window.S || !S.players || S.isOver || S.round < 2 || window.MM_HOST === 'human') return;
    if (S.round !== lastRound) {
      lastRound = S.round;
      if (Math.random() < 0.6) showRumor();
    }
  }, 1500);
  function showRumor() {
    const t = S.players[Math.floor(Math.random() * S.players.length)];
    const txt = TEXTS[Math.floor(Math.random() * TEXTS.length)];
    t.suspect.add(1);
    if (typeof log === 'function') log('🗣 Слух: ' + t.name + ' ' + txt + ' (+1 подозрение)');
    if (typeof updateUI === 'function') updateUI();
    qrBroadcast138({ type: 'text', text: '🗣 Слух: ' + t.name + ' ' + txt });
    let left = 30;
    const b = document.createElement('div');
    b.style.cssText = 'position:fixed;top:8px;left:50%;transform:translateX(-50%);z-index:450;background:linear-gradient(160deg,#2a1a1a,#140a0a);border:2px solid #ff8a65;color:#ffd54f;padding:10px 18px;border-radius:12px;font-weight:800;box-shadow:0 8px 24px rgba(0,0,0,.7);text-align:center;max-width:92vw';
    b.innerHTML = '🗣 ГОРОДСКОЙ СЛУХ<br><span style="font-weight:600">' + t.name + ' ' + txt + '</span><br><span class="rumorT" style="color:#ff8a65">обсуждение: 30 сек</span>';
    document.body.appendChild(b);
    const iv = setInterval(() => {
      left--;
      const el = b.querySelector('.rumorT');
      if (el) el.textContent = 'обсуждение: ' + left + ' сек';
      if (left <= 0) { clearInterval(iv); b.remove(); }
    }, 1000);
  }
  window.showRumor188 = showRumor;
})();

// --- 2) ШЁПОТ: телефон шепчет ведущему на монитор ---
const _pc188 = phoneCmd141;
window.phoneCmd141 = function (d, conn) {
  if (d && d.cmd === 'whisper') {
    let t = document.getElementById('whisper188');
    if (!t) {
      t = document.createElement('div');
      t.id = 'whisper188';
      t.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:460;background:#101632;border:1px solid #7cfc9a;color:#d8ffd8;padding:8px 12px;border-radius:10px;font-size:13px;max-width:300px;opacity:0;transition:opacity .4s;pointer-events:none';
      document.body.appendChild(t);
    }
    t.textContent = '🤫 ' + (conn && conn._mmName ? conn._mmName : '???') + ': ' + d.text;
    t.style.opacity = 1;
    setTimeout(() => { t.style.opacity = 0; }, 8000);
    return;
  }
  return _pc188(d, conn);
};

// --- 3) КИНО-РЕЖИМ: полноэкранная вставка на дуэли/финале ---
(function () {
  let lastSig = '', cool = 0;
  setInterval(() => {
    const lg = document.getElementById('log');
    if (!lg || !lg.firstElementChild) return;
    const txt = lg.firstElementChild.textContent || '';
    const m = txt.match(/ДУЭЛЬ|ФИНАЛ|раскрыт|победил|убит/i);
    if (!m) return;
    const sig = txt.slice(0, 40);
    if (sig === lastSig || Date.now() - cool < 20000) return;
    lastSig = sig; cool = Date.now();
    const o = document.createElement('div');
    o.style.cssText = 'position:fixed;inset:0;z-index:500;background:radial-gradient(ellipse at center,rgba(60,0,0,.85),rgba(0,0,0,.95));display:flex;align-items:center;justify-content:center;flex-direction:column';
    o.innerHTML = '<div style="font-size:clamp(28px,7vw,72px);font-weight:900;color:#ff5252;text-shadow:0 0 30px #f00;letter-spacing:4px">⚔️ ' + m[0].toUpperCase() + '</div><div style="margin-top:10px;font-size:clamp(12px,2.4vw,20px);color:#ffd54f;max-width:80vw;text-align:center">' + txt + '</div>';
    document.body.appendChild(o);
    setTimeout(() => { o.style.transition = 'opacity .8s'; o.style.opacity = 0; setTimeout(() => o.remove(), 900); }, 3000);
  }, 1000);
})();
console.log('🎭 social.js: слухи + шёпот + кино');
