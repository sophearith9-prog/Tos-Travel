import { bakeGraphics } from './bakeGraphics.js';

// Make floor gaps readable on busy backgrounds: a pale stone lip on the edge blocks,
// a darkening shaft, and pixel spikes at the bottom. Works on any tile-based stage by
// scanning the Platforms layer, so generated and Tiled maps are both covered.
// Each gap is baked once into a texture (no per-frame Graphics cost).

const LIP = 0xf3dfa2, LIP_SHADOW = 0x6b4a2b, FACE = 0xe2be78;
const SHAFT = 0x0b0810, SPIKE = 0xd9d4c3, SPIKE_DARK = 0x3a3330, SPIKE_TIP = 0xfff7dc;

function solid(layer, x, y) {
  return !!layer.getTileAt(x, y)?.collides;
}

// Top row of the solid run that reaches the bottom of the map in this column, or -1.
function groundTop(layer, x, height) {
  if (!solid(layer, x, height - 1)) return -1;
  let y = height - 1;
  while (y > 0 && solid(layer, x, y - 1)) y--;
  return y;
}

export function findFloorGaps(scene) {
  const layer = scene.groundLayer, map = scene.map;
  const gaps = [];
  let start = -1;
  for (let x = 0; x <= map.width; x++) {
    const open = x < map.width && groundTop(layer, x, map.height) < 0;
    if (open && start < 0) start = x;
    if (!open && start >= 0) {
      // Ignore openings at the very edges of the map; those are not jumpable pits.
      if (start > 0 && x < map.width) gaps.push({ from: start, to: x - 1 });
      start = -1;
    }
  }
  return gaps;
}

function hasWater(scene, gap) {
  const water = scene.map.getLayer('Water')?.tilemapLayer;
  if (!water) return false;
  for (let x = gap.from; x <= gap.to; x++) {
    for (let y = 0; y < scene.map.height; y++) if (water.getTileAt(x, y)) return true;
  }
  return false;
}

function drawGap(scene, gap, g, lipArt) {
  const { tileWidth: tw, tileHeight: th, height } = scene.map;
  const layer = scene.groundLayer;
  const leftTop = groundTop(layer, gap.from - 1, height);
  const rightTop = groundTop(layer, gap.to + 1, height);
  const left = gap.from * tw, right = (gap.to + 1) * tw, bottom = height * th;
  const top = Math.min(leftTop, rightTop) * th;
  const water = hasWater(scene, gap);

  if (!water) {
    // Stepped shaft: each band darker than the last, so the hole reads as depth.
    const bands = 5, bandHeight = (bottom - top) / bands;
    for (let i = 0; i < bands; i++) {
      g.fillStyle(SHAFT, 0.3 + i * 0.14).fillRect(left, top + i * bandHeight, right - left, bandHeight + 1);
    }
    // Pixel spikes along the floor of the pit.
    for (let x = left + 1; x + 6 <= right; x += 6) {
      g.fillStyle(SPIKE_DARK, 1).fillTriangle(x - 1, bottom, x + 7, bottom, x + 3, bottom - 12);
      g.fillStyle(SPIKE, 1).fillTriangle(x, bottom, x + 6, bottom, x + 3, bottom - 10);
      g.fillStyle(SPIKE_TIP, 1).fillRect(x + 2, bottom - 9, 2, 3);
    }
  }

  // Pale lip on the top edge and inner face of each edge block.
  const lip = (column, topRow, side) => {
    if (topRow < 0) return;
    const x = column * tw, y = topRow * th;
    const faceX = side < 0 ? x + tw - 3 : x;
    lipArt.fillStyle(LIP, 1).fillRect(x, y - 1, tw, 3);
    lipArt.fillStyle(LIP_SHADOW, 0.9).fillRect(x, y + 2, tw, 1);
    lipArt.fillStyle(FACE, 0.95).fillRect(faceX, y - 1, 3, bottom - y + 1);
    lipArt.fillStyle(LIP_SHADOW, 0.85).fillRect(side < 0 ? faceX + 3 : faceX - 1, y, 1, bottom - y);
    // Two warning studs on the lip.
    lipArt.fillStyle(LIP_SHADOW, 1).fillRect(x + 4, y, 2, 1).fillRect(x + 11, y, 2, 1);
  };
  lip(gap.from - 1, leftTop, -1);
  lip(gap.to + 1, rightTop, 1);
  return { left: left - tw, top: top - 4, width: right - left + tw * 2, height: bottom - top + 6 };
}

// Small wooden "!" sign standing on the ground a few tiles before a gap.
function addWarningSign(scene, gap, resolution, index) {
  const { tileWidth: tw, tileHeight: th, height } = scene.map;
  const column = Math.max(1, gap.from - 4);
  const topRow = groundTop(scene.groundLayer, column, height);
  if (topRow < 0) return;
  const g = scene.add.graphics().setDepth(1);
  const cx = column * tw + tw / 2, base = topRow * th;
  g.fillStyle(0x3d2716, 1).fillRect(cx - 2, base - 22, 4, 22);
  g.fillStyle(0x2a1a10, 1).fillRect(cx - 11, base - 36, 22, 17);
  g.fillStyle(0xe2b45c, 1).fillRect(cx - 10, base - 35, 20, 15);
  g.fillStyle(0xb88437, 1).fillRect(cx - 10, base - 22, 20, 2);
  g.fillStyle(0x2a1a10, 1).fillRect(cx - 1, base - 33, 3, 7).fillRect(cx - 1, base - 25, 3, 2);
  bakeGraphics(scene, g, `pit-sign-${scene.currentLevel}-${index}`,
    { x: cx - 12, y: base - 37, width: 24, height: 38 }, resolution);
}

export function addPitMarkers(scene) {
  if (!scene.groundLayer || scene.collisionGround !== scene.groundLayer) return;
  const resolution = scene.cameras.main.zoom;
  findFloorGaps(scene).forEach((gap, index) => {
    // Shaft and spikes sit just behind the ground tiles; the lip is drawn over them.
    const shaft = scene.add.graphics().setDepth(-0.5);
    const lip = scene.add.graphics().setDepth(1);
    const bounds = drawGap(scene, gap, shaft, lip);
    const region = { x: bounds.left, y: bounds.top, width: bounds.width, height: bounds.height };
    bakeGraphics(scene, shaft, `pit-shaft-${scene.currentLevel}-${index}`, region, resolution);
    bakeGraphics(scene, lip, `pit-lip-${scene.currentLevel}-${index}`, region, resolution);
    if (scene.currentLevel === 1 && index === 0) addWarningSign(scene, gap, resolution, index);
  });
}
