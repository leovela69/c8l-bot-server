/**
 * 🎰 C8L CASINO — Definición de Símbolos
 * Mapeo visual de símbolos del motor a representación en pantalla
 */

const SYMBOLS = {
    leon: {
        emoji: '🦁',
        name: 'León Dorado',
        color: '#d4a017',
        tier: 'premium',
        cssClass: 'symbol-leon'
    },
    wild: {
        emoji: '❤️‍🔥',
        name: 'Wild',
        color: '#e74c3c',
        tier: 'special',
        cssClass: 'symbol-wild',
        label: 'WILD'
    },
    scatter: {
        emoji: '👑',
        name: 'Scatter',
        color: '#9b59b6',
        tier: 'special',
        cssClass: 'symbol-scatter',
        label: 'SCATTER'
    },
    A: {
        emoji: '🅰️',
        name: 'As',
        color: '#c0392b',
        tier: 'high',
        cssClass: 'symbol-ace'
    },
    K: {
        emoji: '👑',
        name: 'Rey',
        color: '#2980b9',
        tier: 'medium',
        cssClass: 'symbol-king',
        label: 'K'
    },
    Q: {
        emoji: '👸',
        name: 'Reina',
        color: '#8e44ad',
        tier: 'medium',
        cssClass: 'symbol-queen',
        label: 'Q'
    },
    J: {
        emoji: '🃏',
        name: 'Jota',
        color: '#2c3e50',
        tier: 'low',
        cssClass: 'symbol-jack',
        label: 'J'
    },
    '10': {
        emoji: '🔟',
        name: 'Diez',
        color: '#16a085',
        tier: 'low',
        cssClass: 'symbol-ten',
        label: '10'
    }
};

// Tabla de pagos visual
const PAYTABLE_DISPLAY = {
    leon: { 5: 500, 4: 100, 3: 25 },
    wild: { 5: 1000, 4: 200, 3: 50 },
    A: { 5: 50, 4: 15, 3: 5 },
    K: { 5: 40, 4: 12, 3: 4 },
    Q: { 5: 30, 4: 10, 3: 3 },
    J: { 5: 20, 4: 8, 3: 2 },
    '10': { 5: 15, 4: 5, 3: 2 },
    scatter: { 5: 100, 4: 20, 3: 5 }
};

/**
 * Renderiza un símbolo en HTML
 */
function renderSymbol(symbolId) {
    const sym = SYMBOLS[symbolId];
    if (!sym) return '❓';
    
    let html = `<div class="symbol-inner ${sym.cssClass}" style="--sym-color: ${sym.color}">`;
    html += `<span class="symbol-emoji">${sym.emoji}</span>`;
    
    if (sym.label) {
        html += `<span class="symbol-label">${sym.label}</span>`;
    }
    
    html += '</div>';
    return html;
}

/**
 * Obtiene el emoji simple de un símbolo
 */
function getSymbolEmoji(symbolId) {
    const sym = SYMBOLS[symbolId];
    return sym ? sym.emoji : '❓';
}

/**
 * Verifica si un símbolo es especial
 */
function isSpecialSymbol(symbolId) {
    return symbolId === 'wild' || symbolId === 'scatter';
}
