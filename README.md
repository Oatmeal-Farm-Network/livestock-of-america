# livestock-of-america

Livestock of America (LOA) — dedicated web app for livestock marketplace, breed
knowledge, ranches, and herd tools.

**Backend:** `oatmealfarmnetworkbackend` **livestock** Cloud Run service only  
(`livestock/api.py`). Not the OFN main backend or OFN frontend.

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

Set `VITE_LIVESTOCK_API_URL` to your livestock API (local `http://localhost:8000`
or staging Cloud Run URL). Endpoints live in `src/config/api.ts`.
