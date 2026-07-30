# livestock-of-america

Livestock of America is the dedicated web app for buying and selling livestock, stud services, ranch discovery, breed knowledge, and herd management.

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

API bases are in `src/config/api.ts`:

- Breed / knowledge → `VITE_LIVESTOCK_API_URL`
- Auth / marketplace / animals / herd → `VITE_API_URL` (OFN backend for now)
