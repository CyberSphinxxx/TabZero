---
name: deepseek-call
description: Reference pattern for securely calling the DeepSeek API. Use when wiring any new AI-powered feature (chat, summaries, categorization, etc.).
---

When adding a feature that calls DeepSeek:

1. Put the call in a Route Handler under app/api/<feature>/route.ts, or a
   Server Action in lib/server/.
2. Read `DEEPSEEK_API_KEY` from `process.env` only inside that server-side
   file — never pass it to the client or log it.
3. The client calls your own Route Handler/Server Action, never the DeepSeek
   API directly.
4. Validate and sanitize whatever DeepSeek returns before rendering it,
   especially if rendered as HTML/Markdown.
5. Handle and surface API errors (rate limits, timeouts) gracefully in the UI
   rather than letting the request hang.
