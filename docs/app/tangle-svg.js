// Browser port of the path construction in graphics/GTools.java and
// graphics/TangleGraph.java from the recovered TangleSolve JAR.

const path = () => [];
const move = (p, x, y) => p.push(['M', x, y]);
const line = (p, x, y) => p.push(['L', x, y]);
const quad = (p, x1, y1, x2, y2) => p.push(['Q', x1, y1, x2, y2]);

function smooth(p, end, corner, x1, y1, x2, y2) {
  const radius = Math.min(Math.abs(x2 - x1) / 4, Math.abs(y2 - y1) / 4);
  const sign = Math.sign(y2 - y1) || 1;
  let ix, iy, jx, jy;
  if (!end) {
    jy = y2 - sign * radius; jx = x2 - radius;
    if (corner === 0) { ix = x1 + radius; iy = y1; }
    else if (corner === 1) { ix = x1 + radius; iy = y1 + sign * radius; }
    else { ix = x1; iy = y1 + sign * radius; }
  } else {
    iy = y1 + sign * radius; ix = x1 + radius;
    if (corner === 0) { jx = x2 - radius; jy = y2; }
    else if (corner === 1) { jx = x2 - radius; jy = y2 - sign * radius; }
    else { jx = x2; jy = y2 - sign * radius; }
  }
  move(p, x1, y1);
  quad(p, ix, iy, (ix + jx) / 2, (iy + jy) / 2);
  quad(p, jx, jy, x2, y2);
}

function transform(p, f) {
  return p.map(command => {
    const transformed = [command[0]];
    for (let i = 1; i < command.length; i += 2) transformed.push(...f(command[i], command[i + 1]));
    return transformed;
  });
}

function twistBox(x, y, width, twistWidth, distance, twists, type, corners) {
  const w = width / 2, tw = twistWidth, dh = distance, gap = tw / 4;
  const dv = w - tw / 2, total = twists * tw, halfGap = gap / 2;
  const a = path(), b = path();
  smooth(a, 0, corners[0], 0, -w, dh, -w + dv);
  smooth(b, 0, corners[3], 0, w, dh, w - dv);
  let xStart = dh, yStart = -w + dv;
  for (let i = 1; i <= twists; i++, xStart += tw) {
    if (i % 2 === 0) {
      quad(a, xStart + halfGap, yStart, xStart + tw / 2 - gap, yStart - tw / 2 + gap);
      move(a, xStart + tw / 2 + gap, yStart - tw / 2 - gap);
      if (i === twists) line(a, xStart + tw, yStart - tw);
      else quad(a, xStart + tw - halfGap, yStart - tw, xStart + tw, yStart - tw);
      yStart -= tw;
    } else {
      if (i === 1) line(a, xStart + tw / 2, yStart + tw / 2);
      else quad(a, xStart + halfGap, yStart, xStart + tw / 2, yStart + tw / 2);
      if (i === twists) line(a, xStart + tw, yStart + tw);
      else quad(a, xStart + tw - halfGap, yStart + tw, xStart + tw, yStart + tw);
      yStart += tw;
    }
  }
  if (twists % 2 === 0) smooth(a, 1, corners[1], total + dh, -w + dv, total + 2 * dh, -w);
  else smooth(a, 1, corners[2], total + dh, w - dv, total + 2 * dh, w);
  xStart = dh; yStart = w - dv;
  for (let i = 1; i <= twists; i++, xStart += tw) {
    if (i % 2 === 1) {
      if (i === 1) line(b, xStart + tw / 2 - gap, yStart - tw / 2 + gap);
      else quad(b, xStart + halfGap, yStart, xStart + tw / 2 - gap, yStart - tw / 2 + gap);
      move(b, xStart + tw / 2 + gap, yStart - tw / 2 - gap);
      if (i === twists) line(b, xStart + tw, yStart - tw);
      else quad(b, xStart + tw - halfGap, yStart - tw, xStart + tw, yStart - tw);
      yStart -= tw;
    } else {
      quad(b, xStart + halfGap, yStart, xStart + tw / 2, yStart + tw / 2);
      if (i === twists) line(b, xStart + tw, yStart + tw);
      else quad(b, xStart + tw - halfGap, yStart + tw, xStart + tw, yStart + tw);
      yStart += tw;
    }
  }
  if (twists % 2 === 0) smooth(b, 1, corners[2], total + dh, w - dv, total + 2 * dh, w);
  else smooth(b, 1, corners[1], total + dh, -w + dv, total + 2 * dh, -w);
  if (type === 0) return [transform(a, (px, py) => [px + x, py + y + w]), transform(b, (px, py) => [px + x, py + y + w])];
  if (type === 1) return [transform(b, (px, py) => [px + x, -py + y + w]), transform(a, (px, py) => [px + x, -py + y + w])];
  if (type === 2) return [transform(a, (px, py) => [x + w - py, y + px]), transform(b, (px, py) => [x + w - py, y + px])];
  return [transform(b, (px, py) => [x + w + py, y + px]), transform(a, (px, py) => [x + w + py, y + px])];
}

export function tangleVector(rational) {
  if (rational.d === 0) return [0, 0];
  let a = rational.n, b = rational.d;
  const vector = [];
  while (b !== 0) {
    vector.push(Math.trunc(a / b));
    [a, b] = [b, a % b];
  }
  return vector.reverse();
}

function parity(vector) {
  let current = vector.length % 2 ? 'zero' : 'infinity';
  for (let i = 1; i <= vector.length; i++) {
    if (Math.abs(vector[i - 1]) % 2 !== 1) continue;
    if ((i % 2 === 1 && vector.length % 2 === 0) || (i % 2 === 0 && vector.length % 2 === 1)) {
      current = current === 'one' ? 'infinity' : current === 'infinity' ? 'one' : current;
    } else {
      current = current === 'zero' ? 'one' : current === 'one' ? 'zero' : current;
    }
  }
  return current;
}

function cornerTypes(length, i, positive) {
  const c1 = [1, 0, 2, 2], c2 = [2, 2, 0, 1], c3 = [0, 2, 0, 0], c4 = [0, 0, 2, 0];
  if ((i === 1 && length % 2 === 1) || (i === 0 && length % 2 === 0)) {
    if (length === 1) return [1, 1, 1, 1];
    if (length === 2) return positive ? [2, 2, 0, 0] : [0, 0, 2, 2];
    return positive ? c1 : c2;
  }
  if (i === length) return [0, 1, 1, 0];
  if (i === length - 1) return positive ? [0, 2, 1, 0] : [0, 1, 2, 0];
  return positive ? c4 : c3;
}

function bounds(paths) {
  const points = paths.flatMap(p => p.flatMap(command => {
    const pairs = [];
    for (let i = 1; i < command.length; i += 2) pairs.push([command[i], command[i + 1]]);
    return pairs;
  }));
  return { minX: Math.min(...points.map(p => p[0])), maxX: Math.max(...points.map(p => p[0])),
    minY: Math.min(...points.map(p => p[1])), maxY: Math.max(...points.map(p => p[1])) };
}

function tanglePaths(rational) {
  const vector = tangleVector(rational), len = vector.length;
  const distance = 10, twistWidth = 10, startSize = 20;
  const paths = [path(), path()];
  let x = 0, y = 0, rectX = 0, rectY = 0, index = 0, step = 1, corners;
  const connect = (pair, twist, horizontal) => {
    if (horizontal) { paths[corners[0]].push(...pair[0]); paths[corners[1]].push(...pair[1]); }
    else { paths[corners[1]].push(...pair[0]); paths[corners[2]].push(...pair[1]); }
    if (Math.abs(twist) % 2) {
      const [a, b] = horizontal ? [0, 1] : [1, 2];
      [corners[a], corners[b]] = [corners[b], corners[a]];
    }
  };
  const distanceFor = twists => distance * 2 + Math.abs(twists) * twistWidth;
  if (len % 2) {
    corners = [0, 1, 1];
    const twist = vector[0];
    connect(twistBox(x, y, startSize, twistWidth, distance, Math.abs(twist), twist > 0 ? 0 : 1, cornerTypes(len, 1, twist > 0)), twist, true);
    rectX += distanceFor(twist); rectY += startSize; y += startSize; index = 1; step = 2;
  } else {
    corners = [1, 1, 0];
    const twist = vector[0];
    connect(twistBox(x, y, startSize, twistWidth, distance, Math.abs(twist), twist > 0 ? 3 : 2, cornerTypes(len, 0, twist > 0)), twist, false);
    rectX = startSize; rectY += distanceFor(twist); x += startSize; index = 1;
  }
  for (; index < len; index++, step++) {
    const twist = vector[index], i = step;
    if (index === len - 1 && twist === 0) break;
    if (i % 2 === 0) {
      connect(twistBox(x, y, rectX, twistWidth, distance, Math.abs(twist), twist > 0 ? 3 : 2, cornerTypes(len, i, twist > 0)), twist, false);
      y -= rectY; rectY += distanceFor(twist); x += rectX;
    } else {
      connect(twistBox(x, y, rectY, twistWidth, distance, Math.abs(twist), twist > 0 ? 0 : 1, cornerTypes(len, i, twist > 0)), twist, true);
      x -= rectX; rectX += distanceFor(twist); y += rectY;
    }
  }
  const box = bounds(paths), width = box.maxX - box.minX, height = box.maxY - box.minY;
  const kind = parity(vector);
  if (kind === 'infinity') {
    smooth(paths[0], 0, 0, -5, -5, 0, 0); smooth(paths[0], 0, 0, -5, height + 5, 0, height);
    smooth(paths[1], 1, 0, width, 0, width + 5, -5); smooth(paths[1], 1, 0, width, height, width + 5, height + 5);
  } else if (kind === 'one') {
    smooth(paths[0], 0, 0, -5, -5, 0, 0); smooth(paths[1], 0, 0, -5, height + 5, 0, height);
    smooth(paths[1], 1, 0, width, 0, width + 5, -5); smooth(paths[0], 1, 0, width, height, width + 5, height + 5);
  } else {
    smooth(paths[0], 0, 0, -5, -5, 0, 0); smooth(paths[1], 0, 0, -5, height + 5, 0, height);
    smooth(paths[0], 1, 0, width, 0, width + 5, -5); smooth(paths[1], 1, 0, width, height, width + 5, height + 5);
  }
  return paths;
}

function pathData(p) {
  return p.map(command => command[0] + command.slice(1).map(n => Number(n.toFixed(2))).join(' ')).join(' ');
}

export function renderTangleSvg(rational, label = '') {
  const paths = tanglePaths(rational), box = bounds(paths);
  const padding = 12, width = Math.max(50, box.maxX - box.minX + 2 * padding), height = Math.max(40, box.maxY - box.minY + 2 * padding);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box.minX - padding} ${box.minY - padding} ${width} ${height}" role="img" aria-label="Rational tangle ${label}"><rect x="${box.minX - 3}" y="${box.minY - 3}" width="${box.maxX - box.minX + 6}" height="${box.maxY - box.minY + 6}" rx="8" fill="none" stroke="#bfd1d0"/><path d="${pathData(paths[0])}" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round"/><path d="${pathData(paths[1])}" fill="none" stroke="#dc4444" stroke-width="2" stroke-linecap="round"/></svg>`;
}

// Port of graphics/FPlatGraph.java: a closed four-strand braid projection.
export function renderPlatSvg(vector, label = '') {
  const p = path(), distance = 10, tw = 10, width = 90;
  const y2 = width / 3, y3 = 2 * width / 3;
  let x = 0;
  for (let i = 0; i < vector.length; i++) {
    const twists = vector[i];
    const pair = i % 2 === 0
      ? twistBox(x, y2, y2, tw, distance, twists, 1, [1, 1, 0, 0])
      : twistBox(x, 0, y2, tw, distance, twists, 0, [0, 0, 1, 1]);
    p.push(...pair[0], ...pair[1]);
    move(p, x, i % 2 === 0 ? 0 : y3);
    line(p, x + 2 * distance + twists * tw, i % 2 === 0 ? 0 : y3);
    move(p, x, width); line(p, x + 2 * distance + twists * tw, width);
    x += 2 * distance + twists * tw;
  }
  move(p, 0, 0); quad(p, -2 * tw, 0, 0, y2);
  move(p, 0, y3); quad(p, -2 * tw, width, 0, width);
  move(p, x, 0); quad(p, x + 2 * tw, 0, x, y2);
  move(p, x, y3); quad(p, x + 2 * tw, width, x, width);
  const box = bounds([p]), padding = 8;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box.minX - padding} ${box.minY - padding} ${box.maxX - box.minX + 2 * padding} ${box.maxY - box.minY + 2 * padding}" role="img" aria-label="Generated 4-plat diagram ${label}"><path d="${pathData(p)}" fill="none" stroke="#566d73" stroke-width="2" stroke-linecap="round"/></svg>`;
}
