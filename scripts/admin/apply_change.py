"""
Apply add/remove painting change.

Reads PAYLOAD env var (JSON from repository_dispatch client_payload).
Modifies index.html + series-*.html, moves uploaded image into images/.

Tracks changed files in scripts/admin/_changed.json so ftp_deploy.py
knows what to upload/delete on FTP.
"""

import json
import os
import re
import shutil
import sys
from pathlib import Path

from bs4 import BeautifulSoup

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
IMAGES_DIR = REPO_ROOT / "images"
UPLOADS_DIR = REPO_ROOT / "_uploads"
CHANGED_FILE = REPO_ROOT / "scripts" / "admin" / "_changed.json"

SERIES_FILES = {
    "fate":     "series-fate.html",
    "dutch":    "series-dutch.html",
    "wind":     "series-wind.html",
    "egg":      "series-egg.html",
    "life":     "series-life.html",
    "miracle":  "series-miracle.html",
    "graphics": "series-graphics.html",
    "lucism":   "series-lucism.html",
    "music":    "series-music.html",
    "ceramics": "series-ceramica.html",
}

BAD_FILENAME_CHARS = '<>:"/\\|?*'


def sanitize_filename(name: str) -> str:
    cleaned = "".join(c for c in name if c not in BAD_FILENAME_CHARS).strip()
    return cleaned or "untitled"


def load_payload() -> dict:
    raw = os.environ.get("PAYLOAD", "{}")
    return json.loads(raw)


def save_changed(uploaded: list, deleted: list) -> None:
    CHANGED_FILE.write_text(
        json.dumps({"upload": sorted(set(uploaded)), "delete": sorted(set(deleted))}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def read_html(p: Path) -> BeautifulSoup:
    return BeautifulSoup(p.read_text(encoding="utf-8"), "html.parser")


def write_html(p: Path, soup: BeautifulSoup, total: int | None = None) -> None:
    html = str(soup)
    if total is not None:
        html = re.sub(
            r"('meta\.works\.count'\s*:\s*')\d+(')",
            rf"\g<1>{total}\g<2>",
            html,
        )
    p.write_text(html, encoding="utf-8")


# ───────────────────────────── ADD ─────────────────────────────

def add_painting(p: dict) -> tuple[list, list]:
    series = p["series"]
    title = p["title"].strip()
    material = p["material"].strip()
    size = p["size"].strip()
    year = str(p["year"]).strip()
    upload_name = p["upload"]  # filename in _uploads/

    if series not in SERIES_FILES:
        sys.exit(f"Unknown series: {series}")

    src = UPLOADS_DIR / upload_name
    if not src.exists():
        sys.exit(f"Uploaded file not found: {src}")

    ext = src.suffix.lower() or ".jpg"
    new_name = sanitize_filename(title) + ext
    dst = IMAGES_DIR / new_name
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    shutil.move(str(src), str(dst))

    img_path = f"images/{new_name}"

    series_file = REPO_ROOT / SERIES_FILES[series]
    _add_to_series_html(series_file, title, material, size, year, img_path)
    _add_to_index_carousel(series, title, material, size, year, img_path)

    return [
        "index.html",
        SERIES_FILES[series],
        img_path,
    ], []


def _add_to_series_html(fp: Path, title: str, material: str, size: str, year: str, img_path: str) -> None:
    soup = read_html(fp)
    works_list = soup.select_one(".works-list")
    if works_list is None:
        sys.exit(f"No .works-list in {fp.name}")

    n = len(works_list.select(".work-item")) + 1
    article_html = f'''
      <article class="work-item reveal" id="work-{n}">
        <div class="work-images"><div class="work-main-img"><img src="{img_path}" alt="{title}" loading="lazy" id="main-w{n}" /></div></div>
        <div class="work-info"><p class="work-number">{n:02d} / {n:02d}</p><h2 class="work-title">«{title}»</h2>
          <div class="work-details">
            <div class="work-detail-row"><span class="work-detail-key" data-i18n="detail.material">Материал</span><span class="work-detail-val">{material}</span></div>
            <div class="work-detail-row"><span class="work-detail-key" data-i18n="detail.size">Размер</span><span class="work-detail-val">{size}</span></div>
            <div class="work-detail-row"><span class="work-detail-key" data-i18n="detail.year">Год</span><span class="work-detail-val">{year}</span></div>
          </div>
        </div>
      </article>
    '''
    works_list.append(BeautifulSoup(article_html, "html.parser"))

    total = _renumber_series(soup)
    write_html(fp, soup, total=total)


def _add_to_index_carousel(series: str, title: str, material: str, size: str, year: str, img_path: str) -> None:
    fp = REPO_ROOT / "index.html"
    soup = read_html(fp)
    series_el = soup.select_one(f'.series[data-series="{series}"]')
    if series_el is None:
        sys.exit(f"Series '{series}' not found in index.html")
    carousel = series_el.select_one(".carousel")
    card_html = f'''
            <div class="card" role="listitem">
              <img src="{img_path}" alt="{title}" loading="lazy" />
              <p class="card-caption">{title} · {material} · {size} · {year}</p>
            </div>'''
    carousel.append(BeautifulSoup(card_html, "html.parser"))
    write_html(fp, soup)


# ─────────────────────────── REMOVE ────────────────────────────

def remove_painting(p: dict) -> tuple[list, list]:
    series = p["series"]
    title = p["title"].strip()
    if series not in SERIES_FILES:
        sys.exit(f"Unknown series: {series}")

    series_file = REPO_ROOT / SERIES_FILES[series]
    img_rel = _remove_from_series_html(series_file, title)
    _remove_from_index_carousel(series, title)

    deleted = []
    upload = ["index.html", SERIES_FILES[series]]
    if img_rel:
        full = REPO_ROOT / img_rel
        if full.exists():
            full.unlink()
        deleted.append(img_rel)
    return upload, deleted


def _remove_from_series_html(fp: Path, title: str) -> str | None:
    soup = read_html(fp)
    img_path = None
    for w in soup.select(".work-item"):
        wt = w.select_one(".work-title")
        if not wt:
            continue
        if wt.get_text(strip=True).strip("«»") == title:
            img = w.select_one(".work-main-img img")
            if img:
                img_path = img.get("src")
            w.decompose()
            break
    total = _renumber_series(soup)
    write_html(fp, soup, total=total)
    return img_path


def _remove_from_index_carousel(series: str, title: str) -> None:
    fp = REPO_ROOT / "index.html"
    soup = read_html(fp)
    series_el = soup.select_one(f'.series[data-series="{series}"]')
    if series_el is None:
        return
    for card in series_el.select(".card"):
        cap = card.select_one(".card-caption")
        if not cap:
            continue
        first_text = ""
        for child in cap.contents:
            txt = child.get_text(strip=True) if hasattr(child, "get_text") else str(child).strip()
            if txt:
                first_text = txt
                break
        if first_text == title:
            card.decompose()
            break
    write_html(fp, soup)


# ──────────────────────── HELPERS ──────────────────────────────

def _renumber_series(soup: BeautifulSoup) -> int:
    works = soup.select(".work-item")
    total = len(works)
    for i, w in enumerate(works, 1):
        num = w.select_one(".work-number")
        if num:
            num.string = f"{i:02d} / {total:02d}"
    meta_count = soup.find(attrs={"data-i18n": "meta.works.count"})
    if meta_count:
        meta_count.string = str(total)
    return total


# ─────────────────────────── MAIN ──────────────────────────────

def main() -> None:
    payload = load_payload()
    if not payload:
        sys.exit("Empty payload")
    action = payload.get("action")
    if action == "add":
        upload, deleted = add_painting(payload)
    elif action == "remove":
        upload, deleted = remove_painting(payload)
    else:
        sys.exit(f"Unknown action: {action}")

    save_changed(upload, deleted)
    print(f"OK. action={action} upload={upload} deleted={deleted}")


if __name__ == "__main__":
    main()
