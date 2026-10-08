/** Minimal desktop-only cursor: a precise dot plus a lagging ring that expands over interactive elements. */
export function initCursor(): void {
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const el = document.querySelector<HTMLElement>('.cursor');
  if (!el || !fine || reduced) {
    el?.remove();
    return;
  }

  const dot = el.querySelector<HTMLElement>('.cursor__dot')!;
  const ring = el.querySelector<HTMLElement>('.cursor__ring')!;
  document.documentElement.classList.add('has-cursor');

  let x = -100;
  let y = -100;
  let rx = x;
  let ry = y;
  let raf = 0;
  const interactive = 'a, button, [role="button"], input, textarea, select, label, [data-cursor]';

  const loop = () => {
    rx += (x - rx) * 0.18;
    ry += (y - ry) * 0.18;
    dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
    raf = Math.abs(x - rx) + Math.abs(y - ry) > 0.1 ? requestAnimationFrame(loop) : 0;
  };

  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') return;
      x = e.clientX;
      y = e.clientY;
      el.classList.add('is-visible');
      if (!raf) raf = requestAnimationFrame(loop);
    },
    { passive: true },
  );

  document.addEventListener('pointerover', (e) => {
    const target = (e.target as Element).closest(interactive);
    el.classList.toggle('is-hover', !!target);
    el.classList.toggle('is-frame', !!(e.target as Element).closest('.browser__viewport'));
  });
  document.addEventListener('pointerdown', () => el.classList.add('is-down'));
  document.addEventListener('pointerup', () => el.classList.remove('is-down'));
  document.documentElement.addEventListener('pointerleave', () => el.classList.remove('is-visible'));
}

