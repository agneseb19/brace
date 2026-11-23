/*
 * Segnaposto disegnati in canvas.
 * Vengono usati solo finché la foto vera non è presente in public/img/.
 */

const RED = '#e5281a';
const CREAM = '#efe8dc';
const TAU = Math.PI * 2;

/* Generatore pseudo-casuale con seme: stesso disegno a ogni caricamento */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
}

/* Forma organica chiusa (mozzarella, macchie, bordo) */
function blob(ctx, x, y, r, rand, wobble = 0.3, n = 12) {
  const p = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const rr = r * (1 - wobble / 2 + rand() * wobble);
    p.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
  }
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  ctx.beginPath();
  const m0 = mid(p[n - 1], p[0]);
  ctx.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) {
    const m = mid(p[i], p[(i + 1) % n]);
    ctx.quadraticCurveTo(p[i][0], p[i][1], m[0], m[1]);
  }
  ctx.closePath();
}

function speckle(ctx, w, h, count, colors, rand, maxR = 1.6) {
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = colors[Math.floor(rand() * colors.length)];
    ctx.beginPath();
    ctx.arc(rand() * w, rand() * h, 0.4 + rand() * maxR, 0, TAU);
    ctx.fill();
  }
}

function leaf(ctx, x, y, len, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const g = ctx.createLinearGradient(0, -len * 0.3, 0, len * 0.3);
  g.addColorStop(0, '#4a8a3a');
  g.addColorStop(1, '#1d461b');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-len / 2, 0);
  ctx.quadraticCurveTo(0, -len * 0.42, len / 2, 0);
  ctx.quadraticCurveTo(0, len * 0.42, -len / 2, 0);
  ctx.fill();
  ctx.strokeStyle = 'rgba(190, 225, 160, 0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-len * 0.44, 0);
  ctx.lineTo(len * 0.44, 0);
  ctx.stroke();
  ctx.restore();
}

/* ---------- Pizza vista dall'alto, sfondo trasparente ---------- */
function pizza(kind, seed) {
  const S = 900;
  const c = S / 2;
  const R = 430;
  const [cv, ctx] = makeCanvas(S, S);
  const rand = rng(seed);

  // Cornicione
  blob(ctx, c, c, R, rand, 0.035, 48);
  const crust = ctx.createRadialGradient(c, c, R * 0.7, c, c, R);
  crust.addColorStop(0, '#f3d29b');
  crust.addColorStop(0.55, '#e2ac66');
  crust.addColorStop(1, '#a9682f');
  ctx.fillStyle = crust;
  ctx.fill();

  // Macchie di bruciatura "leopardate"
  for (let i = 0; i < 150; i++) {
    const a = rand() * TAU;
    const d = R * (0.8 + rand() * 0.17);
    const r = 3 + rand() * rand() * 17;
    ctx.fillStyle = `rgba(${28 + rand() * 30}, ${14 + rand() * 14}, 8, ${0.55 + rand() * 0.4})`;
    blob(ctx, c + Math.cos(a) * d, c + Math.sin(a) * d, r, rand, 0.45, 8);
    ctx.fill();
  }

  // Base (pomodoro o bianca)
  const white = kind === 'quattro-formaggi';
  const baseR = R * 0.76;
  blob(ctx, c, c, baseR, rand, 0.06, 36);
  const base = ctx.createRadialGradient(c, c, 0, c, c, baseR);
  if (white) {
    base.addColorStop(0, '#f7eed6');
    base.addColorStop(1, '#ead2a0');
  } else {
    base.addColorStop(0, '#d63c22');
    base.addColorStop(1, '#a8240f');
  }
  ctx.fillStyle = base;
  ctx.fill();

  ctx.save();
  ctx.clip();
  speckle(ctx, S, S, 1400, white ? ['rgba(200,150,70,.35)', 'rgba(255,255,255,.4)'] : ['rgba(120,15,5,.45)', 'rgba(240,110,70,.35)'], rand, 2.4);
  ctx.restore();

  const inside = (max = baseR * 0.8) => {
    const a = rand() * TAU;
    const d = Math.sqrt(rand()) * max;
    return [c + Math.cos(a) * d, c + Math.sin(a) * d];
  };
  const mozzarella = (n, r) => {
    for (let i = 0; i < n; i++) {
      const [x, y] = inside(baseR * 0.62);
      blob(ctx, x, y, r * (0.75 + rand() * 0.5), rand, 0.5, 11);
      ctx.fillStyle = '#f8f2e3';
      ctx.fill();
      for (let k = 0; k < 4; k++) {
        ctx.fillStyle = 'rgba(214, 150, 60, 0.55)';
        blob(ctx, x + (rand() - 0.5) * r, y + (rand() - 0.5) * r, 4 + rand() * 6, rand, 0.4, 7);
        ctx.fill();
      }
    }
  };
  const basil = (n, dist) => {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + rand() * 0.4;
      leaf(ctx, c + Math.cos(a) * dist, c + Math.sin(a) * dist, 100 + rand() * 20, a + Math.PI / 2 + (rand() - 0.5));
    }
  };

  switch (kind) {
    case 'margherita':
      mozzarella(7, 62);
      basil(5, baseR * 0.45);
      break;
    case 'marinara':
      for (let i = 0; i < 18; i++) {
        const [x, y] = inside();
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rand() * TAU);
        ctx.fillStyle = '#f2e6c4';
        ctx.strokeStyle = 'rgba(180, 140, 80, 0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, 16, 10, 0, 0, TAU);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      for (let i = 0; i < 500; i++) {
        const [x, y] = inside(baseR * 0.95);
        ctx.fillStyle = 'rgba(70, 80, 35, 0.8)';
        ctx.fillRect(x, y, 2 + rand() * 3, 2 + rand() * 2);
      }
      basil(3, baseR * 0.4);
      break;
    case 'diavola':
      mozzarella(6, 55);
      for (let i = 0; i < 18; i++) {
        const [x, y] = inside();
        const g = ctx.createRadialGradient(x, y, 4, x, y, 36);
        g.addColorStop(0, '#c0402f');
        g.addColorStop(1, '#8a2016');
        ctx.fillStyle = g;
        ctx.strokeStyle = '#5e140c';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, 34, 0, TAU);
        ctx.fill();
        ctx.stroke();
        for (let k = 0; k < 7; k++) {
          ctx.fillStyle = 'rgba(240, 195, 170, 0.8)';
          ctx.beginPath();
          ctx.arc(x + (rand() - 0.5) * 44, y + (rand() - 0.5) * 44, 2 + rand() * 2.5, 0, TAU);
          ctx.fill();
        }
      }
      for (let i = 0; i < 9; i++) {
        const [x, y] = inside();
        ctx.strokeStyle = '#d81f10';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(x, y, 9, 0, TAU);
        ctx.stroke();
      }
      break;
    case 'quattro-formaggi':
      for (let i = 0; i < 70; i++) {
        const [x, y] = inside(baseR * 0.95);
        ctx.fillStyle = `rgba(205, ${120 + rand() * 30}, 45, ${0.35 + rand() * 0.3})`;
        blob(ctx, x, y, 6 + rand() * 16, rand, 0.5, 8);
        ctx.fill();
      }
      for (let i = 0; i < 15; i++) {
        const [x, y] = inside();
        blob(ctx, x, y, 18 + rand() * 12, rand, 0.6, 9);
        ctx.fillStyle = '#a9b9b1';
        ctx.fill();
        for (let k = 0; k < 10; k++) {
          ctx.fillStyle = 'rgba(70, 100, 95, 0.8)';
          ctx.beginPath();
          ctx.arc(x + (rand() - 0.5) * 30, y + (rand() - 0.5) * 30, 1.5 + rand() * 3, 0, TAU);
          ctx.fill();
        }
      }
      for (let i = 0; i < 12; i++) {
        const [x, y] = inside();
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rand() * TAU);
        ctx.fillStyle = 'rgba(250, 236, 190, 0.95)';
        ctx.beginPath();
        ctx.moveTo(-26, -6);
        ctx.lineTo(24, -10);
        ctx.lineTo(18, 9);
        ctx.lineTo(-20, 7);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      break;
    case 'ortolana':
      mozzarella(5, 52);
      for (let i = 0; i < 7; i++) {
        const [x, y] = inside();
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rand() * TAU);
        ctx.fillStyle = '#4a2746';
        ctx.beginPath();
        ctx.ellipse(0, 0, 48, 32, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#d8c597';
        ctx.beginPath();
        ctx.ellipse(0, 0, 42, 26, 0, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
      for (let i = 0; i < 12; i++) {
        const [x, y] = inside();
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rand() * TAU);
        ctx.fillStyle = rand() > 0.5 ? '#d8331f' : '#f0b726';
        ctx.beginPath();
        ctx.roundRect(-38, -9, 76, 18, 9);
        ctx.fill();
        ctx.restore();
      }
      for (let i = 0; i < 10; i++) {
        const [x, y] = inside();
        ctx.fillStyle = '#6f9a3f';
        ctx.beginPath();
        ctx.arc(x, y, 30, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#ebe5b5';
        ctx.beginPath();
        ctx.arc(x, y, 24, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = 'rgba(70, 50, 20, 0.6)';
        ctx.lineWidth = 3;
        for (let k = -1; k <= 1; k++) {
          ctx.beginPath();
          ctx.moveTo(x - 20, y + k * 10 - 6);
          ctx.lineTo(x + 20, y + k * 10 + 6);
          ctx.stroke();
        }
      }
      basil(3, baseR * 0.5);
      break;
  }

  // Riflessi d'olio
  for (let i = 0; i < 12; i++) {
    const [x, y] = inside();
    ctx.fillStyle = 'rgba(255, 245, 200, 0.25)';
    ctx.beginPath();
    ctx.ellipse(x, y, 10 + rand() * 12, 4 + rand() * 4, rand() * TAU, 0, TAU);
    ctx.fill();
  }

  return cv.toDataURL('image/png');
}

/* ---------- Interno del forno ---------- */
function oven() {
  const W = 1600;
  const H = 1067;
  const [cv, ctx] = makeCanvas(W, H);
  const rand = rng(7);
  ctx.fillStyle = '#0d0806';
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(560, 600, 40, 700, 620, 980);
  glow.addColorStop(0, 'rgba(255, 150, 50, 0.95)');
  glow.addColorStop(0.35, 'rgba(200, 80, 20, 0.6)');
  glow.addColorStop(1, 'rgba(20, 8, 4, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Mattoni della cupola
  ctx.strokeStyle = 'rgba(25, 10, 4, 0.55)';
  ctx.lineWidth = 3;
  for (let r = 120; r < 900; r += 52) {
    ctx.beginPath();
    ctx.ellipse(800, 760, r * 1.15, r * 0.8, 0, Math.PI, TAU);
    ctx.stroke();
  }
  for (let a = 0; a < 26; a++) {
    const ang = Math.PI + (a / 26) * Math.PI;
    ctx.beginPath();
    ctx.moveTo(800 + Math.cos(ang) * 120, 760 + Math.sin(ang) * 90);
    ctx.lineTo(800 + Math.cos(ang) * 1100, 760 + Math.sin(ang) * 760);
    ctx.stroke();
  }

  // Ceppi
  ctx.fillStyle = '#2a140a';
  for (let i = 0; i < 3; i++) {
    ctx.save();
    ctx.translate(260 + i * 110, 700 - i * 18);
    ctx.rotate(-0.35 + i * 0.12);
    ctx.beginPath();
    ctx.roundRect(-150, -26, 300, 52, 26);
    ctx.fill();
    ctx.restore();
  }

  // Fiamme
  for (let i = 0; i < 9; i++) {
    const x = 140 + i * 55 + rand() * 30;
    const h = 220 + rand() * 260;
    const g = ctx.createLinearGradient(x, 720, x, 720 - h);
    g.addColorStop(0, 'rgba(255, 245, 190, 0.95)');
    g.addColorStop(0.35, 'rgba(255, 160, 40, 0.85)');
    g.addColorStop(1, 'rgba(220, 60, 10, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - 40, 720);
    ctx.bezierCurveTo(x - 50, 720 - h * 0.5, x + 10, 720 - h * 0.6, x + rand() * 30, 720 - h);
    ctx.bezierCurveTo(x + 30, 720 - h * 0.5, x + 60, 720 - h * 0.3, x + 40, 720);
    ctx.fill();
  }

  // Platea in pietra con un velo di farina
  const floor = ctx.createLinearGradient(0, 740, 0, H);
  floor.addColorStop(0, '#8a5530');
  floor.addColorStop(1, '#24140b');
  ctx.fillStyle = floor;
  ctx.fillRect(0, 740, W, H - 740);
  for (let i = 0; i < 2200; i++) {
    ctx.fillStyle = `rgba(255, 235, 210, ${rand() * 0.18})`;
    ctx.fillRect(rand() * W, 740 + rand() * (H - 740), 2, 2);
  }

  const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.75);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.7)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);

  return cv.toDataURL('image/jpeg', 0.86);
}

/* ---------- Primo piano dell'impasto ---------- */
function dough() {
  const W = 1600;
  const H = 900;
  const [cv, ctx] = makeCanvas(W, H);
  const rand = rng(21);
  ctx.fillStyle = '#0e0907';
  ctx.fillRect(0, 0, W, H);

  // Crosta
  ctx.beginPath();
  ctx.ellipse(1000, 900, 640, 720, 0, Math.PI, TAU);
  const crust = ctx.createLinearGradient(0, 180, 0, 900);
  crust.addColorStop(0, '#9a5a24');
  crust.addColorStop(1, '#d59a55');
  ctx.fillStyle = crust;
  ctx.fill();

  // Mollica
  ctx.beginPath();
  ctx.ellipse(1010, 900, 570, 620, 0, Math.PI, TAU);
  const crumb = ctx.createRadialGradient(1050, 700, 40, 1010, 760, 640);
  crumb.addColorStop(0, '#f6ead0');
  crumb.addColorStop(1, '#d9bd8c');
  ctx.fillStyle = crumb;
  ctx.fill();

  ctx.save();
  ctx.clip();
  for (let i = 0; i < 70; i++) {
    const x = 470 + rand() * 1100;
    const y = 330 + rand() * 560;
    const r = 8 + rand() * rand() * 90;
    const g = ctx.createRadialGradient(x, y - r * 0.3, r * 0.1, x, y, r);
    g.addColorStop(0, 'rgba(120, 85, 45, 0.75)');
    g.addColorStop(1, 'rgba(200, 165, 115, 0.25)');
    ctx.fillStyle = g;
    blob(ctx, x, y, r, rand, 0.4, 10);
    ctx.fill();
  }
  ctx.restore();

  for (let i = 0; i < 40; i++) {
    const a = Math.PI + rand() * Math.PI;
    const x = 1000 + Math.cos(a) * 610;
    const y = 900 + Math.sin(a) * 690;
    ctx.fillStyle = 'rgba(30, 14, 6, 0.85)';
    blob(ctx, x, y, 8 + rand() * 26, rand, 0.6, 9);
    ctx.fill();
  }

  const fade = ctx.createLinearGradient(0, 0, 900, 0);
  fade.addColorStop(0, 'rgba(14, 9, 7, 1)');
  fade.addColorStop(1, 'rgba(14, 9, 7, 0)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, 900, H);

  return cv.toDataURL('image/jpeg', 0.86);
}

/* ---------- Cartone ---------- */
function kraft(W, H, seed) {
  const [cv, ctx] = makeCanvas(W, H);
  const rand = rng(seed);
  ctx.fillStyle = '#c9a27a';
  ctx.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += 6) {
    ctx.fillStyle = `rgba(90, 60, 30, ${0.025 + rand() * 0.025})`;
    ctx.fillRect(0, y, W, 2);
  }
  speckle(ctx, W, H, Math.round((W * H) / 220), ['rgba(90,60,30,.35)', 'rgba(255,240,215,.3)', 'rgba(60,35,15,.25)'], rand, 1.3);
  const shade = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.75);
  shade.addColorStop(0, 'rgba(255,240,220,.12)');
  shade.addColorStop(1, 'rgba(70,40,15,.18)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, W, H);
  return cv.toDataURL('image/jpeg', 0.85);
}

/* ---------- Scatola aperta vista dall'alto, senza coperchio ---------- */
function boxBase() {
  const S = 900;
  const [cv, ctx] = makeCanvas(S, S);
  const a = 30;
  const b = S - 30;
  const w = 48;
  const poly = (pts, fill) => {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  };
  poly([[a + w, a + w], [b - w, a + w], [b - w, b - w], [a + w, b - w]], '#d4ad7e');
  poly([[a, a], [b, a], [b - w, a + w], [a + w, a + w]], '#b07f50');
  poly([[a, a], [a + w, a + w], [a + w, b - w], [a, b]], '#bf8f60');
  poly([[b, a], [b, b], [b - w, b - w], [b - w, a + w]], '#bc8c5d');
  poly([[a + w, b - w], [b - w, b - w], [b, b], [a, b]], '#dcb98d');
  ctx.strokeStyle = 'rgba(80, 50, 20, 0.35)';
  ctx.lineWidth = 2;
  ctx.strokeRect(a, a, b - a, b - a);
  ctx.save();
  ctx.beginPath();
  ctx.rect(a, a, b - a, b - a);
  ctx.clip();
  speckle(ctx, S, S, 3200, ['rgba(90,60,30,.3)', 'rgba(255,240,215,.25)'], rng(5), 1.2);
  ctx.restore();
  return cv.toDataURL('image/png');
}

/* ---------- Illustrazione incisa: campi di pomodori ---------- */
function fields() {
  const W = 2400;
  const H = 1000;
  const [cv, ctx] = makeCanvas(W, H);
  const rand = rng(11);
  ctx.fillStyle = CREAM;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = RED;
  ctx.lineCap = 'round';

  // Colline a strati, riempite di solchi
  for (let j = 0; j < 6; j++) {
    const y0 = 300 + j * 85;
    const amp = 40 - j * 4;
    const freq = 0.0018 + rand() * 0.0012;
    const phase = rand() * TAU;
    const ridge = (x) => y0 + Math.sin(x * freq + phase) * amp;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 12) ctx[x ? 'lineTo' : 'moveTo'](x, ridge(x));
    ctx.stroke();
    ctx.lineWidth = 1.3;
    for (let k = 1; k < 10; k++) {
      ctx.globalAlpha = 0.85 - k * 0.05;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 12) {
        const y = ridge(x) + k * 8 + Math.sin(x * 0.02 + k) * 1.5;
        ctx[x ? 'lineTo' : 'moveTo'](x, y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // Siepi sulla cresta
    for (let x = 0; x < W; x += 26 + rand() * 30) {
      ctx.beginPath();
      ctx.arc(x, ridge(x) - 6, 6 + rand() * 6, Math.PI, TAU);
      ctx.stroke();
    }
  }

  // Casale con cipressi
  const hx = 1780;
  const hy = 330;
  ctx.lineWidth = 2.4;
  ctx.strokeRect(hx, hy - 50, 120, 50);
  ctx.beginPath();
  ctx.moveTo(hx - 10, hy - 50);
  ctx.lineTo(hx + 60, hy - 80);
  ctx.lineTo(hx + 130, hy - 50);
  ctx.stroke();
  for (let i = 0; i < 4; i++) ctx.strokeRect(hx + 14 + i * 26, hy - 36, 10, 14);
  [[hx - 40, 110], [hx - 70, 90], [hx + 170, 100]].forEach(([x, h]) => {
    ctx.beginPath();
    ctx.ellipse(x, hy - h / 2, 11, h / 2, 0, 0, TAU);
    ctx.stroke();
    for (let k = 0; k < 8; k++) {
      ctx.beginPath();
      ctx.moveTo(x - 8, hy - h + 12 + k * (h / 9));
      ctx.lineTo(x + 8, hy - h + 6 + k * (h / 9));
      ctx.stroke();
    }
  });

  // Primo piano: pali, foglie e pomodori
  for (let s = 0; s < 9; s++) {
    const x = 90 + s * 270 + rand() * 40;
    const top = 620 + rand() * 60;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x + 6, H);
    ctx.stroke();
    ctx.lineWidth = 1.6;
    for (let k = 0; k < 70; k++) {
      const lx = x + (rand() - 0.5) * 230;
      const ly = top + 30 + rand() * (H - top);
      const r = 10 + rand() * 16;
      ctx.beginPath();
      ctx.ellipse(lx, ly, r, r * 0.45, rand() * TAU, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(lx - r * 0.8, ly);
      ctx.lineTo(lx + r * 0.8, ly);
      ctx.stroke();
    }
    for (let k = 0; k < 6; k++) {
      const tx = x + (rand() - 0.5) * 160;
      const ty = top + 80 + rand() * (H - top - 120);
      const r = 18 + rand() * 10;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(tx, ty, r, 0, TAU);
      ctx.stroke();
      ctx.lineWidth = 1.2;
      for (let h = -r + 6; h < r; h += 6) {
        const half = Math.sqrt(r * r - h * h);
        ctx.beginPath();
        ctx.moveTo(tx - half * 0.2, ty + h);
        ctx.lineTo(tx + half, ty + h);
        ctx.stroke();
      }
    }
  }

  return cv.toDataURL('image/png');
}

export const placeholders = {
  'pizza-margherita': () => pizza('margherita', 101),
  'pizza-marinara': () => pizza('marinara', 202),
  'pizza-diavola': () => pizza('diavola', 303),
  'pizza-quattro-formaggi': () => pizza('quattro-formaggi', 404),
  'pizza-ortolana': () => pizza('ortolana', 505),
  forno: oven,
  impasto: dough,
  'scatola-base': boxBase,
  'scatola-coperchio': () => kraft(900, 900, 8),
  'cartone-texture': () => kraft(1600, 900, 3),
  campi: fields,
};
