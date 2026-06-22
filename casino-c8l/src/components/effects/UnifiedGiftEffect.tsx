'use client';
import { GiftEffect3D } from './GiftEffect3D';
import { SeatGiftEffect } from './seat/SeatGiftEffect';
import { RoomGiftEffect } from './room/RoomGiftEffect';
import { CoverGiftEffect } from './cover/CoverGiftEffect';
import { LiveGiftEffect } from './live/LiveGiftEffect';

export function UnifiedGiftEffect({ gift, fromUser, toUser, target, targetTitle, onComplete }) {
  switch (target) {
    case 'seat':
      return <SeatGiftEffect gift={gift} fromUser={fromUser} toUser={toUser} onComplete={onComplete} />;
    case 'room':
      return <RoomGiftEffect gift={gift} fromUser={fromUser} toUser={toUser} onComplete={onComplete} />;
    case 'cover':
      return <CoverGiftEffect gift={gift} fromUser={fromUser} toUser={toUser} coverTitle={targetTitle} onComplete={onComplete} />;
    case 'live':
      return <LiveGiftEffect gift={gift} fromUser={fromUser} toUser={toUser} liveTitle={targetTitle} onComplete={onComplete} />;
    default:
      return <GiftEffect3D gift={gift} fromUser={fromUser} toUser={toUser} onComplete={onComplete} />;
  }
}
