/* ============================================================================
   portrait.js — painted artwork for the personal sections.
   No external images: two original canvas illustrations are generated at
   runtime and exported as data URLs.

     herArt() — the healer: curls, dark fantasy robes, glowing emblem, staff;
                her husky companion beside her under a moon.
     usArt()  — two silhouettes (taller him, her with curls) holding hands
                against a giant moon, husky sitting at their side.

   Everything is silhouettes + rim light: elegant, anonymous, and impossible
   to mistake for any franchise's character art.
   ========================================================================== */

const INK = '#0a0810';
const GOLD = '#C6A66B';
const ASH = '#A6A8B0';
const ICE = '#a8d4f0';

const cache = new Map();

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Sky, stars, mountains, ground mist and a big moon. */
function paintSky(ctx, w, h, rand, moon) {
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#0c0c14');
  bg.addColorStop(0.6, '#0a0a10');
  bg.addColorStop(1, '#060609');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 210; i++) {
    const s = rand() * 2 + 0.4;
    ctx.fillStyle = `rgba(234,231,225,${0.12 + rand() * 0.5})`;
    ctx.fillRect(rand() * w, rand() * h * 0.75, s, s);
  }

  // Far ridge.
  ctx.fillStyle = '#0b0912';
  ctx.beginPath();
  ctx.moveTo(0, h * 0.78);
  for (let i = 0; i <= 12; i++) {
    ctx.lineTo((w / 12) * i, h * 0.78 - rand() * h * 0.07);
  }
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // Moon + halo.
  const halo = ctx.createRadialGradient(moon.x, moon.y, moon.r * 0.4, moon.x, moon.y, moon.r * 3);
  halo.addColorStop(0, 'rgba(234,231,225,0.34)');
  halo.addColorStop(0.5, 'rgba(198,166,107,0.10)');
  halo.addColorStop(1, 'rgba(198,166,107,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(moon.x - moon.r * 3, moon.y - moon.r * 3, moon.r * 6, moon.r * 6);

  ctx.fillStyle = '#e3e0da';
  ctx.beginPath();
  ctx.arc(moon.x, moon.y, moon.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c9c6be';
  for (const [dx, dy, r] of [[-0.3, 0.14, 0.2], [0.32, -0.2, 0.13], [0.1, 0.42, 0.1]]) {
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(moon.x + dx * moon.r, moon.y + dy * moon.r, r * moon.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Low mist.
  for (let i = 0; i < 5; i++) {
    const g = ctx.createRadialGradient(
      rand() * w, h * (0.8 + rand() * 0.15), 0,
      rand() * w, h * (0.8 + rand() * 0.15), w * 0.28
    );
    g.addColorStop(0, 'rgba(166,168,176,0.05)');
    g.addColorStop(1, 'rgba(166,168,176,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
}

/* Wild curls — clustered circles around the head, ringlets at the face. */
function paintCurls(ctx, cx, cy, r, rand, color) {
  ctx.fillStyle = color;
  // Outer crown.
  const n = 16;
  for (let i = 0; i < n; i++) {
    const a = Math.PI * (0.82 + (i / (n - 1)) * 1.36); // crown + sides
    const rr = r * (0.42 + rand() * 0.3);
    const px = cx + Math.cos(a) * r * (0.85 + rand() * 0.28);
    const py = cy + Math.sin(a) * r * (0.85 + rand() * 0.28);
    ctx.beginPath();
    ctx.arc(px, py, rr, 0, Math.PI * 2);
    ctx.fill();
  }
  // Inner mass for volume.
  for (let i = 0; i < 8; i++) {
    const a = Math.PI * (0.9 + (i / 7) * 1.2);
    const rr = r * (0.36 + rand() * 0.2);
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * r * 0.42, cy + Math.sin(a) * r * 0.42, rr, 0, Math.PI * 2);
    ctx.fill();
  }
  // Ringlets framing the face — stacked shrinking coils.
  for (const dir of [-1, 1]) {
    for (let j = 0; j < 4; j++) {
      const px = cx + dir * r * (0.95 + j * 0.14);
      const py = cy + r * (0.35 + j * 0.5);
      const rr = r * (0.3 - j * 0.045);
      ctx.beginPath();
      ctx.arc(px, py, rr, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Two loose strands falling past the shoulders.
  ctx.strokeStyle = color;
  ctx.lineWidth = r * 0.26;
  ctx.lineCap = 'round';
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + dir * r * 1.0, cy + r * 0.5);
    ctx.bezierCurveTo(
      cx + dir * r * 1.7, cy + r * 1.5,
      cx + dir * r * 1.2, cy + r * 2.2,
      cx + dir * r * 1.6, cy + r * 2.9
    );
    ctx.stroke();
  }
}

/* Thin moonlit rim along one side of a silhouette path. */
function rim(ctx, draw, color, width) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.globalAlpha = 0.55;
  ctx.lineCap = 'round';
  draw();
  ctx.stroke();
  ctx.restore();
}

/* Glowing rod-and-serpent emblem (original medical motif). */
function paintEmblem(ctx, x, y, s) {
  ctx.save();
  ctx.shadowColor = 'rgba(198,166,107,0.8)';
  ctx.shadowBlur = 18;
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = s * 0.12;
  // Ring.
  ctx.beginPath();
  ctx.arc(x, y, s, 0, Math.PI * 2);
  ctx.stroke();
  // Rod.
  ctx.beginPath();
  ctx.moveTo(x, y - s * 0.7);
  ctx.lineTo(x, y + s * 0.7);
  ctx.stroke();
  // Serpent winding around the rod.
  ctx.lineWidth = s * 0.1;
  ctx.beginPath();
  ctx.moveTo(x - s * 0.28, y - s * 0.55);
  ctx.bezierCurveTo(x + s * 0.45, y - s * 0.3, x - s * 0.45, y + s * 0.1, x + s * 0.28, y + s * 0.55);
  ctx.stroke();
  ctx.restore();
}

/* Sitting husky: upright ears, mask + blaze, chest ruff, plumed tail. */
function paintHusky(ctx, x, base, s, facing = 1) {
  const MARK = '#7d8499'; // pale husky markings against the ink coat
  ctx.save();
  ctx.translate(x, base);
  ctx.scale(facing * s, s);
  ctx.lineCap = 'round';

  // Plumed tail curling up over the haunch (behind the body).
  ctx.strokeStyle = INK;
  ctx.lineWidth = 22;
  ctx.beginPath();
  ctx.moveTo(-36, -10);
  ctx.bezierCurveTo(-80, -14, -90, -58, -58, -74);
  ctx.stroke();
  // Pale underside of the plume.
  ctx.strokeStyle = MARK;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(-52, -64);
  ctx.bezierCurveTo(-70, -58, -76, -40, -70, -26);
  ctx.stroke();

  // Body — sitting, chest forward, haunch behind.
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.moveTo(-46, 0);
  ctx.bezierCurveTo(-58, -40, -52, -78, -18, -96);   // back → neck
  ctx.bezierCurveTo(-6, -104, 8, -102, 16, -92);     // neck → chest top
  ctx.bezierCurveTo(34, -72, 42, -32, 38, 0);        // chest → front paws
  ctx.closePath();
  ctx.fill();

  // Chest ruff — jagged fur spikes along the chest edge.
  for (let i = 0; i < 5; i++) {
    const y = -86 + i * 15;
    const reach = 16 - i * 1.5;
    const baseX = 32 - i * 0.5;
    ctx.beginPath();
    ctx.moveTo(baseX - 8, y - 3);
    ctx.lineTo(baseX + reach, y + 5);
    ctx.lineTo(baseX - 4, y + 14);
    ctx.closePath();
    ctx.fill();
  }
  // Pale chest blaze peeking through the ruff.
  ctx.fillStyle = MARK;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.ellipse(30, -52, 8, 22, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Head.
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(8, -112, 22, 0, Math.PI * 2);
  ctx.fill();

  // Snout.
  ctx.beginPath();
  ctx.moveTo(18, -122);
  ctx.lineTo(44, -113);
  ctx.lineTo(18, -102);
  ctx.closePath();
  ctx.fill();

  // Tall upright ears with pale inner fur.
  ctx.fillStyle = INK;
  for (const [ex, ey] of [[-4, -132], [16, -134]]) {
    ctx.beginPath();
    ctx.moveTo(ex - 9, ey + 8);
    ctx.lineTo(ex, ey - 12);
    ctx.lineTo(ex + 10, ey + 6);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = MARK;
  for (const [ex, ey] of [[-4, -132], [16, -134]]) {
    ctx.beginPath();
    ctx.moveTo(ex - 4, ey + 5);
    ctx.lineTo(ex, ey - 6);
    ctx.lineTo(ex + 5, ey + 4);
    ctx.closePath();
    ctx.fill();
  }

  // Mask: pale blaze over muzzle + up the face, dark cap stays.
  ctx.fillStyle = MARK;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.ellipse(20, -110, 13, 12, 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(14, -118, 8, 9, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Nose — dark dot on the pale muzzle tip.
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(40, -113, 3.4, 0, Math.PI * 2);
  ctx.fill();

  // Icy eye glowing on the blaze.
  ctx.save();
  ctx.shadowColor = ICE;
  ctx.shadowBlur = 10;
  ctx.fillStyle = ICE;
  ctx.beginPath();
  ctx.arc(15, -117, 3.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Moonlit rim along the back.
  rim(ctx, () => {
    ctx.beginPath();
    ctx.moveTo(-44, -4);
    ctx.bezierCurveTo(-56, -44, -50, -80, -16, -96);
  }, ASH, 3);

  ctx.restore();
}

/* Standing woman: bell gown, raised staff with orb, curls, emblem. */
function paintWoman(ctx, x, base, s, rand) {
  ctx.save();
  ctx.translate(x, base);
  ctx.scale(s, s);
  ctx.fillStyle = INK;

  // Gown.
  ctx.beginPath();
  ctx.moveTo(-105, 0);
  ctx.bezierCurveTo(-72, -140, -44, -186, -30, -197);
  ctx.lineTo(30, -197);
  ctx.bezierCurveTo(44, -186, 72, -140, 105, 0);
  ctx.closePath();
  ctx.fill();

  // Torso + shoulders.
  ctx.beginPath();
  ctx.moveTo(-30, -197);
  ctx.lineTo(-34, -250);
  ctx.quadraticCurveTo(-36, -262, -24, -266); // left shoulder
  ctx.lineTo(24, -266);
  ctx.quadraticCurveTo(36, -262, 34, -250);   // right shoulder
  ctx.lineTo(30, -197);
  ctx.closePath();
  ctx.fill();

  // Neck + head.
  ctx.fillRect(-8, -278, 16, 16);
  ctx.beginPath();
  ctx.arc(2, -296, 26, 0, Math.PI * 2);
  ctx.fill();

  // Curls.
  paintCurls(ctx, 2, -300, 26, rand, INK);

  // Raised right arm holding the staff.
  ctx.beginPath();
  ctx.moveTo(26, -262);
  ctx.quadraticCurveTo(60, -272, 88, -292);
  ctx.lineTo(96, -280);
  ctx.quadraticCurveTo(64, -256, 36, -246);
  ctx.closePath();
  ctx.fill();

  // Staff — planted on the ground, orb above her head.
  ctx.fillStyle = '#141020';
  ctx.fillRect(96, -352, 7, 352);
  const orbG = ctx.createRadialGradient(99.5, -360, 0, 99.5, -360, 34);
  orbG.addColorStop(0, 'rgba(255,224,160,0.95)');
  orbG.addColorStop(0.4, 'rgba(198,166,107,0.5)');
  orbG.addColorStop(1, 'rgba(198,166,107,0)');
  ctx.fillStyle = orbG;
  ctx.beginPath();
  ctx.arc(99.5, -360, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f4e3bd';
  ctx.beginPath();
  ctx.arc(99.5, -360, 10, 0, Math.PI * 2);
  ctx.fill();

  // Emblem on the chest.
  paintEmblem(ctx, 0, -222, 14);

  // Rim light along her moon side.
  rim(ctx, () => {
    ctx.beginPath();
    ctx.moveTo(24, -266);
    ctx.quadraticCurveTo(36, -262, 34, -250);
    ctx.lineTo(30, -197);
    ctx.bezierCurveTo(44, -186, 72, -140, 100, -8);
  }, ASH, 3);
  rim(ctx, () => {
    ctx.beginPath();
    ctx.arc(2, -296, 26, -0.5, 1.1);
  }, GOLD, 2.5);

  ctx.restore();
}

/* Simplified standing figure for the couple piece. */
function paintFigure(ctx, x, base, s, opts, rand) {
  const { h, curls, coatFlare } = opts;
  ctx.save();
  ctx.translate(x, base);
  ctx.scale(s, s);
  ctx.fillStyle = '#050408';

  // Body silhouette: shoulders → flared coat to the ground.
  ctx.beginPath();
  ctx.moveTo(-coatFlare, 0);
  ctx.bezierCurveTo(-coatFlare * 0.8, -h * 0.35, -30, -h * 0.62, -28, -h * 0.72);
  ctx.quadraticCurveTo(-30, -h * 0.78, -16, -h * 0.8);
  ctx.lineTo(16, -h * 0.8);
  ctx.quadraticCurveTo(30, -h * 0.78, 28, -h * 0.72);
  ctx.bezierCurveTo(30, -h * 0.62, coatFlare * 0.8, -h * 0.35, coatFlare, 0);
  ctx.closePath();
  ctx.fill();

  // Neck + head.
  ctx.fillRect(-7, -h * 0.8 - 10, 14, 14);
  ctx.beginPath();
  ctx.arc(0, -h * 0.8 - 30, 22, 0, Math.PI * 2);
  ctx.fill();

  if (curls) paintCurls(ctx, 0, -h * 0.8 - 34, 22, rand, '#050408');
  else {
    // Short curly mass on the crown.
    ctx.beginPath();
    ctx.ellipse(0, -h * 0.8 - 46, 24, 14, 0, Math.PI, 0);
    ctx.fill();
  }
  ctx.restore();
}

/* ---------------------------------------------------------------- exports */

/* Her + husky under a moon — portrait orientation. */
export function herArt() {
  if (cache.has('her')) return cache.get('her');
  const w = 900;
  const h = 1200;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  const rand = mulberry32(11);

  paintSky(ctx, w, h, rand, { x: 620, y: 330, r: 210 });

  // Ground.
  ctx.fillStyle = '#07070c';
  ctx.fillRect(0, h * 0.86, w, h * 0.14);
  const groundGlow = ctx.createRadialGradient(w * 0.5, h * 0.86, 0, w * 0.5, h * 0.86, w * 0.6);
  groundGlow.addColorStop(0, 'rgba(198,166,107,0.07)');
  groundGlow.addColorStop(1, 'rgba(198,166,107,0)');
  ctx.fillStyle = groundGlow;
  ctx.fillRect(0, h * 0.8, w, h * 0.2);

  paintWoman(ctx, 360, h * 0.9, 1.15, rand);
  paintHusky(ctx, 640, h * 0.9, 1.35, 1);

  // Vignette.
  const vg = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.85);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);

  const url = c.toDataURL('image/png');
  cache.set('her', url);
  return url;
}

/* The couple under a giant moon — landscape orientation. */
export function usArt() {
  if (cache.has('us')) return cache.get('us');
  const w = 1400;
  const h = 900;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  const rand = mulberry32(23);

  paintSky(ctx, w, h, rand, { x: 700, y: 400, r: 265 });

  // Ground.
  ctx.fillStyle = '#07070c';
  ctx.fillRect(0, h * 0.84, w, h * 0.16);

  const base = h * 0.9;
  // Him — taller, left.
  paintFigure(ctx, 620, base, 1.0, { h: 330, curls: false, coatFlare: 92 }, rand);
  // Her — curls, right, slightly shorter.
  paintFigure(ctx, 780, base, 1.0, { h: 290, curls: true, coatFlare: 105 }, rand);

  // Clasped hands between them — small bright shape.
  ctx.save();
  ctx.shadowColor = 'rgba(198,166,107,0.9)';
  ctx.shadowBlur = 14;
  ctx.fillStyle = '#050408';
  ctx.beginPath();
  ctx.moveTo(672, base - 150);
  ctx.lineTo(728, base - 150);
  ctx.lineTo(726, base - 138);
  ctx.lineTo(674, base - 138);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.arc(700, base - 144, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Husky at their right, looking up at them.
  paintHusky(ctx, 960, base, 1.15, -1);

  // Rim light on the silhouettes' moon-facing edges.
  rim(ctx, () => {
    ctx.beginPath();
    ctx.moveTo(592, base - 240);
    ctx.quadraticCurveTo(600, base - 320, 610, base - 330);
  }, 'rgba(234,231,225,0.6)', 3);
  rim(ctx, () => {
    ctx.beginPath();
    ctx.moveTo(800, base - 210);
    ctx.quadraticCurveTo(806, base - 290, 796, base - 300);
  }, 'rgba(234,231,225,0.5)', 3);

  // Vignette.
  const vg = ctx.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, w * 0.7);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);

  const url = c.toDataURL('image/png');
  cache.set('us', url);
  return url;
}
