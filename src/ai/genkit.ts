import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {config} from 'dotenv';

config();

const plugins = [googleAI()];

export const ai = genkit({
  plugins,
  model: 'googleai/gemini-2.0-flash',
});
