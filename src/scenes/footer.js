import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { splitWord, fitWord } from '../text.js';

/* Bordo di carta strappata (SVG generato) */
function tearSvg() {
  const W = 1440;
  const H = 44;
  let d = `M0 ${H} L0 20`;
  for (let x = 0; x < W; ) {
    x = Math.min(W, x + 5 + Math.random() * 16);
    d += ` L${x.toFixed(1)} ${(6 + Math.random() * 22).toFixed(1)}`;
  }
  d += ` L${W} ${H} Z`;
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><path d="${d}" fill="#efe8dc"/></svg>`;
}

export function initFooter({ reduced }) {
  document.querySelector('[data-tear]').innerHTML = tearSvg();

  const fields = document.querySelector('.footer__fields');
  const mark = document.querySelector('.footer__mark');
  const word = mark.querySelector('.word');
  const chars = splitWord(word);

  const fit = () => fitWord(word, mark.clientWidth);
  fit();
  ScrollTrigger.addEventListener('refreshInit', fit);

  if (reduced) return;

  gsap.from(chars, {
    scaleY: 0,
    duration: 0.9,
    ease: 'power4.out',
    stagger: 0.06,
    scrollTrigger: { trigger: fields, start: 'top 80%', once: true },
  });
  gsap.fromTo(
    mark,
    { yPercent: 40 },
    { yPercent: 0, ease: 'none', scrollTrigger: { trigger: fields, start: 'top bottom', end: 'bottom bottom', scrub: true } },
  );
}
