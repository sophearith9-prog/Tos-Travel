const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const tileSize = 18;
const columns = 3;
const width = tileSize * columns;
const height = tileSize;
const pixels = Buffer.alloc(width * height * 4);
const colors = {
  stone: '#72533e', stoneFace: '#98704e', stoneLight: '#d2a66a',
  stoneMid: '#b88955', stoneShade: '#503a30', stoneDeep: '#382c28',
  mossBase: '#654832', dirt: '#835b38', dirtLight: '#a57542',
  mossDark: '#29452b', moss: '#46743a', mossLight: '#80a744', mossGold: '#b5bf54',
  waterDeep: '#123c3b', water: '#1b5852', waterMid: '#287367',
  waterLight: '#58a28a', waterFoam: '#9bc18b', waterGold: '#d99a4a'
};

function rgba(hex) {
  const value = hex.slice(1);
  return [0, 2, 4].map(offset => Number.parseInt(value.slice(offset, offset + 2), 16)).concat(255);
}
function setPixel(tile, x, y, color) {
  const index = (y * width + tile * tileSize + x) * 4;
  pixels.set(rgba(colors[color] || color), index);
}
function rect(tile, x, y, w, h, color) {
  for (let py = y; py < y + h; py++) for (let px = x; px < x + w; px++) setPixel(tile, px, py, color);
}

// Carved sandstone block with a small lotus medallion and pixel bevels.
rect(0, 0, 0, 18, 18, 'stoneDeep');
rect(0, 1, 1, 16, 16, 'stone');
rect(0, 2, 2, 14, 14, 'stoneFace');
rect(0, 2, 2, 14, 1, 'stoneLight');
rect(0, 2, 2, 1, 14, 'stoneMid');
rect(0, 15, 3, 1, 12, 'stoneShade');
rect(0, 3, 15, 12, 1, 'stoneShade');
rect(0, 3, 3, 12, 1, 'stoneMid');
rect(0, 3, 3, 1, 12, 'stoneLight');
const lotus = [
  '....M....', '...MHM...', '..MH.HM..', '.MH...HM.',
  'MH..D..HM', '.MH...HM.', '..MH.HM..', '...MHM...', '....M....'
];
for (let y = 0; y < lotus.length; y++) for (let x = 0; x < lotus[y].length; x++) {
  const mark = lotus[y][x];
  if (mark === 'M') setPixel(0, x + 4, y + 4, 'stoneMid');
  if (mark === 'H') setPixel(0, x + 4, y + 4, 'stoneLight');
  if (mark === 'D') setPixel(0, x + 4, y + 4, 'stoneShade');
}
for (const [x, y] of [[4, 4], [13, 4], [4, 13], [13, 13]]) setPixel(0, x, y, 'stoneLight');

// Soil block with an uneven grassy cap and hanging moss pixels.
rect(1, 0, 0, 18, 18, 'mossBase');
rect(1, 0, 4, 18, 14, 'dirt');
rect(1, 0, 6, 18, 12, 'mossBase');
const grassHeights = [3, 3, 2, 2, 3, 2, 2, 3, 3, 2, 2, 3, 2, 2, 3, 3, 2, 2];
for (let x = 0; x < tileSize; x++) {
  for (let y = 0; y < grassHeights[x]; y++) setPixel(1, x, y, y === 0 ? 'mossLight' : 'moss');
}
rect(1, 0, 3, 18, 1, 'mossDark');
for (const [x, y, color] of [
  [1, 1, 'mossLight'], [5, 2, 'mossGold'], [8, 1, 'mossLight'], [12, 2, 'mossLight'],
  [16, 1, 'mossGold'], [3, 5, 'dirtLight'], [7, 7, 'dirtLight'], [13, 5, 'stoneMid'],
  [2, 10, 'moss'], [4, 11, 'mossLight'], [11, 9, 'moss'], [15, 12, 'mossLight'],
  [6, 15, 'dirtLight'], [10, 13, 'dirtLight'], [14, 16, 'moss']
]) setPixel(1, x, y, color);
for (const [x, y, w] of [[2, 3, 2], [10, 3, 3], [15, 3, 2], [5, 4, 2], [12, 4, 2]]) {
  rect(1, x, y, w, 1, 'mossDark');
}

// Dark teal moat water with horizontal, edge-safe ripples and warm reflections.
rect(2, 0, 0, 18, 18, 'waterDeep');
for (let y = 0; y < 18; y++) for (let x = 0; x < 18; x++) {
  if ((x + y * 3) % 13 === 0) setPixel(2, x, y, 'water');
}
for (const [x, y, w, color] of [
  [0, 3, 5, 'waterMid'], [6, 3, 5, 'waterLight'], [12, 3, 6, 'waterMid'],
  [2, 4, 3, 'waterLight'], [7, 4, 2, 'waterFoam'], [14, 4, 2, 'waterLight'],
  [3, 9, 6, 'waterMid'], [11, 9, 5, 'waterLight'], [0, 10, 2, 'waterLight'],
  [4, 10, 3, 'waterFoam'], [12, 10, 3, 'waterFoam'],
  [0, 15, 4, 'waterMid'], [5, 15, 5, 'waterLight'], [13, 15, 5, 'waterMid'],
  [2, 16, 2, 'waterGold'], [7, 16, 3, 'waterFoam'], [15, 16, 2, 'waterGold']
]) rect(2, x, y, w, 1, color);

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const name = Buffer.from(type);
  const size = Buffer.alloc(4); size.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4); checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([size, name, data, checksum]);
}
const header = Buffer.alloc(13);
header.writeUInt32BE(width, 0); header.writeUInt32BE(height, 4);
header[8] = 8; header[9] = 6;
const rows = Buffer.alloc((width * 4 + 1) * height);
for (let y = 0; y < height; y++) pixels.copy(rows, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk('IHDR', header), chunk('IDAT', zlib.deflateSync(rows)), chunk('IEND', Buffer.alloc(0))
]);
const assetPath = path.join(__dirname, '..', 'assets', 'temple-nature-tiles.png');
fs.writeFileSync(assetPath, png);
console.log(`Wrote ${width}x${height} tile atlas: ${assetPath}`);
