// ============================================
// ДОПОЛНЕНИЕ v209 (модуль) — ФИНАЛЬНАЯ ДОЧИСТКА: НОЧЬ, ПОЩАДА, КИНО, ГОЛОС, МУЗЫКА, АВТОСЕЙВ
// ============================================
// 1) Ночь — по S.timeOfDay и по #timeLabel (старая проверка не видела 'night')
function isNight202() {
  if (!window.S) return false;
  if (S.timeOfDay === 'night') return true;
  const el = document.getElementById('timeLabel');
  if (el && /ноч/i.test(el.textContent || '')) return true;
  return false;
}
// 2) Ночное убийство: скины берём из p.skins (skinId не существует)
function nightKill202() {
  if (!window.S || S.isOver) return;
  const killer = S.players.find(x => x.role === 'murderer');
  if (!killer) return;
  const targets = S.players.filter(x => x.name !== killer.name);
  const t = targets[Math.floor(Math.random() * targets.length)];
  if (!t) return;
  if (t.role === 'sheriff') {
    if (t.skins && t.skins.length) {
      const sid = t.skins.splice(Math.floor(Math.random() * t.skins.length), 1)[0];
      const sk = (window.SKINS && SKINS[sid]) || {};
      t.damage = Math.max(0, (t.damage || 0) - (sk.damage || 0));
      t.defense = Math.max(0, (t.defense || 0) - (sk.defense || 0));
      window.pendingSkin202 = { skin: sid, until: S.round + 1 };
      log('🌙 Ночь: убийца снял скин «' + (sk.name || sid) + '» с шерифа ' + t.name + '! Через круг — внимательность!');
    } else { log('🌙 Ночь: убийца навестил шерифа ' + t.name + ', но скина не нашёл.'); t.fear.add(1); }
  } else if (t.role === 'civilian') {
    const fm = (t.fear && t.fear.max) || 5;
    if (t.fear && t.fear.set) t.fear.set(fm); else if (t.fear) t.fear.add(5);
    if (t.fatigue) t.fatigue.add(1);
    const am = (killer.adrenaline && killer.adrenaline.max) || 3;
    if (killer.adrenaline && killer.adrenaline.set) killer.adrenaline.set(am); else if (killer.adrenaline) killer.adrenaline.add(3);
    log('🌙 Ночь: ' + t.name + ' — к психологу (страх на максимум). Убийца полон адреналина!');
  } else log('🌙 Ночь прошла тихо… кто-то просто не спал.');
  qrBroadcast138({ type: 'text', text: '🌙 Город погружается в ночь…' });
  if (typeof updateUI === 'function') updateUI();
}
// передача скина убийце через круг
setInterval(() => {
  if (window.pendingSkin202 && window.S && S.round >= window.pendingSkin202.until) {
    const m = S.players.find(x => x.role === 'murderer');
    if (m) {
      m.skins = m.skins || [];
      m.skins.push(window.pendingSkin202.skin);
      const sk = (window.SKINS && SKINS[window.pendingSkin202.skin]) || {};
      m.damage += sk.damage || 0; m.defense += sk.defense || 0;
      log('🧥 Внимательность: скин «' + (sk.name || window.pendingSkin202.skin) + '» теперь у убийцы ' + m.name + '!');
    }
    window.pendingSkin202 = null;
    if (typeof updateUI === 'function') updateUI();
  }
}, 1500);
// 3) ПОЩАДА: только победитель (читаем 💪 силы и имена из окна стычки)
const _sm209 = window.showModal;
window.showModal = function (html, opts) {
  let h = html || '';
  if (/ВСТРЕЧА НА КЛЕТКЕ/.test(h) && /пощадить/i.test(h)) {
    const pows = [...h.matchAll(/💪 (\d+)/g)].map(m => +m[1]);
    const names = [...h.matchAll(/<h3[^>]*>([^<]+)<\/h3>/g)].map(m => m[1].trim());
    const cur = window.S && S.players && S.players[S.cur] ? S.players[S.cur].name : '';
    const winner = (pows.length >= 2 && names.length >= 2 && pows[0] !== pows[1]) ? (pows[0] > pows[1] ? names[0] : names[1]) : '';
    if (winner && cur && winner !== cur) {
      h = h.replace(/<button[^>]*data-v\s*=\s*"spare"[^>]*>[\s\S]{0,80}?<\/button>/, '<p style="opacity:.75;font-size:12px">🕊 Пощаду может предложить только победитель.</p>');
    }
  }
  return _sm209(h, opts);
};
// 4) КИНО: экспорт для пульта ведущего
window.cinema188 = function (title, sub) {
  const o = document.createElement('div');
  o.style.cssText = 'position:fixed;inset:0;z-index:500;background:radial-gradient(ellipse at center,rgba(60,0,0,.85),rgba(0,0,0,.95));display:flex;align-items:center;justify-content:center;flex-direction:column';
  o.innerHTML = '<div style="font-size:clamp(28px,7vw,72px);font-weight:900;color:#ff5252;text-shadow:0 0 30px #f00;letter-spacing:4px">⚔️ ' + (title || 'ШОУ') + '</div><div style="margin-top:10px;font-size:clamp(12px,2.4vw,20px);color:#ffd54f;max-width:80vw;text-align:center">' + (sub || '') + '</div>';
  document.body.appendChild(o);
  setTimeout(() => { o.style.transition = 'opacity .8s'; o.style.opacity = 0; setTimeout(() => o.remove(), 900); }, 3000);
};
// 5) ГОЛОС УЛИЦ: при ведущем-человеке город молчит без твоей команды
const _vos209 = window.voiceOfTheStreets;
window.voiceOfTheStreets = function () {
  if (window.MM_HOST === 'human' && !window.MM_VOICE_ALLOW) return Promise.resolve();
  return _vos209.apply(this, arguments);
};
// 6) музыка правил + тултипы без «Спортзала/детективов» + автосейв
if (window.ASSETS && ASSETS.sounds && ASSETS.sounds.music && !ASSETS.music) ASSETS.music = ASSETS.sounds.music;
document.addEventListener('mouseover', () => {
  setTimeout(() => {
    const t = document.getElementById('statTip');
    if (t) t.innerHTML = t.innerHTML.replace(/,?\s*Спортзал/gi, '').replace(/детектив/gi, 'шериф');
  }, 0);
}, true);
const _et209 = window.endTurn;
window.endTurn = async function () {
  const r0 = window.S ? S.round : 0;
  const r = await _et209.apply(this, arguments);
  if (window.S && S.round !== r0 && window.MMSET && MMSET.autosave && typeof saveGameLocal === 'function') saveGameLocal();
  return r;
};
console.log('🏁 final.js v209: ночь+скины, пощада победителя, кино, голос под контролем, автосейв');
// ============================================
// FINAL.JS v210 — ВСЁ ЛЕЧЕНИЕ В ОДНОМ ФАЙЛЕ (как у Алисы: просто и чётко)
// ============================================
// 1) НОЧЬ: S.timeOfDay === 'night' (старая проверка искала «ноч» в английском слове)
function isNight202() {
  if (!window.S) return false;
  if (S.timeOfDay === 'night') return true;
  const el = document.getElementById('timeLabel');
  if (el && /ноч/i.test(el.textContent || '')) return true;
  return false;
}
// 2) НОЧНОЕ УБИЙСТВО: скины берём из p.skins (skinId не существует)
function nightKill202() {
  if (!window.S || S.isOver) return;
  const killer = S.players.find(x => x.role === 'murderer');
  if (!killer) return;
  const t = S.players.filter(x => x.name !== killer.name)[Math.floor(Math.random() * (S.players.length - 1))];
  if (!t) return;
  if (t.role === 'sheriff') {
    if (t.skins && t.skins.length) {
      const sid = t.skins.splice(Math.floor(Math.random() * t.skins.length), 1)[0];
      const sk = (window.SKINS && SKINS[sid]) || {};
      t.damage = Math.max(0, (t.damage || 0) - (sk.damage || 0));
      t.defense = Math.max(0, (t.defense || 0) - (sk.defense || 0));
      window.pendingSkin202 = { skin: sid, until: S.round + 1 };
      log('🌙 Ночь: убийца снял скин «' + (sk.name || sid) + '» с шерифа ' + t.name + '! Через круг — внимательность!');
    } else { log('🌙 Ночь: убийца навестил шерифа ' + t.name + ', но скина не нашёл.'); t.fear.add(1); }
  } else if (t.role === 'civilian') {
    const fm = (t.fear && t.fear.max) || 5;
    if (t.fear && t.fear.set) t.fear.set(fm); else if (t.fear) t.fear.add(5);
    if (t.fatigue) t.fatigue.add(1);
    const am = (killer.adrenaline && killer.adrenaline.max) || 3;
    if (killer.adrenaline && killer.adrenaline.set) killer.adrenaline.set(am); else if (killer.adrenaline) killer.adrenaline.add(3);
    log('🌙 Ночь: ' + t.name + ' — к психологу (страх на максимум). Убийца полон адреналина!');
  } else log('🌙 Ночь прошла тихо… кто-то просто не спал.');
  qrBroadcast138({ type: 'text', text: '🌙 Город погружается в ночь…' });
  if (typeof updateUI === 'function') updateUI();
}
setInterval(() => {
  if (window.pendingSkin202 && window.S && S.round >= window.pendingSkin202.until) {
    const m = S.players.find(x => x.role === 'murderer');
    if (m) {
      m.skins = m.skins || [];
      m.skins.push(window.pendingSkin202.skin);
      const sk = (window.SKINS && SKINS[window.pendingSkin202.skin]) || {};
      m.damage += sk.damage || 0; m.defense += sk.defense || 0;
      log('🧥 Внимательность: скин «' + (sk.name || window.pendingSkin202.skin) + '» теперь у убийцы ' + m.name + '!');
    }
    window.pendingSkin202 = null;
    if (typeof updateUI === 'function') updateUI();
  }
}, 1500);
// 3) ПОЩАДА В СТЫЧКЕ — ТОЛЬКО У ПОБЕДИТЕЛЯ (кнопка data-v="spare")
const _sm210 = window.showModal;
window.showModal = function (html, opts) {
  let h = html || '';
  if (/ВСТРЕЧА НА КЛЕТКЕ/.test(h) && /пощадить/i.test(h)) {
    const pows = [...h.matchAll(/💪 (\d+)/g)].map(m => +m[1]);
    const names = [...h.matchAll(/<h3[^>]*>([^<]+)<\/h3>/g)].map(m => m[1].trim());
    const cur = window.S && S.players && S.players[S.cur] ? S.players[S.cur].name : '';
    const winner = (pows.length >= 2 && names.length >= 2 && pows[0] !== pows[1]) ? (pows[0] > pows[1] ? names[0] : names[1]) : '';
    if (winner && cur && winner !== cur) {
      h = h.replace(/<button[^>]*data-v\s*=\s*"spare[^"]*"[^>]*>[\s\S]{0,80}?<\/button>/, '<p style="opacity:.75;font-size:12px">🕊 Пощаду может предложить только победитель.</p>');
    }
  }
  return _sm210(h, opts);
};
// 4) МУЗЫКА ПРАВИЛ: алиас ASSETS.music
if (window.ASSETS && ASSETS.sounds && ASSETS.sounds.music && !ASSETS.music) ASSETS.music = ASSETS.sounds.music;
// 5) ТУЛТИПЫ: без «Спортзала» и «детективов»
document.addEventListener('mouseover', () => {
  setTimeout(() => {
    const t = document.getElementById('statTip');
    if (t) t.innerHTML = t.innerHTML.replace(/,?\s*Спортзал/gi, '').replace(/детектив/gi, 'шериф');
  }, 0);
}, true);
// 6) АВТОСЕЙВ при смене раунда
const _et210 = window.endTurn;
window.endTurn = async function () {
  const r0 = window.S ? S.round : 0;
  const r = await _et210.apply(this, arguments);
  if (window.S && S.round !== r0 && window.MMSET && MMSET.autosave && typeof saveGameLocal === 'function') saveGameLocal();
  return r;
};
// 7) КИНО для пульта ведущего (экспорт)
window.cinema188 = window.cinema188 || function (title, sub) {
  const o = document.createElement('div');
  o.style.cssText = 'position:fixed;inset:0;z-index:500;background:radial-gradient(ellipse at center,rgba(60,0,0,.85),rgba(0,0,0,.95));display:flex;align-items:center;justify-content:center;flex-direction:column';
  o.innerHTML = '<div style="font-size:clamp(28px,7vw,72px);font-weight:900;color:#ff5252;text-shadow:0 0 30px #f00;letter-spacing:4px">⚔️ ' + (title || 'ШОУ') + '</div><div style="margin-top:10px;font-size:clamp(12px,2.4vw,20px);color:#ffd54f;max-width:80vw;text-align:center">' + (sub || '') + '</div>';
  document.body.appendChild(o);
  setTimeout(() => { o.style.transition = 'opacity .8s'; o.style.opacity = 0; setTimeout(() => o.remove(), 900); }, 3000);
};
// 8) ГОЛОС УЛИЦ: при ведущем-человеке город молчит без команды
if (window.voiceOfTheStreets) {
  const _vos210 = window.voiceOfTheStreets;
  window.voiceOfTheStreets = function () {
    if (window.MM_HOST === 'human' && !window.MM_VOICE_ALLOW) return Promise.resolve();
    return _vos210.apply(this, arguments);
  };
}
console.log('🏁 final.js v210: ночь, пощада победителя, музыка, автосейв, кино, голос — всё в одном');
