// Catch the Stars — shared game core.
//
// One prompt built this: a tiny browser game where stars fall from a night
// sky and you slide a basket along the bottom to catch them. The same code
// runs in the browser (game.html) and in Node, where the video render drives
// it frame by frame with an auto-player, so the video shows the real game
// being played — not a mock-up.
//
// Fixed coordinate space: 1080 x 1920 (portrait, matches the video).
// No dependencies, no DOM access here: step() is pure state, draw() takes a
// tiny raster interface the caller provides (canvas 2d in the browser, a
// software raster in the Node render script).

export const W = 1080;
export const H = 1920;

export const BASKET_Y = 1740;
export const BASKET_W = 300;
export const BASKET_H = 64;

// Deterministic RNG (mulberry32) so a seed replays the exact same game.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createGame(seed) {
  const rand = mulberry32(seed);
  // Static background stars, fixed at creation so they never flicker.
  const sky = [];
  for (let i = 0; i < 90; i++) {
    sky.push({
      x: rand() * W,
      y: rand() * 1500,
      r: 1 + rand() * 2.2,
      tw: rand() * Math.PI * 2,
    });
  }
  return {
    seed,
    rand,
    sky,
    time: 0,
    basketX: W / 2,
    basketV: 0,
    stars: [],
    spawnIn: 0.4,
    score: 0,
    caught: 0,
    missed: 0,
    lives: 3,
    over: false,
    overIn: 0,
  };
}

function spawnStar(g) {
  const r = g.rand;
  g.stars.push({
    x: 60 + r() * (W - 120),
    y: -30,
    vy: 340 + r() * 260,
    sway: 30 + r() * 70,
    phase: r() * Math.PI * 2,
    size: 26 + r() * 18,
    spin: r() * Math.PI * 2,
    spinV: (r() - 0.5) * 2.2,
  });
}

// move: -1 (left), 0 (still), +1 (right) — or a target x for the auto-player.
export function stepGame(g, dt, move) {
  if (g.over) {
    g.overIn += dt;
    return;
  }
  g.time += dt;

  // Basket: accelerate toward the move direction, clamp to the walls.
  const target = typeof move === 'number' && Math.abs(move) > 1 ? move : null;
  if (target !== null) {
    const dx = target - g.basketX;
    g.basketV = Math.max(-1400, Math.min(1400, dx * 10));
  } else {
    g.basketV += move * 5200 * dt;
    g.basketV *= Math.pow(0.0001, dt); // friction
    g.basketV = Math.max(-1200, Math.min(1200, g.basketV));
  }
  g.basketX += g.basketV * dt;
  g.basketX = Math.max(BASKET_W / 2, Math.min(W - BASKET_W / 2, g.basketX));

  // Spawn a new star every ~0.55 s, faster as the score grows.
  g.spawnIn -= dt;
  if (g.spawnIn <= 0) {
    spawnStar(g);
    g.spawnIn = Math.max(0.28, 0.55 - g.score * 0.004);
  }

  // Fall, sway, spin; catch or miss at the basket line.
  for (let i = g.stars.length - 1; i >= 0; i--) {
    const s = g.stars[i];
    s.y += s.vy * dt;
    s.phase += dt * 2;
    s.spin += s.spinV * dt;
    const x = s.x + Math.sin(s.phase) * s.sway * 0.4;
    if (s.y >= BASKET_Y - 10 && s.y <= BASKET_Y + BASKET_H) {
      if (Math.abs(x - g.basketX) <= BASKET_W / 2 + s.size * 0.4) {
        g.stars.splice(i, 1);
        g.score += 10;
        g.caught += 1;
        continue;
      }
    }
    if (s.y > H + 40) {
      g.stars.splice(i, 1);
      g.missed += 1;
      g.lives -= 1;
      if (g.lives <= 0) {
        g.over = true;
      }
    }
  }
}

// Auto-player: chase one star at a time and commit to it. Each frame it
// picks the most urgent star the basket can still reach — the one closest to
// the basket line whose x the basket can cover before it arrives — and sticks
// with that star until it is caught or missed, instead of flip-flopping
// between targets every frame.
export function autoMove(g) {
  if (g.target && !g.stars.includes(g.target)) g.target = null;
  if (!g.target) {
    let best = null;
    let bestT = Infinity;
    for (const s of g.stars) {
      if (s.y >= BASKET_Y - 40) continue;
      const tBasket = (BASKET_Y - s.y) / s.vy;
      const tReach = Math.abs(s.x - g.basketX) / 1200;
      if (tReach <= tBasket + 0.15 && tBasket < bestT) {
        best = s;
        bestT = tBasket;
      }
    }
    // Nothing reachable in time: fall back to the lowest star and hope.
    if (!best) {
      for (const s of g.stars) {
        if (s.y < BASKET_Y - 40 && (best === null || s.y > best.y)) best = s;
      }
    }
    g.target = best;
  }
  if (g.target === null) return g.basketX;
  const t = g.target;
  return t.x + Math.sin(t.phase) * t.sway * 0.4;
}

// Restart after game over, keeping the same seed sequence fresh.
export function resetGame(g) {
  const fresh = createGame(g.seed + 7919);
  Object.assign(g, fresh);
}

// Draw the current state through a minimal raster interface:
//   r.rect(x, y, w, h, color)   — filled rectangle
//   r.circle(x, y, radius, color) — filled circle
//   r.star(x, y, size, rot, color) — filled 5-point star
//   r.text(str, x, y, scale, color) — bitmap text, top-left anchored
export function drawGame(g, r) {
  // Night sky.
  r.rect(0, 0, W, H, '#0b1026');
  r.rect(0, 0, W, 900, '#131c44');
  // Moon: one disc, one darker crater so it reads as a moon, not a blob.
  r.circle(880, 260, 92, '#f5f0d8');
  r.circle(850, 235, 26, '#ddd5ac');
  // Static sky stars.
  for (const s of g.sky) {
    const a = 0.45 + 0.4 * Math.sin(g.time * 1.5 + s.tw);
    r.circle(s.x, s.y, s.r, a > 0.7 ? '#ffffff' : '#cdd6ff');
  }
  // Distant hills.
  r.rect(0, 1620, W, 300, '#0e1533');
  r.circle(180, 1660, 260, '#0e1533');
  r.circle(900, 1680, 320, '#0e1533');

  // Falling stars.
  for (const s of g.stars) {
    const x = s.x + Math.sin(s.phase) * s.sway * 0.4;
    r.circle(x, s.y, s.size * 0.95, '#e8a91c');
    r.star(x, s.y, s.size, s.spin, '#ffd75e');
    r.star(x, s.y, s.size * 0.55, -s.spin * 0.7, '#fff3c4');
  }

  // Basket.
  const bx = g.basketX - BASKET_W / 2;
  r.rect(bx, BASKET_Y, BASKET_W, BASKET_H, '#b45a1b');
  r.rect(bx, BASKET_Y, BASKET_W, 14, '#e07b2e');
  r.rect(bx - 12, BASKET_Y - 10, BASKET_W + 24, 16, '#8a4213');

  // HUD.
  r.text('SCORE ' + String(g.score).padStart(4, '0'), 48, 64, 6, '#ffffff');
  let lx = W - 48;
  for (let i = 0; i < 3; i++) {
    const on = i < g.lives;
    r.circle(lx - 34, 96, 20, on ? '#ff5d73' : '#3a4468');
    lx -= 96;
  }
  r.text('CATCH THE STARS', 48, 150, 3, '#9fb2ff');

  if (g.over) {
    r.rect(0, 760, W, 400, '#0b1026');
    r.text('GAME OVER', 300, 830, 10, '#ffd75e');
    r.text('SCORE ' + g.score, 390, 990, 6, '#ffffff');
  }
}
