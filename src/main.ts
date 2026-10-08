import './styles/main.scss';

import { initNavbar } from './components/navbar';
import { initHero, disposeHero } from './components/hero';
import { initProjects } from './components/projects';
import { initGithubProjects } from './components/github-projects';
import { initContact } from './components/contact';
import { initCursor } from './components/cursor';
import { initReveal } from './components/reveal';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function boot(): void {
  initNavbar();
  initProjects();
  initContact();
  initReveal(reducedMotion);
  initCursor();
  void initGithubProjects();

  // Kick off the hero entrance once fonts are ready (or after a short cap) to avoid layout jumps.
  const ready = () => document.documentElement.classList.add('is-loaded');
  Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise((r) => setTimeout(r, 900))]).then(ready);

  void initHero(reducedMotion);
}

boot();

window.addEventListener('pagehide', (e) => {
  if (!e.persisted) disposeHero();
});

if (import.meta.hot) {
  import.meta.hot.dispose(() => disposeHero());
}

