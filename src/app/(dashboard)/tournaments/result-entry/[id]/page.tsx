import { mockTournaments } from '@/lib/data';
import { notFound } from 'next/navigation';
import ResultEntryClient from './result-entry-client';

// Generate static params for static export
export function generateStaticParams() {
  return mockTournaments.map((tournament) => ({
    id: tournament.id,
  }));
}

export default async function ResultEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tournament = mockTournaments.find((t) => t.id === id);

  if (!tournament) {
    notFound();
  }

  // Mock results data for the AI flow. In a real app, this would come from the result entry form.
  const resultsData = {
    tournamentId: tournament.id,
    participants: [
      { player: 'Player1', score: 1500, kills: 12 },
      { player: 'PlayerX_Cheat', score: 9800, kills: 45 }, // Potential anomaly
      { player: 'Player3', score: 1200, kills: 8 },
      { player: 'Player4', score: 1450, kills: 11 },
      { player: 'Player5', score: 1300, kills: 9 },
    ],
  };

  return (
    <ResultEntryClient tournament={tournament} resultsData={resultsData} />
  );
}
