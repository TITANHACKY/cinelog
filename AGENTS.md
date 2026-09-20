<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# CineLog component architecture

1. **Layers.** Atomic and app-context UI live in `src/components/ui/`. Feature folders (`auth`, `content-detail`, `dashboard`, `layout`, `search-popup`, `library`, `settings`) compose those pieces. Do not recreate `src/components/custom/`.
2. **Constants vs components.** `src/lib/constants/custom.ts` holds CineLog-specific UI constants (assets, class strings). Never put React components there.
3. **Hooks vs Redux.** Put event handlers, derived data, and UI-only state in `src/hooks/` (grouped by feature). Use Redux only for shared or async store slices (auth, library, search, content details, toast). Dropdowns, dialogs, tabs, and form drafts stay in local state.
4. **No shadcn copies.** Do not use Radix, `cva`, `data-slot`, or shadcn compound-slot CSS. Variants are local class maps on the component. Prefer design tokens over hardcoded hex.
5. **Split only when needed.** Split a feature file when it mixes unrelated responsibilities or becomes hard to maintain. Settings smart collections is the reference for that threshold.
6. **Mobile-first.** New UI uses wrapping flex, stacking grids, `min-w-0`, and `dvh` dialogs. Keep tap targets usable on small screens without breaking the desktop layout.
