# TabZero

A personal command-center dashboard — the first tab opened in a browser.
Zero-friction philosophy: instant load, centralize academic/dev tasks, no
micro-decisions required to use.

## Stack
Next.js (App Router) · TypeScript (strict, no `any`) · Tailwind CSS ·
shadcn/ui · Radix UI · Lucide icons · Firebase (Firestore + Auth) ·
DeepSeek API · pnpm

## Architecture
- Server Components by default. Add `"use client"` only for state,
  interactivity, or browser APIs (localStorage, geolocation, etc.).
- DeepSeek calls only happen server-side, via app/api/ Route Handlers or
  Server Actions. Never from a Client Component.
- Bento grid layout via Tailwind `grid-cols-*` / `col-span-*` / `row-span-*`.
  Dark mode is the default theme.
- Use Optimistic UI updates for Todo and Notes features; treat localStorage
  as a fast-render cache ahead of Firebase sync, not the source of truth.

## Workflow
- Outline a brief step-by-step plan before writing code for any new feature.
- Provide complete files, not partial snippets.
- If a feature needs a new npm package, propose the lightest modern option
  and wait for approval before installing it.

## Detailed rules
Security, design-system, and state/performance conventions live in
.claude/rules/ and load automatically when you touch matching files.
