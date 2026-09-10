## Hop

<!-- Pick one. Feature PRs may only target staging. -->

- [ ] Feature / fix → `GCP/frontend-staging` (staging Cloud Run)
- [ ] `GCP/frontend-staging` → `GCP/frontend-testing` (testing Cloud Run)
- [ ] `GCP/frontend-testing` → `main` (production)

Do **not** open a feature PR into testing or `main`.

## Summary

-

## Tickets / scope in this promotion

-

## Checks

- [ ] CI is green (`npm ci` + `npm run build`)
- [ ] No leftover `localhost` or production API URLs in the change
- [ ] Backend CORS updated if this hop adds a new LOA origin (`STAGING_LOA_FRONTEND_URL` / `TESTING_LOA_FRONTEND_URL` / `PROD_LOA_FRONTEND_URL`)
- [ ] Migrations / data notes (or N/A)

## Testing hop only

- [ ] Staging URL was exercised
- [ ] QA / product sign-off on the testing environment (name + date):

## Production hop only

- [ ] Testing URL was signed off
- [ ] GitHub Environment `production` approval required
- [ ] `PROD_*` secrets are intentionally set (do not fill them just to green a workflow)
