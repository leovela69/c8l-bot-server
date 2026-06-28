/**
 * 🎰 C8L CASINO — Custom SVG Symbols
 * Símbolos diseñados estilo C8L brand (león dorado, corazón, corona)
 */

const SYMBOLS = {
    leon: {
        name: 'León Dorado',
        color: '#d4a017',
        tier: 'premium',
        svg: `<svg viewBox="0 0 60 60"><circle cx="30" cy="28" r="18" fill="#b8860b"/><circle cx="30" cy="28" r="14" fill="#daa520"/><circle cx="30" cy="30" r="11" fill="#f5d061"/><circle cx="25" cy="27" r="2.5" fill="#1a1a1a"/><circle cx="35" cy="27" r="2.5" fill="#1a1a1a"/><ellipse cx="30" cy="33" rx="2" ry="1.5" fill="#8b4513"/><path d="M 25 36 Q 30 41 35 36" fill="#c0392b"/><path d="M 27 36 L 28 38 L 29 36" fill="#fff"/><path d="M 31 36 L 32 38 L 33 36" fill="#fff"/><text x="30" y="54" text-anchor="middle" font-family="Orbitron" font-size="7" font-weight="900" fill="#d4a017">C8L</text></svg>`
    },
    wild: {
        name: 'Wild',
        color: '#e74c3c',
        tier: 'special',
        svg: `<svg viewBox="0 0 60 60"><defs><linearGradient id="wg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ff6b6b"/><stop offset="100%" stop-color="#c0392b"/></linearGradient></defs><path d="M30 12 C30 12 18 20 18 30 C18 37 23 42 30 42 C37 42 42 37 42 30 C42 20 30 12 30 12Z" fill="url(#wg)"/><path d="M20 25 C15 20 8 22 8 28 C8 30 10 30 14 28 L20 25Z" fill="#d4a017"/><path d="M40 25 C45 20 52 22 52 28 C52 30 50 30 46 28 L40 25Z" fill="#d4a017"/><text x="30" y="35" text-anchor="middle" font-family="Orbitron" font-size="8" font-weight="900" fill="#fff">WILD</text></svg>`
    },
    scatter: {
        name: 'Scatter',
        color: '#9b59b6',
        tier: 'special',
        svg: `<svg viewBox="0 0 60 60"><defs><linearGradient id="sg" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#f5d061"/><stop offset="100%" stop-color="#8b6914"/></linearGradient></defs><path d="M30 8 L34 18 L45 18 L36 25 L39 35 L30 29 L21 35 L24 25 L15 18 L26 18 Z" fill="url(#sg)" stroke="#d4a017" stroke-width="1"/><circle cx="30" cy="23" r="6" fill="#d4a017"/><circle cx="30" cy="23" r="4" fill="#f5d061"/><text x="30" y="50" text-anchor="middle" font-family="Orbitron" font-size="6" font-weight="900" fill="#9b59b6">SCATTER</text></svg>`
    },
    A: {
        name: 'As',
        color: '#c0392b',
        tier: 'high',
        svg: `<svg viewBox="0 0 60 60"><rect x="10" y="8" width="40" height="44" rx="6" fill="#1a1200" stroke="#d4a017" stroke-width="2"/><text x="30" y="40" text-anchor="middle" font-family="Cinzel Decorative" font-size="28" font-weight="900" fill="#c0392b">A</text></svg>`
    },
    K: {
        name: 'Rey',
        color: '#2980b9',
        tier: 'medium',
        svg: `<svg viewBox="0 0 60 60"><rect x="10" y="8" width="40" height="44" rx="6" fill="#1a1200" stroke="#d4a017" stroke-width="2"/><text x="30" y="40" text-anchor="middle" font-family="Cinzel Decorative" font-size="28" font-weight="900" fill="#2980b9">K</text></svg>`
    },
    Q: {
        name: 'Reina',
        color: '#8e44ad',
        tier: 'medium',
        svg: `<svg viewBox="0 0 60 60"><rect x="10" y="8" width="40" height="44" rx="6" fill="#1a1200" stroke="#d4a017" stroke-width="2"/><text x="30" y="40" text-anchor="middle" font-family="Cinzel Decorative" font-size="28" font-weight="900" fill="#8e44ad">Q</text></svg>`
    },
    J: {
        name: 'Jota',
        color: '#27ae60',
        tier: 'low',
        svg: `<svg viewBox="0 0 60 60"><rect x="10" y="8" width="40" height="44" rx="6" fill="#1a1200" stroke="#8b6914" stroke-width="2"/><text x="30" y="40" text-anchor="middle" font-family="Cinzel Decorative" font-size="28" font-weight="900" fill="#27ae60">J</text></svg>`
    },
    '10': {
        name: 'Diez',
        color: '#16a085',
        tier: 'low',
        svg: `<svg viewBox="0 0 60 60"><rect x="10" y="8" width="40" height="44" rx="6" fill="#1a1200" stroke="#8b6914" stroke-width="2"/><text x="30" y="38" text-anchor="middle" font-family="Cinzel Decorative" font-size="22" font-weight="900" fill="#16a085">10</text></svg>`
    }
};

function getSymbolHTML(symbolId) {
    const sym = SYMBOLS[symbolId];
    if (!sym) return '<span>?</span>';
    return `<div class="symbol-inner" style="--sym-color:${sym.color}">${sym.svg}</div>`;
}

function getSymbolEmoji(symbolId) {
    return getSymbolHTML(symbolId);
}
