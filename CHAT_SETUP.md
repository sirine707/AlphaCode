# AI Chat Panel Setup

## Overview

The AI chat panel now supports two high-quality models through OpenRouter:

- **DeepSeek Chat V3** - Advanced reasoning and coding capabilities
- **Gemini 2.0 Flash** - Fast and efficient responses

## Setup Instructions

### 1. Get OpenRouter API Key

1. Visit [OpenRouter.ai](https://openrouter.ai)
2. Sign up or log in to your account
3. Navigate to the API Keys section
4. Create a new API key

### 2. Environment Configuration

1. Copy `.env.example` to `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your OpenRouter API key:
   ```env
   OPENROUTER_API_KEY=your_actual_openrouter_api_key_here
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

### 3. Features

- **Model Selection**: Choose between DeepSeek Chat V3 and Gemini 2.0 Flash
- **File Explanation**: Right-click on files in the explorer to get AI explanations
- **Context-Aware Chat**: Select files as context for your questions
- **Real-time Processing**: See loading indicators and status updates

### 4. Usage

1. Start the development server: `npm run dev`
2. Open the chat panel from the right side
3. Select your preferred model from the dropdown
4. Either:
   - Type a general question
   - Select a file from the project explorer and ask about it
   - Right-click on files to get automatic explanations

## API Costs

Both models are available on OpenRouter's free tier with some limitations:

- DeepSeek Chat V3: Free tier available
- Gemini 2.0 Flash: Free tier available

Check OpenRouter's pricing page for current rates and limits.

## Troubleshooting

- Ensure your API key is valid and has credits
- Check browser console for detailed error messages
- Verify environment variables are properly set
