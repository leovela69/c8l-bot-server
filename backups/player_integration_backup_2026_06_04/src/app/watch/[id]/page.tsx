// app/watch/[id]/page.tsx
import WatchClient from "./WatchClient";

export async function generateStaticParams() {
  return [
    { id: 'mock-1' },
    { id: 'mock-2' },
    { id: 'mock-3' },
    { id: 'mock-4' },
    { id: 'mock-5' },
    { id: 'mock-6' },
    { id: 'mock-7' },
    { id: 'mock-8' },
    { id: 'mock-9' },
    { id: 'mock-10' },
    { id: 'mock-11' },
    { id: 'mock-12' },
    { id: 'mock-13' },
    { id: 'mock-14' },
    { id: 'mock-15' },
    { id: 'mock-16' },
    { id: 'mock-17' },
    { id: 'mock-18' },
    { id: 'mock-19' },
    { id: 'mock-20' },
    { id: 'mock-21' },
    { id: 'mock-22' },
    { id: 'mock-23' },
    { id: 'mock-24' },
    { id: 'mock-25' },
    { id: 'mock-26' }
  ];
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WatchClient id={id} />;
}
