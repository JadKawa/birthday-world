/* ============================================================================
   cake.js — twenty-one flames.
   Paints a dark-fantasy cake on canvas (obsidian tiers, gold drip, dragon-
   scale motif, a "21" medallion — same world as the dragon), then overlays
   DOM flames on 21 candles so each can flicker and blow out individually.
   The blow button extinguishes them in a staggered gust, lifts smoke wisps,
   then reveals the wish. Clicking again relights everything.
   ========================================================================== */

const W = 640;
const H = 600;
const CX = W / 2;

const GOLD = '#c6a66b';
const GOLD_HI = '#e0b875';

/* Candle stick positions on the top-tier surface: two rings, 13 + 8 = 21. */
function candleTips() {
  const surfY = 208; // top surface of the highest tier
  const rx = 58;
  const ry = 13;
  const tips = [];
  const ring = (count, k, phase) => {
    for (let i = 0; i < count; i++) {
      const a = phase + (i / count) * Math.PI * 2;
      const bx = CX + Math.cos(a) * rx * k;
      const by = surfY + Math.sin(a) * ry * k;
      const h = 42 + ((i * 7) % 3) * 5; // slight height variety
      tips.push({ x: bx, y: by - h, baseY: by });
    }
  };
  ring(13, 1.0, -Math.PI / 2);
  ring(8, 0.5, -Math.PI / 2 + 0.3);
  return tips;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* Wavy gold icing dripping over the top edge of a tier. */
function dripEdge(ctx, x, y, w) {
  ctx.fillStyle = 'rgba(198, 166, 107, 0.9)';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  const drips = 9;
  const seg = w / drips;
  for (let i = drips; i > 0; i--) {
    const sx = x + i * seg;
    const drop = 7 + ((i * 37) % 4) * 5;
    ctx.lineTo(sx - seg * 0.5, y + drop);
    ctx.lineTo(sx - seg, y);
  }
  ctx.closePath();
  ctx.fill();
}

/* Rows of faint gold scale arcs — a nod to the dragon's world. */
function scales(ctx, x, y, w, h) {
  ctx.strokeStyle = 'rgba(198, 166, 107, 0.16)';
  ctx.lineWidth = 1.2;
  const r = 9;
  for (let row = 0; row * r * 1.1 < h; row++) {
    const yy = y + row * r * 1.1 + 6;
    const off = row % 2 ? r : 0;
    for (let xx = x + off; xx < x + w; xx += r * 2) {
      ctx.beginPath();
      ctx.arc(xx, yy, r, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
    }
  }
}

function paint(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  // Warm glow behind the cake.
  const glow = ctx.createRadialGradient(CX, 330, 40, CX, 330, 320);
  glow.addColorStop(0, 'rgba(224, 184, 117, 0.16)');
  glow.addColorStop(1, 'rgba(224, 184, 117, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // A few drifting embers.
  ctx.fillStyle = 'rgba(224, 184, 117, 0.5)';
  for (const [ex, ey, er] of [[140, 160, 2], [510, 120, 1.6], [90, 320, 1.4], [540, 300, 2], [470, 90, 1.2]]) {
    ctx.beginPath();
    ctx.arc(ex, ey, er, 0, Math.PI * 2);
    ctx.fill();
  }

  // Serving plate — gold rim, dark center.
  ctx.beginPath();
  ctx.ellipse(CX, 512, 252, 26, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#1a1420';
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(CX, 508, 218, 19, 0, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(198, 166, 107, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Tiers — deep wine fading to near-black.
  const tiers = [
    { x: 190, y: 400, w: 260, h: 110, r: 14 },
    { x: 225, y: 300, w: 190, h: 104, r: 12 },
    { x: 255, y: 208, w: 130, h: 96, r: 10 },
  ];
  for (const t of tiers) {
    const g = ctx.createLinearGradient(0, t.y, 0, t.y + t.h);
    g.addColorStop(0, '#3a1526');
    g.addColorStop(1, '#170f18');
    roundRect(ctx, t.x, t.y, t.w, t.h, t.r);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(198, 166, 107, 0.5)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.save();
    roundRect(ctx, t.x, t.y, t.w, t.h, t.r);
    ctx.clip();
    scales(ctx, t.x, t.y + 14, t.w, t.h - 14);
    dripEdge(ctx, t.x + 2, t.y + 2, t.w - 4);
    ctx.restore();
  }

  // "21" medallion on the middle tier.
  ctx.beginPath();
  ctx.ellipse(CX, 352, 36, 32, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#14101a';
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = GOLD_HI;
  ctx.font = '700 34px Cinzel, "Cormorant Garamond", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('21', CX, 354);

  // Candle sticks — ivory with a gold band, tips returned for DOM flames.
  const tips = candleTips();
  for (const tip of tips) {
    const sw = 5;
    ctx.fillStyle = '#e8e0cd';
    ctx.fillRect(tip.x - sw / 2, tip.y, sw, tip.baseY - tip.y);
    ctx.fillStyle = GOLD;
    ctx.fillRect(tip.x - sw / 2, tip.baseY - 8, sw, 3);
    // Wick.
    ctx.fillStyle = '#4a3423';
    ctx.fillRect(tip.x - 0.75, tip.y - 4, 1.5, 4);
  }
  return tips;
}

export function initCake({ canvas, flamesEl, blowBtn, wishEl, cake, reduced, onBlow, onBlown }) {
  if (!canvas || !flamesEl || !blowBtn) return;
  const tips = paint(canvas);

  // DOM flames over the canvas — each flickers on its own beat.
  tips.forEach((tip) => {
    const f = document.createElement('span');
    f.className = 'flame';
    f.style.left = (tip.x / W) * 100 + '%';
    f.style.top = (tip.y / H) * 100 + '%';
    f.style.setProperty('--fd', (-Math.random() * 0.7).toFixed(2) + 's');
    flamesEl.appendChild(f);
  });

  let blowing = false;
  let blown = false;

  const relight = () => {
    flamesEl.querySelectorAll('.flame.out').forEach((f) => f.classList.remove('out'));
    flamesEl.querySelectorAll('.smoke').forEach((s) => s.remove());
    if (wishEl) {
      wishEl.classList.remove('shown');
      wishEl.hidden = true;
    }
    blowBtn.textContent = cake.blowLabel || 'Blow out the candles';
    blowBtn.setAttribute('aria-pressed', 'false');
    blown = false;
  };

  blowBtn.textContent = cake.blowLabel || 'Blow out the candles';
  blowBtn.setAttribute('aria-pressed', 'false');

  blowBtn.addEventListener('click', () => {
    if (blowing) return;
    if (blown) {
      relight();
      return;
    }
    blowing = true;
    try {
      if (onBlow) onBlow();
    } catch (e) {}

    const flames = [...flamesEl.querySelectorAll('.flame')];
    flames.forEach((f, i) => {
      const delay = reduced ? 0 : 120 + Math.random() * 750 + i * 18;
      setTimeout(() => {
        f.classList.add('out');
        const s = document.createElement('span');
        s.className = 'smoke';
        s.style.left = f.style.left;
        s.style.top = f.style.top;
        flamesEl.appendChild(s);
        setTimeout(() => s.remove(), reduced ? 60 : 2200);
      }, delay);
    });

    setTimeout(
      () => {
        blown = true;
        blowing = false;
        if (wishEl) {
          wishEl.textContent = cake.wish || '';
          wishEl.hidden = false;
          requestAnimationFrame(() => wishEl.classList.add('shown'));
        }
        blowBtn.textContent = cake.relightLabel || 'Light them again';
        blowBtn.setAttribute('aria-pressed', 'true');
        try {
          if (onBlown) onBlown();
        } catch (e) {}
      },
      reduced ? 200 : 1600
    );
  });
}
