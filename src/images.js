import { placeholders } from './placeholders.js';

/*
 * Cerca ogni immagine in public/img/<nome>.<estensione>.
 * Se il file non c'è, usa il segnaposto disegnato in canvas.
 */
// .webp per primo: sono le versioni leggere. Se sostituisci un .png, cancella il .webp con lo stesso nome.
const EXTENSIONS = ['webp', 'png', 'jpg', 'jpeg'];
const BASE = `${import.meta.env.BASE_URL}img/`;

const probe = (src) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => resolve(null);
    img.src = src;
  });

async function findReal(name) {
  for (const ext of EXTENSIONS) {
    const src = await probe(`${BASE}${name}.${ext}`);
    if (src) return src;
  }
  return null;
}

export async function loadImages() {
  const nodes = document.querySelectorAll('[data-img], [data-bg], [data-wedges]');
  const names = new Set([...nodes].map((el) => el.dataset.img ?? el.dataset.bg ?? el.dataset.wedges));

  const entries = await Promise.all(
    [...names].map(async (name) => [name, (await findReal(name)) ?? placeholders[name]?.() ?? '']),
  );
  const urls = Object.fromEntries(entries);

  document.querySelectorAll('[data-img]').forEach((img) => {
    img.src = urls[img.dataset.img];
  });
  document.querySelectorAll('[data-bg]').forEach((el) => {
    el.style.backgroundImage = `url("${urls[el.dataset.bg]}")`;
  });

  await Promise.all([...document.querySelectorAll('[data-img]')].map((img) => img.decode?.().catch(() => {})));
  return urls;
}
