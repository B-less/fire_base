
'use server';

/**
 * @fileOverview An AI-powered image generation and editing flow.
 *
 * - generateImage - A function that handles image generation or editing.
 * - GenerateImageInput - The input type for the generateImage function.
 * - GenerateImageOutput - The return type for the generateImage function.
 */

import { ai } from '@/ai/genkit';
import { logAIUsage } from '@/lib/ai-logger';
import { z } from 'genkit';

const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The text prompt describing the image to generate or edit.'),
  baseImage: z.string().optional().describe(
    "A base image to edit, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'. If not provided, a new image will be generated."
  ),
  userId: z.string().optional().describe('The ID of the user generating the image.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageUrl: z.string().describe('The data URI of the generated or edited image.'),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

export async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
  return generateImageFlow(input);
}

const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async ({ prompt, baseImage, userId }) => {
    let response;
    if (baseImage) {
      // Image-to-image generation
      response = await ai.generate({
        model: 'googleai/gemini-2.5-flash-image-preview',
        prompt: [
          { media: { url: baseImage } },
          { text: `Edit the image based on this prompt: ${prompt}` },
        ],
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      });
    } else {
      // Text-to-image generation
      response = await ai.generate({
        model: 'googleai/imagen-4.0-fast-generate-001',
        prompt: `Generate an image of: ${prompt}`,
      });
    }

    if (!response.media) {
      throw new Error('Image generation failed.');
    }

    await logAIUsage('image', { userId: userId, prompt: prompt });
    
    return { imageUrl: response.media.url };
  }
);

    