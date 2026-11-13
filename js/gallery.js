/* ============================================================================
   gallery.js — the memory hall.
   Renders polaroid-style frames from CONTENT.gallery.items, gives each a
   gentle float, and wires a click-to-expand lightbox with Escape/backdrop
   dismissal. Missing photos fall back to generated relic art.
   ========================================================================== */

import { relicImage } from './relics.js';

const el = (tag, cls) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  return n;
};

export function initGallery({ items, grid, lightbox, reduced }) {
  const lbImg = lightbox.querySelector('.lightbox-img');
  const lbCap = lightbox.querySelector('.lightbox-cap');
  const lbClose = lightbox.querySelector('.lightbox-close');
  let lastFocus = null;
  let lockY = 0; // page scroll before the body-fixed lock snaps it to top

  const open = (src, caption, alt) => {
    lbImg.src = src;
    lbImg.alt = alt;
    lbCap.textContent = caption || '';
    lbCap.hidden = !caption;
    lastFocus = document.activeElement;
    lightbox.hidden = false;
    lockY = window.scrollY;
    document.body.style.top = -lockY + 'px';
    document.documentElement.classList.add('locked');
    requestAnimationFrame(() => lightbox.classList.add('show'));
    lbClose.focus({ preventScroll: true });
  };
  const close = () => {
    lightbox.classList.remove('show');
    document.documentElement.classList.remove('locked');
    document.body.style.top = '';
    window.scrollTo(0, lockY); // back to the memory, not the top
    const done = () => {
      lightbox.hidden = true;
      lightbox.removeEventListener('transitionend', done);
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    };
    if (reduced) done();
    else lightbox.addEventListener('transitionend', done);
  };

  lbClose.addEventListener('click', close);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !lightbox.hidden) close();
  });

  (items || []).forEach((it, i) => {
    const fig = el('figure', 'shot');
    fig.style.setProperty('--tilt', ((i % 3) - 1) * 1.6 + 'deg');
    fig.style.setProperty('--float-dur', 5 + (i % 4) * 0.9 + 's');

    const btn = el('button', 'shot-frame');
    btn.type = 'button';
    btn.setAttribute('aria-label', it.alt || `Open memory ${i + 1}`);

    const img = new Image();
    img.alt = it.alt || `Memory ${i + 1}`;
    img.loading = 'lazy';
    img.decoding = 'async';
    const src = it.src && it.src.trim() ? it.src : relicImage(i);
    img.src = src;
    img.addEventListener('error', () => {
      if (img.dataset.fbk) return;
      img.dataset.fbk = '1';
      img.src = relicImage(i);
    });
    btn.appendChild(img);
    fig.appendChild(btn);

    if (it.caption) {
      const fc = el('figcaption');
      fc.textContent = it.caption;
      fig.appendChild(fc);
    }

    btn.addEventListener('click', () => open(img.src, it.caption, img.alt));
    grid.appendChild(fig);
  });
}
