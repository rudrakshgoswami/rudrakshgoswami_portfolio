/**
 * IsoKit - the isometric drawing primitives shared across the page
 *
 * Projection is true 30-degree isometric:
 *
 *   sx = (x - y) * cos(30)
 *   sy = (x + y) * sin(30) - z
 *
 * x runs right-and-down the screen, y runs left-and-down, z is up. The viewer
 * sits at negative x and y looking down, so the two visible side faces of any
 * box are the ones at its minimum x (screen-left) and minimum y (screen-right).
 * Light comes from the upper left, which makes the top face brightest, the
 * x-face mid and the y-face darkest.
 *
 * This lives apart from the sections that use it for the same reason the
 * GitHub profile art is generated rather than hand-drawn: isometric
 * coordinates are unforgiving, and one wrong number shows up as a crooked box.
 */

export const COS30 = Math.cos(Math.PI / 6);
export const SIN30 = 0.5;
export const SVG_NS = 'http://www.w3.org/2000/svg';

// Cut from the metallic-title ramp, so the slabs and the wordmark agree.
export const STONE = { top: '#E2E2E2', left: '#BBBBBB', right: '#9F9F9F', edge: '#8E8E8E' };
export const SLATE = { top: '#4A4A4A', left: '#2B2B2B', right: '#1A1A1A', edge: '#121212' };

export const project = (x, y, z, unit) => [
  (x - y) * COS30 * unit,
  (x + y) * SIN30 * unit - z * unit,
];

export const el = (name, attrs) => {
  const node = document.createElementNS(SVG_NS, name);
  for (const key in attrs) node.setAttribute(key, attrs[key]);
  return node;
};

export const svgRoot = (w, h, cls) => el('svg', {
  xmlns: SVG_NS,
  viewBox: `0 0 ${w} ${h}`,
  width: w,
  height: h,
  class: cls,
  focusable: 'false',
  'aria-hidden': 'true',
});

/** One box, drawn as its three visible faces, appended to `parent`. */
export function slab(parent, ox, oy, unit, x0, y0, x1, y1, z0, z1, pal) {
  const p = (x, y, z) => {
    const [sx, sy] = project(x, y, z, unit);
    return `${(ox + sx).toFixed(2)},${(oy + sy).toFixed(2)}`;
  };

  // The faces at minimum x and minimum y are the ones turned toward us.
  const right = el('polygon', {
    points: [p(x0, y0, z0), p(x1, y0, z0), p(x1, y0, z1), p(x0, y0, z1)].join(' '),
    fill: pal.right,
  });
  const left = el('polygon', {
    points: [p(x0, y0, z0), p(x0, y1, z0), p(x0, y1, z1), p(x0, y0, z1)].join(' '),
    fill: pal.left,
  });
  const top = el('polygon', {
    points: [p(x0, y0, z1), p(x1, y0, z1), p(x1, y1, z1), p(x0, y1, z1)].join(' '),
    fill: pal.top,
    stroke: pal.edge,
    'stroke-width': '1',
    'stroke-linejoin': 'round',
  });

  parent.appendChild(right);
  parent.appendChild(left);
  parent.appendChild(top);
}

/**
 * A receding isometric floor, masked so it dissolves upward and at both
 * sides rather than ending on a hard diamond edge.
 *
 * `id` must be unique per instance. Inline SVG shares the document's id
 * space, so two grids with the same mask id both resolve to whichever was
 * parsed first, and the second one silently loses its fade.
 */
export function buildGrid({
  id,
  cls = '',
  width = 1400,
  height = 420,
  cols = 26,
  rows = 14,
  unit = 54,
  stroke = '#121212',
  opacity = 0.13,
}) {
  const svg = svgRoot(width, height, cls);
  const fadeId = `${id}Fade`;
  const sideId = `${id}Side`;
  const maskId = `${id}Mask`;

  const defs = el('defs', {});
  const fade = el('linearGradient', { id: fadeId, x1: '0', y1: '0', x2: '0', y2: '1' });
  fade.appendChild(el('stop', { offset: '0', 'stop-color': '#000', 'stop-opacity': '0' }));
  fade.appendChild(el('stop', { offset: '0.45', 'stop-color': '#fff', 'stop-opacity': '0.75' }));
  fade.appendChild(el('stop', { offset: '1', 'stop-color': '#fff', 'stop-opacity': '1' }));

  const side = el('linearGradient', { id: sideId, x1: '0', y1: '0', x2: '1', y2: '0' });
  side.appendChild(el('stop', { offset: '0', 'stop-color': '#000' }));
  side.appendChild(el('stop', { offset: '0.18', 'stop-color': '#fff' }));
  side.appendChild(el('stop', { offset: '0.82', 'stop-color': '#fff' }));
  side.appendChild(el('stop', { offset: '1', 'stop-color': '#000' }));

  const mask = el('mask', { id: maskId });
  mask.appendChild(el('rect', { width, height, fill: `url(#${fadeId})` }));
  mask.appendChild(el('rect', {
    width, height, fill: `url(#${sideId})`, style: 'mix-blend-mode:multiply',
  }));

  defs.appendChild(fade);
  defs.appendChild(side);
  defs.appendChild(mask);
  svg.appendChild(defs);

  const group = el('g', {
    mask: `url(#${maskId})`,
    stroke,
    'stroke-width': '1',
    opacity: String(opacity),
    fill: 'none',
  });

  // Centre the diamond on the box and let the mask handle the overhang.
  const ox = width / 2 - ((rows - cols) / 2) * COS30 * unit;
  const oy = height - ((cols + rows) / 2) * SIN30 * unit;

  const line = (ax, ay, bx, by) => {
    const [x1, y1] = project(ax, ay, 0, unit);
    const [x2, y2] = project(bx, by, 0, unit);
    group.appendChild(el('line', {
      x1: (ox + x1).toFixed(2), y1: (oy + y1).toFixed(2),
      x2: (ox + x2).toFixed(2), y2: (oy + y2).toFixed(2),
    }));
  };
  for (let i = 0; i <= cols; i += 1) line(i, 0, i, rows);
  for (let j = 0; j <= rows; j += 1) line(0, j, cols, j);

  svg.appendChild(group);
  return svg;
}

/** matchMedia wrapper, so every scene asks the same question the same way. */
export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
