---
paths:
  - "lib/**"
  - "hooks/**"
---

# State & performance rules

- Optimistic UI updates for Todo and Notes: update local state immediately,
  sync to Firebase in the background, roll back on failure.
- Use localStorage as a fast-render cache for initial paint, then reconcile
  with Firestore once it loads — localStorage is never the source of truth.
- Avoid unnecessary `"use client"` boundaries; push them as far down the
  component tree as possible.
