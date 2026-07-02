// components/games/RaidNotification.tsx
import { motion, AnimatePresence } from 'framer-motion';

interface RaidNotificationProps {
  notifications: { id: number; userName: string; gift: string; damage: number }[];
  onClear: (id: number) => void;
}

export function RaidNotification({ notifications, onClear }: RaidNotificationProps) {
  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 pointer-events-none">
      <AnimatePresence>
        {notifications.map((notif) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.3 }}
            className="bg-black/90 border-l-4 border-[#D4AF37] p-3 rounded shadow-lg pointer-events-auto"
            onAnimationComplete={() => setTimeout(() => onClear(notif.id), 3000)}
          >
            <div className="flex items-center gap-3">
              <div className="text-2xl">{notif.gift.includes('🌹') ? '🌹' : notif.gift.includes('⚡') ? '⚡' : '🎵'}</div>
              <div>
                <div className="text-sm font-bold text-white">
                  {notif.userName} atacó con {notif.gift}
                </div>
                <div className="text-xs text-[#D4AF37] font-mono">
                  🔥 {notif.damage} de daño
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}