import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  console.log("--- /api/autocomplete (Codestral FIM): Request received ---");

  try {
    const body = await req.json();
    console.log("Request body:", body);

    const { content, language } = body;

    console.log(`Language: ${language}, Content Length: ${content?.length}`);

    if (!content || !language) {
      console.error("Missing content or language in the request.");
      return NextResponse.json(
        { error: "File content and language are required." },
        { status: 400 }
      );
    }

    // Specific check for Python's common `if __name__ == "__main__":` idiom
    if (
      language.toLowerCase() === "python" &&
      content.trim().endsWith("if __name__ == ")
    ) {
      console.log(
        "Python `if __name__` idiom detected. Returning direct completion."
      );
      return NextResponse.json({ suggestion: '"__main__":' });
    }

    // Construct the prompt for the Fill-in-the-Middle (FIM) endpoint.
    const fimPrompt = `Continue the following ${language} code precisely where it left off. Only return the continuation, no explanations or markdown.\n\n<fim_prefix>${content}<fim_suffix><fim_middle>`;

    console.log("FIM Prompt:", fimPrompt);

    // Define model and parameters for Codestral FIM
    const model = "codestral-latest"; // Use the specific model for the endpoint
    const maxTokens = 30; // Limit output to a single line completion
    const temperature = 0.1;
    const stop = ["\n\n", "```"];

    console.log(
      `Requesting completion from model: ${model} with max_tokens: ${maxTokens}`
    );

    // Use the Codestral FIM completions endpoint
    const codestralApiKey = process.env.CODESTRAL_API_KEY;
    if (!codestralApiKey) {
      console.error("CODESTRAL_API_KEY is not set");
      return NextResponse.json(
        { error: "Server configuration error: Missing API key." },
        { status: 500 }
      );
    }

    const response = await fetch(
      "https://codestral.mistral.ai/v1/fim/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${codestralApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          prompt: fimPrompt,
          max_tokens: maxTokens,
          temperature,
          stop,
        }),
      }
    );

    console.log(`Codestral API response status: ${response.status}`);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[${model}] Codestral API error:`, errorBody);
      return NextResponse.json(
        {
          error: `Failed to fetch completion from Codestral: ${response.statusText}`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // 🔍 Log the full model response to help with debugging
    console.log("Full Codestral response:", JSON.stringify(data, null, 2));

    // 🧠 Safely extract the suggestion from the FIM response format
    const suggestion = data?.choices?.[0]?.message?.content?.trim() ?? "";

    if (!suggestion) {
      console.error("Failed to extract suggestion from Codestral response.");
      return NextResponse.json(
        { error: "Failed to extract suggestion from Codestral response." },
        { status: 500 }
      );
    }

    console.log("Suggestion extracted:", suggestion);

    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error("Error in /api/autocomplete:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
