// app/profile/[id]/page.tsx
import ProfileClient from "./ProfileClient";

export async function generateStaticParams() {
  return [
    { id: 'leo_vela_uid' },
    { id: 'dj_rayo_uid' },
    { id: 'reina_melody_uid' },
    { id: 'beatmaster_uid' },
    { id: 'zen_noise_uid' }
  ];
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProfileClient id={id} />;
}
