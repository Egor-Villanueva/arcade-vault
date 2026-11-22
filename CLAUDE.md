# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Arcade Vault: a platform to play games online and compete for the highest score. The project follows Spec Driven Design (`/spec` and `/spec-impl` skills, installed via `npx skills@latest add Klerith/fernando-skills`). The codebase is currently a fresh Create Next App scaffold (single commit, only `app/layout.tsx` and `app/page.tsx`), so there is little architecture yet.

## Commands

```bash
npm run dev     # next dev
npm run build   # next build
npm run start   # next start
npm run lint    # eslint (flat config, eslint.config.mjs)
```

No test runner is configured.

## Next.js version caveat

This uses Next.js 16.4 / React 19.3, which has breaking changes versus common training data (see `AGENTS.md`). Read the relevant guide in `node_modules/next/dist/docs/` (sections: `01-app`, `02-pages`, `03-architecture`, `04-community`) before writing Next.js code, and heed deprecation notices.

## Configuration notes

- App Router only (`app/`). The root layout uses the globally generated `LayoutProps<"/">` type rather than importing a props type.
- `next.config.ts` enables `cacheComponents`, `partialPrefetching` and `experimental.agentFeedback`. `cacheComponents` changes caching/rendering semantics, so consult the docs before using data fetching or dynamic APIs.
- Tailwind CSS v4 is wired through a Turbopack rule (`@tailwindcss/turbopack` loader for `*.css`) instead of PostCSS. Styles start from `@import "tailwindcss"` in `app/globals.css`, with theme tokens defined via `@theme inline`.
- Path alias: `@/*` maps to the repo root.
- Docs and README are written in Spanish.
