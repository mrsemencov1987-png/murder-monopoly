// ============================================
// ДОПОЛНЕНИЕ v206 — ВЕДУЩИЙ С ТЕЛЕФОНОМ: host.html + QR В ПАНЕЛИ
// ============================================
function hostSend206(obj) {
  if (!window.mmBus145) return;
  const s = JSON.stringify(obj);
  mmBus145.clients.forEach(c => { if (c.connected) c.publish('mm145_' + mmBus145.room + '_down_host', s); });
}
window.hostSend206 = hostSend206;
// кнопка QR пульта в панели ведущего
setInterval(() => {
  const p = document.getElementById('hostPanel193');
  if (!p || document.getElementById('h-qr206')) return;
  const b = document.createElement('button');
  b.id = 'h-qr206';
  b.style.cssText = (window.BS193 || 'padding:5px 8px;background:#101632;border:1px solid #7cfc9a;color:#d8ffd8;border-radius:8px;cursor:pointer;font-size:11px');
  b.textContent = '📱 QR пульта ведущего';
  b.onclick = () => {
    const url = location.href.split('#')[0].replace(/[^/]*$/, '') + 'host.html#room=' + mmBus145.room;
    let src = '';
    if (window.QRious) { try { src = new QRious({ value: url, size: 400, level: 'M' }).toDataURL(); } catch (e) {} }
    if (!src) src = 'https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=' + encodeURIComponent(url);
    showPlate178('<h2 style="color:#d4af37">🎬 Пульт ведущего на телефоне</h2>' +
      '<div style="background:#fff;padding:12px;border-radius:12px;display:inline-block;margin:10px 0"><img src="' + src + '" style="width:min(260px,60vw);display:block"></div>' +
      '<p style="font-size:11px;word-break:break-all">или вручную: ' + url + '</p>' +
      '<button data-val="ok" style="padding:12px 24px;margin-top:10px;font-size:16px;font-weight:bold;cursor:pointer;background:#d4af37;color:#0a0e20;border:none;border-radius:8px">Готово</button>');
  };
  p.appendChild(b);
}, 2000);
// hello ведущего + его команды с телефона
const _up206 = window.onUp171;
window.onUp171 = function (payload) {
  try {
    const m = JSON.parse(payload);
    if (m && m.type === 'hello' && m.host && window.mmBus145) {
      mmBus145.hostOn = true;
      console.log('🎬 Ведущий на связи с телефона');
    }
  } catch (e) {}
  return _up206(payload);
};
const _pc206 = phoneCmd141;
window.phoneCmd141 = function (d, conn) {
  if (d && d.cmd === 'whisper') hostSend206({ type: 'whisper', from: (conn && conn._mmName) || '?', text: d.text });
  if (d && d.cmd === 'hvoice' && window.hostVoice195) { hostVoice195(d.key); return; }
  if (d && d.cmd === 'hrumor' && window.showRumor188) { showRumor188(); return; }
  if (d && d.cmd === 'hpause') { window.MM_PAUSE = !window.MM_PAUSE; log(MM_PAUSE ? '⏸ Ведущий (телефон) поставил паузу' : '▶ Ведущий (телефон) снял паузу'); return; }
  if (d && d.cmd === 'hcinema' && window.cinema188) { cinema188('ШОУ', 'ведущий включает кино'); return; }
  return _pc206(d, conn);
};
// хроника (слухи/голос/звонки) дублируется на пульт ведущего
const _qb206 = qrBroadcast138;
window.qrBroadcast138 = function (msg) {
  if (msg && msg.type === 'text') hostSend206(msg);
  return _qb206(msg);
};
console.log('🎬 hostphone.js: ведущий с телефоном (host.html)');
