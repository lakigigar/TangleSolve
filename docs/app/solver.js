// Port of the rational-tangle calculations in Yuki Saka's 2001 Java archive.
// Inputs are deliberately limited to small crossing counts so Number stays exact.

const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
const mod = (a, n) => ((a % n) + n) % n;

export function rat(n, d = 1) {
  if (!Number.isSafeInteger(n) || !Number.isSafeInteger(d)) throw new Error('Numbers exceed the supported range.');
  if (!d) return { n: 1, d: 0 };
  if (!n) return { n: 0, d: 1 };
  const g = gcd(n, d), sign = Math.sign(d);
  return { n: sign * n / g, d: sign * d / g };
}

export const textRat = r => r.d === 0 ? '∞' : r.d === 1 ? String(r.n) : `${r.n}/${r.d}`;
const reciprocal = r => rat(r.d, r.n);
const add = (a, b) => !a.d || !b.d ? rat(1, 0) : rat(a.n * b.d + b.n * a.d, a.d * b.d);

function inverseMod(a, n) {
  if (n === 0) return a === 1 ? 1 : null;
  if (n === 1) return 1; // Historical Java convention.
  a = mod(a, n);
  if (!a || gcd(a, n) !== 1) return null;
  let [oldR, r, oldS, s] = [n, a, 0, 1];
  while (r) {
    const q = Math.floor(oldR / r);
    [oldR, r] = [r, oldR - q * r];
    [oldS, s] = [s, oldS - q * s];
  }
  return mod(oldS, n);
}

function equivalent(a, b) {
  if (a.d !== b.d) return false;
  if (a.d === 0 || a.n === b.n) return true;
  return a.n === inverseMod(b.n, a.d);
}

// Numerator closure of a sum of rational tangles, following FPlat.n_f.
export function closure(first, second) {
  const [u, v, x, y] = [first.n, first.d, second.n, second.d];
  const delta = x * v + y * u, a = Math.abs(delta);
  if (!a) return rat(1, 0);
  if (a === 1) return rat(1);
  const xp = y === 0 && x === 1 ? 1 : inverseMod(x, y);
  if (xp === null) return null;
  const yp = y === 0 ? 0 : (x * xp - 1) / y;
  const b = mod(Math.sign(delta) * (v * yp + u * xp), a);
  const inv = inverseMod(b, a);
  return inv === null ? null : rat(inv, a);
}

export function parsePlat(value) {
  const input = value.trim();
  if (!input) throw new Error('Enter a knot or link.');
  if (/^b\s*\(/i.test(input)) {
    const match = input.match(/^b\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
    if (!match) throw new Error(`Invalid Conway symbol: ${input}`);
    return plat(rat(Number(match[2]), Number(match[1])), input);
  }
  if (input.includes('/') || /^\d+$/.test(input)) {
    const match = input.match(/^(\d+)(?:\s*\/\s*(\d+))?$/);
    if (!match) throw new Error(`Invalid fraction: ${input}`);
    if (input === '0') return plat(rat(1, 0), '(0)');
    return plat(rat(Number(match[1]), Number(match[2] || 1)), input);
  }
  const match = input.match(/^\(?\s*(\d+(?:[\s,]+\d+)*)\s*\)?$/);
  if (!match) throw new Error(`Invalid 4-plat vector: ${input}`);
  const vector = match[1].split(/[\s,]+/).map(Number);
  if (vector.length % 2 !== 1 || vector.some(x => x < 0)) throw new Error('A 4-plat vector needs an odd number of nonnegative entries.');
  let result = rat(vector.at(-1));
  for (let i = vector.length - 2; i >= 0; i--) result = add(rat(vector[i]), reciprocal(result));
  return plat(reciprocal(result), `(${vector.join(' ')})`, vector);
}

function plat(fraction, label, vector = null) {
  if (fraction.d !== 0 && (fraction.n < 1 || fraction.n > fraction.d)) throw new Error(`Noncanonical 4-plat: ${label}`);
  return { fraction, label, vector, crossings: vector ? vector.reduce((a, b) => a + b, 0) : fraction.d === 0 ? 0 : null };
}

function factors3(value) {
  const result = [];
  for (let v = 1; v <= Math.abs(value); v++) {
    if (value % v) continue;
    const rem = Math.abs(value / v);
    for (let y = 1; y <= rem; y++) {
      if (rem % y) continue;
      const k = value / (v * y);
      result.push([v, y, k]);
    }
  }
  return result;
}

function factors2(value) {
  const result = [];
  for (let first = 1; first <= Math.abs(value); first++) {
    if (value % first === 0) result.push([first, value / first]);
  }
  return result;
}

function solveLinearAbs2(a, b, e1, c, d, e2) {
  const determinant = a * d - b * c;
  if (!determinant) return [];
  const results = new Map();
  for (const s1 of [-1, 1]) for (const s2 of [-1, 1]) {
    const x = rat(s1 * e1 * d - b * s2 * e2, determinant);
    const y = rat(a * s2 * e2 - c * s1 * e1, determinant);
    if (x.d === 1 && y.d === 1) results.set(`${x.n}|${y.n}`, [x.n, y.n]);
  }
  return [...results.values()];
}

function integerCandidate(b, a, y, sign, v) {
  if (a === 0) return b === -sign ? 1 : null;
  let value = rat(b * y + sign * v, a);
  if (value.d !== 1) {
    const inv = inverseMod(b, a);
    if (inv === null) return null;
    value = rat(inv * y + sign * v, a);
  }
  return value.d === 1 ? value.n : null;
}

export function solveNonprocessive(substrate, product) {
  const [b1, a1] = [substrate.fraction.n, substrate.fraction.d];
  const [b2, a2] = [product.fraction.n, product.fraction.d];
  const cases = [[a1 - a2, -1, -1], [a1 + a2, -1, 1], [-a1 - a2, 1, -1], [-a1 + a2, 1, 1]];
  const solutions = new Map();
  for (const [value, s1, s2] of cases) for (const [v, y, k] of factors3(value)) {
    const x1 = integerCandidate(b1, a1, y, s1, v);
    const x2 = integerCandidate(b2, a2, y, s2, v);
    if (x1 === null || x2 === null) continue;
    const x = x1 === 0 ? 0 : inverseMod(x1, y);
    if (x === null || (x2 !== 0 && inverseMod(x2, y) === null)) continue;
    const u = rat(s1 * a1 - v * x, y);
    if (u.d !== 1) continue;
    const of = rat(x, y), ob = rat(u.n, v), r = rat(k);
    const check1 = closure(of, ob), check2 = closure(of, add(ob, r));
    if (!check1 || !check2 || !equivalent(substrate.fraction, check1) || !equivalent(product.fraction, check2)) continue;
    solutions.set(`${textRat(of)}|${textRat(ob)}|${textRat(r)}`, { of, ob, r, substrate, product });
  }
  return [...solutions.values()].sort((a, b) => a.r.n - b.r.n || a.of.n - b.of.n);
}

export function enumeratePlats(crossings) {
  if (!Number.isInteger(crossings) || crossings < 0 || crossings > 10) throw new Error('Choose 0–10 crossings.');
  if (crossings === 0) return [parsePlat('0')];
  const vectors = [];
  const build = (remaining, vector) => {
    if (!remaining) {
      if (vector.length % 2) vectors.push(vector);
      return;
    }
    for (let value = 1; value <= remaining; value++) build(remaining - value, [...vector, value]);
  };
  build(crossings, []);
  const unique = [];
  for (const vector of vectors) {
    const candidate = parsePlat(`(${vector.join(' ')})`);
    if (!unique.some(item => equivalent(item.fraction, candidate.fraction))) unique.push(candidate);
  }
  return unique.sort((a, b) => a.fraction.n / a.fraction.d - b.fraction.n / b.fraction.d);
}

export function solveByCrossings(substrate, crossingCount) {
  return enumeratePlats(crossingCount).flatMap(product => solveNonprocessive(substrate, product));
}

// The 2001 solver lists separate Oᶠ/Oᵇ splits even when one summand is
// integral and both splits describe the same rational outside tangle O.
// The 2004 figure counts each such mechanism once.
export function collapseOutsideTangles(solutions) {
  const groups = new Map();
  for (const solution of solutions) {
    const rationalOutside = solution.of.d === 1 || solution.ob.d === 1;
    const outside = rationalOutside
      ? textRat(add(solution.of, solution.ob))
      : `${textRat(solution.of)}+${textRat(solution.ob)}`;
    const key = [textRat(solution.substrate.fraction), textRat(solution.product.fraction),
      textRat(solution.r), rationalOutside ? 'rational' : 'sum', outside].join('|');
    if (!groups.has(key)) groups.set(key, { ...solution, outside,
      representations: [{ of: solution.of, ob: solution.ob }] });
    else groups.get(key).representations.push({ of: solution.of, ob: solution.ob });
  }
  return [...groups.values()];
}

export function parseCandidateSet(value) {
  const tokens = value.split(/[;\n]+/).map(x => x.trim()).filter(Boolean);
  const result = [];
  for (const token of tokens) {
    const crossing = token.match(/^#\s*(\d+)$/);
    const candidates = crossing ? enumeratePlats(Number(crossing[1])) : [parsePlat(token)];
    for (const candidate of candidates) {
      if (!result.some(item => equivalent(item.fraction, candidate.fraction))) result.push(candidate);
    }
  }
  return result;
}

export function solveObservationSets(substrates, products) {
  if (!substrates.length || !products.length) throw new Error('Enter at least one substrate and product.');
  if (substrates.length * products.length > 5000) throw new Error('Too many substrate/product pairs; narrow the candidate sets.');
  const result = new Map();
  for (const substrate of substrates) for (const product of products) {
    for (const solution of solveNonprocessive(substrate, product)) {
      const id = [textRat(substrate.fraction), textRat(product.fraction), textRat(solution.of), textRat(solution.ob), textRat(solution.r)].join('|');
      result.set(id, solution);
    }
  }
  return collapseOutsideTangles([...result.values()]);
}

export function predict(solution, round) {
  if (solution.kind === 'rational-r') {
    if (round === 0) return closure(solution.ob, rat(0));
    if (round === 1) return closure(solution.ob, solution.r);
    if (round === 2) return closure(solution.r, add(solution.r, solution.ob));
    return null;
  }
  return closure(solution.of, add(solution.ob, rat(solution.r.n * round)));
}

function solveIntegralProcessive(first, second) {
  const a1 = first.fraction.d, a2 = second.fraction.d;
  const result = new Map();
  for (const [u, vr] of solveLinearAbs2(1, 1, a1, 1, 2, a2)) {
    for (const [v, k] of factors2(vr)) {
      const candidate = { of: rat(0), ob: rat(u, v), r: rat(k), kind: 'integral-r' };
      const p1 = predict(candidate, 1), p2 = predict(candidate, 2);
      if (p1 && p2 && equivalent(p1, first.fraction) && equivalent(p2, second.fraction)) {
        result.set(`${textRat(candidate.ob)}|${k}`, candidate);
      }
    }
  }
  return [...result.values()];
}

function solveRationalProcessive(first, second) {
  const a1 = first.fraction.d, a2 = second.fraction.d;
  const result = new Map();
  for (const [q, c] of factors2(a2)) {
    for (const [p, u] of solveLinearAbs2(1, q, a1, 2, q, c)) {
      const candidate = { of: rat(0), ob: rat(u), r: rat(p, q), kind: 'rational-r' };
      if (candidate.r.d === 1) continue;
      const p1 = predict(candidate, 1), p2 = predict(candidate, 2);
      if (p1 && p2 && equivalent(p1, first.fraction) && equivalent(p2, second.fraction)) {
        result.set(`${u}|${textRat(candidate.r)}`, candidate);
      }
    }
  }
  return [...result.values()];
}

export function solveProcessive(substrate, products) {
  if (products.length < 2) throw new Error('Processive analysis needs at least two ordered products.');
  let candidates;
  if (substrate.fraction.n === 1 && substrate.fraction.d === 1) {
    candidates = [...solveIntegralProcessive(products[0], products[1]), ...solveRationalProcessive(products[0], products[1])];
  } else {
    candidates = solveNonprocessive(substrate, products[0]);
  }
  return candidates.filter(solution => {
    const base = predict(solution, 0);
    if (!base || !equivalent(base, substrate.fraction)) return false;
    return products.every((product, index) => {
      const value = predict(solution, index + 1);
      return value && equivalent(value, product.fraction);
    });
  }).map(solution => ({ ...solution, substrate, product: products[0], rounds: products.length }));
}

export { equivalent };
