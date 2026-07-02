import FactionSettingsClient from './SettingsClient';

interface FactionSettingsPageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return [
    { id: 'f_1' },
    { id: 'f_2' },
    { id: 'f_3' }
  ];
}

export default async function FactionSettingsPage({ params }: FactionSettingsPageProps) {
  const { id } = await params;

  return <FactionSettingsClient factionId={id} />;
}
