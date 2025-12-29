'use client';

import PageHeader from '@/components/page-header';
import { Tournament } from '@/lib/data';
import AnomalyDetector from '@/components/anomaly-detector';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ResultEntryClientProps {
  tournament: Tournament;
  resultsData: {
    tournamentId: string;
    participants: Array<{ player: string; score: number; kills: number }>;
  };
}

export default function ResultEntryClient({ tournament, resultsData }: ResultEntryClientProps) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Result Entry: ${tournament.name}`}
        description="Finalize results and detect anomalies before distributing prizes."
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Enter Results</CardTitle>
              <CardDescription>
                Input player scores and standings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* A form or table for result entry would go here */}
              <div className="p-8 text-center bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">Result entry interface placeholder.</p>
                <p className="text-sm text-muted-foreground">
                  In a real app, this would be a form or file upload.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        <div>
          <AnomalyDetector
            tournament={tournament}
            resultsData={JSON.stringify(resultsData, null, 2)}
          />
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Payouts</CardTitle>
          <CardDescription>
            After verifying results, distribute the prize pool to the winners.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <p>
              Total Prize Pool:{' '}
              <span className="font-bold text-primary">
                {new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: 'INR',
                }).format(tournament.prize_pool)}
              </span>
            </p>
            <Button>Distribute Winnings</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

