/*
 * Colore delle barre del browser (zona dell'ora su iPhone e area di overscroll):
 * segue lo sfondo della sezione visibile, così non compaiono strisce di un altro colore.
 */
const meta = document.querySelector('meta[name="theme-color"]');
let current = '';

export function setChrome(color) {
  if (!color || color === current) return;
  current = color;
  meta?.setAttribute('content', color);
  document.documentElement.style.backgroundColor = color;
  document.body.style.backgroundColor = color;
}
