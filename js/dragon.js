/* ============================================================================
   dragon.js — the realm.
   One fixed Three.js scene carries the whole journey:
     stars + nebulae + moon + mountain/castle silhouettes + embers + a
     procedurally built dragon (no external model — spec fallback).

   Scroll position drives camera "phases" (opening → dragon world → finale),
   pointer gives parallax, drag gives a slight look-around, warp() is the
   opening transition and celebrate() is the finale burst.

   Perf discipline:
   - Particle counts and pixel ratio are capped on mobile.
   - start()/stop() drive the RAF loop; main.js pauses when the tab is hidden
     or the canvas leaves the viewport.
   - prefers-reduced-motion: no loop — a single static frame is drawn.
   ========================================================================== */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const EMBER_RANGE = 14;

/* Camera/scene keyframes indexed by page scroll progress 0 → 1. */
const KEYS = [
  { p: 0.0, cam: [0, 1.3, 9.5], look: [0, 2.6, -6], moon: 1.0, fog: 0.03 },
  { p: 0.38, cam: [0, 2.6, 12.5], look: [0, 4.6, -14], moon: 1.15, fog: 0.024 },
  { p: 0.62, cam: [0, 3.2, 10.0], look: [0, 4.2, -12], moon: 1.2, fog: 0.026 },
  { p: 1.0, cam: [0, 3.0, 7.0], look: [-8, 6.5, -26], moon: 2.1, fog: 0.034 },
];

function makeRadialTexture(stops, size = 256) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [o, col] of stops) g.addColorStop(o, col);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function smooth(t) {
  return t * t * (3 - 2 * t);
}

export class DragonScene {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {{mobile?: boolean, reducedMotion?: boolean, onLost?: Function}} opts
   */
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.mobile = !!opts.mobile;
    this.reduced = !!opts.reducedMotion;
    this.onLost = opts.onLost || null;

    this.ok = false;
    this.running = false;
    this._raf = 0;
    this._t = 0;
    this.scrollP = 0;
    this._warp = 1; // 1 = done
    this._celebrate = 0;
    this._bank = 0;
    this._prevYaw = 0;
    this.pointer = { x: 0, y: 0 };
    this._pointerTarget = { x: 0, y: 0 };
    this._look = { x: 0, y: 0 }; // drag look-around offset
    this._drag = null;

    this._onResize = () => this.resize();
    this._onPointer = (e) => {
      this._pointerTarget.x = (e.clientX / window.innerWidth - 0.5) * 2;
      this._pointerTarget.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    this._onDown = (e) => {
      // Ignore drags that start on interactive elements.
      if (e.target.closest('button, a, input, textarea, .shot, .letter-paper, .polaroid')) return;
      this._drag = { x: e.clientX, y: e.clientY };
    };
    this._onDrag = (e) => {
      if (!this._drag) return;
      const dx = e.clientX - this._drag.x;
      const dy = e.clientY - this._drag.y;
      this._drag.x = e.clientX;
      this._drag.y = e.clientY;
      const k = this.mobile ? 0.0011 : 0.0009;
      this._look.x = THREE.MathUtils.clamp(this._look.x - dx * k, -0.28, 0.28);
      this._look.y = THREE.MathUtils.clamp(this._look.y - dy * k, -0.16, 0.16);
    };
    this._onUp = () => {
      this._drag = null;
    };
    this._onLost = (e) => {
      e.preventDefault();
      this.stop();
      this.ok = false;
      if (this.onLost) this.onLost();
    };

    try {
      this._init();
      this.ok = true;
    } catch (err) {
      this.ok = false;
      return;
    }

    this.canvas.addEventListener('webglcontextlost', this._onLost, false);
    window.addEventListener('resize', this._onResize, { passive: true });
    window.addEventListener('pointermove', this._onPointer, { passive: true });
    window.addEventListener('pointerdown', this._onDown, { passive: true });
    window.addEventListener('pointermove', this._onDrag, { passive: true });
    window.addEventListener('pointerup', this._onUp, { passive: true });
    window.addEventListener('pointercancel', this._onUp, { passive: true });

    this.resize();
    this.renderFrame();
  }

  /* ------------------------------------------------------------- build -- */
  _init() {
    const renderer = (this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
    }));
    this.dpr = Math.min(window.devicePixelRatio || 1, this.mobile ? 1.5 : 2);
    renderer.setPixelRatio(this.dpr);
    renderer.setClearColor(0x09090d, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    const scene = (this.scene = new THREE.Scene());
    scene.fog = new THREE.FogExp2(0x09090d, 0.03);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.05).texture;
    pmrem.dispose();

    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 300);
    this.camera.position.set(0, 1.3, 9.5);

    this._buildLights();
    this._buildStars();
    this._buildNebulae();
    this._buildMoon();
    this._buildMountains();
    this._buildEmbers();
    this._buildDragon();
    this._buildBurst();
  }

  _buildLights() {
    this.scene.add(new THREE.AmbientLight(0x23232e, 1.0));
    // Cold moonlight from upper left — the dragon's rim light.
    const moonlight = new THREE.DirectionalLight(0x9fa8c0, 1.4);
    moonlight.position.set(-14, 12, -18);
    this.scene.add(moonlight);
    // Warm low fill so the underbelly isn't pure black.
    const warm = new THREE.PointLight(0xc6a66b, 18, 0, 2);
    warm.position.set(0, -2, 2);
    this.scene.add(warm);
  }

  _buildStars() {
    const count = this.mobile ? 900 : 2200;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const size = new Float32Array(count);
    const phase = new Float32Array(count);
    const tmp = new THREE.Color();
    for (let i = 0; i < count; i++) {
      // Shell around the camera.
      const r = 34 + Math.random() * 14;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.cos(ph) * 0.9 + 4;
      pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th) - 8;
      const p = Math.random();
      tmp.set(p < 0.6 ? 0xeae7e1 : p < 0.85 ? 0xc6a66b : 0xa6a8b0);
      tmp.multiplyScalar(0.6 + Math.random() * 0.5);
      col[i * 3] = tmp.r;
      col[i * 3 + 1] = tmp.g;
      col[i * 3 + 2] = tmp.b;
      size[i] = 1 + Math.random() * 2.6;
      phase[i] = Math.random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));

    this.starMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uPx: { value: this.dpr }, uWarp: { value: 0 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        attribute vec3 aColor;
        attribute float aSize;
        attribute float aPhase;
        uniform float uTime;
        uniform float uPx;
        uniform float uWarp;
        varying vec3 vC;
        varying float vA;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vec2 dir = normalize(mv.xy + vec2(0.0001));
          mv.xy += dir * uWarp * length(mv.xy) * 0.9;
          gl_Position = projectionMatrix * mv;
          float dist = max(0.001, -mv.z);
          gl_PointSize = aSize * uPx * (60.0 / dist) * (1.0 + uWarp * 1.4);
          vA = 0.55 + 0.45 * sin(uTime * (1.2 + aPhase * 2.0) + aPhase * 40.0);
          vC = aColor;
        }`,
      fragmentShader: /* glsl */ `
        varying vec3 vC;
        varying float vA;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.04, d) * vA;
          if (a < 0.01) discard;
          gl_FragColor = vec4(vC, a);
        }`,
    });
    this.scene.add(new THREE.Points(geo, this.starMat));
  }

  _buildNebulae() {
    const mk = (color, x, y, z, s, o) => {
      const tex = makeRadialTexture([
        [0, color.replace('%A', '0.5')],
        [0.5, color.replace('%A', '0.16')],
        [1, color.replace('%A', '0')],
      ]);
      const sp = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: tex, transparent: true, opacity: o,
          blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
        })
      );
      sp.position.set(x, y, z);
      sp.scale.set(s, s * 0.6, 1);
      this.scene.add(sp);
      return sp;
    };
    this._nebulae = [
      mk('rgba(90,50,80,%A)', 14, 10, -30, 30, 0.5),   // violet wine nebula
      mk('rgba(72,27,43,%A)', -20, 14, -34, 36, 0.55), // burgundy
      mk('rgba(60,70,110,%A)', 4, 20, -38, 40, 0.4),   // cold blue
    ];
  }

  _buildMoon() {
    this.moon = new THREE.Group();
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(5, 64),
      new THREE.MeshBasicMaterial({ color: 0xe3e0da, fog: false })
    );
    // Faint maria — soft darker patches.
    const mariaMat = new THREE.MeshBasicMaterial({ color: 0xb9b6ae, fog: false });
    const m1 = new THREE.Mesh(new THREE.CircleGeometry(1.1, 24), mariaMat);
    m1.position.set(-1.4, 0.9, 0.01);
    const m2 = new THREE.Mesh(new THREE.CircleGeometry(0.7, 24), mariaMat);
    m2.position.set(1.6, -1.1, 0.01);
    const m3 = new THREE.Mesh(new THREE.CircleGeometry(0.5, 24), mariaMat);
    m3.position.set(0.6, 2.0, 0.01);
    this.moon.add(disc, m1, m2, m3);

    const haloTex = makeRadialTexture([
      [0, 'rgba(234,231,225,0.5)'],
      [0.35, 'rgba(198,166,107,0.14)'],
      [1, 'rgba(198,166,107,0)'],
    ]);
    const halo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: haloTex, transparent: true, opacity: 0.85,
        blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
      })
    );
    halo.scale.set(26, 26, 1);
    this.moon.add(halo);

    this.moon.position.set(-11, 7.5, -26);
    this.scene.add(this.moon);
  }

  _buildMountains() {
    // Ridge silhouette.
    const s = new THREE.Shape();
    s.moveTo(-48, 0);
    const peaks = [
      [-40, 4.5], [-33, 1.5], [-27, 8], [-20, 3], [-13, 6.5],
      [-7, 3.5], [-1, 9], [5, 3], [11, 6], [17, 2.5],
      [23, 7.5], [30, 3], [37, 5.5], [44, 3], [50, 5],
    ];
    for (const [x, y] of peaks) s.lineTo(x, y);
    s.lineTo(50, -8);
    s.lineTo(-48, -8);
    s.closePath();
    const ridge = new THREE.Mesh(
      new THREE.ShapeGeometry(s),
      new THREE.MeshBasicMaterial({ color: 0x0b0912 })
    );
    ridge.position.set(0, -3.4, -32);
    this.scene.add(ridge);

    // A tiny castle on one peak — towers, roofs, two lit windows.
    const castle = new THREE.Group();
    const stone = new THREE.MeshBasicMaterial({ color: 0x0d0a14 });
    const tower = (x, h, w) => {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.45, w * 0.55, h, 6), stone);
      t.position.set(x, h / 2, 0);
      castle.add(t);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(w * 0.6, h * 0.45, 6), stone);
      roof.position.set(x, h + h * 0.22, 0);
      castle.add(roof);
    };
    tower(-1.4, 3.2, 0.9);
    tower(0, 4.6, 1.2);
    tower(1.6, 2.6, 0.8);
    const keep = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.8, 1), stone);
    keep.position.set(0, 0.9, 0);
    castle.add(keep);
    const winTex = makeRadialTexture([[0, 'rgba(255,214,140,1)'], [1, 'rgba(255,214,140,0)']], 64);
    for (const [x, y] of [[-1.4, 2.2], [0, 3.4], [0.9, 1.1]]) {
      const win = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: winTex, color: 0xffd88a, transparent: true,
          blending: THREE.AdditiveBlending, depthWrite: false,
        })
      );
      win.position.set(x, y, 0.55);
      win.scale.set(0.4, 0.5, 1);
      castle.add(win);
    }
    castle.scale.setScalar(0.85);
    castle.position.set(10.5, -1.2, -30.5);
    this.scene.add(castle);

    // Dark ground plane dissolving into fog.
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(70, 48),
      new THREE.MeshBasicMaterial({ color: 0x07070b })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -3.4;
    this.scene.add(ground);
  }

  _buildEmbers() {
    const count = this.mobile ? 350 : 1000;
    const pos = new Float32Array(count * 3);
    const aSpeed = new Float32Array(count);
    const aSize = new Float32Array(count);
    const aPhase = new Float32Array(count);
    const aColor = new Float32Array(count * 3);
    const gold = new THREE.Color(0xe0b875);
    const wine = new THREE.Color(0xa13a50);
    const ash = new THREE.Color(0x8f929c);
    const tmp = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const r = Math.pow(Math.random(), 0.6) * 8.5;
      const a = Math.random() * Math.PI * 2;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = Math.random() * EMBER_RANGE;
      pos[i * 3 + 2] = Math.sin(a) * r * 0.85;
      aSpeed[i] = 0.15 + Math.random() * 0.55;
      aSize[i] = 6 + Math.random() * 22;
      aPhase[i] = Math.random();
      const p = Math.random();
      tmp.copy(p < 0.68 ? gold : p < 0.9 ? wine : ash);
      tmp.multiplyScalar(0.7 + Math.random() * 0.5);
      aColor[i * 3] = tmp.r;
      aColor[i * 3 + 1] = tmp.g;
      aColor[i * 3 + 2] = tmp.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSpeed', new THREE.BufferAttribute(aSpeed, 1));
    geo.setAttribute('aSize', new THREE.BufferAttribute(aSize, 1));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(aPhase, 1));
    geo.setAttribute('aColor', new THREE.BufferAttribute(aColor, 3));

    this.emberMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uHeight: { value: EMBER_RANGE },
        uPx: { value: this.dpr },
        uBoost: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        attribute float aSpeed;
        attribute float aSize;
        attribute float aPhase;
        attribute vec3 aColor;
        uniform float uTime;
        uniform float uHeight;
        uniform float uPx;
        uniform float uBoost;
        varying vec3 vC;
        varying float vA;
        void main() {
          vec3 p = position;
          p.y = mod(p.y + uTime * aSpeed, uHeight) - uHeight * 0.42;
          p.x += sin(uTime * 0.35 + aPhase * 17.0 + p.y * 0.45) * 0.4;
          p.z += cos(uTime * 0.28 + aPhase * 23.0) * 0.35;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          float dist = max(0.001, -mv.z);
          gl_PointSize = aSize * uPx * (7.0 / dist) * (1.0 + uBoost * 0.8);
          vA = (0.5 + 0.5 * sin(uTime * 2.2 + aPhase * 40.0)) * (1.0 + uBoost * 0.7);
          vC = aColor;
        }`,
      fragmentShader: /* glsl */ `
        varying vec3 vC;
        varying float vA;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.05, d) * vA;
          if (a < 0.01) discard;
          gl_FragColor = vec4(vC, a);
        }`,
    });
    this.scene.add(new THREE.Points(geo, this.emberMat));
  }

  /* -------------------------------------------------------------- dragon */
  _wingGeometry() {
    const SPAN = 4.4;
    const ROWS = 6;
    const pos = new Float32Array(ROWS * 2 * 3);
    const geo = new THREE.BufferGeometry();
    const idx = [];
    for (let i = 0; i < ROWS - 1; i++) {
      const a = i * 2;
      const b = a + 1;
      const c = a + 2;
      const d = a + 3;
      idx.push(a, b, c, b, d, c);
    }
    geo.setIndex(idx);
    this._wingSpan = SPAN;
    this._wingRows = ROWS;
    return { geo, pos };
  }

  _layoutWing(pos, flutter) {
    const ROWS = this._wingRows;
    const SPAN = this._wingSpan;
    for (let i = 0; i < ROWS; i++) {
      const s = i / (ROWS - 1);
      const chord = 1.15 * (1 - s * 0.5) * (0.8 + 0.2 * Math.cos(s * Math.PI * 2.5));
      const y = -0.3 * s * s;
      const z = s * SPAN;
      const xl = -0.4 * s;
      const xt = xl - chord;
      pos[i * 6] = xl;
      pos[i * 6 + 1] = y;
      pos[i * 6 + 2] = z;
      pos[i * 6 + 3] = xt;
      pos[i * 6 + 4] = y - 0.08 + Math.sin(flutter - s * 2.4) * 0.5 * s;
      pos[i * 6 + 5] = z;
    }
  }

  _buildDragon() {
    const d = (this.dragon = new THREE.Group());
    d.rotation.order = 'YXZ';

    const hide = new THREE.MeshStandardMaterial({
      color: 0x0d1018, roughness: 0.8, metalness: 0.15, flatShading: true,
    });
    const membrane = new THREE.MeshStandardMaterial({
      color: 0x151019, roughness: 0.9, metalness: 0.05,
      transparent: true, opacity: 0.96, side: THREE.DoubleSide,
    });
    const ball = (x, y, z, r) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), hide);
      m.position.set(x, y, z);
      d.add(m);
      return m;
    };
    // Bone strut between two points — used for wing fingers and limbs.
    const spar = (x1, y1, z1, x2, y2, z2, r) => {
      const dir = new THREE.Vector3(x2 - x1, y2 - y1, z2 - z1);
      const len = dir.length();
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.55, r, len, 5), hide);
      m.position.set((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
      return m;
    };

    // Torso + hips.
    ball(0, 0, 0, 0.62);
    ball(-0.7, -0.05, 0, 0.56);
    ball(-1.3, -0.02, 0, 0.46);
    // Neck rising forward.
    ball(0.62, 0.3, 0, 0.4);
    ball(1.15, 0.6, 0, 0.32);
    ball(1.55, 0.88, 0, 0.27);
    // Head.
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 12, 10), hide);
    head.scale.set(1.35, 0.9, 0.85);
    head.position.set(1.95, 1.14, 0);
    d.add(head);
    const snout = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.55, 6), hide);
    snout.rotation.z = -Math.PI / 2;
    snout.position.set(2.42, 1.06, 0);
    d.add(snout);
    const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.07, 0.18), hide);
    jaw.position.set(2.2, 0.92, 0);
    d.add(jaw);
    // Horns sweeping back — a small front pair and a larger crown pair.
    for (const z of [0.12, -0.12]) {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.4, 5), hide);
      horn.rotation.z = 0.6;
      horn.position.set(1.78, 1.4, z);
      d.add(horn);
    }
    for (const z of [0.17, -0.17]) {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.62, 5), hide);
      horn.rotation.z = 1.0;
      horn.rotation.y = z > 0 ? 0.25 : -0.25;
      horn.position.set(1.7, 1.36, z);
      d.add(horn);
    }
    // Cheek spikes pointing out + back, and a chin spike.
    for (const z of [0.22, -0.22]) {
      const cheek = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.3, 4), hide);
      cheek.rotation.x = z > 0 ? 1.9 : -1.9;
      cheek.position.set(1.85, 1.08, z);
      d.add(cheek);
    }
    const chin = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.18, 4), hide);
    chin.rotation.z = Math.PI;
    chin.position.set(2.32, 0.84, 0);
    d.add(chin);
    // Frill spikes running down the neck arc.
    const neckSpikes = [[0.62, 0.62, 0.16], [1.15, 0.9, 0.13], [1.55, 1.12, 0.11]];
    for (const [nx, ny, nr] of neckSpikes) {
      const sp = new THREE.Mesh(new THREE.ConeGeometry(nr * 0.4, nr * 2.2, 4), hide);
      sp.position.set(nx - 0.05, ny + 0.16, 0);
      sp.rotation.z = 0.5;
      d.add(sp);
    }
    // Tail: tapering chain + arrowhead tip.
    ball(-1.9, 0.02, 0, 0.34);
    ball(-2.5, 0.08, 0, 0.25);
    ball(-3.1, 0.16, 0, 0.17);
    ball(-3.6, 0.24, 0, 0.11);
    const tip = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), hide);
    tip.scale.set(2.2, 0.9, 0.9);
    tip.position.set(-3.95, 0.3, 0);
    d.add(tip);
    // Second barb on the spade for a proper tail blade.
    const tip2 = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), hide);
    tip2.scale.set(1.4, 0.9, 0.9);
    tip2.position.set(-3.75, 0.44, 0);
    d.add(tip2);
    // Dorsal spikes along the tail.
    for (let i = 0; i < 4; i++) {
      const sp = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.14, 4), hide);
      sp.position.set(-2.0 - i * 0.5, 0.34 + i * 0.02, 0);
      sp.rotation.z = 0.35;
      d.add(sp);
    }
    // Foreclaws — three tiny talons on each front foot.
    for (const z of [0.3, -0.3]) {
      for (let i = -1; i <= 1; i++) {
        const claw = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.12, 4), hide);
        claw.position.set(0.42, -0.82, z + i * 0.06);
        claw.rotation.z = -1.2;
        d.add(claw);
      }
    }
    // Spine ridges.
    for (let i = 0; i < 7; i++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.22, 4), hide);
      const x = -1.6 + i * 0.5;
      spike.position.set(x, 0.55 - Math.abs(x) * 0.08, 0);
      d.add(spike);
    }
    // Tucked legs.
    for (const [x, z] of [[0.35, 0.3], [0.35, -0.3], [-1.1, 0.3], [-1.1, -0.3]]) {
      const leg = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), hide);
      leg.position.set(x, -0.55, z);
      leg.scale.y = 1.6;
      d.add(leg);
    }
    // Glowing eyes.
    const eyeTex = makeRadialTexture([[0, 'rgba(255,214,140,1)'], [1, 'rgba(255,190,90,0)']], 64);
    for (const z of [0.17, -0.17]) {
      const eye = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: eyeTex, color: 0xffc46b, transparent: true,
          blending: THREE.AdditiveBlending, depthWrite: false,
        })
      );
      eye.position.set(2.14, 1.2, z);
      eye.scale.set(0.16, 0.16, 1);
      d.add(eye);
    }

    // Wings: custom membrane grid, mirrored pivot on each shoulder.
    this._wings = [];
    for (const side of [1, -1]) {
      const { geo, pos } = this._wingGeometry();
      const mesh = new THREE.Mesh(geo, membrane);
      mesh.frustumCulled = false;
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const pivot = new THREE.Group();
      pivot.position.set(0.1, 0.45, 0.28 * side);
      pivot.scale.z = side; // mirror
      pivot.rotation.y = 0.35 * -side; // sweep back
      pivot.add(mesh);
      // Wing bones: leading edge + two finger struts + wrist claw.
      const SPAN = this._wingSpan;
      pivot.add(spar(0, 0, 0, -0.45, -0.3, SPAN, 0.05));      // leading edge
      pivot.add(spar(0, 0, 0, -1.15, -0.06, SPAN * 0.6, 0.03)); // finger 1
      pivot.add(spar(0, 0, 0, -0.95, -0.16, SPAN * 0.82, 0.03)); // finger 2
      const wrist = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.16, 4), hide);
      wrist.rotation.x = Math.PI / 2;
      wrist.position.set(0.02, 0, 0.8);
      pivot.add(wrist);
      d.add(pivot);
      this._wings.push({ pivot, mesh, side });
    }

    d.scale.setScalar(0.9);
    this.scene.add(d);

    // Closed looping flight path — sweeps across the moon at the far side.
    this._path = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(-16, 7.5, -12),
        new THREE.Vector3(-6, 8.4, -16),
        new THREE.Vector3(4, 7.4, -14),
        new THREE.Vector3(11, 6.4, -9),
        new THREE.Vector3(8, 5.6, -4),
        new THREE.Vector3(0, 6.4, -2.6),
        new THREE.Vector3(-9, 6.8, -4.5),
      ],
      true,
      'catmullrom',
      0.9
    );
    this._pathPt = new THREE.Vector3();
    this._pathTan = new THREE.Vector3();
  }

  _updateDragon(t, dt) {
    const u = (t * 0.016) % 1;
    this._path.getPointAt(u, this._pathPt);
    this._path.getTangentAt(u, this._pathTan);
    const d = this.dragon;
    d.position.copy(this._pathPt);
    d.position.y += Math.sin(t * 0.9) * 0.15;

    const dir = this._pathTan;
    const yaw = Math.atan2(-dir.z, dir.x);
    let dyaw = yaw - this._prevYaw;
    if (dyaw > Math.PI) dyaw -= Math.PI * 2;
    if (dyaw < -Math.PI) dyaw += Math.PI * 2;
    this._prevYaw = yaw;
    const yawRate = dt > 0 ? dyaw / dt : 0;
    this._bank += (THREE.MathUtils.clamp(yawRate * 0.5, -0.5, 0.5) - this._bank) * 0.04;

    d.rotation.y = yaw;
    d.rotation.x = this._bank;
    d.rotation.z = Math.asin(THREE.MathUtils.clamp(dir.y, -1, 1)) * 0.7;

    // Wingbeat — slow, deep, majestic.
    const flap = Math.sin(t * 2.4) * 0.55 + 0.08;
    const flutter = t * 2.4;
    for (const w of this._wings) {
      w.pivot.rotation.x = -flap * w.side;
      this._layoutWing(w.mesh.geometry.attributes.position.array, flutter);
      w.mesh.geometry.attributes.position.needsUpdate = true;
    }
  }

  _buildBurst() {
    const tex = makeRadialTexture([
      [0, 'rgba(255,236,190,0.95)'],
      [0.3, 'rgba(224,184,117,0.4)'],
      [1, 'rgba(198,166,107,0)'],
    ]);
    this.burst = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: tex, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
      })
    );
    this.burst.position.set(-5, 6.5, -16);
    this.burst.scale.set(2, 2, 1);
    this.scene.add(this.burst);
  }

  /* -------------------------------------------------------------- update */
  _phase() {
    const p = this.scrollP;
    let a = KEYS[0];
    let b = KEYS[KEYS.length - 1];
    for (let i = 0; i < KEYS.length - 1; i++) {
      if (p >= KEYS[i].p && p <= KEYS[i + 1].p) {
        a = KEYS[i];
        b = KEYS[i + 1];
        break;
      }
    }
    const span = b.p - a.p || 1;
    const t = smooth(THREE.MathUtils.clamp((p - a.p) / span, 0, 1));
    const mix = (x, y) => x + (y - x) * t;
    return {
      cam: [mix(a.cam[0], b.cam[0]), mix(a.cam[1], b.cam[1]), mix(a.cam[2], b.cam[2])],
      look: [mix(a.look[0], b.look[0]), mix(a.look[1], b.look[1]), mix(a.look[2], b.look[2])],
      moon: mix(a.moon, b.moon),
      fog: mix(a.fog, b.fog),
    };
  }

  _update(t, dt) {
    const ph = this._phase();
    this.scene.fog.density = ph.fog;
    this.moon.scale.setScalar(ph.moon);

    // Warp transition — stars streak outward, camera dives forward.
    if (this._warp < 1) {
      this._warp = Math.min(1, this._warp + dt / 1.7);
    }
    const w = Math.sin(this._warp * Math.PI);
    this.starMat.uniforms.uWarp.value = w;

    // Celebration burst envelope.
    if (this._celebrate > 0 && this._celebrate < 1) {
      this._celebrate = Math.min(1, this._celebrate + dt / 3.0);
      if (this._celebrate >= 1) this._celebrate = 0;
    }
    const env = this._celebrate > 0 ? Math.sin(this._celebrate * Math.PI) : 0;
    this.burst.material.opacity = 0.9 * env;
    const bs = 3 + 30 * env;
    this.burst.scale.set(bs, bs, 1);
    this.emberMat.uniforms.uBoost.value = env;

    this.starMat.uniforms.uTime.value = t;
    this.emberMat.uniforms.uTime.value = t;

    // Nebulae drift very slowly.
    for (let i = 0; i < this._nebulae.length; i++) {
      const n = this._nebulae[i];
      n.position.x += Math.sin(t * 0.03 + i * 2) * dt * 0.35;
      n.material.rotation = Math.sin(t * 0.02 + i) * 0.12;
    }

    this._updateDragon(t, dt);

    // Camera: phase position + parallax + drag look + warp push.
    const pt = this._pointerTarget;
    this.pointer.x += (pt.x - this.pointer.x) * 0.05;
    this.pointer.y += (pt.y - this.pointer.y) * 0.05;
    // Drag look eases back to center.
    this._look.x += (0 - this._look.x) * Math.min(1, dt * 1.4);
    this._look.y += (0 - this._look.y) * Math.min(1, dt * 1.4);

    const cam = this.camera;
    cam.position.set(
      ph.cam[0] + this.pointer.x * 0.7,
      ph.cam[1] + this.pointer.y * 0.4,
      ph.cam[2] - w * 3.4
    );
    cam.fov = 50 + w * 9;
    cam.updateProjectionMatrix();
    cam.lookAt(
      ph.look[0] + this.pointer.x * 0.8 + this._look.x * 9,
      ph.look[1] + this.pointer.y * 0.7 - this._look.y * 6,
      ph.look[2]
    );
  }

  /* ---------------------------------------------------------------- API */
  renderFrame() {
    if (!this.ok) return;
    this._update(this._t, 0);
    this.renderer.render(this.scene, this.camera);
  }

  start() {
    if (this.running || !this.ok || this.reduced) return;
    this.running = true;
    let last = performance.now();
    const loop = (now) => {
      if (!this.running) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      this._t += dt;
      this._update(this._t, dt);
      this.renderer.render(this.scene, this.camera);
      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame((n) => {
      last = n;
      loop(n);
    });
  }

  stop() {
    this.running = false;
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = 0;
  }

  /* Opening transition — call when the user enters. */
  warp() {
    this._warp = 0;
    if (this.reduced) this._warp = 1;
  }

  /* Finale burst of light + ember bloom. */
  celebrate() {
    if (this._celebrate === 0) this._celebrate = 0.0001;
  }

  setScroll(p) {
    this.scrollP = p;
    if (this.reduced) this.renderFrame();
  }

  resize() {
    if (!this.ok) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    if (!this.running) this.renderFrame();
  }

  dispose() {
    this.stop();
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('pointermove', this._onPointer);
    window.removeEventListener('pointermove', this._onDrag);
    window.removeEventListener('pointerdown', this._onDown);
    window.removeEventListener('pointerup', this._onUp);
    window.removeEventListener('pointercancel', this._onUp);
    this.canvas.removeEventListener('webglcontextlost', this._onLost);
    if (this.renderer) this.renderer.dispose();
    this.ok = false;
  }
}
