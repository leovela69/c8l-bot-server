import { RoomLobby } from '@/components/lounge/RoomLobby';

interface LoungeRoomPageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return [
    { id: 'lobby' },
    { id: 'main' },
    { id: 'practice' }
  ];
}

export default async function LoungeRoomPage({ params }: LoungeRoomPageProps) {
  const { id } = await params;

  return (
    <div className="bg-black min-h-screen">
      <RoomLobby roomId={id} />
    </div>
  );
}
