'use server';

/**
 * @fileOverview This file defines a Genkit flow to detect anomalies in tournament results.
 *
 * The flow takes tournament results data as input and uses an AI model to identify potential anomalies,
 * such as unusually high scores or suspicious patterns, to help admins ensure fair play and accurate payouts.
 *
 * - detectTournamentResultAnomalies - The main function to initiate the anomaly detection process.
 * - DetectTournamentResultAnomaliesInput - The input type for the detectTournamentResultAnomalies function.
 * - DetectTournamentResultAnomaliesOutput - The return type for the detectTournamentResultAnomalies function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectTournamentResultAnomaliesInputSchema = z.object({
  tournamentId: z.string().describe('The ID of the tournament.'),
  resultsData: z.string().describe('JSON string of the tournament results data, including player names, scores, and other relevant statistics.'),
});
export type DetectTournamentResultAnomaliesInput = z.infer<typeof DetectTournamentResultAnomaliesInputSchema>;

const DetectTournamentResultAnomaliesOutputSchema = z.object({
  hasAnomalies: z.boolean().describe('Whether anomalies were detected in the tournament results.'),
  anomalyDescription: z.string().describe('A detailed description of the anomalies detected, if any.'),
  potentiallyCheatingPlayer: z.string().optional().describe('The name of the player that may be potentially cheating')
});
export type DetectTournamentResultAnomaliesOutput = z.infer<typeof DetectTournamentResultAnomaliesOutputSchema>;

export async function detectTournamentResultAnomalies(input: DetectTournamentResultAnomaliesInput): Promise<DetectTournamentResultAnomaliesOutput> {
  return detectTournamentResultAnomaliesFlow(input);
}

const detectTournamentResultAnomaliesPrompt = ai.definePrompt({
  name: 'detectTournamentResultAnomaliesPrompt',
  input: {schema: DetectTournamentResultAnomaliesInputSchema},
  output: {schema: DetectTournamentResultAnomaliesOutputSchema},
  prompt: `You are an expert esports analyst specializing in detecting anomalies in tournament results.

You are given the results data for a tournament and your task is to identify any potential anomalies that may indicate cheating or errors in the results entry process.

Results Data (JSON format):
{{resultsData}}

Based on the results data, determine if there are any anomalies. Anomalies may include:
- Unusually high scores compared to the average scores in the tournament.
- Suspicious patterns in the data.
- Any other unusual activity that might suggest cheating or errors.

Return a JSON object indicating whether anomalies were detected, and if so, a detailed description of the anomalies. The description should include specific details about what was found and why it is considered an anomaly.
If a player is potentially cheating, return his or her name.

Follow the schema defined in the output.  Adhere to output schema descriptions closely.`,
});

const detectTournamentResultAnomaliesFlow = ai.defineFlow(
  {
    name: 'detectTournamentResultAnomaliesFlow',
    inputSchema: DetectTournamentResultAnomaliesInputSchema,
    outputSchema: DetectTournamentResultAnomaliesOutputSchema,
  },
  async input => {
    const {output} = await detectTournamentResultAnomaliesPrompt(input);
    return output!;
  }
);
