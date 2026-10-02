# SkillTree

Next.js 16 (App Router) + React 19 + TypeScript app that generates skill trees and quizzes with an LLM (MiniMax). Deployed on Vercel.

See @README.md for features and project structure.

## Commands

- `npm run dev` — local dev server (http://localhost:3000)
- `npm run build` — production build
- `npm run lint` — ESLint (flat config in `eslint.config.mjs`)
- `npx tsc --noEmit` — type check

## Notes

- Next.js 16 has breaking changes vs. older versions; check `node_modules/next/dist/docs/` before relying on older APIs.
- API routes live in `app/api/{generate,quiz,evaluate}/route.ts`; request validation is in `lib/validation.ts`.
- Secrets come from `MINIMAX_API_KEY` / `MINIMAX_BASE_URL` (see `.env.example`); never commit `.env*` files.
