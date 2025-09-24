# Repository Guidelines

## Project Structure & Module Organization
- `server/` hosts the Express API, with data models in `server/models/`, routes under `server/routes/`, config utilities in `server/config/`, middleware in `server/middlewares/`, and reusable services (payments, leaderboard, logging) in `server/services/`. Integration tests live in `server/tests/`.
- `client/` contains the Vite + React + Tailwind app. Place shared UI in `client/src/components/`, redirect flows in `client/src/pages/`, shared settings in `client/src/config.ts`, and component tests in `client/src/components/__tests__/`. Global test setup sits in `client/src/test/`.
- CI workflows reside in `.github/workflows/` and keep server and client test suites green.

## Build, Test, and Development Commands
- `cd server && npm start` boots the API using the local `.env` values.
- `cd server && npm test` runs Jest + Supertest integration tests with MongoDB Memory Server; ensure the host can spawn `mongod`.
- `cd client && npm run dev` starts the Vite dev server with the `/api` proxy to the backend.
- `cd client && npm run test:run` executes the Vitest suite once in CI mode.

## Coding Style & Naming Conventions
- Use TypeScript/JavaScript with 2-space indentation and respect existing linting. Backend code favors camelCase variables and PascalCase Mongoose models; React components use PascalCase filenames such as `AdminForm.tsx`.
- Build UI with Tailwind utility classes ordered roughly layout → color → interaction for readability. Add concise comments only when logic is non-obvious.

## Testing Guidelines
- Backend tests belong in `server/tests/*.test.js` and should cover route behavior, authentication paths, and service integrations.
- Frontend tests live in `client/src/components/__tests__` and mirror component names (`Component.test.tsx`). Run the relevant `npm test` or `npm run test:run` command before pushing.

## Commit & Pull Request Guidelines
- Write imperative commit messages (e.g., “Add warp transaction schema”) and reference issue numbers when applicable.
- Pull requests should summarize scope, include evidence of test runs, document any `.env` or migration changes, and attach UI screenshots or GIFs for visual updates.

## Security & Configuration Tips
- Never commit real `.env` files; update `.env.example` when configuration changes.
- Rotate `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_JWT_SECRET` for production releases, and ensure new routes or sockets extend rate limiting and auth guards.
