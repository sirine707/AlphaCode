'use server';
/**
 * @fileOverview Explains a code file.
 *
 * - explainFile - A function that handles the file explanation.
 */

import {ai} from '@/ai/genkit';
import {
  ExplainFileInputSchema,
  ExplainFileOutputSchema,
  type ExplainFileInput,
} from '@/ai/schemas/explain-file-schemas';

export async function explainFile(input: ExplainFileInput): Promise<string> {
  const result = await explainFileFlow(input);
  return result.explanation;
}

const explainFilePrompt = ai.definePrompt({
  name: 'explainFilePrompt',
  input: {schema: ExplainFileInputSchema},
  output: {schema: ExplainFileOutputSchema},
  prompt: `You are an expert software engineering assistant.
Analyze the following code from the file located at \`{{{filePath}}}\` and provide a concise explanation of its purpose, functionality, and how it works.

If the file is not a code file, explain what the file is and its content.

File Content:
\`\`\`
{{{fileContent}}}
\`\`\`
`,
});

const explainFileFlow = ai.defineFlow(
  {
    name: 'explainFileFlow',
    inputSchema: ExplainFileInputSchema,
    outputSchema: ExplainFileOutputSchema,
  },
  async input => {
    const { output } = await explainFilePrompt(input);
    if (!output || !output.explanation) {
        throw new Error("The AI model did not return an explanation.");
    }
    return output;
  }
);
