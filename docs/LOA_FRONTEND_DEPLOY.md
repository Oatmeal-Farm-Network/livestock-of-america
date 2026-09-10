# Livestock of America — Frontend Deploy

**Repo:** [livestock-of-america](https://github.com/Oatmeal-Farm-Network/livestock-of-america)  
**Last updated:** September 2026

LOA is a **separate frontend**. It talks only to the **livestock** Cloud Run
service in `oatmealfarmnetworkbackend` (`livestock/api.py`). It does **not**
call the OFN main backend or OFN frontend.

## Branch → environment

Git train: see [BRANCHING.md](./BRANCHING.md). Feature PRs target `GCP/frontend-staging` only.

| Git branch | Cloud Run service | GCP project | Workflow | GitHub Environment |
|------------|-------------------|-------------|----------|--------------------|
| `GCP/frontend-staging` | `livestock-frontend-staging` | `oatmeal-farm-staging` | `.github/workflows/deploy-staging.yml` | `staging` |
| `GCP/frontend-testing` | `livestock-frontend-testing` | testing project (`TESTING_GCP_PROJECT_ID`; same as staging is OK) | `.github/workflows/deploy-testing.yml` | `testing` |
| `main` | `livestock-frontend-prod` | prod project (`PROD_GCP_PROJECT_ID`) | `.github/workflows/deploy-prod.yml` | `production` |

```text
feature/*  →  GCP/frontend-staging  →  GCP/frontend-testing  →  main
                 staging Cloud Run        testing Cloud Run      production
```

All three deploy workflows also support `workflow_dispatch`.

Testing **fails clearly** if required `TESTING_*` secrets/vars are missing.  
Production **fails clearly** if required `PROD_*` secrets/vars are missing.  
Do not copy production credentials into testing. Do not fill `PROD_*` just to green a workflow.

---

## Baked Vite env (build-time)

| Docker ARG / `VITE_*` | Staging var | Testing var | Production var | Purpose |
|----------------------|-------------|-------------|----------------|---------|
| `VITE_LIVESTOCK_API_URL` | `STAGING_LIVESTOCK_API_URL` | `TESTING_LIVESTOCK_API_URL` | `PROD_LIVESTOCK_API_URL` | **Only** API base — livestock Cloud Run |
| `VITE_SAIGE_API_URL` | `STAGING_SAIGE_URL` | `TESTING_SAIGE_URL` | `PROD_SAIGE_URL` | Optional Saige |
| `VITE_CONTACT_EMAIL` | `STAGING_CONTACT_EMAIL` | `TESTING_CONTACT_EMAIL` | `PROD_CONTACT_EMAIL` | Optional contact |

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

### Testing — repo `livestock-of-america`

Create Cloud Run `livestock-frontend-testing` and livestock API `oatmeal-livestock-testing` before the first testing deploy. `TESTING_*` may reuse the staging GCP project and WIF; do not reuse production DB or `SECRET_KEY`.

**Secrets (WIF):**

| Secret | Purpose |
|--------|---------|
| `TESTING_GCP_PROJECT_ID` | Testing GCP project (or `oatmeal-farm-staging`) |
| `TESTING_GCP_SERVICE_ACCOUNT` | Deployer SA for GitHub Actions |
| `TESTING_GCP_WORKLOAD_IDENTITY_PROVIDER` | WIF provider resource name |

**Variables:**

| Variable | Notes |
|----------|-------|
| `TESTING_LIVESTOCK_API_URL` | **Required** — `oatmeal-livestock-testing` Cloud Run URL |
| `TESTING_FRONTEND_RUNTIME_SA` | **Required** — runtime SA for the testing Cloud Run service |
| `TESTING_SAIGE_URL` | Optional |
| `TESTING_CONTACT_EMAIL` | Optional |
| `TESTING_REGION` | default `us-central1` |
| `TESTING_ARTIFACT_REGISTRY_REPOSITORY` | default `oatmeal-farm-registry` |

### Backend CORS — testing

| Variable | Value |
|----------|--------|
| `TESTING_LOA_FRONTEND_URL` | `https://livestock-frontend-testing-….run.app` |

Set this on `oatmealfarmnetworkbackend` before the first LOA testing deploy.

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
3. Create `livestock-frontend-testing` + `oatmeal-livestock-testing`; set `TESTING_*` on this repo and `TESTING_LOA_FRONTEND_URL` on the backend.
4. Promote via PRs: staging → testing → `main`. Prod CD stays fail-closed until `PROD_*` and Environment reviewers exist.

---

## Local development

```bash
cp .env.example .env
# Run livestock API locally: uvicorn livestock.api:app --reload --port 8000
npm install
npm run dev
```
