---
name: scaffold-widget
description: Scaffold a new bento-grid dashboard widget with the standard Server/Client component split. Use when adding a new widget to the dashboard.
argument-hint: [widget-name]
---

Create a new widget called $ARGUMENTS:

1. `components/widgets/$ARGUMENTS/index.tsx` — Server Component, default export.
2. Only add a child `"use client"` component if interactivity/state is needed;
   keep it as small as possible and push it as deep in the tree as it'll go.
3. Use Tailwind grid classes consistent with the existing bento layout — check
   how other widgets under components/widgets/ size themselves before picking
   col-span/row-span values.
4. Strict TypeScript props, no `any`. Use shadcn/ui primitives where they fit.
5. Register the widget in the dashboard grid (app/page.tsx or the relevant
   layout file) once it's built.
