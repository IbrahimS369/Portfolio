import type { HeroScene } from '../three/hero-scene';

let scene: HeroScene | null = null;

/** Deterministic static constellation used when WebGL is unavailable. */
function renderFallback(container: HTMLElement): void {
  container.classList.add('is-fallback');
  let s = 369;
  const rand = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  const cx = 620;
  const cy = 300;
  const pts: [number, number, boolean][] = [];
  for (let i = 0; i < 70; i++) {
    const a = rand() * Math.PI * 2;
    const r = 120 + Math.sqrt(rand()) * 170;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.9, rand() < 0.12]);
  }
  const lines: string[] = [];
  pts.forEach(([x1, y1], i) => {
    pts
      .map(([x2, y2], j) => ({ j, d: Math.hypot(x2 - x1, y2 - y1), x2, y2 }))
      .filter((p) => p.j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, 2)
      .forEach(({ x2, y2 }) => lines.push(`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`));
  });
  const dots = pts
    .map(([x, y, accent]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${accent ? 3.2 : 2}" class="${accent ? 'a' : ''}"/>`)
    .join('');
  container.innerHTML = `
    <svg class="hero-fallback" viewBox="0 0 900 600" preserveAspectRatio="xMidYMid slice" role="presentation">
      <g class="hf-rings"><ellipse cx="${cx}" cy="${cy}" rx="330" ry="110" transform="rotate(-14 ${cx} ${cy})"/><ellipse cx="${cx}" cy="${cy}" rx="360" ry="150" transform="rotate(22 ${cx} ${cy})"/></g>
      <g class="hf-lines">${lines.join('')}</g>
      <polygon class="hf-core" points="${cx},${cy - 70} ${cx + 66},${cy - 22} ${cx + 41},${cy + 57} ${cx - 41},${cy + 57} ${cx - 66},${cy - 22}"/>
      <g class="hf-dots">${dots}</g>
    </svg>`;
}

export async function initHero(reducedMotion: boolean): Promise<void> {
  const container = document.querySelector<HTMLElement>('.hero__canvas');
  if (!container) return;

  // Lazy-load Three.js so typography paints first.
  try {
    const mod = await import('../three/hero-scene');
    if (!mod.isWebGLAvailable()) {
      renderFallback(container);
      return;
    }
    scene = new mod.HeroScene({
      container,
      reducedMotion,
      onContextLost: () => {
        scene?.dispose();
        scene = null;
        renderFallback(container);
      },
    });
    requestAnimationFrame(() => container.classList.add('is-ready'));
  } catch (err) {
    console.warn('[hero] WebGL scene unavailable, using static fallback.', err);
    renderFallback(container);
  }
}

export function disposeHero(): void {
  scene?.dispose();
  scene = null;
}

