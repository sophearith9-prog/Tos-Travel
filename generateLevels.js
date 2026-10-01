const fs = require('fs');

function generateLevelTMJ(levelNum, width = 100) {
  const H = 15;
  const grid = Array.from({ length: H }, () => Array(width).fill(0));

  let pits = [];
  if (levelNum === 1) {
    pits = [[25, 27], [50, 52], [65, 67]];
  } else if (levelNum === 2) {
    pits = [[20, 22], [40, 43], [58, 61]];
  } else if (levelNum === 3) {
    pits = [[15, 19], [30, 35], [48, 53]];
  } else if (levelNum === 4) {
    pits = [[18, 21], [35, 38], [52, 55]];
  } else if (levelNum === 5) {
    pits = [[22, 26], [42, 47], [60, 64]];
  } else if (levelNum === 6) {
    pits = [[14, 18], [28, 32], [44, 49], [60, 65]];
  } else if (levelNum === 7) {
    pits = [[18, 22], [36, 40], [52, 57], [68, 72]];
  } else if (levelNum === 8) {
    pits = [[16, 21], [32, 38], [50, 56], [68, 74]];
  } else if (levelNum === 9) {
    pits = [[20, 24], [38, 43], [54, 59], [70, 76]];
  } else {
    // Level 10
    pits = [[18, 22], [34, 39], [50, 56], [68, 74], [84, 90]];
  }

  function isPit(x) {
    return pits.some(([s, e]) => x >= s && x <= e);
  }

  // Draw base ground from 0 to width
  for (let x = 0; x < width; x++) {
    if (isPit(x)) continue;
    grid[11][x] = 2; // Flat grass
    if (isPit(x - 1) || x === 0) grid[11][x] = 1;
    if (isPit(x + 1) || x === width - 1) grid[11][x] = 3;

    for (let y = 12; y < H; y++) {
      grid[y][x] = 22; // Dirt
      if (isPit(x - 1) || x === 0) grid[y][x] = 21;
      if (isPit(x + 1) || x === width - 1) grid[y][x] = 23;
    }
  }

  function addPlatform(startX, length, y, gid = 2) {
    for (let i = 0; i < length; i++) {
      const x = startX + i;
      if (x < width) {
        grid[y][x] = (i === 0) ? 1 : (i === length - 1 ? 3 : gid);
      }
    }
  }

  function addBlocks(startX, length, y, gid = 48) {
    for (let i = 0; i < length; i++) {
      if (startX + i < width) grid[y][startX + i] = gid;
    }
  }

  function addPipe(x, topY) {
    if (x + 1 >= width) return;
    grid[topY][x] = 67;
    grid[topY][x + 1] = 68;
    for (let y = topY + 1; y < 11; y++) {
      grid[y][x] = 87;
      grid[y][x + 1] = 88;
    }
  }

  if (levelNum === 1) {
    addBlocks(8, 5, 8);
    addPlatform(16, 4, 7);
    addPipe(22, 9);
    addPlatform(37, 6, 8);
    addBlocks(39, 3, 5);
    addPipe(50, 8);
    addBlocks(54, 4, 7);
    addPlatform(61, 6, 7);
    addPlatform(74, 6, 8);
    addPlatform(86, 6, 7);
    addPlatform(86, 6, 9);
    addPlatform(115, 1, 9);
  } else if (levelNum === 2) {
    addBlocks(0, width - 26, 1, 48); // ceiling
    addPipe(14, 8);
    addPlatform(20, 3, 8);
    addBlocks(26, 5, 6);
    addPipe(34, 7);
    addPlatform(45, 4, 8);
    addBlocks(52, 5, 6);
  } else if (levelNum === 3) {
    addPlatform(14, 5, 8);
    addBlocks(16, 3, 5);
    addPlatform(26, 7, 7);
    addPlatform(40, 6, 6);
    addBlocks(42, 3, 3);
    addPlatform(56, 7, 7);
  } else if (levelNum === 4) {
    addPipe(12, 9);
    addPipe(16, 7);
    addPlatform(22, 4, 6);
    addPipe(30, 8);
    addPlatform(38, 5, 5);
    addPipe(46, 7);
    addPlatform(58, 6, 7);
  } else if (levelNum === 5) {
    addBlocks(10, 6, 8, 48);
    addBlocks(12, 3, 5, 48);
    addPlatform(20, 5, 7);
    addBlocks(28, 8, 7, 48);
    addBlocks(40, 6, 6, 48);
    addPlatform(50, 5, 8);
    addPlatform(45, 1, 9);
    addBlocks(60, 6, 6, 48);
  } else if (levelNum === 6) {
    addPlatform(13, 4, 8);
    addPlatform(19, 4, 6);
    addPlatform(25, 5, 4);
    addPlatform(34, 4, 6);
    addPlatform(42, 4, 8);
    addPlatform(50, 5, 5);
    addPlatform(60, 5, 7);
  } else if (levelNum === 7) {
    addPipe(12, 8);
    addBlocks(16, 5, 6);
    addPlatform(24, 5, 8);
    addBlocks(32, 6, 5);
    addPlatform(42, 5, 7);
    addBlocks(48, 6, 4);
    addPipe(60, 7);
  } else if (levelNum === 8) {
    addBlocks(14, 7, 8);
    addBlocks(26, 8, 7);
    addBlocks(40, 9, 6);
    addBlocks(56, 9, 7);
  } else if (levelNum === 9) {
    addBlocks(10, 9, 8);
    addBlocks(12, 6, 5);
    addBlocks(22, 9, 7);
    addBlocks(24, 6, 4);
    addBlocks(36, 9, 8);
    addBlocks(50, 10, 6);
    addBlocks(64, 10, 7);
  } else {
    addBlocks(8, 8, 8);
    addBlocks(10, 5, 5);
    addPipe(20, 8);
    addBlocks(26, 9, 6);
    addBlocks(28, 6, 3);
    addPipe(40, 7);
    addBlocks(46, 9, 7);
    addPipe(58, 8);
    addBlocks(64, 10, 5);
    addPipe(78, 7);
  }

  // ==========================================
  // FINISH SECTION (Staircase -> Flagpole -> Walkway -> Castle)
  // ==========================================
  
  // 1. Pyramid Staircase leading up (width - 24 to width - 19)
  const stairStart = width - 24;
  for (let s = 0; s < 5; s++) {
    const sx = stairStart + s;
    const sy = 10 - s;
    for (let y = sy; y <= 10; y++) {
      grid[y][sx] = 48; // Brick steps
    }
  }

  // 2. Flagpole Area (width - 15)
  const flagX = width - 15;
  grid[10][flagX] = 48; // Base support block
  for (let y = 3; y <= 9; y++) {
    grid[y][flagX] = 131; // Flagpole shaft
  }
  grid[2][flagX] = 111;     // Golden/Red Flagpole ball top
  grid[3][flagX + 1] = 112; // Waving Flag banner attached to pole!
  grid[4][flagX + 1] = 112;

  // 3. Victory Castle (width - 9 to width - 5, 5 tiles wide)
  const castleX = width - 9;

  // Castle lower walls & entrance door (y=9, 10)
  for (let y = 9; y <= 10; y++) {
    grid[y][castleX] = 48;
    grid[y][castleX + 1] = 48;
    grid[y][castleX + 2] = 0;  // Open castle doorway in middle!
    grid[y][castleX + 3] = 48;
    grid[y][castleX + 4] = 48;
  }

  // Castle mid floor wall (y=8)
  for (let x = 0; x < 5; x++) {
    grid[8][castleX + x] = 48;
  }

  // Castle battlements (y=7)
  grid[7][castleX] = 48;     // Left tower
  grid[7][castleX + 2] = 48; // Center tower
  grid[7][castleX + 4] = 48; // Right tower

  // Castle central tower peak (y=6)
  grid[6][castleX + 2] = 48;

  // Castle roof flag (y=5)
  grid[5][castleX + 2] = 111;
  grid[5][castleX + 3] = 112;

  // Ensure solid ground throughout finish section (width - 25 to width - 1)
  for (let x = width - 25; x < width; x++) {
    grid[11][x] = 2;
    for (let y = 12; y < H; y++) {
      grid[y][x] = 22;
    }
  }

  const flatData = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < width; x++) {
      flatData.push(grid[y][x]);
    }
  }

  return {
    compressionlevel: -1,
    height: H,
    infinite: false,
    layers: [
      {
        data: flatData,
        height: H,
        id: 1,
        name: 'Platforms',
        opacity: 1,
        type: 'tilelayer',
        visible: true,
        width: width,
        x: 0,
        y: 0
      }
    ],
    nextlayerid: 2,
    nextobjectid: 1,
    orientation: 'orthogonal',
    renderorder: 'right-down',
    tiledversion: '1.12.2',
    tileheight: 18,
    tilesets: [
      {
        firstgid: 1,
        name: 'tilemap_packed',
        tilewidth: 18,
        tileheight: 18,
        tilecount: 180,
        columns: 20,
        image: 'tilemap_packed.png',
        imagewidth: 360,
        imageheight: 162
      }
    ],
    tilewidth: 18,
    type: 'map',
    version: '1.10',
    width: width
  };
}

for (let i = 1; i <= 10; i++) {
    const w = i === 1 ? 150 : (i <= 5 ? 100 : (i <= 8 ? 110 : 120));
  const tmj = generateLevelTMJ(i, w);
  fs.writeFileSync('assets/level' + i + '.tmj', JSON.stringify(tmj, null, 2));
  console.log('Regenerated level' + i + '.tmj with complete finish section');
}
