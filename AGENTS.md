# Repository Guidelines

## Project Structure & Module Organization
- `server/` hosts the Express API; models live in `server/models/`, routes in `server/routes/`, config in `server/config/`, middleware in `server/middlewares/`, and shared services (payments, leaderboard, logging) in `server/services/`. Integration tests sit in `server/tests/`.
- `client/` contains the Vite + React app. Keep shared UI under `client/src/components/`, page flows in `client/src/pages/`, global config in `client/src/config.ts`, and component tests in `client/src/components/__tests__/`. Test harness utilities belong to `client/src/test/`.
- CI workflows live in `.github/workflows/` and should stay green for both server and client suites.

## Build, Test, and Development Commands
- `cd server && npm start` – spin up the API using local `.env` values.
- `cd server && npm test` – run Jest + Supertest integration tests against MongoDB Memory Server.
- `cd client && npm run dev` – launch the Vite dev server with the `/api` proxy.
- `cd client && npm run test:run` – execute the Vitest suite once in CI mode.

## Coding Style & Naming Conventions
- Use TypeScript/JavaScript with 2-space indentation; prefer camelCase variables and PascalCase Mongoose models.
- React components should live in PascalCase files (e.g., `AdminForm.tsx`). Order Tailwind utilities roughly layout → color → interaction.
- Follow existing lint and format settings; run Prettier or ESLint targets before committing if added.

## Testing Guidelines
- Backend tests belong in `server/tests/*.test.js` and must validate routes, auth flows, and service integrations.
- Frontend tests live in `client/src/components/__tests__/Component.test.tsx` and use Vitest.
- Keep coverage meaningful for new logic and run the relevant `npm test` or `npm run test:run` before pushing.

## Commit & Pull Request Guidelines
- Write imperative commit messages (e.g., “Add warp transaction schema”) and reference issue numbers when available.
- PRs should describe scope, note config or migration changes, prove test runs, and attach UI screenshots or GIFs for visual updates.

## Security & Configuration Tips
- Never commit real `.env` files; update `.env.example` when configuration changes.
- Rotate `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_JWT_SECRET` before production releases and extend auth + rate limiting for new routes or sockets.
