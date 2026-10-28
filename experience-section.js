/**
 * ExperienceSection: "Where I've Been"
 * Horizontal spatial canvas driven by vertical scroll.
 * No dependencies: every effect is computed from one passive scroll listener.
 */

export function initExperienceSection() {
  const section = document.getElementById('experience');
  if (!section) return;

  const stage = document.getElementById('exp-horizontal-stage');
  if (!stage) return;

  const tickerTop = document.getElementById('exp-ticker-top');
  const tickerBottom = document.getElementById('exp-ticker-bottom');
  const hudProgress = document.getElementById('exp-hud-progress');
  const hudPhase = document.getElementById('exp-hud-phase');
  const dateBgs = document.querySelectorAll('.exp-date-bg');
  const jumpButtons = document.querySelectorAll('.exp-jump-btn');

  // Check reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // NOTE: this section used to pull in the 460 KB @fiddle-digital/string-tune
  // runtime. Every effect below (the horizontal camera, the parallax dates,
  // the counter-drifting tickers and the HUD) is computed here from a plain
  // passive scroll listener, so the library was downloaded and never used for
  // anything. It and its node_modules entry have been removed.

  // Camera & Interpolation Physics
  let currentTranslateX = 0;
  let targetTranslateX = 0;
  let currentProgress = 0;
  let targetProgress = 0;
  let isTicking = false;

  // Compute maximum horizontal travel based on canvas geometry
  function getDimensions() {
    const totalDist = section.offsetHeight - window.innerHeight;
    const stageWidth = stage.scrollWidth;
    const maxTranslate = Math.max(0, stageWidth - window.innerWidth);
    return { totalDist, maxTranslate };
  }

  let { totalDist, maxTranslate } = getDimensions();

  function remeasure() {
    ({ totalDist, maxTranslate } = getDimensions());
    if (prefersReducedMotion) {
      stage.style.transform = 'none';
    }
  }

  window.addEventListener('resize', remeasure, { passive: true });

  // The Tailwind CDN build generates its stylesheet at runtime, so the first
  // measurement can land before the section has its real height. Re-measure
  // once everything has actually loaded, and again from the observer below.
  window.addEventListener('load', remeasure, { passive: true });
  if (window.ResizeObserver) {
    new ResizeObserver(remeasure).observe(section);
  }

  // Update loop for 60/120 FPS camera interpolation
  function renderFrame() {
    isTicking = false;

    if (prefersReducedMotion) {
      return;
    }

    // Smooth inertia lerp (0.09 factor gives tactile, responsive feel)
    currentProgress += (targetProgress - currentProgress) * 0.09;
    currentTranslateX += (targetTranslateX - currentTranslateX) * 0.09;

    // 1. Move Horizontal Camera / Stage
    stage.style.transform = `translate3d(${currentTranslateX.toFixed(2)}px, 0, 0)`;

    // 2. Parallax Drift for Large Background Typography Dates
    dateBgs.forEach(dateEl => {
      const factor = parseFloat(dateEl.getAttribute('data-parallax-factor') || '0.15');
      const dateOffset = -currentTranslateX * factor;
      dateEl.style.transform = `translate3d(${dateOffset.toFixed(2)}px, 0, 0)`;
    });

    // 3. Counter-drifting Background Tickers
    if (tickerTop) {
      const topOffset = currentTranslateX * 0.35;
      tickerTop.style.transform = `translate3d(${topOffset.toFixed(2)}px, 0, 0)`;
    }
    if (tickerBottom) {
      const bottomOffset = -currentTranslateX * 0.25;
      tickerBottom.style.transform = `translate3d(${bottomOffset.toFixed(2)}px, 0, 0)`;
    }

    // 4. Update HUD Progress Bar
    if (hudProgress) {
      hudProgress.style.width = `${(currentProgress * 100).toFixed(1)}%`;
    }

    // 5. Update HUD Phase Title
    if (hudPhase) {
      if (currentProgress < 0.20) {
        hudPhase.textContent = "FOUNDATION";
      } else if (currentProgress < 0.45) {
        hudPhase.textContent = "INTERN · 2024-25";
      } else if (currentProgress < 0.72) {
        hudPhase.textContent = "DEVELOPER · 2025-26";
      } else {
        hudPhase.textContent = "AI ENGINEERING · NOW";
      }
    }

    // 6. Highlight active bottom jump button
    jumpButtons.forEach(btn => {
      const btnTarget = parseFloat(btn.getAttribute('data-target-progress') || '0');
      const isCurrent = Math.abs(currentProgress - btnTarget) < 0.20;
      if (isCurrent) {
        btn.classList.add('text-white', 'bg-white/20', 'border-white/40');
        btn.classList.remove('text-neutral-500', 'border-white/5');
      } else {
        btn.classList.remove('text-white', 'bg-white/20', 'border-white/40');
        btn.classList.add('text-neutral-500', 'border-white/5');
      }
    });

    // Keep loop active until settle
    if (Math.abs(targetTranslateX - currentTranslateX) > 0.1 || Math.abs(targetProgress - currentProgress) > 0.001) {
      requestAnimationFrame(renderFrame);
      isTicking = true;
    }
  }

  // Scroll listener computing normalized progress (0.0 to 1.0)
  function onScroll() {
    const rect = section.getBoundingClientRect();
    const scrolled = -rect.top;

    // Self-heal if the section had no measurable height at start-up
    if (totalDist <= 0) remeasure();
    if (totalDist <= 0) return;

    // Normalized progress within the section's vertical travel track
    const rawProgress = scrolled / totalDist;
    targetProgress = Math.min(Math.max(rawProgress, 0), 1);
    targetTranslateX = -targetProgress * maxTranslate;

    if (!isTicking) {
      isTicking = true;
      requestAnimationFrame(renderFrame);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  // Interactive Chapter Jump Click Handlers
  jumpButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const p = parseFloat(btn.getAttribute('data-target-progress') || '0');
      const sectionTop = section.getBoundingClientRect().top + window.scrollY;
      const targetScroll = sectionTop + p * totalDist;

      window.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
      });
    });
  });

  // Initial calculation
  onScroll();
}

// Auto-boot upon DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initExperienceSection);
} else {
  initExperienceSection();
}
