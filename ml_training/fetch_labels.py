#!/usr/bin/env python3
"""
Download authorship triage labels from Grade-Forge (university admin API).

Usage:
  export GRADE_FORGE_TOKEN='Bearer eyJ...'   # or raw JWT without Bearer prefix
  python fetch_labels.py --base-url http://localhost:8080 --out labels.json

  python fetch_labels.py --base-url https://api.example.com --token-file ~/.grade-forge-jwt --out labels.json
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request


def _normalize_token(raw: str) -> str:
    raw = raw.strip()
    if raw.lower().startswith("bearer "):
        return raw[7:].strip()
    return raw


def main() -> int:
    p = argparse.ArgumentParser(description="Fetch authorship triage training labels from Grade-Forge.")
    p.add_argument("--base-url", default=os.environ.get("GRADE_FORGE_BASE_URL", "http://localhost:8080"), help="API origin, no trailing slash")
    p.add_argument("--out", default="labels_snapshot.json", help="Output JSON path")
    p.add_argument("--token", default=os.environ.get("GRADE_FORGE_TOKEN", ""), help="JWT (optional if GRADE_FORGE_TOKEN is set)")
    p.add_argument("--token-file", default="", help="Read JWT from this file (trimmed)")
    args = p.parse_args()

    token = args.token
    if args.token_file:
        with open(args.token_file, encoding="utf-8") as f:
            token = f.read()
    token = _normalize_token(token)
    if not token:
        print("error: set --token, --token-file, or GRADE_FORGE_TOKEN", file=sys.stderr)
        return 1

    base = args.base_url.rstrip("/")
    url = f"{base}/api/v1/university_admin/authorship-triage-training"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}", "Accept": "application/json"})

    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            body = resp.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")
        print(f"error: HTTP {e.code} {e.reason}\n{detail}", file=sys.stderr)
        return 1
    except urllib.error.URLError as e:
        print(f"error: {e.reason}", file=sys.stderr)
        return 1

    try:
        data = json.loads(body)
    except json.JSONDecodeError as e:
        print(f"error: invalid JSON: {e}", file=sys.stderr)
        return 1

    if not isinstance(data, list):
        print("error: expected a JSON array from the API", file=sys.stderr)
        return 1

    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
        f.write("\n")

    print(f"wrote {len(data)} rows to {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
