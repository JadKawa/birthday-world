/* ============================================================================
   letter.js — the candlelit letter.
   Types CONTENT.letter.paragraphs character-by-character when the section
   scrolls into view, with a blinking caret. Supports line breaks: every
   array entry becomes its own paragraph. Reduced motion → instant reveal.
   ========================================================================== */

export function initLetter({ letter, body, signature, signatureName, section, reduced, onStart }) {
  // Blank lines (\n\n) split into real paragraphs; single \n renders as
  // a line break inside the paragraph (CSS white-space: pre-line).
  const paras = (letter.paragraphs || []).flatMap((p) =>
    String(p)
      .split(/\n\s*\n/)
      .map((s) => s.trim())
      .filter(Boolean)
  );

  const pEls = paras.map(() => {
    const p = document.createElement('p');
    body.appendChild(p);
    return p;
  });
  const caret = document.createElement('span');
  caret.className = 'caret';
  caret.setAttribute('aria-hidden', 'true');

  const fillInstant = () => {
    pEls.forEach((p, i) => (p.textContent = paras[i]));
    if (signature) {
      signature.hidden = !(letter.signature || letter.signatureName);
      signature.querySelector('.sig-line').textContent = letter.signature || '';
      signatureName.textContent = letter.signatureName || '';
      signatureName.hidden = !letter.signatureName;
      signature.classList.add('shown');
    }
  };

  if (reduced) {
    fillInstant();
    if (onStart) {
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting) {
              try { onStart(); } catch (e) {}
              io.disconnect();
            }
          },
          { threshold: 0.35 }
        );
        io.observe(section);
      } else {
        try { onStart(); } catch (e) {}
      }
    }
    return;
  }

  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    try {
      if (onStart) onStart();
    } catch (e) {}

    let pi = 0;
    let ci = 0;
    if (pEls.length) pEls[0].appendChild(caret);

    const tick = () => {
      if (pi >= paras.length) {
        caret.remove();
        if (signature) {
          signature.hidden = !(letter.signature || letter.signatureName);
          signature.querySelector('.sig-line').textContent = letter.signature || '';
          signatureName.textContent = letter.signatureName || '';
          signatureName.hidden = !letter.signatureName;
          signature.classList.add('shown');
        }
        return;
      }
      const text = paras[pi];
      if (ci <= text.length) {
        // Rebuild current paragraph text + caret each tick (cheap enough).
        pEls[pi].textContent = text.slice(0, ci);
        pEls[pi].appendChild(caret);
        ci += text[ci - 1] === ' ' ? 2 : 1; // swallow double space flicker
        const delay = 24 + Math.random() * 30;
        setTimeout(tick, delay);
      } else {
        pi++;
        ci = 0;
        if (pi < pEls.length) pEls[pi].appendChild(caret);
        setTimeout(tick, 420); // breath between paragraphs
      }
    };
    tick();
  };

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          start();
          io.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    io.observe(section);
  } else {
    start();
  }
}
