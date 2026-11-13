# A Birthday in Another World

A cinematic, interactive, dark-fantasy birthday website — starfields, a
procedural dragon, painted character art, a memory gallery, a candlelit
typewritten letter and a moonlit finale.

No build tools. No npm. Plain HTML + CSS + ES modules, with Three.js and GSAP
loaded from pinned CDN versions.

## Run it

Use **VS Code Live Server** (or any static server) — ES modules do not work
from `file://`.

1. Open this folder in VS Code.
2. Right-click `index.html` → **Open with Live Server**.
3. It opens at something like `http://127.0.0.1:5500`.

Works on desktop, tablet, and phones.

## Personalize it

All personal text lives in **`js/content.js`** — the name, every headline,
the letter, gallery captions, button labels. Edit only that file.

### Photos

Drop real photos into `assets/images/` and point gallery items at them:

```js
{ src: "assets/images/memory-1.jpg", caption: "…", alt: "…" },
```

- `src: ""` keeps the painted placeholder.
- A failed photo load falls back to placeholder art automatically.
- `caption: ""` hides the caption.

### The letter

`content.js → letter.paragraphs` — each array entry is one paragraph, typed
out character-by-character. Replace the placeholder with your real letter.

## Structure

```
birthday-world/
├── index.html
├── css/style.css
├── js/
│   ├── main.js        orchestration: loader, gate, scroll, wiring
│   ├── content.js     ALL personal text — the only file you edit
│   ├── dragon.js      Three.js scene: stars, moon, dragon, camera phases
│   ├── portrait.js    canvas-painted art: her+husky, the couple
│   ├── gallery.js     polaroids + lightbox
│   ├── letter.js      typewriter letter
│   ├── relics.js      generated placeholder art
│   ├── animations.js  reveals, custom cursor, dot nav
│   └── audio.js       WebAudio ambient toggle (never autoplays)
└── assets/            images / models / audio / fonts (yours to fill)
```

## Stack

- `three@0.160.0` via jsdelivr importmap (`three/addons/` → `examples/jsm/`)
- `gsap@3.12.5` + `ScrollTrigger` via cdnjs
- Cinzel + Cormorant Garamond (Google Fonts)

## Notes

- Honors `prefers-reduced-motion` (static scene, instant letter, no tweens).
- Rendering pauses when the tab is hidden or the canvas is off-screen.
- Particle counts and pixel ratio are capped on mobile.
- If the Three.js CDN is unreachable the site falls back to a painted
  gradient sky — everything else keeps working.
- Sound is toggle-only and created inside the click (allowed by browsers).
