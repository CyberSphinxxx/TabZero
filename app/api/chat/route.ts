import { NextResponse } from "next/server";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  message: string;
  history: ChatMessage[];
}

const MAX_HISTORY = 50;

function buildSystemPrompt(): string {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  return [
    "You are Tabby, TabZero's built-in executive assistant — a highly efficient, concise AI copilot for a 4th-year Computer Science student at Xavier University, living in Cagayan De Oro, Philippines.",
    "",
    "Rules:",
    "1. Be direct and brief. No fluff, no disclaimers, no 'as an AI.' Give the answer in the fewest words possible.",
    `2. The current date is ${now.toLocaleDateString("en-PH", options)}. The user's local time is ${now.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", hour12: true })} (PHT, UTC+8).`,
    "3. When answering code/debugging questions, prioritize solutions that work on Windows 11 and modern browsers (Chrome/Edge).",
    "4. Respond in plain text unless the user asks for formatting. No markdown unless specifically requested.",
    "",
    "--- COMMAND INTEGRATION ---",
    "If the user asks to schedule, add, or remind them about something, detect the intent and append exactly ONE of the following JSON blocks at the very end of your conversational response, separated by a blank line.",
    "",
    "For todo tasks (errands, reminders, one-off items):",
    "```",
    '{"action":"ADD_TODO","payload":{"text":"<task description>"}}',
    "```",
    "",
    "For calendar events (meetings, class blocks, schedule slots with a date/time):",
    "```",
    '{"action":"ADD_EVENT","payload":{"title":"<event name>","start":"<ISO 8601 datetime>","end":"<ISO 8601 datetime>"}}',
    "```",
    "",
    "Rules for command detection:",
    "- Phrases like 'remind me to', 'add a task', 'don't let me forget', 'todo:' → ADD_TODO",
    "- Phrases like 'schedule', 'set a meeting', 'block off', 'add an event', 'calendar' → ADD_EVENT",
    "- Map relative dates ('tomorrow', 'next Monday', 'Friday at 3pm') to actual PHT dates based on the current date above.",
    "- Include reasonable end times: 1 hour after start by default, or all-day (09:00-17:00) if unspecified.",
    "- If unsure, err toward ADD_TODO. If no action is needed, omit the JSON block entirely.",
    "- Never include more than one JSON block. Never nest the JSON inside a codeblock used for other purposes.",
    "- The JSON block MUST be the very last thing in your response after a blank line. Do not add text after it.",
  ].join("\n");
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!apiKey || apiKey.length === 0) {
      console.error("DEEPSEEK_API_KEY is not configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    let body: RequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const { message, history } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    // Trim history to the most recent messages
    const recentHistory = (history ?? []).slice(-MAX_HISTORY);

    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: buildSystemPrompt() },
      ...recentHistory.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
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
          stream: true,
          temperature: 0.7,
        }),
      },
    );

    if (!deepseekResponse.ok) {
      const errorStatus = deepseekResponse.status;
      console.error(`DeepSeek API error: ${errorStatus}`);

      if (errorStatus === 429) {
        return NextResponse.json(
          { error: "AI service temporarily unavailable. Please try again." },
          { status: 503 },
        );
      }

      return NextResponse.json(
        { error: "AI service temporarily unavailable" },
        { status: 503 },
      );
    }

    // Stream the response back to the client
    const deepseekBody = deepseekResponse.body;
    if (!deepseekBody) {
      return NextResponse.json(
        { error: "AI service temporarily unavailable" },
        { status: 503 },
      );
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const reader = deepseekBody.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Parse SSE chunks from DeepSeek streaming format
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith("data: ")) continue;

              const data = trimmed.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                const delta =
                  parsed.choices?.[0]?.delta?.content ?? "";
                if (delta) {
                  controller.enqueue(encoder.encode(delta));
                }
              } catch {
                // Skip malformed JSON chunks
              }
            }
          }

          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Unexpected chat error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
