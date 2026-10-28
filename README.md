# TangleSolve site reconstruction

Static reconstruction of the historical TangleSolve website from user-supplied Wayback files. The requested [2 February 2004 Wayback capture](https://web.archive.org/web/20040202121735/http://bio.math.berkeley.edu/TangleSolve/) is the target reference.

The GitHub Pages-ready site is in [`docs/`](docs/). Start with [research/site-inventory.md](research/site-inventory.md) for recovered pages and remaining gaps. The original saved files are preserved in `wayback/`.

## Modern web app

[`docs/app/`](docs/app/) is a browser-based reconstruction. It accepts 4-plat vectors, fractions, Conway symbols, crossing-number sets, and alternative substrate or product candidates. It solves non-processive equations under the rational-tangle assumptions, handles processive examples, provides direct tangle input, and includes a knot table with images extracted from the recovered JAR. Solutions show exact fractions, generated rational-tangle projections, knot or link diagrams, and a schematic combined equation. Solver output has been compared with the recovered 2001 Java program, but the 2004 applet archives are still missing.

See [research/web-app-status.md](research/web-app-status.md) for implemented behavior, validation, and remaining work. The Xer example has been compared with the recovered 2001 Java program; its output differs from the 2004 applet screenshot.

The app is static and needs no server code. To preview locally, run `python3 -m http.server 8000 --directory docs` and open `http://localhost:8000/app/`. Run `node --test tests/solver.test.mjs` for the current solver checks.

To rebuild the static site after adding more archived files, install `beautifulsoup4` and run `python3 scripts/build_site.py`. This also extracts the recovered knot-table images into the modern app. GitHub Pages can publish from the `docs/` folder on the repository's default branch. The recovered Java application is offered as a download; modern browsers do not execute its historical applets.

When Internet Archive access is available, run:

```sh
python3 scripts/fetch_wayback.py
```

The script uses the Internet Archive [CDX API](https://github.com/internetarchive/wayback/blob/master/wayback-cdx-server/README.md) to enumerate **all indexed captures** under the original TangleSolve path, follows pagination keys, and downloads every HTTP 200 capture into `archive/captures/<timestamp>/`. It creates `archive/snapshot/` using the nearest available capture for each URL to 2 February 2004. `archive/manifest.json` records capture dates, original URLs, replay URLs, and failures. `archive/references.json` lists links found in archived HTML/CSS and marks internal links for which no file was downloaded. Re-running skips already downloaded files; use `--force` to refresh them. Use `--from 2002 --to 2005` to restrict capture dates or `--output /path` for another destination.

The script has not yet been able to contact Wayback from this workspace because the archive host cannot be resolved here. It cannot retrieve unindexed files or resources on other hosts automatically; those appear in the references report for follow-up.
