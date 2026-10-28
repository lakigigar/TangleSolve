import { rat, textRat, solveProcessive, parseCandidateSet, solveObservationSets, enumeratePlats, predict, equivalent } from './solver.js';
import { knotImages } from './knot-images.js';
import { renderTangleSvg, renderPlatSvg } from './tangle-svg.js';

const $ = selector => document.querySelector(selector);
const state = { mode: 'nonprocessive', solutions: [], selected: 0 };
const allPlats = Array.from({ length: 11 }, (_, crossings) => enumeratePlats(crossings)).flat();
const vectorFor = plat => plat.vector || allPlats.find(item => equivalent(item.fraction, plat.fraction))?.vector;

function parseTangle(value) {
  const match = value.trim().match(/^(-?\d+)(?:\s*\/\s*(-?\d+))?$/);
  if (!match) throw new Error(`Enter a rational tangle such as 3, -2, or 1/3: ${value}`);
  return rat(Number(match[1]), match[2] ? Number(match[2]) : 1);
}

function setMode(mode) {
  state.mode = mode;
  document.querySelectorAll('.tab').forEach(button => {
    const active = button.dataset.mode === mode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });
  $('#observations').hidden = mode === 'diagram';
  $('#diagram-fields').hidden = mode !== 'diagram';
  $('#nonprocessive-fields').hidden = mode !== 'nonprocessive';
  $('#processive-fields').hidden = mode !== 'processive';
  $('#substrate').required = mode !== 'diagram';
  $('.primary').firstChild.textContent = mode === 'diagram' ? 'Draw tangles ' : 'Solve equations ';
}

function solve() {
  if (state.mode === 'diagram') {
    const solution = { of: parseTangle($('#of').value), ob: parseTangle($('#ob').value), r: parseTangle($('#r').value) };
    if (solution.r.d !== 1) throw new Error('R must be an integer tangle in this model.');
    const rounds = Number($('#rounds').value);
    if (!Number.isInteger(rounds) || rounds < 1 || rounds > 8) throw new Error('Choose 1–8 rounds.');
    const first = predict(solution, 0), second = predict(solution, 1);
    if (!first || !second) throw new Error('The selected tangles do not produce a valid 4-plat closure.');
    solution.substrate = { fraction: first, label: textRat(first) };
    solution.product = { fraction: second, label: textRat(second) };
    solution.rounds = rounds;
    return [solution];
  }
  const substrates = parseCandidateSet($('#substrate').value);
  if (!substrates.length) throw new Error('Enter at least one substrate.');
  if (state.mode === 'nonprocessive') {
    const crossingInput = $('#crossings').value.trim();
    const products = parseCandidateSet($('#product').value + (crossingInput ? `;#${crossingInput}` : ''));
    return solveObservationSets(substrates, products);
  }
  const lines = $('#products').value.split(/\n+/).map(x => x.trim()).filter(Boolean);
  const productSets = lines.map(parseCandidateSet);
  if (productSets.length < 2) throw new Error('Processive analysis needs at least two product rounds.');
  if (productSets.some(set => !set.length)) throw new Error('Each product round needs at least one candidate.');
  if ($('#unknown-order').checked && productSets.length > 6) throw new Error('Unknown-order analysis supports at most six rounds.');
  const combinations = productSets.reduce((total, set) => total * set.length, substrates.length);
  const orders = $('#unknown-order').checked ? productSets.length === 2 ? 2 : Array.from({ length: productSets.length }, (_, i) => i + 1).reduce((a, b) => a * b, 1) : 1;
  if (combinations * orders > 3000) throw new Error('Too many product combinations; narrow the candidate sets.');
  const found = new Map();
  const save = (substrate, chosen) => {
    for (const solution of solveProcessive(substrate, chosen)) {
      const order = chosen.map(x => x.label).join(' → ');
      const id = `${textRat(substrate.fraction)}|${textRat(solution.of)}|${textRat(solution.ob)}|${textRat(solution.r)}|${order}`;
      found.set(id, { ...solution, order: $('#unknown-order').checked ? order : null });
    }
  };
  const visitOrder = (substrate, chosen, remaining) => {
    if (!remaining.length) {
      save(substrate, chosen);
      return;
    }
    for (let i = 0; i < remaining.length; i++) visitOrder(substrate, [...chosen, remaining[i]], remaining.filter((_, j) => j !== i));
  };
  const visitCandidates = (substrate, index, chosen) => {
    if (index === productSets.length) {
      if ($('#unknown-order').checked) visitOrder(substrate, [], chosen);
      else save(substrate, chosen);
      return;
    }
    for (const product of productSets[index]) visitCandidates(substrate, index + 1, [...chosen, product]);
  };
  for (const substrate of substrates) visitCandidates(substrate, 0, []);
  return [...found.values()];
}

function solutionLabel(solution) {
  return `Oᶠ = ${textRat(solution.of)}  ·  Oᵇ = ${textRat(solution.ob)}  ·  R = ${textRat(solution.r)}`;
}

function renderSolutions() {
  $('#count').textContent = String(state.solutions.length);
  const list = $('#solutions');
  list.replaceChildren();
  state.solutions.forEach((solution, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `solution${index === state.selected ? ' active' : ''}`;
    button.setAttribute('role', 'option');
    button.setAttribute('aria-selected', String(index === state.selected));
    const title = document.createElement('strong');
    title.textContent = `Solution ${index + 1}`;
    const details = document.createElement('span');
    details.textContent = solutionLabel(solution);
    const product = document.createElement('span');
    product.textContent = `Product: ${solution.product.label}`;
    button.append(title, details, product);
    if (solution.order) {
      const order = document.createElement('span'); order.textContent = `Order: ${solution.order}`; button.append(order);
    }
    button.addEventListener('click', () => { state.selected = index; renderSolutions(); renderDisplay(); });
    list.append(button);
  });
}

function diagramSvg(solution) {
  const r = textRat(solution.r), of = textRat(solution.of), ob = textRat(solution.ob);
  return `<svg class="diagram-svg" viewBox="0 0 740 292" role="img" aria-label="Schematic of substrate and product tangle equations">
    <style>.strand-a{stroke:#137cbc}.strand-b{stroke:#dd6960}.strand-a,.strand-b{fill:none;stroke-width:3;stroke-linecap:round}.box{fill:#fff;stroke:#a9c8c7;stroke-width:1.5}.site{fill:#eaf8f3;stroke:#0c9a80;stroke-width:1.5}.label{font:600 14px system-ui;fill:#243f45}.small{font:12px system-ui;fill:#668184}.symbol{font:20px Georgia;fill:#5a797d}</style>
    <text x="18" y="35" class="label">Substrate</text><text x="18" y="175" class="label">Product</text>
    <path class="strand-a" d="M18 82 H716 M18 222 H716"/><path class="strand-b" d="M18 104 H716 M18 244 H716"/>
    <rect x="125" y="55" width="122" height="75" rx="8" class="box"/><rect x="310" y="55" width="122" height="75" rx="8" class="box"/><rect x="495" y="55" width="122" height="75" rx="8" class="site"/>
    <rect x="125" y="195" width="122" height="75" rx="8" class="box"/><rect x="310" y="195" width="122" height="75" rx="8" class="box"/><rect x="495" y="195" width="122" height="75" rx="8" class="site"/>
    <text x="145" y="91" class="label">Oᶠ = ${of}</text><text x="330" y="91" class="label">Oᵇ = ${ob}</text><text x="515" y="91" class="label">P = 0</text>
    <text x="145" y="231" class="label">Oᶠ = ${of}</text><text x="330" y="231" class="label">Oᵇ = ${ob}</text><text x="515" y="231" class="label">R = ${r}</text>
    <text x="263" y="100" class="symbol">+</text><text x="448" y="100" class="symbol">+</text><text x="263" y="240" class="symbol">+</text><text x="448" y="240" class="symbol">+</text>
    <text x="497" y="151" class="small">local recombination</text><path d="M562 135 V183" stroke="#168c79" stroke-width="2" marker-end="url(#arrow)"/><defs><marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#168c79"/></marker></defs>
  </svg>`;
}

function renderDisplay() {
  const target = $('#display');
  const solution = state.solutions[state.selected];
  if (!solution) { target.className = 'display-empty'; target.textContent = 'No solution selected.'; return; }
  target.className = 'display-content';
  target.innerHTML = `<div class="solution-heading"><div><h3>Candidate mechanism ${state.selected + 1}</h3><p>Rational tangles · ${solution.kind === 'rational-r' ? 'rational recombinant tangle' : 'integral recombinant twist'}</p></div><span class="badge">${solution.kind === 'rational-r' ? 'Experimental' : 'Computed'}</span></div>${diagramSvg(solution)}<div class="equations"><div class="equation">N(Oᶠ + Oᵇ + P) = <strong>${textRat(solution.substrate.fraction)}</strong> <small>(${solution.substrate.label.replaceAll('<','&lt;')})</small></div><div class="equation">N(Oᶠ + Oᵇ + R) = <strong>${textRat(solution.product.fraction)}</strong> <small>(${solution.product.label.replaceAll('<','&lt;')})</small></div></div><div class="tangles"><span class="tangle-pill">Oᶠ ${textRat(solution.of)}</span><span class="tangle-pill">Oᵇ ${textRat(solution.ob)}</span><span class="tangle-pill">R ${textRat(solution.r)}</span></div><p class="diagram-caption">Schematic only. Boxes denote tangles; the colored lines indicate the two DNA strands. This is not a planar knot diagram.</p>`;
  const images = document.createElement('div');
  images.className = 'knot-preview';
  for (const [label, plat] of [['Substrate', solution.substrate], ['Product', solution.product]]) {
    const match = knotImages.find(item => equivalent(plat.fraction, { n: item.n, d: item.d }));
    const figure = document.createElement('figure');
    const caption = document.createElement('figcaption'); caption.textContent = `${label} · recovered knot table`;
    if (match) {
      const img = document.createElement('img'); img.src = `./knot-images/${encodeURIComponent(match.file)}`; img.alt = `${label} knot or link diagram`;
      figure.append(img);
    } else if (vectorFor(plat)) {
      figure.innerHTML = renderPlatSvg(vectorFor(plat), `${label} ${plat.label}`);
      caption.textContent = `${label} · generated 4-plat`;
    } else continue;
    figure.append(caption); images.append(figure);
  }
  if (images.childElementCount) target.append(images);
  const tangleGallery = document.createElement('div');
  tangleGallery.className = 'tangle-gallery';
  for (const [label, value] of [['Oᶠ', solution.of], ['Oᵇ', solution.ob], ['R', solution.r]]) {
    const figure = document.createElement('figure');
    figure.innerHTML = renderTangleSvg(value, label);
    const caption = document.createElement('figcaption');
    caption.textContent = `${label} = ${textRat(value)}`;
    figure.append(caption);
    tangleGallery.append(figure);
  }
  target.append(tangleGallery);
  if (solution.rounds && solution.rounds > 1) {
    const list = document.createElement('div');
    list.className = 'equations';
    for (let round = 2; round <= solution.rounds; round++) {
      const result = predict(solution, round);
      const row = document.createElement('div');
      row.className = 'equation';
      const expression = solution.kind === 'rational-r' ? 'N(R + (R + Oᵇ))' : `N(Oᶠ + Oᵇ + ${round}R)`;
      row.textContent = `Round ${round}: ${expression} = ${result ? textRat(result) : 'undefined'}`;
      list.append(row);
    }
    target.append(list);
  }
}

function runAnalysis() {
  try {
    state.solutions = solve();
    state.selected = 0;
    $('#summary').textContent = state.solutions.length ? `${state.solutions.length} candidate ${state.solutions.length === 1 ? 'mechanism' : 'mechanisms'} under the rational-tangle assumptions.` : 'No solutions found for this input under the current model.';
    renderSolutions(); renderDisplay();
  } catch (error) {
    $('#summary').textContent = error.message;
    state.solutions = [];
    renderSolutions();
    $('#display').className = 'display-empty';
    $('#display').textContent = 'Correct the input and solve again.';
  }
}

document.querySelectorAll('.tab').forEach(button => button.addEventListener('click', () => setMode(button.dataset.mode)));
$('#analysis-form').addEventListener('submit', event => { event.preventDefault(); runAnalysis(); });
$('#sample').addEventListener('click', () => { setMode('nonprocessive'); $('#substrate').value = '(1 4 1)'; $('#product').value = ''; $('#crossings').value = '7'; runAnalysis(); });

const dialog = $('#knot-dialog');
let tableTarget = null;
for (let crossings = 0; crossings <= 10; crossings++) {
  const option = document.createElement('option'); option.value = crossings; option.textContent = crossings;
  $('#table-crossings').append(option);
}
$('#table-crossings').value = '6';
function renderTable() {
  const list = $('#table-options'); list.replaceChildren();
  for (const plat of enumeratePlats(Number($('#table-crossings').value))) {
    const button = document.createElement('button'); button.type = 'button';
    const image = knotImages.find(item => item.crossings === Number($('#table-crossings').value) && equivalent(plat.fraction, { n: item.n, d: item.d }));
    if (image) {
      const img = document.createElement('img');
      img.src = `./knot-images/${encodeURIComponent(image.file)}`;
      img.alt = `Historical knot diagram for ${plat.label}`;
      img.loading = 'lazy';
      button.append(img);
    } else if (plat.vector) {
      const preview = document.createElement('div');
      preview.className = 'generated-plat';
      preview.innerHTML = renderPlatSvg(plat.vector, plat.label);
      button.append(preview);
    }
    const label = document.createElement('strong'); label.textContent = plat.label;
    button.append(label);
    const small = document.createElement('small'); small.textContent = `Fraction ${textRat(plat.fraction)}`;
    button.append(small);
    button.addEventListener('click', () => { $(tableTarget).value = plat.label; if (tableTarget === '#product') $('#crossings').value = ''; dialog.close(); });
    list.append(button);
  }
}
document.querySelectorAll('.table-button').forEach(button => button.addEventListener('click', () => { tableTarget = `#${button.dataset.target}`; renderTable(); dialog.showModal(); }));
$('#table-crossings').addEventListener('change', renderTable);
$('#close-dialog').addEventListener('click', () => dialog.close());
setMode('nonprocessive');
runAnalysis();
