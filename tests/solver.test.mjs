import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parsePlat, parseCandidateSet, solveObservationSets, textRat, closure, equivalent, solveNonprocessive, solveProcessive, solveByCrossings, enumeratePlats, predict } from '../docs/app/solver.js';
import { renderTangleSvg, renderPlatSvg } from '../docs/app/tangle-svg.js';

test('historical input notations resolve to the same 4-plat', () => {
  const vector = parsePlat('(1 4 1)');
  assert.equal(textRat(vector.fraction), '5/6');
  assert.ok(equivalent(vector.fraction, parsePlat('b(6,5)').fraction));
  assert.ok(equivalent(vector.fraction, parsePlat('5/6').fraction));
  assert.equal(textRat(parsePlat('0').fraction), '∞');
});

test('non-processive candidates satisfy both tangle equations', () => {
  const substrate = parsePlat('1'), product = parsePlat('(1 2 1)');
  const solutions = solveNonprocessive(substrate, product);
  assert.ok(solutions.length > 0);
  for (const solution of solutions) {
    assert.ok(equivalent(closure(solution.of, solution.ob), substrate.fraction));
    assert.ok(equivalent(predict(solution, 1), product.fraction));
    assert.equal(solution.r.d, 1);
  }
});

test('the processive solver recovers an integral-twist example', () => {
  const solutions = solveProcessive(parsePlat('1'), [parsePlat('3/4'), parsePlat('3/7')]);
  assert.ok(solutions.some(s => textRat(s.ob) === '-1/3' && textRat(s.r) === '-1'));
  assert.ok(solutions.every(s => equivalent(predict(s, 2), parsePlat('3/7').fraction)));
});

test('the special rational-R processive branch is available', () => {
  const solutions = solveProcessive(parsePlat('1'), [parsePlat('2/7'), parsePlat('13/24')]);
  assert.ok(solutions.some(s => textRat(s.ob) === '-1' && textRat(s.r) === '-5/2'));
});

test('seven-crossing table entries are distinct up to the original modular equivalence', () => {
  const entries = enumeratePlats(7);
  assert.equal(entries.length, 20);
  assert.ok(entries.every(item => item.crossings === 7));
  for (let i = 0; i < entries.length; i++) for (let j = i + 1; j < entries.length; j++) {
    assert.equal(equivalent(entries[i].fraction, entries[j].fraction), false);
  }
});

test('Xer seven-crossing output matches the recovered 2001 Java solver', () => {
  // Produced by EqSolver.solve4 in wayback/GInterface.jar for (1 4 1) and every seven-crossing 4-plat.
  const fixture = readFileSync(new URL('./fixtures/java-xer-7.txt', import.meta.url), 'utf8').trim().split('\n');
  const actual = solveByCrossings(parsePlat('(1 4 1)'), 7);
  assert.equal(actual.length, fixture.length);
  for (const row of fixture) {
    const [product, of, ob, r] = row.split('|');
    assert.ok(actual.some(solution =>
      equivalent(solution.product.fraction, parsePlat(product).fraction) &&
      textRat(solution.of) === of && textRat(solution.ob) === ob && textRat(solution.r) === r
    ), `Missing Java solution: ${row}`);
  }
});

test('candidate sets accept alternatives and crossing-number tables', () => {
  const products = parseCandidateSet('(1 2 1); 3/4; #3');
  assert.equal(products.filter(item => equivalent(item.fraction, parsePlat('3/4').fraction)).length, 1);
  assert.ok(products.length >= enumeratePlats(3).length);
  const combined = solveObservationSets(parseCandidateSet('1; (1 4 1)'), parseCandidateSet('(1 2 1)'));
  assert.ok(combined.length > 0);
  assert.ok(combined.some(item => item.substrate.label === '1'));
});

test('Xer representations group to the twelve mechanisms in the 2004 figure', () => {
  const mechanisms = solveObservationSets(parseCandidateSet('(1 4 1)'), parseCandidateSet('#7'));
  assert.equal(mechanisms.length, 12);
  assert.equal(mechanisms.filter(item => item.of.d === 1 || item.ob.d === 1).length, 6);
  assert.equal(mechanisms.filter(item => item.of.d !== 1 && item.ob.d !== 1).length, 6);
  assert.equal(mechanisms.filter(item => item.representations.length === 2).length, 4);
});

test('generated projections are finite SVGs for representative tangles and plats', () => {
  for (const tangle of [{ n: 0, d: 1 }, { n: 1, d: 0 }, { n: -4, d: 3 }, { n: 5, d: 6 }]) {
    const svg = renderTangleSvg(tangle);
    assert.match(svg, /^<svg /);
    assert.doesNotMatch(svg, /NaN|Infinity|undefined/);
    assert.equal((svg.match(/<path /g) || []).length, 2);
  }
  for (const plat of [parsePlat('(1 4 1)'), ...enumeratePlats(10).slice(0, 3)]) {
    const svg = renderPlatSvg(plat.vector);
    assert.match(svg, /^<svg /);
    assert.doesNotMatch(svg, /NaN|Infinity|undefined/);
    assert.match(svg, /<path d="M/);
  }
});
