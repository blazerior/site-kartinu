"""
Apply an admin change to data/paintings.json (the single source of truth).

Reads PAYLOAD env var (JSON from repository_dispatch client_payload).
Actions:
  add            — add a painting to an existing series (+ move uploaded image)
  remove         — remove a painting from a series (+ delete unreferenced images)
  add_series     — create a new series (uploaded image becomes its cover)
  remove_series  — delete a whole series, its page and unreferenced images

HTML pages are NOT touched here — generate.py re-renders them from JSON.
Writes scripts/admin/_changed.json seed for ftp_deploy.py.
"""

import html
import json
import os
import re
import shutil
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
DATA_FILE = REPO_ROOT / "data" / "paintings.json"
IMAGES_DIR = REPO_ROOT / "images"
UPLOADS_DIR = REPO_ROOT / "_uploads"
CHANGED_FILE = REPO_ROOT / "scripts" / "admin" / "_changed.json"

BAD_FILENAME_CHARS = '<>:"/\\|?*'


# ─────────────────────────── helpers ───────────────────────────

def sanitize_filename(name: str) -> str:
    cleaned = "".join(c for c in name if c not in BAD_FILENAME_CHARS).strip()
    return cleaned or "untitled"


def load_payload() -> dict:
    return json.loads(os.environ.get("PAYLOAD", "{}"))


def load_data() -> dict:
    return json.loads(DATA_FILE.read_text(encoding="utf-8"))


def save_data(data: dict) -> None:
    DATA_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def save_changed(uploaded: list, deleted: list) -> None:
    CHANGED_FILE.write_text(
        json.dumps({"upload": sorted(set(uploaded)), "delete": sorted(set(deleted))},
                   ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def find_series(data: dict, sid: str) -> dict:
    for s in data["series"]:
        if s["id"] == sid:
            return s
    sys.exit(f"Unknown series: {sid}")


def norm_title(t: str) -> str:
    t = t.lower()
    for ch in '«»"“”':
        t = t.replace(ch, "")
    return " ".join(t.replace("-", " ").split())


def all_referenced_images(data: dict) -> set:
    refs = set()
    for s in data["series"]:
        if s.get("hero_image"):
            refs.add(s["hero_image"])
        if s.get("video"):
            refs.add(s["video"].get("src", ""))
            refs.add(s["video"].get("poster", ""))
        for w in s["works"]:
            refs.update(w["images"])
    refs.discard("")
    return refs


def move_upload(upload_name: str, target_stem: str) -> str:
    """Move a file from _uploads/ into images/, return relative path."""
    src = UPLOADS_DIR / upload_name
    if not src.exists():
        sys.exit(f"Uploaded file not found: {src}")
    ext = src.suffix.lower() or ".jpg"
    dst = IMAGES_DIR / (sanitize_filename(target_stem) + ext)
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    shutil.move(str(src), str(dst))
    return f"images/{dst.name}"


def recompute_years(series: dict) -> None:
    """Refresh the series year range from its works (e.g. '2022–2025')."""
    years = sorted({int(y) for w in series["works"]
                    for y in re.findall(r"\d{4}", str(w.get("year", "")))})
    if not years:
        return
    series["years"] = str(years[0]) if years[0] == years[-1] else f"{years[0]}–{years[-1]}"


def paragraphs_to_html(text: str) -> str:
    parts = [p.strip() for p in re.split(r"\n\s*\n|\n", text) if p.strip()]
    return "\n".join(f"<p>{html.escape(p)}</p>" for p in parts)


# ─────────────────────────── actions ───────────────────────────

def add_painting(data: dict, p: dict) -> tuple[list, list]:
    s = find_series(data, p["series"])
    title = p["title"].strip()
    if any(norm_title(w["title"]) == norm_title(title) for w in s["works"]):
        sys.exit(f"Painting already exists in series: {title}")
    img = move_upload(p["upload"], title)
    s["works"].append({
        "title": title,
        "i18n": None,
        "material": p["material"].strip(),
        "size": (p.get("size") or "").strip() or None,
        "year": str(p["year"]).strip(),
        "images": [img],
        "description_html": (paragraphs_to_html(p["description"])
                             if p.get("description", "").strip() else None),
    })
    recompute_years(s)
    return [img], []


def remove_painting(data: dict, p: dict) -> tuple[list, list]:
    s = find_series(data, p["series"])
    title = p["title"].strip()
    for i, w in enumerate(s["works"]):
        if norm_title(w["title"]) == norm_title(title):
            removed = s["works"].pop(i)
            break
    else:
        sys.exit(f"Painting not found in series: {title}")
    recompute_years(s)

    still_used = all_referenced_images(data)
    deleted = []
    for img in removed["images"]:
        if img not in still_used:
            f = REPO_ROOT / img
            if f.exists():
                f.unlink()
            deleted.append(img)
    return [], deleted


def add_series(data: dict, p: dict) -> tuple[list, list]:
    sid = p["id"].strip().lower()
    if not re.fullmatch(r"[a-z][a-z0-9-]{1,30}", sid):
        sys.exit(f"Bad series id (use latin letters/digits/dashes): {sid}")
    if any(s["id"] == sid for s in data["series"]):
        sys.exit(f"Series id already exists: {sid}")
    title = p["title"].strip()
    materials = p["material"].strip()
    hero = move_upload(p["upload"], f"{title} обложка")
    data["series"].append({
        "id": sid,
        "page": f"series-{sid}.html",
        "i18n_key": f"series.{sid}",
        "title": title,
        "title_en": None,
        "meta_description": f"Серия «{title}» — Екатерина Лаптева. {materials}.",
        "years": str(p.get("years") or "").strip(),
        "materials": materials,
        "materials_en": None,
        "hero_image": hero,
        "description_html": paragraphs_to_html(p.get("description", "")),
        "video": None,
        "works": [],
    })
    return [hero], []


def remove_series(data: dict, p: dict) -> tuple[list, list]:
    s = find_series(data, p["series"])
    data["series"] = [x for x in data["series"] if x["id"] != s["id"]]

    deleted = [s["page"]]
    page_file = REPO_ROOT / s["page"]
    if page_file.exists():
        page_file.unlink()

    still_used = all_referenced_images(data)
    candidates = set(s.get("hero_image") and [s["hero_image"]] or [])
    for w in s["works"]:
        candidates.update(w["images"])
    for img in candidates:
        if img not in still_used:
            f = REPO_ROOT / img
            if f.exists():
                f.unlink()
            deleted.append(img)
    return [], deleted


# ───────────────────────────── main ────────────────────────────

def main() -> None:
    payload = load_payload()
    if not payload:
        sys.exit("Empty payload")
    data = load_data()

    action = payload.get("action")
    handlers = {
        "add": add_painting,
        "remove": remove_painting,
        "add_series": add_series,
        "remove_series": remove_series,
    }
    if action not in handlers:
        sys.exit(f"Unknown action: {action}")

    uploaded, deleted = handlers[action](data, payload)
    save_data(data)
    save_changed(uploaded, deleted)
    print(f"OK. action={action} upload={uploaded} deleted={deleted}")


if __name__ == "__main__":
    main()
