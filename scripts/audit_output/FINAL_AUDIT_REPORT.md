# Livestock Knowledgebase — Final Audit Report

**Date:** 2026-07-31  
**Staging frontend:** https://livestock-frontend-staging-1087130530284.us-central1.run.app  
**Staging API:** https://oatmeal-livestock-staging-1087130530284.us-central1.run.app  
**Repos:** `livestock-of-america`, `oatmealfarmnetworkbackend`

---

## Executive summary

| Metric | Value |
|--------|------:|
| Species | **29** |
| Total breeds | **2,510** |
| Breeds fetched in API walk | 2,463 |
| Frontend species card images | **29/29 OK** |
| Breed image field present | 1,767 |
| Breed image field empty | 696 |
| Broken image URLs (GCS 404) | **1,583** |
| LOTW recovery sample | **25/25** |
| Empty descriptions | 18 (all dogs) |
| Short descriptions | 18 |
| Duplicate name groups | 13 |
| Zero-breed species | emus, musk-ox, ostriches |
| Thin about pages | buffalo, crocodiles, honey-bees, musk-ox, pheasants, pigeons, quails, snails |
| API 500s (pre-fix) | chickens `letter=A`, horses `letter=D`, llamas full list |
| UI pages OK (desktop/tablet/mobile) | **29/29** species routes load |
| Species search | **Works** |

**UI was tested** with Playwright Chromium across desktop (1440×900), tablet (768×1024), and mobile (iPhone 13), with screenshots under `scripts/audit_output/ui/`.

---

## Phase 1 – Species verification

- All **29** species appear on `/livestock` with names, descriptions, images, and counts.
- Hero stats show **2,510** breeds / **29** species (verified in screenshot `desktop-01-livestock-index.png`).
- Search filters species (verified).
- **Intentional special nav:** `emus` and `ostriches` cards link to `/livestock/{slug}/about` (not breed list) because they have 0 breeds.
- Meta copy previously said “28 species” — corrected to **29** in code.

---

## Phase 2 – Breed verification (UI + API)

### UI (Playwright)
- **29/29** species pages load on desktop, tablet, mobile.
- **Chickens / llamas:** breed list empty in UI (“No breeds found”) due to API 500 → CORS/empty response.
- **Emus / musk-ox / ostriches:** legitimately 0 breed cards.
- Letter pagination visible (e.g. chickens A–Y).
- Breadcrumb + “All … Breeds” back navigation works on sampled breed pages.

### API failures (root cause)
| Endpoint | Cause |
|----------|--------|
| `/species/chickens?letter=A` | Corrupt row **BreedLookupID 2940** (Appenzeller Spitzhaubens duplicate) |
| `/species/horses?letter=D` | Corrupt row **594** (Dellagiara Pony) |
| `/species/llamas` | Corrupt row **1902** (Miniature) |

### Duplicate breed-name groups (13)
| Species | Name | IDs |
|---------|------|-----|
| cattle | modicana | 2362, 1134 |
| cattle | podolica | 2343, 2357 |
| cattle | shorthorn | 1223, 1181 |
| donkeys | burro | 2147, 2149 |
| ducks | pekin | 3086, 3253 |
| horses | estonian | 573, 574 |
| horses | gayoe | 2584, 3068 |
| horses | spotted saddle | 734, 735 |
| sheep | cheviot | 2903, 1333 |
| sheep | merino | 1462, 2922 |
| sheep | suffolk | 1572, 1616 |
| sheep | welsh mountain | 1607, 2933 |
| sheep | west african dwarfs | 1613, 2932 |

---

## Phase 3 – Breed image audit

### Findings
- API rewrites images to `https://storage.googleapis.com/oatmeal-farm-network-images/Animals/{file}` → mostly **404**.
- Same filenames on `https://livestockoftheworld.com/uploads/{file}` → **200** (25/25 sample).
- UI evidence: Huacaya breed detail has **no image** (broken GCS URL hidden by `onError`). Screenshot: `desktop-breed-alpacas.png`.
- Missing image field: **696** breeds (especially dogs ~350).

### Fixes applied (code, not yet deployed)
1. Backend `_fix_image_url` defaults to legacy LOTW uploads (`USE_GCS_LIVESTOCK_IMAGES=true` for future GCS cutover).
2. Frontend breed cards/detail fall back to `/images/MissingLivestockImage.webp` instead of hiding the image slot.

### Not done (requires credentials / licensing)
- Uploading new Google Images into GCS + updating SQL `BreedImage` for the 696 with empty fields.
- Migrating LOTW files into GCS Animals/.

---

## Phase 4 – Breed detail content

### Data model reality
There are **no** separate columns for Overview / Origin / History / Temperament / etc.  
Content is a single HTML field: `SpeciesBreedLookupTable.Breeddescription`, rendered via `dangerouslySetInnerHTML`.

### Content quality
| Issue | Count |
|-------|------:|
| Empty description | 18 (dogs) |
| Short description | 18 |
| False-positive “placeholder” string hits | 3 (incidental “n/a” / “no description” in prose) |
| Structured section headings | Mostly absent; prose paragraphs only |

### Blocked
Writing/updating breed text in SQL Server requires DB write access (not available in this session). No content rows were mutated.

---

## Phase 5 – UI testing (real browser)

| Check | Result |
|-------|--------|
| Desktop / tablet / mobile | All species pages load |
| Search | Works |
| Letter pagination | Present; chickens A broken via API |
| Breadcrumbs / back | Works on samples |
| Dark mode | Not supported |
| Console errors | CORS errors on chickens/llamas 500 responses |
| Screenshots | `scripts/audit_output/ui/*.png` (desktop/tablet/mobile) |

Notable screenshots:
- `desktop-01-livestock-index.png` — index + 2,510 / 29 stats
- `desktop-species-chickens.png` — “No breeds found” on letter A
- `desktop-breed-alpacas.png` — Huacaya detail missing image
- `desktop-species-cattle.png`, `desktop-breed-cattle.png`, horses/sheep samples
- Matching tablet + mobile sets

---

## Phase 6 – Data consistency

- Species naming consistent between UI `SPECIES[]` and API `SLUG_TO_SPECIES_ID` (29).
- Image filenames inconsistent (mixed case, numeric prefixes) — legacy LOTW convention.
- Duplicate records not eliminated (need DB review).
- Units / countries embedded in free HTML — not standardized.

---

## Phase 7 – Validation

| Check | Status |
|-------|--------|
| Unit tests `tests/test_livestock_image_urls.py` | **3 passed** |
| Staging live after deploy | **Pending** — code not deployed |
| Re-audit after deploy | Pending |

---

## Deliverables checklist

| # | Item | Status |
|---|------|--------|
| 1 | Total species | **29** |
| 2 | Total breeds | **2,510** |
| 3 | Missing species fixed | N/A (all present); meta 28→29 |
| 4 | Missing breeds fixed | **Blocked** (DB inserts for emus/musk-ox/ostriches + thin species) |
| 5 | Images added | **0 new uploads** (licensing + no GCS/DB write); URL rewrite fix ready |
| 6 | Broken images repaired | **Code fix ready** (LOTW rewrite + UI placeholder) |
| 7 | Breed pages updated | UI placeholder + API resilience |
| 8 | Missing information added | **Blocked** (no DB write) |
| 9 | Remaining manual review | See below |
| 10 | Screenshots | `scripts/audit_output/ui/` |
| 11 | Files modified | See below |

---

## Remaining manual review

1. **Deploy** `oatmeal-livestock-staging` with `livestock.py` changes.
2. **Deploy** frontend staging with placeholder + meta fixes.
3. SQL cleanup of corrupt IDs **2940, 594, 1902** and 13 duplicate name groups.
4. Populate breeds for emus / musk-ox / ostriches; expand alpacas/llamas/camels.
5. Fill 18 empty dog descriptions (+ short ones).
6. Optional: migrate uploads → GCS, then `USE_GCS_LIVESTOCK_IMAGES=true`.
7. Do **not** scrape Google Images without rights clearance.

---

## Files modified / added

```
oatmealfarmnetworkbackend/app/routers/livestock.py
oatmealfarmnetworkbackend/tests/test_livestock_image_urls.py

livestock-of-america/src/pages/LivestockSpecies.jsx
livestock-of-america/src/pages/LivestockBreed.jsx
livestock-of-america/src/pages/LivestockDB.jsx
livestock-of-america/scripts/audit_knowledgebase.py
livestock-of-america/scripts/ui_audit_kb.mjs
livestock-of-america/scripts/audit_output/**  (reports + screenshots)
```

Also: local `playwright` npm install as a dependency for the UI audit (not committed unless you ask).

**Nothing has been committed or pushed.**
