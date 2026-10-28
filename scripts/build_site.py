#!/usr/bin/env python3
"""Build a static GitHub Pages reconstruction from the saved Wayback files."""

from __future__ import annotations

import os
from pathlib import Path
import re
import shutil
from urllib.parse import unquote, urljoin, urlsplit
from zipfile import ZipFile
import json

from bs4 import BeautifulSoup


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "wayback"
DEST = ROOT / "docs"
ORIGIN = "http://bio.math.berkeley.edu/TangleSolve/"
CAPTURE = "20040202121735"
PAGES = {
    "5bb283b9-be6c-4cc6-b85e-8e80a11c108d.htm": "index.html",
    "tutorial.html": "tutorial.html",
    "knots.html": "knots.html",
    "people.html": "people.html",
    "references.html": "references.html",
    "applet1.html": "applet1/applet1.html",
    "applet2.html": "applet2/applet2.html",
    "frames2.htm": "tmodel/frames2.htm",
    "Frameset 2_files/frconten.html": "tmodel/frconten.htm",
    "Frameset 2_files/tmodel.html": "tmodel/tmodel.html",
}
FILES = {
    "local.jpg": "local.jpg",
    "tangleq.jpg": "tangleq.jpg",
    "gr_interface.jpg": "gr_interface.jpg",
    "rsnew/GInterface.jar": "rsnew/GInterface.jar",
    "tsolvefigure.jpg": "tsolvefigure.jpg",
    "4plat.jpg": "4plat.jpg",
    "inputarea.jpg": "inputarea.jpg",
    "table.jpg": "table.jpg",
    "solns.jpg": "solns.jpg",
}
MODEL_ASSETS = {
    "tmodel/" + path.name
    for path in (SOURCE / "Frameset 2_files").iterdir()
    if path.suffix.lower() in (".gif", ".jpg", ".jpeg", ".png")
}
WAYBACK = re.compile(r"(?:https?://web\.archive\.org)?/web/\d+(?:[a-z_]+)?/(.+)")


def original_url(value: str, page_url: str) -> str:
    match = WAYBACK.match(value)
    if match:
        value = match.group(1)
    if value.startswith("mailto:"):
        return value
    return urljoin(page_url, value)


def rewrite(value: str, page_url: str, output: Path) -> str:
    if not value or value.startswith(("#", "javascript:", "data:")):
        return value
    for name in ("local.jpg", "tangleq.jpg"):
        if value.endswith("_files/" + name):
            return os.path.relpath(DEST / name, output.parent).replace(os.sep, "/")
    original = original_url(value, page_url)
    if original.startswith("mailto:"):
        return original
    parsed = urlsplit(original)
    if parsed.hostname == "bio.math.berkeley.edu" and parsed.path == "/TangleSolve":
        return os.path.relpath(DEST / "index.html", output.parent).replace(os.sep, "/")
    if parsed.hostname == "bio.math.berkeley.edu" and parsed.path.startswith("/TangleSolve/"):
        relative = unquote(parsed.path[len("/TangleSolve/"):])
        if not relative:
            relative = "index.html"
        if relative in FILES or relative in PAGES.values() or relative in MODEL_ASSETS:
            return os.path.relpath(DEST / relative, output.parent).replace(os.sep, "/") + (f"#{parsed.fragment}" if parsed.fragment else "")
        if value.startswith("/web/"):
            return "https://web.archive.org" + value
        return value if "web.archive.org" in value else f"https://web.archive.org/web/{CAPTURE}/{original}"
    return value if "web.archive.org" in value else original


def clean(source: Path, output: Path) -> None:
    soup = BeautifulSoup(source.read_text(encoding="utf-8", errors="replace"), "html.parser")
    for element in soup.select("script, link[rel=stylesheet], #wm-ipp-base, #wm-ipp-print, #pp-extension-root, #a11y-status-message"):
        element.decompose()
    for comment in soup.find_all(string=lambda x: getattr(x, "name", None) is None and "WAYBACK TOOLBAR" in str(x)):
        comment.extract()
    if soup.head:
        for meta in soup.head.find_all("meta", attrs={"http-equiv": "Content-Security-Policy"}):
            meta.decompose()
        charset = soup.new_tag("meta", charset="utf-8")
        soup.head.insert(0, charset)
    page_url = ORIGIN + output.relative_to(DEST).as_posix()
    if output.name == "index.html" and output.parent == DEST:
        page_url = ORIGIN
    for tag in soup.find_all(True):
        for attribute in ("href", "src", "background", "action", "archive"):
            if tag.get(attribute):
                tag[attribute] = rewrite(tag[attribute], page_url, output)
    if output.parent.name.startswith("applet"):
        for tag in soup.find_all(["object", "embed", "applet"]):
            tag.decompose()
        note = soup.new_tag("p")
        note.string = "This historical Java applet is unavailable in modern browsers. The recovered standalone application archive is linked below."
        link = soup.new_tag("a", href="../rsnew/GInterface.jar")
        link.string = "Download GInterface.jar"
        if soup.body:
            soup.body.insert(0, link)
            soup.body.insert(0, note)
    if output == DEST / "index.html" and soup.body:
        callout = soup.new_tag("div")
        callout["style"] = "max-width:780px;margin:12px auto;padding:12px 18px;border:1px solid #b6ddd3;background:#f3fbf8;font:14px Arial,sans-serif;text-align:center"
        callout.string = "A modern, browser-based reconstruction is underway: "
        app_link = soup.new_tag("a", href="app/index.html")
        app_link.string = "Open the TangleSolve web app"
        callout.append(app_link)
        soup.body.insert(0, callout)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text("<!doctype html>\n" + str(soup), encoding="utf-8")


def main() -> None:
    DEST.mkdir(exist_ok=True)
    for source, target in PAGES.items():
        clean(SOURCE / source, DEST / target)
    images = SOURCE / "5bb283b9-be6c-4cc6-b85e-8e80a11c108d_files"
    for source, target in FILES.items():
        input_file = SOURCE / source
        if source in ("local.jpg", "tangleq.jpg"):
            input_file = images / source
        if source == "rsnew/GInterface.jar":
            input_file = SOURCE / "GInterface.jar"
        output_file = DEST / target
        output_file.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(input_file, output_file)
    for relative in MODEL_ASSETS:
        shutil.copyfile(SOURCE / "Frameset 2_files" / Path(relative).name, DEST / relative)
    knot_images = []
    image_dir = DEST / "app" / "knot-images"
    image_dir.mkdir(parents=True, exist_ok=True)
    with ZipFile(SOURCE / "GInterface.jar") as archive:
        for name in archive.namelist():
            if not name.startswith("graphics/images/") or not name.lower().endswith(".jpg"):
                continue
            filename = Path(name).name
            match = re.fullmatch(r"(\d+)-\((-?\d+),(-?\d+)\)\.jpg", filename)
            if not match:
                continue
            (image_dir / filename).write_bytes(archive.read(name))
            knot_images.append({"file": filename, "crossings": int(match[1]), "n": int(match[2]), "d": int(match[3])})
    (DEST / "app" / "knot-images.js").write_text("export const knotImages = " + json.dumps(knot_images) + ";\n", encoding="utf-8")
    (DEST / ".nojekyll").touch()
    print(f"Built {len(PAGES)} pages and {len(FILES) + len(MODEL_ASSETS) + len(knot_images)} assets in {DEST}")


if __name__ == "__main__":
    main()
