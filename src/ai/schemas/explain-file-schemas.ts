import {z} from 'genkit';

export const ExplainFileInputSchema = z.object({
  filePath: z.string().describe('The path of the file to explain.'),
  fileContent: z.string().describe('The content of the file to explain.'),
});
export type ExplainFileInput = z.infer<typeof ExplainFileInputSchema>;

export const ExplainFileOutputSchema = z.object({
  explanation: z.string().describe('The explanation of the file.'),
});
export type ExplainFileOutput = z.infer<typeof ExplainFileOutputSchema>;
