# TangleSolve project handoff

Last updated: 28 October 2026. This file records the context needed to resume the project without the original chat.

## Goal and published result

The user asked to recover the archived TangleSolve site, preserve as much original material as possible, and remake its Java application as a modern web app hosted on GitHub. The target is the [2 February 2004 Wayback home-page capture](https://web.archive.org/web/20040202121735/http://bio.math.berkeley.edu/TangleSolve/). The accompanying article is [Saka and Vázquez, *Bioinformatics* 18(7), 1011–1012 (2002)](https://academic.oup.com/bioinformatics/article/18/7/1011/256711); the [PDF](https://academic.oup.com/bioinformatics/article-pdf/18/7/1011/48859786/bioinformatics_18_7_1011.pdf) includes the application figure.

- Repository: <https://github.com/lakigigar/TangleSolve> (public, `main` branch).
- Historical reconstruction: <https://lakigigar.github.io/TangleSolve/>.
- Modern web app: <https://lakigigar.github.io/TangleSolve/app/>.
- GitHub Pages publishes `docs/` from `main`. `docs/.nojekyll` is present.
- All supplied originals are kept in `wayback/`; generated site files are in `docs/`.

The site was created and successfully deployed from this workspace. The user opened the published historical site and app in their browser. No edits are pending as of this handoff.

## What is in the repository

| Path | Purpose |
| --- | --- |
| `wayback/` | User-supplied saved pages, images, frameset material, and the historical standalone `GInterface.jar`. Preserve the originals. |
| `scripts/build_site.py` | Builds ten historical pages in `docs/`, rewrites their internal links, copies 171 assets, extracts 102 knot-table images from the JAR, and generates `docs/app/knot-images.js`. |
| `scripts/fetch_wayback.py` | CDX-based downloader for indexed captures. Intended to write `archive/captures/`, `archive/snapshot/`, and manifests. Archive access failed in this environment; there is no downloaded `archive/` yet. |
| `docs/app/solver.js` | Browser port of the rational-tangle arithmetic and non-processive solver from the recovered 2001 Java source. Also handles processive examples, candidate sets, and grouping of equivalent outside-tangle representations. |
| `docs/app/tangle-svg.js` | SVG drawing code ported from `graphics/GTools.java`, `TangleGraph.java`, and `FPlatGraph.java` in the JAR. |
| `docs/app/main.js`, `index.html`, `style.css` | Three-pane browser interface and interactions. |
| `tests/solver.test.mjs`, `tests/fixtures/java-xer-7.txt` | Nine automated checks, including a fixture produced from the original Java solver. |
| `research/site-inventory.md` | Original pages, sources, recovered assets, and missing assets. |
| `research/web-app-status.md` | Implemented features, caveats, and outstanding work. |

The modern app accepts 4-plat vectors, classifying fractions, Conway symbols, `#N` crossing-number sets (0–10), and semicolon-separated candidate sets. It handles non-processive and processive inputs, optional unknown product order for up to six rounds, direct rational-tangle entry, generated tangle and 4-plat drawings, and recovered knot-table images where available. The combined equation illustration remains schematic.

## The 16-versus-12 Xer result

The saved `wayback/tsolvefigure.jpg` and Figure 1 of the paper show input `(1,4,1)` for the right-handed six-crossing torus link and a product with seven crossings. The figure reports seven possible products and **12 solutions: six with a rational outside tangle O and six with O as a sum of two rational tangles**. The recovered **2001** standalone JAR produces 16 raw solution representations for this input: ten rational and six sums. A Java-derived fixture in `tests/fixtures/java-xer-7.txt` records all 16; the browser's raw `solveByCrossings` agrees with it up to equivalent 4-plat fraction labels.

The four extra rational entries are duplicate splits of the same outside tangle, with the same substrate, product, and recombinant twist. For example, `O = 0 + (-6/5)` and `O = 4/5 + (-2)` both equal `-6/5`. Four such pairs reduce ten rational representations to six mechanisms; the six nonrational sums remain distinct. `collapseOutsideTangles` in `solver.js` applies this grouping to the displayed non-processive result and retains the original splits in `representations`. The app therefore shows 12 for the paper's Xer example.

This explains the numbers exactly and is strongly supported by the paper figure and recovered code. **It is still an inference about the 2004 applet implementation**: `GInterface1.jar` and `GInterface2.jar` have not been recovered, so their actual grouping code cannot be inspected.

## Missing historical files and links

The user saved `applet1.html` and `applet2.html`, but neither page contains the applet bytecode. Their `ARCHIVE` attributes point to JARs in the same original directories. The following Wayback URLs are targets inferred from the page paths and capture times; availability was not verified:

- [`applet1/GInterface1.jar`](https://web.archive.org/web/20040206215532id_/http://bio.math.berkeley.edu/TangleSolve/applet1/GInterface1.jar)
- [`applet2/GInterface2.jar`](https://web.archive.org/web/20040206220131id_/http://bio.math.berkeley.edu/TangleSolve/applet2/GInterface2.jar)

Also missing: `3knots.gif` from the original `knots.html` and `tmodel/synaptic_complex.jpg` from the tangle-model text. The standalone `wayback/GInterface.jar` is recovered; it is identical to the copy the user had in Downloads. It contains 244 ZIP entries, including 34 `.java` files, 73 `.class` files, and 104 images. The 102 named knot-table JPGs were extracted for the web app. The table artwork is complete through eight crossings and partial for nine and ten; missing entries use generated SVG 4-plats. The historical pages retain Wayback links where an original file is absent.

## Validation and limits

Run `node --test tests/solver.test.mjs` (nine tests passing as of this handoff), `node --check docs/app/main.js`, and `python3 scripts/build_site.py` after asset changes. A static-link audit found zero missing **local** references in `docs/`. The deployed historical and app URLs returned HTTP 200, and GitHub Pages deployment completed successfully.

Browser interaction was not visually automated in this workspace: opening a local HTTP server and headless browser failed under sandbox restrictions. SVG samples were rendered and inspected, and representative SVG outputs were checked for invalid numbers. A human browser review is still useful, particularly for mobile layouts, the knot-table dialog, processive inputs, and the full planar meaning of generated diagrams.

Scientific limits: the paper assumes 4-plat substrate/product knots and links, a zero parental tangle, an integral recombinant twist, and rational tangles or sums of rational tangles. The app is a reconstruction of that restricted model, not a general DNA mechanism solver. The rational-R processive branch is labeled experimental because it corrects an apparent failure in the recovered `solve3` code and lacks independent validation. The 2006 [TopoICE-R paper](https://academic.oup.com/bioinformatics/article/22/14/1790/227088) reports that its methods could find some solutions TangleSolve missed and offered 3D manipulation; it also noted TangleSolve's strength in multiple systems/processive analysis. Later work continued to use tangle methods for Xer recombination, such as this [2013 study](https://pmc.ncbi.nlm.nih.gov/articles/PMC3876235/). A candidate topology is a hypothesis to compare with biological data, not proof of a molecular 3D mechanism.

The paper says its standard knot diagrams were adapted from Rolfsen with permission. Review image redistribution rights before broad reuse beyond this historical reconstruction.

## Sensible next steps

1. Perform a human browser review of the published app and fix any interaction or rendering issues.
2. Add transparent solver explanations: display the equations checked for each candidate, the assumptions used, and why equivalent splits were grouped. Preserve raw representations for reproducibility.
3. Build more independent solver fixtures from the recovered Java source and published examples; validate the experimental processive branch separately.
4. Replace the schematic combined equation with a connected planar diagram if the Java `EqGraph` behavior can be ported reliably.
5. If the missing applet JARs appear, compare their source and output against the 2001 archive and revisit the inferred 12-solution grouping.
6. For a larger research project, investigate broader tangle classes, 3D visualization, and uncertainty or experimental constraints. Such extensions need mathematical and biological validation.

## How to continue work

Edit `docs/app/` for the browser app; edit `scripts/build_site.py` when adding archived files, then rebuild. Run the tests and inspect changes. Commit and push to `main`; GitHub Pages deploys automatically from `docs/`. Update this handoff and the two focused research files when new evidence changes a conclusion. The original `wayback/` files should remain untouched.
