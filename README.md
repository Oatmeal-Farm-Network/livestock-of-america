# livestock-of-america

Livestock of America is the dedicated web app for buying and selling livestock, stud services, ranch discovery, breed knowledge, and herd management.

## Ownership

| Area | Owner |
|------|--------|
| Website UI / Vite app (`package.json`, `src/`, …) | Frontend coworker |
| CI/CD (Docker, nginx, GitHub Actions, deploy docs) | Platform / this setup |

This repo currently contains **deploy infrastructure only**. Staging/prod builds expect a Vite (or compatible) app that produces `dist/` via `npm run build`.

## Deploy

| Branch | Environment |
|--------|-------------|
| `GCP/frontend-staging` | Staging Cloud Run `livestock-frontend-staging` |
| `main` | Production Cloud Run `livestock-frontend-prod` |

See [docs/LOA_FRONTEND_DEPLOY.md](docs/LOA_FRONTEND_DEPLOY.md) for secrets, bake vars, and CORS.

## Frontend contract (for the website PR)

Add a normal Vite app at the repo root so the existing `Dockerfile` works:

1. `package.json` with `"build"` → output in `dist/`
2. Bake these at build time (Docker already passes them as `ARG`/`ENV`):
   - `VITE_LIVESTOCK_API_URL` — breed / knowledge → livestock API
   - `VITE_API_URL` — auth / marketplace / animals / herd → OFN backend
   - `VITE_SAIGE_API_URL` — optional
   - `VITE_CONTACT_EMAIL` — optional
3. Prefer a single API config module (e.g. `src/config/api.ts`) so those bases stay centralized
4. Do **not** point marketplace / animals / herd-health at `oatmeal-livestock-*` until that service owns those routes

Local: copy `.env.example` → `.env`, then `npm install` && `npm run dev`.
