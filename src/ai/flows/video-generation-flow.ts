
'use server';

/**
 * @fileOverview An AI-powered video generation and editing flow.
 *
 * - generateVideo - A function that handles video generation or editing.
 * - GenerateVideoInput - The input type for the generateVideo function.
 * - GenerateVideoOutput - The return type for the generateVideo function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { logAIUsage } from '@/lib/ai-logger';

const GenerateVideoInputSchema = z.object({
  prompt: z.string().describe('The text prompt describing the video to generate or edit.'),
  baseMedia: z.string().optional().describe(
    "A base image or video to edit, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'. If not provided, a new video will be generated from text."
  ),
  userId: z.string().optional().describe('The ID of the user generating the video.'),
});
export type GenerateVideoInput = z.infer<typeof GenerateVideoInputSchema>;

const GenerateVideoOutputSchema = z.object({
  videoUrl: z.string().describe('The data URI of the generated or edited video.'),
});
export type GenerateVideoOutput = z.infer<typeof GenerateVideoOutputSchema>;


export async function generateVideo(input: GenerateVideoInput): Promise<GenerateVideoOutput> {
  return generateVideoFlow(input);
}

const generateVideoFlow = ai.defineFlow(
  {
    name: 'generateVideoFlow',
    inputSchema: GenerateVideoInputSchema,
    outputSchema: GenerateVideoOutputSchema,
  },
  async ({ prompt, baseMedia, userId }) => {
    const promptParts: Array<
      | { text: string }
      | { media: { url: string; contentType?: string } }
    > = [{ text: prompt }];
    if (baseMedia) {
        const [header] = baseMedia.split(',');
        const mimeType = header.match(/:(.*?);/)?.[1];
        promptParts.push({ media: { url: baseMedia, contentType: mimeType } });
    }

    let { operation } = await ai.generate({
        model: googleAI.model('veo-2.0-generate-001'),
        prompt: promptParts,
        config: {
          durationSeconds: 5,
          aspectRatio: '16:9',
        },
    });

    if (!operation) {
        throw new Error('Expected the model to return an operation');
    }

    // Poll for completion
    while (!operation.done) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        operation = await ai.checkOperation(operation);
    }

    if (operation.error) {
        throw new Error(`Failed to generate video: ${operation.error.message}`);
    }

    const video = operation.output?.message?.content.find((p) => !!p.media);

    if (!video || !video.media) {
        throw new Error('Failed to find the generated video in the operation result.');
    }

    await logAIUsage('video', { userId: userId, prompt: prompt });
    
    // The media URL from Veo is temporary and needs the API key to be downloaded.
    // For simplicity in this context, we will fetch it server-side and convert to a data URI.
    const fetch = (await import('node-fetch')).default;
    const videoDownloadResponse = await fetch(
      `${video.media.url}&key=${process.env.GEMINI_API_KEY}`
    );

    if (!videoDownloadResponse.ok || !videoDownloadResponse.body) {
        throw new Error(`Failed to download video from temporary URL: ${videoDownloadResponse.statusText}`);
    }
    
    const videoBuffer = await videoDownloadResponse.arrayBuffer();
    const videoBase64 = Buffer.from(videoBuffer).toString('base64');
    const contentType = video.media.contentType || 'video/mp4';

    return { videoUrl: `data:${contentType};base64,${videoBase64}` };
  }
);

    
