"""
Upload changed files to FTP and delete removed images.

Reads scripts/admin/_changed.json (written by apply_change.py).
Always also uploads data/index.json (rebuilt on every run).
"""

import ftplib
import json
import os
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
CHANGED_FILE = REPO_ROOT / "scripts" / "admin" / "_changed.json"


def connect() -> ftplib.FTP:
    host = os.environ["FTP_HOST"]
    port = int(os.environ.get("FTP_PORT", "21"))
    user = os.environ["FTP_USER"]
    pwd = os.environ["FTP_PASS"]
    ftp = ftplib.FTP()
    ftp.connect(host, port, timeout=60)
    ftp.login(user, pwd)
    ftp.set_pasv(True)
    ftp.encoding = "utf-8"
    return ftp


def cwd_root(ftp: ftplib.FTP) -> None:
    root = os.environ.get("FTP_ROOT", "/").rstrip("/") or "/"
    ftp.cwd(root)


def ensure_dirs(ftp: ftplib.FTP, rel_path: str) -> None:
    """Make sure all parent dirs of rel_path exist (relative to current cwd)."""
    parts = rel_path.split("/")[:-1]
    saved = ftp.pwd()
    for part in parts:
        if not part:
            continue
        try:
            ftp.cwd(part)
        except ftplib.error_perm:
            try:
                ftp.mkd(part)
            except ftplib.error_perm:
                pass
            ftp.cwd(part)
    ftp.cwd(saved)


def upload_file(ftp: ftplib.FTP, rel_path: str) -> None:
    local = REPO_ROOT / rel_path
    if not local.exists():
        print(f"  · skip (no local file): {rel_path}")
        return
    ensure_dirs(ftp, rel_path)
    with local.open("rb") as f:
        ftp.storbinary(f"STOR {rel_path}", f)
    print(f"  ✓ uploaded {rel_path}")


def delete_file(ftp: ftplib.FTP, rel_path: str) -> None:
    try:
        ftp.delete(rel_path)
        print(f"  ✗ deleted {rel_path}")
    except ftplib.error_perm as e:
        print(f"  · could not delete {rel_path}: {e}")


def main() -> None:
    if not CHANGED_FILE.exists():
        print("No _changed.json — nothing to deploy")
        return
    data = json.loads(CHANGED_FILE.read_text(encoding="utf-8"))

    upload = list(dict.fromkeys(data.get("upload", []) + ["data/index.json"]))
    delete = data.get("delete", [])

    ftp = connect()
    cwd_root(ftp)
    print(f"Connected to {os.environ['FTP_HOST']}, cwd={ftp.pwd()}")

    for rel in upload:
        upload_file(ftp, rel)
    for rel in delete:
        delete_file(ftp, rel)

    ftp.quit()
    # Clean local marker so it doesn't get committed
    try:
        CHANGED_FILE.unlink()
    except FileNotFoundError:
        pass


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"FTP deploy failed: {e}", file=sys.stderr)
        sys.exit(1)
