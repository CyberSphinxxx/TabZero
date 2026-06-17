import { NextResponse } from "next/server";

interface BriefingRequest {
  date: string; // YYYY-MM-DD
  todos: string[];
  events: Array<{ title: string; start: string; end: string }>;
  weather: {
    temp: number;
    description: string;
  } | null;
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!apiKey || apiKey.length === 0) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    let body: BriefingRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const { date, todos, events, weather } = body;

    // Build a compact context block for the AI
    const contextParts: string[] = [
      `Today is ${date}.`,
    ];

    if (todos.length > 0) {
      contextParts.push(`Todos: ${todos.join("; ")}`);
    }

    if (events.length > 0) {
      const eventLines = events.map(
        (e) => `${e.title} (${e.start} – ${e.end})`,
      );
      contextParts.push(`Events: ${eventLines.join("; ")}`);
    }

    if (weather) {
      contextParts.push(
        `Weather: ${weather.temp}°C, ${weather.description}`,
      );
    }

    const context = contextParts.join("\n");

    const systemPrompt = [
      "You are Tabby, a hyper-efficient executive assistant for a 4th-year CS student in Cagayan De Oro, Philippines.",
      "You are writing a morning briefing. Rules:",
      "- Exactly 2-3 sentences. No greetings, no sign-offs, no 'Here is your briefing.'",
      "- Lead with the most important thing the user needs to know today.",
      "- If there are weather anomalies (rain, storms, extreme heat), mention an actionable tip (umbrella, hydration, etc.).",
      "- If no weather data is available, skip weather entirely.",
      "- If the user has no todos or events today, suggest one productive thing they could focus on.",
      "- Be direct. Use natural, concise language. No markdown or formatting.",
      "- Never mention that this is an AI-generated briefing. Just state the facts.",
    ].join("\n");

    const messages = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Generate the morning briefing for today using this context:\n\n${context}`,
      },
    ];

    const deepseekResponse = await fetch(
      "https://api.deepseek.com/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages,
          stream: false,
          temperature: 0.5,
          max_tokens: 200,
        }),
      },
    );

    if (!deepseekResponse.ok) {
      console.error(`DeepSeek API error: ${deepseekResponse.status}`);
      return NextResponse.json(
        { error: "Briefing service unavailable" },
        { status: 503 },
      );
    }

    const data = await deepseekResponse.json();
    const briefing =
      data.choices?.[0]?.message?.content?.trim() ??
      "Good morning — no briefing available.";

    return NextResponse.json({ briefing });
  } catch (error) {
    console.error("Briefing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
