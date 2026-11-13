/* ============================================================================
   main.js — orchestrator.
   Builds all content from content.js, boots the dragon scene (dynamically
   imported so a CDN failure degrades gracefully), and wires everything:
   loader, opening gate + warp, scroll phases, dot nav, cursor, sound toggle,
   finale burst, replay.
   ========================================================================== */

import { CONTENT as C } from './content.js';
import { herArt, usArt } from './portrait.js';
import { initGallery } from './gallery.js';
import { initLetter } from './letter.js';
import { initCake } from './cake.js';
import { initReveals, initCursor, initDotNav } from './animations.js';
import { createScore } from './audio.js';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = window.matchMedia('(pointer: coarse)').matches;
const mobile = coarse || Math.min(window.innerWidth, window.innerHeight) < 720;
const gsapOK = typeof window.gsap !== 'undefined';
const stOK = gsapOK && typeof window.ScrollTrigger !== 'undefined';
if (stOK) window.gsap.registerPlugin(window.ScrollTrigger);
const anim = gsapOK && !reduced;

const root = document.documentElement;
if (reduced) root.classList.add('reduced');
if (anim) root.classList.add('anim');

const $ = (sel) => document.querySelector(sel);
// Created eagerly — lazy inside (no AudioContext until first gesture).
const music = createScore();
const setText = (sel, txt) => {
  const n = $(sel);
  if (n) n.textContent = txt == null ? '' : String(txt);
  return n;
};

/* ---------------------------------------------------------------- content */
function buildContent() {
  document.title = (C.meta && C.meta.title) || 'A Birthday';

  setText('#openLine1', C.opening.line1);
  setText('#openLine2', C.opening.line2);
  setText('#enterBtn', C.opening.button);

  setText('#heroKicker', C.hero.kicker);
  const nameEl = setText('#heroName', C.hero.name);
  if (nameEl) nameEl.hidden = !C.hero.name;
  setText('#heroTitle', C.hero.title);
  setText('#heroSub', C.hero.subtitle);
  setText('#scrollCueText', C.hero.cue);

  setText('#realmKicker', C.realm.kicker);
  setText('#realmTitle', C.realm.title);
  setText('#realmNote', C.realm.note);
  const realmBox = $('#realmText');
  for (const p of C.realm.paragraphs || []) {
    const n = document.createElement('p');
    n.className = 'reveal';
    n.textContent = p;
    realmBox.appendChild(n);
  }

  setText('#herKicker', C.her.kicker);
  setText('#herTitle', C.her.title);
  const herImg = $('#herArt');
  herImg.src = C.her.photo && C.her.photo.trim() ? C.her.photo : herArt();
  herImg.alt = C.her.alt || 'Illustration of her';
  const herBox = $('#herText');
  for (const p of C.her.paragraphs || []) {
    const n = document.createElement('p');
    n.className = 'reveal';
    n.textContent = p;
    herBox.appendChild(n);
  }

  setText('#usKicker', C.us.kicker);
  setText('#usTitle', C.us.title);
  const usImg = $('#usArt');
  usImg.src = C.us.photo && C.us.photo.trim() ? C.us.photo : usArt();
  usImg.alt = C.us.alt || 'Two silhouettes under the moon';
  const usBox = $('#usText');
  for (const p of C.us.paragraphs || []) {
    const n = document.createElement('p');
    n.className = 'reveal';
    n.textContent = p;
    usBox.appendChild(n);
  }

  setText('#galleryKicker', C.gallery.kicker);
  setText('#galleryTitle', C.gallery.title);

  setText('#cakeKicker', C.cake.kicker);
  setText('#cakeTitle', C.cake.title);

  setText('#letterKicker', C.letter.kicker);
  setText('#letterHeading', C.letter.heading);

  setText('#finaleLine1', C.finale.line1);
  setText('#finaleLine2', C.finale.line2);
  setText('#finaleLine3', C.finale.line3);
  setText('#burstBtn', C.finale.burstLabel);
  setText('#replayBtn', C.finale.replayLabel);
  setText('#scorpionBtn', C.finale.scorpionLabel);
  setText('#penguinBtn', C.finale.penguinLabel);
  setText('#huskyBtn', C.finale.huskyLabel);

  setText('#footLine', C.footer.line);
  setText('#footYear', '· ' + new Date().getFullYear() + ' ·');
}

/* ------------------------------------------------------------------ scene */
let scene = null;
let canvasOnScreen = true;
const resumeOK = () =>
  scene && scene.ok && !document.hidden && canvasOnScreen && !reduced;

async function initScene() {
  const canvas = $('#sky');
  try {
    const { DragonScene } = await import('./dragon.js');
    scene = new DragonScene(canvas, {
      mobile,
      reducedMotion: reduced,
      onLost: () => {
        root.classList.add('no-webgl');
        canvas.setAttribute('hidden', '');
      },
    });
    if (!scene.ok) throw new Error('webgl unavailable');
  } catch (err) {
    scene = null;
    root.classList.add('no-webgl');
    canvas.setAttribute('hidden', '');
    return;
  }
  if (!reduced) scene.start();

  document.addEventListener('visibilitychange', () => {
    if (!scene || !scene.ok) return;
    if (document.hidden) scene.stop();
    else if (resumeOK()) scene.start();
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      canvasOnScreen = entries[0].isIntersecting;
      if (canvasOnScreen) {
        if (resumeOK()) scene.start();
      } else {
        scene.stop();
      }
    }).observe(canvas);
  }
}

/* ----------------------------------------------------------------- scroll */
function initScroll() {
  const bar = $('#progress');
  let ticking = false;
  const update = () => {
    ticking = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    bar.style.transform = `scaleX(${p})`;
    if (scene) scene.setScroll(p);
    // The hero cue has done its job once she starts down.
    const cue = $('#scrollCue');
    if (cue && window.scrollY > 60) cue.classList.add('cue-fade');
    else if (cue) cue.classList.remove('cue-fade');
  };
  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    },
    { passive: true }
  );
  update();
}

/* ----------------------------------------------------------- hero intro */
function heroIntro() {
  if (!anim) return;
  window.gsap.fromTo(
    '.reveal-hero',
    { y: 36, opacity: 0 },
    { y: 0, opacity: 1, duration: 1.1, stagger: 0.14, ease: 'power3.out', delay: 0.2 }
  );
}

/* ------------------------------------------------------------ opening -- */
function initOpening() {
  const opening = $('#opening');
  const enterBtn = $('#enterBtn');
  if (enterBtn && !enterBtn.textContent.trim()) {
    enterBtn.textContent = 'Enter Your World';
  }
  let entered = false;
  root.classList.add('locked');

  const dismiss = () => {
    opening.classList.add('gone');
    setTimeout(() => (opening.style.display = 'none'), 750);
  };

  const doEnter = () => {
    if (entered) return;
    entered = true;
    root.classList.remove('locked');
    // Guaranteed dismissal — even if a tween is interrupted.
    setTimeout(dismiss, 1400);
    try {
      if (scene && scene.ok) scene.warp();
    } catch (e) {}
    try {
      heroIntro();
    } catch (e) {}
    // Enter is a real gesture — start the ambient score.
    try {
      music.start();
    } catch (e) {}
    if (!anim) {
      dismiss();
      return;
    }
    try {
      window.gsap
        .timeline()
        .to('.open-inner', { scale: 0.96, opacity: 0, duration: 0.5, ease: 'power2.in' })
        .to(opening, { opacity: 0, duration: 0.8, ease: 'power2.inOut' }, '<0.1')
        .add(() => opening.classList.add('gone'));
    } catch (e) {
      dismiss();
    }
  };
  enterBtn.addEventListener('click', doEnter);

  // Self-healing: if the scroll lock ever fails on a device, the first
  // scroll gesture itself opens the world instead of stranding the gate.
  const autoEnter = () => {
    if (!entered && window.scrollY > 40) {
      window.removeEventListener('scroll', autoEnter);
      doEnter();
    }
  };
  window.addEventListener('scroll', autoEnter, { passive: true });
}

/* ---------------------------------------------------------------- finale */
function initFinale() {
  const section = $('#finale');
  // DOM-level feedback — always visible even if WebGL is down.
  const flash = () => {
    if (!section) return;
    section.classList.remove('skyflash');
    void section.offsetWidth; // restart the animation
    section.classList.add('skyflash');
  };
  const burst = () => {
    flash();
    try {
      if (scene && scene.ok) scene.celebrate();
    } catch (e) {}
  };
  const burstBtn = $('#burstBtn');
  if (burstBtn) burstBtn.addEventListener('click', burst);

  // Replay — scroll home, run the star-dive + hero reveal again.
  const replayBtn = $('#replayBtn');
  if (replayBtn) {
    replayBtn.addEventListener('click', () => {
      root.classList.remove('locked'); // never trap the page
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
      setTimeout(
        () => {
          try {
            if (scene && scene.ok) scene.warp();
          } catch (e) {}
          try {
            heroIntro();
          } catch (e) {}
        },
        reduced ? 60 : 900
      );
    });
  }

  if ('IntersectionObserver' in window && section) {
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          burst();
          io.disconnect();
        }
      },
      { threshold: 0.45 }
    );
    io.observe(section);
  }
}

/* ------------------------------------------------------------------ misc */
function initSound() {
  const btn = $('#soundBtn');
  const on = btn.querySelector('.ic-on');
  const off = btn.querySelector('.ic-off');
  btn.addEventListener('click', () => {
    const enabled = music.toggle();
    btn.setAttribute('aria-pressed', String(enabled));
    on.hidden = !enabled;
    off.hidden = enabled;
  });
}

function hideLoader() {
  const loader = $('#loader');
  if (!loader) return;
  const done = () => loader.remove();
  loader.classList.add('done');
  if (reduced) done();
  else loader.addEventListener('transitionend', done, { once: true });
  // If transitionend never lands (throttled tab), remove anyway.
  setTimeout(() => loader.parentNode && loader.remove(), 1500);
}

/* ------------------------------------------------------------------- boot */
// Run each subsystem independently so one failure can't take down the rest.
const safe = (name, fn) => {
  try {
    fn();
  } catch (err) {
    console.error('[world:' + name + ']', err);
  }
};

async function boot() {
  safe('content', buildContent);
  safe('opening', initOpening);
  safe('gallery', () =>
    initGallery({
      items: C.gallery.items,
      grid: $('#galleryGrid'),
      lightbox: $('#lightbox'),
    })
  );
  safe('cake', () =>
    initCake({
      canvas: $('#cakeArt'),
      flamesEl: $('#cakeFlames'),
      blowBtn: $('#blowBtn'),
      wishEl: $('#cakeWish'),
      cake: C.cake,
      reduced,
      onBlow: () => {
        try {
          music.whoosh();
        } catch (e) {}
      },
      onBlown: () => {
        try {
          if (scene && scene.ok) scene.celebrate();
        } catch (e) {}
      },
    })
  );
  safe('letter', () =>
    initLetter({
      letter: C.letter,
      body: $('#letterBody'),
      signature: $('#letterSign'),
      signatureName: $('#letterSignName'),
      section: $('#letter'),
      reduced,
      onStart: () => {
        try {
          music.playBirthday();
        } catch (e) {}
      },
    })
  );
  safe('scroll', initScroll);
  safe('reveals', () => initReveals(anim));
  safe('cursor', () => initCursor({ reduced, coarse }));
  safe('dotnav', () =>
    initDotNav(
      [
        { id: 'hero', label: C.nav.opening },
        { id: 'realm', label: C.nav.realm },
        { id: 'her', label: C.nav.her },
        { id: 'us', label: C.nav.us },
        { id: 'gallery', label: C.nav.gallery },
        { id: 'cake', label: C.nav.cake },
        { id: 'letter', label: C.nav.letter },
        { id: 'finale', label: C.nav.finale },
      ],
      $('#dotnav'),
      reduced
    )
  );
  safe('finale', initFinale);
  safe('sound', initSound);
  // Scene boots in parallel — the veil never waits on WebGL.
  initScene().catch((err) => console.error('[world:scene]', err));
  // Give the first frame a beat before lifting the veil.
  setTimeout(hideLoader, reduced ? 60 : 750);
}
boot();

// Absolute fallback: whatever happens, the loader dies within 4.5s.
setTimeout(() => {
  const l = document.getElementById('loader');
  if (l) {
    l.classList.add('done');
    setTimeout(() => l.remove(), 900);
  }
}, 4500);
