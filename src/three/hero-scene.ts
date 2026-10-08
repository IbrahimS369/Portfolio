import * as THREE from 'three';

/* -------------------------------------------------------------------------- */
/*  Hero scene — an abstract "network globe":                                 */
/*  • a Fibonacci-distributed node shell with nearest-neighbour connections   */
/*  • a wireframe icosahedron core + counter-rotating octahedron              */
/*  • two tilted orbit rings with travelling markers                          */
/*  • faint depth dust                                                        */
/*  Nodes and their connections share one GPU displacement function so they  */
/*  breathe together and repel from the cursor without per-frame CPU work.    */
/* -------------------------------------------------------------------------- */

const ACCENT = new THREE.Color('#2B66FF'); // Vibrant Egyptian Blue
const INK = new THREE.Color('#94BFFF');    // Ice Cerulean Nodes
const GRAY = new THREE.Color('#1842A6');   // Royal Egyptian Blue lines

export interface HeroSceneOptions {
  container: HTMLElement;
  reducedMotion: boolean;
  onContextLost?: () => void;
}

export function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl')));
  } catch {
    return false;
  }
}

/** Small deterministic PRNG so the composition looks identical on every load. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Shared GLSL: breathing + cursor repulsion, applied identically to points & lines. */
const DISPLACE_GLSL = /* glsl */ `
  uniform float uTime;
  uniform vec3 uMouse;
  uniform float uMouseStrength;
  attribute float aSeed;
  varying float vInfluence;
  varying float vDepth;

  vec3 displace(vec3 p, float s) {
    float t = uTime * 0.35;
    vec3 n = normalize(p);
    vec3 d = p + n * sin(t * 1.3 + s * 6.2831) * 0.07;
    d.x += sin(t + s * 12.0) * 0.035;
    d.y += cos(t * 0.9 + s * 7.0) * 0.035;

    vec3 diff = d - uMouse;
    float dist = length(diff);
    float f = (1.0 - smoothstep(0.0, 1.5, dist)) * uMouseStrength;
    d += normalize(diff + vec3(0.0001)) * f * 0.38;
    vInfluence = f;
    return d;
  }
`;

const POINT_VERT = /* glsl */ `
  ${DISPLACE_GLSL}
  uniform float uSize;
  uniform float uPixelRatio;
  attribute float aAccent;
  varying float vAccent;

  void main() {
    vec3 p = displace(position, aSeed);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    vDepth = smoothstep(-12.0, -5.0, mv.z);
    vAccent = aAccent;
    float size = uSize * (0.7 + aSeed * 0.6) * (1.0 + aAccent * 0.6 + vInfluence * 1.4);
    gl_PointSize = size * uPixelRatio * (8.0 / -mv.z);
  }
`;

const POINT_FRAG = /* glsl */ `
  uniform vec3 uInk;
  uniform vec3 uAccent;
  uniform float uOpacity;
  varying float vInfluence;
  varying float vDepth;
  varying float vAccent;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r = length(c);
    if (r > 0.5) discard;
    float edge = 1.0 - smoothstep(0.38, 0.5, r);
    vec3 col = mix(uInk, uAccent, clamp(vAccent + vInfluence * 1.2, 0.0, 1.0));
    float a = edge * mix(0.35, 0.98, vDepth) * uOpacity;
    gl_FragColor = vec4(col, a);
  }
`;

const LINE_VERT = /* glsl */ `
  ${DISPLACE_GLSL}
  void main() {
    vec3 p = displace(position, aSeed);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    vDepth = smoothstep(-12.0, -5.0, mv.z);
  }
`;

const LINE_FRAG = /* glsl */ `
  uniform vec3 uLine;
  uniform vec3 uAccent;
  uniform float uOpacity;
  varying float vInfluence;
  varying float vDepth;

  void main() {
    vec3 col = mix(uLine, uAccent, clamp(vInfluence * 1.5, 0.0, 1.0));
    float a = (mix(0.12, 0.45, vDepth) + vInfluence * 0.45) * uOpacity;
    gl_FragColor = vec4(col, a);
  }
`;

interface Tier {
  nodes: number;
  neighbours: number;
  dust: number;
  rings: number;
  dpr: number;
  antialias: boolean;
}

export class HeroScene {
  private readonly container: HTMLElement;
  private readonly reducedMotion: boolean;
  private readonly onContextLost?: () => void;
  private readonly isMobile: boolean;
  private readonly tier: Tier;

  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();

  private root = new THREE.Group(); // positioned per layout
  private rig = new THREE.Group(); // reacts to pointer / scroll
  private network = new THREE.Group(); // auto-rotates
  private core = new THREE.Group();
  private orbitMarkers: { mesh: THREE.Mesh; curve: THREE.EllipseCurve; speed: number; offset: number; ring: THREE.Object3D }[] = [];
  private dust?: THREE.Points;

  private uniforms = {
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector3(99, 99, 99) },
    uMouseStrength: { value: 0 },
    uSize: { value: 5.0 },
    uPixelRatio: { value: 1 },
    uOpacity: { value: 1 },
    uInk: { value: INK.clone() },
    uLine: { value: GRAY.clone() },
    uAccent: { value: ACCENT.clone() },
  };

  private pointer = new THREE.Vector2(0, 0);
  private pointerTarget = new THREE.Vector2(0, 0);
  private pointerInside = false;
  private scrollProgress = 0;
  private raycaster = new THREE.Raycaster();
  private plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  private tmpV = new THREE.Vector3();

  private raf = 0;
  private inView = true;
  private disposed = false;
  private resizeObserver: ResizeObserver;
  private intersectionObserver: IntersectionObserver;

  constructor({ container, reducedMotion, onContextLost }: HeroSceneOptions) {
    this.container = container;
    this.reducedMotion = reducedMotion;
    this.onContextLost = onContextLost;
    this.isMobile = window.matchMedia('(max-width: 767px), (pointer: coarse)').matches;

    const lowPower = this.isMobile || (navigator.hardwareConcurrency ?? 8) <= 4;
    this.tier = lowPower
      ? { nodes: 90, neighbours: 2, dust: 110, rings: 1, dpr: 1.25, antialias: false }
      : { nodes: 190, neighbours: 3, dust: 320, rings: 2, dpr: 1.75, antialias: window.devicePixelRatio < 2 };

    this.renderer = new THREE.WebGLRenderer({
      antialias: this.tier.antialias,
      alpha: true,
      powerPreference: lowPower ? 'low-power' : 'high-performance',
    });
    this.renderer.setClearColor(0x000000, 0);
    const dpr = Math.min(window.devicePixelRatio || 1, this.tier.dpr);
    this.renderer.setPixelRatio(dpr);
    this.uniforms.uPixelRatio.value = dpr;
    this.renderer.domElement.setAttribute('aria-hidden', 'true');
    this.renderer.domElement.addEventListener('webglcontextlost', this.handleContextLost, false);
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);
    this.camera.position.set(0, 0, 9);

    this.build();
    this.scene.add(this.root);
    this.root.add(this.rig);
    this.rig.add(this.network, this.core);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        this.inView = entry.isIntersecting;
        if (this.inView) this.start();
        else this.stop();
      },
      { threshold: 0 },
    );
    this.intersectionObserver.observe(container);

    this.resize();

    if (!this.reducedMotion) {
      window.addEventListener('pointermove', this.handlePointer, { passive: true });
      document.documentElement.addEventListener('pointerleave', this.handleLeave);
      window.addEventListener('scroll', this.handleScroll, { passive: true });
      document.addEventListener('visibilitychange', this.handleVisibility);
      this.handleScroll();
      this.start();
    } else {
      // Reduced motion: a single, composed still frame.
      this.network.rotation.set(0.25, 0.6, 0);
      this.render();
    }
  }

  /* ------------------------------- building ------------------------------- */

  private build(): void {
    const rand = mulberry32(369);
    this.buildNetwork(rand);
    this.buildCore();
    this.buildRings();
    this.buildDust(rand);
  }

  private buildNetwork(rand: () => number): void {
    const { nodes: n, neighbours } = this.tier;
    const radius = 2.55;
    const positions = new Float32Array(n * 3);
    const seeds = new Float32Array(n);
    const accents = new Float32Array(n);
    const golden = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < n; i++) {
      // Fibonacci sphere with radial jitter → organic but even distribution.
      const y = 1 - (i / (n - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = golden * i;
      const jitter = radius * (0.86 + rand() * 0.28);
      positions[i * 3] = Math.cos(theta) * r * jitter;
      positions[i * 3 + 1] = y * jitter * 0.92;
      positions[i * 3 + 2] = Math.sin(theta) * r * jitter;
      seeds[i] = rand();
      accents[i] = rand() < 0.11 ? 1 : 0;
    }

    // k-nearest connections (O(n²) once at startup — n ≤ 190).
    const pairs = new Set<string>();
    const linePos: number[] = [];
    const lineSeed: number[] = [];
    const maxDist = radius * 0.62;
    for (let i = 0; i < n; i++) {
      const dists: { j: number; d: number }[] = [];
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const dx = positions[i * 3] - positions[j * 3];
        const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
        const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
        const d = dx * dx + dy * dy + dz * dz;
        if (d < maxDist * maxDist) dists.push({ j, d });
      }
      dists.sort((a, b) => a.d - b.d);
      for (const { j } of dists.slice(0, neighbours)) {
        const key = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (pairs.has(key)) continue;
        pairs.add(key);
        linePos.push(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
        linePos.push(positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]);
        lineSeed.push(seeds[i], seeds[j]);
      }
    }

    const pointGeo = new THREE.BufferGeometry();
    pointGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pointGeo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    pointGeo.setAttribute('aAccent', new THREE.BufferAttribute(accents, 1));
    const pointMat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: POINT_VERT,
      fragmentShader: POINT_FRAG,
      transparent: true,
      depthWrite: false,
    });
    const points = new THREE.Points(pointGeo, pointMat);

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3));
    lineGeo.setAttribute('aSeed', new THREE.Float32BufferAttribute(lineSeed, 1));
    const lineMat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: LINE_VERT,
      fragmentShader: LINE_FRAG,
      transparent: true,
      depthWrite: false,
    });
    const lines = new THREE.LineSegments(lineGeo, lineMat);

    this.network.add(lines, points);
  }

  private buildCore(): void {
    const ico = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.05, this.isMobile ? 0 : 1)),
      new THREE.LineBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.55, depthWrite: false }),
    );
    ico.name = 'ico';
    this.core.add(ico);

    if (!this.isMobile) {
      const octa = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.OctahedronGeometry(0.48, 0)),
        new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.55, depthWrite: false }),
      );
      octa.name = 'octa';
      this.core.add(octa);
    }

    const nucleus = new THREE.Mesh(
      new THREE.SphereGeometry(0.055, 12, 12),
      new THREE.MeshBasicMaterial({ color: ACCENT }),
    );
    this.core.add(nucleus);
  }

  private buildRings(): void {
    const configs = [
      { rx: 3.55, ry: 3.55, tilt: [1.22, 0.18, 0.2], speed: 0.06, opacity: 0.32 },
      { rx: 4.15, ry: 4.15, tilt: [1.0, -0.5, -0.35], speed: -0.04, opacity: 0.2 },
    ].slice(0, this.tier.rings);

    configs.forEach((c, i) => {
      const curve = new THREE.EllipseCurve(0, 0, c.rx, c.ry, 0, Math.PI * 2, false, 0);
      const pts = curve.getPoints(this.isMobile ? 96 : 160);
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const ring = new THREE.LineLoop(
        geo,
        new THREE.LineBasicMaterial({ color: GRAY, transparent: true, opacity: c.opacity, depthWrite: false }),
      );
      const holder = new THREE.Group();
      holder.rotation.set(c.tilt[0], c.tilt[1], c.tilt[2]);
      holder.add(ring);

      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(i === 0 ? 0.045 : 0.035, 10, 10),
        new THREE.MeshBasicMaterial({ color: i === 0 ? ACCENT : INK }),
      );
      holder.add(marker);
      this.orbitMarkers.push({ mesh: marker, curve, speed: c.speed, offset: i * 0.37, ring: holder });
      this.rig.add(holder);
    });
  }

  private buildDust(rand: () => number): void {
    const count = this.tier.dust;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (rand() - 0.5) * 22;
      pos[i * 3 + 1] = (rand() - 0.5) * 13;
      pos[i * 3 + 2] = (rand() - 0.5) * 10 - 2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: GRAY,
      size: 0.028,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    this.dust = new THREE.Points(geo, mat);
    this.scene.add(this.dust);
  }

  /* ------------------------------- lifecycle ------------------------------ */

  private start(): void {
    if (this.reducedMotion || this.disposed || this.raf || !this.inView || document.hidden) return;
    this.clock.getDelta(); // drop the time spent paused
    this.raf = requestAnimationFrame(this.tick);
  }

  private stop(): void {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private tick = (): void => {
    this.raf = requestAnimationFrame(this.tick);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const speed = this.isMobile ? 0.6 : 1;
    this.uniforms.uTime.value += dt * speed;
    const t = this.uniforms.uTime.value;

    // Ease pointer towards target for a weighty, premium feel.
    this.pointer.lerp(this.pointerTarget, 1 - Math.pow(0.0015, dt));

    this.network.rotation.y += dt * 0.06 * speed;
    this.network.rotation.x = Math.sin(t * 0.15) * 0.12;

    const ico = this.core.getObjectByName('ico');
    const octa = this.core.getObjectByName('octa');
    if (ico) ico.rotation.set(t * 0.12, t * 0.18, 0);
    if (octa) octa.rotation.set(-t * 0.25, -t * 0.2, t * 0.1);

    for (const m of this.orbitMarkers) {
      const u = (((t * m.speed + m.offset) % 1) + 1) % 1;
      const p = m.curve.getPoint(u);
      m.mesh.position.set(p.x, p.y, 0);
    }

    // Pointer + scroll drive the rig, not the content.
    const s = this.scrollProgress;
    this.rig.rotation.y = this.pointer.x * 0.35;
    this.rig.rotation.x = -this.pointer.y * 0.22 + s * 0.5;
    this.camera.position.z = 9 + s * 2.2;
    this.camera.position.y = -s * 0.6;
    this.uniforms.uOpacity.value = 1 - s * 0.65;

    if (this.dust) {
      this.dust.rotation.y = t * 0.01 + this.pointer.x * 0.05;
      this.dust.position.y = s * 1.2;
    }

    // Cursor → local network space for the GPU repulsion field.
    const targetStrength = this.pointerInside && !this.isMobile ? 1 : 0;
    this.uniforms.uMouseStrength.value += (targetStrength - this.uniforms.uMouseStrength.value) * Math.min(1, dt * 4);
    if (this.uniforms.uMouseStrength.value > 0.001) {
      this.raycaster.setFromCamera(this.pointer, this.camera);
      if (this.raycaster.ray.intersectPlane(this.plane, this.tmpV)) {
        this.network.updateWorldMatrix(true, false);
        this.uniforms.uMouse.value.copy(this.network.worldToLocal(this.tmpV));
      }
    }

    this.render();
  };

  private render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  private resize(): void {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;

    // Layout: composition sits right of the type on wide screens, centred & receded on narrow ones.
    const aspect = w / h;
    if (aspect > 1.15) {
      this.root.position.set(Math.min(3.1, 1.2 + (aspect - 1.15) * 2.4), 0.05, 0);
      this.root.scale.setScalar(1);
    } else {
      this.root.position.set(0, 1.2, -1.5);
      this.root.scale.setScalar(0.82);
    }
    this.camera.updateProjectionMatrix();
    if (this.reducedMotion) this.render();
  }

  /* -------------------------------- events -------------------------------- */

  private handlePointer = (e: PointerEvent): void => {
    if (e.pointerType === 'touch') return;
    const rect = this.container.getBoundingClientRect();
    this.pointerTarget.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    this.pointerInside = e.clientY >= rect.top && e.clientY <= rect.bottom;
  };

  private handleLeave = (): void => {
    this.pointerInside = false;
    this.pointerTarget.set(0, 0);
  };

  private handleScroll = (): void => {
    const h = this.container.clientHeight || window.innerHeight;
    this.scrollProgress = Math.min(1, Math.max(0, window.scrollY / h));
  };

  private handleVisibility = (): void => {
    if (document.hidden) this.stop();
    else this.start();
  };

  private handleContextLost = (e: Event): void => {
    e.preventDefault();
    this.stop();
    this.onContextLost?.();
  };

  /* -------------------------------- cleanup ------------------------------- */

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.stop();
    this.resizeObserver.disconnect();
    this.intersectionObserver.disconnect();
    window.removeEventListener('pointermove', this.handlePointer);
    document.documentElement.removeEventListener('pointerleave', this.handleLeave);
    window.removeEventListener('scroll', this.handleScroll);
    document.removeEventListener('visibilitychange', this.handleVisibility);
    this.renderer.domElement.removeEventListener('webglcontextlost', this.handleContextLost);

    this.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      mesh.geometry?.dispose();
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else mat?.dispose();
    });
    this.scene.clear();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }
}

