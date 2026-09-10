# Livestock of America — Git train

This repo follows the Oatmeal AI three-environment train. Do not rename these branches.

```text
feature/*  →  PR  →  GCP/frontend-staging  →  PR  →  GCP/frontend-testing  →  PR  →  main
                         staging Cloud Run              testing Cloud Run              production
```

| Branch | Cloud Run | GCP project | Workflow |
|--------|-----------|-------------|----------|
| `GCP/frontend-staging` | `livestock-frontend-staging` | `oatmeal-farm-staging` | `deploy-staging.yml` |
| `GCP/frontend-testing` | `livestock-frontend-testing` | `oatmeal-farm-staging` | `deploy-testing.yml` |
| `main` | **`livestock-frontend-prod`** | `animated-flare-421518` (Oatmeal AI) | `deploy-prod.yml` |

Allowed PRs only:

1. Work branch → `GCP/frontend-staging`
2. `GCP/frontend-staging` → `GCP/frontend-testing`
3. `GCP/frontend-testing` → `main`

Cut work branches from **current staging**, not from `main`.

CI (`.github/workflows/ci.yml`) runs on PRs into all three bases.

Merge to `main` deploys `livestock-frontend-prod` in Oatmeal AI (needs prod WIF on this repo). Testing stays fail-closed until `TESTING_*` and `livestock-frontend-testing` exist.

See [LOA_FRONTEND_DEPLOY.md](./LOA_FRONTEND_DEPLOY.md).
