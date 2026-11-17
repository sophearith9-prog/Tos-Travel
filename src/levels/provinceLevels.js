import { PROVINCE_ROUTE } from './provinceRoute.js';
import { LEVEL6 } from './level6Layout.js';
import { LEVEL7 } from './level7Layout.js';
import { LEVEL8 } from './level8Layout.js';
import { LEVEL9 } from './level9Layout.js';
import { PROVINCE_ENVIRONMENTS } from '../biomes/biomeConfig.js';
import { getLayout } from './layoutRegistry.js';
import { createLayoutMap } from './layoutFormat.js';

// Stages 10-28 use a hand-made layout when one is registered (src/levels/layoutRegistry.js)
// and fall back to the generic generator below otherwise.
export function createProvinceLevel(province, index) {
  const generated = createGeneratedProvinceLevel(province, index);
  const layout = getLayout(index + 4);
  return layout ? layoutLevelConfig(layout, generated) : generated;
}

// Level config for a hand-made layout, on top of the generated config's defaults
// (province, sky colour, enemy speed, biome environment).
export function layoutLevelConfig(layout, base) {
  return {
    ...base,
    title: layout.title || base.title,
    width: layout.width / 18,
    coins: layout.coins,
    enemies: layout.enemies,
    enemySpeed: layout.enemySpeed ?? base.enemySpeed,
    environment: layout.environment ? { ...base.environment, ...layout.environment } : base.environment,
    layout
  };
}

function createGeneratedProvinceLevel(province, index) {
  const width = province.id === 'oddar-meanchey' ? 45
    : province.id === 'preah-vihear' ? LEVEL7.width / 18
      : province.id === 'stung-treng' ? LEVEL8.width / 18
        : province.id === 'ratanakiri' ? LEVEL9.width / 18
      : 200 + (index % 4) * 10;
  const coins = [], enemies = [];
  for (let x = 15; x < width - 27; x += 22) {
    if (province.id !== 'banteay-meanchey' || x > 29) {
      coins.push({ x: x * 18 + 9, y: 105 }, { x: x * 18 + 27, y: 85 }, { x: x * 18 + 45, y: 105 });
    }
    if (x > 20 && enemies.length < 5) enemies.push({ x: (x + 7) * 18 + 9, y: 170 });
  }
  if (province.id === 'banteay-meanchey') {
    // Reward on top of the end staircase: an arc of five coins over the highest block.
    const topX = (width - 21) * 18 + 9;
    [[-18, 104], [-9, 96], [0, 93], [9, 96], [18, 104]].forEach(([dx, y]) => coins.push({ x: topX + dx, y }));
  }
  if (province.id === 'siem-reap') {
    coins.length = 0;
    for (const [tileX, y] of [[14,126],[22,90],[39,126],[46,90],[54,126],
      [63,126],[69,90],[76,126],[84,90],[91,126],[97,126],[104,90],
      [114,126],[122,90],[133,126],[139,90],[151,126],[159,90],[169,126],[180,108]]) {
      coins.push({ x: tileX * 18 + 9, y }, { x: (tileX + 1) * 18 + 9, y: y - 16 },
        { x: (tileX + 2) * 18 + 9, y });
    }
    enemies.splice(0, enemies.length,
      { x: 810, y: 150 }, { x: 1460, y: 110 }, { x: 2070, y: 150 },
      { x: 2700, y: 110 }, { x: 2960, y: 150 });   // last guardian kept clear of the finish house
  }
  if (province.id === 'oddar-meanchey') {
    coins.splice(0, coins.length, ...LEVEL6.coins);
    enemies.splice(0, enemies.length, ...LEVEL6.enemies);
  }
  if (province.id === 'preah-vihear') {
    coins.splice(0, coins.length, ...LEVEL7.coins);
    enemies.splice(0, enemies.length, ...LEVEL7.enemies);
  }
  if (province.id === 'stung-treng') {
    coins.splice(0, coins.length, ...LEVEL8.coins);
    enemies.splice(0, enemies.length, ...LEVEL8.enemies);
  }
  if (province.id === 'ratanakiri') {
    coins.splice(0, coins.length, ...LEVEL9.coins);
    enemies.splice(0, enemies.length, ...LEVEL9.enemies);
  }
  // `environment` (biome, time of day, weather, landmark) drives the scenery of stages 10-28;
  // it is purely visual. See src/biomes/biomeConfig.js.
  return { title: province.name, province, width, skyColor: province.sky,
    enemySpeed: 40 + Math.min(15, Math.floor(index / 4) * 3), coins, enemies,
    environment: PROVINCE_ENVIRONMENTS[province.id] || null };
}

export function createProvinceMap(level) {
  if (level.layout) return createLayoutMap(level.layout);
  if (level.province.id === 'siem-reap') return createSiemReapMap(level);
  if (level.province.id === 'oddar-meanchey') return createOddarMeancheyMap();
  if (level.province.id === 'preah-vihear') return createLevel7Map();
  if (level.province.id === 'stung-treng') return createLevel8Map();
  if (level.province.id === 'ratanakiri') return createLevel9Map();
  const width = level.width, height = 15;
  const grid = Array.from({ length: height }, () => Array(width).fill(0));
  const routeIndex = PROVINCE_ROUTE.findIndex(p => p.id === level.province.id);
  const pits = [];
  for (let x = 30 + routeIndex % 5; x < width - 35; x += 29) pits.push([x, x + 3 + routeIndex % 2]);
  const pit = x => pits.some(([a, b]) => x >= a && x <= b);
  for (let x = 0; x < width; x++) {
    if (pit(x)) continue;
    grid[11][x] = pit(x - 1) ? 1 : pit(x + 1) ? 3 : 2;
    for (let y = 12; y < height; y++) grid[y][x] = pit(x - 1) ? 21 : pit(x + 1) ? 23 : 22;
  }
  const platform = (x, count, row) => {
    for (let i = 0; i < count; i++) {
      grid[row][x + i] = i === 0 ? 1 : i === count - 1 ? 3 : 2;
    }
  };
  pits.forEach(([x], i) => platform(x - 2, 7, 8 - i % 2));
  for (let x = 12; x < width - 30; x += 22) {
    const row = 7 + ((x + routeIndex) % 2);
    platform(x, 5, row);
    grid[5][x + 2] = 48;
  }
  // Leave a clear courtyard beyond the temple entrance.
  if (level.province.id === 'banteay-meanchey') {
    for (let y = 0; y < 11; y++) for (let x = 12; x <= 29; x++) grid[y][x] = 0;
  }
  for (let i = 0; i < 4; i++) for (let y = 10 - i; y <= 10; y++) grid[y][width - 24 + i] = 48;
  // Banteay Chhmar: vary the ground fill by depth (variants painted in provinceScenery.js).
  if (level.province.id === 'banteay-meanchey') {
    const FILL = [[22, 42], [62, 82], [102, 122]];
    for (let y = 12; y < height; y++) for (let x = 0; x < width; x++) {
      if (grid[y][x] === 22) grid[y][x] = FILL[Math.min(2, y - 12)][(x * 7 + y * 3) % 5 === 0 ? 1 : 0];
    }
  }
  const flag = width - 15;
  grid[2][flag] = 111;
  for (let y = 3; y < 10; y++) grid[y][flag] = 131;
  grid[3][flag + 1] = 112; grid[4][flag + 1] = 112; grid[10][flag] = 48;
  return { width, height, tilewidth: 18, tileheight: 18, infinite: false,
    orientation: 'orthogonal', renderorder: 'right-down', version: '1.10', type: 'map',
    layers: [{ id: 1, name: 'Platforms', type: 'tilelayer', width, height,
      opacity: 1, visible: true, x: 0, y: 0, data: grid.flat() }],
    tilesets: [{ firstgid: 1, name: 'tilemap_packed', tilewidth: 18, tileheight: 18,
      tilecount: 180, columns: 20, image: 'tilemap_packed.png', imagewidth: 360, imageheight: 162 }] };
}

function createLevel7Map() {
  const width = LEVEL7.width / 18, height = LEVEL7.height / 18;
  const grid = Array.from({ length: height }, () => Array(width).fill(0));
  return { width, height, tilewidth: 18, tileheight: 18, infinite: false,
    orientation: 'orthogonal', renderorder: 'right-down', version: '1.10', type: 'map',
    layers: [{ id: 1, name: 'Platforms', type: 'tilelayer', width, height,
      opacity: 1, visible: true, x: 0, y: 0, data: grid.flat() }],
    tilesets: [{ firstgid: 1, name: 'tilemap_packed', tilewidth: 18, tileheight: 18,
      tilecount: 180, columns: 20, image: 'tilemap_packed.png', imagewidth: 360, imageheight: 162 }] };
}

function createLevel8Map() {
  const width = LEVEL8.width / 18, height = LEVEL8.height / 18;
  const grid = Array.from({ length: height }, () => Array(width).fill(0));
  return { width, height, tilewidth: 18, tileheight: 18, infinite: false,
    orientation: 'orthogonal', renderorder: 'right-down', version: '1.10', type: 'map',
    layers: [{ id: 1, name: 'Platforms', type: 'tilelayer', width, height,
      opacity: 1, visible: true, x: 0, y: 0, data: grid.flat() }],
    tilesets: [{ firstgid: 1, name: 'tilemap_packed', tilewidth: 18, tileheight: 18,
      tilecount: 180, columns: 20, image: 'tilemap_packed.png', imagewidth: 360, imageheight: 162 }] };
}

function createLevel9Map() {
  const width = LEVEL9.width / 18, height = LEVEL9.height / 18;
  const grid = Array.from({ length: height }, () => Array(width).fill(0));
  return { width, height, tilewidth: 18, tileheight: 18, infinite: false,
    orientation: 'orthogonal', renderorder: 'right-down', version: '1.10', type: 'map',
    layers: [{ id: 1, name: 'Platforms', type: 'tilelayer', width, height,
      opacity: 1, visible: true, x: 0, y: 0, data: grid.flat() }],
    tilesets: [{ firstgid: 1, name: 'tilemap_packed', tilewidth: 18, tileheight: 18,
      tilecount: 180, columns: 20, image: 'tilemap_packed.png', imagewidth: 360, imageheight: 162 }] };
}

function createOddarMeancheyMap() {
  const width = 45, height = 45;
  const grid = Array.from({ length: height }, () => Array(width).fill(0));
  // Level 6 uses precise artwork surfaces from level6Layout.js.
  return { width, height, tilewidth: 18, tileheight: 18, infinite: false,
    orientation: 'orthogonal', renderorder: 'right-down', version: '1.10', type: 'map',
    layers: [{ id: 1, name: 'Platforms', type: 'tilelayer', width, height,
      opacity: 1, visible: true, x: 0, y: 0, data: grid.flat() }],
    tilesets: [{ firstgid: 1, name: 'tilemap_packed', tilewidth: 18, tileheight: 18,
      tilecount: 180, columns: 20, image: 'tilemap_packed.png', imagewidth: 360, imageheight: 162 }] };
}

function createSiemReapMap(level) {
  const width = level.width, height = 15, firstGid = 181;
  const grid = Array.from({ length: height }, () => Array(width).fill(0));
  const water = Array.from({ length: height }, () => Array(width).fill(0));
  const pits = [[26, 33], [61, 70], [95, 105], [129, 140], [162, 174]];
  const overPit = x => pits.some(([a, b]) => x >= a && x <= b);
  const stone = firstGid + 6;
  for (let x = 0; x < width; x++) {
    if (overPit(x)) continue;
    grid[11][x] = firstGid + (x === 0 ? 0 : x === width - 1 ? 2 : 1 + (x * 7) % 5);
    for (let y = 12; y < height; y++) grid[y][x] = stone + (x + y) % 5;
  }
  pits.forEach(([start, end]) => {
    for (let x = start; x <= end; x++) {
      water[11][x] = firstGid + 14 + (x % 2);
      for (let y = 12; y < height; y++) water[y][x] = firstGid + 16 + (x + y) % 2;
    }
  });
  const platform = (x, count, row, filled = true) => {
    for (let i = 0; i < count; i++) {
      grid[row][x + i] = firstGid + (i === 0 ? 0 : i === count - 1 ? 2 : 1 + ((x + i) % 5));
      if (filled) grid[row + 1][x + i] = stone + (i % 5);
    }
  };

  // Stepping-stone route through the Angkor galleries, with a safe island over each moat.
  [[12, 6, 9], [19, 5, 7], [37, 7, 9], [44, 6, 7], [52, 6, 9],
    [72, 7, 9], [80, 6, 7], [88, 6, 9], [112, 7, 9], [120, 6, 7],
    [127, 5, 9], [149, 7, 9], [157, 5, 7], [176, 7, 9]]
    .forEach(([x, count, row]) => platform(x, count, row));
  [[26, 9], [31, 8], [61, 9], [67, 7], [95, 9], [102, 7],
    [129, 9], [136, 7], [162, 9], [170, 7]]
    .forEach(([x, row]) => platform(x, 5, row, false));

  // Stone steps lead up to the exit courtyard and stage flag.
  for (let i = 0; i < 4; i++) {
    for (let y = 10 - i; y <= 10; y++) grid[y][width - 24 + i] = firstGid + 6 + (i % 5);
  }
  const flag = width - 15;
  grid[2][flag] = 111;
  for (let y = 3; y < 10; y++) grid[y][flag] = 131;
  grid[3][flag + 1] = 112; grid[4][flag + 1] = 112;
  grid[10][flag] = firstGid + 7;

  return { width, height, tilewidth: 18, tileheight: 18, infinite: false,
    orientation: 'orthogonal', renderorder: 'right-down', version: '1.10', type: 'map',
    layers: [
      { id: 1, name: 'Water', type: 'tilelayer', width, height,
        opacity: 1, visible: true, x: 0, y: 0, data: water.flat() },
      { id: 2, name: 'Platforms', type: 'tilelayer', width, height,
        opacity: 1, visible: true, x: 0, y: 0, data: grid.flat() }
    ],
    tilesets: [
      { firstgid: 1, name: 'tilemap_packed', tilewidth: 18, tileheight: 18,
        tilecount: 180, columns: 20, image: 'tilemap_packed.png', imagewidth: 360, imageheight: 162 },
      { firstgid: firstGid, name: 'level4_jungle', tilewidth: 18, tileheight: 18,
        tilecount: 48, columns: 12, image: 'level4-jungle-tiles.png', imagewidth: 216, imageheight: 72 }
    ] };
}
