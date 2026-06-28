/**
 * 🎰 C8L CASINO — Símbolos con Imágenes Generadas por IA
 * Cada símbolo usa una imagen de Pollinations AI
 */

const IMG_BASE = 'https://image.pollinations.ai/prompt/';
const IMG_PARAMS = '?width=256&height=256&nologo=true';

const SYMBOLS = {
    leon: {
        name: 'León Dorado',
        tier: 'premium',
        img: IMG_BASE + 'majestic%20golden%20lion%20head%20casino%20slot%20symbol%2C%20royal%20golden%20mane%2C%20fierce%20noble%2C%20dark%20background%2C%20game%20asset%2C%20centered%2C%20no%20text' + IMG_PARAMS + '&seed=200'
    },
    wild: {
        name: 'Wild',
        tier: 'special',
        img: IMG_BASE + 'burning%20heart%20with%20golden%20angel%20wings%2C%20wild%20casino%20slot%20symbol%2C%20red%20fire%2C%20gold%20wings%2C%20dark%20background%2C%20centered%2C%20no%20text' + IMG_PARAMS + '&seed=201'
    },
    scatter: {
        name: 'Scatter',
        tier: 'special',
        img: IMG_BASE + 'royal%20golden%20crown%20with%20gems%2C%20scatter%20casino%20slot%20symbol%2C%20diamonds%2C%20dark%20background%2C%20centered%2C%20no%20text' + IMG_PARAMS + '&seed=202'
    },
    bot: {
        name: 'Bot Azul',
        tier: 'high',
        img: IMG_BASE + 'cute%20blue%20robot%20chatbot%20mascot%2C%20casino%20slot%20symbol%2C%20futuristic%20blue%20with%20gold%20details%2C%20LED%20eyes%2C%20dark%20background%2C%20centered%2C%20no%20text' + IMG_PARAMS + '&seed=42'
    },
    villano: {
        name: 'León Villano',
        tier: 'high',
        img: IMG_BASE + 'evil%20dark%20lion%20villain%20head%2C%20red%20glowing%20eyes%2C%20dark%20red%20mane%2C%20menacing%2C%20casino%20slot%20symbol%2C%20dark%20background%2C%20centered%2C%20no%20text' + IMG_PARAMS + '&seed=303'
    },
    c8l: {
        name: 'C8L Casino',
        tier: 'high',
        img: IMG_BASE + 'luxury%20gold%20C8L%20casino%20logo%20on%20black%20shield%2C%20golden%20crown%2C%20baroque%20ornate%20frame%2C%20premium%20emblem%2C%20dark%20background%2C%20centered' + IMG_PARAMS + '&seed=204'
    },
    A: {
        name: 'As',
        tier: 'medium',
        img: IMG_BASE + 'letter%20A%20made%20of%20red%20ruby%20gemstone%2C%20casino%20slot%20symbol%2C%20ornate%20precious%20stone%2C%20glowing%2C%20dark%20background%2C%20centered%2C%20no%20other%20text' + IMG_PARAMS + '&seed=305'
    },
    K: {
        name: 'Rey',
        tier: 'medium',
        img: IMG_BASE + 'letter%20K%20made%20of%20blue%20sapphire%20gemstone%2C%20casino%20slot%20symbol%2C%20ornate%20precious%20stone%2C%20glowing%2C%20dark%20background%2C%20centered%2C%20no%20other%20text' + IMG_PARAMS + '&seed=306'
    },
    Q: {
        name: 'Reina',
        tier: 'low',
        img: IMG_BASE + 'letter%20Q%20made%20of%20purple%20amethyst%20gemstone%2C%20casino%20slot%20symbol%2C%20ornate%20precious%20stone%2C%20glowing%2C%20dark%20background%2C%20centered%2C%20no%20other%20text' + IMG_PARAMS + '&seed=307'
    },
    J: {
        name: 'Jota',
        tier: 'low',
        img: IMG_BASE + 'letter%20J%20made%20of%20green%20emerald%20gemstone%2C%20casino%20slot%20symbol%2C%20ornate%20precious%20stone%2C%20glowing%2C%20dark%20background%2C%20centered%2C%20no%20other%20text' + IMG_PARAMS + '&seed=308'
    },
    '10': {
        name: 'Diez',
        tier: 'low',
        img: IMG_BASE + 'number%2010%20made%20of%20golden%20topaz%20gemstone%2C%20casino%20slot%20symbol%2C%20ornate%20precious%20stone%2C%20glowing%2C%20dark%20background%2C%20centered%2C%20no%20other%20text' + IMG_PARAMS + '&seed=309'
    }
};

// Premios especiales
const PRIZES = {
    leo: {
        name: 'Premio Leo Vela',
        img: IMG_BASE + 'golden%20trophy%20award%20with%20lion%20on%20top%2C%20engraved%20LEO%20VELA%2C%20luxury%20casino%20VIP%20prize%2C%20gold%20and%20black%2C%20glowing%2C%20dark%20background%2C%20centered' + IMG_PARAMS + '&seed=400'
    },
    yusleny: {
        name: 'Premio Yusleny',
        img: IMG_BASE + 'elegant%20diamond%20crystal%20trophy%20award%2C%20engraved%20YUSLENY%2C%20feminine%20luxury%20casino%20prize%2C%20diamonds%20and%20gold%2C%20glowing%2C%20dark%20background%2C%20centered' + IMG_PARAMS + '&seed=401'
    },
    kukis: {
        name: 'Premio Kukis',
        img: IMG_BASE + 'rose%20gold%20trophy%20award%2C%20engraved%20KUKIS%2C%20chic%20feminine%20casino%20prize%2C%20pink%20gold%20diamonds%2C%20glowing%2C%20dark%20background%2C%20centered' + IMG_PARAMS + '&seed=402'
    }
};

/**
 * Genera HTML de un símbolo con imagen
 */
function getSymbolHTML(symbolId) {
    const sym = SYMBOLS[symbolId];
    if (!sym) return '<div class="symbol-inner">?</div>';
    return `<div class="symbol-inner"><img src="${sym.img}" alt="${sym.name}" loading="lazy"></div>`;
}

function getSymbolEmoji(symbolId) {
    return getSymbolHTML(symbolId);
}
