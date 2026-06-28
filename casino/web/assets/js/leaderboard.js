/**
 * 🏆 C8L CASINO — Leaderboard / Ranking
 */

class Leaderboard {
    constructor() {
        this.players = [
            { name: 'GoldenKing', score: 245780000, wins: 1243 },
            { name: 'DarkLion', score: 89450000, wins: 876 },
            { name: 'LuckyAce', score: 67230000, wins: 654 },
            { name: 'NightWolf', score: 54100000, wins: 543 },
            { name: 'DiamondHand', score: 43200000, wins: 432 },
            { name: 'C8LMaster', score: 38900000, wins: 398 },
            { name: 'RouletteKing', score: 34500000, wins: 367 },
            { name: 'SlotQueen', score: 29800000, wins: 312 },
            { name: 'BlackjackPro', score: 25600000, wins: 289 },
            { name: 'LeonDorado', score: 22100000, wins: 256 },
            { name: 'RoyalFlush', score: 19800000, wins: 234 },
            { name: 'SpinMaster', score: 17500000, wins: 212 },
            { name: 'GoldRush', score: 15200000, wins: 198 },
            { name: 'JackpotJoe', score: 13800000, wins: 176 },
            { name: 'WildCard', score: 11400000, wins: 154 },
        ];
    }

    init() {
        this._renderList();
        this._bindTabs();
    }

    _renderList() {
        const list = document.getElementById('leaderboardList');
        if (!list) return;

        list.innerHTML = '';
        for (let i = 3; i < this.players.length; i++) {
            const p = this.players[i];
            const row = document.createElement('div');
            row.className = 'lb-row';
            row.innerHTML = `
                <span class="lb-row-rank">#${i + 1}</span>
                <span class="lb-row-name">${p.name}</span>
                <span class="lb-row-score">${p.score.toLocaleString('es-ES')}</span>
            `;
            list.appendChild(row);
        }
    }

    _bindTabs() {
        document.querySelectorAll('.lb-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                sound.buttonClick();
                // Could filter by tab.dataset.tab
            });
        });
    }

    updatePlayerRank() {
        const score = window.casinoState.credits;
        const rank = this.players.filter(p => p.score > score).length + 1;
        const rankEl = document.getElementById('yourRank');
        const scoreEl = document.getElementById('yourScore');
        if (rankEl) rankEl.textContent = `#${rank}`;
        if (scoreEl) scoreEl.textContent = score.toLocaleString('es-ES');
    }
}

const leaderboard = new Leaderboard();
