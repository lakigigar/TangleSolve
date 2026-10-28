# Modern TangleSolve web app status

The first browser-based implementation is in `docs/app/`. It is a static site suitable for GitHub Pages.

## Implemented

- Three-pane input, selection, and display workflow.
- 4-plat input as an odd-length vector, a classifying fraction, or a Conway symbol.
- Non-processive rational-tangle solving from the recovered `objects/EqSolver.java` logic in `GInterface.jar`.
- Ordered processive products and optional search over unknown product order (up to six products).
- Direct rational-tangle entry and predicted products across successive integral-twist rounds.
- Selectable 4-plat table through ten crossings, with 102 recovered knot images from the Java archive. Missing nine- and ten-crossing images receive generated 4-plat drawings.
- Rational-tangle and 4-plat SVG projections ported from the recovered Java drawing code. The combined equation display remains schematic.
- Candidate sets for substrates and products, including crossing-number sets; alternative candidates in processive rounds and optional unknown product order.
- A Java-derived fixture for the Xer six-crossing to seven-crossing example. The browser solver finds the same 16 solutions as the recovered **2001** standalone JAR, up to equivalent fraction labels.

## Material limitations

- The archived `tsolvefigure.jpg` shows an applet reporting 12 solutions for the Xer example. The recovered 2001 standalone JAR reports 16. The two applet JARs are still missing, so the difference cannot yet be explained from their source.
- The combined equation SVG remains schematic; it does not join the individual tangle projections into one planar knot diagram.
- The rational-R processive branch is an experimental correction inferred from the source equations; the recovered Java `solve3` implementation fails to return a mathematically valid tested case. It should be checked against a later applet or independent reference.
- Browser interaction has not been visually tested in this workspace because browser automation and a local HTTP server are blocked by the sandbox. Syntax, solver fixtures, generated SVGs, generated-file links, and DOM selector references have been checked.

## Next work

1. Recover `GInterface1.jar` and `GInterface2.jar` to compare the 2004 applets with the 2001 source and retrieve missing nine/ten-crossing artwork.
2. Compare the generated drawings against the later applet if its archives become available; connect the individual tangles in a single planar equation view.
3. Compare the new solver against later applet examples and document any intentional corrections.
