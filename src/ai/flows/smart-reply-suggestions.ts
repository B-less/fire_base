'use server';

/**
 * @fileOverview A smart reply suggestion AI agent.
 *
 * - generateSmartReplies - A function that generates smart reply suggestions.
 * - SmartReplyInput - The input type for the generateSmartReplies function.
 * - SmartReplyOutput - The return type for the generateSmartReplies function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartReplyInputSchema = z.object({
  message: z.string().describe('The incoming message to generate smart replies for.'),
  conversationHistory: z
    .string()
    .describe('The conversation history between the user and the contact.'),
});
export type SmartReplyInput = z.infer<typeof SmartReplyInputSchema>;

const SmartReplyOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe('An array of smart reply suggestions for the incoming message.'),
});
export type SmartReplyOutput = z.infer<typeof SmartReplyOutputSchema>;

export async function generateSmartReplies(
  input: SmartReplyInput
): Promise<SmartReplyOutput> {
  return smartReplyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'smartReplyPrompt',
  input: {schema: SmartReplyInputSchema},
  output: {schema: SmartReplyOutputSchema},
  prompt: `You are a smart reply suggestion generator. Given the incoming message and the conversation history, generate an array of 3 concise, natural-sounding smart reply suggestions.

Conversation History:
{{{conversationHistory}}}

Incoming Message:
"{{{message}}}"

Suggestions:`,
});

const smartReplyFlow = ai.defineFlow(
  {
    name: 'smartReplyFlow',
    inputSchema: SmartReplyInputSchema,
    outputSchema: SmartReplyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
