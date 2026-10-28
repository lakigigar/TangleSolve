# TangleSolve historical site inventory

## Capture and evidence status

- **Target:** `http://bio.math.berkeley.edu/TangleSolve/`, Wayback timestamp `20040202121735` (2 February 2004).
- **Direct archive access:** still unavailable in this workspace, but the user supplied saved Wayback files in `wayback/`. They include the original home page, supporting pages and images, and the standalone Java archive. The local static reconstruction is in `docs/`.
- **Verified sources:** the [2002 Bioinformatics article](https://academic.oup.com/bioinformatics/article/18/7/1011/256711), its [PDF](https://academic.oup.com/bioinformatics/article-pdf/18/7/1011/48859786/bioinformatics_18_7_1011.pdf), [PubMed record](https://pubmed.ncbi.nlm.nih.gov/12117800/), and a [course handout that names original site paths](https://homepage.divms.uiowa.edu/~idarcy/COURSES/96/SPRING10/Software_KnotPlot_TangleSolve2.pdf). The handout is later than the target capture, so its paths are leads rather than proof of the 2004 navigation.

## Known original addresses

| Address | Evidence | Status |
| --- | --- | --- |
| `http://bio.math.berkeley.edu/TangleSolve/` | Original 2 February 2004 home page saved locally | Recovered |
| `http://bio.math.berkeley.edu/TangleSolve/tutorial.html` | Original 3 February 2004 page saved locally | Recovered with all five embedded images |
| `http://bio.math.berkeley.edu/TangleSolve/tmodel/frames2.htm` | Original 3 February 2004 frameset and later-saved frame contents | Recovered with 60 model figures |
| `http://bio.math.berkeley.edu/TangleSolve/people.html` | Original 3 February 2004 page saved locally | Recovered |
| `http://bio.math.berkeley.edu/TangleSolve/references.html` | Original 3 February 2004 page saved locally | Recovered; three saved copies are identical |
| `http://bio.math.berkeley.edu/TangleSolve/knots.html` | Original 6 February 2004 page saved locally | Text recovered; `3knots.gif` missing |
| `/TangleSolve/applet1/applet1.html`, `/TangleSolve/applet2/applet2.html` | Original 6 February 2004 pages saved locally | HTML recovered; their `GInterface1.jar` and `GInterface2.jar` files missing |
| `/TangleSolve/rsnew/GInterface.jar` | Home-page download link; supplied JAR | Recovered; historical standalone application |

## Material recovered from the saved files

- The home page has a white background, centered title, an introduction, two figures (`local.jpg`, `tangleq.jpg`), a screenshot link, links to the tangle model, tutorial, and references, installation instructions, two applet options, the application JAR, and a people/acknowledgements page. It identifies Yuki Saka as maintainer.
- The tutorial explains the three application panes; non-processive, processive and tangle-diagram input tabs; entry formats; the knot table; and an Xer recombination worked example.
- The tangle-model section contains a table-of-contents frame and a long mathematical explanation. Sixty figure files were supplied with it.
- `GInterface.jar` contains 244 entries: 34 `.java` source files, 73 `.class` files, and 104 image files. Its source is valuable for a future browser-based functional port. The static site currently offers it as a historical download; the Java applet itself is not running in modern browsers.
- The modern browser app in `docs/app/` ports the rational-tangle solver and displays recovered knot-table images. The supplied JAR has full table artwork through eight crossings, but only some images for nine and ten crossings.
- `gr_interface.jpg` is the recovered application screenshot. The home page's two figures were also recovered.
- `wayback/index.html` and `wayback/download.html` are archived Sun Java pages, not TangleSolve pages. The saved Wayback toolbar scripts and styles are likewise not part of the original site.

## Program identity and purpose

- **Name:** TangleSolve.
- **Authors:** Yuki Saka and Mariel Vázquez, Mathematics Department, University of California, Berkeley (at publication in 2002).
- **Publication:** *Bioinformatics* 18(7), 1011–1012 (July 2002), DOI [10.1093/bioinformatics/18.7.1011](https://doi.org/10.1093/bioinformatics/18.7.1011).
- **Contact listed in the paper:** `mariel@math.berkeley.edu` (historical, not verified as current).
- **Purpose:** analyze site-specific DNA recombination with the mathematical tangle model. It computes and visualizes recombination mechanisms consistent with substrate and product knot/link observations. The paper also presents it as a teaching aid.
- **Original delivery:** a standalone Java program and a web-based Java applet. No executable or applet archive has been recovered.

## Documented application interface

The paper describes three panes:

1. **Input:** choose processive or non-processive recombination; enter substrate and product topology. Entries can use knot/link notation, a knot table, or crossing numbers.
2. **Selection:** list computed solutions, with a selectable solution.
3. **Display:** diagram of the selected solution's tangle and knot/link configuration.

Its Figure 1 also shows a table of **4-plat knots and links with up to 10 crossings**. The 4-plat diagrams were generated by TangleSolve; standard knot diagrams were adapted from Rolfsen's *Knots and Links* with permission. That figure is the strongest available visual reference for the applet, but it is **not evidence for the surrounding website design**.

### Scientific scope and assumptions reported in 2002

- Substrates and products are modeled as 4-plats.
- The parental tangle around the two recombination sites is the zero tangle, conventionally written `(0)`, with two horizontal arcs.
- Recombination changes that parental tangle to an integral tangle, a horizontal row of twists; other intervening tangles remain the same.
- The program computes solutions that are rational tangles or sums of rational tangles for supplied data. This should not be described as an unrestricted solver for all tangles.
- Its demonstration uses Xer recombination: a right-handed six-crossing torus link specified by Conway vector `(1,4,1)` or symbol `b(6,5)` leads to a seven-crossing product of unspecified knot type; the example is non-processive.

The paper says the applet presents all solutions under its stated rational-tangle assumptions. A later [review of TangleSolve and the tangle model](https://www.researchgate.net/publication/228934981_The_Tangle_Model_for_Site-specific_Recombination_A_Computer_Interface_and_the_TnpI-IRS_Recombination_System) describes further interface features and a TnpI-IRS example, but those are from 2007 and must not be treated as proven features of the 2004 site.

## What remains to extract from the archive

1. `3knots.gif` for the knots page.
2. `tmodel/synaptic_complex.jpg`, linked from the model text as “Electron micrographs.”
3. Applet archives `applet1/GInterface1.jar` and `applet2/GInterface2.jar` if they were archived. The supplied standalone `GInterface.jar` does not contain either `GInterface1.class` or `GInterface2.class`.
4. Confirm capture dates and original URLs for the saved tangle-model figures. The frameset and its contents appear to derive from different archive captures.

## Reconstruction guidance

Preserve the supplied originals in `wayback/`; develop the GitHub Pages site in `docs/`. The static reconstruction keeps the recovered HTML and images and removes Wayback toolbar code. Clearly label any modern replacement for the Java applet. Any knot-table artwork needs a rights review before redistribution because the paper specifically credits Rolfsen's diagrams and permission.

## Sources

- [Requested Wayback capture](https://web.archive.org/web/20040202121735/http://bio.math.berkeley.edu/TangleSolve/)
- [Saka and Vázquez, 2002, article](https://academic.oup.com/bioinformatics/article/18/7/1011/256711) and [PDF](https://academic.oup.com/bioinformatics/article-pdf/18/7/1011/48859786/bioinformatics_18_7_1011.pdf)
- [PubMed bibliographic record](https://pubmed.ncbi.nlm.nih.gov/12117800/)
- [Darcy course handout naming original paths](https://homepage.divms.uiowa.edu/~idarcy/COURSES/96/SPRING10/Software_KnotPlot_TangleSolve2.pdf)
