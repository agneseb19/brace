import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { loadImages } from './images.js';
import { initStory } from './scenes/story.js';
import { initBoxStage } from './scenes/boxstage.js';
import { initFooter } from './scenes/footer.js';

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function setupLenis() {
  if (reduced) return null;
  const lenis = new Lenis({ lerp: 0.09 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

function setupLinks(lenis, timelines) {
  const targets = {
    menu: [timelines.story, 'menu'],
    oven: [timelines.story, 'oven'],
    card: [timelines.box, 'card'],
  };
  document.querySelectorAll('[data-goto]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const [tl, label] = targets[link.dataset.goto];
      event.preventDefault();
      const y = tl.scrollTrigger.labelToScroll(label);
      if (lenis) lenis.scrollTo(y, { duration: 1.8 });
      else window.scrollTo({ top: y });
    });
  });
}

async function start() {
  const [urls] = await Promise.all([loadImages(), document.fonts.ready]);
  const lenis = setupLenis();
  lenis?.stop();

  const story = initStory({ urls, reduced });
  const box = initBoxStage({ reduced });
  await story.intro();

  const timelines = { story: story.build(), box: box.build() };
  initFooter({ reduced });
  ScrollTrigger.refresh();

  lenis?.start();
  setupLinks(lenis, timelines);
}

start();
