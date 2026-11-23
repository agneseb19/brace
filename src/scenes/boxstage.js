import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { setChrome, setChromeBottom } from '../chrome.js';

/*
 * Scena 2 (sezione bloccata): la pizza cade nella scatola, il coperchio si chiude,
 * il coperchio si allarga e diventa la card "Cosa sarà stasera?".
 */

const INK = '#1a1411';
const CREAM = '#efe8dc';
const KRAFT_INK = '#6b4a2e';
const NIGHT = '#120c09';

/* Dove sta davvero la scatola dentro l'immagine (esclude il margine trasparente), in frazioni 0–1 */
function opaqueBounds(img) {
  const S = 200;
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, S, S);
  const data = ctx.getImageData(0, 0, S, S).data;
  let [minX, minY, maxX, maxY] = [S, S, -1, -1];
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      if (data[(y * S + x) * 4 + 3] > 40) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }
  if (maxX < 0) return { l: 0, t: 0, r: 1, b: 1 };
  return { l: minX / S, t: minY / S, r: (maxX + 1) / S, b: (maxY + 1) / S };
}

export function initBoxStage({ reduced }) {
  const stage = document.querySelector('.boxstage');
  const q = gsap.utils.selector(stage);
  const nav = document.querySelector('[data-nav]');
  const box = q('.box')[0];
  const lid = q('.box__lid')[0];
  const pizza = q('.box__pizza')[0];
  const card = q('.card')[0];
  const head = q('.card__head > *');
  const rows = q('.row');
  const names = q('.row__name');
  const lidOut = q('.box__face--out')[0];
  const stamp = q('.card__stamp')[0];
  const texture = new Image();
  texture.src = card.style.backgroundImage.slice(5, -2); // url("…") impostato da loadImages

  // Il coperchio prende esattamente la misura della scatola visibile
  const edges = opaqueBounds(q('.box__base')[0]);
  gsap.set(box, { '--bl': edges.l, '--bt': edges.t, '--bw': edges.r - edges.l, '--bh': edges.b - edges.t });

  gsap.set(lid, { rotateX: -74, transformOrigin: '50% 100%' });
  gsap.set(head, { autoAlpha: 0, y: 20 });
  gsap.set(rows, { autoAlpha: 0, y: 30 });

  function build() {
    // e: 0 = card grande come la scatola chiusa · 1 = card a tutta pagina
    const shape = { e: 0 };
    const visibleBox = () => {
      // relativo alla sezione (che durante il pin coincide con lo schermo)
      const b = box.getBoundingClientRect();
      const s = stage.getBoundingClientRect();
      const left = b.left - s.left;
      const top = b.top - s.top;
      return {
        left: left + edges.l * b.width,
        right: left + edges.r * b.width,
        top: top + edges.t * b.height,
        bottom: top + edges.b * b.height,
      };
    };

    /* Stessa texture, stessa scala e stessa posizione su coperchio e card: il passaggio non si vede */
    const syncTexture = () => {
      const W = window.innerWidth;
      const H = stage.clientHeight;
      const iw = texture.naturalWidth || 16;
      const ih = texture.naturalHeight || 9;
      const s = Math.max(W / iw, H / ih);
      const [sw, sh] = [iw * s, ih * s];
      const [ox, oy] = [(W - sw) / 2, (H - sh) / 2];
      const r = visibleBox();
      card.style.backgroundSize = `${sw}px ${sh}px`;
      card.style.backgroundPosition = `${ox}px ${oy}px`;
      lidOut.style.backgroundSize = `${sw}px ${sh}px`;
      lidOut.style.backgroundPosition = `${ox - r.left}px ${oy - r.top}px`;
    };
    texture.decode?.().then(syncTexture).catch(() => {});
    syncTexture();

    /* Colore medio della texture: serve a tingere la barra in basso di Safari quando la card arriva al bordo */
    let kraftTint = '#c99a68';
    const measureKraft = () => {
      const c = document.createElement('canvas');
      c.width = 24;
      c.height = 24;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(texture, 0, 0, 24, 24);
      const d = ctx.getImageData(0, 0, 24, 24).data;
      let [r, g, b] = [0, 0, 0];
      for (let i = 0; i < d.length; i += 4) [r, g, b] = [r + d[i], g + d[i + 1], b + d[i + 2]];
      const n = d.length / 4;
      kraftTint = `rgb(${Math.round(r / n)}, ${Math.round(g / n)}, ${Math.round(b / n)})`;
    };
    texture.decode?.().then(measureKraft).catch(() => {});

    let cardAtBottom = false;
    let themeTrigger = null; // creato più sotto: segna l'inizio della zona crema della scatola
    const inBoxZone = () => !themeTrigger || window.scrollY >= themeTrigger.start;
    const drawCard = () => {
      const atBottom = shape.e > 0.6;
      if (atBottom !== cardAtBottom && inBoxZone()) {
        cardAtBottom = atBottom;
        setChromeBottom(atBottom ? kraftTint : CREAM);
      }
      const r = visibleBox();
      stamp.style.left = `${(r.left + r.right) / 2}px`;
      stamp.style.top = `${(r.top + r.bottom) / 2}px`;
      stamp.style.opacity = String(Math.max(0, 1 - shape.e * 3));
      const W = window.innerWidth;
      const H = stage.clientHeight;
      const side = Math.max(10, W * 0.012);
      const top = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) + 4;
      const mix = (a, b) => a + (b - a) * shape.e;
      const radius = mix(4, 24);
      card.style.clipPath =
        `inset(${mix(r.top, top)}px ${mix(W - r.right, side)}px ${mix(H - r.bottom, 0)}px ${mix(r.left, side)}px ` +
        `round ${radius}px ${radius}px ${mix(4, 0)}px ${mix(4, 0)}px)`;
    };

    const tl = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      scrollTrigger: {
        trigger: stage,
        start: 'top top',
        end: () => `+=${window.innerHeight * 5}`,
        pin: true,
        scrub: reduced ? true : 0.8,
        invalidateOnRefresh: true,
        onRefresh: () => {
          syncTexture();
          drawCard();
        },
      },
    });

    tl.fromTo(
      pizza,
      { y: () => -window.innerHeight * 0.9, rotation: reduced ? 0 : -40, scale: 1.25 },
      { y: 0, rotation: 0, scale: 1, duration: 1.2, ease: 'power2.out' },
      0,
    )
      // la pizza è caduta sopra il coperchio aperto; ora che è nella scatola il coperchio le passa sopra
      .set(pizza, { zIndex: 2 }, 1.25)
      .to(lid, { rotateX: -180, duration: 1 }, 1.3)
      .addLabel('closed', 2.3)
      .set(card, { autoAlpha: 1 }, 2.5)
      .to(shape, { e: 1, duration: 1.2, ease: 'power3.inOut', onUpdate: drawCard, onStart: drawCard }, 2.5)
      .set(box, { autoAlpha: 0 }, 3.7)
      .to(head, { autoAlpha: 1, y: 0, stagger: 0.1, duration: 0.5 }, 3.5)
      .to(rows, { autoAlpha: 1, y: 0, stagger: 0.12, duration: 0.6 }, 3.7)
      .addLabel('card', 4.4);

    // Le tre opzioni si accendono una alla volta
    names.forEach((name, i) => {
      const at = 4.6 + i * 0.7;
      tl.to(name, { color: INK, duration: 0.3 }, at);
      if (i < names.length - 1) tl.to(name, { color: KRAFT_INK, duration: 0.3 }, at + 0.7);
    });
    tl.to({}, { duration: 0.6 });

    // Colore della navigazione: chiaro sul forno, scuro da qui in poi
    themeTrigger = ScrollTrigger.create({
      trigger: stage,
      start: 'top 40px',
      onEnter: () => {
        gsap.to(nav, { color: INK, duration: 0.3, overwrite: 'auto' });
        setChrome(CREAM);
      },
      onLeaveBack: () => {
        gsap.to(nav, { color: CREAM, duration: 0.3, overwrite: 'auto' });
        setChrome(NIGHT);
      },
    });

    // In fondo: quando arriva il footer crema, la barra in basso torna crema
    ScrollTrigger.create({
      trigger: '.footer',
      start: 'top bottom',
      onEnter: () => setChromeBottom(CREAM),
      onLeaveBack: () => {
        // se si è già risaliti oltre la scatola (forno scuro) non si tocca: ci pensa themeTrigger
        if (!inBoxZone()) return;
        setChromeBottom(cardAtBottom ? kraftTint : CREAM);
      },
    });

    return tl;
  }

  return { build };
}
