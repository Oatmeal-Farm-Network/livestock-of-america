/**
 * Playwright UI audit for Livestock Knowledgebase staging.
 * Usage: npx playwright test --config=scripts/playwright.kb.config.js
 * Or:    node scripts/ui_audit_kb.mjs
 */
import { chromium, devices } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FE = process.env.LOA_FE || 'https://livestock-frontend-staging-1087130530284.us-central1.run.app';
const OUT = path.join(__dirname, 'audit_output', 'ui');
fs.mkdirSync(OUT, { recursive: true });

const SPECIES = [
  'alpacas','bison','buffalo','camels','cattle','chickens','crocodiles','deer','dogs',
  'donkeys','ducks','emus','geese','goats','guinea-fowl','honey-bees','horses','llamas',
  'musk-ox','ostriches','pheasants','pigs','pigeons','quails','rabbits','sheep','snails',
  'turkeys','yaks',
];

function collectConsole(page, bag) {
  page.on('console', (msg) => {
    if (['error', 'warning'].includes(msg.type())) {
      bag.push({ type: msg.type(), text: msg.text() });
    }
  });
  page.on('pageerror', (err) => bag.push({ type: 'pageerror', text: String(err) }));
  page.on('response', (res) => {
    if (res.status() >= 400 && /\/api\/livestock|\/images\//.test(res.url())) {
      bag.push({ type: 'http', status: res.status(), url: res.url() });
    }
  });
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false });
}

async function auditViewport(browser, label, viewport, deviceDescriptor) {
  const context = deviceDescriptor
    ? await browser.newContext({ ...deviceDescriptor })
    : await browser.newContext({ viewport });
  const page = await context.newPage();
  const consoleBag = [];
  collectConsole(page, consoleBag);
  const result = {
    viewport: label,
    pages: [],
    console: [],
    speciesCards: null,
    searchWorks: null,
    breadcrumbs: [],
    brokenSpeciesNav: [],
    breedSamples: [],
  };

  // Landing / livestock index
  await page.goto(`${FE}/livestock`, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(1500);
  await shot(page, `${label}-01-livestock-index`);

  const cards = page.locator('a[href^="/livestock/"]');
  const cardCount = await cards.count();
  // Prefer species card links that are exactly /livestock/:slug
  const speciesLinks = await page.evaluate(() => {
    return [...document.querySelectorAll('a[href^="/livestock/"]')]
      .map((a) => a.getAttribute('href'))
      .filter((h) => /^\/livestock\/[a-z0-9-]+$/.test(h));
  });
  const uniqueSpecies = [...new Set(speciesLinks)];
  result.speciesCards = { linkCount: cardCount, uniqueSpecies: uniqueSpecies.length, slugs: uniqueSpecies };

  // Search
  const search = page.locator('input[type="search"], input[placeholder*="Search" i]').first();
  if (await search.count()) {
    await search.fill('cattle');
    await page.waitForTimeout(500);
    const visibleText = await page.locator('body').innerText();
    result.searchWorks = /cattle/i.test(visibleText);
    await shot(page, `${label}-02-search-cattle`);
    await search.fill('');
    await page.waitForTimeout(300);
  } else {
    result.searchWorks = false;
  }

  // Visit every species page (list), sample breeds on a few
  const sampleSpeciesForBreeds = ['cattle', 'alpacas', 'chickens', 'llamas', 'emus', 'sheep', 'horses'];
  for (const slug of SPECIES) {
    const pageResult = { slug, ok: false, title: null, breedCards: 0, letterNav: false, error: null, aboutOk: null };
    try {
      await page.goto(`${FE}/livestock/${slug}`, { waitUntil: 'networkidle', timeout: 90000 });
      await page.waitForTimeout(800);
      pageResult.ok = true;
      pageResult.title = await page.locator('h1').first().innerText().catch(() => null);
      pageResult.letterNav = (await page.locator('button').filter({ hasText: /^[A-Z]$/ }).count()) > 0;
      pageResult.breedCards = await page.locator(`a[href*="/livestock/${slug}/breed/"]`).count();
      // broken images on species page
      pageResult.brokenImages = await page.evaluate(() => {
        return [...document.images].filter((img) => !img.complete || img.naturalWidth === 0).map((img) => img.src);
      });
      if (sampleSpeciesForBreeds.includes(slug)) {
        await shot(page, `${label}-species-${slug}`);
      }
      // About page
      await page.goto(`${FE}/livestock/${slug}/about`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(500);
      pageResult.aboutOk = !(await page.locator('body').innerText()).toLowerCase().includes('not found');

      // Sample first breed link if any (from species page)
      await page.goto(`${FE}/livestock/${slug}`, { waitUntil: 'networkidle', timeout: 90000 });
      await page.waitForTimeout(600);
      const firstBreed = page.locator(`a[href*="/livestock/${slug}/breed/"]`).first();
      if (await firstBreed.count()) {
        const href = await firstBreed.getAttribute('href');
        await page.goto(`${FE}${href}`, { waitUntil: 'networkidle', timeout: 90000 });
        await page.waitForTimeout(700);
        const crumbs = await page.locator('nav, [class*="breadcrumb" i], a').evaluateAll((els) =>
          els.map((e) => e.textContent?.trim()).filter(Boolean).slice(0, 20)
        );
        const breedTitle = await page.locator('h1').first().innerText().catch(() => null);
        const broken = await page.evaluate(() =>
          [...document.images].filter((img) => !img.complete || img.naturalWidth === 0).map((img) => img.src)
        );
        const descLen = await page.evaluate(() => document.body.innerText.length);
        const sample = { slug, href, breedTitle, brokenImages: broken, descLen };
        result.breedSamples.push(sample);
        if (sampleSpeciesForBreeds.includes(slug)) {
          await shot(page, `${label}-breed-${slug}`);
        }
        // Back nav via breadcrumb / all breeds button
        const back = page.locator(`a[href="/livestock/${slug}"]`).first();
        if (await back.count()) {
          await back.click();
          await page.waitForTimeout(500);
          result.breadcrumbs.push({ slug, backWorked: page.url().includes(`/livestock/${slug}`) });
        }
      }
    } catch (e) {
      pageResult.ok = false;
      pageResult.error = String(e);
      result.brokenSpeciesNav.push({ slug, error: String(e) });
    }
    result.pages.push(pageResult);
    console.log(`[${label}] ${slug}: ok=${pageResult.ok} breeds=${pageResult.breedCards} err=${pageResult.error || ''}`);
  }

  result.console = consoleBag.slice(0, 200);
  await context.close();
  return result;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const report = {
    frontend: FE,
    startedAt: new Date().toISOString(),
    viewports: {},
  };

  report.viewports.desktop = await auditViewport(browser, 'desktop', { width: 1440, height: 900 });
  report.viewports.tablet = await auditViewport(browser, 'tablet', { width: 768, height: 1024 });
  report.viewports.mobile = await auditViewport(
    browser,
    'mobile',
    null,
    devices['iPhone 13']
  );

  fs.writeFileSync(path.join(OUT, 'ui_audit_report.json'), JSON.stringify(report, null, 2));

  // Markdown summary
  const lines = [
    '# Livestock Knowledgebase UI Audit',
    '',
    `Frontend: \`${FE}\``,
    '',
  ];
  for (const [vp, data] of Object.entries(report.viewports)) {
    const okPages = data.pages.filter((p) => p.ok).length;
    const failPages = data.pages.filter((p) => !p.ok);
    const withBreeds = data.pages.filter((p) => p.breedCards > 0).length;
    const zeroBreeds = data.pages.filter((p) => p.ok && p.breedCards === 0).map((p) => p.slug);
    lines.push(`## ${vp}`);
    lines.push(`- Species pages OK: **${okPages}/29**`);
    lines.push(`- Species with breed cards: **${withBreeds}**`);
    lines.push(`- Zero breed cards: ${zeroBreeds.join(', ') || 'none'}`);
    lines.push(`- Search works: **${data.searchWorks}**`);
    lines.push(`- Unique species links on index: **${data.speciesCards?.uniqueSpecies}**`);
    lines.push(`- Console/HTTP issues captured: **${data.console.length}**`);
    if (failPages.length) {
      lines.push(`- Failed pages: ${failPages.map((p) => `${p.slug} (${p.error})`).join('; ')}`);
    }
    lines.push('');
  }
  fs.writeFileSync(path.join(OUT, 'UI_AUDIT.md'), lines.join('\n'));
  await browser.close();
  console.log('UI audit complete ->', OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
