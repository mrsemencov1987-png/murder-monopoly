// ============================================
// UTILS.JS — Вспомогательные функции и классы
// ============================================

// === 1. СЛУЧАЙНЫЕ ЧИСЛА И МАССИВЫ ===
function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(array) {
    if (!array || array.length === 0) return null;
    return array[Math.floor(Math.random() * array.length)];
}

function shuffle(array) {
    const arr = [...array]; // Копируем, чтобы не менять оригинал
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// === 2. ЗАДЕРЖКИ (для анимаций) ===
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// === 3. РАБОТА С DOM (поиск элементов) ===
function $(selector, context = document) {
    return context.querySelector(selector);
}

function $$(selector, context = document) {
    return [...context.querySelectorAll(selector)];
}

// === 4. МАТЕМАТИКА И ОГРАНИЧЕНИЯ ===
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

// === 5. КЛАСС ХАРАКТЕРИСТИК (Stat) ===
// Управляет значениями (подозрения, усталость и т.д.), не давая им выйти за рамки
class Stat {
    constructor(value = 0, min = 0, max = 10) {
        this.value = value;
        this.min = min;
        this.max = max;
    }

    get() { 
        return this.value; 
    }

    set(newValue) {
        this.value = clamp(newValue, this.min, this.max);
        return this.value;
    }

    add(amount) {
        this.value = clamp(this.value + amount, this.min, this.max);
        return this.value;
    }

    isMax() { 
        return this.value >= this.max; 
    }

    isMin() { 
        return this.value <= this.min; 
    }

    getPercent() {
        if (this.max === this.min) return 0;
        return ((this.value - this.min) / (this.max - this.min)) * 100;
    }
}

// === 6. КЭШ ЗВУКОВ (SoundCache) ===
// Загружает звук один раз и переиспользует, чтобы не было задержек
class SoundCache {
    constructor() {
        this.cache = {};
        this.enabled = true;
    }

    async load(path) {
        if (this.cache[path]) return this.cache[path];
        
        return new Promise((resolve) => {
            const audio = new Audio(path);
            audio.oncanplaythrough = () => {
                this.cache[path] = audio;
                resolve(audio);
            };
            audio.onerror = () => {
                console.warn(`⚠️ Не удалось загрузить звук: ${path}`);
                resolve(null);
            };
            audio.load();
        });
    }

    async play(path, volume = 1) {
        if (!this.enabled) return null;
        const audio = await this.load(path);
        if (audio) {
            audio.volume = volume;
            audio.currentTime = 0; // Начинаем с начала
                audio.play().catch(e => {
      console.log("🔇 Звук заблокирован браузером (нужен клик)");
      const retry = () => { // следующий клик = разблокировка этого звука
        document.removeEventListener('pointerdown', retry);
        audio.volume = volume;
        audio.play().catch(() => {});
      };
      document.addEventListener('pointerdown', retry, { capture: true });
    });
            return audio;
        }
        return null;
    }

    toggle(enabled) {
        this.enabled = enabled;
    }
}

// === 7. КЭШ ИЗОБРАЖЕНИЙ (ImageCache) ===
// Предзагружает картинки, чтобы они появлялись мгновенно
class ImageCache {
    constructor() {
        this.cache = {};
    }

    async load(path) {
        if (this.cache[path]) return this.cache[path];
        
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                this.cache[path] = img;
                resolve(img);
            };
            img.onerror = () => {
                console.warn(`⚠️ Не удалось загрузить картинку: ${path}`);
                resolve(null);
            };
            img.src = path;
        });
    }

    async get(path) {
        return await this.load(path);
    }
}

// === 8. ЭКСПОРТ В ГЛОБАЛЬНУЮ ОБЛАСТЬ ===
window.Utils = {
    random,
    randomChoice,
    shuffle,
    sleep,
    $,
    $$,
    clamp,
    Stat,
    SoundCache,
    ImageCache
};