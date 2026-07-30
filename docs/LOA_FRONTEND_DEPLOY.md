# Livestock of America — Frontend Deploy

**Repo:** [livestock-of-america](https://github.com/Oatmeal-Farm-Network/livestock-of-america)  
**Last updated:** July 2026

## Branch → environment

| Git branch | Cloud Run service | GCP project | Workflow |
|------------|-------------------|-------------|----------|
| `GCP/frontend-staging` | `livestock-frontend-staging` | `oatmeal-farm-staging` | `.github/workflows/deploy-staging.yml` |
| `main` | `livestock-frontend-prod` | prod project (`PROD_GCP_PROJECT_ID`) | `.github/workflows/deploy-prod.yml` |

```text
PR merged → GCP/frontend-staging → deploy staging
PR merged → main                 → deploy production
```

Both workflows also support `workflow_dispatch`.

Production **fails clearly** if any required `PROD_*` secret/var is missing — do not promote until those exist.

---

## Baked Vite env (build-time)

| Docker ARG / `VITE_*` | Staging var | Production var | Purpose |
|----------------------|-------------|----------------|---------|
| `VITE_LIVESTOCK_API_URL` | `STAGING_LIVESTOCK_API_URL` | `PROD_LIVESTOCK_API_URL` | Breed / KB → `oatmeal-livestock-staging` (or prod livestock) |
| `VITE_API_URL` | `STAGING_BACKEND_URL` | `PROD_BACKEND_URL` | Auth, marketplace, animals, herd → OFN backend |
| `VITE_SAIGE_API_URL` | `STAGING_SAIGE_URL` | `PROD_SAIGE_URL` | Optional Saige |
| `VITE_CONTACT_EMAIL` | `STAGING_CONTACT_EMAIL` | `PROD_CONTACT_EMAIL` | Optional contact |

App wiring lives in `src/config/api.ts`. Do **not** point marketplace / animals / herd-health at the livestock Cloud Run service until that service owns those routes.

---

## Secrets and variables to set (operator checklist)

### Staging — repo `livestock-of-america`

**Secrets (WIF):**

| Secret | Purpose |
|--------|---------|
| `STAGING_GCP_PROJECT_ID` | Staging GCP project id (`oatmeal-farm-staging`) |
| `STAGING_GCP_SERVICE_ACCOUNT` | Deployer SA for GitHub Actions |
| `STAGING_GCP_WORKLOAD_IDENTITY_PROVIDER` | WIF provider resource name |

**Variables:**

| Variable | Example / notes |
|----------|-----------------|
| `STAGING_LIVESTOCK_API_URL` | URL of existing `oatmeal-livestock-staging` (no trailing slash) |
| `STAGING_BACKEND_URL` | OFN staging backend URL (`oatmeal-backend-staging`) |
| `STAGING_SAIGE_URL` | Optional |
| `STAGING_CONTACT_EMAIL` | Optional |
| `STAGING_REGION` | default `us-central1` |
| `STAGING_ARTIFACT_REGISTRY_REPOSITORY` | default `oatmeal-farm-registry` |
| `STAGING_FRONTEND_RUNTIME_SA` | default `livestock-of-america@oatmeal-farm-staging.iam.gserviceaccount.com` |

After the first staging deploy, copy the Cloud Run URL and set **backend** var `STAGING_LOA_FRONTEND_URL` (see CORS below).

### Production — set before merging to `main` for a live cutover

| Name | Type |
|------|------|
| `PROD_GCP_PROJECT_ID` | secret |
| `PROD_GCP_SERVICE_ACCOUNT` | secret |
| `PROD_GCP_WORKLOAD_IDENTITY_PROVIDER` | secret |
| `PROD_FRONTEND_RUNTIME_SA` | var (required — no default) |
| `PROD_LIVESTOCK_API_URL` | var |
| `PROD_BACKEND_URL` | var |
| `PROD_SAIGE_URL` | var (optional) |
| `PROD_CONTACT_EMAIL` | var (optional) |
| `PROD_REGION` | var (optional) |
| `PROD_ARTIFACT_REGISTRY_REPOSITORY` | var (optional) |

Also set backend `PROD_LOA_FRONTEND_URL` once `livestock-frontend-prod` exists, and ensure `oatmeal-livestock-prod` (or equivalent) is deployed — see backend workflow `deploy-livestock-prod.yml`.

---

## Image and runtime

| Item | Value |
|------|--------|
| Image | `{region}-docker.pkg.dev/{project}/{registry}/livestock-frontend:<12-char-sha>` |
| Port | `8080` (nginx) |
| Dockerfile | Node build + nginx; `ARG`/`ENV` for all `VITE_*` above |
| Host handling | nginx `server_name _` so `*.run.app` Cloud Run hostnames work (avoids “Site Not Found”) |

---

## How CORS connects to livestock CD

1. Frontend staging deploys → Cloud Run URL for `livestock-frontend-staging`.
2. Set GitHub variable **`STAGING_LOA_FRONTEND_URL`** on **oatmealfarmnetworkbackend** to that exact origin (https, no path).
3. Backend workflow `.github/workflows/deploy-livestock-staging.yml` sets Cloud Run env:

   `FRONTEND_URL=<STAGING_LOA_FRONTEND_URL>[,<optional OFN staging frontend>]`

4. `livestock/api.py` splits comma-separated `FRONTEND_URL` into CORS `allow_origins`.

During migration, OFN staging frontend may remain in the list (via `STAGING_FRONTEND_URL`) so both origins work. Do **not** recreate `oatmeal-livestock-staging`.

Production mirror: `PROD_LOA_FRONTEND_URL` → `oatmeal-livestock-prod` via `deploy-livestock-prod.yml`.

---

## Suggested rollout order

1. Merge frontend staging workflow + Dockerfile + `src/config/api.ts` to `GCP/frontend-staging`.
2. Set staging secrets/vars on this repo (table above).
3. Run **Deploy LOA Frontend Staging**; confirm service URL and `/health`.
4. Set `STAGING_LOA_FRONTEND_URL` on the backend repo; redeploy livestock staging (or `workflow_dispatch`).
5. Verify browser calls to livestock API succeed (CORS).
6. Only then configure prod vars and enable `main` → prod + livestock prod.

---

## Local development

```bash
cp .env.example .env
npm install
npm run dev
```
