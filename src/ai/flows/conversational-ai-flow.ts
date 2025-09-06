'use server';

/**
 * @fileOverview A conversational AI agent.
 *
 * - generateChatResponse - A function that generates a response in a conversation.
 * - ChatInput - The input type for the generateChatResponse function.
 * - ChatOutput - The return type for the generateChatResponse function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ChatInputSchema = z.object({
  message: z.string().describe('The user message to respond to.'),
  conversationHistory: z.string().describe('The conversation history between the user and the AI.'),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  response: z.string().describe('The AI-generated response.'),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

export async function generateChatResponse(input: ChatInput): Promise<ChatOutput> {
  return conversationalAIFlow(input);
}

const prompt = ai.definePrompt({
  name: 'conversationalAIPrompt',
  input: { schema: ChatInputSchema },
  output: { schema: ChatOutputSchema },
  prompt: `You are a helpful and friendly AI assistant. Continue the following conversation.

Conversation History:
{{{conversationHistory}}}

User Message:
"{{{message}}}"

Your Response:`,
});

const conversationalAIFlow = ai.defineFlow(
  {
    name: 'conversationalAIFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
