/** Reveal elements marked with [data-reveal] once as they enter the viewport. */
export function initReveal(reducedMotion: boolean): void {
  const mark = (el: Element) => el.classList.add('is-visible');

  if (reducedMotion || !('IntersectionObserver' in window)) {
    document.querySelectorAll('[data-reveal]').forEach(mark);
    document.addEventListener('content:rendered', () => document.querySelectorAll('[data-reveal]').forEach(mark));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        mark(entry.target);
        io.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );

  const observeAll = () =>
    document.querySelectorAll('[data-reveal]:not(.is-visible)').forEach((el, i) => {
      // Stagger siblings that enter together.
      (el as HTMLElement).style.setProperty('--d', `${(i % 4) * 70}ms`);
      io.observe(el);
    });

  observeAll();
  document.addEventListener('content:rendered', observeAll);
}

