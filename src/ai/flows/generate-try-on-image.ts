'use server';
/**
 * @fileOverview Generates a try-on image by overlaying clothing onto a user's photo using AI.
 *
 * - generateTryOnImage - A function that generates the try-on image.
 * - GenerateTryOnImageInput - The input type for the generateTryOnImage function.
 * - GenerateTryOnImageOutput - The return type for the generateTryOnImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTryOnImageInputSchema = z.object({
  userPhotoDataUri: z
    .string()
    .describe(
      "A photo of the user, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  clothingImageDataUri: z
    .string()
    .describe(
      "An image of the clothing, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateTryOnImageInput = z.infer<typeof GenerateTryOnImageInputSchema>;

const GenerateTryOnImageOutputSchema = z.object({
  tryOnImageDataUri: z
    .string()
    .describe("The generated try-on image, as a data URI."),
});
export type GenerateTryOnImageOutput = z.infer<typeof GenerateTryOnImageOutputSchema>;

export async function generateTryOnImage(input: GenerateTryOnImageInput): Promise<GenerateTryOnImageOutput> {
  return generateTryOnImageFlow(input);
}

const generateTryOnImageFlow = ai.defineFlow(
  {
    name: 'generateTryOnImageFlow',
    inputSchema: GenerateTryOnImageInputSchema,
    outputSchema: GenerateTryOnImageOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.5-flash-image-preview',
      prompt: [
        {media: {url: input.userPhotoDataUri}},
        {text: 'Overlay the clothing in this image: '},
        {media: {url: input.clothingImageDataUri}},
        {text: 'onto the user in the first image, generating a realistic try-on image.'},
      ],
      config: {
        responseModalities: ['IMAGE', 'TEXT'],
      },
    });
    return {tryOnImageDataUri: media!.url};
  }
);