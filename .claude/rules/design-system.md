---
paths:
  - "components/**"
  - "app/**/*.tsx"
---

# Design system rules

- Bento grid layout: use Tailwind `grid`, `grid-cols-*`, `col-span-*`,
  `row-span-*`. Keep widget components self-contained inside
  components/widgets/<name>/.
- Dark mode is the default and primary theme; design for it first.
- Keep transitions subtle and fast — standard Tailwind transitions or
  Framer Motion durations under ~200ms.
- Use shadcn/ui primitives before writing custom UI from scratch. Add new
  components with `pnpm dlx shadcn@latest add <component>`.
- Icons: Lucide only, for consistency.
