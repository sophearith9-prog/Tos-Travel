import { PROVINCE_ROUTE } from './provinceRoute.js';

export function createProvinceLevel(province, index) {
  const width = 200 + (index % 4) * 10;
  const coins = [], enemies = [];
  for (let x = 15; x < width - 27; x += 22) {
    if (province.id !== 'banteay-meanchey' || x > 29) {
      coins.push({ x: x * 18 + 9, y: 105 }, { x: x * 18 + 27, y: 85 }, { x: x * 18 + 45, y: 105 });
    }
    if (x > 20 && enemies.length < 5) enemies.push({ x: (x + 7) * 18 + 9, y: 170 });
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
      { x: 2700, y: 110 }, { x: 3190, y: 150 });
  }
  return { title: province.name, province, width, skyColor: province.sky,
    enemySpeed: 40 + Math.min(15, Math.floor(index / 4) * 3), coins, enemies };
}

export function createProvinceMap(level) {
  if (level.province.id === 'siem-reap') return createSiemReapMap(level);
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
    for (let i = 0; i < count; i++) grid[row][x + i] = i === 0 ? 1 : i === count - 1 ? 3 : 2;
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
