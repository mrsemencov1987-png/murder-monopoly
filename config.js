// ============================================
// CONFIG.JS — Конфигурация и данные игры (ИСПРАВЛЕНО)
// ============================================

// === 1. РОЛИ ИГРОКОВ ===
const ROLES = {
    SHERIFF: 'sheriff',
    MURDERER: 'murderer',
    CIVILIAN: 'civilian',
    COP: 'cop'
};

const ROLE_LABELS = {
    sheriff: '🚔 ШЕРИФ',
    murderer: '🔪 УБИЙЦА',
    civilian: '😇 МИРНЫЙ',
    cop: '🦹 ПРОДАЖНЫЙ КОП'
};

const ROLE_BONUSES = {
    sheriff: 3,
    murderer: 2,
    cop: 1,
    civilian: 0
};

// === 2. ВРЕМЯ СУТОК ===
const TIME_OF_DAY = {
    MORNING: 'morning',
    DAY: 'day',
    EVENING: 'evening',
    NIGHT: 'night'
};

const TIME_LABELS = {
    morning: '🌅 Утро',
    day: '☀️ День',
    evening: '🌆 Вечер',
    night: '🌙 Ночь'
};

const TIME_ORDER = ['morning', 'day', 'evening', 'night'];

const TIME_BONUSES = {
    morning: {
        sheriff: { power: 1 },
        murderer: { power: 1 },
        civilian: { power: 1 },
        cop: { power: 1 }
    },
    day: {
        sheriff: { power: 2, reputation: 1 },
        murderer: { power: -2, suspect: 1 },
        civilian: { power: 1, fear: -1 },
        cop: { reputation: -1 }
    },
    evening: {
        sheriff: { power: -1 },
        murderer: { power: 1, stealth: 1 },
        civilian: { fear: -1 },
        cop: { power: 1 }
    },
    night: {
        sheriff: {},
        murderer: { power: 2, stealth: 1 },
        civilian: { power: -1, fear: 1 },
        cop: { power: 1 }
    }
};

// === 3. ХАРАКТЕРИСТИКИ ===
const STATS = {
    SUSPECT: { min: 0, max: 15, label: 'Подозрения', icon: '🚨' },
    FATIGUE: { min: 0, max: 5, label: 'Усталость', icon: '😫' },
    FEAR: { min: 0, max: 5, label: 'Страх', icon: '😨' },
    REPUTATION: { min: -5, max: 5, label: 'Репутация', icon: '⭐' },
    ADRENALINE: { min: 0, max: 3, label: 'Адреналин', icon: '⚡' },
    CONNECTIONS: { min: 0, max: 3, label: 'Связи', icon: '🤝' }
};

// === 4. СЕТЫ СНАРЯЖЕНИЯ ===
const SETS = {
    ASSASSIN: { id: 'assassin', name: '🗡️ Ассасин', requirements: { weapons: 3 }, bonus: { damage: 8 } },
    GUARDIAN: { id: 'guardian', name: '🛡️ Страж', requirements: { armor: 3 }, bonus: { defense: 8 } },
    BALANCE: { id: 'balance', name: '⚖️ Баланс', requirements: { weapons: 2, armor: 1 }, bonus: { damage: 5, defense: 5 } },
    PALADIN: { id: 'paladin', name: '🛡️ Паладин', requirements: { weapons: 1, armor: 2 }, bonus: { damage: 3, defense: 8 } },
    BERSERKER: { id: 'berserker', name: '💢 Берсерк', requirements: { weapons: 2, armor: 2 }, bonus: { damage: 10, defense: 3 } },
    MASQUERADE: { id: 'masquerade', name: '🎭 Маскарад', requirements: { accessories: 3 }, bonus: { reputation: 3 } },
    COLLECTOR: { id: 'collector', name: '🏆 Коллекционер', requirements: { accessories: 2, any: 1 }, bonus: { damage: 2, defense: 2, reputation: 2 } },
    NIGHT_HUNTER: { id: 'night_hunter', name: '🌙 Ночной охотник', requirements: { weapons: 2, accessories: 1 }, bonus: { damage: 5, stealth: 2 }, timeBonus: { night: { damage: 8, stealth: 3 } } },
    DAY_WARDEN: { id: 'day_warden', name: '☀️ Дневной страж', requirements: { armor: 2, weapons: 1 }, bonus: { defense: 5, reputation: 2 }, timeBonus: { day: { defense: 8, reputation: 4 } } }
};

// === 5. ГОЛОС УЛИЦ ===
const VOICE_TYPES = {
    CHAOS: 'chaos',
    TARGET: 'target',
    CURSE: 'curse',
    BLESS: 'bless',
    SHUFFLE: 'shuffle',
    STEAL: 'steal'
};

const VOICE_EFFECTS = {
    chaos: { label: '🎭 Хаос', probability: 25, description: 'Все игроки получают случайные эффекты' },
    target: { label: '🎯 Точечный удар', probability: 30, description: 'Один случайный игрок получает штраф' },
    curse: { label: '💀 Проклятие', probability: 15, description: 'Один игрок получает -2 ко всем характеристикам' },
    bless: { label: '✨ Благословение', probability: 10, description: 'Один игрок получает +2 ко всем характеристикам' },
    shuffle: { label: '🌀 Перемешивание', probability: 10, description: 'Игроки меняются местами на поле' },
    steal: { label: '💰 Ограбление', probability: 10, description: 'Все теряют 50 монет' }
};

// === 6. КЛЕТКИ ПОЛЯ ===
const CELL_TYPES = {
    START: 'start',
    COIN: 'coin',
    ROOF: 'roof',
    TUNNEL: 'tunnel',
    CRIME: 'crime',
    STASH: 'stash',
    POLICE: 'police',
    SHOP: 'shop',
    HOSPITAL: 'hospital',
    PSYCHOLOGIST: 'psychologist',
    GYM: 'gym',
    SKIN: 'skin'
};

// === 7. НАСТРОЙКИ ИГРЫ ===
const GAME_CONFIG = {
    boardSize: 32,
    gridSize: 9,
    defaultRounds: 15,
    startingCoins: 500,
    startingSuspect: 3,
    startingTokens: 3,
    maxSuspect: 15,
    duelThreshold: 10,
    finalThreshold: 15,
    timeChangeInterval: 4,
    voiceAppearInterval: { min: 2, max: 5 }
};

// === 8. СКИНЫ (ОРУЖИЕ, АМУНИЦИЯ, АКСЕССУАРЫ) ===
const WEAPONS = {
    wooden_knife: { id: 'wooden_knife', name: 'Отвратительный нож', category: 'weapon', damage: 1, price: 40, rarity: 'COMMON' },
    stone_dagger: { id: 'stone_dagger', name: 'Могильный пистолет', category: 'weapon', damage: 1, price: 50, rarity: 'COMMON' },
    iron_blade: { id: 'iron_blade', name: 'Iron Blade', category: 'weapon', damage: 1, price: 60, rarity: 'COMMON' },
    blue_claw: { id: 'blue_claw', name: 'Blue Claw', category: 'weapon', damage: 2, price: 80, rarity: 'UNCOMMON', timeBonus: { night: { damage: 1 } } },
    steel_fang: { id: 'steel_fang', name: 'Steel Fang', category: 'weapon', damage: 2, price: 90, rarity: 'UNCOMMON' },
    crystal_shard: { id: 'crystal_shard', name: 'Crystal Shard', category: 'weapon', damage: 2, price: 100, rarity: 'UNCOMMON', timeBonus: { day: { damage: 1 } } },
    viper_fang: { id: 'viper_fang', name: 'Viper Fang', category: 'weapon', damage: 3, price: 120, rarity: 'RARE', timeBonus: { night: { damage: 2 } } },
    shadow_cloak: { id: 'shadow_cloak', name: 'Shadow Cloak', category: 'weapon', damage: 3, price: 140, rarity: 'RARE', timeBonus: { night: { damage: 3, stealth: 1 } } },
    phantom_blade: { id: 'phantom_blade', name: 'Phantom Blade', category: 'weapon', damage: 3, price: 160, rarity: 'RARE' },
    blaze_knife: { id: 'blaze_knife', name: 'Blaze Knife', category: 'weapon', damage: 4, price: 180, rarity: 'LEGENDARY', timeBonus: { day: { damage: 2 } } },
    blaze_gun: { id: 'blaze_gun', name: 'Blaze Gun', category: 'weapon', damage: 4, price: 200, rarity: 'LEGENDARY' },
    blaze_shield: { id: 'blaze_shield', name: 'Blaze Shield', category: 'weapon', damage: 4, price: 220, rarity: 'LEGENDARY' },
    ice_wing: { id: 'ice_wing', name: 'Ice Wing', category: 'weapon', damage: 5, price: 200, rarity: 'GODLY', timeBonus: { night: { damage: 3 } } },
    fire_wing: { id: 'fire_wing', name: 'Fire Wing', category: 'weapon', damage: 5, price: 250, rarity: 'GODLY', timeBonus: { day: { damage: 3 } } },
    gold_wing: { id: 'gold_wing', name: 'Gold Wing', category: 'weapon', damage: 5, price: 300, rarity: 'GODLY' },
    elderwood_scythe: { id: 'elderwood_scythe', name: 'Elderwood Scythe', category: 'weapon', damage: 6, price: 350, rarity: 'ANCIENT' },
    niks_scythe: { id: 'niks_scythe', name: "Nik's Scythe", category: 'weapon', damage: 6, price: 400, rarity: 'ANCIENT' },
    corrupt: { id: 'corrupt', name: 'Corrupt', category: 'weapon', damage: 6, price: 450, rarity: 'ANCIENT' },
    eternal_flame: { id: 'eternal_flame', name: 'Eternal Flame', category: 'weapon', damage: 8, price: 500, rarity: 'UNIQUE' },
    chroma_light: { id: 'chroma_light', name: 'Chroma Light', category: 'weapon', damage: 8, price: 600, rarity: 'UNIQUE' },
    void_blade: { id: 'void_blade', name: 'Void Blade', category: 'weapon', damage: 8, price: 700, rarity: 'UNIQUE', timeBonus: { night: { damage: 5 } } }
};

const HEADGEAR = {
    dirty_rag: { id: 'dirty_rag', name: 'Грязный платок', category: 'armor', defense: 0, price: 10, rarity: 'COMMON', effects: { reputation: -1 } },
    baseball_cap: { id: 'baseball_cap', name: 'Бейсболка', category: 'armor', defense: 1, price: 30, rarity: 'COMMON', timeBonus: { day: { defense: 1 } } },
    knitted_hat: { id: 'knitted_hat', name: 'Вязаная шапка', category: 'armor', defense: 1, price: 25, rarity: 'COMMON', timeBonus: { night: { defense: 1 } } },
    helmet: { id: 'helmet', name: 'Каска', category: 'armor', defense: 2, price: 60, rarity: 'UNCOMMON' },
    viking_helmet: { id: 'viking_helmet', name: 'Шлем викинга', category: 'armor', defense: 3, price: 100, rarity: 'RARE', timeBonus: { night: { defense: 2 } } },
    crown: { id: 'crown', name: 'Коронка', category: 'armor', defense: 2, price: 80, rarity: 'UNCOMMON', effects: { reputation: 1 } },
    panama: { id: 'panama', name: 'Панамка', category: 'armor', defense: 1, price: 20, rarity: 'COMMON', timeBonus: { day: { defense: 2 } } },
    ushanka: { id: 'ushanka', name: 'Ушанка', category: 'armor', defense: 1, price: 35, rarity: 'COMMON', timeBonus: { night: { defense: 1 } } },
    cap_inscription: { id: 'cap_inscription', name: 'Кепка с надписью', category: 'armor', defense: 1, price: 30, rarity: 'COMMON' }
};

const FOOTWEAR = {
    old_sneakers: { id: 'old_sneakers', name: 'Старые кеды', category: 'armor', defense: 0, price: 5, rarity: 'COMMON' },
    river_boots: { id: 'river_boots', name: 'Речные ботинки', category: 'armor', defense: 1, price: 20, rarity: 'COMMON' },
    sneakers: { id: 'sneakers', name: 'Кроссовки', category: 'armor', defense: 1, price: 40, rarity: 'COMMON' },
    combat_boots: { id: 'combat_boots', name: 'Берцы', category: 'armor', defense: 2, price: 70, rarity: 'UNCOMMON' },
    cowboy_boots: { id: 'cowboy_boots', name: 'Сапоги', category: 'armor', defense: 2, price: 65, rarity: 'UNCOMMON' },
    bast_shoes: { id: 'bast_shoes', name: 'Лапти', category: 'armor', defense: 1, price: 15, rarity: 'COMMON' },
    dress_shoes: { id: 'dress_shoes', name: 'Туфли', category: 'armor', defense: 1, price: 50, rarity: 'COMMON' },
    uggs: { id: 'uggs', name: 'Угги', category: 'armor', defense: 2, price: 80, rarity: 'UNCOMMON' },
    flip_flops: { id: 'flip_flops', name: 'Сланцы', category: 'armor', defense: 0, price: 10, rarity: 'COMMON' }
};

const ACCESSORIES = {
    sunglasses: { id: 'sunglasses', name: 'Солнцезащитные очки', category: 'accessory', price: 40, rarity: 'UNCOMMON', effects: { reputation: 1 } },
    watch: { id: 'watch', name: 'Часы', category: 'accessory', price: 60, rarity: 'UNCOMMON', effects: { reputation: 1 } },
    spyglass: { id: 'spyglass', name: 'Подзорная труба', category: 'accessory', price: 70, rarity: 'RARE', effects: { investigation: 1 } },
    rubber_duck: { id: 'rubber_duck', name: 'Резиновая уточка', category: 'accessory', price: 20, rarity: 'COMMON', effects: { fear: -1 } },
    scarf: { id: 'scarf', name: 'Шарф', category: 'accessory', price: 35, rarity: 'COMMON', effects: { defense: 1 } },
    backpack: { id: 'backpack', name: 'Рюкзак', category: 'accessory', price: 50, rarity: 'UNCOMMON', effects: { coinsBonus: 1 } },
    cross: { id: 'cross', name: 'Крест', category: 'accessory', price: 45, rarity: 'UNCOMMON', effects: { reputation: 1 } },
    earring: { id: 'earring', name: 'Серьга', category: 'accessory', price: 30, rarity: 'COMMON', effects: { reputation: 1 } }
};

const SKINS = { ...WEAPONS, ...HEADGEAR, ...FOOTWEAR, ...ACCESSORIES };

// === 9. КОЛОДЫ КАРТ ===
const WITNESS_DECK = [
    ['Я видел, как кто-то выбегал из особняка!', 'L', 50],
    ['Мне показалось, что я слышал шаги на крыше', 'R', 30],
    ['Кто-то прятался за углом!', 'ANY', 20],
    ['Я заметил движение в окне', 'OPP', 40],
    ['Кто-то оставил следы на полу', 'MINC', 30],
    ['Я слышал крик!', 'LASTTURN', 50],
    ['Кто-то бежал по коридору', 'MAXS', 20],
    ['Я видел свет в подвале', 'NOS', 30],
    ['Кто-то стоял у входа', 'ANY', 40],
    ['Я заметил, что дверь была открыта', 'ROOF', 30],
    ['Кто-то шептался в углу', 'MINC', 20],
    ['Я видел, как кто-то прятал нож', 'BOUGHT', 50],
    ['Кто-то оставил записку', 'POL', 30],
    ['Я слышал, как кто-то звал на помощь', 'USEDCH', 40],
    ['Кто-то бродил по коридорам', 'MAXC', 20],
    ['Я заметил, что свет погас', 'NOS', 30],
    ['Кто-то спрятался под лестницей', 'LASTCH', 40],
    ['Я слышал шаги наверху', 'MAXS', 30],
    ['Кто-то пробежал мимо меня', 'START', 20],
    ['Я видел, как кто-то смотрел в окно', 'NOCH', 50]
];

const ALIBI_DECK = [
    ['Я был дома в это время', 1], ['Я гулял в парке', 1], ['Я был в магазине', 1],
    ['Я был с друзьями', 1], ['Я работал в это время', 1], ['Я спал', 2],
    ['Я был в школе', 1], ['Я был на тренировке', 1], ['Я гулял с собакой', 1],
    ['Я был в гостях', 1], ['Я смотрел фильм', 1], ['Я был в библиотеке', 1],
    ['Я играл в Roblox', 1], ['Я был в кафе', 1], ['Я читал книгу', 1],
    ['Я был в кино', 1], ['Я был у бабушки', 1], ['Я был в музее', 1],
    ['Я был на дне рождения', 1], ['Я был в спортзале', 1]
];

const ULIKA_DECK = [
    ['На месте преступления найден отпечаток пальца', 'L', 1, 50],
    ['Найден обрывок ткани', 'R', 1, 30],
    ['Найден след обуви', 'OPP', 1, 40],
    ['Найден волос', 'MINS', 1, 30],
    ['Найдена записка', 'MAXC', 1, 50],
    ['Найден окурок', 'NOCH', 1, 30],
    ['Найден нож', 'ROOF', 2, 50],
    ['Найден клочок бумаги с адресом', 'MAXS', 1, 40],
    ['Найден телефон', 'CRIME', 1, 30],
    ['Найдена пуговица', 'NOS', 1, 20],
    ['Найден кровавый след', 'MINC', 2, 50],
    ['Найдена маска', 'USEDCH', 1, 40],
    ['Найдена фотография', 'POL', 1, 30],
    ['Найден шарф', 'MAXC', 1, 20],
    ['Найдена пачка сигарет', 'NOCH', 1, 50],
    ['Найден ключ', 'MAXS', 1, 40],
    ['Найдена сумка', 'ROOF', 1, 30],
    ['Найдена расчёска', 'MINC', 1, 20],
    ['Найдена бутылка', 'CRIME', 1, 50],
    ['Найдена карта', 'NOS', 1, 60]
];

const DOPROS_DECK = [
    ['Где ты был в 22:00?', 'L', 1, 50],
    ['Ты знаешь убийцу?', 'R', 1, 40],
    ['Ты видел что-то подозрительное?', 'OPP', 1, 30],
    ['Почему ты был на крыше?', 'MINS', 1, 50],
    ['Ты слышал крик?', 'MAXC', 1, 30],
    ['Ты знаешь, где был убийца?', 'ANY', 2, 60],
    ['Ты видел оружие?', 'NOCH', 1, 20],
    ['Ты был один?', 'ROOF', 1, 40],
    ['Ты знал жертву?', 'MAXS', 1, 30],
    ['Почему ты убегал?', 'CRIME', 2, 50],
    ['Ты видел, как кто-то выходил?', 'MINC', 1, 20],
    ['Ты слышал шаги?', 'NOCH', 1, 30],
    ['Ты был на месте преступления?', 'POL', 2, 60],
    ['Ты знал о планах убийцы?', 'MAXC', 1, 40],
    ['Почему ты прятался?', 'NOS', 1, 30],
    ['Ты видел, как кто-то убегал?', 'START', 1, 20],
    ['Ты слышал выстрел?', 'MAXS', 1, 50],
    ['Ты был с кем-то?', 'NOCH', 1, 30],
    ['Ты видел, как кто-то входил?', 'ROOF', 1, 40],
    ['Почему ты здесь оказался?', 'MAXC', 1, 20]
];

const ZASADA_DECK = [
    ['Ты нападаешь на игрока слева!', 'L', 1, 100],
    ['Ты устраиваешь засаду!', 'R', 1, 100],
    ['Ты нападаешь из темноты!', 'OPP', 1, 100],
    ['Ты используешь нож!', 'ANY', 2, 150],
    ['Ты нападаешь на богатого!', 'MAXC', 1, 150],
    ['Ты нападаешь на слабого!', 'MINS', 1, 100],
    ['Ты атакуешь с крыши!', 'ANY', 2, 150],
    ['Ты нападаешь на невиновного!', 'ANY', 1, 100],
    ['Ты крадёшь монеты!', 'ANY', 1, 100],
    ['Ты нападаешь на игрока, который не использовал фишки!', 'NOCH', 1, 150],
    ['Ты атакуешь в темноте!', 'R', 1, 100],
    ['Ты нападаешь на игрока с наименьшим числом монет!', 'MINC', 1, 100],
    ['Ты устраиваешь ловушку!', 'ANY', 2, 150],
    ['Ты нападаешь на игрока с наибольшим числом скинов!', 'MAXS', 1, 100],
    ['Ты используешь скрытность!', 'SELF', 1, 100],
    ['Ты нападаешь на игрока, который недавно был на «Преступлении»!', 'CRIME', 1, 150],
    ['Ты атакуешь сзади!', 'L', 1, 100],
    ['Ты нападаешь на игрока, у которого меньше всего скинов!', 'MINS', 1, 100],
    ['Ты используешь хитрость!', 'SELF', 1, 150],
    ['Ты нападаешь на игрока, который не покупал скины!', 'NOS', 1, 100]
];

const TAJ_DECK = [
    ['Ты нашёл тайник с монетами!', { coins: 200 }],
    ['В тайнике лежали драгоценности!', { coins: 300 }],
    ['Старый тайник в стене!', { coins: 100, suspect: -1 }],
    ['Тайник с картой сокровищ!', { coins: 200, chips: ['ulika'] }],
    ['Тайник с сокровищами пиратов!', { coins: 400 }],
    ['В тайнике лежала карта!', { coins: 100 }],
    ['Тайник с амулетом!', { suspect: -2 }],
    ['Тайник с ключами от всех дверей!', { coins: 150 }],
    ['В тайнике было зелье удачи!', { double: 1 }],
    ['Тайник с маской невидимости!', { coins: 50, stealth: 1 }],
    ['Тайник с дневником!', { coins: 150, suspect: -1 }],
    ['Тайник с защитным амулетом!', { protect: 1 }],
    ['Тайник с лупой!', { coins: 50, chips: ['dopros'] }],
    ['Тайник с компасом!', { coins: 100 }],
    ['Тайник с волшебным зельем!', { coins: 50 }],
    ['Тайник с кристаллом!', { coins: 200, clearSuspect: 1 }],
    ['Тайник с секретными документами!', { coins: 100 }],
    ['Тайник с талисманом!', { coins: 50 }],
    ['Тайник с несметными сокровищами!', { coins: 500, suspect: -1 }],
    ['Тайник с часами!', { suspect: -1, coins: 100 }]
];

const MORAL_DECK = [
    { id: 1, name: 'Совесть', icon: '😇', effect: '−2 подозрения', fx: 'conscience', desc: 'Я слышу их голоса… Они не дают мне спать.' },
    { id: 2, name: 'Искупление', icon: '🕊️', effect: 'Стать Мирным', fx: 'redeem', desc: 'Я устал прятаться… Пора заканчивать.' },
    { id: 3, name: 'Жажда власти', icon: '👑', effect: 'Стать Убийцей (10+)', fx: 'power', desc: 'Кто-то должен взять контроль. Почему не я?' },
    { id: 4, name: 'Правда', icon: '⚖️', effect: 'Стать Шерифом (5+)', fx: 'truth', desc: 'Я знаю, кто убийца. Я помогу вам его найти.' },
    { id: 5, name: 'Коррупция', icon: '💰', effect: 'Стать Продажным копом', fx: 'corrupt', desc: 'У каждого есть цена. Даже у самого честного копа.' },
    { id: 6, name: 'Усталость', icon: '😮‍💨', effect: '+2 усталости', fx: 'fatigue', desc: 'Эта война сломала меня. Я снимаю звезду.' },
    { id: 7, name: 'Сомнение', icon: '🤔', effect: 'Стать Мирным', fx: 'doubt', desc: 'Я просто хочу быть самим собой. Без этих игр.' },
    { id: 8, name: 'Месть', icon: '⚔️', effect: '+3 подозрения обидчику', fx: 'revenge', desc: 'Я запомнил каждого, кто на меня напал.' },
    { id: 9, name: 'Ложь', icon: '🤥', effect: 'Защита от Допроса', fx: 'lie', desc: 'Я скажу то, что они хотят услышать.' },
    { id: 10, name: 'Молчание', icon: '🤐', effect: 'Блокировка Допроса', fx: 'silence', desc: 'Я ничего не скажу. Пусть доказывают.' },
    { id: 11, name: 'Признание', icon: '🙏', effect: 'Сдаться (победа детективов)', fx: 'confess', desc: 'Это был я. Но теперь я хочу, чтобы всё закончилось.' },
    { id: 12, name: 'Заступничество', icon: '🛡️', effect: 'Защита от обвинений', fx: 'intercede', desc: 'Я знаю этого человека. Я ручаюсь за него.' },
    { id: 13, name: 'Манипуляция', icon: '🎭', effect: 'Передать 2 подозрения', fx: 'manip', desc: 'Тени шепчут, как переложить вину.' },
    { id: 14, name: 'Паранойя', icon: '👁️', effect: 'Узнать роль', fx: 'paranoia', desc: 'Ты не тот, за кого себя выдаёшь.' },
    { id: 15, name: 'Недоверие', icon: '🚫', effect: 'Заблокировать голос', fx: 'distrust', desc: 'Я не верю никому. Особенно тебе.' },
    { id: 16, name: 'Прощение', icon: '💗', effect: 'Снять 3 подозрения', fx: 'forgive', desc: 'Иногда зло совершают от отчаяния.' },
    { id: 17, name: 'Жертва', icon: '💀', effect: 'Снять 5 подозрений (отдать монеты)', fx: 'victim', desc: 'Возьмите всё. Только дайте мне шанс начать сначала.' },
    { id: 18, name: 'Интуиция', icon: '🔮', effect: 'Проверить Алиби', fx: 'intuition', desc: 'У него есть алиби… или нет?' },
    { id: 19, name: 'Хаос', icon: '🌀', effect: 'Случайные подозрения у всех', fx: 'chaos', desc: 'Пусть всё смешается! Никто не уйдёт чистым!' },
    { id: 20, name: 'Шанс', icon: '🎲', effect: 'Удача или +2 подозрения', fx: 'chance', desc: 'Иногда судьба решает за нас.' }
];

const SHOP_DECK = [
    ['Batwing', 350, { chips: ['dopros'], protect: 1 }],
    ['Elderwood Scythe', 300, { chips: ['ulika', 'ulika'], suspect: -1 }],
    ['Frostbite', 250, { chips: ['ulika', 'witness'] }],
    ['Candy', 280, { chips: ['ulika', 'ulika', 'dopros'] }],
    ['Sugar', 260, { chips: ['dopros', 'witness'] }],
    ['Ice Dragon', 320, { chips: ['ulika', 'ulika'], protect: 1 }],
    ['Hallowscythe', 340, { chips: ['ulika', 'ulika'], suspect: -1 }],
    ['Logchopper', 300, { chips: ['ulika', 'dopros'] }],
    ['Swirlyblade', 220, { chips: ['dopros'] }],
    ['Swirlygun', 230, { chips: ['ulika', 'witness'] }],
    ['Makeshift', 280, { chips: ['ulika', 'ulika', 'dopros'] }],
    ['Laser', 240, { chips: ['ulika'] }],
    ['Blaster', 260, { chips: ['ulika', 'ulika'], suspect: -1 }],
    ['Ginger Luger', 250, { chips: ['dopros', 'witness'] }],
    ['Plasmabeam', 300, { chips: ['ulika', 'ulika', 'dopros'] }],
    ['Nightblade', 230, { chips: ['ulika'], suspect: -1 }],
    ['Gemstone', 280, { chips: ['ulika', 'ulika', 'witness'] }],
    ['Heat', 240, { chips: ['dopros'] }],
    ['Fang', 220, { chips: ['ulika', 'witness'] }],
    ['Seer', 200, { chips: ['ulika'], suspect: -1 }],
    ['Pixel', 230, { chips: ['dopros'] }],
    ['Tides', 250, { chips: ['ulika', 'ulika'], suspect: -1 }],
    ['Luger', 230, { chips: ['ulika', 'witness'] }],
    ['Slasher', 240, { chips: ['dopros'] }],
    ['Chill', 260, { chips: ['ulika', 'ulika'], suspect: -1 }],
    ['Clockwork', 240, { chips: ['ulika', 'witness'] }],
    ['Spider', 300, { chips: ['dopros'], protect: 1 }],
    ["Vampire's Edge", 290, { chips: ['ulika', 'ulika', 'dopros'] }],
    ['Candleflame', 310, { chips: ['ulika'], suspect: -1 }],
    ['Eternal III', 280, { chips: ['ulika', 'ulika', 'witness'] }]
];

// === ЭКСПОРТ ===
window.SKINS = SKINS;
window.WEAPONS = WEAPONS;
window.HEADGEAR = HEADGEAR;
window.FOOTWEAR = FOOTWEAR;
window.ACCESSORIES = ACCESSORIES;
window.WITNESS_DECK = WITNESS_DECK;
window.ALIBI_DECK = ALIBI_DECK;
window.ULIKA_DECK = ULIKA_DECK;
window.DOPROS_DECK = DOPROS_DECK;
window.ZASADA_DECK = ZASADA_DECK;
window.TAJ_DECK = TAJ_DECK;
window.MORAL_DECK = MORAL_DECK;
window.SHOP_DECK = SHOP_DECK;
window.ROLES = ROLES;
window.ROLE_LABELS = ROLE_LABELS;
window.ROLE_BONUSES = ROLE_BONUSES;
window.TIME_OF_DAY = TIME_OF_DAY;
window.TIME_LABELS = TIME_LABELS;
window.TIME_ORDER = TIME_ORDER;
window.TIME_BONUSES = TIME_BONUSES;
window.STATS = STATS;
window.SETS = SETS;
window.VOICE_TYPES = VOICE_TYPES;
window.VOICE_EFFECTS = VOICE_EFFECTS;
window.CELL_TYPES = CELL_TYPES;
window.GAME_CONFIG = GAME_CONFIG;