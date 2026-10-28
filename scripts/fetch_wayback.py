#!/usr/bin/env python3
"""Download all indexed TangleSolve captures and build a dated site snapshot."""

from __future__ import annotations

import argparse
from datetime import datetime
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path, PurePosixPath
import re
import sys
import time
from urllib import error, parse, request


SITE = "http://bio.math.berkeley.edu/TangleSolve/"
CDX = "https://web.archive.org/cdx/search/cdx"
TARGET = "20040202121735"
FIELDS = "urlkey,timestamp,original,mimetype,statuscode,digest,length".split(",")
CSS_URL = re.compile(r"url\(\s*['\"]?([^)'\"]+)", re.I)
CSS_IMPORT = re.compile(r"@import\s+['\"]([^'\"]+)", re.I)


def get(url: str) -> bytes:
    req = request.Request(url, headers={"User-Agent": "TangleSolve-site-preservation/1.0"})
    for attempt in range(4):
        try:
            with request.urlopen(req, timeout=60) as response:
                return response.read()
        except (error.URLError, TimeoutError) as exc:
            if attempt == 3:
                raise RuntimeError(f"{url}: {exc}") from exc
            time.sleep(2 ** attempt)
    raise AssertionError("unreachable")


def cdx(url: str, match: str, start: str | None, end: str | None):
    """Follow CDX resume keys so the index is not silently truncated."""
    params = {"url": url, "matchType": match, "output": "json", "fl": ",".join(FIELDS),
              "showResumeKey": "true", "limit": "1000"}
    if start:
        params["from"] = start
    if end:
        params["to"] = end
    used = set()
    while True:
        rows = json.loads(get(CDX + "?" + parse.urlencode(params)))
        if not rows:
            return
        if rows[0] != FIELDS:
            raise RuntimeError(f"Unexpected CDX header: {rows[0]!r}")
        resume = None
        if len(rows) >= 3 and rows[-2] == [] and len(rows[-1]) == 1:
            resume = rows[-1][0]
            rows = rows[:-2]
        for row in rows[1:]:
            if len(row) == len(FIELDS):
                yield dict(zip(FIELDS, row))
        if not resume:
            return
        if resume in used:
            raise RuntimeError("CDX repeated a resume key")
        used.add(resume)
        params["resumeKey"] = resume


def internal(url: str) -> bool:
    p = parse.urlsplit(url)
    return p.hostname == "bio.math.berkeley.edu" and (
        p.path == "/TangleSolve" or p.path.startswith("/TangleSolve/"))


def local_path(url: str) -> PurePosixPath:
    if not internal(url):
        raise ValueError("Outside target site: " + url)
    p = parse.urlsplit(url)
    decoded = parse.unquote(p.path)
    if not (decoded == "/TangleSolve" or decoded.startswith("/TangleSolve/")):
        raise ValueError("Unsafe encoded path: " + url)
    name = decoded.removeprefix("/TangleSolve").lstrip("/")
    if not name or name.endswith("/"):
        name += "index.html"
    parts = name.split("/")
    if any(part in ("", ".", "..") for part in parts) or "\\" in name:
        raise ValueError("Unsafe path: " + url)
    result = PurePosixPath(name)
    if p.query:
        tag = hashlib.sha256(p.query.encode()).hexdigest()[:12]
        result = result.with_name(f"{result.stem}__q_{tag}{result.suffix}")
    return result


class LinkParser(HTMLParser):
    def __init__(self, base: str):
        super().__init__(convert_charrefs=True)
        self.base = base
        self.links: set[str] = set()

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "base" and a.get("href"):
            self.base = parse.urljoin(self.base, a["href"])
        for key in ("href", "src", "data", "background", "action", "codebase", "code"):
            if a.get(key):
                self.links.add(parse.urljoin(self.base, a[key]))
        for value in (a.get("archive") or "").split(","):
            if value.strip():
                self.links.add(parse.urljoin(self.base, value.strip()))
        for value in (a.get("srcset") or "").split(","):
            if value.strip():
                self.links.add(parse.urljoin(self.base, value.strip().split()[0]))
        for value in CSS_URL.findall(a.get("style") or ""):
            self.links.add(parse.urljoin(self.base, value))
        if tag == "param" and a.get("value"):
            value = a["value"].strip()
            if "/" in value or re.search(r"\.(jar|class|gif|jpe?g|png)$", value, re.I):
                self.links.add(parse.urljoin(self.base, value))


def links(body: bytes, mime: str, original: str) -> set[str]:
    content = body.decode("utf-8", errors="replace")
    if "html" in mime:
        parser = LinkParser(original)
        parser.feed(content)
        return parser.links
    if "css" in mime:
        return {parse.urljoin(original, value) for value in CSS_URL.findall(content) + CSS_IMPORT.findall(content)}
    return set()


def save_json(path: Path, data: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_name(path.name + ".tmp")
    temp.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    temp.replace(path)


def key(url: str) -> str:
    p = parse.urlsplit(url)
    return f"{p.hostname}{parse.unquote(p.path)}?{p.query}"


def distance(stamp: str, target: str) -> float:
    fmt = "%Y%m%d%H%M%S"
    return abs((datetime.strptime(stamp, fmt) - datetime.strptime(target, fmt)).total_seconds())


def run(args) -> int:
    out = args.output.resolve()
    out.mkdir(parents=True, exist_ok=True)
    rows = list(cdx(SITE, "prefix", args.start, args.end))
    rows += list(cdx(SITE.rstrip("/"), "exact", args.start, args.end))
    records = sorted({(r["original"], r["timestamp"], r["statuscode"], r["digest"]): r
                      for r in rows}.values(), key=lambda r: (r["original"], r["timestamp"]))
    print(f"Indexed {len(records)} captures across {len({r['original'] for r in records})} URLs")
    manifest: list[dict] = []
    found_links: set[str] = set()
    for n, record in enumerate(records, 1):
        item = dict(record)
        try:
            relative = local_path(item["original"])
            path = out / "captures" / item["timestamp"] / relative
            replay = f"https://web.archive.org/web/{item['timestamp']}id_/{item['original']}"
            item.update(replay_url=replay, file=str(path.relative_to(out)))
            if item["statuscode"] == "200":
                if args.force or not path.exists():
                    body = get(replay)
                    path.parent.mkdir(parents=True, exist_ok=True)
                    temp = path.with_name(path.name + ".tmp")
                    temp.write_bytes(body)
                    temp.replace(path)
                body = path.read_bytes()
                item["bytes"] = len(body)
                if "html" in item["mimetype"] or "css" in item["mimetype"]:
                    item["links"] = sorted(links(body, item["mimetype"], item["original"]))
                    found_links.update(item["links"])
            else:
                item["note"] = "Indexed response was not HTTP 200"
        except (RuntimeError, OSError, ValueError) as exc:
            item["error"] = str(exc)
        manifest.append(item)
        if n % 25 == 0:
            save_json(out / "manifest.json", {"target": args.target, "captures": manifest})
        if n % 10 == 0 or n == len(records):
            print(f"Processed {n}/{len(records)}; errors: {sum('error' in x for x in manifest)}")
        if args.delay:
            time.sleep(args.delay)

    nearest: dict[str, dict] = {}
    for item in manifest:
        if "bytes" not in item:
            continue
        url_key = key(item["original"])
        if url_key not in nearest or distance(item["timestamp"], args.target) < distance(nearest[url_key]["timestamp"], args.target):
            nearest[url_key] = item
    snapshot = []
    for item in nearest.values():
        target_path = out / "snapshot" / local_path(item["original"])
        target_path.parent.mkdir(parents=True, exist_ok=True)
        target_path.write_bytes((out / item["file"]).read_bytes())
        snapshot.append({"original": item["original"], "timestamp": item["timestamp"], "file": str(target_path.relative_to(out))})
    downloaded = {key(item["original"]) for item in manifest if "bytes" in item}
    references = [{"url": url, "scope": "site" if internal(url) else "external", "captured": key(url) in downloaded}
                  for url in sorted(found_links) if parse.urlsplit(url).scheme in ("http", "https")]
    save_json(out / "manifest.json", {"target": args.target, "source": SITE, "captures": manifest, "snapshot": snapshot})
    save_json(out / "references.json", references)
    print(f"Saved {len(snapshot)} snapshot files; {sum(x['scope'] == 'site' and not x['captured'] for x in references)} internal references missing")
    return 1 if any("error" in item for item in manifest) else 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=Path(__file__).resolve().parents[1] / "archive")
    parser.add_argument("--target", default=TARGET, help="Snapshot date YYYYMMDDHHMMSS")
    parser.add_argument("--from", dest="start", help="Optional earliest capture year or date")
    parser.add_argument("--to", dest="end", help="Optional latest capture year or date")
    parser.add_argument("--delay", type=float, default=0.2, help="Seconds between replay requests")
    parser.add_argument("--force", action="store_true", help="Download existing files again")
    args = parser.parse_args()
    try:
        datetime.strptime(args.target, "%Y%m%d%H%M%S")
        return run(args)
    except (RuntimeError, error.URLError, ValueError, json.JSONDecodeError) as exc:
        print(f"Collection failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
