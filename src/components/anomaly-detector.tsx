'use client';
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';
// Mock type for static export (server actions not supported)
type DetectTournamentResultAnomaliesOutput = {
  hasAnomalies: boolean;
  anomalyDescription: string;
  potentiallyCheatingPlayer?: string;
};
import type { Tournament } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

type AnomalyDetectorProps = {
  tournament: Tournament;
  resultsData: string;
};

export default function AnomalyDetector({
  tournament,
  resultsData,
}: AnomalyDetectorProps) {
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] =
    useState<DetectTournamentResultAnomaliesOutput | null>(null);
  const { toast } = useToast();

  const handleAnalysis = async () => {
    setLoading(true);
    setAnalysisResult(null);
    try {
      // Mock analysis for static export (server actions not supported)
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Parse results data to detect anomalies
      const parsedData = JSON.parse(resultsData);
      const scores = parsedData.participants?.map((p: any) => p.score) || [];
      const avgScore = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
      const maxScore = Math.max(...scores);
      const suspiciousPlayer = parsedData.participants?.find((p: any) => p.score > avgScore * 2);
      
      const result: DetectTournamentResultAnomaliesOutput = {
        hasAnomalies: suspiciousPlayer !== undefined,
        anomalyDescription: suspiciousPlayer
          ? `Detected unusually high score of ${suspiciousPlayer.score} compared to average of ${avgScore.toFixed(0)}. This may indicate potential cheating or data entry error.`
          : 'No anomalies detected. All scores appear to be within normal ranges.',
        potentiallyCheatingPlayer: suspiciousPlayer?.player,
      };
      
      setAnalysisResult(result);
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: 'An error occurred during analysis. Please check the results data format.',
      });
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Anomaly Detection</CardTitle>
        <CardDescription>
          Check for suspicious results before finalizing payouts.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleAnalysis} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...
            </>
          ) : (
            'Analyze Results with AI'
          )}
        </Button>
        {analysisResult && (
          <Alert variant={analysisResult.hasAnomalies ? 'destructive' : 'default'}>
            {analysisResult.hasAnomalies ? (
              <ShieldAlert className="h-4 w-4" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            <AlertTitle>
              {analysisResult.hasAnomalies
                ? 'Anomalies Detected!'
                : 'No Anomalies Found'}
            </AlertTitle>
            <AlertDescription>
              {analysisResult.anomalyDescription}
              {analysisResult.potentiallyCheatingPlayer && (
                <p className="mt-2">
                  Potential cheater:{' '}
                  <span className="font-bold">
                    {analysisResult.potentiallyCheatingPlayer}
                  </span>
                </p>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
