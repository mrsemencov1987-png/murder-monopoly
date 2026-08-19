// ============================================
// ДОПОЛНЕНИЕ v201 (модуль) — ШЕРИФ ВМЕСТО ДЕТЕКТИВА + УБРАТЬ «СПОРТЗАЛ» ИЗ СПРАВКИ
// ============================================
const _sm201 = window.showModal;
window.showModal = function (html, opts) {
  let h = html || '';
  h = h.replace(/детектив/gi, 'шериф');
  h = h.replace(/,?\s*Спортзал/gi, '');
  return _sm201(h, opts);
};
const _qb201 = qrBroadcast138;
window.qrBroadcast138 = function (msg) {
  if (msg && msg.title) msg.title = String(msg.title).replace(/детектива/gi, 'шерифа');
  return _qb201(msg);
};
console.log('🔧 fixes.js: шериф вместо детектива, спортзал убран');
