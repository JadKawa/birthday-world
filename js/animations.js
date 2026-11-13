/* ============================================================================
   animations.js — motion layer.
   - initReveals: GSAP ScrollTrigger reveals (only when GSAP loaded and the
     user hasn't asked for reduced motion).
   - initCursor: custom gold dot + trailing ring on fine-pointer devices.
   - initDotNav: right-edge section dots with labels and active state.
   ========================================================================== */

/* Scroll reveals. anim === gsap loaded && !reduced. */
export function initReveals(anim) {
  if (!anim) return;
  const gsap = window.gsap;
  const ST = window.ScrollTrigger;

  gsap.utils.toArray('.reveal').forEach((n) => {
    gsap.fromTo(
      n,
      { y: 34, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: n, start: 'top 86%' },
      }
    );
  });

  // Gallery polaroids stagger in.
  const shots = gsap.utils.toArray('.shot');
  if (shots.length && ST) {
    ST.batch(shots, {
      start: 'top 90%',
      onEnter: (batch) =>
        gsap.fromTo(
          batch,
          { y: 46, opacity: 0, rotate: 2 },
          { y: 0, opacity: 1, rotate: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out', overwrite: true }
        ),
    });
  }

  // Finale typography — soft staggered rise when it scrolls in.
  const lines = gsap.utils.toArray('.finale-line');
  if (lines.length && ST) {
    ST.batch(lines, {
      start: 'top 82%',
      onEnter: (batch) =>
        gsap.fromTo(
          batch,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 1.2, stagger: 0.55, ease: 'power3.out', overwrite: true }
        ),
    });
  }
}

/* Custom cursor — only on precise pointers, never with reduced motion. */
export function initCursor({ reduced, coarse }) {
  if (reduced || coarse) return;
  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  if (!dot || !ring) return;

  document.body.classList.add('has-cursor');
  let x = -100, y = -100, rx = -100, ry = -100, raf = 0;

  const move = (e) => {
    x = e.clientX;
    y = e.clientY;
    dot.style.transform = `translate(${x}px, ${y}px)`;
    const interactive = e.target.closest(
      'button, a, .shot-frame, input, textarea, [role="button"]'
    );
    ring.classList.toggle('hot', !!interactive);
  };
  let cursorRunning = false;
  const loop = () => {
    rx += (x - rx) * 0.16;
    ry += (y - ry) * 0.16;
    ring.style.transform = `translate(${rx}px, ${ry}px)`;
    if (cursorRunning) raf = requestAnimationFrame(loop);
  };
  const start = () => {
    if (cursorRunning) return;
    cursorRunning = true;
    loop();
  };
  window.addEventListener('pointermove', move, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cursorRunning = false;
      cancelAnimationFrame(raf);
    } else {
      start();
    }
  });
  start();
}

/* Right-edge dot navigation. sections: [{id, label}] */
export function initDotNav(sections, navEl, reduced) {
  if (!navEl) return;
  const dots = [];
  for (const s of sections) {
    const a = document.createElement('a');
    a.className = 'dot';
    a.href = '#' + s.id;
    a.setAttribute('aria-label', s.label);
    const tip = document.createElement('span');
    tip.className = 'dot-tip';
    tip.textContent = s.label;
    a.appendChild(tip);
    a.addEventListener('click', (e) => {
      e.preventDefault();
      document
        .getElementById(s.id)
        ?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    });
    navEl.appendChild(a);
    dots.push({ id: s.id, a });
  }

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          const d = dots.find((d) => d.id === en.target.id);
          if (d) d.a.classList.toggle('active', en.isIntersecting);
        }
      },
      { threshold: 0.35 }
    );
    for (const s of sections) {
      const n = document.getElementById(s.id);
      if (n) io.observe(n);
    }
  }
}
