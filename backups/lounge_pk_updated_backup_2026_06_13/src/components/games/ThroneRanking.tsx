// components/games/ThroneRanking.tsx
export function ThroneRanking({ weeklyDonors }: { weeklyDonors: { name: string; points: number }[] }) {
  const top3 = weeklyDonors.slice(0, 3);
  
  return (
    <div className="border-4 border-[#D4AF37] bg-black p-4 text-center">
      <h3 className="text-lg font-black text-[#D4AF37] mb-3">👑 TRONO C8L (SEMANAL)</h3>
      
      <div className="grid grid-cols-3 gap-2">
        {top3.map((donor, i) => (
          <div key={i} className={`p-2 ${i === 0 ? 'bg-[#D4AF37]/20 border-2 border-[#D4AF37]' : ''}`}>
            <div className="text-2xl">{i === 0 ? '👑' : i === 1 ? '🥈' : '🥉'}</div>
            <div className="font-bold text-sm">{donor.name}</div>
            <div className="text-xs text-[#D4AF37]">{donor.points} pts</div>
          </div>
        ))}
      </div>
    </div>
  );
}