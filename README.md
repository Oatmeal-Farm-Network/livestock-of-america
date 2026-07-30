# livestock-of-america

Livestock of America is the dedicated web app for buying and selling livestock, stud services, ranch discovery, breed knowledge, and herd management.

## Ownership

| Area | Owner |
|------|--------|
| Product UI / design | Frontend team |
| Deploy (Docker, nginx, Actions) | Platform |

This repo includes a **minimal Vite shell** so Cloud Run CD can build and deploy. Replace `src/App.tsx` with the full product UI; keep `src/config/api.ts` (or equivalent) for API bases.

## Deploy

| Branch | Environment |
|--------|-------------|
| `GCP/frontend-staging` | Staging Cloud Run `livestock-frontend-staging` |
| `main` | Production Cloud Run `livestock-frontend-prod` |

See [docs/LOA_FRONTEND_DEPLOY.md](docs/LOA_FRONTEND_DEPLOY.md).

## Local

```bash
cp .env.example .env
npm install
npm run dev
```

`npm run build` must produce `dist/` (Dockerfile + nginx).

API bases in `src/config/api.ts`:

- Breed / knowledge → `VITE_LIVESTOCK_API_URL`
- Auth / marketplace / animals / herd → `VITE_API_URL` (OFN backend for now)
