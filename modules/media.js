// ============================================
// ДОПОЛНЕНИЕ v198 (модуль) — MP3+TTS, ЗВУК ЗАСТАВКИ, GIF-ФОНЫ ИЗ КОРНЯ
// ============================================
// звук: сначала mp3, если файла нет — браузер говорит сам
window.playLine198 = function (mp3, text) {
  const a = new Audio(mp3);
  const tts = () => {
    try {
      if (window.speechSynthesis) {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'ru-RU'; u.rate = 1.02; u.pitch = 0.85;
        speechSynthesis.speak(u);
      }
    } catch (e) {}
  };
  a.onerror = tts;
  a.play().catch(tts);
};
// звук заставки: по первому клику (браузеры требуют жест)
let intro198 = false;
window.addEventListener('pointerdown', () => {
  if (intro198) return; intro198 = true;
  playLine198('snd/intro.mp3', 'Добро пожаловать в Murder Monopoly. Город ждёт.');
}, { once: true });
// фоны-гифки из корня вместо mp4 (ТВ их любит больше)
(function () {
  const found = []; let idx = 0;
  function apply198() {
    if (!found.length) return;
    const b = document.getElementById('board') || document.getElementById('boardWrapper');
    if (!b) return;
    b.style.backgroundImage = 'url(' + found[idx % found.length] + ')';
    b.style.backgroundSize = 'cover';
    b.style.backgroundPosition = 'center';
    document.querySelectorAll('#board video, #boardWrapper video').forEach(v => { try { v.pause(); } catch (e) {} v.style.display = 'none'; });
  }
  ['bg.gif', 'bg1.gif', 'bg2.gif', 'city.gif', 'field.gif'].forEach(g => {
    const im = new Image();
    im.onload = () => { found.push(g); apply198(); };
    im.src = g;
  });
  setInterval(() => { if (found.length > 1) { idx++; apply198(); } }, 45000);
})();
console.log('🎞 media.js: mp3+TTS, заставка, gif-фоны');
