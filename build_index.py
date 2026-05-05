"""
Rebuild data/index.json from current HTML files.

Frontend reads this to populate series + paintings dropdowns.
"""

import json
from pathlib import Path

from bs4 import BeautifulSoup

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
OUT_FILE = REPO_ROOT / "data" / "index.json"

SERIES = [
    ("fate",     "series-fate.html",     "Судьба человека"),
    ("dutch",    "series-dutch.html",    "Голландский натюрморт"),
    ("wind",     "series-wind.html",     "Ветер"),
    ("egg",      "series-egg.html",      "В начале было яйцо"),
    ("life",     "series-life.html",     "Форма жизни"),
    ("miracle",  "series-miracle.html",  "Чудесное"),
    ("graphics", "series-graphics.html", "Графика"),
    ("lucism",   "series-lucism.html",   "Люсизм"),
    ("music",    "series-music.html",    "Музыка в красках"),
    ("ceramics", "series-ceramica.html", "Керамика"),
]


def read(p: Path) -> BeautifulSoup:
    return BeautifulSoup(p.read_text(encoding="utf-8"), "html.parser")


def main() -> None:
    out = {"series": []}
    for sid, fname, default_title in SERIES:
        fp = REPO_ROOT / fname
        if not fp.exists():
            continue
        soup = read(fp)
        title_el = soup.select_one(".series-hero-title")
        title = title_el.get_text(strip=True) if title_el else default_title

        works = []
        for w in soup.select(".work-item"):
            t = w.select_one(".work-title")
            if not t:
                continue
            works.append(t.get_text(strip=True).strip("«»"))

        out["series"].append({
            "id": sid,
            "title": title,
            "file": fname,
            "paintings": works,
        })

    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUT_FILE.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {OUT_FILE.relative_to(REPO_ROOT)} with {sum(len(s['paintings']) for s in out['series'])} paintings")


if __name__ == "__main__":
    main()
