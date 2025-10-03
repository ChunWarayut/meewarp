# Repository Guidelines

## Project Structure & Module Organization
- Keep all API logic in `server/`; split data, routing, middleware, and config across `server/models/`, `server/routes/`, `server/middlewares/`, and `server/config/`.
- Place cross-cutting helpers such as payment providers or logging in `server/services/`.
- Store integration specs beside the feature in `server/tests/<FeatureName>.test.js` using Jest + Supertest.
- House the Vite client in `client/`; reusable UI lives under `client/src/components/`, route screens in `client/src/pages/`, global config in `client/src/config.ts`, and test helpers in `client/src/test/`.
- Mirror each component with a Vitest suite at `client/src/components/__tests__/<Component>.test.tsx`.

## Build, Test, and Development Commands
- `cd server && npm install` – install API dependencies; run once per environment.
- `cd server && npm start` – launch the Express API against local `.env` settings.
- `cd server && npm test` – run the Mongo Memory Server integration suite.
- `cd client && npm install` – install client dependencies.
- `cd client && npm run dev` – start the Vite dev server (proxies `/api`).
- `cd client && npm run test:run` – execute the Vitest CI pass.

## Coding Style & Naming Conventions
- Use 2-space indentation and camelCase variables in TypeScript/JavaScript.
- Name Mongoose models in PascalCase (for example, `WarpTransaction`).
- Name React components and files in PascalCase, e.g., `AdminForm.tsx`.
- Order Tailwind classes by layout → color → interaction.
- Format with the repo ESLint/Prettier config; run `npm run lint` before committing when available.

## Testing Guidelines
- Prioritize integration coverage that hits auth, services, and edge cases.
- Name backend suites `<feature>.test.js`; frontend counterparts `<Component>.test.tsx`.
- Ensure every new test includes at least one assertion and extends existing fixtures.
- Run both `npm test` (server) and `npm run test:run` (client) before submitting changes.

## Commit & Pull Request Guidelines
- Write imperative commit messages; reference tickets when applicable (e.g., `Add warp transaction schema`).
- PRs should outline scope, flag migrations or config tweaks, link issues, and paste CLI test output.
- Attach UI screenshots or GIFs for visual updates and note follow-up tasks.

## Security & Configuration Tips
- Never commit real secrets; mirror config changes in `.env.example`.
- Rotate `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_JWT_SECRET` ahead of releases.
- Expand rate limiting and auth middleware whenever introducing new endpoints or sockets.
