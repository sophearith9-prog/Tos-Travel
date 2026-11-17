import { defineLayout } from './layoutFormat.js';

// Level 10 - Mondulkiri: Bou Sra Falls at sunrise (highland biome backdrop).
// Flow (teach -> test -> twist):
//   1. Grassy hills: ride an elephant across a safe valley, then across a thorn valley;
//      the first wild boar waits on the plateau between them.
//   2. Lower tier of Bou Sra: learn currents on solid ground (falling water pushes down,
//      spray lifts up), then use the spray to cross the plunge pool.
//      Secret: drop through the lower fall onto a hidden lip -> cave with bonus coins;
//      an updraft shaft carries you back up to the clifftop.
//   3. Upper tier: boars on the cliff, checkpoint.
//   4. Twist: a gorge crossed on sinking logs under pulsing waterfall columns
//      (you cannot jump while water pours on you, and the log keeps sinking).
// Pools are water-filled pits: falling in costs one health unit and respawns you on the
// last safe ground or checkpoint.

const FLOOR = 288;   // lower tier ground (keeps the biome horizon aligned)
const LOW = 342;     // elephant valley floors
const TOP = 162;     // upper tier (clifftop) ground
const POOL = 304;    // plunge pool surface
const GORGE = 246;   // upper river surface
const H = 360;

const hint = (x, text) => ({ type: 'tutorialHint', x, text });
const pool = (x, width, surface) => ({ type: 'risingWater', x, width, startY: surface, topY: surface, speed: 0, color: 0x2f8aa0, alpha: 0.78 });
const boar = (x, y, extra = {}) => ({ type: 'chargingBoar', x, y, ...extra });
const log = x => ({ type: 'sinkingPlatform', mode: 'sink', style: 'log', x, y: 214, width: 54, height: 12, sinkSpeed: 16, maxSink: 44, riseSpeed: 16 });

export default defineLayout({
  level: 10,
  province: 'mondulkiri',
  title: 'Bou Sra Falls',
  width: 3780,
  height: H,
  camera: { zoom: 2.2 },
  terrainStyle: 'ground',

  spawn: { x: 60, y: FLOOR - 9 },
  finish: { x: 3720, floorY: TOP },

  platforms: [
    // 1. Hills and elephant valleys.
    { x: 0, y: FLOOR, width: 360, height: H - FLOOR },
    { x: 360, y: LOW, width: 360, height: H - LOW },                 // safe valley (teach)
    { x: 720, y: FLOOR, width: 288, height: H - FLOOR },
    { x: 1008, y: LOW, width: 432, height: H - LOW, props: false },  // thorn valley (test)
    // 2. Lower tier.
    { x: 1440, y: FLOOR, width: 468, height: H - FLOOR },
    { x: 1650, y: 198, width: 48, height: 18, style: 'stone' },        // rock spout of the teaching fall
    { x: 1716, y: 108, width: 72, oneWay: true },                       // reward ledge (reach with spray)
    { x: 2004, y: 150, width: 52, style: 'stone' },                     // ledge above the plunge pool
    { x: 2068, y: FLOOR, width: 38, style: 'stone', props: false },     // hidden lip behind the falls
    // Secret cave cut into the cliff: roof slab, floor, and the cliff beyond the shaft.
    { x: 2106, y: TOP, width: 162, height: 54 },
    { x: 2106, y: FLOOR, width: 198, height: H - FLOOR, props: false },
    // 3. Upper tier.
    { x: 2304, y: TOP, width: 558, height: H - TOP },
    // 4. Finish plateau after the gorge.
    { x: 3420, y: TOP, width: 360, height: H - TOP }
  ],

  coins: [
    { x: 110, y: 270 }, { x: 130, y: 262 }, { x: 150, y: 270 },
    { x: 450, y: 268 }, { x: 500, y: 262 }, { x: 550, y: 262 }, { x: 600, y: 268 },
    { x: 790, y: 270 }, { x: 810, y: 262 }, { x: 830, y: 270 },
    { x: 1100, y: 266 }, { x: 1150, y: 260 }, { x: 1200, y: 260 }, { x: 1250, y: 260 }, { x: 1300, y: 266 },
    { x: 1500, y: 270 }, { x: 1520, y: 262 },
    { x: 1730, y: 90 }, { x: 1750, y: 84 }, { x: 1770, y: 90 },
    { x: 1972, y: 240 }, { x: 1972, y: 200 }, { x: 1972, y: 160 },
    { x: 2022, y: 132 }, { x: 2042, y: 132 },
    // Secret cave bonus.
    { x: 2124, y: 270 }, { x: 2148, y: 270 }, { x: 2172, y: 270 }, { x: 2196, y: 270 }, { x: 2220, y: 270 }, { x: 2244, y: 270 },
    { x: 2420, y: 144 }, { x: 2440, y: 138 }, { x: 2460, y: 144 }, { x: 2600, y: 144 }, { x: 2620, y: 138 },
    { x: 2923, y: 196 }, { x: 3017, y: 190 }, { x: 3113, y: 196 }, { x: 3207, y: 190 }, { x: 3303, y: 196 }, { x: 3387, y: 190 },
    { x: 3480, y: 144 }, { x: 3500, y: 138 }, { x: 3520, y: 144 }
  ],

  enemies: [],

  checkpoints: [
    { x: 1480, floorY: FLOOR },
    { x: 2340, floorY: TOP }
  ],

  hazards: [
    { type: 'spikes', style: 'thorns', x: 1010, floorY: LOW, width: 428, height: 10 },
    pool(1908, 160, POOL),
    pool(2862, 558, GORGE)
  ],

  mechanics: [
    // 1. Hills.
    hint(200, 'ELEPHANTS: hop onto their backs to ride across the valley'),
    // Back is 60px wide: these ranges leave <= 4px between the back and the valley walls.
    { type: 'elephantPlatform', minX: 394, maxX: 686, floorY: LOW, speed: 28, startX: 394 },
    hint(740, 'WILD BOAR: it paws the ground, then charges - jump over it!'),
    boar(900, FLOOR),
    { type: 'elephantPlatform', minX: 1042, maxX: 1406, floorY: LOW, speed: 34, startX: 1042, pauseMs: 1100 },

    // 2. Lower tier: teach on solid ground, then the plunge pool.
    hint(1560, 'WATERFALLS: falling water pushes you DOWN - the spray lifts you UP!'),
    { type: 'waterCurrent', dir: 'down', x: 1660, y: 216, width: 28, height: FLOOR - 216 },
    { type: 'waterCurrent', dir: 'up', x: 1690, y: 60, width: 26, height: FLOOR - 60 },
    // Spray in the middle of the pool: jump into it from the edge (walking off drops you in).
    { type: 'waterCurrent', dir: 'up', x: 1952, y: 104, width: 40, height: POOL - 104 },
    { type: 'waterCurrent', dir: 'down', x: 2068, y: TOP, width: 38, height: POOL - TOP },
    // Secret cave behind the lower fall, with an updraft shaft back to the clifftop.
    { type: 'secretArea', x: 2106, y: 216, width: 198, height: FLOOR - 216, label: 'SECRET CAVE!', bonus: 500 },
    { type: 'waterCurrent', dir: 'up', x: 2270, y: 120, width: 32, height: FLOOR - 120, strength: 1700 },

    // 3. Upper tier.
    boar(2520, TOP),
    boar(2760, TOP, { chargeSpeed: 240 }),

    // 4. Twist: sinking logs under pulsing falls.
    hint(2790, 'LOGS SINK under your weight - cross when the falls stop pouring!'),
    log(2896), log(2990), log(3086), log(3180), log(3276), log(3360),
    // The falls pause in a wave that travels right at hopping pace: start on the first
    // gap and keep moving. Waiting on a log costs at most ~1.1s of its ~2.4s float time.
    { type: 'waterCurrent', dir: 'down', x: 2998, y: 0, width: 38, height: GORGE, pulse: { on: 1100, off: 1300, offset: 1600 } },
    { type: 'waterCurrent', dir: 'down', x: 3188, y: 0, width: 38, height: GORGE, pulse: { on: 1100, off: 1300, offset: 800 } },
    { type: 'waterCurrent', dir: 'down', x: 3284, y: 0, width: 38, height: GORGE, pulse: { on: 1100, off: 1300, offset: 300 } },
    boar(3570, TOP)
  ]
});
