---
name: add-firestore-collection
description: Scaffold a new Firestore collection with strict types and a client hook. Use when a feature needs new persisted data (e.g. todos, notes, links).
argument-hint: [collection-name]
---

Add a new Firestore-backed collection called $ARGUMENTS:

1. Define a strict TypeScript type/interface for the document shape in
   types/$ARGUMENTS.ts — no `any`.
2. Add a typed client helper in lib/client/$ARGUMENTS.ts for CRUD operations
   against Firestore.
3. Add a hook (e.g. use-$ARGUMENTS.ts) that wraps the helper with optimistic
   local state, per the state-performance rules.
4. Note any required Firestore security rules changes, but don't write rules
   files unless asked — flag it and wait for confirmation.
