// ============================================
// ДОПОЛНЕНИЕ v186 (модуль) — ВЕРСИЯ, ГОРЯЧИЕ КЛАВИШИ, КРАСИВАЯ ПОЛОСА ЗАГРУЗКИ
// ============================================
window.MM_VERSION = '2.2.0';

// 1) Версия в футере
(function () {
  const put = () => {
    document.querySelectorAll('.brand, footer').forEach(el => {
      if (!el.dataset.ver) { el.dataset.ver = '1'; el.innerHTML += ' · <b style="color:#ffd54f">v' + MM_VERSION + '</b>'; }
    });
  };
  put();
  setInterval(put, 3000);
})();

// 2) Горячие клавиши: Пробел = кубик, Enter = завершить ход
document.addEventListener('keydown', e => {
  const tag = (document.activeElement && document.activeElement.tagName) || '';
  if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
  const ov = document.getElementById('overlay');
  if (ov && ov.style.display !== 'none' && ov.innerHTML.trim()) return;
  if (!window.S || S.isBusy || S.isOver) return;
  const p = S.players[S.cur];
  if (!p || p.isBot) return;
  if (e.code === 'Space') {
    e.preventDefault();
    const b = document.getElementById('rollBtn');
    if (b && !b.disabled) rollDice();
  }
  if (e.code === 'Enter') {
    e.preventDefault();
    const b = document.getElementById('endBtn');
    if (b && !b.disabled) endTurn();
  }
});

// 3) Красивая полоса загрузки с процентами
(function () {
  let el = null, fill = null, txt = null;
  function ensure() {
    if (el) return;
    el = document.createElement('div');
    el.style.cssText = 'position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:999;width:min(320px,80vw);background:#141a35;border:2px solid #d4af37;border-radius:12px;padding:8px 12px;box-shadow:0 6px 18px rgba(0,0,0,.6);display:none';
    el.innerHTML = '<div id="lb186t" style="color:#ffd54f;font-size:12px;font-weight:700;margin-bottom:5px"></div><div style="height:8px;background:#0a0e20;border-radius:6px;overflow:hidden"><div id="lb186f" style="height:100%;width:0%;background:linear-gradient(90deg,#d4af37,#ffd54f);transition:width .3s"></div></div>';
    document.body.appendChild(el);
    fill = el.querySelector('#lb186f');
    txt = el.querySelector('#lb186t');
  }
  window.bar186 = function (label, pct, done) {
    ensure();
    if (done) { el.style.display = 'none'; return; }
    el.style.display = 'block';
    txt.textContent = label + ' — ' + Math.round(pct * 100) + '%';
    fill.style.width = Math.round(pct * 100) + '%';
  };
})();
async function loadMqtt171() {
  if (window.mqtt) return;
  const urls = ['https://unpkg.com/mqtt@5.10.1/dist/mqtt.min.js', 'https://cdn.jsdelivr.net/npm/mqtt@5.10.1/dist/mqtt.min.js', 'https://unpkg.com/mqtt@4.3.7/dist/mqtt.min.js'];
  for (let i = 0; i < urls.length; i++) {
    bar186('📡 Связь: mqtt', i / urls.length);
    if (await loadScript183(urls[i])) break;
  }
  bar186('📡 Связь: mqtt', 1);
  setTimeout(() => bar186('', 1, true), 700);
}
async function loadQRious137() {
  if (window.QRious) return;
  const urls = ['https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js', 'https://cdn.jsdelivr.net/npm/qrious@4.0.2/dist/qrious.min.js', 'https://unpkg.com/qrious@4.0.2/dist/qrious.min.js'];
  for (let i = 0; i < urls.length; i++) {
    bar186('🔳 QR-генератор', i / urls.length);
    if (await loadScript183(urls[i])) break;
  }
  bar186('🔳 QR-генератор', 1);
  setTimeout(() => bar186('', 1, true), 700);
}
console.log('🏷 MURDER MONOPOLY v' + MM_VERSION + ' (модуль quick.js)');
