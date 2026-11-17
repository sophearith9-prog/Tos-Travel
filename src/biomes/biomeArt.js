// Code-drawn pixel art for the biome system. Everything is painted once into canvas
// textures (cached by key) using whole-pixel rects and stepped curves, so it reads as
// pixel art like Level 1 and costs nothing per frame.

export const SKY = { w: 400, h: 225 };
export const FAR = { w: 512, h: 100 };
export const MID = { w: 640, h: 150, base: 140 };
export const NEAR = { w: 512, h: 56, base: 50 };

function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function canvasTexture(scene, key, w, h, draw) {
  if (scene.textures.exists(key)) return key;
  const texture = scene.textures.createCanvas(key, w, h);
  texture.context.imageSmoothingEnabled = false;
  draw(painter(texture.context, w, h), texture);
  texture.refresh();
  texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
  return key;
}

// Pixel drawing helpers. `w*` variants wrap horizontally so tiling layers stay seamless.
function painter(ctx, W, H) {
  const p = {
    W, H, ctx,
    rect(x, y, w, h, c, a = 1) {
      if (w <= 0 || h <= 0) return;
      ctx.globalAlpha = a; ctx.fillStyle = c;
      ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
      ctx.globalAlpha = 1;
    },
    wrect(x, y, w, h, c, a = 1) {
      p.rect(x, y, w, h, c, a);
      if (x < 0) p.rect(x + W, y, w, h, c, a);
      if (x + w > W) p.rect(x - W, y, w, h, c, a);
    },
    disc(cx, cy, r, c, a = 1) {
      for (let dy = -r; dy <= r; dy++) {
        const hw = Math.round(Math.sqrt(Math.max(0, r * r - dy * dy)));
        p.wrect(cx - hw, cy + dy, hw * 2 + 1, 1, c, a);
      }
    },
    oval(cx, cy, rx, ry, c, a = 1) {
      for (let dy = -ry; dy <= ry; dy++) {
        const hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry))));
        p.wrect(cx - hw, cy + dy, hw * 2 + 1, 1, c, a);
      }
    },
    // Stepped triangle from an apex down to a base of width bw.
    spire(cx, top, base, bw, c, step = 2) {
      for (let y = top; y < base; y += step) {
        const hw = Math.max(1, Math.round((bw / 2) * ((y - top) / Math.max(1, base - top))));
        p.wrect(cx - hw, y, hw * 2, step, c);
      }
    },
    // Rounded hill: narrow at the top, full width at the base.
    mound(cx, base, mw, mh, c, step = 2) {
      for (let y = 0; y < mh; y += step) {
        const hw = Math.round((mw / 2) * Math.sqrt(Math.min(1, (y + step) / mh)));
        p.wrect(cx - hw, base - mh + y, hw * 2, step, c);
      }
    },
    // Seamless ridge line: integer wave counts keep the left and right edges matched.
    ridge(base, waves, c, step = 2) {
      for (let x = 0; x < W; x += step) {
        let h = 0;
        for (const [k, amp, phase] of waves) h += amp * Math.sin((Math.PI * 2 * k * x) / W + phase);
        const top = Math.round(base - h);
        p.rect(x, top, step, H - top, c);
      }
    },
    // Draw something twice near the edges so tiled layers do not cut it off.
    wrap(x, width, draw) {
      draw(x);
      if (x - width < 0) draw(x + W);
      if (x + width > W) draw(x - W);
    }
  };
  return p;
}

/* ---------- shared props ---------- */

function palm(p, x, base, h, pal, lean = 1) {
  for (let i = 0; i < h; i += 2) {
    const bend = Math.round(lean * Math.pow(i / h, 2) * 5);
    p.wrect(x + bend, base - i - 2, 2, 2, i % 6 < 2 ? pal.stoneLight : pal.trunk);
  }
  const tx = x + Math.round(lean * 5), ty = base - h;
  for (const [dx, dy] of [[-12, 3], [-9, -4], [-3, -8], [4, -7], [10, -3], [12, 4], [6, 6], [-6, 6]]) {
    for (let s = 1; s <= 5; s++) {
      const fx = tx + (dx * s) / 5, fy = ty + (dy * s) / 5 + (s * s) / 6;
      p.wrect(fx, fy, 3, 2, s > 3 ? pal.mid : pal.dark);
      if (s === 3) p.wrect(fx, fy - 1, 2, 1, pal.light);
    }
  }
  p.disc(tx + 1, ty + 1, 2, pal.trunk);
}

function sugarPalm(p, x, base, h, pal) {
  p.wrect(x, base - h, 2, h, pal.trunk);
  const cy = base - h - 4;
  p.disc(x + 1, cy, 6, pal.dark);
  for (let a = 0; a < 10; a++) {
    const ang = (a / 10) * Math.PI * 2;
    p.wrect(x + 1 + Math.cos(ang) * 8, cy + Math.sin(ang) * 6, 2, 2, pal.mid);
  }
  p.disc(x, cy - 2, 3, pal.mid);
  p.wrect(x - 1, cy - 4, 2, 1, pal.light);
}

function tree(p, x, base, h, pal, wide = 1) {
  p.wrect(x - 1, base - h * 0.45, 3, h * 0.45, pal.trunk);
  const r = Math.round((h * 0.32) * wide);
  p.oval(x, base - h * 0.6, r + 2, Math.round(r * 0.8), pal.dark);
  p.oval(x - r * 0.4, base - h * 0.7, r, Math.round(r * 0.7), pal.mid);
  p.oval(x + r * 0.3, base - h * 0.78, Math.round(r * 0.7), Math.round(r * 0.5), pal.light);
}

function pine(p, x, base, h, pal) {
  p.wrect(x - 1, base - h * 0.25, 2, h * 0.25, pal.trunk);
  for (let tier = 0; tier < 4; tier++) {
    const top = base - h + tier * h * 0.18;
    p.spire(x, top, top + h * 0.32, 6 + tier * 4, tier % 2 ? pal.mid : pal.dark);
  }
  p.wrect(x - 1, base - h, 2, 2, pal.light);
}

function bush(p, x, base, r, pal) {
  p.oval(x, base - r * 0.6, r + 2, Math.round(r * 0.7), pal.dark);
  p.oval(x - 2, base - r * 0.8, r, Math.round(r * 0.55), pal.mid);
  p.wrect(x - r * 0.4, base - r * 1.2, r * 0.6, 1, pal.light);
}

// Khmer roof: stacked tiers with upturned naga finials.
function khmerRoof(p, cx, y, w, tiers, color, trim) {
  for (let t = 0; t < tiers; t++) {
    const tw = w - t * (w / (tiers + 1.5));
    const ty = y - t * 6;
    for (let r = 0; r < 6; r++) p.wrect(cx - tw / 2 + r * 1.2, ty - r, tw - r * 2.4, 1, color);
    p.wrect(cx - tw / 2, ty, tw, 1, trim);
    p.wrect(cx - tw / 2 - 2, ty - 3, 2, 3, trim);
    p.wrect(cx + tw / 2, ty - 3, 2, 3, trim);
  }
  p.wrect(cx - 1, y - tiers * 6 - 8, 2, 8, trim);
}

function stiltHouse(p, x, base, w, pal, roof = pal.roof, posts = 10) {
  for (let px = x + 2; px < x + w; px += 7) p.wrect(px, base - posts, 2, posts, pal.trunk);
  p.wrect(x, base - posts - 14, w, 14, pal.stone);
  for (let row = 0; row < 3; row++) p.wrect(x, base - posts - 12 + row * 4, w, 1, pal.stoneDark);
  p.wrect(x + w / 2 - 3, base - posts - 10, 6, 10, pal.stoneDark);
  for (let r = 0; r < 9; r++) p.wrect(x - 4 + r, base - posts - 14 - r, w + 8 - r * 2, 1, roof);
  p.wrect(x - 4, base - posts - 14, w + 8, 1, pal.accent);
}

// Prasat tower: body plus shrinking tiers and a lotus top.
function prasat(p, cx, base, w, h, stone, light, dark) {
  const bodyH = h * 0.45;
  p.wrect(cx - w / 2, base - bodyH, w, bodyH, stone);
  p.wrect(cx - w / 2, base - bodyH, 2, bodyH, light);
  p.wrect(cx - 2, base - bodyH * 0.7, 4, bodyH * 0.7, dark);
  const tiers = 5;
  for (let t = 0; t < tiers; t++) {
    const tw = w * (1 - (t + 1) / (tiers + 1.5));
    const ty = base - bodyH - (t + 1) * ((h - bodyH) / (tiers + 1));
    p.wrect(cx - tw / 2, ty, tw, (h - bodyH) / (tiers + 1) + 1, stone);
    p.wrect(cx - tw / 2, ty, tw, 1, light);
  }
  p.spire(cx, base - h - 6, base - h + 2, 4, light);
}

function waterBand(p, top, bottom, pal, seed) {
  const rnd = seeded(seed);
  p.rect(0, top, p.W, bottom - top, pal.water);
  p.rect(0, top, p.W, 1, pal.waterLight, 0.7);
  for (let i = 0; i < 46; i++) {
    const x = Math.floor(rnd() * p.W), y = top + 3 + Math.floor(rnd() * (bottom - top - 4));
    p.wrect(x, y, 6 + Math.floor(rnd() * 14), 1, pal.waterLight, 0.55);
  }
}

// Falling water: streaked vertical ribbons with a ragged lip, mist and a foam pool.
function waterfall(p, x, top, base, w, pal) {
  p.rect(x - 3, top - 1, w + 6, base - top + 1, pal.stoneDark);
  for (let i = 0; i < w; i += 2) {
    const lip = (i * 7) % 5;
    const tone = (i / 2) % 3 === 0 ? pal.water : (i / 2) % 3 === 1 ? pal.waterLight : '#f4fbf8';
    p.rect(x + i, top + lip, 2, base - top - lip, tone, 0.95);
  }
  for (let y = top + 6; y < base; y += 7) p.rect(x + ((y * 3) % Math.max(1, w - 6)), y, 4, 2, '#ffffff', 0.5);
  p.oval(x + w / 2, base, Math.round(w * 0.75), 4, '#ffffff', 0.75);
  p.oval(x + w / 2, base - 4, Math.round(w * 0.6), 3, '#ffffff', 0.3);
}

/* ---------- sky ---------- */

export function skyTexture(scene, look) {
  return canvasTexture(scene, `biome-sky-${look.timeKey}`, SKY.w, SKY.h, p => {
    const t = look.time;
    const band = (from, to, y0, y1) => {
      for (let y = y0; y < y1; y += 3) p.rect(0, y, SKY.w, 3, mixHex(from, to, (y - y0) / (y1 - y0)));
    };
    band(t.skyTop, t.skyMid, 0, 105);
    band(t.skyMid, t.skyBottom, 105, SKY.h);
    const rnd = seeded(hashString(look.timeKey));
    if (t.stars) {
      for (let i = 0; i < 70; i++) {
        const x = Math.floor(rnd() * SKY.w), y = Math.floor(rnd() * 120);
        p.rect(x, y, 1, 1, '#fff6d8', 0.4 + rnd() * 0.6);
        if (i % 9 === 0) { p.rect(x - 1, y, 3, 1, '#fff6d8', 0.5); p.rect(x, y - 1, 1, 3, '#fff6d8', 0.5); }
      }
    }
    const orb = t.sun || t.moon;
    if (orb) {
      // Round, glowing orb: soft halo rings, a solid disc and a bright highlight.
      p.disc(orb.x, orb.y, Math.round(orb.r * 3.2), orb.glow, 0.08);
      p.disc(orb.x, orb.y, Math.round(orb.r * 2.2), orb.glow, 0.14);
      p.disc(orb.x, orb.y, Math.round(orb.r * 1.5), orb.glow, 0.28);
      p.disc(orb.x, orb.y, orb.r, orb.color);
      if (t.moon) {
        p.disc(orb.x + 3, orb.y - 2, 2, mixHex(orb.color, '#c8c0a8', 0.5));
        p.disc(orb.x - 3, orb.y + 3, 1, mixHex(orb.color, '#c8c0a8', 0.5));
      } else {
        p.disc(orb.x - Math.round(orb.r * 0.3), orb.y - Math.round(orb.r * 0.3), Math.round(orb.r * 0.4), '#ffffff', 0.55);
      }
    }
    // Pixel clouds with a shaded underside.
    const cloudCount = look.rain ? 9 : look.timeKey.startsWith('night') ? 3 : 6;
    for (let i = 0; i < cloudCount; i++) {
      const cx = Math.floor(rnd() * SKY.w), cy = 18 + Math.floor(rnd() * (look.rain ? 70 : 85));
      const s = 0.7 + rnd() * 0.8;
      p.oval(cx, cy + 3, Math.round(22 * s), Math.round(4 * s), t.cloudShade, 0.9);
      p.oval(cx - 8 * s, cy, Math.round(10 * s), Math.round(6 * s), t.cloud, 0.95);
      p.oval(cx + 5 * s, cy - 2, Math.round(12 * s), Math.round(8 * s), t.cloud, 0.95);
      p.oval(cx + 16 * s, cy + 1, Math.round(8 * s), Math.round(5 * s), t.cloud, 0.95);
    }
    if (look.timeKey.startsWith('sunset') || look.timeKey.startsWith('sunrise')) {
      for (let i = 0; i < 7; i++) {
        const y = 92 + i * 9, x = Math.floor(rnd() * 300);
        p.rect(x, y, 50 + rnd() * 70, 2, t.cloud, 0.55);
        p.rect(x + 12, y + 3, 30 + rnd() * 40, 1, t.cloudShade, 0.6);
      }
    }
  });
}

function mixHex(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = s => Math.round(((pa >> s) & 255) + ((((pb >> s) & 255) - ((pa >> s) & 255)) * t));
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}

/* ---------- far layer (mountains / skyline / horizon) ---------- */

export function farTexture(scene, look) {
  return canvasTexture(scene, `biome-far-${look.biome}-${look.timeKey}`, FAR.w, FAR.h, p => {
    const c = look.far, rnd = seeded(hashString(look.biome));
    const base = FAR.h - 8;
    switch (look.biome) {
      case 'highland-forest':
        p.ridge(base - 44, [[2, 14, 0.4], [5, 7, 1.3], [9, 3, 2]], c.farB);
        p.ridge(base - 24, [[3, 10, 2.1], [7, 5, 0.2], [13, 2, 1]], c.farA);
        for (let i = 0; i < 26; i++) { const x = rnd() * FAR.w; p.wrap(x, 6, xx => pine(p, xx, base - 14 + rnd() * 6, 12 + rnd() * 6, c)); }
        break;
      case 'coast':
        p.ridge(base - 22, [[1, 9, 0.3], [4, 4, 2.2]], c.farB);
        p.rect(0, base - 12, FAR.w, 20, c.water);
        p.rect(0, base - 12, FAR.w, 1, c.waterLight, 0.8);
        for (const [x, w, h] of [[60, 70, 14], [250, 46, 9], [410, 90, 18]]) p.wrap(x, w, xx => p.mound(xx, base - 11, w, h, c.farA));
        break;
      case 'city':
        p.ridge(base - 10, [[2, 4, 1]], c.farB);
        for (let x = 0; x < FAR.w; x += 9 + Math.floor(rnd() * 8)) {
          const w = 8 + Math.floor(rnd() * 12), h = 14 + Math.floor(rnd() * 36);
          p.wrect(x, base - h, w, h + 8, rnd() > 0.5 ? c.farA : c.stoneDark);
          for (let wy = base - h + 3; wy < base - 2; wy += 5) for (let wx = x + 2; wx < x + w - 2; wx += 4) {
            if (rnd() > (look.night ? 0.45 : 0.85)) p.wrect(wx, wy, 2, 2, look.night ? '#ffd98a' : c.stoneLight, look.night ? 0.9 : 0.5);
          }
        }
        break;
      case 'temple-jungle':
        p.ridge(base - 26, [[2, 8, 1.1], [6, 4, 0.5]], c.farB);
        for (const x of [90, 300, 430]) p.wrap(x, 14, xx => prasat(p, xx, base - 14, 12, 30, c.farA, c.stone, c.stoneDark));
        p.ridge(base - 12, [[4, 4, 0.1], [11, 2, 1.7], [23, 1.5, 0.4]], c.farA);
        break;
      default: // rivers, villages and fields: low hills and a far tree line.
        p.ridge(base - 24, [[2, 9, 0.7], [5, 4, 2.4]], c.farB);
        p.ridge(base - 10, [[8, 2, 0.5], [21, 1.5, 1.1]], c.farA);
        for (let i = 0; i < 22; i++) {
          const x = rnd() * FAR.w;
          p.wrap(x, 8, xx => (look.biome === 'rice-fields' ? sugarPalm(p, xx, base - 8, 14 + rnd() * 8, c)
            : p.oval(xx, base - 12, 5 + rnd() * 4, 3 + rnd() * 2, c.farA)));
        }
    }
  });
}

/* ---------- midground: biome filler plus the province landmark ---------- */

export function midTexture(scene, look) {
  return canvasTexture(scene, `biome-mid-${look.landmark}-${look.timeKey}`, MID.w, MID.h, p => {
    const c = look.mid, B = MID.base, rnd = seeded(hashString(look.landmark));
    // Biome filler across the whole (seamless) width.
    switch (look.biome) {
      case 'mekong-river':
      case 'city':
        p.rect(0, B - 32, MID.w, 8, c.grass);
        for (let i = 0; i < 24; i++) p.wrap(rnd() * MID.w, 10, x => p.oval(x, B - 34, 6 + rnd() * 5, 4, c.mid));
        waterBand(p, B - 24, MID.h, c, 11);
        break;
      case 'floating-village':
        p.rect(0, B - 40, MID.w, 4, c.grass);
        waterBand(p, B - 36, MID.h, c, 12);
        break;
      case 'coast':
        waterBand(p, B - 34, MID.h, c, 13);
        break;
      case 'rice-fields':
        for (let y = B - 30, i = 0; y < MID.h; y += 4, i++) {
          p.rect(0, y, MID.w, 4, i % 3 === 2 ? c.water : i % 2 ? c.light : c.grass);
          if (i % 3 === 2) p.rect(0, y, MID.w, 1, c.waterLight, 0.6);
        }
        for (let i = 0; i < 9; i++) p.wrap(rnd() * MID.w, 12, x => sugarPalm(p, x, B - 26, 22 + rnd() * 10, c));
        break;
      case 'highland-forest':
        p.ridge(B - 40, [[3, 10, 0.4], [7, 4, 1.9]], c.mid);
        for (let i = 0; i < 26; i++) p.wrap(rnd() * MID.w, 8, x => pine(p, x, B - 18 + rnd() * 10, 22 + rnd() * 12, c));
        break;
      case 'temple-jungle':
        p.ridge(B - 30, [[4, 6, 1.2], [9, 3, 0.4]], c.dark);
        for (let i = 0; i < 18; i++) p.wrap(rnd() * MID.w, 14, x => tree(p, x, B - 14 + rnd() * 8, 30 + rnd() * 14, c));
        break;
    }
    const draw = LANDMARKS[look.landmark];
    if (draw) draw(p, c, 360, B, look);
  });
}

// Each landmark is drawn around centre x `cx` with its ground at `B`.
const LANDMARKS = {
  'koh-pen-wat-nokor'(p, c, cx, B) {
    // Wat Nokor: laterite and sandstone prasat towers on the far bank.
    p.rect(cx - 70, B - 42, 140, 10, c.stoneDark);
    for (let x = cx - 66; x < cx + 66; x += 9) p.rect(x, B - 40, 4, 8, c.brick);
    prasat(p, cx - 44, B - 32, 18, 44, c.brick, c.brickLight, c.stoneDark);
    prasat(p, cx + 44, B - 32, 18, 44, c.brick, c.brickLight, c.stoneDark);
    prasat(p, cx, B - 32, 26, 66, c.stone, c.stoneLight, c.stoneDark);
    // Koh Pen bamboo bridge: slatted deck on cross-braced poles across the whole river.
    const deck = B - 20;
    for (let x = 0; x < p.W; x += 2) {
      const sag = Math.round(2 * Math.sin((Math.PI * 2 * x) / p.W * 4) + 2);
      p.rect(x, deck + sag, 2, 4, x % 4 ? c.sand : c.stoneLight);
      p.rect(x, deck + sag + 4, 2, 1, c.trunk);
      p.rect(x, deck + sag - 8, 2, 1, c.sand);
      p.rect(x, deck + sag - 4, 2, 1, c.sand, 0.8);
      if (x % 10 === 0) {
        p.rect(x, deck + sag - 8, 1, 8, c.trunk);
        p.rect(x, deck + sag + 4, 2, MID.h - deck, c.trunk);
        p.rect(x - 3, deck + sag + 10, 8, 1, c.trunk);
      }
    }
  },
  'kampi-dolphins'(p, c, cx, B) {
    // Kampi riverside sala on stilts and sandbars in the Mekong (dolphins are animated).
    p.oval(cx - 120, B - 18, 34, 3, c.sand);
    p.oval(cx + 150, B - 10, 46, 3, c.sand);
    for (let x = cx - 26; x <= cx + 26; x += 13) p.rect(x, B - 30, 2, 22, c.trunk);
    p.rect(cx - 30, B - 32, 62, 4, c.trunk);
    p.rect(cx - 26, B - 44, 54, 12, c.stoneLight);
    khmerRoof(p, cx + 1, B - 44, 66, 2, c.roof, c.accent);
    p.rect(cx + 40, B - 31, 50, 2, c.trunk);
    for (let x = cx + 42; x < cx + 90; x += 8) p.rect(x, B - 31, 1, 20, c.trunk);
  },
  'bousra-falls'(p, c, cx, B) {
    // Bousra: a wide two-tier waterfall in a red-earth cliff, framed by rolling hills.
    p.mound(cx - 150, B - 20, 180, 46, c.grass);
    p.mound(cx + 170, B - 18, 200, 40, c.light);
    // Stepped red-earth cliff with jungle on its shoulders.
    p.mound(cx, B - 16, 190, 84, c.ground);
    p.mound(cx, B - 16, 150, 84, mixHex(c.ground, '#000000', 0.12));
    for (const [dx, y] of [[-70, 54], [62, 50], [-40, 80], [44, 78]]) p.oval(cx + dx, B - y, 16, 6, c.mid);
    p.rect(cx - 46, B - 58, 92, 4, c.grass);
    waterfall(p, cx - 22, B - 84, B - 56, 44, c);
    waterfall(p, cx - 34, B - 54, B - 16, 68, c);
    p.oval(cx, B - 14, 62, 5, c.water);
    for (const x of [cx - 92, cx + 88, cx + 104]) pine(p, x, B - 18, 40, c);
  },
  'rubber-plantation'(p, c, cx, B) {
    // Straight rows of rubber trees with latex cups, and a small village wat.
    for (let row = 0; row < 2; row++) {
      for (let x = row * 9; x < p.W; x += 18) {
        const y = B - 22 + row * 8, h = 34 - row * 4;
        p.wrect(x, y - h, 3, h, mixHex(c.trunk, c.stone, 0.45));
        p.wrect(x + 2, y - h, 1, h, mixHex(c.trunk, '#000000', 0.2));
        p.wrect(x, y - h * 0.5, 3, 1, c.stoneLight);
        p.wrect(x + 3, y - h * 0.45, 2, 2, '#f4f0e0');
        p.wrap(x, 12, xx => p.oval(xx + 1, y - h - 6, 11, 7, row ? c.mid : c.dark));
      }
    }
    p.rect(cx - 24, B - 46, 48, 22, c.stoneLight);
    khmerRoof(p, cx, B - 46, 64, 3, c.roof, c.accent);
    p.rect(cx - 5, B - 40, 10, 16, c.stoneDark);
  },
  'bavet-gate'(p, c, cx, B) {
    // A Khmer gateway arch over the border road, between paddies and sugar palms.
    p.rect(cx - 50, B - 60, 12, 40, c.stoneLight);
    p.rect(cx + 38, B - 60, 12, 40, c.stoneLight);
    p.rect(cx - 56, B - 66, 112, 8, c.stone);
    khmerRoof(p, cx, B - 66, 100, 3, c.roof, c.accent);
    p.rect(cx - 38, B - 24, 76, 4, c.stoneDark);
    for (const x of [cx - 90, cx + 92, cx + 130]) sugarPalm(p, x, B - 22, 34, c);
  },
  'ba-phnom'(p, c, cx, B) {
    // Ba Phnom hill with its pagoda, above a lotus lake.
    p.mound(cx, B - 22, 220, 62, c.mid);
    p.mound(cx, B - 22, 160, 50, c.grass);
    p.rect(cx - 16, B - 86, 32, 14, c.stoneLight);
    khmerRoof(p, cx, B - 86, 46, 3, c.roof, c.accent);
    for (let s = 0; s < 6; s++) p.rect(cx - 4 + s * 3, B - 72 + s * 8, 6, 2, c.stone);
    p.rect(0, B - 22, p.W, 10, c.water);
    for (let i = 0; i < 26; i++) {
      const x = (i * 47) % p.W, y = B - 20 + (i % 3) * 3;
      p.rect(x, y, 5, 2, c.dark);
      if (i % 2) { p.rect(x + 1, y - 3, 3, 3, '#f2a6b6'); p.rect(x + 2, y - 4, 1, 1, '#fff0f4'); }
    }
  },
  'silk-island'(p, c, cx, B) {
    // Koh Oknha Tei: weavers' stilt houses with bright silk drying on lines.
    const silks = ['#d9476a', '#e8b23c', '#4f8fd4', '#8a4fd0', '#e86a3c'];
    for (let i = 0; i < 4; i++) {
      const x = cx - 150 + i * 80;
      stiltHouse(p, x, B - 24, 40, c, i % 2 ? c.roof : c.brick, 16);
      p.rect(x + 42, B - 48, 30, 1, c.trunk);
      for (let s = 0; s < 4; s++) p.rect(x + 44 + s * 7, B - 47, 5, 10 + (s % 2) * 4, silks[(i + s) % silks.length]);
    }
  },
  'royal-palace'(p, c, cx, B, look) {
    // Royal Palace: golden tiered throne hall and spire; Wat Phnom stupa on its hill.
    p.rect(cx - 110, B - 36, 220, 12, c.stoneLight);
    for (let x = cx - 108; x < cx + 108; x += 10) p.rect(x, B - 34, 5, 8, c.stoneDark);
    p.rect(cx - 50, B - 60, 100, 26, c.stoneLight);
    for (let x = cx - 46; x < cx + 46; x += 8) p.rect(x, B - 56, 3, 18, c.stoneDark);
    khmerRoof(p, cx, B - 60, 120, 4, c.roof, c.accent);
    p.spire(cx, B - 120, B - 84, 10, c.accent);
    for (const dx of [-80, 80]) { p.rect(cx + dx - 14, B - 50, 28, 14, c.stoneLight); khmerRoof(p, cx + dx, B - 50, 40, 2, c.roof, c.accent); }
    p.mound(cx + 210, B - 24, 90, 26, c.mid);
    p.rect(cx + 202, B - 62, 16, 14, c.stoneLight);
    p.spire(cx + 210, B - 84, B - 60, 16, c.stoneLight);
    // Riverfront lamps.
    for (let x = 6; x < p.W; x += 34) {
      p.rect(x, B - 30, 1, 8, c.stoneDark);
      p.rect(x - 1, B - 33, 3, 3, look.night ? '#ffe3a0' : c.stoneLight);
      if (look.night) p.disc(x, B - 32, 4, '#ffd27a', 0.25);
    }
  },
  'phnom-da'(p, c, cx, B) {
    // Phnom Da: a tall laterite tower crowning a small hill above flooded fields.
    p.mound(cx, B - 18, 200, 44, c.mid);
    p.mound(cx, B - 18, 130, 36, c.grass);
    p.rect(cx - 20, B - 66, 40, 12, c.brick);
    prasat(p, cx, B - 62, 24, 64, c.brick, c.brickLight, c.stoneDark);
    for (let y = B - 16; y < p.H; y += 4) p.rect(0, y, p.W, 2, (y / 4) % 2 ? c.water : c.grass, 0.85);
  },
  'kep-crab-market'(p, c, cx, B) {
    // Kep crab market: striped stalls on stilts over the water, and the giant crab statue.
    for (let i = 0; i < 4; i++) {
      const x = cx - 150 + i * 46;
      for (let px = x; px <= x + 34; px += 17) p.rect(px, B - 34, 2, 30, c.trunk);
      p.rect(x - 2, B - 36, 40, 3, c.trunk);
      p.rect(x, B - 50, 36, 14, c.stoneLight);
      for (let s = 0; s < 36; s += 6) p.rect(x + s, B - 56, 3, 6, i % 2 ? '#d94f4f' : '#3f86c8');
      p.rect(x, B - 56, 36, 1, '#ffffff');
      for (let b = 0; b < 3; b++) p.rect(x + 6 + b * 10, B - 42, 6, 4, '#c8743c');
    }
    // Crab statue on a rock.
    const sx = cx + 120;
    p.mound(sx, B - 12, 40, 14, c.stoneDark);
    p.oval(sx, B - 30, 14, 8, '#3f6fb4');
    p.oval(sx, B - 32, 10, 5, '#5a8ad0');
    for (const side of [-1, 1]) {
      p.rect(sx + side * 14, B - 40, 3, 10, '#3f6fb4');
      p.oval(sx + side * 18, B - 44, 5, 4, '#3f6fb4');
      for (let l = 0; l < 3; l++) p.rect(sx + side * (10 + l * 3), B - 24 + l, 4, 1, '#2f5a94');
    }
    p.rect(sx - 4, B - 39, 2, 3, '#ffffff'); p.rect(sx + 3, B - 39, 2, 3, '#ffffff');
  },
  'bokor-river'(p, c, cx, B) {
    // Bokor mountain behind the Kampot river, its old hill station on the summit.
    p.mound(cx - 40, B - 30, 360, 86, c.dark);
    p.mound(cx - 60, B - 30, 240, 70, c.mid);
    p.rect(cx - 52, B - 106, 24, 10, c.stoneLight);
    p.rect(cx - 48, B - 112, 16, 6, c.stoneLight);
    for (let i = 0; i < 4; i++) p.rect(0, B - 70 + i * 9, p.W, 3, c.sand, 0.18);
    for (let x = 0; x < p.W; x += 60) { p.rect(x, B - 32, 20, 2, c.trunk); p.rect(x + 6, B - 38, 1, 6, c.trunk); }
  },
  'koh-rong'(p, c, cx, B) {
    // Koh Rong islands: white beaches, palms and a wooden pier.
    for (const [x, w, h] of [[cx - 120, 150, 34], [cx + 130, 110, 26]]) {
      p.mound(x, B - 30, w, h, c.mid);
      p.oval(x, B - 31, w / 2 + 8, 3, '#fbf3dc');
      for (let i = -1; i <= 1; i++) palm(p, x + i * w / 4, B - 32, 22 + (i + 1) * 3, c, i || 1);
    }
    p.rect(cx - 10, B - 26, 90, 3, c.trunk);
    for (let x = cx - 8; x < cx + 80; x += 10) p.rect(x, B - 24, 2, 14, c.trunk);
  },
  'mangrove-tatai'(p, c, cx, B) {
    // Mangrove forest standing on arched roots, with Tatai falls in the hills behind.
    p.mound(cx + 40, B - 34, 260, 60, c.dark);
    waterfall(p, cx + 30, B - 88, B - 36, 22, c);
    for (let x = 0; x < p.W; x += 22) {
      const h = 18 + ((x * 7) % 9);
      for (const dx of [-6, -2, 3, 7]) p.wrect(x + dx, B - 30, 1, 10, c.trunk);
      p.wrect(x - 6, B - 31, 14, 2, c.trunk);
      p.wrap(x, 14, xx => p.oval(xx, B - 31 - h * 0.6, 12, Math.round(h * 0.45), x % 44 ? c.mid : c.dark));
    }
    p.rect(cx - 90, B - 24, 180, 2, c.sand);
    for (let x = cx - 88; x < cx + 90; x += 9) p.rect(x, B - 22, 1, 8, c.trunk);
  },
  'phnom-yat'(p, c, cx, B) {
    // Phnom Yat: a pagoda and stupa on the hilltop, above gem-mining terraces.
    p.mound(cx, B - 18, 260, 70, c.mid);
    for (let t = 0; t < 5; t++) p.rect(cx - 120 + t * 10, B - 22 - t * 8, 70 - t * 6, 3, t % 2 ? c.ground : c.sand);
    p.rect(cx + 6, B - 96, 30, 12, c.stoneLight);
    khmerRoof(p, cx + 21, B - 96, 44, 3, c.roof, c.accent);
    p.rect(cx - 20, B - 92, 10, 8, c.stoneLight);
    p.spire(cx - 15, B - 108, B - 92, 10, c.accent);
  },
  'phnom-sampov'(p, c, cx, B) {
    // Phnom Sampov with its cave mouth and hilltop wat; the bamboo train in front.
    p.mound(cx, B - 22, 240, 80, c.stoneDark);
    p.mound(cx - 10, B - 22, 180, 66, c.mid);
    p.oval(cx + 28, B - 64, 10, 7, '#2a2420');
    p.rect(cx - 24, B - 98, 32, 12, c.stoneLight);
    khmerRoof(p, cx - 8, B - 98, 44, 3, c.roof, c.accent);
    p.rect(0, B - 20, p.W, 1, c.stoneDark);
    p.rect(0, B - 17, p.W, 1, c.stoneDark);
    for (let x = 0; x < p.W; x += 6) p.rect(x, B - 20, 2, 4, c.trunk);
    const tx = cx - 150;
    p.rect(tx, B - 24, 34, 3, c.sand);
    p.rect(tx + 4, B - 34, 2, 10, c.trunk); p.rect(tx + 28, B - 34, 2, 10, c.trunk);
    p.rect(tx + 2, B - 36, 30, 2, c.roof);
    p.disc(tx + 6, B - 20, 2, c.stoneDark); p.disc(tx + 28, B - 20, 2, c.stoneDark);
  },
  'cardamom-falls'(p, c, cx, B) {
    // Cardamom ridges with a tall waterfall, and a marble carver's hut with white statues.
    p.mound(cx + 60, B - 30, 300, 90, c.dark);
    waterfall(p, cx + 50, B - 108, B - 30, 18, c);
    p.rect(cx - 140, B - 44, 44, 18, c.stone);
    khmerRoof(p, cx - 118, B - 44, 56, 1, c.roof, c.accent);
    for (let i = 0; i < 4; i++) {
      const x = cx - 86 + i * 10;
      p.rect(x, B - 36 + (i % 2) * 2, 5, 10 - (i % 2) * 2, '#f2f0ea');
      p.disc(x + 2, B - 38 + (i % 2) * 2, 2, '#f2f0ea');
    }
  },
  'kirirom-pines'(p, c, cx, B) {
    // Kirirom: a pine ridge with a wooden lookout tower on the crest.
    p.mound(cx, B - 24, 300, 70, c.mid);
    for (let i = 0; i < 14; i++) pine(p, cx - 130 + i * 20, B - 30 - Math.round(Math.sin(i / 2) * 18), 30 + (i % 3) * 6, c);
    const tx = cx + 10, ty = B - 94;
    for (const dx of [-8, 8]) p.rect(tx + dx, ty, 2, 34, c.trunk);
    for (let y = ty + 6; y < ty + 34; y += 8) p.rect(tx - 8, y, 18, 1, c.trunk);
    p.rect(tx - 12, ty - 4, 26, 4, c.trunk);
    for (let r = 0; r < 6; r++) p.rect(tx - 12 + r, ty - 10 + r, 26 - r * 2, 1, c.roof);
  },
  'tonle-sap-village'(p, c, cx, B) {
    // Floating houses on pontoons, with stacked clay pots on the bank (Kampong Chhnang).
    for (let i = 0; i < 5; i++) {
      const x = cx - 220 + i * 92;
      p.rect(x - 2, B - 30, 44, 4, c.stoneDark);
      p.rect(x, B - 46, 40, 16, i % 2 ? c.stone : c.stoneLight);
      p.rect(x + 16, B - 42, 8, 12, c.stoneDark);
      for (let r = 0; r < 8; r++) p.rect(x - 4 + r, B - 46 - r, 48 - r * 2, 1, i % 2 ? c.roof : c.brick);
      p.rect(x - 2, B - 27, 44, 1, c.waterLight, 0.7);
    }
    for (let i = 0; i < 9; i++) {
      const x = cx + 230 + (i % 3) * 10, y = B - 40 - Math.floor(i / 3) * 8;
      p.oval(x, y, 5, 4, '#b8673c'); p.rect(x - 2, y - 5, 4, 2, '#8a4a2c');
    }
  },
  'sambor-prei-kuk'(p, c, cx, B) {
    // Sambor Prei Kuk: octagonal brick towers, one gripped by a strangler fig.
    for (const [dx, h, w] of [[-90, 54, 22], [0, 70, 28], [90, 50, 20]]) {
      const x = cx + dx;
      p.rect(x - w / 2, B - 22 - h * 0.55, w, h * 0.55, c.brick);
      for (let y = B - 22 - h * 0.55; y < B - 22; y += 4) p.rect(x - w / 2, y, w, 1, c.brickLight, 0.5);
      p.rect(x - 3, B - 22 - h * 0.4, 6, h * 0.4, c.stoneDark);
      for (let t = 0; t < 3; t++) p.rect(x - w / 2 + 3 + t * 2, B - 22 - h * 0.55 - (t + 1) * 6, w - 6 - t * 4, 6, c.brick);
      p.rect(x - 2, B - 22 - h, 4, h * 0.2, c.brickLight);
    }
    tree(p, cx + 100, B - 22, 64, c, 1.1);
    for (let i = 0; i < 5; i++) p.rect(cx + 82 + i * 4, B - 52, 1, 30, c.trunk);
  }
};

/* ---------- near foliage strip ---------- */

export function nearTexture(scene, look) {
  return canvasTexture(scene, `biome-near-${look.biome}-${look.timeKey}`, NEAR.w, NEAR.h, p => {
    const c = look.near, B = NEAR.base, rnd = seeded(hashString(`${look.biome}-near`));
    if (look.biome === 'city') {
      p.rect(0, B - 8, NEAR.w, 14, c.stoneDark);
      p.rect(0, B - 9, NEAR.w, 1, c.stoneLight);
      for (let x = 8; x < NEAR.w; x += 64) {
        p.rect(x, B - 34, 2, 26, c.dark);
        p.rect(x - 3, B - 37, 8, 3, c.dark);
        p.rect(x - 1, B - 35, 4, 2, look.night ? '#ffe2a0' : c.stoneLight);
        if (look.night) p.disc(x + 1, B - 34, 6, '#ffd27a', 0.22);
        p.wrap(x + 30, 12, xx => bush(p, xx, B - 6, 8, c));
      }
      return;
    }
    for (let i = 0; i < 30; i++) p.wrap(rnd() * NEAR.w, 14, x => bush(p, x, B, 7 + rnd() * 7, c));
    if (look.biome === 'mekong-river' || look.biome === 'floating-village') {
      for (let i = 0; i < 70; i++) {
        const x = rnd() * NEAR.w, h = 10 + rnd() * 16;
        p.wrect(x, B - h, 1, h, i % 3 ? c.mid : c.light);
        if (i % 5 === 0) p.wrect(x - 1, B - h - 3, 3, 4, c.trunk);
      }
    } else if (look.biome === 'coast') {
      for (let i = 0; i < 12; i++) p.wrap(rnd() * NEAR.w, 8, x => p.mound(x, B, 12 + rnd() * 10, 6 + rnd() * 4, c.stoneDark));
      for (let i = 0; i < 40; i++) { const x = rnd() * NEAR.w; p.wrect(x, B - 8, 1, 8, c.light); p.wrect(x + 2, B - 6, 1, 6, c.mid); }
    } else if (look.biome === 'rice-fields') {
      for (let i = 0; i < 90; i++) { const x = rnd() * NEAR.w; p.wrect(x, B - 9 - rnd() * 5, 1, 12, i % 2 ? c.light : c.grass); }
    } else {
      // Banana leaves and ferns for jungle and highland edges.
      for (let i = 0; i < 16; i++) {
        const x = rnd() * NEAR.w;
        p.wrap(x, 14, xx => {
          for (let s = 0; s < 6; s++) { p.wrect(xx + s * 2, B - 14 - s * 2, 6, 2, c.mid); p.wrect(xx - s * 2, B - 12 - s * 2, 6, 2, c.dark); }
          p.wrect(xx, B - 14, 1, 14, c.trunk);
        });
      }
    }
  });
}

/* ---------- underlay below the horizon (hand-made layouts with valleys and pools) ---------- */

export const UNDER = { w: 128, h: 64 };

// Dense, dark forest floor that tiles in both directions, so deep valleys and pools in
// hand-made stages show foliage instead of open sky below the horizon.
export function underTexture(scene, look) {
  return canvasTexture(scene, `biome-under-${look.biome}-${look.timeKey}`, UNDER.w, UNDER.h, p => {
    const c = look.near, rnd = seeded(hashString(`${look.biome}-under`));
    const base = mixHex(c.dark, '#0c120e', 0.35);
    p.rect(0, 0, UNDER.w, UNDER.h, base);
    for (let i = 0; i < 5; i++) { const x = Math.floor(rnd() * UNDER.w); p.wrect(x, 0, 3, UNDER.h, mixHex(c.trunk, '#000000', 0.35)); }
    for (let i = 0; i < 26; i++) {
      const x = rnd() * UNDER.w, y = 9 + rnd() * (UNDER.h - 18), r = 4 + Math.floor(rnd() * 6);
      p.oval(x, y, r + 2, Math.round(r * 0.7), mixHex(c.dark, '#000000', 0.15));
      p.oval(x - 1, y - 1, r, Math.round(r * 0.55), mixHex(c.mid, c.dark, 0.45));
      p.wrect(x - r * 0.4, y - r * 0.6, r * 0.6, 1, mixHex(c.light, c.dark, 0.5));
    }
  });
}

/* ---------- sprites for ambient life and ground props ---------- */

function frames(texture, count, fw, fh) {
  for (let i = 0; i < count; i++) texture.add(i, 0, i * fw, 0, fw, fh);
}

export function ambientTextures(scene, look) {
  const c = look.near;
  const keys = {};
  keys.bird = canvasTexture(scene, 'ambient-bird', 18, 5, (p, t) => {
    const ink = '#2a2622';
    p.rect(0, 0, 2, 1, ink); p.rect(2, 1, 2, 1, ink); p.rect(4, 2, 1, 1, ink); p.rect(5, 1, 2, 1, ink); p.rect(7, 0, 2, 1, ink);
    p.rect(9, 3, 2, 1, ink); p.rect(11, 2, 2, 1, ink); p.rect(13, 2, 1, 1, ink); p.rect(14, 2, 2, 1, ink); p.rect(16, 3, 2, 1, ink);
    frames(t, 2, 9, 5);
  });
  keys.butterfly = canvasTexture(scene, 'ambient-butterfly', 14, 5, (p, t) => {
    for (const [ox, wing] of [[0, 3], [7, 1]]) {
      p.rect(ox + 3, 1, 1, 3, '#2a1a10');
      p.rect(ox + 3 - wing, 0, wing, 3, '#f2b03c'); p.rect(ox + 4, 0, wing, 3, '#f2b03c');
      p.rect(ox + 3 - wing, 3, wing, 1, '#e86a3c'); p.rect(ox + 4, 3, wing, 1, '#e86a3c');
    }
    frames(t, 2, 7, 5);
  });
  keys.bat = canvasTexture(scene, 'ambient-bat', 14, 4, (p, t) => {
    const ink = '#1c1820';
    p.rect(3, 1, 1, 2, ink); p.rect(0, 0, 3, 1, ink); p.rect(4, 0, 3, 1, ink);
    p.rect(10, 1, 1, 2, ink); p.rect(7, 2, 3, 1, ink); p.rect(11, 2, 3, 1, ink);
    frames(t, 2, 7, 4);
  });
  keys.boat = canvasTexture(scene, 'ambient-boat', 32, 10, p => {
    p.rect(2, 6, 28, 3, '#5a3a24'); p.rect(0, 5, 3, 2, '#5a3a24'); p.rect(29, 4, 3, 3, '#5a3a24');
    p.rect(3, 6, 26, 1, '#c8a060');
    p.rect(10, 1, 12, 1, '#b0603e'); p.rect(11, 2, 1, 4, '#3a2a1a'); p.rect(20, 2, 1, 4, '#3a2a1a');
    p.rect(14, 3, 2, 3, '#2a2a3a'); p.rect(14, 2, 2, 1, '#d8a878');
  });
  keys.dolphin = canvasTexture(scene, 'ambient-dolphin', 16, 8, p => {
    const g = '#7f939a', l = '#b8c8cc';
    p.rect(2, 5, 3, 2, g); p.rect(4, 3, 4, 3, g); p.rect(8, 2, 4, 3, g); p.rect(12, 3, 3, 2, g);
    p.rect(8, 0, 2, 2, g); p.rect(5, 5, 6, 1, l); p.rect(0, 6, 2, 1, g); p.rect(0, 4, 1, 2, g);
  });
  keys.drop = canvasTexture(scene, 'ambient-raindrop', 1, 6, p => {
    p.rect(0, 0, 1, 2, '#ffffff', 0.35); p.rect(0, 2, 1, 4, '#dceaf4', 0.8);
  });
  keys.mist = canvasTexture(scene, 'ambient-mist', 256, 24, p => {
    for (let i = 0; i < 9; i++) p.wrap(i * 29 + 10, 40, x => p.oval(x, 12 + (i % 3) * 3 - 3, 34, 5, '#ffffff', 0.14));
  });
  keys.shimmer = canvasTexture(scene, 'ambient-shimmer', 128, 16, p => {
    const rnd = seeded(7);
    for (let i = 0; i < 14; i++) p.wrect(rnd() * 128, Math.floor(rnd() * 16), 4 + rnd() * 8, 1, '#ffffff', 0.6);
  });
  keys.swayer = canvasTexture(scene, `ambient-swayer-${look.biome}-${look.timeKey}`, 40, 64, p => {
    if (look.biome === 'highland-forest') pine(p, 20, 64, 58, c);
    else if (look.biome === 'rice-fields' || look.biome === 'temple-jungle') sugarPalm(p, 19, 64, 50, c);
    else palm(p, 14, 64, 48, c, 1);
  });
  return keys;
}

// Small props that sit on the walkable ground (world texels, no physics).
export function propTextures(scene, look) {
  const c = look.palette;
  const k = n => `prop-${look.biome}-${look.timeKey}-${n}`;
  const list = [
    canvasTexture(scene, k('tuft'), 10, 7, p => { for (let i = 0; i < 5; i++) p.rect(1 + i * 2, 7 - (3 + (i % 3) * 2), 1, 3 + (i % 3) * 2, i % 2 ? c.light : c.mid); }),
    canvasTexture(scene, k('flower'), 9, 9, p => {
      p.rect(4, 4, 1, 5, c.mid); p.rect(2, 6, 2, 1, c.light);
      const petal = look.biome === 'coast' ? '#ffffff' : look.biome === 'rice-fields' ? '#f2d24a' : '#f28aa6';
      p.rect(3, 1, 3, 3, petal); p.rect(4, 0, 1, 5, petal); p.rect(2, 2, 5, 1, petal); p.rect(4, 2, 1, 1, '#ffe27a');
    }),
    canvasTexture(scene, k('rock'), 10, 6, p => { p.oval(5, 4, 4, 2, c.stoneDark); p.oval(4, 3, 3, 2, c.stone); p.rect(3, 2, 2, 1, c.stoneLight); })
  ];
  const special = {
    'rice-fields': p => { for (let i = 0; i < 4; i++) p.rect(1 + i * 3, 3, 1, 7, c.light), p.rect(i * 3, 2, 3, 1, c.grass); },
    coast: p => { p.oval(3, 7, 3, 2, '#f2e2c8'); p.rect(2, 5, 3, 1, '#d8b898'); p.rect(8, 6, 3, 1, '#e8765a'); p.rect(9, 5, 1, 3, '#e8765a'); },
    'highland-forest': p => { for (let s = 0; s < 4; s++) { p.rect(5 + s, 8 - s * 2, 4, 1, c.mid); p.rect(5 - s - 3, 8 - s * 2, 4, 1, c.dark); } },
    'temple-jungle': p => { p.rect(1, 4, 10, 5, c.stoneDark); p.rect(1, 4, 10, 1, c.stoneLight); p.rect(7, 1, 3, 3, c.mid); },
    'mekong-river': p => { for (let i = 0; i < 4; i++) p.rect(2 + i * 2, 1 + (i % 2) * 2, 1, 9, c.mid); p.rect(5, 0, 2, 3, c.trunk); },
    'floating-village': p => { p.oval(5, 7, 4, 3, '#b8673c'); p.rect(3, 3, 4, 1, '#8a4a2c'); },
    city: p => { p.rect(3, 2, 5, 8, c.stoneDark); p.rect(3, 2, 5, 1, c.stoneLight); p.oval(5, 1, 3, 2, c.mid); }
  }[look.biome];
  if (special) list.push(canvasTexture(scene, k('special'), 12, 10, special));
  return list;
}
