import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { splitWord, fitWord } from '../text.js';

/*
 * Scena 1 (sezione bloccata), come nel video di riferimento:
 * 1. hero: pizza grande e bassa
 * 2. la pizza sale al centro ruotando
 * 3. si taglia in 8 e le fette si allontanano
 * 4. le fette si ricompongono, la pizza si rimpicciolisce e il titolo diventa "Margherita"
 * 5. le pizze scorrono in diagonale (entrano in basso a destra, escono in basso a sinistra)
 * 6. forno → 7. impasto
 */

const WEDGES = 8;
const COLORS = { cream: '#efe8dc', brown: '#5a2e14', night: '#120c09' };

const vw = () => window.innerWidth;
const vh = () => window.innerHeight;
const isMobile = () => vw() <= 768;

/* Pose della prima pizza, relative alla posizione base (quella del menu) */
const POSE = {
  hero: () => (isMobile() ? { y: vh() * 0.17, scale: 1.2 } : { y: vh() * 0.14, scale: 1.45 }),
  rise: () => (isMobile() ? { y: -vh() * 0.06, scale: 1 } : { y: -vh() * 0.13, scale: 1.07 }),
  slice: () => (isMobile() ? { y: -vh() * 0.06, scale: 1.04 } : { y: -vh() * 0.12, scale: 1.14 }),
};

/* La margherita è fatta da 8 spicchi (stessa immagine ritagliata) + l'immagine intera sotto */
function buildWedges(host, src) {
  const whole = new Image();
  whole.src = src;
  whole.alt = '';
  host.appendChild(whole);

  const point = (a) => `${50 + Math.cos(a) * 75}% ${50 + Math.sin(a) * 75}%`;
  const wedges = Array.from({ length: WEDGES }, (_, i) => {
    const a0 = (i / WEDGES) * Math.PI * 2 - Math.PI / 2;
    const a1 = a0 + (Math.PI * 2) / WEDGES;
    const mid = (a0 + a1) / 2;
    const img = new Image();
    img.src = src;
    img.alt = '';
    img.className = 'wedge';
    img.style.clipPath = `polygon(50% 50%, ${point(a0)}, ${point(mid)}, ${point(a1)})`;
    img.dataset.angle = String(mid);
    host.appendChild(img);
    return img;
  });

  // 4 tagli (diametri) disegnati sopra la pizza, come la rotella che passa da un bordo all'altro
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('class', 'pizza__cuts');
  const R = 50;
  const cuts = Array.from({ length: WEDGES / 2 }, (_, i) => {
    const a = (i / WEDGES) * Math.PI * 2 - Math.PI / 2;
    const [x1, y1, x2, y2] = [50 + Math.cos(a) * R, 50 + Math.sin(a) * R, 50 - Math.cos(a) * R, 50 - Math.sin(a) * R];
    const group = document.createElementNS(NS, 'g');
    // solco scuro + bordo chiaro, per sembrare un taglio vero
    ['cut-groove', 'cut-light'].forEach((cls) => {
      const line = document.createElementNS(NS, 'line');
      Object.entries({ x1, y1, x2, y2, pathLength: 1, class: cls }).forEach(([k, v]) => line.setAttribute(k, v));
      group.appendChild(line);
    });
    svg.appendChild(group);
    return group.querySelectorAll('line');
  });
  // i tagli restano solo dentro la sagoma della pizza
  svg.style.maskImage = `url("${src}")`;
  svg.style.webkitMaskImage = `url("${src}")`;
  host.appendChild(svg);

  return { whole, wedges, svg, cuts };
}

/* Finestra ad arco del forno */
function archRect() {
  const W = vw();
  const H = vh();
  const w = isMobile() ? W * 0.88 : Math.min(W * 0.44, H * 0.95);
  const h = Math.max(H * (isMobile() ? 0.42 : 0.48), w / 2 + 40);
  const top = isMobile() ? H * 0.3 : H * 0.41;
  return { w, h, top };
}

export function initStory({ urls, reduced }) {
  const stage = document.querySelector('.story');
  const q = gsap.utils.selector(stage);
  const nav = document.querySelector('[data-nav]');

  const titleBox = q('.title')[0];
  const words = q('.title .word');
  const chars = words.map(splitWord);
  const doughChars = splitWord(q('.dough-copy__big .word')[0]);

  const pizzas = q('.pizza');
  const tilt0 = q('.pizza__tilt')[0];
  const { whole, wedges, svg: cutsSvg, cuts } = buildWedges(tilt0, urls['pizza-margherita']);

  const bg = q('.story__bg')[0];
  const heroBits = q('.hero-copy, .hero-cta');
  const sliceCopy = q('.slice-copy');
  const infos = q('.info');
  const prices = q('.price');
  const ctas = q('.menu-cta .btn');
  const cards = infos.map((info, i) => [info, prices[i], ctas[i]]);
  const oven = q('.oven')[0];
  const dough = q('.oven__dough')[0];
  const ovenCopy = q('.oven-copy');
  const doughCopy = q('.dough-copy')[0];
  const doughText = q('.dough-copy__text')[0];

  /* Il nome riempie tutta la larghezza; i nomi delle pizze il 92% */
  const fit = () => {
    const W = titleBox.clientWidth;
    const H = titleBox.clientHeight;
    words.forEach((word, i) => (i === 0 ? fitWord(word, W, H / 0.74) : fitWord(word, W * 0.92, H * 1.15)));
  };
  fit();

  /* Stato iniziale */
  gsap.set(chars.slice(1).flat(), { scaleY: 0 });
  gsap.set(pizzas.slice(1), { autoAlpha: 0 });
  gsap.set(pizzas[0], POSE.hero());
  gsap.set([...sliceCopy, ...cards.flat()], { autoAlpha: 0, y: 16 });
  gsap.set(ovenCopy, { autoAlpha: 0, y: 20 });
  gsap.set(doughCopy, { autoAlpha: 0 });
  // valori di partenza espliciti, così il filtro "luce del forno" si interpola correttamente
  gsap.set(tilt0, { filter: 'brightness(1) sepia(0) saturate(1) contrast(1)', '--shadow': 1 });

  /* Entrata al caricamento: la pizza arriva dal basso */
  function intro() {
    if (reduced) return Promise.resolve();
    return gsap
      .timeline()
      .from(chars[0], { scaleY: 0, duration: 0.9, ease: 'power4.out', stagger: 0.06 })
      .from(q('.pizzas'), { y: vh() * 0.6, duration: 1.4, ease: 'power3.out' }, 0.15)
      .from(heroBits, { autoAlpha: 0, y: 16, duration: 0.7, stagger: 0.1, ease: 'power2.out' }, 0.7)
      .from(nav, { autoAlpha: 0, duration: 0.6 }, 0.6)
      .then();
  }

  /* Timeline legata allo scroll */
  function build() {
    const size = () => pizzas[0].offsetWidth;
    const exitX = () => vw() * 0.5 + size() * 0.7;
    const offY = () => vh() * 0.42;
    const spread = () => size() * 0.07;
    const pizzaCenterY = () => pizzas[0].offsetTop + pizzas[0].offsetHeight / 2;
    const ovenTarget = () => {
      const A = archRect();
      return { y: A.top + A.h * 0.8 - pizzaCenterY(), scale: (A.w * 0.47) / size() };
    };

    // k: apertura dell'arco (0→1) · e: espansione a tutto schermo (0→1)
    const arch = { k: 0, e: 0 };
    const drawOven = () => {
      const W = vw();
      const H = vh();
      const A = archRect();
      const s = 0.55 + 0.45 * arch.k;
      const w = A.w * s;
      const h = A.h * s;
      const bottom = A.top + A.h;
      const left = (W - w) / 2;
      const mix = (from) => from * (1 - arch.e);
      oven.style.clipPath =
        `inset(${mix(bottom - h)}px ${mix(W - left - w)}px ${mix(H - bottom)}px ${mix(left)}px ` +
        `round ${mix(w / 2)}px ${mix(w / 2)}px ${mix(10)}px ${mix(10)}px)`;
    };
    drawOven();

    const tl = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      scrollTrigger: {
        trigger: stage,
        start: 'top top',
        end: () => `+=${vh() * 12}`,
        pin: true,
        scrub: reduced ? true : 0.8,
        invalidateOnRefresh: true,
      },
    });

    /* Lettere che si schiacciano e diventano un'altra parola */
    const morph = (from, to, at) => {
      tl.to(chars[from], { scaleY: 0, duration: 0.45, ease: 'power2.in', stagger: 0.025 }, at);
      if (to !== null) tl.to(chars[to], { scaleY: 1, duration: 0.6, ease: 'power3.out', stagger: 0.03 }, at + 0.32);
    };
    /* Uscita in basso a sinistra (traiettoria curva: x e y con easing diversi) */
    const exitPizza = (pizza, at) => {
      if (reduced) return tl.to(pizza, { autoAlpha: 0, duration: 0.5 }, at);
      return tl
        .to(pizza, { x: () => -exitX(), duration: 1, ease: 'power1.in' }, at)
        .to(pizza, { y: offY, rotation: '-=90', duration: 1, ease: 'power3.in' }, at);
    };
    /* Entrata dal basso a destra fino al centro */
    const enterPizza = (pizza, at) => {
      if (reduced) return tl.to(pizza, { autoAlpha: 1, duration: 0.5 }, at);
      return tl
        .fromTo(pizza, { autoAlpha: 1, x: exitX }, { x: 0, duration: 1.1, ease: 'power2.out', immediateRender: false }, at)
        .fromTo(pizza, { y: offY, rotation: 90 }, { y: 0, rotation: 0, duration: 1.1, ease: 'power3.out', immediateRender: false }, at);
    };
    const showCard = (i, at) => tl.to(cards[i], { autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.45, ease: 'power2.out' }, at);
    const hideCard = (i, at) => tl.to(cards[i], { autoAlpha: 0, y: -12, duration: 0.3, ease: 'power1.in' }, at);

    /* 1 · La pizza sale al centro ruotando */
    tl.to(heroBits, { autoAlpha: 0, y: -24, duration: 0.5, ease: 'power1.in' }, 0).fromTo(
      pizzas[0],
      { y: () => POSE.hero().y, scale: () => POSE.hero().scale, rotation: 0 },
      { y: () => POSE.rise().y, scale: () => POSE.rise().scale, rotation: reduced ? 0 : -40, duration: 1.2 },
      0,
    );

    /* 2 · Taglio: 4 tagli tracciati uno dopo l'altro, la pizza resta ferma */
    cuts.forEach((lines, i) => {
      tl.fromTo(lines, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.32, ease: 'power1.inOut' }, 1.2 + i * 0.2);
    });
    tl.to(sliceCopy, { autoAlpha: 1, y: 0, stagger: 0.12, duration: 0.5, ease: 'power2.out' }, 1.5);

    /* 3 · Le fette si staccano una dopo l'altra e si allontanano */
    const tSplit = 2.05;
    tl.set(whole, { autoAlpha: 0 }, tSplit)
      .to(tilt0, { '--shadow': 0, duration: 0.2, ease: 'none' }, tSplit)
      .to(cutsSvg, { autoAlpha: 0, duration: 0.15, ease: 'none' }, tSplit)
      .to(
        wedges,
        {
          x: (i, el) => Math.cos(Number(el.dataset.angle)) * spread(),
          y: (i, el) => Math.sin(Number(el.dataset.angle)) * spread(),
          duration: 0.6,
          ease: 'power3.out',
          stagger: 0.05,
        },
        tSplit,
      )
      .to(
        pizzas[0],
        { y: () => POSE.slice().y, scale: () => POSE.slice().scale, rotation: reduced ? 0 : -55, duration: 0.9, ease: 'power1.inOut' },
        tSplit,
      )
      .addLabel('slice', tSplit + 0.85);

    /* 4 · Le fette si ricompongono, la pizza si rimpicciolisce: inizia il menu */
    const tJoin = tSplit + 1.35;
    tl.to(sliceCopy, { autoAlpha: 0, y: -14, duration: 0.4, ease: 'power1.in' }, tJoin)
      .to(wedges, { x: 0, y: 0, duration: 0.6 }, tJoin)
      .set(whole, { autoAlpha: 1 }, tJoin + 0.6)
      .to(tilt0, { '--shadow': 1, duration: 0.3, ease: 'none' }, tJoin + 0.5)
      .to(pizzas[0], { y: 0, scale: 1, rotation: reduced ? 0 : -90, duration: 0.9 }, tJoin + 0.1);
    morph(0, 1, tJoin + 0.2);
    showCard(0, tJoin + 0.7);
    tl.addLabel('menu', tJoin + 1.2);

    /* 5 · Carosello delle pizze */
    let t = tJoin + 1.6;
    for (let k = 0; k < 4; k++) {
      exitPizza(pizzas[k], t);
      enterPizza(pizzas[k + 1], t + 0.35);
      morph(k + 1, k + 2, t + 0.15);
      hideCard(k, t);
      showCard(k + 1, t + 0.85);
      t += 1.4;
    }

    /* 5 · Forno: sfondo che si scurisce, arco che si apre, la margherita entra */
    const tO = t;
    exitPizza(pizzas[4], tO);
    morph(5, null, tO);
    hideCard(4, tO);
    tl.to(bg, { backgroundColor: COLORS.brown, duration: 0.6, ease: 'none' }, tO + 0.2)
      .to(bg, { backgroundColor: COLORS.night, duration: 0.7, ease: 'none' }, tO + 0.8)
      .to(nav, { color: COLORS.cream, duration: 0.4 }, tO + 0.6)
      .to(oven, { autoAlpha: 1, duration: 0.6 }, tO + 0.4)
      .to(arch, { k: 1, duration: 0.9, ease: 'power3.out', onUpdate: drawOven }, tO + 0.4);

    // Nel forno: prospettiva vera (rotateX), luce calda del fuoco e ombra sulla pietra
    const IN_OVEN = {
      rotationX: 62,
      transformPerspective: 700,
      filter: 'brightness(0.78) sepia(0.3) saturate(1.3) contrast(1.05)',
      '--shadow': 1.6,
    };
    if (reduced) {
      tl.set(pizzas[0], { x: 0, y: () => ovenTarget().y, scale: () => ovenTarget().scale, rotation: 0 }, tO + 0.3)
        .set(tilt0, IN_OVEN, tO + 0.3)
        .to(pizzas[0], { autoAlpha: 1, duration: 0.6 }, tO + 0.9);
    } else {
      tl.set(pizzas[0], { x: exitX, y: offY, rotation: 60, scale: 1, autoAlpha: 1 }, tO + 0.3)
        .to(pizzas[0], { x: 0, duration: 1.3, ease: 'power2.out' }, tO + 0.7)
        .to(
          pizzas[0],
          { y: () => ovenTarget().y, scale: () => ovenTarget().scale, rotation: 0, duration: 1.3, ease: 'power3.out' },
          tO + 0.7,
        )
        .to(tilt0, { ...IN_OVEN, duration: 0.9, ease: 'power2.inOut' }, tO + 1.1)
        // cottura: il cornicione si gonfia un poco
        .to(tilt0, { scale: 1.04, duration: 0.8, ease: 'sine.inOut' }, tO + 1.9);
    }
    tl.to(ovenCopy, { autoAlpha: 1, y: 0, stagger: 0.15, duration: 0.5 }, tO + 1.6).addLabel('oven', tO + 2.2);

    /* 6 · Impasto: l'arco si allarga a tutto schermo, appare "72h" */
    const tD = tO + 2.8;
    tl.to(ovenCopy, { autoAlpha: 0, y: -12, duration: 0.4 }, tD)
      .to(pizzas[0], { autoAlpha: 0, duration: 0.5 }, tD + 0.1)
      .to(arch, { e: 1, duration: 1.3, onUpdate: drawOven }, tD + 0.1)
      .to(dough, { opacity: 1, duration: 0.9, ease: 'none' }, tD + 0.4)
      .set(doughCopy, { autoAlpha: 1 }, tD + 1.0)
      .fromTo(
        doughChars,
        { scaleY: 0, scaleX: reduced ? 1 : 1.8 },
        { scaleY: 1, scaleX: 1, duration: 0.7, ease: 'power3.out', stagger: 0.07 },
        tD + 1.0,
      )
      .fromTo(doughText, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.5 }, tD + 1.4)
      .addLabel('dough', tD + 2)
      .to({}, { duration: 0.8 }, tD + 2);

    ScrollTrigger.addEventListener('refreshInit', fit);
    ScrollTrigger.addEventListener('refresh', drawOven);
    return tl;
  }

  return { intro, build };
}
