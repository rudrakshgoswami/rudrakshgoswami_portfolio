/**
 * IsoHero - isometric backdrop for the hero section
 *
 * The same drawing language as the GitHub profile art, rebuilt for a page
 * that is light, monochrome and already busy in the middle. Three pieces,
 * each at its own depth:
 *
 *   floor    a receding isometric grid along the bottom, so the portrait
 *            has something to stand on instead of floating
 *   stacks   two small slab clusters in the upper corners, which is where
 *            the whitespace actually is once the title and portrait are in
 *
 * There is no accent colour on this site, so depth is carried entirely by
 * value. The faces are cut from the same greyscale ramp as the metallic
 * GOSWAMI title, and the top slab of each cluster goes near-black to echo
 * the solid RUDRAKSH above it.
 *
 * Motion is pointer parallax only: JS writes two custom properties and CSS
 * does the moving, so nothing lands on the main thread per frame. The comet
 * cursor already listens on document, so this listens on the hero alone.
 */

const COS30 = Math.cos(Math.PI / 6);
const SIN30 = 0.5;

const SVG_NS = 'http://www.w3.org/2000/svg';

// Cut from the metallic-title ramp, so the slabs and the wordmark agree.
const STONE = { top: '#E2E2E2', left: '#BBBBBB', right: '#9F9F9F', edge: '#8E8E8E' };
const SLATE = { top: '#4A4A4A', left: '#2B2B2B', right: '#1A1A1A', edge: '#121212' };

const FLOOR_W = 1400; // the hero's own max-width, so the grid lines up with it
const FLOOR_H = 420;
const FLOOR_COLS = 26;
const FLOOR_ROWS = 14;
const FLOOR_UNIT = 54;

const CLUSTER = 44; // grid units per slab in the corner clusters
const LIFT = 0.95; // vertical gap between slabs, in grid units

const project = (x, y, z, unit) => [
  (x - y) * COS30 * unit,
  (x + y) * SIN30 * unit - z * unit,
];

const el = (name, attrs) => {
  const node = document.createElementNS(SVG_NS, name);
  for (const key in attrs) node.setAttribute(key, attrs[key]);
  return node;
};

const svgRoot = (w, h, cls) => {
  const svg = el('svg', {
    xmlns: SVG_NS,
    viewBox: `0 0 ${w} ${h}`,
    width: w,
    height: h,
    class: cls,
    focusable: 'false',
    'aria-hidden': 'true',
  });
  return svg;
};

/** One box, drawn as its three visible faces. Light sits upper-left. */
function slab(parent, ox, oy, unit, x0, y0, x1, y1, z0, z1, pal) {
  const p = (x, y, z) => {
    const [sx, sy] = project(x, y, z, unit);
    return `${(ox + sx).toFixed(2)},${(oy + sy).toFixed(2)}`;
  };

  // The faces at minimum x and minimum y are the ones turned toward us.
  parent.appendChild(el('polygon', {
    points: [p(x0, y0, z0), p(x1, y0, z0), p(x1, y0, z1), p(x0, y0, z1)].join(' '),
    fill: pal.right,
  }));
  parent.appendChild(el('polygon', {
    points: [p(x0, y0, z0), p(x0, y1, z0), p(x0, y1, z1), p(x0, y0, z1)].join(' '),
    fill: pal.left,
  }));
  parent.appendChild(el('polygon', {
    points: [p(x0, y0, z1), p(x1, y0, z1), p(x1, y1, z1), p(x0, y1, z1)].join(' '),
    fill: pal.top,
    stroke: pal.edge,
    'stroke-width': '1',
    'stroke-linejoin': 'round',
  }));
}

function buildFloor() {
  const svg = svgRoot(FLOOR_W, FLOOR_H, 'iso-layer iso-floor');

  const defs = el('defs', {});
  const grad = el('linearGradient', { id: 'isoFloorFade', x1: '0', y1: '0', x2: '0', y2: '1' });
  grad.appendChild(el('stop', { offset: '0', 'stop-color': '#000', 'stop-opacity': '0' }));
  grad.appendChild(el('stop', { offset: '0.45', 'stop-color': '#fff', 'stop-opacity': '0.75' }));
  grad.appendChild(el('stop', { offset: '1', 'stop-color': '#fff', 'stop-opacity': '1' }));
  const side = el('linearGradient', { id: 'isoSideFade', x1: '0', y1: '0', x2: '1', y2: '0' });
  side.appendChild(el('stop', { offset: '0', 'stop-color': '#000' }));
  side.appendChild(el('stop', { offset: '0.18', 'stop-color': '#fff' }));
  side.appendChild(el('stop', { offset: '0.82', 'stop-color': '#fff' }));
  side.appendChild(el('stop', { offset: '1', 'stop-color': '#000' }));
  const mask = el('mask', { id: 'isoFloorMask' });
  mask.appendChild(el('rect', { width: FLOOR_W, height: FLOOR_H, fill: 'url(#isoFloorFade)' }));
  mask.appendChild(el('rect', {
    width: FLOOR_W, height: FLOOR_H, fill: 'url(#isoSideFade)',
    style: 'mix-blend-mode:multiply',
  }));
  defs.appendChild(grad);
  defs.appendChild(side);
  defs.appendChild(mask);
  svg.appendChild(defs);

  const group = el('g', {
    mask: 'url(#isoFloorMask)',
    stroke: '#121212',
    'stroke-width': '1',
    opacity: '0.13',
    fill: 'none',
  });

  // Centre the diamond on the hero and let the mask handle the overhang.
  const ox = FLOOR_W / 2 + ((FLOOR_ROWS - FLOOR_COLS) / 2) * COS30 * FLOOR_UNIT * -1;
  const oy = FLOOR_H - ((FLOOR_COLS + FLOOR_ROWS) / 2) * SIN30 * FLOOR_UNIT;

  const line = (ax, ay, bx, by) => {
    const [x1, y1] = project(ax, ay, 0, FLOOR_UNIT);
    const [x2, y2] = project(bx, by, 0, FLOOR_UNIT);
    group.appendChild(el('line', {
      x1: (ox + x1).toFixed(2), y1: (oy + y1).toFixed(2),
      x2: (ox + x2).toFixed(2), y2: (oy + y2).toFixed(2),
    }));
  };
  for (let i = 0; i <= FLOOR_COLS; i += 1) line(i, 0, i, FLOOR_ROWS);
  for (let j = 0; j <= FLOOR_ROWS; j += 1) line(0, j, FLOOR_COLS, j);

  svg.appendChild(group);
  return svg;
}

/** A corner cluster: three slabs stacked with air between them. */
function buildCluster(side) {
  const w = 230;
  const h = 250;
  const svg = svgRoot(w, h, `iso-layer iso-stack iso-stack--${side}`);
  const ox = w / 2;
  const oy = h - 74;

  // Bottom two in stone, the top one near-black, so the eye lands on it.
  const levels = [
    { z: 0, pal: STONE, depth: '3' },
    { z: LIFT, pal: STONE, depth: '2' },
    { z: LIFT * 2, pal: SLATE, depth: '1' },
  ];
  levels.forEach((level, index) => {
    const group = el('g', {
      class: 'iso-slab',
      'data-depth': level.depth,
      style: `--slab-index:${index}`,
    });
    slab(group, ox, oy, CLUSTER, 0, 0, 1.7, 1.7, level.z, level.z + 0.44, level.pal);
    svg.appendChild(group);
  });

  return svg;
}

export function initIsoHero(host) {
  if (!host) return null;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  host.textContent = '';
  host.appendChild(buildFloor());
  host.appendChild(buildCluster('left'));
  host.appendChild(buildCluster('right'));
  host.classList.add('is-ready');
  if (reduced) {
    host.classList.add('is-static');
    return { destroy() { host.textContent = ''; } };
  }

  // Pointer parallax. The values are written as custom properties and the
  // transforms live in CSS, so a move costs one style write rather than a
  // layout pass per layer.
  const hero = host.parentElement || host;
  let frame = 0;
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;

  const settle = () => {
    currentX += (targetX - currentX) * 0.08;
    currentY += (targetY - currentY) * 0.08;
    host.style.setProperty('--iso-x', currentX.toFixed(4));
    host.style.setProperty('--iso-y', currentY.toFixed(4));
    if (Math.abs(targetX - currentX) > 0.001 || Math.abs(targetY - currentY) > 0.001) {
      frame = requestAnimationFrame(settle);
    } else {
      frame = 0;
    }
  };

  const wake = () => { if (!frame) frame = requestAnimationFrame(settle); };

  const onMove = (event) => {
    const box = hero.getBoundingClientRect();
    if (!box.width || !box.height) return;
    targetX = ((event.clientX - box.left) / box.width) * 2 - 1;
    targetY = ((event.clientY - box.top) / box.height) * 2 - 1;
    wake();
  };

  const onLeave = () => { targetX = 0; targetY = 0; wake(); };

  hero.addEventListener('pointermove', onMove, { passive: true });
  hero.addEventListener('pointerleave', onLeave, { passive: true });

  return {
    destroy() {
      hero.removeEventListener('pointermove', onMove);
      hero.removeEventListener('pointerleave', onLeave);
      if (frame) cancelAnimationFrame(frame);
      host.textContent = '';
    },
  };
}

function start() {
  const host = document.getElementById('iso-hero');
  if (host) initIsoHero(host);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}
