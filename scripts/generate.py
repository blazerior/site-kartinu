"""
Static site generator: data/paintings.json -> HTML pages.

Renders:
  * series-*.html            (one page per series, from series_page.html.j2)
  * index.html               (only the .series-list block, between markers)
  * sitemap.xml              (index + cv + all series pages)
  * data/index.json          (compact catalog for the admin UI dropdowns)

Files whose content actually changed are appended to
scripts/admin/_changed.json so ftp_deploy.py uploads them.

Run from repo root:  python scripts/admin/generate.py
"""

import copy
import json
import re
import sys
from datetime import date
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape
from markupsafe import Markup

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
DATA_FILE = REPO_ROOT / "data" / "paintings.json"
INDEX_JSON = REPO_ROOT / "data" / "index.json"
CHANGED_FILE = REPO_ROOT / "scripts" / "admin" / "_changed.json"
TEMPLATES = Path(__file__).resolve().parent / "templates"

START_MARK = "<!-- GENERATED:SERIES:START -->"
END_MARK = "<!-- GENERATED:SERIES:END -->"

env = Environment(
    loader=FileSystemLoader(str(TEMPLATES)),
    autoescape=select_autoescape(["html", "j2"]),
    keep_trailing_newline=True,
)


def load_data() -> dict:
    return json.loads(DATA_FILE.read_text(encoding="utf-8"))


def mark_html_safe(series: dict) -> dict:
    """Wrap trusted stored-HTML fields so autoescape leaves them intact."""
    s = copy.deepcopy(series)
    s["description_html"] = Markup(s.get("description_html") or "")
    for w in s["works"]:
        if w.get("description_html"):
            w["description_html"] = Markup(w["description_html"])
    return s


def write_if_changed(path: Path, content: str, changed: list) -> None:
    rel = path.relative_to(REPO_ROOT).as_posix()
    old = path.read_text(encoding="utf-8") if path.exists() else None
    if old == content:
        return
    path.write_text(content, encoding="utf-8")
    changed.append(rel)
    print(f"  ✎ {rel}")


def render_series_pages(data: dict, changed: list) -> None:
    tpl = env.get_template("series_page.html.j2")
    for s in data["series"]:
        html = tpl.render(s=mark_html_safe(s), base_url=data["base_url"])
        write_if_changed(REPO_ROOT / s["page"], html, changed)


def render_index_block(data: dict, changed: list) -> None:
    fp = REPO_ROOT / "index.html"
    text = fp.read_text(encoding="utf-8")
    tpl = env.get_template("index_series.html.j2")
    block = tpl.render(series=[mark_html_safe(s) for s in data["series"]]).strip("\n")
    inner = f"{START_MARK}\n{block}\n{END_MARK}"

    if START_MARK in text and END_MARK in text:
        new_text = re.sub(
            re.escape(START_MARK) + r".*?" + re.escape(END_MARK),
            lambda _: inner,
            text,
            flags=re.S,
        )
    else:
        # Bootstrap: replace the inner content of .series-list once.
        m = re.search(
            r'(<div class="series-list">)(.*?)(</div><!-- /series-list -->)',
            text,
            re.S,
        )
        if not m:
            sys.exit("index.html: .series-list block not found and no markers present")
        new_text = text[: m.start(2)] + "\n" + inner + "\n    " + text[m.end(2):]

    if new_text != text:
        fp.write_text(new_text, encoding="utf-8")
        changed.append("index.html")
        print("  ✎ index.html (series block)")


def render_sitemap(data: dict, changed: list) -> None:
    base = data["base_url"]
    today = date.today().isoformat()
    entries = [(base, "1.0"), (base + "cv.html", "0.7")]
    entries += [(base + s["page"], "0.8") for s in data["series"]]
    urls = "\n".join(
        f"""  <url>
    <loc>{loc}</loc>
    <lastmod>{today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>{prio}</priority>
  </url>"""
        for loc, prio in entries
    )
    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{urls}
</urlset>
"""
    write_if_changed(REPO_ROOT / "sitemap.xml", xml, changed)


def render_admin_index(data: dict, changed: list) -> None:
    compact = {
        "series": [
            {"id": s["id"], "title": s["title"], "paintings": [w["title"] for w in s["works"]]}
            for s in data["series"]
        ]
    }
    content = json.dumps(compact, ensure_ascii=False, indent=2) + "\n"
    write_if_changed(INDEX_JSON, content, changed)


def merge_changed(changed: list) -> None:
    prev = {"upload": [], "delete": []}
    if CHANGED_FILE.exists():
        prev = json.loads(CHANGED_FILE.read_text(encoding="utf-8"))
    upload = list(dict.fromkeys(prev.get("upload", []) + changed))
    CHANGED_FILE.write_text(
        json.dumps({"upload": upload, "delete": prev.get("delete", [])},
                   ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def main() -> None:
    data = load_data()
    changed: list = []
    render_series_pages(data, changed)
    render_index_block(data, changed)
    render_sitemap(data, changed)
    render_admin_index(data, changed)
    merge_changed(changed)
    print(f"Done. {len(changed)} file(s) changed.")


if __name__ == "__main__":
    main()
