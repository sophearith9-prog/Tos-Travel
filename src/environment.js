// Crops are measured in the original 800 x 1200 environment artwork.
const crops = {
  tree: [46, 410, 214, 262], pine: [344, 331, 169, 199],
  bush: [277, 541, 195, 132], grass: [209, 692, 143, 151],
  mushroom: [50, 698, 131, 144],
  cloud: [365, 862, 182, 127], block: [608, 348, 132, 128]
};

export function prepareEnvironment(scene) {
  if (!scene.textures.exists('environment-source')) return 'tiles';
  if (scene.textures.exists('environment-tiles')) return 'environment-tiles';
  const source = scene.textures.get('environment-source').getSourceImage();
  for (const [name, [x, y, w, h]] of Object.entries(crops)) {
    const texture = scene.textures.createCanvas('environment-' + name, w, h);
    const ctx = texture.context;
    ctx.drawImage(source, x, y, w, h, 0, 0, w, h);
    const pixels = ctx.getImageData(0, 0, w, h);
    // The JPEG's pale neutral grid is a presentation backdrop, not scenery.
    for (let i = 0; i < pixels.data.length; i += 4) {
      const r = pixels.data[i], g = pixels.data[i + 1], b = pixels.data[i + 2];
      if (Math.min(r, g, b) > 190 && Math.max(r, g, b) - Math.min(r, g, b) < 22) {
        pixels.data[i + 3] = 0;
      }
    }
    ctx.putImageData(pixels, 0, 0);
    texture.refresh();
  }
  createLotusFlower(scene);
  createSugarPalm(scene);
  // Retain tile IDs and dimensions so all existing maps and collisions still work.
  const original = scene.textures.get('tiles').getSourceImage();
  const terrain = scene.textures.createCanvas('environment-tiles', original.width, original.height);
  terrain.context.drawImage(original, 0, 0);
  terrain.context.imageSmoothingEnabled = false;
  const replace = (id, x, y, w, h) => {
    const dx = ((id - 1) % 20) * 18, dy = Math.floor((id - 1) / 20) * 18;
    terrain.context.clearRect(dx, dy, 18, 18);
    terrain.context.drawImage(source, x, y, w, h, dx, dy, 18, 18);
  };
  [1, 2, 3].forEach((id, i) => replace(id, 59 + i * 96, 158, 96, 86));
  [21, 22, 23].forEach((id, i) => replace(id, 63 + i * 90, 211, 90, 32));
  terrain.refresh();
  return 'environment-tiles';
}

function createSugarPalm(scene) {
  if (scene.textures.exists('environment-palm')) {
    scene.textures.get('environment-palm').setFilter(Phaser.Textures.FilterMode.NEAREST);
    return;
  }
  const texture = scene.textures.createCanvas('environment-palm', 144, 220);
  const ctx = texture.context;
  // A tall Borassus sugar palm with a tapered, ring-scarred trunk.
  const crownX = 72, crownY = 62, baseY = 218;
  ctx.fillStyle = '#49382a';
  ctx.beginPath(); ctx.moveTo(66, crownY); ctx.lineTo(78, crownY);
  ctx.lineTo(87, baseY); ctx.lineTo(57, baseY); ctx.closePath(); ctx.fill();
  const trunk = ctx.createLinearGradient(57, 0, 87, 0);
  trunk.addColorStop(0, '#54402d'); trunk.addColorStop(0.3, '#9a7045');
  trunk.addColorStop(0.62, '#bd925c'); trunk.addColorStop(1, '#62462f');
  ctx.fillStyle = trunk;
  ctx.beginPath(); ctx.moveTo(67, crownY + 2); ctx.lineTo(77, crownY + 2);
  ctx.lineTo(84, baseY); ctx.lineTo(60, baseY); ctx.closePath(); ctx.fill();
  for (let y = crownY + 9; y < baseY - 8; y += 6) {
    const halfWidth = 5 + (y - crownY) * 0.05;
    ctx.strokeStyle = y % 2 ? '#64472f' : '#d0a56b';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(crownX-halfWidth,y); ctx.quadraticCurveTo(crownX,y+2,crownX+halfWidth,y); ctx.stroke();
  }
  // Stiff, radiating fan leaves with individual narrow leaflets and curved ribs.
  const angles = [-2.92,-2.62,-2.31,-2.02,-1.72,-1.42,-1.12,-0.8,-0.48,-0.17,0.16,0.47,0.78,1.08,1.38,1.68,1.98,2.28,2.58,2.88];
  angles.forEach((angle,index) => {
    const length = index % 3 === 0 ? 70 : (index % 3 === 1 ? 65 : 59);
    const sweep = 0.38;
    const tipX = crownX + Math.cos(angle) * length;
    const tipY = crownY + Math.sin(angle) * length * 0.77;
    ctx.beginPath(); ctx.moveTo(crownX,crownY);
    ctx.quadraticCurveTo(crownX+Math.cos(angle-sweep)*length*0.72,crownY+Math.sin(angle-sweep)*length*0.58,tipX,tipY);
    ctx.quadraticCurveTo(crownX+Math.cos(angle+sweep)*length*0.72,crownY+Math.sin(angle+sweep)*length*0.58,crownX,crownY);
    ctx.fillStyle = index % 2 ? '#54733a' : '#3c6234'; ctx.fill();
    ctx.strokeStyle = '#283e2a'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.strokeStyle = '#a1a25b'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(crownX,crownY); ctx.quadraticCurveTo(crownX+Math.cos(angle)*length*0.5,crownY+Math.sin(angle)*length*0.43,tipX,tipY); ctx.stroke();
    for(let side of [-1,1]) for(let j=1;j<=13;j++) {
      const t=j/15;
      const bx=crownX+(tipX-crownX)*t, by=crownY+(tipY-crownY)*t;
      const spread=Math.sin(t*Math.PI*0.82)*length*0.18;
      const leafAngle=angle+side*sweep*1.02;
      const ex=bx+Math.cos(leafAngle)*spread, ey=by+Math.sin(leafAngle)*spread*0.78+side*spread*0.2;
      ctx.strokeStyle=j%3===0?'#a8a263':'#78914a';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(ex,ey);ctx.stroke();
    }
  });
  // A small cluster of dark Borassus fruit hangs below the crown.
  ctx.strokeStyle='#59402d';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(71,60);ctx.lineTo(73,78);ctx.stroke();
  for(const [x,y,r] of [[65,79,7],[77,81,8],[70,90,7],[83,91,6]]) {
    ctx.fillStyle='#172520';ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#354331';ctx.beginPath();ctx.arc(x-2,y-2,r*0.45,0,Math.PI*2);ctx.fill();
  }
  texture.refresh();
}

function createLotusFlower(scene) {
  const texture = scene.textures.createCanvas('environment-flower', 40, 48);
  const ctx = texture.context;
  // Layered pink lotus petals, a golden center, and broad green leaves.
  ctx.fillStyle = '#254e38'; ctx.fillRect(18, 24, 4, 24);
  ctx.fillStyle = '#75a653'; ctx.fillRect(19, 26, 1, 21);
  const petal = (tipX, tipY, leftX, leftY, rightX, rightY, color) => {
    ctx.beginPath(); ctx.moveTo(20, 29);
    ctx.quadraticCurveTo(leftX, leftY, tipX, tipY);
    ctx.quadraticCurveTo(rightX, rightY, 20, 29);
    ctx.fillStyle = color; ctx.fill();
    ctx.strokeStyle = '#793951'; ctx.lineWidth = 1.5; ctx.stroke();
  };
  ctx.fillStyle = '#376c43';
  ctx.beginPath(); ctx.moveTo(20, 43); ctx.quadraticCurveTo(4, 44, 3, 33);
  ctx.quadraticCurveTo(18, 31, 20, 43); ctx.fill();
  ctx.fillStyle = '#598f4b';
  ctx.beginPath(); ctx.moveTo(20, 40); ctx.quadraticCurveTo(23, 28, 37, 31);
  ctx.quadraticCurveTo(35, 43, 20, 40); ctx.fill();
  petal(7, 9, 3, 25, 18, 8, '#d67b98');
  petal(33, 9, 22, 8, 37, 25, '#d67b98');
  petal(20, 2, 7, 15, 33, 15, '#f1acc2');
  petal(2, 18, 2, 32, 14, 15, '#ec94b0');
  petal(38, 18, 26, 15, 38, 32, '#ec94b0');
  petal(20, 12, 11, 23, 29, 23, '#ffd1d9');
  ctx.fillStyle = '#e7b756'; ctx.fillRect(16, 26, 8, 3);
  ctx.fillStyle = '#ffe4a0'; ctx.fillRect(18, 25, 4, 2);
  texture.refresh();
}

export function addEnvironment(scene, map) {
  // Level 2 uses a realistic temple photo for its scenery instead of the
  // generic pixel-art plants and clouds used by the other levels.
  if (scene.currentLevel === 2) return;
  if (!scene.textures.exists('environment-tree')) return;
  const groundY = 11 * map.tileHeight;
  const scenery = (key, x, y, height, depth = -2) => {
    const image = scene.add.image(x, y, 'environment-' + key).setOrigin(0.5, 1).setDepth(depth);
    image.setScale(height / image.height);
    return image;
  };
  for (let x = 130; x < map.widthInPixels; x += 280) {
    scenery('cloud', x, 45 + (Math.floor(x / 280) % 3) * 14, 24, -5);
  }
  const plants = [['tree', 76], ['bush', 24], ['palm', 100], ['mushroom', 19], ['flower', 24], 
  ['grass', 22]];
  

  for (let x = 5; x < map.width - 25; x += 5) {
    // Keep the Banteay/Kla Kon landmark backdrops unobstructed.
    const worldX = x * map.tileWidth;
    if (scene.currentLevel === 1 && worldX >= 340 && worldX <= 980) continue;
    // Plant only on continuous solid ground; leave pits and the finish visible.
    const clear = [x - 1, x, x + 1].every(col =>
      scene.groundLayer.getTileAt(col, 11)?.index > 0 &&
      !scene.groundLayer.hasTileAt(col, 10));
    if (clear) {
      const [key, height] = plants[(Math.floor(x / 5) + scene.currentLevel) % plants.length];
      // Tuck the transparent palm image slightly into the top grass tile.
      scenery(key, x * map.tileWidth + map.tileWidth / 2,
        groundY + (key === 'palm' ? 3 : 0), height);
    }
  }
}
