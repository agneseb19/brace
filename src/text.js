/* Divide una parola in <span class="ch"> per animare ogni lettera. */
export function splitWord(el) {
  const text = el.textContent;
  el.textContent = '';
  return [...text].map((char) => {
    const span = document.createElement('span');
    span.className = 'ch';
    span.textContent = char === ' ' ? ' ' : char;
    el.appendChild(span);
    return span;
  });
}

/* Ridimensiona il font finché la parola occupa esattamente maxWidth (senza superare maxFont). */
export function fitWord(el, maxWidth, maxFont = Infinity) {
  el.style.fontSize = '100px';
  const width = el.offsetWidth || 1;
  el.style.fontSize = `${Math.min((100 * maxWidth) / width, maxFont)}px`;
}
