/**
 * 🎰 C8L CASINO — Símbolos Premium Estilo Casino AAA
 * Imágenes generadas por IA, estilo realista premium (Book of Ra / Mega Moolah)
 * Cargadas directamente desde Pollinations AI en el browser del usuario
 */

const P = 'https://image.pollinations.ai/prompt/';
const S = '?width=200&height=200&nologo=true&seed=';

const SYMBOLS = {
    leon: {
        name: 'León Dorado',
        tier: 'premium',
        img: P + 'photorealistic%20majestic%20golden%20lion%20head%2C%20detailed%20fur%20mane%2C%20intense%20golden%20eyes%2C%20premium%20casino%20slot%20game%20symbol%2C%20ornate%20gold%20frame%20border%2C%20dark%20background%2C%20AAA%20game%20quality%2C%20centered%2C%20no%20text' + S + '700'
    },
    wild: {
        name: 'Wild',
        tier: 'special',
        img: P + 'ornate%20red%20heart%20with%20golden%20wings%20and%20crown%2C%20WILD%20text%20on%20gold%20banner%2C%20premium%20casino%20slot%20symbol%2C%20detailed%20metallic%20gold%20ornaments%2C%20fire%20effect%2C%20dark%20background%2C%20AAA%20game%20quality%2C%20centered' + S + '701'
    },
    scatter: {
        name: 'Scatter',
        tier: 'special',
        img: P + 'photorealistic%20golden%20lion%20head%20wearing%20royal%20crown%2C%20SCATTER%20text%20on%20gold%20banner%2C%20premium%20casino%20slot%20symbol%2C%20ornate%20gold%20frame%2C%20jewels%2C%20dark%20background%2C%20AAA%20game%20quality%2C%20centered' + S + '702'
    },
    bot: {
        name: 'Bot C8L',
        tier: 'high',
        img: P + 'futuristic%20blue%20robot%20head%20avatar%2C%20glowing%20blue%20LED%20eyes%2C%20metallic%20blue%20and%20gold%20details%2C%20premium%20casino%20slot%20symbol%2C%20ornate%20gold%20frame%20border%2C%20dark%20background%2C%20AAA%20game%20quality%2C%20centered%2C%20no%20text' + S + '703'
    },
    villano: {
        name: 'León Villano',
        tier: 'high',
        img: P + 'photorealistic%20evil%20dark%20lion%20head%2C%20red%20glowing%20eyes%2C%20dark%20black%20mane%20with%20red%20highlights%2C%20menacing%20expression%2C%20premium%20casino%20slot%20symbol%2C%20ornate%20dark%20frame%2C%20dark%20background%2C%20AAA%20game%20quality%2C%20centered%2C%20no%20text' + S + '704'
    },
    c8l: {
        name: 'C8L Casino',
        tier: 'high',
        img: P + 'luxury%20gold%20C8L%20text%20logo%20emblem%2C%20ornate%20baroque%20gold%20metal%20shield%2C%20golden%20crown%20on%20top%2C%20premium%20casino%20brand%20symbol%2C%20shiny%20metallic%20gold%2C%20dark%20background%2C%20AAA%20game%20quality%2C%20centered' + S + '705'
    },
    A: {
        name: 'As',
        tier: 'medium',
        img: P + 'letter%20A%20in%203D%20metallic%20red%20ruby%20style%2C%20gold%20ornate%20border%20frame%2C%20premium%20casino%20slot%20symbol%2C%20gemstone%20texture%2C%20glowing%2C%20dark%20background%2C%20AAA%20game%20quality%2C%20centered%2C%20single%20letter%20only' + S + '706'
    },
    K: {
        name: 'Rey',
        tier: 'medium',
        img: P + 'letter%20K%20in%203D%20metallic%20blue%20sapphire%20style%2C%20gold%20ornate%20border%20frame%2C%20premium%20casino%20slot%20symbol%2C%20gemstone%20texture%2C%20glowing%2C%20dark%20background%2C%20AAA%20game%20quality%2C%20centered%2C%20single%20letter%20only' + S + '707'
    },
    Q: {
        name: 'Reina',
        tier: 'low',
        img: P + 'letter%20Q%20in%203D%20metallic%20purple%20amethyst%20style%2C%20gold%20ornate%20border%20frame%2C%20premium%20casino%20slot%20symbol%2C%20gemstone%20texture%2C%20glowing%2C%20dark%20background%2C%20AAA%20game%20quality%2C%20centered%2C%20single%20letter%20only' + S + '708'
    },
    J: {
        name: 'Jota',
        tier: 'low',
        img: P + 'letter%20J%20in%203D%20metallic%20green%20emerald%20style%2C%20gold%20ornate%20border%20frame%2C%20premium%20casino%20slot%20symbol%2C%20gemstone%20texture%2C%20glowing%2C%20dark%20background%2C%20AAA%20game%20quality%2C%20centered%2C%20single%20letter%20only' + S + '709'
    },
    '10': {
        name: 'Diez',
        tier: 'low',
        img: P + 'number%2010%20in%203D%20metallic%20gold%20topaz%20style%2C%20gold%20ornate%20border%20frame%2C%20premium%20casino%20slot%20symbol%2C%20gemstone%20texture%2C%20glowing%2C%20dark%20background%2C%20AAA%20game%20quality%2C%20centered%2C%20number%20only' + S + '710'
    }
};

// Premios
const PRIZES = {
    leo: { name: 'Premio Leo Vela', img: P + 'golden%20trophy%20with%20lion%20statue%20on%20top%2C%20LEO%20VELA%20engraved%20on%20base%2C%20luxury%20casino%20VIP%20award%2C%20gold%20and%20black%2C%20ornate%2C%20dark%20background' + S + '800' },
    yusleny: { name: 'Premio Yusleny', img: P + 'crystal%20diamond%20trophy%2C%20YUSLENY%20engraved%2C%20elegant%20feminine%20casino%20award%2C%20diamonds%20gold%2C%20luxury%2C%20dark%20background' + S + '801' },
    kukis: { name: 'Premio Kukis', img: P + 'rose%20gold%20trophy%2C%20KUKIS%20engraved%2C%20chic%20feminine%20casino%20award%2C%20pink%20gold%20diamonds%2C%20luxury%2C%20dark%20background' + S + '802' }
};

function getSymbolHTML(symbolId) {
    const sym = SYMBOLS[symbolId];
    if (!sym) return '<div class="symbol-inner">?</div>';
    return `<div class="symbol-inner"><img src="${sym.img}" alt="${sym.name}" loading="eager"></div>`;
}

function getSymbolEmoji(symbolId) {
    return getSymbolHTML(symbolId);
}
