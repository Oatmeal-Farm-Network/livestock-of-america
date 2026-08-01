#!/usr/bin/env python3
"""Livestock Knowledgebase data audit against staging API + frontend assets."""

from __future__ import annotations

import concurrent.futures
import json
import re
import sys
import time
import urllib.error
import urllib.request
from collections import Counter, defaultdict
from html.parser import HTMLParser
from pathlib import Path

API = sys.argv[1] if len(sys.argv) > 1 else (
    "https://oatmeal-livestock-staging-1087130530284.us-central1.run.app"
)
FRONTEND = sys.argv[2] if len(sys.argv) > 2 else (
    "https://livestock-frontend-staging-1087130530284.us-central1.run.app"
)
OUT_DIR = Path(__file__).resolve().parent / "audit_output"

PLACEHOLDER_HINTS = (
    "placeholder", "lorem ipsum", "todo", "coming soon", "tbd",
    "n/a", "no description", "description not available", "under construction",
)
SECTION_HEADINGS = [
    "overview", "origin", "history", "characteristics", "appearance", "size",
    "weight", "coat", "color", "temperament", "climate", "production", "milk",
    "meat", "wool", "fiber", "egg", "uses", "advantages", "disadvantages",
    "health", "lifespan", "management", "feeding", "breeding", "conservation",
    "interesting facts",
]

FRONTEND_IMAGES = {
    "alpacas": "/images/Alpaca.webp",
    "bison": "/images/Bison.webp",
    "buffalo": "/images/Buffalo.webp",
    "camels": "/images/Camels.webp",
    "cattle": "/images/Cattle.webp",
    "chickens": "/images/Chicken.webp",
    "crocodiles": "/images/Alligator.webp",
    "deer": "/images/DeerHeader.webp",
    "dogs": "/images/Dogs.webp",
    "donkeys": "/images/Donkeys.webp",
    "ducks": "/images/Duck.webp",
    "emus": "/images/Emu.webp",
    "geese": "/images/Geese.webp",
    "goats": "/images/Goats.webp",
    "guinea-fowl": "/images/Guineafowl.webp",
    "honey-bees": "/images/HoneyBees.webp",
    "horses": "/images/cowboy2.webp",
    "llamas": "/images/Llama2.webp",
    "musk-ox": "/images/muskox.webp",
    "ostriches": "/images/Ostrich.webp",
    "pheasants": "/images/Pheasant.webp",
    "pigs": "/images/Pig.webp",
    "pigeons": "/images/Pigeon.webp",
    "quails": "/images/Quail.webp",
    "rabbits": "/images/Rabitts.webp",
    "sheep": "/images/Sheepbreeds.webp",
    "snails": "/images/Snail.webp",
    "turkeys": "/images/Turkey.webp",
    "yaks": "/images/YakHeader.webp",
}


class TextStripper(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts: list[str] = []

    def handle_data(self, data: str) -> None:
        self.parts.append(data)

    def get_text(self) -> str:
        return re.sub(r"\s+", " ", " ".join(self.parts)).strip()


def http_json(url: str, timeout: int = 90):
    req = urllib.request.Request(url, headers={"User-Agent": "loa-kb-audit/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def http_status(url: str, timeout: int = 20) -> int:
    req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": "loa-kb-audit/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status
    except urllib.error.HTTPError as e:
        return e.code
    except Exception:
        try:
            req = urllib.request.Request(
                url, headers={"User-Agent": "loa-kb-audit/1.0", "Range": "bytes=0-0"}
            )
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return resp.status
        except urllib.error.HTTPError as e:
            return e.code
        except Exception:
            return 0


def strip_html(html: str | None) -> str:
    if not html:
        return ""
    p = TextStripper()
    try:
        p.feed(html)
        return p.get_text()
    except Exception:
        return re.sub(r"<[^>]+>", " ", html or "")


def content_flags(html: str | None) -> list[str]:
    flags = []
    text = strip_html(html)
    lower = text.lower()
    if not text:
        flags.append("empty_description")
    elif len(text) < 80:
        flags.append("very_short_description")
    elif len(text) < 200:
        flags.append("short_description")
    for hint in PLACEHOLDER_HINTS:
        if hint in lower:
            flags.append(f"placeholder:{hint}")
    return flags


def section_coverage(html: str | None) -> dict:
    text = strip_html(html).lower()
    found = [s for s in SECTION_HEADINGS if s in text]
    return {"found": found, "missing_count": len(SECTION_HEADINGS) - len(found)}


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    started = time.time()
    report: dict = {
        "api": API,
        "frontend": FRONTEND,
        "started_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "species": [],
        "summary": {},
        "issues": {
            "missing_species_images_frontend": [],
            "zero_breed_species": [],
            "duplicate_breed_names": [],
            "missing_breed_images": [],
            "broken_breed_images": [],
            "empty_descriptions": [],
            "short_descriptions": [],
            "placeholder_content": [],
            "species_api_errors": [],
            "frontend_species_image_checks": [],
            "about_thin": [],
        },
    }

    print(f"API: {API}\nFE: {FRONTEND}")
    counts = http_json(f"{API}/api/livestock/counts")
    slug_counts = counts.get("counts") or {}
    report["summary"]["total_breeds_api"] = counts.get("total", 0)
    report["summary"]["species_count_api"] = len(slug_counts)

    print("Checking frontend species card images...")
    for slug, path in FRONTEND_IMAGES.items():
        status = http_status(f"{FRONTEND}{path}")
        ok = status in (200, 206)
        entry = {"slug": slug, "path": path, "status": status, "ok": ok}
        report["issues"]["frontend_species_image_checks"].append(entry)
        if not ok:
            report["issues"]["missing_species_images_frontend"].append(entry)
            print(f"  MISSING species image: {slug} {path} -> {status}")

    all_breeds: list[dict] = []
    image_urls: dict[str, list[dict]] = defaultdict(list)

    for i, (slug, expected) in enumerate(sorted(slug_counts.items()), 1):
        print(f"[{i}/{len(slug_counts)}] {slug} (count={expected})")
        species_entry = {
            "slug": slug,
            "count_api": expected,
            "breeds_fetched": 0,
            "letters": [],
            "species_info": None,
            "about_ok": None,
            "duplicates": [],
            "errors": [],
        }
        try:
            letters_payload = http_json(f"{API}/api/livestock/species/{slug}/letters")
            species_entry["letters"] = letters_payload.get("letters") or []
            species_entry["species_info"] = letters_payload.get("species_info")
            species_entry["total_breeds_letters"] = letters_payload.get("total_breeds")
        except Exception as e:
            species_entry["errors"].append(f"letters: {e}")
            report["issues"]["species_api_errors"].append({"slug": slug, "stage": "letters", "error": str(e)})

        if expected == 0:
            report["issues"]["zero_breed_species"].append(slug)

        try:
            about = http_json(f"{API}/api/livestock/about/{slug}")
            about_html = about.get("about_html") or ""
            species_entry["about_ok"] = bool(strip_html(about_html))
            species_entry["about_sections"] = len(about.get("sections") or [])
            if not species_entry["about_ok"]:
                report["issues"]["about_thin"].append(slug)
            if about.get("main_image"):
                image_urls[about["main_image"]].append({"type": "species_main", "slug": slug})
        except Exception as e:
            species_entry["about_ok"] = False
            species_entry["errors"].append(f"about: {e}")
            report["issues"]["about_thin"].append(slug)

        breeds = []
        try:
            letters = species_entry.get("letters") or []
            if expected >= 26 and letters:
                for letter in letters:
                    try:
                        page = http_json(
                            f"{API}/api/livestock/species/{slug}?letter={letter}&lang=en"
                        )
                        breeds.extend(page.get("breeds") or [])
                    except Exception as e:
                        report["issues"]["species_api_errors"].append(
                            {"slug": slug, "stage": f"letter={letter}", "error": str(e)}
                        )
            else:
                page = http_json(f"{API}/api/livestock/species/{slug}?lang=en")
                breeds = page.get("breeds") or []
        except Exception as e:
            species_entry["errors"].append(f"species: {e}")
            report["issues"]["species_api_errors"].append(
                {"slug": slug, "stage": "species", "error": str(e)}
            )

        by_id = {b.get("breed_id"): b for b in breeds}
        breeds = list(by_id.values())
        species_entry["breeds_fetched"] = len(breeds)

        name_map = defaultdict(list)
        for b in breeds:
            name = (b.get("breed") or "").strip().lower()
            if name:
                name_map[name].append(b.get("breed_id"))
        for name, ids in name_map.items():
            if len(ids) > 1:
                dup = {"slug": slug, "breed": name, "breed_ids": ids}
                species_entry["duplicates"].append(dup)
                report["issues"]["duplicate_breed_names"].append(dup)

        for b in breeds:
            breed_id = b.get("breed_id")
            name = (b.get("breed") or "").strip()
            image = b.get("image")
            desc = b.get("description")
            flags = content_flags(desc)
            record = {
                "species": slug,
                "breed_id": breed_id,
                "breed": name,
                "image": image,
                "has_image": bool(image),
                "description_len": len(strip_html(desc)),
                "flags": flags,
                "section_coverage": section_coverage(desc),
            }
            all_breeds.append(record)
            if not image:
                report["issues"]["missing_breed_images"].append(
                    {"species": slug, "breed_id": breed_id, "breed": name}
                )
            else:
                image_urls[image].append(
                    {"type": "breed", "species": slug, "breed_id": breed_id, "breed": name}
                )
            if "empty_description" in flags:
                report["issues"]["empty_descriptions"].append(record)
            elif "very_short_description" in flags or "short_description" in flags:
                report["issues"]["short_descriptions"].append(record)
            if any(f.startswith("placeholder:") for f in flags):
                report["issues"]["placeholder_content"].append(record)

        report["species"].append(species_entry)

    print(f"Checking {len(image_urls)} unique image URLs...")
    broken = []

    def check_one(url: str):
        return url, http_status(url)

    with concurrent.futures.ThreadPoolExecutor(max_workers=24) as pool:
        for url, status in pool.map(check_one, list(image_urls.keys())):
            if status not in (200, 206):
                refs = image_urls[url]
                broken.append(
                    {"url": url, "status": status, "refs": refs[:5], "ref_count": len(refs)}
                )

    report["issues"]["broken_breed_images"] = broken

    # LOTW recovery sample (slow, first 25 broken)
    lotw_ok = 0
    lotw_checked = 0
    for item in broken[:25]:
        name = item["url"].rsplit("/", 1)[-1]
        lotw = f"https://livestockoftheworld.com/uploads/{name}"
        lotw_checked += 1
        st = http_status(lotw)
        if st in (200, 206):
            lotw_ok += 1
        time.sleep(0.25)

    with_images = sum(1 for b in all_breeds if b["has_image"])
    report["summary"].update(
        {
            "breeds_fetched": len(all_breeds),
            "breeds_with_image_field": with_images,
            "breeds_missing_image_field": len(all_breeds) - with_images,
            "broken_image_urls": len(broken),
            "lotw_recovery_sample": f"{lotw_ok}/{lotw_checked}",
            "empty_descriptions": len(report["issues"]["empty_descriptions"]),
            "short_descriptions": len(report["issues"]["short_descriptions"]),
            "placeholder_content": len(report["issues"]["placeholder_content"]),
            "duplicate_name_groups": len(report["issues"]["duplicate_breed_names"]),
            "zero_breed_species": report["issues"]["zero_breed_species"],
            "about_thin": report["issues"]["about_thin"],
            "api_errors": len(report["issues"]["species_api_errors"]),
            "frontend_species_images_broken": len(
                report["issues"]["missing_species_images_frontend"]
            ),
            "elapsed_sec": round(time.time() - started, 1),
        }
    )

    (OUT_DIR / "audit_report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    (OUT_DIR / "all_breeds.json").write_text(json.dumps(all_breeds, indent=2), encoding="utf-8")

    missing_csv = ["species,breed_id,breed"]
    for row in report["issues"]["missing_breed_images"]:
        missing_csv.append(
            f'{row["species"]},{row["breed_id"]},"{(row["breed"] or "").replace(chr(34), "")}"'
        )
    (OUT_DIR / "missing_images.csv").write_text("\n".join(missing_csv), encoding="utf-8")

    s = report["summary"]
    md = [
        "# Livestock Knowledgebase Data Audit",
        "",
        f"- API: `{API}`",
        f"- Frontend: `{FRONTEND}`",
        f"- Elapsed: {s['elapsed_sec']}s",
        "",
        "## Totals",
        f"- Species: **{s['species_count_api']}**",
        f"- Total breeds: **{s['total_breeds_api']}**",
        f"- Breeds fetched: **{s['breeds_fetched']}**",
        f"- With image field: **{s['breeds_with_image_field']}**",
        f"- Missing image field: **{s['breeds_missing_image_field']}**",
        f"- Broken image URLs: **{s['broken_image_urls']}**",
        f"- LOTW recovery sample: **{s['lotw_recovery_sample']}**",
        f"- Empty descriptions: **{s['empty_descriptions']}**",
        f"- Short descriptions: **{s['short_descriptions']}**",
        f"- Duplicate name groups: **{s['duplicate_name_groups']}**",
        f"- Zero-breed species: **{', '.join(s['zero_breed_species']) or 'none'}**",
        f"- API errors: **{s['api_errors']}**",
        "",
        "## Per-species",
        "",
        "| Species | Count | Fetched | Dupes | About |",
        "|---|---:|---:|---:|:---:|",
    ]
    for sp in report["species"]:
        md.append(
            f"| {sp['slug']} | {sp['count_api']} | {sp['breeds_fetched']} | "
            f"{len(sp['duplicates'])} | {'Y' if sp.get('about_ok') else 'N'} |"
        )
    md.append("")
    md.append("## Data model note")
    md.append(
        "Breed detail is a single HTML `Breeddescription` field — not separate "
        "Origin/History/Temperament columns."
    )
    (OUT_DIR / "AUDIT_REPORT.md").write_text("\n".join(md), encoding="utf-8")
    print("\n=== SUMMARY ===")
    print(json.dumps(s, indent=2))
    print(f"Wrote {OUT_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
