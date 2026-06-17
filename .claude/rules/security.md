---
paths:
  - "app/api/**"
  - "lib/server/**"
---

# Security rules

- Never read `DEEPSEEK_API_KEY` or Firebase Admin credentials inside a file
  marked `"use client"`, or pass either value to a Client Component as a prop.
- All DeepSeek API calls go through a Route Handler (app/api/) or a Server
  Action — never fetched directly from the browser.
- `NEXT_PUBLIC_FIREBASE_*` values are not secrets — Firebase client config is
  designed to be public. Don't flag those as leaks.
- Never log full request/response bodies that might contain API keys.
