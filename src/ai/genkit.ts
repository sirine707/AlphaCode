import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {config} from 'dotenv';

config();

const plugins = [googleAI()];

if (process.env.OPENROUTER_API_KEY) {
  // The openrouter plugin is not available in the registry, so we can't use it for now.
  // We'll leave this here in case we find the correct package name in the future.
}

export const ai = genkit({
  plugins,
  model: 'googleai/gemini-2.0-flash',
});
