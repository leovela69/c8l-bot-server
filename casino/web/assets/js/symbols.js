/**
 * 🎰 C8L CASINO — Símbolos extraídos del mockup original
 * Imágenes recortadas directamente del diseño de Leo
 */

const SYMBOLS = {
    leon:    { name: 'León Dorado', tier: 'premium', img: 'assets/img/symbols/leon.jpg' },
    wild:    { name: 'Wild', tier: 'special', img: 'assets/img/symbols/wild.jpg' },
    scatter: { name: 'Scatter', tier: 'special', img: 'assets/img/symbols/scatter.jpg' },
    A:       { name: 'As', tier: 'medium', img: 'assets/img/symbols/letter_a.jpg' },
    K:       { name: 'Rey', tier: 'medium', img: 'assets/img/symbols/letter_k.jpg' },
    Q:       { name: 'Reina', tier: 'low', img: 'assets/img/symbols/letter_q.jpg' },
    J:       { name: 'Jota', tier: 'low', img: 'assets/img/symbols/letter_j.jpg' },
    '10':    { name: 'Diez', tier: 'low', img: 'assets/img/symbols/letter_10.jpg' }
};

function getSymbolHTML(symbolId) {
    const sym = SYMBOLS[symbolId];
    if (!sym) return '<div class="symbol-inner">?</div>';
    return `<div class="symbol-inner"><img src="${sym.img}" alt="${sym.name}"></div>`;
}

function getSymbolEmoji(symbolId) {
    return getSymbolHTML(symbolId);
}
