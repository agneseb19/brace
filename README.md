# Brace — Pizzeria napoletana

A one-page concept site for a fictional Neapolitan pizzeria in Turin, built as a portfolio piece. Almost everything happens on scroll: the pizza is the main character and travels through the page.

**Highlights**
- **Scroll-driven story.** One pinned stage and a single GSAP timeline. The margherita rises to the centre, a cutter scores it into eight (the cuts are SVG lines drawn with `stroke-dashoffset`), the slices pull apart and rejoin, then the five pizzas of the menu slide through on a diagonal while the wordmark squashes letter by letter into each pizza's name.
- **Oven and dough.** The background darkens, an arched window opens on a wood-fired oven and the pizza slides onto the stone floor in real perspective, lit by the fire. The arch then grows to full screen on a close-up of the 72-hour dough.
- **Box to card.** The pizza drops over the open lid into a box, the lid closes in 3D and expands into the order card (delivery, pickup, reservations), which tears open onto the footer.

**Stack:** Vite · vanilla JavaScript · GSAP ScrollTrigger · Lenis

Brand, menu, prices and address are invented; photos are AI-generated. Respects `prefers-reduced-motion` and works down to 390 px.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static build in dist/
```

## Images

The site looks for each image in `public/img/<name>.webp|png|jpg|jpeg`, in that order. When a file is missing, a placeholder drawn in canvas takes its place (see `src/placeholders.js`). If you replace a `.png`, delete the `.webp` with the same name.
