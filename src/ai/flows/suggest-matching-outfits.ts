// src/ai/flows/suggest-matching-outfits.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting matching outfits based on a given clothing image.
 *
 * - suggestMatchingOutfits - The main function to call to get outfit suggestions.
 * - SuggestMatchingOutfitsInput - The input type for the suggestMatchingOutfits function.
 * - SuggestMatchingOutfitsOutput - The output type for the suggestMatchingOutfits function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestMatchingOutfitsInputSchema = z.object({
  clothingDataUri: z
    .string()
    .describe(
      "A clothing image as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type SuggestMatchingOutfitsInput = z.infer<typeof SuggestMatchingOutfitsInputSchema>;

const SuggestMatchingOutfitsOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe('An array of suggested matching outfits.'),
});
export type SuggestMatchingOutfitsOutput = z.infer<typeof SuggestMatchingOutfitsOutputSchema>;

export async function suggestMatchingOutfits(
  input: SuggestMatchingOutfitsInput
): Promise<SuggestMatchingOutfitsOutput> {
  return suggestMatchingOutfitsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestMatchingOutfitsPrompt',
  input: {schema: SuggestMatchingOutfitsInputSchema},
  output: {schema: SuggestMatchingOutfitsOutputSchema},
  prompt: `You are a personal stylist. Given a clothing item, suggest matching outfits.

Clothing item: {{media url=clothingDataUri}}

Output an array of suggested matching outfits.  Make sure each suggestion is comprehensive (e.g. if suggesting a suit, suggest pants, shirt, jacket, shoes, tie).`,
});

const suggestMatchingOutfitsFlow = ai.defineFlow(
  {
    name: 'suggestMatchingOutfitsFlow',
    inputSchema: SuggestMatchingOutfitsInputSchema,
    outputSchema: SuggestMatchingOutfitsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
