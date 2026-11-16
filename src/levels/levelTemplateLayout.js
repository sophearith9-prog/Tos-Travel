import { defineLayout } from './layoutFormat.js';

// TEMPLATE - not registered, so it does not change the game.
// Copy to src/levels/levelNNLayout.js, set `level` and `province`, then register it in
// src/levels/layoutRegistry.js. Coordinates are world pixels (tiles are 18px); the
// floor of a 270px-tall stage usually sits at y = 198 (tile row 11).
//
// Stage-to-province: 10 Mondulkiri, 11 Kratie, 12 Tboung Khmum, 13 Svay Rieng,
// 14 Prey Veng, 15 Kandal, 16 Phnom Penh, 17 Takeo, 18 Kep, 19 Kampot,
// 20 Preah Sihanouk, 21 Koh Kong, 22 Pailin, 23 Battambang, 24 Pursat,
// 25 Kampong Speu, 26 Kampong Chhnang, 27 Kampong Thom, 28 Kampong Cham.

const FLOOR = 198;

export default defineLayout({
  level: 10,
  province: 'mondulkiri',
  title: 'Template Stage',
  width: 1800,
  height: 270,
  camera: { zoom: 2.2 },          // 2.2 matches the biome backdrop of stages 10-28
  terrainStyle: 'ground',         // biome ground tiles; or 'stone' | 'wood' | 'bamboo'

  spawn: { x: 60, y: FLOOR - 9 }, // feet on the floor: y = floor - 9
  finish: { x: 1720, floorY: FLOOR },

  // Static solid ground and ledges: top-left x/y, width, height (default 18).
  platforms: [
    { x: 0, y: FLOOR, width: 522, height: 72 },
    { x: 576, y: FLOOR, width: 324, height: 72 },     // pit 522-576 (sinking platform above)
    { x: 1062, y: FLOOR, width: 738, height: 72 },    // gap 900-1062 (moving platform)
    { x: 300, y: 144, width: 90, oneWay: true },      // jump-through ledge
    { x: 1240, y: 140, width: 72, style: 'stone' }
  ],

  coins: [
    { x: 150, y: 170 }, { x: 170, y: 160 }, { x: 190, y: 170 },
    { x: 330, y: 120 }, { x: 350, y: 120 },
    { x: 960, y: 140 }, { x: 1000, y: 140 }
  ],

  // Same enemy format as Levels 1-9 (variant 0 green, 1 black rock-thrower, 2 gold).
  enemies: [
    { x: 700, y: FLOOR - 28 },
    { x: 1180, y: FLOOR - 28, variant: 1 }
  ],

  checkpoints: [{ x: 1090, floorY: FLOOR }],

  hazards: [
    { type: 'spikes', x: 790, floorY: FLOOR, width: 36 }
  ],

  mechanics: [
    { type: 'sinkingPlatform', x: 522, y: 160, width: 54, mode: 'fall', delay: 500, respawnMs: 2200 },
    { type: 'movingPlatform', path: [{ x: 906, y: 170 }, { x: 1004, y: 170 }], width: 54, speed: 50 },
    { type: 'windZone', x: 1340, y: 60, width: 160, height: 140, force: { x: -70, y: 0 }, gust: { on: 1600, off: 1400 } },
    { type: 'miniBoss', x: 1600, y: FLOOR, name: 'TEMPLATE GUARDIAN', hp: 4,
      phases: [{ below: 0.5, speed: 1.4, attackCooldown: 0.7 }] }
    // { type: 'risingWater', startY: 270, topY: 150, speed: 8, triggerX: 600 },
    // { type: 'autoScrollCamera', startX: 1100, endX: 1500, speed: 45 },
  ]
});
