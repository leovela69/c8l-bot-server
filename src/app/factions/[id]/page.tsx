import { FactionProfile } from '@/components/factions/FactionProfile';

interface FactionRoomPageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return [
    { id: 'f_1' },
    { id: 'f_2' },
    { id: 'f_3' }
  ];
}

export default async function FactionRoomPage({ params }: FactionRoomPageProps) {
  const { id } = await params;

  return (
    <div className="bg-black min-h-screen">
      <FactionProfile factionId={id} />
    </div>
  );
}
