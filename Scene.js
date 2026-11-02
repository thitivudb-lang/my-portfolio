// ============ PIXEL SCENE BACKGROUND ============
// กลางวัน: ตัวละครเดินไปมาบนทุ่งหญ้า | กลางคืน: เดินไปตั้งแคมป์ นั่งก่อไฟ แล้วนอนหลับ
// ตามธีมของเว็บ (data-theme = light / dark)
(() => {
  const canvas = document.getElementById('pixelScene');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isNight = () => document.documentElement.getAttribute('data-theme') === 'dark';

  let S = 4, W = 0, H = 0, groundY = 0, yFeet = 0, dirty = true;
  let stars = [], clouds = [], ground = {};
  const hero = { x: 20, dir: 1, state: 'walk' };
  const camp = { x: 0 };

  const hash = (x, y) => {
    let h = Math.imul(x, 374761393) + Math.imul(y, 668265263);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return (h ^ (h >>> 16)) >>> 0;
  };

  // ---------- sprites ----------
  const PAL = { h: '#3b2a20', s: '#f1c9a0', e: '#2a2118', t: '#c1662e', p: '#3a4a6b', b: '#2a2118' };
  const BODY = ['..hhhh..', '.hhhhhh.', '.ssssss.', '.sssses.', '..tttt..', '.tttttt.', 'stttttts', 'stttttts', '..pppp..'];
  const LEG_A = ['..p..p..', '..b..b..'];
  const LEG_B = ['...pp...', '...bb...'];
  const SLEEP = ['.hhh........', 'hhssttttpppb', '.hssttttpppb'];

  function sprite(rows, x, y, flip) {
    const w = rows[0].length;
    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < w; c++) {
        const ch = rows[r][flip ? w - 1 - c : c];
        if (ch === '.') continue;
        ctx.fillStyle = PAL[ch];
        ctx.fillRect(Math.floor(x) + c, y + r, 1, 1);
      }
    }
  }

  // ---------- setup ----------
  function buildGround(night) {
    const c = document.createElement('canvas');
    c.width = W; c.height = H - groundY;
    const g = c.getContext('2d');
    const base = night ? '#1d4a2f' : '#5c9e4a';
    const dark = night ? '#173d26' : '#4c8a3c';
    const light = night ? '#2c6a42' : '#8fd07a';
    g.fillStyle = base; g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = dark; g.fillRect(0, 0, c.width, 1);
    for (let y = 1; y < c.height; y++) {
      for (let x = 0; x < W; x++) {
        const r = hash(x, y) % 64;
        if (r === 0) { g.fillStyle = light; g.fillRect(x, y, 2, 1); }
        else if (r === 1) { g.fillStyle = dark; g.fillRect(x, y, 1, 1); }
      }
    }
    return c;
  }

  function resize() {
    S = innerWidth < 640 ? 3 : 4;
    W = Math.ceil(innerWidth / S);
    H = Math.ceil(innerHeight / S);
    canvas.width = W; canvas.height = H;
    groundY = Math.floor(H * 0.8);
    yFeet = groundY + 12;
    camp.x = Math.floor(W * 0.74);
    stars = Array.from({ length: Math.floor(W / 8) }, (_, i) => ({
      x: hash(i, 1) % W, y: hash(i, 2) % Math.floor(groundY * 0.85), p: (hash(i, 3) % 628) / 100
    }));
    clouds = Array.from({ length: Math.max(4, Math.floor(W / 90)) }, (_, i) => ({
      x: hash(i, 4) % W, y: 6 + (hash(i, 5) % Math.floor(groundY * 0.5)),
      w: 14 + (hash(i, 6) % 22), v: 1.5 + (hash(i, 7) % 10) / 6
    }));
    ground = {};
    hero.x = hero.state === 'sleep' ? camp.x - 18 : Math.min(Math.max(hero.x, 4), W - 12);
    dirty = true;
  }

  // ---------- drawing helpers ----------
  function disc(cx, cy, r, color) {
    ctx.fillStyle = color;
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++)
        if (dx * dx + dy * dy <= r * r) ctx.fillRect(cx + dx, cy + dy, 1, 1);
  }

  function cloud(c) {
    const x = Math.floor(c.x), y = c.y, w = c.w;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y + 3, w, 4);
    ctx.fillRect(x + 2, y + 1, Math.floor(w * 0.65), 2);
    ctx.fillRect(x + Math.floor(w * 0.2), y, Math.floor(w * 0.35), 1);
    ctx.fillStyle = '#cfe3f7';
    ctx.fillRect(x, y + 6, w, 1);
  }

  function tent(cx, bottom) {
    const h = 13;
    for (let i = 0; i < h; i++) {
      const half = Math.floor(i * 0.9) + 1, y = bottom - h + i;
      ctx.fillStyle = '#b85a26';
      ctx.fillRect(cx - half, y, half * 2 + 1, 1);
      ctx.fillStyle = '#7a3a16';
      ctx.fillRect(cx - half, y, 1, 1);
      ctx.fillRect(cx + half, y, 1, 1);
      if (i >= 5) {
        const d = Math.floor((i - 4) * 0.45);
        ctx.fillStyle = '#2a1a12';
        ctx.fillRect(cx - d, y, d * 2 + 1, 1);
      }
    }
  }

  function glow(cx, cy, t) {
    const R = 20 + Math.sin(t * 9) * 1.5;
    ctx.fillStyle = 'rgb(255,150,60)';
    for (let dy = -R; dy <= R * 0.5; dy++) {
      for (let dx = -R * 1.5; dx <= R * 1.5; dx++) {
        const d = Math.hypot(dx / 1.5, dy);
        if (d > R) continue;
        ctx.globalAlpha = d < R * 0.5 ? 0.15 : 0.07;
        ctx.fillRect(Math.round(cx + dx), Math.round(cy + dy), 1, 1);
      }
    }
    ctx.globalAlpha = 1;
  }

  function fire(cx, base, t) {
    const f = (k) => (Math.sin(t * 12 + k * 2.1) + 1) / 2;
    ctx.fillStyle = '#5a3a20'; ctx.fillRect(cx - 4, base - 2, 9, 2);
    ctx.fillStyle = '#3c2514'; ctx.fillRect(cx - 3, base - 3, 7, 1);
    const h1 = 5 + Math.round(f(0) * 3);
    ctx.fillStyle = '#e0561f';
    ctx.fillRect(cx - 2, base - 3 - h1 + 2, 5, h1 - 2);
    ctx.fillRect(cx - 1, base - 3 - h1, 3, 2);
    const h2 = 3 + Math.round(f(1) * 3);
    ctx.fillStyle = '#f5a623'; ctx.fillRect(cx - 1, base - 3 - h2, 3, h2);
    const h3 = 2 + Math.round(f(2) * 2);
    ctx.fillStyle = '#ffe27a'; ctx.fillRect(cx, base - 3 - h3, 1, h3);
    ctx.fillStyle = '#ffb347';
    for (let k = 0; k < 3; k++) {
      const p = (t * 0.6 + k / 3) % 1;
      ctx.globalAlpha = 1 - p;
      ctx.fillRect(cx + Math.round(Math.sin(k * 5 + t * 2) * 3), Math.round(base - 9 - p * 14), 1, 1);
    }
    ctx.globalAlpha = 1;
  }

  function zzz(x, y, t) {
    ctx.fillStyle = '#ffffff';
    for (let k = 0; k < 3; k++) {
      const p = (t * 0.35 + k / 3) % 1;
      const zx = Math.round(x + p * 8), zy = Math.round(y - p * 14);
      ctx.globalAlpha = 1 - p;
      ctx.fillRect(zx, zy, 3, 1); ctx.fillRect(zx + 1, zy + 1, 1, 1); ctx.fillRect(zx, zy + 2, 3, 1);
    }
    ctx.globalAlpha = 1;
  }

  // ---------- update / render ----------
  function update(dt, night) {
    if (night) {
      if (hero.state !== 'sleep') {
        const target = camp.x - 18, d = target - hero.x;
        if (Math.abs(d) < 1) { hero.state = 'sleep'; hero.x = target; }
        else { hero.dir = Math.sign(d); hero.x += hero.dir * 36 * dt; }
      }
    } else {
      hero.state = 'walk';
      hero.x += hero.dir * 14 * dt;
      if (hero.x < 4) { hero.x = 4; hero.dir = 1; }
      if (hero.x > W - 12) { hero.x = W - 12; hero.dir = -1; }
      clouds.forEach(c => { c.x += c.v * dt; if (c.x > W) c.x = -c.w - 2; });
    }
  }

  function render(night, t) {
    // sky
    if (night) {
      const cols = ['#0a1330', '#0e1a3a', '#14224a', '#1c2c5c'];
      cols.forEach((col, i) => {
        ctx.fillStyle = col;
        ctx.fillRect(0, Math.floor(groundY * i / 4), W, Math.ceil(groundY / 4) + 1);
      });
      ctx.fillStyle = '#ffffff';
      stars.forEach(s => {
        ctx.globalAlpha = 0.35 + 0.65 * ((Math.sin(t * 2 + s.p) + 1) / 2);
        ctx.fillRect(s.x, s.y, 1, 1);
      });
      ctx.globalAlpha = 1;
      const mx = Math.floor(W * 0.84), my = Math.floor(groundY * 0.2);
      disc(mx, my, 6, '#f4f0d8');
      ctx.fillStyle = '#d8d3b4';
      ctx.fillRect(mx - 2, my - 2, 2, 2); ctx.fillRect(mx + 2, my + 1, 2, 2); ctx.fillRect(mx - 1, my + 3, 1, 1);
    } else {
      ctx.fillStyle = '#3b8fe2';
      ctx.fillRect(0, 0, W, groundY + 1);
      ctx.globalAlpha = 0.25; disc(Math.floor(W * 0.14), Math.floor(groundY * 0.18), 9, '#fff3a0');
      ctx.globalAlpha = 1; disc(Math.floor(W * 0.14), Math.floor(groundY * 0.18), 6, '#ffd84a');
      clouds.forEach(cloud);
    }

    // ground
    const key = night ? 'n' : 'd';
    if (!ground[key]) ground[key] = buildGround(night);
    ctx.drawImage(ground[key], 0, groundY);

    // camp
    if (night) {
      glow(camp.x, yFeet - 4, t);
      tent(camp.x + 16, yFeet);
      fire(camp.x, yFeet, t);
    }

    // hero
    if (hero.state === 'sleep') {
      sprite(SLEEP, hero.x, yFeet - 3, false);
      zzz(hero.x + 2, yFeet - 6, t);
    } else {
      const legs = Math.floor(t * 6) % 2 ? LEG_B : LEG_A;
      sprite(BODY.concat(legs), hero.x, yFeet - 11, hero.dir < 0);
    }
  }

  // ---------- loop ----------
  let last = performance.now(), acc = 0, T = 0, prevNight = null;
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now; acc += dt;
    const night = isNight();
    if (night !== prevNight) {
      prevNight = night; dirty = true;
      if (reduced) { hero.state = night ? 'sleep' : 'walk'; if (night) hero.x = camp.x - 18; }
    }
    if (reduced && !dirty) return;
    if (acc < 1 / 24 && !dirty) return;
    const step = acc; acc = 0; T += step;
    if (!reduced) update(step, night);
    render(night, T);
    dirty = false;
  }

  addEventListener('resize', resize);
  resize();
  requestAnimationFrame(frame);
})();
