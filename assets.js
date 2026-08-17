// ============================================
// ASSETS.JS — Пути к ресурсам (ИСПРАВЛЕНО)
// ============================================

const ASSETS = {
    // === ИЗОБРАЖЕНИЯ ===
    images: {
        ui: {
            logo: 'img/ui/logo.png',
            bg: 'img/ui/bg.png'
        },
        portraits: {
            0: 'img/portraits/suspect_0.png',
            3: 'img/portraits/suspect_3.png',
            6: 'img/portraits/suspect_6.png',
            10: 'img/portraits/suspect_10.png',
            13: 'img/portraits/suspect_13.png',
            15: 'img/portraits/suspect_15.png'
        },
        roles: {
            sheriff: 'img/roles/sheriff.png',
            murderer: 'img/roles/murderer.png',
            civilian: 'img/roles/civilian.png',
            cop: 'img/roles/cop.png'
        },
        cells: {
            start: 'img/cells/start.png',
            coin: 'img/cells/coin.png',
            roof: 'img/cells/roof.png',
            tunnel: 'img/cells/tunnel.png',
            crime: 'img/cells/crime.png',
            stash: 'img/cells/stash.png',
            police: 'img/cells/police.png',
            shop: 'img/cells/shop.png',
            hospital: 'img/cells/hospital.png',
            psychologist: 'img/cells/psychologist.png',
            gym: 'img/cells/gym.png'
        },
        time: {
            morning: 'img/time/morning.png',
            day: 'img/time/day.png',
            evening: 'img/time/evening.png',
            night: 'img/time/night.png'
        },
        voice: {
            chaos: 'img/voice/chaos.png',
            target: 'img/voice/target.png',
            curse: 'img/voice/curse.png',
            bless: 'img/voice/bless.png',
            shuffle: 'img/voice/shuffle.png',
            steal: 'img/voice/steal.png'
        },
        tokens: {
            1: 'img/tokens/1.png',
            2: 'img/tokens/2.png',
            3: 'img/tokens/3.png',
            4: 'img/tokens/4.png',
            5: 'img/tokens/5.png',
            6: 'img/tokens/6.png'
        },
        weapons: {
            wooden_knife: 'img/skins/weapons/wooden_knife.png',
            stone_dagger: 'img/skins/weapons/stone_dagger.png',
            iron_blade: 'img/skins/weapons/iron_blade.png',
            blue_claw: 'img/skins/weapons/blue_claw.png',
            steel_fang: 'img/skins/weapons/steel_fang.png',
            crystal_shard: 'img/skins/weapons/crystal_shard.png',
            viper_fang: 'img/skins/weapons/viper_fang.png',
            shadow_cloak: 'img/skins/weapons/shadow_cloak.png',
            phantom_blade: 'img/skins/weapons/phantom_blade.png',
            blaze_knife: 'img/skins/weapons/blaze_knife.png',
            blaze_gun: 'img/skins/weapons/blaze_gun.png',
            blaze_shield: 'img/skins/weapons/blaze_shield.png',
            ice_wing: 'img/skins/weapons/ice_wing.png',
            fire_wing: 'img/skins/weapons/fire_wing.png',
            gold_wing: 'img/skins/weapons/gold_wing.png',
            elderwood_scythe: 'img/skins/weapons/elderwood_scythe.png',
            niks_scythe: 'img/skins/weapons/niks_scythe.png',
            corrupt: 'img/skins/weapons/corrupt.png',
            eternal_flame: 'img/skins/weapons/eternal_flame.png',
            chroma_light: 'img/skins/weapons/chroma_light.png',
            void_blade: 'img/skins/weapons/void_blade.png'
        },
        armor: {
            dirty_rag: 'img/skins/armor/dirty_rag.png',
            baseball_cap: 'img/skins/armor/baseball_cap.png',
            knitted_hat: 'img/skins/armor/knitted_hat.png',
            helmet: 'img/skins/armor/helmet.png',
            viking_helmet: 'img/skins/armor/viking_helmet.png',
            crown: 'img/skins/armor/crown.png',
            panama: 'img/skins/armor/panama.png',
            ushanka: 'img/skins/armor/ushanka.png',
            old_sneakers: 'img/skins/armor/old_sneakers.png',
            sneakers: 'img/skins/armor/sneakers.png',
            combat_boots: 'img/skins/armor/combat_boots.png'
        },
        accessories: {
            sunglasses: 'img/skins/accessories/sunglasses.png',
            watch: 'img/skins/accessories/watch.png',
            spyglass: 'img/skins/accessories/spyglass.png',
            rubber_duck: 'img/skins/accessories/rubber_duck.png',
            scarf: 'img/skins/accessories/scarf.png',
            backpack: 'img/skins/accessories/backpack.png'
        }
    },

    // === ЗВУКИ ===
    sounds: {
        music: [
            'snd/music/music_1.mp3', 'snd/music/music_2.mp3', 'snd/music/music_3.mp3',
            'snd/music/music_4.mp3', 'snd/music/music_5.mp3', 'snd/music/music_6.mp3'
        ],
        effects: {
            dice: 'snd/effects/dice.mp3', buy: 'snd/effects/buy.mp3', move: 'snd/effects/move.mp3',
            hover: 'snd/effects/hover.mp3', meet: 'snd/effects/meet.mp3', intro: 'snd/effects/intro.mp3',
            win: 'snd/effects/win.mp3', lose: 'snd/effects/lose.mp3', duel: 'snd/effects/duel.mp3'
        },
        cells: {
            start: 'snd/cells/start.mp3', coin: 'snd/cells/coin.mp3', roof: 'snd/cells/roof.mp3',
            tunnel: 'snd/cells/tunnel.mp3', crime: 'snd/cells/crime.mp3', stash: 'snd/cells/stash.mp3',
            police: 'snd/cells/police.mp3', shop: 'snd/cells/shop.mp3', hospital: 'snd/cells/hospital.mp3',
            psychologist: 'snd/cells/psychologist.mp3', gym: 'snd/cells/gym.mp3'
        },
        cards: {
            witness: 'snd/cards/witness.mp3', alibi: 'snd/cards/alibi.mp3', ulika: 'snd/cards/ulika.mp3',
            dopros: 'snd/cards/dopros.mp3', zasada: 'snd/cards/zasada.mp3', taj: 'snd/cards/taj.mp3'
        },
        moral: {
            1: 'snd/cards/mor_1.mp3', 2: 'snd/cards/mor_2.mp3', 3: 'snd/cards/mor_3.mp3',
            4: 'snd/cards/mor_4.mp3', 5: 'snd/cards/mor_5.mp3', 6: 'snd/cards/mor_6.mp3',
            7: 'snd/cards/mor_7.mp3', 8: 'snd/cards/mor_8.mp3', 9: 'snd/cards/mor_9.mp3',
            10: 'snd/cards/mor_10.mp3', 11: 'snd/cards/mor_11.mp3', 12: 'snd/cards/mor_12.mp3',
            13: 'snd/cards/mor_13.mp3', 14: 'snd/cards/mor_14.mp3', 15: 'snd/cards/mor_15.mp3',
            16: 'snd/cards/mor_16.mp3', 17: 'snd/cards/mor_17.mp3', 18: 'snd/cards/mor_18.mp3',
            19: 'snd/cards/mor_19.mp3', 20: 'snd/cards/mor_20.mp3'
        },
        voice: {
            appear: 'snd/voice/appear.mp3', chaos: 'snd/voice/chaos.mp3', curse: 'snd/voice/curse.mp3',
            bless: 'snd/voice/bless.mp3', steal: 'snd/voice/steal.mp3', shuffle: 'snd/voice/shuffle.mp3',
            target: 'snd/voice/target.mp3', disappear: 'snd/voice/disappear.mp3'
        },
        time: {
            morning: 'snd/time/morning.mp3', day: 'snd/time/day.mp3',
            evening: 'snd/time/evening.mp3', night: 'snd/time/night.mp3'
        },
        roles: {
            sheriff: 'snd/roles/sheriff.mp3', murderer: 'snd/roles/murderer.mp3',
            civilian: 'snd/roles/civilian.mp3', cop: 'snd/roles/cop.mp3'
        }
    }
};

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================
function getPortraitPath(suspectLevel) {
    if (suspectLevel >= 15) return ASSETS.images.portraits[15];
    if (suspectLevel >= 13) return ASSETS.images.portraits[13];
    if (suspectLevel >= 10) return ASSETS.images.portraits[10];
    if (suspectLevel >= 6) return ASSETS.images.portraits[6];
    if (suspectLevel >= 3) return ASSETS.images.portraits[3];
    return ASSETS.images.portraits[0];
}

function getCardSound(cardType, cardNumber) {
    if (cardNumber && ASSETS.sounds.cards[cardType + '_' + cardNumber]) {
        return ASSETS.sounds.cards[cardType + '_' + cardNumber];
    }
    return ASSETS.sounds.cards[cardType] || null;
}

function getMoralSound(id) { return ASSETS.sounds.moral[id] || null; }
function getTimeSound(time) { return ASSETS.sounds.time[time] || null; }
function getVoiceSound(type) { return ASSETS.sounds.voice[type] || null; }
function getCellSound(cellType) { return ASSETS.sounds.cells[cellType] || null; }

function getSkinImage(skinId, category) {
    if (category === 'weapon') return ASSETS.images.weapons[skinId] || null;
    if (category === 'armor') return ASSETS.images.armor[skinId] || null;
    if (category === 'accessory') return ASSETS.images.accessories[skinId] || null;
    return null;
}

// Экспорт
window.ASSETS = ASSETS;
window.getPortraitPath = getPortraitPath;
window.getCardSound = getCardSound;
window.getMoralSound = getMoralSound;
window.getTimeSound = getTimeSound;
window.getVoiceSound = getVoiceSound;
window.getCellSound = getCellSound;
window.getSkinImage = getSkinImage;