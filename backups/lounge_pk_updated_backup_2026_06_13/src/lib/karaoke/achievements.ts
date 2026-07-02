interface KaraokeStats {
  totalCovers: number;
  bestPitch: number;
  bestScore: number;
  weeklyRank: number;
}

export const VOCAL_ACHIEVEMENTS = [
  {
    id: 'first_cover',
    name: '🎤 PRIMER COVER',
    description: 'Sube tu primer cover',
    rewardCoins: 25,
    condition: (stats: KaraokeStats) => stats.totalCovers >= 1
  },
  {
    id: 'pitch_perfect',
    name: '🎯 AFINACIÓN PERFECTA',
    description: 'Consigue 95% o más en afinación',
    rewardCoins: 100,
    condition: (stats: KaraokeStats) => stats.bestPitch >= 95
  },
  {
    id: 'golden_voice',
    name: '🏆 VOZ DE ORO',
    description: 'Alcanza 90+ puntos en un cover',
    rewardCoins: 500,
    condition: (stats: KaraokeStats) => stats.bestScore >= 90
  },
  {
    id: 'cover_master',
    name: '👑 REY DE COVERS',
    description: 'Sube 10 covers',
    rewardCoins: 1000,
    condition: (stats: KaraokeStats) => stats.totalCovers >= 10
  },
  {
    id: 'top_3_weekly',
    name: '⭐ TOP 3 SEMANAL',
    description: 'Entra al top 3 del ranking semanal',
    rewardCoins: 250,
    condition: (stats: KaraokeStats) => stats.weeklyRank <= 3
  }
];