import { defineLayout } from './layoutFormat.js';

// Level 11 - Kratie: the Mekong at Kampi, golden sunset (mekong-river biome backdrop with
// the Kampi sala and surfacing dolphins in the midground).
// Flow (teach -> test -> twist):
//   1. Bank: rafts drift WITH the current across the river (teach). A diving kite then
//      appears over solid ground, so its screech-then-dive can be learned safely.
//   2. The current turns AGAINST you: leapfrog upstream from raft to raft (test), kite above.
//   3. Dolphins: two surface over a shallow, harmless ford (teach), then four over deep
//      water in a rightward wave (test).
//   4. Kampi rapids: the spray lifts you up the river cliff (waterCurrent reuse).
//      Secret: a grotto behind the cliff base, with a spray shaft back up.
//   5. Twist: a long river crossed on upstream rafts and surfacing dolphins together,
//      with two kites diving.
// Deep water costs one health unit and respawns you on the last safe ground/checkpoint.

const FLOOR = 288;    // river banks (keeps the biome horizon aligned)
const WATER = 304;    // Mekong surface
const CLIFF = 216;    // top of the river cliff at Kampi
const FORD = 342;     // sandy bottom of the shallow ford
const H = 360;
const RAFT_Y = 296;

const hint = (x, text) => ({ type: 'tutorialHint', x, text });
const river = (x, width, extra = {}) => ({ type: 'risingWater', x, width, startY: WATER, topY: WATER, speed: 0, color: 0x3d7d86, alpha: 0.8, ...extra });
const kite = (x, y, extra = {}) => ({ type: 'divingBird', x, y, ...extra });
// Dolphins share one rhythm; `step` delays each one so they surface in a wave. The delay
// (1050ms) matches one jump between dolphins (~1.08s airtime), so a chain started on any
// surfacing stays in step with the wave instead of falling behind it.
const DOLPHIN_STEP = 1050;
const dolphin = (x, step) => ({ type: 'dolphinPlatform', x, waterY: WATER, upMs: 2000, downMs: 1200, offset: -step * DOLPHIN_STEP });

export default defineLayout({
  level: 11,
  province: 'kratie',
  title: 'Kampi Dolphin Rapids',
  width: 3960,
  height: H,
  camera: { zoom: 2.2 },
  terrainStyle: 'ground',

  spawn: { x: 60, y: FLOOR - 9 },
  finish: { x: 3900, floorY: FLOOR },

  platforms: [
    { x: 0, y: FLOOR, width: 420, height: H - FLOOR },                     // start bank
    { x: 900, y: FLOOR, width: 252, height: H - FLOOR },                   // bank 2 (kite lesson)
    { x: 1704, y: FLOOR, width: 258, height: H - FLOOR },                  // bank 3
    { x: 1962, y: FORD, width: 216, height: H - FORD, props: false },      // shallow ford bottom
    // Kampi river cliff: rock ledge at the base, grotto, shaft and clifftop.
    { x: 2490, y: FLOOR, width: 66, height: H - FLOOR, style: 'stone', props: false },
    { x: 2556, y: CLIFF, width: 144, height: 36 },                         // cliff roof over the grotto
    { x: 2556, y: FLOOR, width: 180, height: H - FLOOR, props: false },    // grotto floor
    { x: 2736, y: CLIFF, width: 144, height: H - CLIFF },                  // clifftop beyond the shaft
    { x: 3672, y: FLOOR, width: 288, height: H - FLOOR }                   // finish bank
  ],

  coins: [
    { x: 150, y: 270 }, { x: 170, y: 262 }, { x: 190, y: 270 },
    { x: 520, y: 270 }, { x: 600, y: 270 }, { x: 680, y: 270 }, { x: 760, y: 270 },
    { x: 960, y: 270 }, { x: 980, y: 262 }, { x: 1090, y: 236 },
    { x: 1250, y: 268 }, { x: 1370, y: 268 }, { x: 1490, y: 268 }, { x: 1600, y: 268 },
    { x: 1780, y: 270 }, { x: 1800, y: 262 },
    { x: 2010, y: 270 }, { x: 2100, y: 270 },
    { x: 2210, y: 270 }, { x: 2300, y: 270 }, { x: 2390, y: 270 }, { x: 2465, y: 270 },
    { x: 2531, y: 236 }, { x: 2531, y: 196 },
    // Secret grotto bonus.
    { x: 2580, y: 270 }, { x: 2604, y: 270 }, { x: 2628, y: 270 }, { x: 2652, y: 270 }, { x: 2676, y: 270 }, { x: 2700, y: 270 },
    { x: 2760, y: 198 }, { x: 2780, y: 192 }, { x: 2850, y: 198 },
    { x: 3000, y: 268 }, { x: 3120, y: 268 }, { x: 3240, y: 268 }, { x: 3360, y: 268 }, { x: 3480, y: 268 }, { x: 3600, y: 268 },
    { x: 3720, y: 270 }, { x: 3740, y: 262 }, { x: 3760, y: 270 }
  ],

  // One river-bank guardian for variety (same format as Levels 1-9).
  enemies: [{ x: 1890, y: FLOOR - 28 }],

  checkpoints: [
    { x: 1744, floorY: FLOOR },
    { x: 2770, floorY: CLIFF }
  ],

  hazards: [
    river(420, 480),                    // 1. teach river
    river(1152, 552),                   // 2. upstream river
    river(1962, 216, { damage: false, alpha: 0.6 }),   // shallow ford: harmless
    river(2178, 312),                   // 3. deep dolphin water
    river(2880, 792)                    // 5. twist river
  ],

  mechanics: [
    // 1. Rafts with the current, then the first kite over safe ground.
    hint(260, 'RAFTS drift with the Mekong current - hop on and ride across!'),
    { type: 'driftingRaft', fromX: 424, toX: 840, y: RAFT_Y, speed: 32, count: 2 },
    hint(930, 'DIVING KITE: when it screeches "!", step aside - or swat it with your sword!'),
    kite(1050, 160, { patrol: 70 }),

    // 2. Against the current: leapfrog upstream.
    hint(1120, 'The current flows AGAINST you here - leap from raft to raft upstream!'),
    // Rafts sink a little way out from bank 2, so a raft you can board always has a
    // reachable raft just upstream; the current keeps pulling you back toward the sink point.
    { type: 'driftingRaft', fromX: 1644, toX: 1182, y: RAFT_Y, speed: 38, count: 5 },
    kite(1420, 150, { patrol: 120 }),

    // 3. Dolphins: safe ford, then deep water.
    hint(1820, 'DOLPHINS: bubbles = surfacing, a shiver = about to dive. Ride their backs!'),
    dolphin(2010, 0), dolphin(2100, 1),
    dolphin(2210, 2), dolphin(2300, 3), dolphin(2390, 4), dolphin(2465, 5),

    // 4. Kampi rapids spray up the cliff (main route) and the hidden grotto.
    hint(2380, 'RAPIDS: jump into the spray to ride it up the river cliff'),
    { type: 'waterCurrent', dir: 'up', x: 2512, y: 150, width: 38, height: 116 },
    { type: 'secretArea', x: 2556, y: 252, width: 180, height: FLOOR - 252, label: 'HIDDEN GROTTO!', bonus: 500 },
    { type: 'waterCurrent', dir: 'up', x: 2702, y: 170, width: 32, height: FLOOR - 170, strength: 1700 },
    kite(2770, 132, { patrol: 50 }),   // mid-clifftop, away from the edge where you time the drop

    // 5. Twist: upstream rafts + surfacing dolphins + kites.
    hint(2860, 'Rafts and dolphins together - keep moving upstream!'),
    // Rafts sink well out from the cliff; dropping from the clifftop still reaches them.
    { type: 'driftingRaft', fromX: 3610, toX: 2990, y: RAFT_Y, speed: 44, count: 6 },
    dolphin(3060, 0), dolphin(3220, 1), dolphin(3380, 2), dolphin(3540, 3),
    kite(3160, 140, { patrol: 100 }),
    kite(3480, 140, { patrol: 100, diveSpeed: 270 })
  ]
});
