import { PROVINCE_ROUTE } from './provinceRoute.js';

export function createProvinceLevel(province, index) {
  const width = 200 + (index % 4) * 10;
  const coins = [], enemies = [];
  for (let x = 15; x < width - 27; x += 22) {
    coins.push({ x: x * 18 + 9, y: 105 }, { x: x * 18 + 27, y: 85 }, { x: x * 18 + 45, y: 105 });
    if (x > 20 && enemies.length < 5) enemies.push({ x: (x + 7) * 18 + 9, y: 170 });
  }
  return { title: province.name, province, width, skyColor: province.sky,
    enemySpeed: 40 + Math.min(15, Math.floor(index / 4) * 3), coins, enemies };
}

export function createProvinceMap(level) {
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
