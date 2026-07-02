// lib/gifts.ts
export async function sendGift(streamId: string, giftId: string, coinCost: number, targetType: 'live') {
  const res = await fetch('/api/gifts/send', {
    method: 'POST',
    body: JSON.stringify({ targetId: streamId, targetType, giftId, coinCost }),
  });
  return res.json();
}