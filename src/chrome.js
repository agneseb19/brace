/*
 * Colore delle barre del browser (zona dell'ora e zona in basso su iPhone):
 * segue lo sfondo della sezione visibile, così non compaiono strisce di un altro colore.
 *
 * Safari su iOS 26 ignora theme-color e tinge le sue barre con il colore degli elementi
 * fissati al bordo alto e basso dello schermo: per questo ci sono le due fasce .edge-tint.
 * theme-color e lo sfondo di <html> restano per gli altri browser e per l'overscroll.
 */
const meta = document.querySelector('meta[name="theme-color"]');
const topEdge = document.querySelector('.edge-tint--top');
const bottomEdge = document.querySelector('.edge-tint--bottom');
let current = { top: '', bottom: '' };

export function setChrome(top, bottom = top) {
  if (top && top !== current.top) {
    meta?.setAttribute('content', top);
    document.documentElement.style.backgroundColor = top;
    if (topEdge) topEdge.style.backgroundColor = top;
  }
  if (bottom && bottom !== current.bottom) {
    document.body.style.backgroundColor = bottom;
    if (bottomEdge) bottomEdge.style.backgroundColor = bottom;
  }
  current = { top: top || current.top, bottom: bottom || current.bottom };
}

export function setChromeBottom(color) {
  setChrome(current.top, color);
}
