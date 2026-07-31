# livestock-of-america

Livestock of America (LOA) — dedicated web app for the livestock marketplace,
breed knowledgebase, ranches, and related public pages.

**Backend:** `oatmealfarmnetworkbackend` **livestock** Cloud Run service only  
(`livestock/api.py`). Not the OFN main backend or OFN frontend.

## What this app includes

Phase‑1 Livestock of America website experience:

- Marketplace home (hero tabs, filters, featured listings, Join Now)
- Livestock for Sale / Stud Services / Ranches listing pages
- **Livestock Knowledgebase** (`/livestock`) — species → breeds → detail
- **Plant Knowledgebase** (`/plant-knowledgebase`) — categories → plants → varietals
- **Ingredient Knowledgebase** (`/ingredient-knowledgebase`) — categories → ingredients → varieties
- **News Feed** (`/news`) — `VITE_NEWS_API_URL`
- Events (coming soon), About, Contact, Login / Signup
- Blog / Directory stubs (coming soon)

| Data | Env |
|------|-----|
| Marketplace, livestock breeds, auth | `VITE_LIVESTOCK_API_URL` |
| Plants & ingredients | `VITE_OFN_API_URL` (OFN main backend) |
| News | `VITE_NEWS_API_URL` |

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

Leave `VITE_LIVESTOCK_API_URL` empty to use the Vite proxy to
`http://localhost:8000`, or set it to your livestock staging Cloud Run URL.

```bash
npm run build
npm run preview
```
