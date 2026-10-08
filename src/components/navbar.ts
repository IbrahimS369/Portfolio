/** Sticky navbar: scrolled state, active-section tracking, accessible mobile menu. */
export function initNavbar(): void {
  const nav = document.getElementById('nav');
  const toggle = nav?.querySelector<HTMLButtonElement>('.nav__toggle');
  const menu = document.getElementById('mobile-menu');
  if (!nav || !toggle || !menu) return;

  /* ---- scrolled state ---- */
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      nav.classList.toggle('is-scrolled', window.scrollY > 24);
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- active section ---- */
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-nav]'));
  const ids = ['home', 'about', 'skills', 'projects', 'journey', 'contact'];
  // Sections that should highlight a parent nav item.
  const alias: Record<string, string> = { github: 'projects', services: 'projects' };
  const setActive = (id: string) => {
    links.forEach((a) => {
      const on = a.dataset.nav === id;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  };
  const sections = [...ids, ...Object.keys(alias)]
    .map((id) => document.getElementById(id))
    .filter((el): el is HTMLElement => !!el);

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(alias[entry.target.id] ?? entry.target.id);
      });
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  sections.forEach((s) => io.observe(s));

  /* ---- mobile menu ---- */
  const open = () => {
    menu.hidden = false;
    requestAnimationFrame(() => nav.classList.add('menu-open'));
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close menu');
    document.body.classList.add('no-scroll');
    menu.querySelector<HTMLAnchorElement>('a')?.focus();
  };
  const close = (returnFocus = true) => {
    nav.classList.remove('menu-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
    document.body.classList.remove('no-scroll');
    window.setTimeout(() => {
      if (!nav.classList.contains('menu-open')) menu.hidden = true;
    }, 400);
    if (returnFocus) toggle.focus();
  };
  const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';

  toggle.addEventListener('click', () => (isOpen() ? close() : open()));
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => close(false)));

  document.addEventListener('keydown', (e) => {
    if (!isOpen()) return;
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') {
      // Simple focus trap: toggle button + menu links.
      const focusables = [toggle, ...Array.from(menu.querySelectorAll<HTMLElement>('a'))];
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  window.matchMedia('(min-width: 992px)').addEventListener('change', (mq) => {
    if (mq.matches && isOpen()) close(false);
  });
}

