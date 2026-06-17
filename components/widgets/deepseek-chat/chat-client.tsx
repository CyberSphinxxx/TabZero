"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageBubble } from "./message-bubble";
import { useTodos } from "@/hooks/use-todos";
import { useCalendar } from "@/hooks/use-calendar";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ActionBlock {
  action: "ADD_TODO" | "ADD_EVENT";
  payload: Record<string, unknown>;
}

interface WeatherData {
  temp: number;
  description: string;
  icon: string;
  updatedAt: number;
}

/**
 * Regex to match the JSON action block at the end of a string.
 * Uses [\s\S] instead of . with /s flag for ES2017 compatibility.
 */
const ACTION_BLOCK_RE =
  /\n```\s*\n(\{"action":"(ADD_TODO|ADD_EVENT)","payload":\{[\s\S]*?\}\})\n```\s*$/;

const BRIEFING_STORAGE_KEY = "tabzero:last-briefing-date";

/**
 * Scan a string for a trailing action JSON block.
 * Returns the matched JSON string and the clean text (with the block removed),
 * or null if no block is found.
 */
function extractActionBlock(text: string): {
  json: string;
  clean: string;
} | null {
  const match = text.match(ACTION_BLOCK_RE);
  if (!match) return null;

  return {
    json: match[1],
    clean: text.slice(0, match.index),
  };
}

/** Parse a validated action JSON string into an ActionBlock */
function parseActionBlock(json: string): ActionBlock | null {
  try {
    const parsed = JSON.parse(json);

    if (
      parsed.action !== "ADD_TODO" &&
      parsed.action !== "ADD_EVENT"
    ) {
      return null;
    }

    if (
      !parsed.payload ||
      typeof parsed.payload !== "object" ||
      !parsed.payload.title !== !parsed.payload.text
    ) {
      return null;
    }

    return parsed as ActionBlock;
  } catch {
    return null;
  }
}

/** Check whether the briefing was already generated today */
function wasBriefedToday(): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return localStorage.getItem(BRIEFING_STORAGE_KEY) === today;
}

/** Mark today as briefed */
function markBriefedToday(): void {
  const today = new Date().toISOString().slice(0, 10);
  localStorage.setItem(BRIEFING_STORAGE_KEY, today);
}

export function ChatClient() {
  const { todos, loading: todosLoading } = useTodos();
  const { add: addTodo } = useTodos();
  const { events, loading: eventsLoading, add: addEvent } = useCalendar();

  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [briefingStatus, setBriefingStatus] = useState<
    "idle" | "loading" | "done"
  >("idle");

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const executedRef = useRef<Set<string>>(new Set());

  // Auto-scroll to latest message
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, streaming]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [draft]);

  // Cancel streaming on unmount or collapse
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // --- Morning Briefing ---
  useEffect(() => {
    // Only run once per session, when both hooks have resolved
    if (briefingStatus !== "idle") return;
    if (todosLoading || eventsLoading) return;
    if (wasBriefedToday()) {
      setBriefingStatus("done");
      return;
    }

    setBriefingStatus("loading");

    let cancelled = false;

    async function generateBriefing() {
      try {
        // Gather today's data
        const todayStr = new Date().toISOString().slice(0, 10);
        const todayTodos = todos
          .filter((t) => !t.completed)
          .map((t) => t.text);

        // Filter events for today
        const todayEvents = events
          .filter((e) => e.occurrenceDate === todayStr)
          .map((e) => ({
            title: e.title,
            start: new Date(e.start).toLocaleTimeString("en-PH", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }),
            end: new Date(e.end).toLocaleTimeString("en-PH", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }),
          }));

        // Fetch current weather
        let weather: { temp: number; description: string } | null = null;
        try {
          const weatherRes = await fetch("/api/weather");
          if (weatherRes.ok) {
            const weatherData: WeatherData = await weatherRes.json();
            weather = {
              temp: weatherData.temp,
              description: weatherData.description,
            };
          }
        } catch {
          // Weather is optional — skip if unavailable
        }

        if (cancelled) return;

        const res = await fetch("/api/briefing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: todayStr,
            todos: todayTodos,
            events: todayEvents,
            weather,
          }),
        });

        if (!res.ok) {
          if (cancelled) return;
          setBriefingStatus("done");
          return;
        }

        const data = await res.json();
        if (!data.briefing || cancelled) {
          setBriefingStatus("done");
          return;
        }

        // Inject as first assistant message
        setMessages([
          { role: "assistant", content: data.briefing },
        ]);
        markBriefedToday();
        setBriefingStatus("done");
      } catch {
        if (!cancelled) {
          setBriefingStatus("done");
        }
      }
    }

    generateBriefing();

    return () => {
      cancelled = true;
    };
  }, [briefingStatus, todosLoading, eventsLoading, todos, events]);

  /** Execute a parsed action block via the appropriate hook */
  const executeAction = useCallback(
    (action: ActionBlock) => {
      const { action: type, payload } = action;

      // Build a dedup key from the action and payload
      const dedupKey = JSON.stringify(action);
      if (executedRef.current.has(dedupKey)) return;
      executedRef.current.add(dedupKey);

      if (type === "ADD_TODO") {
        const text =
          typeof payload.text === "string"
            ? payload.text
            : typeof payload.title === "string"
              ? payload.title
              : "";
        if (text) {
          addTodo(text);
        }
      }

      if (type === "ADD_EVENT") {
        const eventInput = {
          title:
            (typeof payload.title === "string"
              ? payload.title
              : "") || "Untitled Event",
          description:
            (typeof payload.description === "string"
              ? payload.description
              : "") || "",
          start: (typeof payload.start === "string"
            ? payload.start
            : new Date().toISOString()) as string,
          end: (typeof payload.end === "string"
            ? payload.end
            : new Date(
                Date.now() + 60 * 60 * 1000,
              ).toISOString()) as string,
        };

        addEvent(eventInput);
      }
    },
    [addTodo, addEvent],
  );

  const sendMessage = useCallback(async () => {
    const trimmed = draft.trim();
    if (!trimmed || streaming) return;

    setDraft("");
    setError(null);

    const userMsg: Message = { role: "user", content: trimmed };
    const assistantMsg: Message = { role: "assistant", content: "" };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // Build history from previous messages (exclude the empty assistant placeholder)
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(errBody?.error ?? "Request failed");
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;

        // Every chunk: extract any action block from the accumulated text
        const extracted = extractActionBlock(accumulated);
        if (extracted) {
          const action = parseActionBlock(extracted.json);
          if (action) {
            executeAction(action);
          }

          // Show the clean text (without the JSON block) to the user
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant",
              content: extracted.clean,
            };
            return updated;
          });
        } else {
          // No action block yet — show raw accumulated text
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant",
              content: accumulated,
            };
            return updated;
          });
        }
      }

      setStreaming(false);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;

      console.error("Chat error:", err);
      setError("Connection lost. Try again.");
      setStreaming(false);

      // Remove the empty assistant bubble on error
      setMessages((prev) => prev.slice(0, -1));
    }
  }, [draft, messages, streaming, executeAction]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function retryLast() {
    if (messages.length < 2) return;
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;

    const lastUserIdx = messages.findLastIndex((m) => m.role === "user");
    setMessages((prev) => prev.slice(0, lastUserIdx));

    setDraft(lastUser.content);
    setError(null);
  }

  // Reset chat to initial state
  function resetChat() {
    abortRef.current?.abort();
    setMessages([]);
    setStreaming(false);
    setError(null);
    executedRef.current.clear();
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header — collapsible toggle */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center justify-between text-xs font-medium uppercase tracking-widest text-zinc-500 transition-colors hover:text-zinc-300"
      >
        <span>Rubber Duck</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${expanded ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Empty state when collapsed */}
      {!expanded && messages.length === 0 && !streaming && (
        <p className="mt-3 text-sm leading-relaxed text-zinc-600">
          AI copilot for coding, planning, and rubber ducking.
        </p>
      )}

      {/* Expanded area */}
      {expanded && (
        <>
          {/* Messages */}
          <div
            ref={listRef}
            className="mt-3 flex-1 space-y-3 overflow-y-auto pr-1 scrollbar-thin"
            style={{ maxHeight: "320px" }}
          >
            {messages.length === 0 && !streaming && briefingStatus === "idle" && (
              <div className="flex h-full items-center justify-center">
                <p className="text-center text-sm text-zinc-600">
                  Ask me anything — code, planning, rubber ducking.
                </p>
              </div>
            )}

            {messages.length === 0 && briefingStatus === "loading" && (
              <div className="flex h-full items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-sm text-zinc-500">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                    Generating morning briefing&hellip;
                  </span>
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <MessageBubble key={i} role={msg.role}>
                {msg.content || (
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                    Thinking&hellip;
                  </span>
                )}
              </MessageBubble>
            ))}

            {/* Error banner */}
            {error && (
              <div className="flex items-center justify-between rounded-lg border border-red-900/50 bg-red-950/30 px-3.5 py-2">
                <p className="text-sm text-red-400">{error}</p>
                <button
                  onClick={retryLast}
                  className="ml-3 shrink-0 text-xs font-medium text-red-300 transition-colors hover:text-red-100"
                >
                  Retry
                </button>
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="mt-3 flex items-end gap-2 border-t border-zinc-800 pt-3">
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='e.g. "Remind me to submit thesis" or "Schedule study block tomorrow at 2pm"&hellip;'
              rows={1}
              disabled={streaming}
              className="flex-1 resize-none bg-transparent text-sm leading-relaxed text-zinc-200 outline-none placeholder:text-zinc-600 disabled:opacity-50"
            />
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={resetChat}
                  className="rounded-md px-2 py-1.5 text-[11px] text-zinc-600 transition-colors hover:text-zinc-400"
                  title="Clear conversation"
                >
                  Clear
                </button>
              )}
              <button
                onClick={sendMessage}
                disabled={!draft.trim() || streaming}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200 disabled:opacity-30 disabled:hover:bg-zinc-800"
                aria-label="Send message"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
