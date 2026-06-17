import { NextResponse } from "next/server";

interface TagsRequest {
  url: string;
  title: string;
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

    let body: TagsRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const { url, title } = body;

    const systemPrompt = [
      "You are a URL categorization engine.",
      "Given a URL and its page title, return 1-3 short, lowercase tags that describe what the link is about.",
      "Tags should be single words or short compounds: e.g. react, news, college, design, dev-tools, social, github, docs, tutorial, ai, backend.",
      "Return ONLY a JSON array of strings. No other text, no markdown, no explanation.",
      'Example: ["react","tutorial"]',
      'Example: ["news","tech"]',
      'Example: ["college","assignment"]',
    ].join("\n");

    const messages = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `URL: ${url}\nTitle: ${title}`,
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
          temperature: 0.3,
          max_tokens: 100,
        }),
      },
    );

    if (!deepseekResponse.ok) {
      console.error(`DeepSeek API error: ${deepseekResponse.status}`);
      return NextResponse.json(
        { error: "Tags service unavailable" },
        { status: 503 },
      );
    }

    const data = await deepseekResponse.json();
    const content =
      data.choices?.[0]?.message?.content?.trim() ?? "[]";

    let tags: string[] = [];
    try {
      tags = JSON.parse(content);
      if (!Array.isArray(tags)) tags = [];
    } catch {
      tags = [];
    }

    // Sanitize: only allow valid short tags
    tags = tags
      .filter((t) => typeof t === "string" && t.length > 0 && t.length <= 30)
      .slice(0, 3);

    return NextResponse.json({ tags });
  } catch (error) {
    console.error("Tags error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
