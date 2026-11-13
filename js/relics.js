/* ============================================================================
   relics.js — procedural placeholder artwork.
   Generates an original dark-fantasy "relic" image per gallery index, so the
   page never shows a broken image when a gallery item has no src (or its file
   fails to load). Deterministic per index — the same slot always looks alike.
   ========================================================================== */

const GOLD = 'rgba(198,166,107,';
const cache = new Map();

/* Tiny seeded PRNG so each variant is stable across reloads. */
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawCrystal(x) {
  x.beginPath();
  x.moveTo(0, -190);
  x.lineTo(120, -40);
  x.lineTo(70, 150);
  x.lineTo(-70, 150);
  x.lineTo(-120, -40);
  x.closePath();
  x.fillStyle = 'rgba(72,27,43,0.4)';
  x.fill();
  x.strokeStyle = GOLD + '0.85)';
  x.lineWidth = 3;
  x.stroke();
  x.strokeStyle = GOLD + '0.4)';
  x.lineWidth = 1.5;
  x.beginPath();
  x.moveTo(0, -190); x.lineTo(0, 150);
  x.moveTo(-120, -40); x.lineTo(120, -40);
  x.moveTo(0, -190); x.lineTo(70, 150);
  x.moveTo(0, -190); x.lineTo(-70, 150);
  x.stroke();
}

function drawMoon(x, rand) {
  // Gold disc, then punch a hole through the canvas for the crescent cut —
  // the page background shows through, so no seam is ever visible.
  x.beginPath();
  x.arc(0, 0, 140, 0, Math.PI * 2);
  x.fillStyle = GOLD + '0.85)';
  x.fill();
  x.save();
  x.globalCompositeOperation = 'destination-out';
  x.beginPath();
  x.arc(58, -18, 128, 0, Math.PI * 2);
  x.fill();
  x.restore();
  x.strokeStyle = GOLD + '0.5)';
  x.lineWidth = 2;
  x.beginPath();
  x.arc(0, 0, 140, Math.PI * 0.35, Math.PI * 1.55);
  x.stroke();
  // Scattered diamond stars.
  x.fillStyle = GOLD + '0.7)';
  for (let i = 0; i < 14; i++) {
    const px = (rand() - 0.5) * 480;
    const py = (rand() - 0.5) * 480 - 40;
    const s = 3 + rand() * 6;
    x.save();
    x.translate(px, py);
    x.rotate(Math.PI / 4);
    x.globalAlpha = 0.3 + rand() * 0.7;
    x.fillRect(-s / 2, -s / 2, s, s);
    x.restore();
  }
  x.globalAlpha = 1;
}

function drawBlade(x) {
  // Blade.
  x.beginPath();
  x.moveTo(0, -190);
  x.lineTo(26, -140);
  x.lineTo(14, 40);
  x.lineTo(-14, 40);
  x.lineTo(-26, -140);
  x.closePath();
  x.fillStyle = 'rgba(166,168,176,0.22)';
  x.fill();
  x.strokeStyle = GOLD + '0.85)';
  x.lineWidth = 3;
  x.stroke();
  // Fuller.
  x.strokeStyle = GOLD + '0.45)';
  x.lineWidth = 1.5;
  x.beginPath();
  x.moveTo(0, -150);
  x.lineTo(0, 30);
  x.stroke();
  // Crossguard.
  x.fillStyle = GOLD + '0.8)';
  x.fillRect(-95, 40, 190, 14);
  x.beginPath();
  x.arc(-95, 47, 9, 0, Math.PI * 2);
  x.arc(95, 47, 9, 0, Math.PI * 2);
  x.fill();
  // Grip.
  x.fillStyle = 'rgba(72,27,43,0.9)';
  x.fillRect(-13, 54, 26, 92);
  x.strokeStyle = GOLD + '0.5)';
  x.lineWidth = 1.5;
  for (let i = 0; i < 5; i++) {
    x.beginPath();
    x.moveTo(-13, 62 + i * 18);
    x.lineTo(13, 70 + i * 18);
    x.stroke();
  }
  // Pommel.
  x.beginPath();
  x.arc(0, 168, 20, 0, Math.PI * 2);
  x.fillStyle = GOLD + '0.85)';
  x.fill();
  x.strokeStyle = GOLD + '1)';
  x.lineWidth = 2;
  x.stroke();
}

function drawSigil(x, rand) {
  x.strokeStyle = GOLD + '0.8)';
  for (const r of [60, 110, 160]) {
    x.lineWidth = r === 110 ? 2 : 3;
    x.beginPath();
    x.arc(0, 0, r, 0, Math.PI * 2);
    x.stroke();
  }
  // Ring ticks.
  x.lineWidth = 2;
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + rand() * 0.02;
    const r1 = 128, r2 = 142;
    x.beginPath();
    x.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
    x.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
    x.stroke();
  }
  // Inner diamond.
  x.save();
  x.rotate(Math.PI / 4);
  x.strokeRect(-38, -38, 76, 76);
  x.restore();
  x.beginPath();
  x.arc(0, 0, 8, 0, Math.PI * 2);
  x.fillStyle = GOLD + '0.9)';
  x.fill();
}

/* Returns a data-URL for a relic artwork. variant picks the motif. */
export function relicImage(variant = 0) {
  const key = 'relic-' + (variant % 4);
  if (cache.has(key)) return cache.get(key);

  const w = 800;
  const h = 1000;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const x = c.getContext('2d');
  const rand = mulberry32(variant * 7919 + 31);

  // Background wash.
  const bg = x.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#14141c');
  bg.addColorStop(0.55, '#0d0d13');
  bg.addColorStop(1, '#09090d');
  x.fillStyle = bg;
  x.fillRect(0, 0, w, h);

  // Wine-coloured glow near the top.
  const glow = x.createRadialGradient(w / 2, h * 0.18, 0, w / 2, h * 0.18, w * 0.9);
  glow.addColorStop(0, 'rgba(72,27,43,0.5)');
  glow.addColorStop(1, 'rgba(72,27,43,0)');
  x.fillStyle = glow;
  x.fillRect(0, 0, w, h);

  // Dust specks.
  for (let i = 0; i < 140; i++) {
    const warm = rand() > 0.5;
    x.fillStyle = (warm ? GOLD : 'rgba(166,168,176,') + (0.04 + rand() * 0.14) + ')';
    const s = rand() * 2.2 + 0.4;
    x.fillRect(rand() * w, rand() * h, s, s);
  }

  // Double inner frame.
  x.strokeStyle = GOLD + '0.35)';
  x.lineWidth = 2;
  x.strokeRect(46, 46, w - 92, h - 92);
  x.strokeStyle = GOLD + '0.14)';
  x.lineWidth = 1;
  x.strokeRect(62, 62, w - 124, h - 124);

  // Motif.
  x.save();
  x.translate(w / 2, h * 0.44);
  x.lineJoin = 'round';
  const v = variant % 4;
  if (v === 0) drawCrystal(x);
  else if (v === 1) drawMoon(x, rand);
  else if (v === 2) drawBlade(x);
  else drawSigil(x, rand);
  x.restore();

  // Caption band line + centre diamond.
  x.strokeStyle = GOLD + '0.25)';
  x.lineWidth = 1.5;
  x.beginPath();
  x.moveTo(w * 0.3, h * 0.82);
  x.lineTo(w * 0.7, h * 0.82);
  x.stroke();
  x.save();
  x.translate(w / 2, h * 0.82);
  x.rotate(Math.PI / 4);
  x.fillStyle = GOLD + '0.7)';
  x.fillRect(-6, -6, 12, 12);
  x.restore();

  // Vignette.
  const vg = x.createRadialGradient(w / 2, h / 2, h * 0.25, w / 2, h / 2, h * 0.78);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.55)');
  x.fillStyle = vg;
  x.fillRect(0, 0, w, h);

  const url = c.toDataURL('image/png');
  cache.set(key, url);
  return url;
}
