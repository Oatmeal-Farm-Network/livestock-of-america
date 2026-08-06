# Livestock of America — Staging UI Audit Summary

**Target:** https://livestock-frontend-staging-1087130530284.us-central1.run.app  
**API:** https://oatmeal-livestock-staging-1087130530284.us-central1.run.app  
**When:** 2026-08-02 (local Playwright + API crawl)  
**Coverage:** 2,563 UI pages · 2,586 API checks · 1,958 breed pages (of ~2,510) · 490 marketplace listings · 29 ranch profiles · all static/marketing routes  

Full machine output: `REPORT.md` / `report.json` in this folder.  
Local runner (not committed): `scripts/ui-audit/crawl.mjs`

---

## Critical / high

### 1. Species breed list APIs return HTTP 500 (blocks KB UI)

| Species | Full list `/api/livestock/species/{slug}` | Broken letter filters |
|---------|-------------------------------------------|------------------------|
| **chickens** | 500 | `?letter=A` → 500 (other letters mostly OK) |
| **horses** | 500 | `?letter=D` → 500 |
| **llamas** | 500 | `?letter=M` → 500 |

**User impact**

- **Chickens KB** (`/livestock/chickens`): default letter is `A` → breed grid fails to load (browser shows CORS/`ERR_FAILED` because the 500 response lacks CORS headers).
- **Llamas KB** (`/livestock/llamas`): total breeds &lt; 26 so UI loads *all* breeds via the full endpoint → permanent empty/error state.
- **Horses KB**: letter nav mostly works; opening **D** (or any “load all”) fails.

### 2. Marketplace animal detail APIs return HTTP 500

These listing detail URLs fail in UI (same CORS-on-500 pattern):

| Animal ID | Detail URL |
|-----------|------------|
| 5042 | `/marketplaces/livestock/animal/5042` |
| 4993 | `/marketplaces/livestock/animal/4993` |
| 4997 | `/marketplaces/livestock/animal/4997` |
| 369 | `/marketplaces/livestock/animal/369` |

API: `GET /api/marketplace/animal/{id}` → `Internal Server Error`.

---

## Medium

### 3. Empty location filter labels

Marketplace filters include blank `state` values (show up as empty options in the location dropdown):

- alpacas (2 empty)
- cattle (1)
- donkeys (1)

### 4. Species with zero documented breeds

Knowledgebase cards exist but API breed count is 0:

- emus, musk-ox, ostriches  

Pages load, but breed lists are empty.

### 5. Letter index points at empty/erroring letters

Letters API advertises letters that 500 or return 0 breeds (e.g. chickens `A`, horses `D`, llamas `M`). UI still renders those letter buttons.

---

## Low

### 6. Species count copy mismatch

UI lists **29** species; page meta/copy still says **28**.

### 7. Thin/missing breed descriptions

~30+ breeds have empty or very short descriptions (see `REPORT.md` LOW section).

### 8. Marketplace listings missing photos

~20+ for-sale/stud cards have no `photo` (placeholder expected in UI).

---

## Coverage notes

- Auth-gated routes (`/account`, `/seller/*`, `/herd-health`) were hit as guest (expect login redirect) — not deeply tested as signed-in seller.
- Chickens/horses/llamas breed **list** APIs 500 on some paths; letter-wise recovery found **523** breed IDs and those breed **detail** UI pages were visited with **0** additional UI defects.
- Letters that 500 (chickens `A`, horses `D`, llamas `M`) still leave gaps vs `/counts` totals.
- No git commit/push was made.

---

## How to re-run locally

```bash
cd livestock-of-america
npx playwright install chromium
node scripts/ui-audit/crawl.mjs
```

Optional env: `LOA_FRONTEND_URL`, `LOA_API_URL`, `AUDIT_CONCURRENCY`, `AUDIT_BREED_UI_SAMPLE`.
