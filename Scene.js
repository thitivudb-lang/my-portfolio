// ============ PIXEL SCENE BACKGROUND ============
// กลางวัน: ตัวละครเดินไปมาบนทุ่งหญ้า | กลางคืน: ตั้งแคมป์ ก่อไฟ นอนหลับ
// ผูกกับ data-theme ของ <html> (ปุ่มสลับธีมเดิม)
(() => {
  const canvas = document.getElementById('sceneCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const root = document.documentElement;
  const reduceMotion = false;

  // ---------- palettes ----------
  const PAL = {
    day: {
      sky: ['#2f86d9', '#3b93e0', '#58a6e8'],
      grass: '#5e9b52', edge: '#4b8a44', tuft: '#8fcf83',
      cloud: '#ffffff', cloudShade: '#c6dcf2', cloudAlpha: 1
    },
    night: {
      sky: ['#0a1030', '#101a40', '#1b2a5a'],
      grass: '#2a4a35', edge: '#1d3727', tuft: '#41704e',
      cloud: '#3b4b86', cloudShade: '#2c3a6c', cloudAlpha: 0.55
    }
  };

  const COL = {
    h: '#3b2a1a', s: '#f2c29b', e: '#1a1a1a', t: '#c1662e',
    p: '#34507f', b: '#2a2118', c: '#4a6fa5', r: '#7a4b2a', w: '#e8e0d0'
  };

  // ---------- sprites (หันขวา) ----------
  const BODY = [
    '..hhhhh..',
    '.hhhhhhh.',
    '.hsssssh.',
    '.hsssses.',
    '..sssss..',
    '..ttttt..',
    '.sttttts.',
    '.sttttts.',
    '..ttttt..',
    '..ppppp..'
  ];
  const LEGS = [
    ['..pp.pp..', '..bb.bb..'],
    ['.pp...pp.', '.bb...bb.']
  ];
  const SLEEP = [
    '.hhhh...........',
    'hhssscccccccccccc'.slice(0, 16),
    'hsssscccccccccc.',
    'wwwwwrrrrrrrrrrr'
  ];
  const Z_GLYPH = ['####', '..#.', '.#..', '####'];

  // ---------- cloud shapes [dx, dy, w, h] ----------
  const CLOUDS = [
    [[6, 0, 8, 2], [2, 2, 18, 2], [0, 4, 22, 2]],
    [[8, 0, 6, 2], [14, 2, 10, 2], [2, 2, 10, 2], [0, 4, 26, 2]],
    [[3, 0, 6, 2], [0, 2, 14, 2]]
  ];

  // ---------- state ----------
  let S, W, H, horizon, feetY;
  let clouds = [], stars = [], tufts = [];
  let mix = root.getAttribute('data-theme') === 'dark' ? 1 : 0; // 0 = day, 1 = night
  let target = mix;
  const walker = { x: 40, dir: 1, state: 'walk', timer: 3 };
  let sparks = [];
  let last = performance.now();
  let t = 0;

  function mulberry32(a) {
    return () => {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let x = Math.imul(a ^ (a >>> 15), 1 | a);
      x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }

  function resize() {
    S = window.innerWidth > 900 ? 5 : 3;
    W = Math.ceil(window.innerWidth / S);
    H = Math.ceil(window.innerHeight / S);
    canvas.width = W;
    canvas.height = H;
    horizon = Math.floor(H * 0.68);
    feetY = horizon + Math.floor((H - horizon) * 0.5);

    const rng = mulberry32(42);
    clouds = Array.from({ length: Math.max(5, Math.round(W / 55)) }, () => ({
      x: rng() * (W + 40) - 20,
      y: 4 + Math.floor(rng() * Math.max(6, horizon * 0.45)),
      shape: Math.floor(rng() * CLOUDS.length),
      speed: 1.5 + rng() * 2.5
    }));
    stars = Array.from({ length: Math.round(W / 5) }, () => ({
      x: Math.floor(rng() * W),
      y: Math.floor(rng() * (horizon - 6)),
      phase: rng() * 6.28,
      big: rng() > 0.85
    }));
    tufts = Array.from({ length: Math.round((W * (H - horizon)) / 90) }, () => ({
      x: Math.floor(rng() * W),
      y: horizon + 3 + Math.floor(rng() * Math.max(1, H - horizon - 3)),
      w: 1 + Math.floor(rng() * 2),
      flower: rng() > 0.93 ? (rng() > 0.5 ? '#f4a6c0' : '#ffe066') : null
    }));
    walker.x = Math.min(Math.max(walker.x, 10), W - 20);
    draw();
  }

  // ---------- helpers ----------
  const rect = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.floor(x), Math.floor(y), w, h); };

  function disc(cx, cy, r, c) {
    ctx.fillStyle = c;
    for (let y = -r; y <= r; y++) {
      const half = Math.floor(Math.sqrt(r * r - y * y));
      ctx.fillRect(cx - half, cy + y, half * 2 + 1, 1);
    }
  }

  function ellipse(cx, cy, rx, ry, c) {
    ctx.fillStyle = c;
    for (let y = -ry; y <= ry; y++) {
      const half = Math.floor(rx * Math.sqrt(1 - (y * y) / (ry * ry)));
      ctx.fillRect(Math.floor(cx - half), Math.floor(cy + y), half * 2, 1);
    }
  }

  function sprite(rows, x, y, flip) {
    x = Math.floor(x); y = Math.floor(y);
    const w = rows[0].length;
    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < rows[r].length; c++) {
        const ch = rows[r][c];
        if (ch === '.') continue;
        ctx.fillStyle = COL[ch];
        ctx.fillRect(flip ? x + (w - 1 - c) : x + c, y + r, 1, 1);
      }
    }
  }

  // ---------- world ----------
  function drawWorld(p, isNight) {
    const bands = [0, horizon * 0.45, horizon * 0.8, horizon];
    for (let i = 0; i < 3; i++) {
      rect(0, Math.floor(bands[i]), W, Math.ceil(bands[i + 1] - bands[i]) + 1, p.sky[i]);
    }

    if (isNight) {
      stars.forEach(s => {
        const a = 0.45 + 0.55 * Math.sin(t * 2 + s.phase);
        ctx.globalAlpha = Math.max(0.1, a);
        rect(s.x, s.y, 1, 1, '#ffffff');
        if (s.big) {
          rect(s.x - 1, s.y, 3, 1, '#fff6c8');
          rect(s.x, s.y - 1, 1, 3, '#fff6c8');
        }
      });
      ctx.globalAlpha = 1;
      const mx = Math.floor(W * 0.84), my = 16;
      disc(mx, my, 6, '#f4f1d0');
      disc(mx + 3, my - 2, 5, p.sky[0]);
    } else {
      const sx = Math.floor(W * 0.84), sy = 16;
      disc(sx, sy, 8, '#ffe9a0');
      disc(sx, sy, 6, '#ffd84a');
    }

    // clouds
    ctx.globalAlpha = p.cloudAlpha;
    clouds.forEach(c => {
      const shape = CLOUDS[c.shape];
      shape.forEach(([dx, dy, w, h], i) => {
        rect(c.x + dx, c.y + dy, w, h, p.cloud);
        if (i === shape.length - 1) rect(c.x + dx, c.y + dy + h - 1, w, 1, p.cloudShade);
      });
    });
    ctx.globalAlpha = 1;

    // ground
    rect(0, horizon, W, H - horizon, p.grass);
    rect(0, horizon, W, 1, p.edge);
    tufts.forEach(f => {
      rect(f.x, f.y, f.w, 1, p.tuft);
      if (f.flower && !isNight) {
        rect(f.x, f.y - 2, 1, 1, f.flower);
        rect(f.x, f.y - 1, 1, 1, '#4b8a44');
      }
    });
  }

  // ---------- actors ----------
  function drawWalker(alpha) {
    if (alpha <= 0.01) return;
    ctx.globalAlpha = alpha * 0.18;
    rect(walker.x, feetY, 9, 1, '#000');
    ctx.globalAlpha = alpha;
    const walking = walker.state === 'walk';
    const frame = walking ? Math.floor(t * 4.5) % 2 : 0;
    const bob = walking && frame === 0 ? -1 : 0;
    const flip = walker.dir < 0;
    const y = feetY - 12 + bob;
    sprite(BODY, walker.x, y, flip);
    sprite(LEGS[frame], walker.x, y + 10, flip);
    ctx.globalAlpha = 1;
  }

  function drawCamp(alpha) {
    if (alpha <= 0.01) return;
    const cx = Math.floor(W * 0.5);
    const base = feetY - 2;
    ctx.globalAlpha = alpha;

    // tent
    const tx = cx - 36, apex = feetY - 14;
    for (let r = 0; r < 14; r++) {
      const w = 2 * r + 2;
      rect(tx - w / 2, apex + r, w / 2, 1, '#c7683a');
      rect(tx, apex + r, w / 2, 1, '#a9532b');
      if (r >= 5) {
        const dw = 2 * Math.max(1, Math.floor((r - 3) * 0.55));
        rect(tx - dw / 2, apex + r, dw, 1, '#2a1a10');
      }
    }
    rect(tx, apex - 2, 1, 2, '#3b2a1a');

    // glow
    const flick = 0.8 + 0.2 * Math.sin(t * 13) + 0.1 * Math.sin(t * 29);
    [[34, '0.05'], [24, '0.07'], [14, '0.09']].forEach(([rx, a]) => {
      ellipse(cx, base + 1, rx, Math.round(rx * 0.4), `rgba(255,150,50,${(a * flick).toFixed(3)})`);
    });

    // stones + logs
    [[-9, 1], [-8, 2], [7, 1], [8, 2], [-6, 3], [5, 3]].forEach(([dx, dy]) => rect(cx + dx, base + dy, 2, 2, '#8a8f98'));
    rect(cx - 5, base, 10, 2, '#5b3a1e');
    rect(cx - 3, base, 6, 1, '#7a4e28');

    // flames
    for (let dx = -4; dx <= 4; dx++) {
      const hmax = 12 - Math.abs(dx) * 2.2;
      const f = Math.sin(t * 11 + dx * 1.9) * 1.4 + Math.sin(t * 23 + dx * 3.1) * 0.9;
      const h = Math.max(2, Math.round(hmax + f));
      rect(cx + dx, base - h, 1, h, '#e5471c');
      if (Math.abs(dx) <= 2 && h - 2 > 0) rect(cx + dx, base - (h - 2), 1, h - 2, '#f7a23a');
      if (Math.abs(dx) <= 1 && h - 5 > 0) rect(cx + dx, base - (h - 5), 1, h - 5, '#ffe58a');
    }
    ctx.globalAlpha = 1;

    // sparks
    sparks.forEach(s => {
      ctx.globalAlpha = Math.max(0, s.life) * alpha;
      rect(s.x, s.y, 1, 1, '#ffd27a');
    });
    ctx.globalAlpha = 1;

    // sleeping character
    const sx = cx + 14, sy = feetY - 4;
    ctx.globalAlpha = alpha * 0.18;
    rect(sx, feetY, 16, 1, '#000');
    ctx.globalAlpha = alpha;
    sprite(SLEEP, sx, sy, false);

    // floating Z
    for (let i = 0; i < 3; i++) {
      const ph = (t * 0.45 + i / 3) % 1;
      const k = 1 + (i % 2);
      ctx.globalAlpha = alpha * (1 - ph);
      const zx = sx + 2 + ph * 12 + i * 2, zy = sy - 4 - ph * 16;
      Z_GLYPH.forEach((row, r) => {
        for (let c = 0; c < row.length; c++) {
          if (row[c] === '#') rect(zx + c * k, zy + r * k, k, k, '#e8f0ff');
        }
      });
    }
    ctx.globalAlpha = 1;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    drawWorld(PAL.day, false);
    if (mix > 0.01) {
      ctx.globalAlpha = mix;
      drawWorld(PAL.night, true);
      ctx.globalAlpha = 1;
    }
    drawWalker(1 - mix);
    drawCamp(mix);
  }

  // ---------- update ----------
  function update(dt) {
    t += dt;
    mix += Math.sign(target - mix) * Math.min(Math.abs(target - mix), dt / 0.9);

    clouds.forEach(c => {
      c.x += c.speed * dt;
      if (c.x > W + 10) c.x = -30;
    });

    // walker
    walker.timer -= dt;
    if (walker.state === 'walk') {
      walker.x += walker.dir * 18 * dt;
      if (walker.x < 8) { walker.x = 8; walker.dir = 1; }
      if (walker.x > W - 18) { walker.x = W - 18; walker.dir = -1; }
      if (walker.timer <= 0) {
        walker.state = 'idle';
        walker.timer = 1 + Math.random() * 1.5;
      }
    } else if (walker.timer <= 0) {
      walker.state = 'walk';
      walker.timer = 2.5 + Math.random() * 4;
      if (Math.random() > 0.5) walker.dir *= -1;
    }

    // sparks
    if (mix > 0.3 && Math.random() < dt * 7) {
      sparks.push({
        x: Math.floor(W * 0.5) + (Math.random() * 4 - 2),
        y: feetY - 14,
        vx: Math.random() * 6 - 3,
        vy: -(8 + Math.random() * 12),
        life: 1,
        decay: 0.5 + Math.random() * 0.6
      });
    }
    sparks.forEach(s => { s.x += s.vx * dt; s.y += s.vy * dt; s.life -= s.decay * dt; });
    sparks = sparks.filter(s => s.life > 0);
  }

  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!document.hidden) {
      update(dt);
      draw();
    }
    requestAnimationFrame(loop);
  }

  // ---------- theme sync ----------
  function syncTheme() {
    target = root.getAttribute('data-theme') === 'dark' ? 1 : 0;
    if (reduceMotion) { mix = target; draw(); }
  }
  new MutationObserver(syncTheme).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

  window.addEventListener('resize', resize);
  resize();
  if (reduceMotion) { draw(); } else { requestAnimationFrame(loop); }

  // ---------- ปุ่ม "ดูฉากเต็มจอ" ----------
  const sceneBtn = document.getElementById('sceneToggle');
  if (sceneBtn) {
    const setView = (on) => {
      document.body.classList.toggle('scene-only', on);
      sceneBtn.setAttribute('aria-pressed', String(on));
    };
    sceneBtn.addEventListener('click', () => setView(!document.body.classList.contains('scene-only')));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setView(false); });
  }
})();
