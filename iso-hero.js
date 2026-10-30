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

import {
  STONE,
  SLATE,
  buildGrid,
  el,
  prefersReducedMotion,
  slab,
  svgRoot,
} from './iso-kit.js';

const CLUSTER = 44; // grid units per slab in the corner clusters
const TITLE_GAP = 26; // clear air to leave between a cluster and the wordmark
const LIFT = 0.95; // vertical gap between slabs, in grid units

const buildFloor = () => buildGrid({
  id: 'isoHeroFloor',
  cls: 'iso-layer iso-floor',
  width: 1400, // the hero's own max-width, so the grid lines up with it
  height: 420,
  cols: 26,
  rows: 14,
  unit: 54,
});

/** A corner cluster: three slabs stacked with air between them. */
function buildCluster(side) {
  const w = 230;
  const h = 250;
  const svg = svgRoot(w, h, `iso-layer iso-stack iso-stack--${side}`);
  const ox = w / 2;
  const oy = h - 74;

  // Bottom two in stone, the top one near-black, so the eye lands on it.
  const levels = [
    { z: 0, pal: STONE },
    { z: LIFT, pal: STONE },
    { z: LIFT * 2, pal: SLATE },
  ];
  levels.forEach((level, index) => {
    const group = el('g', { class: 'iso-slab', style: `--slab-index:${index}` });
    slab(group, ox, oy, CLUSTER, 0, 0, 1.7, 1.7, level.z, level.z + 0.44, level.pal);
    svg.appendChild(group);
  });

  return svg;
}

export function initIsoHero(host) {
  if (!host) return null;

  const reduced = prefersReducedMotion();

  host.textContent = '';
  host.appendChild(buildFloor());
  host.appendChild(buildCluster('left'));
  host.appendChild(buildCluster('right'));
  // The wordmark is set in vw below 768px and in rem above it, so between
  // about 768 and 1150 it grows wide enough to reach into the corners the
  // clusters occupy. Rather than guess a breakpoint, measure: if either
  // cluster comes within TITLE_GAP of the title box, both come out.
  const title = document.getElementById('hero-title');
  const stacks = host.querySelectorAll('.iso-stack');

  // The h1 is a full-width block, so its own box says nothing about where
  // the letterforms end. The inner spans hug the words, so measure those.
  const titleBox = () => {
    const words = title.querySelectorAll('span span');
    if (!words.length) return title.getBoundingClientRect();
    let left = Infinity;
    let right = -Infinity;
    words.forEach((word) => {
      const rect = word.getBoundingClientRect();
      if (!rect.width) return;
      left = Math.min(left, rect.left);
      right = Math.max(right, rect.right);
    });
    return Number.isFinite(left) ? { left, right } : title.getBoundingClientRect();
  };

  const fit = () => {
    if (!title) return;
    host.classList.remove('is-crowded');
    const box = titleBox();
    let crowded = false;
    stacks.forEach((stack) => {
      const rect = stack.getBoundingClientRect();
      if (!rect.width) return; // already hidden by the phone breakpoint
      const overlap = Math.min(box.right, rect.right) - Math.max(box.left, rect.left);
      if (overlap > -TITLE_GAP) crowded = true;
    });
    if (crowded) host.classList.add('is-crowded');
  };

  let fitFrame = 0;
  const onResize = () => {
    if (fitFrame) return;
    fitFrame = requestAnimationFrame(() => { fitFrame = 0; fit(); });
  };
  fit();
  window.addEventListener('resize', onResize, { passive: true });
  // The wordmark is set in a webfont, so its width changes once that lands.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);

  host.classList.add('is-ready');
  if (reduced) {
    host.classList.add('is-static');
    return {
      destroy() {
        window.removeEventListener('resize', onResize);
        host.textContent = '';
      },
    };
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
      window.removeEventListener('resize', onResize);
      if (frame) cancelAnimationFrame(frame);
      if (fitFrame) cancelAnimationFrame(fitFrame);
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
