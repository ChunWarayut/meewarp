# Repository Guidelines

## Project Structure & Module Organization
Keep API logic inside `server/`. Use `server/models/`, `server/routes/`, `server/middlewares/`, and `server/config/` for data, routing, request guards, and environment setup. Shared logic such as payments or logging belongs in `server/services/`. House integration tests alongside the feature in `server/tests/FeatureName.test.js` using Jest + Supertest. The Vite client lives under `client/`; reusable pieces stay in `client/src/components/`, pages in `client/src/pages/`, globals in `client/src/config.ts`, and test helpers in `client/src/test/`. Store Vitest suites in `client/src/components/__tests__/` mirroring the component name. The customer self-warp flow is fully public—see `client/src/pages/SelfWarpPage.tsx` and `client/src/components/customer/CustomerWarpModal.tsx` plus the backend endpoint in `server/routes/transactionRoutes.js`. The marketing landing (route `/`) is in `client/src/pages/MarketingLandingPage.tsx`; the TV display moved to `/tv` via `client/src/pages/TvLandingPage.tsx`. Automation lives in `.github/workflows/`—keep both client and server checks green.

## Build, Test, and Development Commands
Use `cd server && npm start` to boot the API against local `.env` values. Run `cd server && npm test` for the Mongo Memory Server integration pass. Start the React app with `cd client && npm run dev` (proxies `/api`). Execute `cd client && npm run test:run` for a single Vitest CI pass. Add `npm install` in each workspace before first use.

## Coding Style & Naming Conventions
Write TypeScript/JavaScript with 2-space indentation and camelCase variables. Declare Mongoose models in PascalCase (for example, `WarpTransaction`). React components live in PascalCase files such as `AdminForm.tsx`. Tailwind class order follows layout → color → interaction. Apply the repo ESLint/Prettier config before committing; use `npm run lint` when available.

## Testing Guidelines
Prefer integration coverage for API flows: simulate auth, services, and edge cases. Name backend tests `<feature>.test.js`; frontend tests `<Component>.test.tsx`. Ensure new logic has at least one assertion and extends existing suites rather than duplicating fixtures. Run both `npm test` (server) and `npm run test:run` (client) before opening a PR.

## Commit & Pull Request Guidelines
Write imperative commits referencing tickets when present (e.g., `Add warp transaction schema`). PRs must describe scope, highlight migrations or config edits, link to issues, and paste CLI test results. Attach UI screenshots or GIFs for visual changes and call out any follow-up tasks.

## Security & Configuration Tips
Never commit real secrets; keep `.env` values local and mirror changes in `.env.example`. Rotate `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_JWT_SECRET` prior to releases. Expand rate limiting and auth middleware whenever introducing new routes or socket handlers.
