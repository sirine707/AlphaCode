import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Helper function to create a standardized error response
const createErrorResponse = (message: string, status: number) => {
  console.error(`Error: ${message}`);
  return NextResponse.json({ error: message }, { status });
};

// Main handler for the POST request
export async function POST(req: NextRequest) {
  console.log("--- /api/dockerfile: Request received ---");

  try {
    const { fileContents, language } = await req.json();
    const selectedModel = "qwen/qwen-2.5-72b-instruct:free"; // Hardcode the model as requested

    console.log(
      `Received - Language: ${language}, Model: ${selectedModel}, Content Length: ${fileContents?.length}`
    );

    if (!fileContents || !language) {
      return createErrorResponse(
        "File contents and language are required.",
        400
      );
    }

    const openrouterApiKey = process.env.OPENROUTER_API_KEY;
    if (!openrouterApiKey) {
      return createErrorResponse(
        "Server configuration error: Missing OpenRouter API key.",
        500
      );
    }

    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: openrouterApiKey,
    });

    const prompt = `
      Based on the following ${language} file, generate a complete and production-ready Dockerfile.
      The Dockerfile should be optimized for security, and performance.
      It should handle dependencies, build the application (if necessary), and set up the correct environment to run the code.
      Do not include any explanations, comments, or markdown formatting (e.g., \`\`\`dockerfile).
      Only return the raw Dockerfile content.

      File Content:
      ---
      ${fileContents}
      ---
    `;

    console.log(`Requesting Dockerfile from model: ${selectedModel}`);

    const response = await openai.chat.completions.create({
      model: selectedModel,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 1024,
    });

    const dockerfile = response.choices[0]?.message?.content?.trim() ?? "";

    if (!dockerfile) {
      return createErrorResponse(
        "Failed to generate Dockerfile from the model.",
        500
      );
    }

    console.log("Dockerfile generated successfully.");

    return NextResponse.json({
      dockerfile,
      prompt, // Return the prompt for context/debugging on the client
    });
  } catch (error) {
    console.error("Error in /api/dockerfile:", error);
    return createErrorResponse("An internal server error occurred.", 500);
  }
}
