# Livestock of America — Frontend Deploy

**Repo:** [livestock-of-america](https://github.com/Oatmeal-Farm-Network/livestock-of-america)  
**Last updated:** July 2026

LOA is a **separate frontend**. It talks only to the **livestock** Cloud Run
service in `oatmealfarmnetworkbackend` (`livestock/api.py`). It does **not**
call the OFN main backend or OFN frontend.

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

Production **fails clearly** if required `PROD_*` secrets/vars are missing.

---

## Baked Vite env (build-time)

| Docker ARG / `VITE_*` | Staging var | Production var | Purpose |
|----------------------|-------------|----------------|---------|
| `VITE_LIVESTOCK_API_URL` | `STAGING_LIVESTOCK_API_URL` | `PROD_LIVESTOCK_API_URL` | **Only** API base — livestock Cloud Run |
| `VITE_SAIGE_API_URL` | `STAGING_SAIGE_URL` | `PROD_SAIGE_URL` | Optional Saige |
| `VITE_CONTACT_EMAIL` | `STAGING_CONTACT_EMAIL` | `PROD_CONTACT_EMAIL` | Optional contact |

App wiring: `src/config/api.ts` → breed KB, marketplace, ranches, animals, herd health, auth — all on the livestock service.

---

## Secrets and variables (operator)

### Staging — repo `livestock-of-america`

**Secrets (WIF):**

| Secret | Purpose |
|--------|---------|
| `STAGING_GCP_PROJECT_ID` | `oatmeal-farm-staging` |
| `STAGING_GCP_SERVICE_ACCOUNT` | Deployer SA for GitHub Actions |
| `STAGING_GCP_WORKLOAD_IDENTITY_PROVIDER` | WIF provider resource name |

**Variables:**

| Variable | Example / notes |
|----------|-----------------|
| `STAGING_LIVESTOCK_API_URL` | `https://oatmeal-livestock-staging-….run.app` (**required**) |
| `STAGING_SAIGE_URL` | Optional |
| `STAGING_CONTACT_EMAIL` | Optional |
| `STAGING_REGION` | default `us-central1` |
| `STAGING_ARTIFACT_REGISTRY_REPOSITORY` | default `oatmeal-farm-registry` |
| `STAGING_FRONTEND_RUNTIME_SA` | default `livestock-of-america@oatmeal-farm-staging.iam.gserviceaccount.com` |

### Backend CORS — repo `oatmealfarmnetworkbackend`

| Variable | Value |
|----------|--------|
| `STAGING_LOA_FRONTEND_URL` | `https://livestock-frontend-staging-….run.app` |

`deploy-livestock-staging.yml` sets `FRONTEND_URL` (and `LOA_FRONTEND_URL`) from that var. Optional `STAGING_FRONTEND_URL` may still be appended for migration.

### Production

| Name | Type |
|------|------|
| `PROD_GCP_PROJECT_ID` | secret |
| `PROD_GCP_SERVICE_ACCOUNT` | secret |
| `PROD_GCP_WORKLOAD_IDENTITY_PROVIDER` | secret |
| `PROD_FRONTEND_RUNTIME_SA` | var (required) |
| `PROD_LIVESTOCK_API_URL` | var (required — livestock prod service) |
| `PROD_SAIGE_URL` | var (optional) |
| `PROD_CONTACT_EMAIL` | var (optional) |

Backend: `PROD_LOA_FRONTEND_URL` once `livestock-frontend-prod` exists. Livestock **prod** Cloud Run + CD must exist first.

---

## Image and runtime

| Item | Value |
|------|--------|
| Image | `{region}-docker.pkg.dev/{project}/{registry}/livestock-frontend:<12-char-sha>` |
| Port | `8080` (nginx) |
| Host | nginx `server_name _` (Cloud Run `*.run.app` OK) |

---

## Suggested rollout

1. Set `STAGING_LOA_FRONTEND_URL` on backend; redeploy livestock staging.
2. Confirm LOA site health probe hits livestock `/health` (no CORS errors).
3. Build LOA product UI against `src/config/api.ts` endpoints.
4. Prod only after livestock prod service exists.

---

## Local development

```bash
cp .env.example .env
# Run livestock API locally: uvicorn livestock.api:app --reload --port 8000
npm install
npm run dev
```
