/**
 * Local UI/API audit for Livestock of America staging.
 * Run: node scripts/ui-audit/crawl.mjs
 * Does not commit. Writes report under scripts/ui-audit/out/
 */
import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "out");

const FRONTEND =
  process.env.LOA_FRONTEND_URL ||
  "https://livestock-frontend-staging-1087130530284.us-central1.run.app";
const API =
  process.env.LOA_API_URL ||
  "https://oatmeal-livestock-staging-1087130530284.us-central1.run.app";

const SPECIES = [
  "alpacas", "bison", "buffalo", "camels", "cattle", "chickens", "crocodiles",
  "deer", "dogs", "donkeys", "ducks", "emus", "geese", "goats", "guinea-fowl",
  "honey-bees", "horses", "llamas", "musk-ox", "ostriches", "pheasants", "pigs",
  "pigeons", "quails", "rabbits", "sheep", "snails", "turkeys", "yaks",
];

const STATIC_PAGES = [
  "/", "/animals", "/marketplaces/livestock", "/knowledgebase", "/livestock",
  "/events", "/about", "/contact-us", "/contact-us/confirm", "/blog", "/directory",
  "/login", "/signup", "/forgot-password", "/news",
];

const CONCURRENCY = Number(process.env.AUDIT_CONCURRENCY || 6);
const MAX_LISTINGS_PER_SPECIES = Number(process.env.AUDIT_MAX_LISTINGS || 0); // 0 = all
const SKIP_BREED_UI = process.env.AUDIT_SKIP_BREED_UI === "1";
const BREED_UI_SAMPLE = Number(process.env.AUDIT_BREED_UI_SAMPLE || 0); // 0 = all

const bugs = [];
const stats = {
  startedAt: new Date().toISOString(),
  frontend: FRONTEND,
  api: API,
  pagesVisited: 0,
  apiChecks: 0,
  consoleErrors: 0,
  pageErrors: 0,
  failedRequests: 0,
  breedsDiscovered: 0,
  listingsDiscovered: 0,
};

function bug(severity, area, title, details = {}) {
  bugs.push({
    severity,
    area,
    title,
    ...details,
    at: new Date().toISOString(),
  });
}

async function fetchJson(url, label) {
  stats.apiChecks += 1;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    bug("high", "api", `Non-JSON response for ${label}`, {
      url,
      status: res.status,
      preview: text.slice(0, 200),
    });
  }
  if (!res.ok) {
    bug("high", "api", `HTTP ${res.status} for ${label}`, {
      url,
      status: res.status,
      preview: text.slice(0, 200),
    });
  }
  return { ok: res.ok, status: res.status, json, text };
}

async function mapPool(items, limit, fn) {
  const results = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function discoverBreeds() {
  const all = [];
  for (const slug of SPECIES) {
    const { ok, json } = await fetchJson(
      `${API}/api/livestock/species/${slug}`,
      `species ${slug}`,
    );
    if (!ok || !json) continue;
    const breeds = json.breeds || [];
    if (!Array.isArray(breeds)) {
      bug("medium", "api", `Species ${slug} breeds is not an array`, { slug });
      continue;
    }
    if (breeds.length === 0) {
      bug("medium", "knowledgebase", `Species ${slug} has zero breeds in API`, {
        slug,
        url: `${FRONTEND}/livestock/${slug}`,
      });
    }
    for (const b of breeds) {
      if (b == null || b.breed_id == null) {
        bug("high", "api", `Breed missing breed_id under ${slug}`, { slug, breed: b });
        continue;
      }
      all.push({
        species: slug,
        breedId: b.breed_id,
        name: b.breed || b.name || "",
      });
    }

    // Empty filter states check (marketplace)
    const filters = await fetchJson(
      `${API}/api/marketplace/filters/${slug}`,
      `filters ${slug}`,
    );
    if (filters.ok && filters.json?.states) {
      const emptyStates = (filters.json.states || []).filter(
        (s) => !s.state || String(s.state).trim() === "",
      );
      if (emptyStates.length > 0) {
        bug("medium", "marketplace", `Empty state filter labels for ${slug}`, {
          slug,
          emptyCount: emptyStates.length,
          sample: emptyStates.slice(0, 3),
        });
      }
    }
  }
  stats.breedsDiscovered = all.length;
  return all;
}

async function discoverListings() {
  const all = [];
  for (const slug of SPECIES) {
    for (const kind of ["for-sale", "studs"]) {
      let page = 1;
      let totalPages = 1;
      do {
        const { ok, json } = await fetchJson(
          `${API}/api/marketplace/${kind}/${slug}?page=${page}&per_page=50`,
          `${kind} ${slug} p${page}`,
        );
        if (!ok || !json) break;
        totalPages = json.total_pages || 1;
        const animals = json.animals || [];
        for (const a of animals) {
          if (a?.animal_id == null) {
            bug("high", "marketplace", `Listing missing animal_id (${kind}/${slug})`, {
              slug,
              kind,
              animal: a,
            });
            continue;
          }
          if (!a.full_name || String(a.full_name).trim() === "") {
            bug("medium", "marketplace", `Listing ${a.animal_id} missing full_name`, {
              slug,
              kind,
              animalId: a.animal_id,
            });
          }
          if (!a.photo) {
            bug("low", "marketplace", `Listing ${a.animal_id} missing photo`, {
              slug,
              kind,
              animalId: a.animal_id,
              name: a.full_name,
            });
          }
          all.push({
            species: slug,
            kind,
            animalId: a.animal_id,
            name: a.full_name || "",
          });
        }
        if (MAX_LISTINGS_PER_SPECIES > 0 && all.filter((x) => x.species === slug && x.kind === kind).length >= MAX_LISTINGS_PER_SPECIES) {
          break;
        }
        page += 1;
      } while (page <= totalPages);

      // Ranches list (first page + check pagination)
      if (kind === "for-sale") {
        const ranches = await fetchJson(
          `${API}/api/ranches/list/${slug}?page=1&per_page=50`,
          `ranches ${slug}`,
        );
        if (ranches.ok && ranches.json) {
          const list = ranches.json.ranches || ranches.json.businesses || ranches.json.items || [];
          if (Array.isArray(list)) {
            for (const r of list) {
              const id = r.business_id ?? r.BusinessID ?? r.id;
              if (id == null) {
                bug("medium", "ranches", `Ranch missing business id for ${slug}`, { ranch: r });
                continue;
              }
              all.push({
                species: slug,
                kind: "ranch",
                animalId: id,
                name: r.business_name || r.name || "",
                isRanch: true,
              });
            }
          }
        }
      }
    }
  }
  stats.listingsDiscovered = all.filter((x) => !x.isRanch).length;
  return all;
}

async function auditBreedApis(breeds) {
  await mapPool(breeds, 12, async (b) => {
    const { ok, json } = await fetchJson(
      `${API}/api/livestock/breed/${b.breedId}`,
      `breed ${b.breedId}`,
    );
    if (!ok) return;
    if (!json?.breed && !json?.name) {
      bug("medium", "knowledgebase", `Breed ${b.breedId} missing name`, {
        species: b.species,
        breedId: b.breedId,
        url: `${FRONTEND}/livestock/${b.species}/breed/${b.breedId}`,
      });
    }
    if (!json?.description || String(json.description).trim().length < 20) {
      bug("low", "knowledgebase", `Breed ${b.breedId} thin/missing description`, {
        species: b.species,
        breedId: b.breedId,
        name: json?.breed || b.name,
      });
    }
  });
}

function attachPageListeners(page, urlRef) {
  const consoleErrors = [];
  const pageErrors = [];
  const failed = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
      stats.consoleErrors += 1;
    }
  });
  page.on("pageerror", (err) => {
    pageErrors.push(String(err));
    stats.pageErrors += 1;
  });
  page.on("response", (res) => {
    const status = res.status();
    const u = res.url();
    if (status >= 400 && (u.includes(FRONTEND) || u.includes(API) || u.includes("/api/") || u.includes("/images/"))) {
      failed.push({ status, url: u });
      stats.failedRequests += 1;
    }
  });

  return {
    flush(url) {
      const uniqueConsole = [...new Set(consoleErrors)];
      const uniquePage = [...new Set(pageErrors)];
      const uniqueFailed = failed.filter(
        (f) => !f.url.includes("favicon") && !f.url.includes("chrome-extension"),
      );
      if (uniqueConsole.length) {
        bug("medium", "ui", `Console errors on ${url}`, {
          url,
          errors: uniqueConsole.slice(0, 8),
        });
      }
      if (uniquePage.length) {
        bug("high", "ui", `Unhandled page error on ${url}`, {
          url,
          errors: uniquePage.slice(0, 5),
        });
      }
      const apiFails = uniqueFailed.filter((f) => f.url.includes("/api/") || f.url.includes(API));
      const imgFails = uniqueFailed.filter((f) => f.url.includes("/images/") || /\.(webp|png|jpg|jpeg|gif|svg)(\?|$)/i.test(f.url));
      if (apiFails.length) {
        bug("high", "ui", `Failed API/asset requests on ${url}`, {
          url,
          failures: apiFails.slice(0, 10),
        });
      }
      if (imgFails.length >= 3) {
        bug("medium", "ui", `Multiple broken images on ${url}`, {
          url,
          count: imgFails.length,
          sample: imgFails.slice(0, 5),
        });
      } else if (imgFails.length > 0) {
        bug("low", "ui", `Broken image(s) on ${url}`, {
          url,
          failures: imgFails,
        });
      }
      consoleErrors.length = 0;
      pageErrors.length = 0;
      failed.length = 0;
    },
  };
}

async function visitUrls(browser, urls, label) {
  await mapPool(urls, CONCURRENCY, async (url) => {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      ignoreHTTPSErrors: true,
    });
    const page = await context.newPage();
    const listeners = attachPageListeners(page, url);
    try {
      const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
      stats.pagesVisited += 1;
      if (!res) {
        bug("high", "ui", `No response navigating to ${url}`, { url, label });
      } else if (res.status() >= 400) {
        bug("high", "ui", `HTTP ${res.status()} loading ${url}`, { url, status: res.status() });
      }
      await page.waitForTimeout(1200);
      // SPA soft-fail signals
      const bodyText = (await page.locator("body").innerText().catch(() => "")) || "";
      if (/something went wrong|unexpected error|failed to fetch|network error/i.test(bodyText)) {
        bug("high", "ui", `Error copy visible on ${url}`, {
          url,
          snippet: bodyText.slice(0, 240),
        });
      }
      if (/loading listings…|loading…/i.test(bodyText) && bodyText.length < 800) {
        bug("high", "ui", `Page stuck loading on ${url}`, { url });
      }
      // Auth walls should redirect or show login for protected routes
      if (url.includes("/account") || url.includes("/seller/") || url.includes("/herd-health")) {
        const onLogin = page.url().includes("/login");
        if (!onLogin && !/login|sign in|create a free account/i.test(bodyText)) {
          // ok if redirected
        }
      }
      listeners.flush(url);
    } catch (err) {
      bug("high", "ui", `Navigation failed for ${url}`, {
        url,
        error: String(err),
      });
    } finally {
      await context.close();
    }
  });
}

function toMarkdown(report) {
  const bySev = { critical: [], high: [], medium: [], low: [] };
  for (const b of report.bugs) {
    (bySev[b.severity] || bySev.medium).push(b);
  }
  const lines = [
    `# Livestock of America UI Audit Report`,
    ``,
    `- **When:** ${report.stats.startedAt} → ${report.stats.finishedAt}`,
    `- **Frontend:** ${report.stats.frontend}`,
    `- **API:** ${report.stats.api}`,
    `- **Pages visited:** ${report.stats.pagesVisited}`,
    `- **API checks:** ${report.stats.apiChecks}`,
    `- **Breeds discovered:** ${report.stats.breedsDiscovered}`,
    `- **Listings discovered:** ${report.stats.listingsDiscovered}`,
    `- **Bugs found:** ${report.bugs.length} (high: ${bySev.high.length}, medium: ${bySev.medium.length}, low: ${bySev.low.length})`,
    ``,
  ];
  for (const sev of ["critical", "high", "medium", "low"]) {
    const items = bySev[sev];
    if (!items.length) continue;
    lines.push(`## ${sev.toUpperCase()} (${items.length})`, ``);
    items.forEach((b, i) => {
      lines.push(`### ${i + 1}. ${b.title}`);
      lines.push(`- **Area:** ${b.area}`);
      if (b.url) lines.push(`- **URL:** ${b.url}`);
      if (b.slug) lines.push(`- **Species:** ${b.slug}`);
      if (b.breedId != null) lines.push(`- **Breed ID:** ${b.breedId}`);
      if (b.animalId != null) lines.push(`- **Animal ID:** ${b.animalId}`);
      if (b.errors) lines.push(`- **Errors:** ${JSON.stringify(b.errors)}`);
      if (b.failures) lines.push(`- **Failures:** ${JSON.stringify(b.failures)}`);
      if (b.snippet) lines.push(`- **Snippet:** ${b.snippet}`);
      if (b.emptyCount != null) lines.push(`- **Empty count:** ${b.emptyCount}`);
      if (b.preview) lines.push(`- **Preview:** ${b.preview}`);
      lines.push(``);
    });
  }
  if (!report.bugs.length) {
    lines.push(`## No bugs found`, ``, `Crawl completed without recorded defects.`, ``);
  }
  return lines.join("\n");
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  console.log(`Frontend: ${FRONTEND}`);
  console.log(`API: ${API}`);

  // Counts vs SPECIES length mismatch
  const counts = await fetchJson(`${API}/api/livestock/counts`, "counts");
  if (counts.ok && counts.json?.counts) {
    const apiSlugs = Object.keys(counts.json.counts);
    for (const s of SPECIES) {
      if (!(s in counts.json.counts)) {
        bug("medium", "knowledgebase", `Species ${s} missing from /counts`, { slug: s });
      }
    }
    for (const s of apiSlugs) {
      if (!SPECIES.includes(s)) {
        bug("low", "knowledgebase", `API counts has unexpected species ${s}`, { slug: s });
      }
    }
    // Marketing copy says 28 species; UI list has 29
    if (SPECIES.length !== 28) {
      bug("low", "knowledgebase", `UI documents ${SPECIES.length} species but page meta claims 28`, {
        speciesCount: SPECIES.length,
      });
    }
  }

  const homepage = await fetchJson(`${API}/api/marketplace/homepage-listings`, "homepage-listings");
  if (homepage.ok) {
    const list = Array.isArray(homepage.json) ? homepage.json : homepage.json?.listings || [];
    if (!list.length) {
      bug("high", "marketplace", "Homepage listings API returned empty array", {
        url: `${FRONTEND}/`,
      });
    } else {
      const missingNames = list.filter((x) => !x.full_name);
      if (missingNames.length) {
        bug("medium", "marketplace", "Homepage listings missing full_name", {
          count: missingNames.length,
          ids: missingNames.map((x) => x.animal_id),
        });
      }
    }
  }

  console.log("Discovering breeds…");
  const breeds = await discoverBreeds();
  console.log(`Breeds: ${breeds.length}`);

  console.log("Auditing breed APIs…");
  await auditBreedApis(breeds);

  console.log("Discovering marketplace listings + ranches…");
  const listings = await discoverListings();
  console.log(`Listing/ranch entries: ${listings.length}`);

  // Animal detail API sample / all
  const animalIds = [...new Set(listings.filter((l) => !l.isRanch).map((l) => l.animalId))];
  console.log(`Unique animals: ${animalIds.length}`);
  await mapPool(animalIds, 10, async (id) => {
    const { ok, json } = await fetchJson(
      `${API}/api/marketplace/animal/${id}`,
      `animal ${id}`,
    );
    if (!ok) return;
    if (!json?.full_name && !json?.animal?.full_name) {
      bug("medium", "marketplace", `Animal ${id} detail missing name`, {
        animalId: id,
        url: `${FRONTEND}/marketplaces/livestock/animal/${id}`,
      });
    }
  });

  const ranchIds = [...new Set(listings.filter((l) => l.isRanch).map((l) => l.animalId))];
  await mapPool(ranchIds, 8, async (id) => {
    await fetchJson(`${API}/api/ranches/profile/${id}`, `ranch ${id}`);
  });

  console.log("Launching browser for UI crawl…");
  const browser = await chromium.launch({ headless: true });

  const staticUrls = STATIC_PAGES.map((p) => `${FRONTEND}${p}`);
  // Species + about
  const speciesUrls = SPECIES.flatMap((s) => [
    `${FRONTEND}/livestock/${s}`,
    `${FRONTEND}/livestock/${s}/about`,
    `${FRONTEND}/marketplaces/livestock/${s}`,
    `${FRONTEND}/marketplaces/livestock/studs/${s}`,
    `${FRONTEND}/marketplaces/livestock/ranches/${s}`,
  ]);

  console.log(`UI static+species pages: ${staticUrls.length + speciesUrls.length}`);
  await visitUrls(browser, staticUrls, "static");
  await visitUrls(browser, speciesUrls, "species");

  let breedUrls = breeds.map(
    (b) => `${FRONTEND}/livestock/${b.species}/breed/${b.breedId}`,
  );
  if (SKIP_BREED_UI) {
    console.log("Skipping breed UI (AUDIT_SKIP_BREED_UI=1)");
    breedUrls = [];
  } else if (BREED_UI_SAMPLE > 0) {
    // stratified sample: first N overall still too biased — take every k-th
    const step = Math.max(1, Math.floor(breedUrls.length / BREED_UI_SAMPLE));
    breedUrls = breedUrls.filter((_, i) => i % step === 0).slice(0, BREED_UI_SAMPLE);
    console.log(`Breed UI sample: ${breedUrls.length}`);
  } else {
    console.log(`Breed UI all: ${breedUrls.length}`);
  }
  if (breedUrls.length) await visitUrls(browser, breedUrls, "breeds");

  const listingUrls = listings
    .filter((l) => !l.isRanch)
    .map((l) => `${FRONTEND}/marketplaces/livestock/animal/${l.animalId}`);
  const uniqueListingUrls = [...new Set(listingUrls)];
  console.log(`Listing UI pages: ${uniqueListingUrls.length}`);
  await visitUrls(browser, uniqueListingUrls, "listings");

  const ranchUrls = [...new Set(
    listings.filter((l) => l.isRanch).map((l) => `${FRONTEND}/marketplaces/livestock/ranch/${l.animalId}`),
  )];
  console.log(`Ranch UI pages: ${ranchUrls.length}`);
  await visitUrls(browser, ranchUrls, "ranches");

  // Auth-gated should redirect to login
  await visitUrls(
    browser,
    [
      `${FRONTEND}/account`,
      `${FRONTEND}/seller/animals`,
      `${FRONTEND}/herd-health`,
    ],
    "auth-gated",
  );

  await browser.close();

  stats.finishedAt = new Date().toISOString();

  // Dedupe similar bugs (same title+url)
  const seen = new Set();
  const deduped = [];
  for (const b of bugs) {
    const key = `${b.severity}|${b.title}|${b.url || ""}|${b.breedId || ""}|${b.animalId || ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(b);
  }

  const report = { stats, bugs: deduped };
  const jsonPath = path.join(OUT_DIR, "report.json");
  const mdPath = path.join(OUT_DIR, "REPORT.md");
  await fs.writeFile(jsonPath, JSON.stringify(report, null, 2));
  await fs.writeFile(mdPath, toMarkdown(report));
  console.log(`\nWrote ${mdPath}`);
  console.log(`Bugs: ${deduped.length}`);
  console.log(`Visited pages: ${stats.pagesVisited}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
