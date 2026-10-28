(() => {
  'use strict';

  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const hero = document.querySelector('.masthead-art');
  const revealTargets = Array.from(document.querySelectorAll(
    '.section-heading,.comparison,.chart-card,.metric-cards,.reasoning-layout,.paper-intro,.citation-panel'
  ));
  let progressFrame = null;
  let pointerFrame = null;
  let pointerPosition = {x: 50, y: 35};
  let revealObserver = null;

  function updateProgress() {
    progressFrame = null;
    const distance = root.scrollHeight - window.innerHeight;
    const progress = distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 0;
    root.style.setProperty('--reading-progress', String(progress));
  }

  function queueProgress() {
    if (progressFrame === null && !document.hidden) {
      progressFrame = requestAnimationFrame(updateProgress);
    }
  }

  function resetHero() {
    if (pointerFrame !== null) cancelAnimationFrame(pointerFrame);
    pointerFrame = null;
    if (!hero) return;
    hero.classList.remove('hero-pointer');
    hero.style.setProperty('--hero-x', '50%');
    hero.style.setProperty('--hero-y', '35%');
  }

  function reveal(element) {
    element.classList.add('is-visible');
    if (revealObserver) revealObserver.unobserve(element);
  }

  function configureMotion() {
    if (revealObserver) revealObserver.disconnect();
    revealObserver = null;
    if (reducedMotion.matches || !('IntersectionObserver' in window)) {
      root.classList.remove('motion-ready');
      revealTargets.forEach(element => element.classList.add('is-visible'));
      resetHero();
      return;
    }
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) reveal(entry.target);
      });
    }, {threshold: 0.08, rootMargin: '0px 0px -20px 0px'});
    revealTargets.forEach(element => {
      element.classList.add('reveal');
      if (!element.classList.contains('is-visible')) revealObserver.observe(element);
    });
    root.classList.add('motion-ready');
  }

  window.addEventListener('scroll', queueProgress, {passive: true});
  window.addEventListener('resize', queueProgress, {passive: true});
  window.addEventListener('load', queueProgress, {once: true});
  if ('ResizeObserver' in window) new ResizeObserver(queueProgress).observe(document.body);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (progressFrame !== null) cancelAnimationFrame(progressFrame);
      progressFrame = null;
      resetHero();
    } else queueProgress();
  });
  document.addEventListener('focusin', event => {
    const element = event.target instanceof Element ? event.target.closest('.reveal') : null;
    if (element) reveal(element);
  });

  if (hero) {
    hero.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse' || !finePointer.matches || reducedMotion.matches) return;
      const bounds = hero.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      pointerPosition = {
        x: Math.min(100, Math.max(0, (event.clientX - bounds.left) / bounds.width * 100)),
        y: Math.min(100, Math.max(0, (event.clientY - bounds.top) / bounds.height * 100))
      };
      if (pointerFrame !== null) return;
      pointerFrame = requestAnimationFrame(() => {
        pointerFrame = null;
        hero.style.setProperty('--hero-x', pointerPosition.x + '%');
        hero.style.setProperty('--hero-y', pointerPosition.y + '%');
        hero.classList.add('hero-pointer');
      });
    }, {passive: true});
    hero.addEventListener('pointerleave', resetHero);
  }

  if (reducedMotion.addEventListener) {
    reducedMotion.addEventListener('change', configureMotion);
    finePointer.addEventListener('change', resetHero);
  } else {
    reducedMotion.addListener(configureMotion);
    finePointer.addListener(resetHero);
  }

  configureMotion();
  queueProgress();
})();
