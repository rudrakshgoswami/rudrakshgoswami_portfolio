/**
 * IsoSections - the isometric language carried below the hero
 *
 * Two places earn it, and the rest deliberately do not. About and Experience
 * already run their own cinematic treatments, and Selected Work is a carousel
 * that should be the only thing competing for attention in its panel. Adding
 * geometry there would be noise.
 *
 *   services  the accordion is max-w-4xl inside a max-w-[1400px] section,
 *             which leaves about 196px of dead gutter on each side. Four
 *             services, four slabs: the slab for the open item goes near-black
 *             and lifts, so the drawing says what the list says.
 *
 *   footer    an isometric floor under LET'S TALK, in white on near-black, so
 *             the page closes on the same ground it opened on.
 *
 * The services stacks need real gutter to live in, so they are measured
 * against the accordion the same way the hero clusters are measured against
 * the wordmark, rather than guessed at with a breakpoint.
 */

import {
  COS30,
  SLATE,
  STONE,
  buildGrid,
  el,
  prefersReducedMotion,
  repaint,
  slab,
  svgRoot,
} from './iso-kit.js';

const SVC_UNIT = 40; // grid units per slab beside each service row
const SVC_FOOT = 1.7; // slab footprint, in grid units
const SVC_THICK = 0.44; // slab thickness
const SVC_LIFT = 0.95; // vertical gap between slabs
const SVC_GAP = 26; // clear air between a stack and the accordion

/**
 * One slab per service row, each its own small SVG so it can be parked at
 * its row's centre.
 *
 * An evenly spaced stack was the first attempt, and it sat almost but not
 * quite level with the rows. Near-alignment reads as a mistake, where no
 * alignment at all would have read as a decision. Tracking the rows is also
 * the more honest drawing: open a row and it grows, and the slab beside it
 * moves with it.
 */
function buildServiceMarks(side, count) {
  // Size the box to the drawing rather than the other way round. The shape
  // runs from the top face's far vertex down to the base's near vertex, so
  // its height is (footprint + thickness) * unit and its width is twice the
  // half-diagonal. Getting this wrong once put every slab 14px above its row,
  // because centring the box no longer centred the slab inside it.
  const w = 2 * SVC_FOOT * COS30 * SVC_UNIT;
  const h = (SVC_FOOT + SVC_THICK) * SVC_UNIT;
  const marks = [];

  for (let index = 0; index < count; index += 1) {
    const svg = svgRoot(Math.round(w), Math.round(h), `iso-svc-slab iso-svc-slab--${side}`);
    svg.setAttribute('data-index', String(index));
    const faces = slab(
      svg, w / 2, SVC_THICK * SVC_UNIT, SVC_UNIT,
      0, 0, SVC_FOOT, SVC_FOOT, 0, SVC_THICK, STONE,
    );
    marks.push({ svg, faces });
  }

  return marks;
}

function initServices() {
  const rail = document.querySelector('#service-0')?.parentElement;
  if (!rail) return null;

  const items = [...rail.querySelectorAll('.accordion-item')];
  if (!items.length) return null;

  const host = document.createElement('div');
  host.className = 'iso-services';
  host.setAttribute('aria-hidden', 'true');

  const columns = ['left', 'right'].map((side) => buildServiceMarks(side, items.length));
  columns.forEach((marks) => marks.forEach((mark) => host.appendChild(mark.svg)));

  rail.classList.add('iso-services-rail');
  rail.insertBefore(host, rail.firstChild);

  const paint = () => {
    const active = items.findIndex((item) => item.classList.contains('active'));
    columns.forEach((marks) => marks.forEach((mark, index) => {
      repaint(mark.faces, index === active ? SLATE : STONE);
      mark.svg.classList.toggle('is-active', index === active);
    }));
  };

  // Park each slab on its row's centre. Opening a row changes every row
  // below it, so this runs whenever the accordion changes, not just on
  // resize. offsetTop is relative to the rail, which is the slabs' own
  // containing block, so no scroll position enters into it.
  //
  // This hands CSS the row's centre and lets translate's own -50% do the
  // centring. Measuring the slab here instead left every one of them 7px
  // high, because its rendered height is not settled at the moment this
  // first runs, and a percentage in translate always resolves against the
  // element's real size.
  const layout = () => {
    items.forEach((item, index) => {
      const middle = item.offsetTop + item.offsetHeight / 2;
      columns.forEach((marks) => {
        marks[index].svg.style.setProperty('--mark-y', `${middle.toFixed(1)}px`);
      });
    });
  };

  // Hide the slabs when the gutter beside the accordion is too narrow to
  // hold one. Same reasoning as the hero: the measurement is steadier than
  // a breakpoint, because the gutter depends on the section's max width,
  // its padding and the viewport all at once.
  const fit = () => {
    host.classList.remove('is-crowded');
    const rect = rail.getBoundingClientRect();
    const mark = columns[0][0].svg.getBoundingClientRect();
    if (!mark.width) return;
    const needed = mark.width + SVC_GAP;
    if (rect.left < needed || window.innerWidth - rect.right < needed) {
      host.classList.add('is-crowded');
    }
  };

  const refresh = () => { fit(); layout(); };

  // The accordion is driven by a global toggleService() and by keyboard
  // handlers in the page. Watching the class rather than wrapping that
  // function means this keeps up with every route into it, including any
  // added later, and touches none of them.
  const observer = new MutationObserver(() => { paint(); layout(); });
  items.forEach((item) => observer.observe(item, {
    attributes: true,
    attributeFilter: ['class'],
  }));

  let frame = 0;
  const onResize = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => { frame = 0; refresh(); });
  };
  paint();
  refresh();
  window.addEventListener('resize', onResize, { passive: true });

  // A row's height changes over its 0.4s max-height transition, so the
  // positions taken when the class flips are mid-flight. Watching the rows
  // resize catches every frame of that and whatever else moves them, which
  // transitionend alone would not: it needs the transition to both run and
  // finish, and the first open can happen before the row is ever painted.
  //
  // The rail is watched as well as the rows. Inserting this host makes the
  // first row a second child, so Tailwind's space-y rule starts applying a
  // 14px margin to it, which moves every row down without changing any
  // row's size. Watching rows alone missed that, and left the slabs 14px
  // high until the first click put them right.
  let sizer = null;
  if ('ResizeObserver' in window) {
    sizer = new ResizeObserver(layout);
    items.forEach((item) => sizer.observe(item));
    sizer.observe(rail);
  } else {
    rail.addEventListener('transitionend', layout);
  }

  // Webfonts and late stylesheets both change row heights after this runs.
  window.addEventListener('load', refresh);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);

  host.classList.add('is-ready');

  return {
    destroy() {
      observer.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('load', refresh);
      if (sizer) sizer.disconnect();
      else rail.removeEventListener('transitionend', layout);
      if (frame) cancelAnimationFrame(frame);
      host.remove();
      rail.classList.remove('iso-services-rail');
    },
  };
}

function initFooter() {
  const footer = document.getElementById('contact');
  if (!footer) return null;

  const host = document.createElement('div');
  host.className = 'iso-footer';
  host.setAttribute('aria-hidden', 'true');
  host.appendChild(buildGrid({
    id: 'isoFooterFloor',
    cls: 'iso-footer-floor',
    width: 1400,
    height: 380,
    cols: 26,
    rows: 12,
    unit: 54,
    stroke: '#FFFFFF',
    opacity: 0.1,
  }));

  footer.classList.add('iso-footer-host');
  footer.insertBefore(host, footer.firstChild);
  host.classList.add('is-ready');

  return { destroy() { host.remove(); footer.classList.remove('iso-footer-host'); } };
}

export function initIsoSections() {
  const scenes = [initServices(), initFooter()].filter(Boolean);
  if (prefersReducedMotion()) {
    document.querySelectorAll('.iso-services, .iso-footer')
      .forEach((node) => node.classList.add('is-static'));
  }
  return {
    destroy() { scenes.forEach((scene) => scene.destroy()); },
  };
}

function start() { initIsoSections(); }

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}
