"""
One-off extractor: parse existing HTML pages into data/paintings.json.

Source of truth after this runs is paintings.json; pages are then
re-generated from it by generate.py. Series-page values win over
index-carousel values when they conflict.

Run from repo root:  python scripts/admin/extract_data.py
"""

import json
import re
import sys
from pathlib import Path

from bs4 import BeautifulSoup

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
DATA_FILE = REPO_ROOT / "data" / "paintings.json"

# id -> page file (order = order of sections on index.html)
SERIES_PAGES = [
    ("fate",     "series-fate.html"),
    ("dutch",    "series-dutch.html"),
    ("wind",     "series-wind.html"),
    ("egg",      "series-egg.html"),
    ("life",     "series-life.html"),
    ("miracle",  "series-miracle.html"),
    ("graphics", "series-graphics.html"),
    ("lucism",   "series-lucism.html"),
    ("music",    "series-music.html"),
    ("ceramics", "series-ceramica.html"),
]


def soup_of(name: str) -> BeautifulSoup:
    return BeautifulSoup((REPO_ROOT / name).read_text(encoding="utf-8"), "html.parser")


def inner_html(el) -> str:
    return "".join(str(c) for c in el.contents).strip()


def parse_series_translations(html_text: str) -> dict:
    """Parse window.SERIES_TRANSLATIONS={ru:{...},en:{...}} from inline JS."""
    m = re.search(r"window\.SERIES_TRANSLATIONS\s*=\s*\{(.*)\};", html_text, re.S)
    if not m:
        return {"ru": {}, "en": {}}
    body = m.group(1)
    result = {"ru": {}, "en": {}}
    for lang in ("ru", "en"):
        lm = re.search(lang + r"\s*:\s*\{((?:[^{}])*)\}", body)
        if not lm:
            continue
        pairs = re.findall(r"'((?:[^'\\]|\\.)*)'\s*:\s*'((?:[^'\\]|\\.)*)'", lm.group(1))
        result[lang] = {k.replace("\\'", "'"): v.replace("\\'", "'") for k, v in pairs}
    return result


def extract_series_page(sid: str, page: str) -> dict:
    text = (REPO_ROOT / page).read_text(encoding="utf-8")
    soup = BeautifulSoup(text, "html.parser")

    h1 = soup.select_one(".series-hero-title")
    title = h1.get_text(strip=True)
    i18n_key = h1.get("data-i18n")

    hero_img = soup.select_one(".series-hero-bg img")
    hero_image = hero_img.get("src") if hero_img else None

    meta_desc_el = soup.find("meta", attrs={"name": "description"})
    meta_description = meta_desc_el.get("content") if meta_desc_el else ""

    years_el = soup.select_one(".desc-meta-value")
    years = years_el.get_text(strip=True) if years_el else ""

    mat_el = soup.find(attrs={"data-i18n": "meta.material.val"})
    materials = mat_el.get_text(strip=True) if mat_el else ""

    desc_el = soup.select_one(".desc-text")
    description_html = inner_html(desc_el) if desc_el else ""

    tr = parse_series_translations(text)
    title_en = None  # series title EN lives in script.js global dict, keep key only
    materials_en = tr["en"].get("meta.material.val")

    video = None
    v = soup.select_one(".wind-video video")
    if v:
        src_el = v.find("source")
        video = {
            "src": src_el.get("src") if src_el else v.get("src"),
            "poster": v.get("poster"),
            "caption": (soup.select_one(".wind-video-caption").get_text(strip=True)
                        if soup.select_one(".wind-video-caption") else "Процесс · видео"),
        }

    works = []
    for item in soup.select(".work-item"):
        wtitle = item.select_one(".work-title").get_text(strip=True)
        rows = {}
        for row in item.select(".work-detail-row"):
            key = row.select_one(".work-detail-key")
            val = row.select_one(".work-detail-val")
            if key and val:
                rows[key.get("data-i18n", key.get_text(strip=True))] = val.get_text(strip=True)
        main = item.select_one(".work-main-img img")
        images = [main.get("src")] if main else []
        for th in item.select(".work-thumb"):
            s = th.get("data-src")
            if s and s not in images:
                images.append(s)
        wdesc = item.select_one(".work-description")
        works.append({
            "title": wtitle,
            "i18n": None,  # filled from index carousel below
            "material": rows.get("detail.material", ""),
            "size": rows.get("detail.size") or None,
            "year": rows.get("detail.year", ""),
            "images": images,
            "description_html": inner_html(wdesc) if wdesc else None,
        })

    return {
        "id": sid,
        "page": page,
        "i18n_key": i18n_key,
        "title": title,
        "title_en": title_en,
        "meta_description": meta_description,
        "years": years,
        "materials": materials,
        "materials_en": materials_en,
        "hero_image": hero_image,
        "description_html": description_html,
        "video": video,
        "works": works,
    }


def _norm_title(t: str) -> str:
    """Normalize for fuzzy matching: case, quotes, dashes, extra spaces."""
    t = t.lower()
    for ch in '«»"“”':
        t = t.replace(ch, "")
    t = t.replace("-", " ").replace("—", " ").replace("–", " ")
    return " ".join(t.split())


def attach_index_i18n(series_list: list) -> None:
    """Pull per-card i18n prefixes (card.X.N) from index.html carousels."""
    soup = soup_of("index.html")
    by_id = {s["id"]: s for s in series_list}
    for art in soup.select("article.series[data-series]"):
        sid = art.get("data-series")
        s = by_id.get(sid)
        if not s:
            continue
        titles = {_norm_title(w["title"]): w for w in s["works"]}
        for card in art.select(".card"):
            tspan = card.select_one('[data-i18n$=".title"]')
            if not tspan:
                continue
            card_title = tspan.get_text(strip=True)
            prefix = tspan.get("data-i18n", "").rsplit(".", 1)[0]
            w = titles.get(_norm_title(card_title))
            if w is not None and prefix:
                w["i18n"] = prefix
            else:
                print(f"  ⚠ index card not found on page ({sid}): {card_title!r}")


def main() -> None:
    series_list = []
    for sid, page in SERIES_PAGES:
        if not (REPO_ROOT / page).exists():
            sys.exit(f"Missing page: {page}")
        s = extract_series_page(sid, page)
        series_list.append(s)
        print(f"✓ {sid}: {len(s['works'])} works"
              + (", video" if s["video"] else ""))

    attach_index_i18n(series_list)

    data = {
        "base_url": "https://ekaterina-lapteva.com/",
        "series": series_list,
    }
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    DATA_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    total = sum(len(s["works"]) for s in series_list)
    print(f"\nWrote {DATA_FILE.relative_to(REPO_ROOT)}: {len(series_list)} series, {total} works")


if __name__ == "__main__":
    main()
