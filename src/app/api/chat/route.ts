import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  console.log("--- /api/chat: Request received ---");

  try {
    const body = await req.json();
    console.log("Request body:", body);

    const { message, model } = body;

    console.log(`Model: ${model}, Message: ${message}`);

    if (!message || !model) {
      console.error("Missing message or model in the request.");
      return NextResponse.json(
        { error: "Message and model are required." },
        { status: 400 }
      );
    }

    console.log("Chat prompt prepared for model:", model);

    // Use OpenRouter API
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterApiKey) {
      console.error("OPENROUTER_API_KEY is not set");
      return NextResponse.json(
        { error: "Server configuration error: Missing OpenRouter API key." },
        { status: 500 }
      );
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openRouterApiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer":
            process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
          "X-Title": "AlphaCode - AI Chat Assistant",
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: "system",
              content:
                "You are a helpful AI assistant for developers. You can help with coding questions, explain concepts, debug issues, and provide programming guidance. Be concise but thorough in your responses.",
            },
            {
              role: "user",
              content: message,
            },
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      }
    );

    console.log(`OpenRouter API response status: ${response.status}`);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[${model}] OpenRouter API error:`, errorBody);
      return NextResponse.json(
        {
          error: `Failed to fetch response from OpenRouter: ${response.statusText}`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Log the full model response to help with debugging
    console.log("Full OpenRouter response:", JSON.stringify(data, null, 2));

    // Extract the response from the API
    const aiResponse = data?.choices?.[0]?.message?.content?.trim() ?? "";

    if (!aiResponse) {
      console.error("Failed to extract response from OpenRouter response.");
      return NextResponse.json(
        { error: "Failed to extract response from OpenRouter response." },
        { status: 500 }
      );
    }

    console.log("AI response extracted successfully");

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error("Error in /api/chat:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
