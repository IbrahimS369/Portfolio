import { projects } from '../data/projects';
import type { PreviewKind, Project } from '../types/project';
import { esc, hostOf, safeUrl } from '../utils/dom';

/* ------------------------------------------------------------------ */
/* Illustrative CSS previews — abstract wireframes, clearly labelled, */
/* never presented as screenshots.                                     */
/* ------------------------------------------------------------------ */
const rep = (n: number, html: string) => Array.from({ length: n }, () => html).join('');

const MOCKS: Record<PreviewKind, string> = {
  perfume: `
    <div class="mk mk--perfume">
      <div class="mk-nav"><span class="mk-bar w-15"></span><span class="mk-links">${rep(4, '<i></i>')}</span><span class="mk-cart"></span></div>
      <div class="mk-perfume-hero">
        <div class="mk-stack">
          <span class="mk-pill w-30"></span>
          <span class="mk-head w-80"></span>
          <span class="mk-bar w-55 soft"></span>
          <span class="mk-bar w-40 soft"></span>
        </div>
        <div class="mk-bottle">
          <span class="mk-cap"></span>
          <span class="mk-glass"><i class="mk-badge"></i></span>
        </div>
      </div>
      <div class="mk-row">${rep(3, '<div class="mk-card"><span class="mk-thumb"></span><span class="mk-bar w-60"></span><span class="mk-bar w-40 soft"></span></div>')}</div>
    </div>`,
  weather: `
    <div class="mk mk--weather">
      <div class="mk-search"><span class="mk-bar w-60"></span><span class="mk-btn"></span></div>
      <div class="mk-weather-main">
        <div class="mk-sun"></div>
        <div class="mk-stack"><span class="mk-big">°</span><span class="mk-bar w-40"></span><span class="mk-bar w-25 soft"></span></div>
      </div>
      <div class="mk-row">${rep(5, '<div class="mk-tile"><span class="mk-dot"></span><span class="mk-bar w-60 soft"></span></div>')}</div>
    </div>`,
  fitness: `
    <div class="mk mk--fitness">
      <div class="mk-nav"><span class="mk-bar w-15"></span><span class="mk-links">${rep(4, '<i></i>')}</span></div>
      <div class="mk-hero">
        <div class="mk-stack"><span class="mk-head w-80"></span><span class="mk-head w-55"></span><span class="mk-bar w-70 soft"></span><span class="mk-pill"></span></div>
        <div class="mk-figure"><span></span></div>
      </div>
      <div class="mk-row">${rep(3, '<div class="mk-card"><span class="mk-icon"></span><span class="mk-bar w-60"></span><span class="mk-bar w-80 soft"></span></div>')}</div>
    </div>`,
  keys: `
    <div class="mk mk--keys">
      <div class="mk-panel">
        <span class="mk-bar w-40"></span>
        <div class="mk-field"><span class="mk-mask">${rep(14, '<i></i>')}</span><span class="mk-copy"></span></div>
        <div class="mk-meter">${rep(4, '<i></i>')}</div>
        ${rep(3, '<div class="mk-toggle-row"><span class="mk-bar w-50 soft"></span><span class="mk-toggle"></span></div>')}
        <span class="mk-pill mk-pill--full"></span>
      </div>
    </div>`,
  bookmarks: `
    <div class="mk mk--bookmarks">
      <span class="mk-head w-35 center"></span>
      <div class="mk-form"><span class="mk-input"></span><span class="mk-input"></span><span class="mk-pill"></span></div>
      <div class="mk-table">${rep(4, '<div class="mk-tr"><span class="mk-bar w-10 soft"></span><span class="mk-bar w-40"></span><span class="mk-chip-btn"></span><span class="mk-chip-btn danger"></span></div>')}</div>
    </div>`,
  books: `
    <div class="mk mk--books">
      <div class="mk-nav"><span class="mk-bar w-15"></span><span class="mk-input sm"></span><span class="mk-cart"></span></div>
      <div class="mk-shelf">${rep(6, '<div class="mk-book"><span class="mk-cover"></span><span class="mk-bar w-80"></span><span class="mk-bar w-40 soft"></span></div>')}</div>
    </div>`,
  store: `
    <div class="mk mk--store">
      <div class="mk-nav"><span class="mk-bar w-15"></span><span class="mk-links">${rep(5, '<i></i>')}</span><span class="mk-cart"></span></div>
      <div class="mk-banner"><div class="mk-stack"><span class="mk-head w-60"></span><span class="mk-bar w-40 soft"></span><span class="mk-pill"></span></div><div class="mk-dots">${rep(3, '<i></i>')}</div></div>
      <div class="mk-grid">${rep(4, '<div class="mk-product"><span class="mk-img"></span><span class="mk-bar w-70"></span><div class="mk-price"><span class="mk-bar w-30"></span><span class="mk-add"></span></div></div>')}</div>
    </div>`,
};

function layoutFor(index: number, _total: number): { size: 'wide' | 'half'; reverse: boolean } {
  if (index === 0) return { size: 'wide', reverse: false };
  return { size: 'half', reverse: false };
}

function card(p: Project, index: number, total: number): string {
  const { size, reverse } = layoutFor(index, total);
  const num = String(index + 1).padStart(2, '0');
  const live = safeUrl(p.liveUrl);
  const repo = safeUrl(p.githubUrl);
  const media = p.image
    ? `<img class="browser__shot" src="${esc(p.image)}" alt="Screenshot of ${esc(p.title)}" loading="lazy" decoding="async" />`
    : `${MOCKS[p.preview]}<span class="browser__note">Illustrative preview</span>`;

  return `
  <article class="project project--${size}${reverse ? ' project--reverse' : ''}" data-reveal aria-labelledby="project-${p.id}-title">
    <div class="project__media">
      <div class="browser" data-tilt>
        <div class="browser__bar">
          <span class="browser__dots" aria-hidden="true"><i></i><i></i><i></i></span>
          <span class="browser__url">${esc(hostOf(p.liveUrl))}</span>
          ${live ? `<button class="browser__preview" type="button" data-preview="${esc(live)}" aria-pressed="false" aria-label="Load interactive live preview of ${esc(p.title)}"><span class="browser__live-dot" aria-hidden="true"></span><span class="browser__preview-label">Try it here</span></button>` : ''}
        </div>
        <div class="browser__viewport">
          <div class="browser__static">${media}</div>
        </div>
      </div>
    </div>

    <div class="project__body">
      <p class="project__meta"><span class="project__num">${num}</span><span aria-hidden="true"> / </span><span class="visually-hidden">, </span>${esc(p.category)}</p>
      <h3 class="project__title" id="project-${p.id}-title">${esc(p.title)}</h3>
      <p class="project__desc">${esc(p.description)}</p>
      <ul class="chips chips--sm" aria-label="Technologies used">
        ${p.technologies.map((t) => `<li class="chip">${esc(t)}</li>`).join('')}
      </ul>
      <div class="project__actions">
        ${live ? `<a class="btn btn--primary" href="${esc(live)}" target="_blank" rel="noopener noreferrer" aria-label="Live demo of ${esc(p.title)} (opens in a new tab)">Live Demo <span class="btn__arrow" aria-hidden="true">↗</span></a>` : ''}
        ${repo ? `<a class="btn btn--outline" href="${esc(repo)}" target="_blank" rel="noopener noreferrer" aria-label="Source code of ${esc(p.title)} on GitHub (opens in a new tab)"><svg class="btn__icon" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>Source Code <span class="btn__arrow" aria-hidden="true">↗</span></a>` : ''}
      </div>
    </div>
  </article>`;
}

/* ---------------------------- live preview ---------------------------- */
const IFRAME_W = 1280;

function fitIframe(viewport: HTMLElement): void {
  const frame = viewport.querySelector<HTMLIFrameElement>('iframe');
  if (!frame) return;
  const scale = viewport.clientWidth / IFRAME_W;
  frame.style.transform = `scale(${scale})`;
  frame.style.height = `${viewport.clientHeight / scale}px`;
}

function togglePreview(btn: HTMLButtonElement, ro: ResizeObserver): void {
  const browser = btn.closest<HTMLElement>('.browser');
  const viewport = browser?.querySelector<HTMLElement>('.browser__viewport');
  const label = btn.querySelector<HTMLElement>('.browser__preview-label');
  if (!browser || !viewport || !label) return;
  const title = browser.closest('.project')?.querySelector('.project__title')?.textContent ?? 'project';

  const existing = viewport.querySelector('.browser__live');
  if (existing) {
    ro.unobserve(viewport);
    existing.remove();
    browser.classList.remove('is-live', 'is-loading');
    btn.setAttribute('aria-pressed', 'false');
    btn.setAttribute('aria-label', `Load interactive live preview of ${title}`);
    label.textContent = 'Try it here';
    return;
  }

  const wrap = document.createElement('div');
  wrap.className = 'browser__live';
  const frame = document.createElement('iframe');
  frame.src = btn.dataset.preview ?? '';
  frame.title = `Live preview of ${title}`;
  frame.loading = 'lazy';
  frame.referrerPolicy = 'no-referrer';
  frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups');
  frame.style.width = `${IFRAME_W}px`;
  frame.addEventListener('load', () => browser.classList.remove('is-loading'), { once: true });
  wrap.appendChild(frame);
  viewport.appendChild(wrap);

  browser.classList.add('is-live', 'is-loading');
  btn.setAttribute('aria-pressed', 'true');
  btn.setAttribute('aria-label', `Close live preview of ${title}`);
  label.textContent = 'Close preview';
  ro.observe(viewport);
  fitIframe(viewport);
}

/* ------------------------------ hover tilt ----------------------------- */
function initTilt(root: HTMLElement): void {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  root.querySelectorAll<HTMLElement>('.project').forEach((project) => {
    const media = project.querySelector<HTMLElement>('.project__media');
    const browser = project.querySelector<HTMLElement>('[data-tilt]');
    if (!media || !browser) return;
    let raf = 0;
    media.addEventListener('pointermove', (e) => {
      if (browser.classList.contains('is-live')) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = media.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        browser.style.setProperty('--rx', `${(-y * 4).toFixed(2)}deg`);
        browser.style.setProperty('--ry', `${(x * 5).toFixed(2)}deg`);
        browser.style.setProperty('--mx', `${(x * -14).toFixed(1)}px`);
        browser.style.setProperty('--my', `${(y * -10).toFixed(1)}px`);
      });
    });
    media.addEventListener('pointerleave', () => {
      cancelAnimationFrame(raf);
      ['--rx', '--ry', '--mx', '--my'].forEach((p) => browser.style.removeProperty(p));
    });
  });
}

export function initProjects(): void {
  const root = document.getElementById('projects-list');
  if (!root) return;
  const featured = projects.filter((p) => p.featured);
  root.innerHTML = featured.map((p, i) => card(p, i, featured.length)).join('');

  const ro = new ResizeObserver((entries) => entries.forEach((e) => fitIframe(e.target as HTMLElement)));
  root.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-preview]');
    if (btn) togglePreview(btn, ro);
  });

  initTilt(root);
}

