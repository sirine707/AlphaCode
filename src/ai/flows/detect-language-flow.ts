'use server';
/**
 * @fileOverview Detects the programming language of a code snippet.
 *
 * - detectLanguage - A function that handles the language detection.
 * - DetectLanguageInput - The input type for the detectLanguage function.
 * - DetectLanguageOutput - The return type for the detectLanguage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectLanguageInputSchema = z.string().describe('A snippet of code.');
export type DetectLanguageInput = z.infer<typeof DetectLanguageInputSchema>;

const DetectLanguageOutputSchema = z.string().describe('The detected programming language name.');
export type DetectLanguageOutput = z.infer<typeof DetectLanguageOutputSchema>;

export async function detectLanguage(code: DetectLanguageInput): Promise<DetectLanguageOutput> {
    if (!code || code.trim().length === 0) {
        return "Plain Text";
    }
    return detectLanguageFlow(code);
}

const languageDetectionPrompt = ai.definePrompt({
  name: 'languageDetectionPrompt',
  input: { schema: DetectLanguageInputSchema },
  output: { schema: DetectLanguageOutputSchema },
  prompt: `Analyze the following code snippet and identify its programming language.
Respond with only the common name of the language (e.g., Python, JavaScript, HTML, CSS).
If you cannot determine the language, respond with "Plain Text".

Code:
\`\`\`
{{{input}}}
\`\`\`
`,
});

const detectLanguageFlow = ai.defineFlow(
  {
    name: 'detectLanguageFlow',
    inputSchema: DetectLanguageInputSchema,
    outputSchema: DetectLanguageOutputSchema,
  },
  async (input) => {
    const llmResponse = await languageDetectionPrompt(input);
    return llmResponse.trim();
  }
);
