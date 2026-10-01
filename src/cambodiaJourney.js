// An illustrated journey, rather than a geographic map, exclusive to level 1.
function addLandmarkLabel(scene, x, y, title, subtitle) {
  const width = Math.max(title.length * 6.3, subtitle.length * 5.7, 100) + 18;
  const plate = scene.add.graphics().setDepth(-10);
  plate.fillStyle(0x172b26, 0.92).fillRoundedRect(x - width / 2, y - 15, width, 30, 5);
  plate.lineStyle(1, 0xe4c780, 0.95).strokeRoundedRect(x - width / 2, y - 15, width, 30, 5);
  const heading = scene.add.text(x, y - 8, title, {
    fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '9px',
    fontStyle: 'bold', color: '#fff2cd', stroke: '#172b26', strokeThickness: 1,
    align: 'center'
  }).setOrigin(0.5).setDepth(-9).setResolution(3);
  const localName = scene.add.text(x, y + 6, subtitle, {
    fontFamily: 'Noto Sans Khmer, Khmer OS Battambang, Arial, sans-serif', fontSize: '7px',
    color: '#f2d994', stroke: '#172b26', strokeThickness: 1, align: 'center'
  }).setOrigin(0.5).setDepth(-9).setResolution(3);
  return [plate, heading, localName];
}

export function addCambodiaJourney(scene, map) {
  const width = map.widthInPixels;
  const key = 'banteay-siem-reap-backdrop';
  if (!scene.textures.exists(key)) {
    const texture = scene.textures.createCanvas(key, width, map.heightInPixels);
    const ctx = texture.context;
    const sky = ctx.createLinearGradient(0, 0, width, 100);
    sky.addColorStop(0, '#b6dacf'); sky.addColorStop(0.5, '#e0d9ae');
    sky.addColorStop(1, '#eab47c');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, width, 198);
    ctx.fillStyle = '#ffe4a1'; ctx.beginPath();
    ctx.arc(width - 210, 75, 26, 0, Math.PI * 2); ctx.fill();
    // Soft tree line unifies the countryside and the temple approach.
    ctx.fillStyle = '#95ad87';
    for (let x = -30; x < width + 30; x += 35) {
      ctx.beginPath(); ctx.ellipse(x, 154, 38, 15 + (x % 3) * 3, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#b2b578'; ctx.fillRect(0, 159, width, 37);
    ctx.strokeStyle = '#d8cb8a'; ctx.lineWidth = 2;
    for (let y = 165; y < 194; y += 9) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }
    for (let x = 0; x < width * 0.7; x += 76) {
      ctx.beginPath(); ctx.moveTo(x + 25, 159); ctx.lineTo(x - 25, 196); ctx.stroke();
    }
    // Raised wooden homes amongst the rice fields at the beginning.
    for (const x of [160, 450, 730]) {
      ctx.fillStyle = '#9f8966'; ctx.fillRect(x, 135, 35, 21);
      ctx.fillStyle = '#806e56'; ctx.fillRect(x + 4, 156, 3, 12); ctx.fillRect(x + 28, 156, 3, 12);
      ctx.fillStyle = '#ac795c'; ctx.beginPath(); ctx.moveTo(x - 5, 136);
      ctx.lineTo(x + 17, 119); ctx.lineTo(x + 40, 136); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#655e4c'; ctx.fillRect(x + 14, 142, 8, 14);
    }
    // Trapeang Thmor: open freshwater marsh with reeds, lotus pads, and cranes.
    const pond = ctx.createLinearGradient(0, 146, 0, 198);
    pond.addColorStop(0, '#8cae9b'); pond.addColorStop(1, '#668d82');
    ctx.fillStyle = pond; ctx.fillRect(1570, 149, 320, 49);
    ctx.strokeStyle = '#cad29b'; ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const y = 159 + i * 8;
      ctx.beginPath(); ctx.moveTo(1576, y); ctx.quadraticCurveTo(1700, y - 5, 1880, y + 2); ctx.stroke();
    }
    for (const x of [1588, 1610, 1850, 1870]) {
      ctx.strokeStyle = '#57744e'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, 164); ctx.lineTo(x + 2, 133 + (x % 4) * 3); ctx.stroke();
      ctx.fillStyle = '#8c6344'; ctx.fillRect(x - 1, 138 + (x % 4) * 3, 6, 3);
    }
    for (const [x, y] of [[1650, 177], [1740, 169], [1810, 184]]) {
      ctx.fillStyle = '#638d63'; ctx.beginPath(); ctx.ellipse(x, y, 9, 3, -0.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ddbe79'; ctx.beginPath(); ctx.arc(x + 1, y - 2, 2, 0, Math.PI * 2); ctx.fill();
    }
    // Small elegant waterbirds in flight above the wetland.
    for (const [x, y] of [[1660, 117], [1725, 103], [1790, 122]]) {
      ctx.strokeStyle = '#645b48'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x - 7, y); ctx.quadraticCurveTo(x - 3, y - 6, x, y);
      ctx.quadraticCurveTo(x + 4, y - 6, x + 8, y); ctx.stroke();
      ctx.fillStyle = '#766b51'; ctx.beginPath(); ctx.arc(x, y + 2, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x + 2, y + 2); ctx.lineTo(x + 7, y + 4); ctx.lineTo(x + 3, y + 4); ctx.fill();
    }
    // Community gardens and flower beds outside Serei Saophoan.
    ctx.fillStyle = '#9ead76'; ctx.fillRect(1980, 158, 260, 40);
    for (let row = 0; row < 3; row++) {
      const y = 190 + row * 10;
      ctx.strokeStyle = '#ddcb8c'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(1984, y); ctx.lineTo(2235, y); ctx.stroke();
      for (let x = 2000 + (row % 2) * 18; x < 2230; x += 36) {
        ctx.fillStyle = ['#d78b77', '#e8c773', '#d7a4a7'][row];
        ctx.beginPath(); ctx.arc(x, y - 3, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#527348'; ctx.fillRect(x - 1, y - 1, 2, 6);
      }
    }
    // Stylized Cambodian pagoda in the Banteay Meanchey countryside.
    // Decorative backdrop only: the building never changes the playable platforms.
    ctx.save();
        ctx.translate(320, 169);
    const rect = (x, y, w, h, color) => {
      ctx.fillStyle = color; ctx.fillRect(x, y, w, h);
    };
    rect(-63, -3, 126, 4, '#a58b62');
    rect(-58, -7, 116, 4, '#dbbc80');
    rect(-51, -47, 102, 40, '#e8d6a6');
    rect(-49, -44, 98, 3, '#b2945d');
    for (const x of [-42, -25, 21, 38]) {
      rect(x, -36, 9, 20, '#795147');
      rect(x - 1, -38, 11, 2, '#deb465');
    }
    rect(-9, -34, 18, 27, '#775247');
    rect(-6, -31, 12, 24, '#4e4c3c');
    for (const x of [-48, -15, 12, 45]) {
      rect(x, -43, 3, 35, '#f4e3ba');
      rect(x - 1, -11, 5, 4, '#c5a15b');
    }
    // Layered red-tile roofs, golden edges, and upswept ornamental tips.
    for (const [halfWidth, peak, eave] of [[62, -73, -44], [49, -87, -60], [35, -98, -75]]) {
      ctx.beginPath(); ctx.moveTo(-halfWidth, eave - 8);
      ctx.quadraticCurveTo(-halfWidth + 6, eave, -halfWidth + 12, eave);
      ctx.lineTo(0, peak); ctx.lineTo(halfWidth - 12, eave);
      ctx.quadraticCurveTo(halfWidth - 6, eave, halfWidth, eave - 8);
      ctx.lineTo(halfWidth - 3, eave + 5); ctx.lineTo(-halfWidth + 3, eave + 5);
      ctx.closePath(); ctx.fillStyle = '#a45b46'; ctx.fill();
      ctx.strokeStyle = '#edc778'; ctx.lineWidth = 2; ctx.stroke();
      ctx.strokeStyle = '#c78053'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-halfWidth + 12, eave + 1);
      ctx.lineTo(halfWidth - 12, eave + 1); ctx.stroke();
    }
    ctx.fillStyle = '#f1cc79';
    ctx.beginPath(); ctx.moveTo(0, -111); ctx.lineTo(4, -98);
    ctx.lineTo(0, -92); ctx.lineTo(-4, -98); ctx.closePath(); ctx.fill();
    rect(-17, -7, 34, 2, '#f0d5a1');
    rect(-21, -5, 42, 2, '#bca070');
    rect(-25, -3, 50, 2, '#f0d5a1');
    ctx.restore();
    // Distant lotus-tower silhouettes grow more prominent toward Siem Reap.
    const tower = (x, y, h) => {
      ctx.fillStyle = '#a08c6e'; ctx.fillRect(x - 9, y - 16, 18, 16);
      for (let i = 0; i < 6; i++) ctx.fillRect(x - (16 - i * 2) / 2,
        y - 16 - (i + 1) * (h - 16) / 6, 16 - i * 2, (h - 16) / 6 + 1);
    };
    for (const center of [width * 0.91, width * 0.96]) {
      ctx.fillStyle = '#ad9874'; ctx.fillRect(center - 65, 146, 130, 19);
      [-48, -25, 0, 25, 48].forEach((offset, i) => tower(center + offset, 148, [32, 43, 60, 43, 32][i]));
    }
    texture.refresh();
  }
  scene.add.image(0, 0, key).setOrigin(0).setDepth(-20);
  // Tuck the irregular image edges behind the grass so the rocks meet the land.
  const groundY = 11 * map.tileHeight;
  const mountainBaseY = groundY + 6;
  addLandmarkLabel(scene, 1730, 116, 'TRAPEANG THMOR', 'អាងទឹកត្រពាំងថ្ម');
  addLandmarkLabel(scene, 2110, 116, 'RURAL GARDENS', 'សួនកសិទេសចរណ៍');
  if (scene.textures.exists('kla-kon-cliff')) {
    scene.textures.get('kla-kon-cliff').setFilter(Phaser.Textures.FilterMode.LINEAR);
    // Overlap the rocky edges to extend the mountain rightward into a larger area.
    const cliff = scene.add.image(640, mountainBaseY, 'kla-kon-cliff').setOrigin(0, 1).setDepth(-16);
    cliff.setScale(165 / cliff.height);
  }
  if (scene.textures.exists('banteay-chhmar')) {
    scene.textures.get('banteay-chhmar').setFilter(Phaser.Textures.FilterMode.LINEAR);
    const temple = scene.add.image(200, mountainBaseY, 'banteay-chhmar')
      .setOrigin(0.5, 1).setDepth(-16);
    temple.setScale(165 / temple.height);
    addLandmarkLabel(scene, 200, mountainBaseY - 108, 'BANTEAY CHHMAR', 'ប្រាសាទបន្ទាយឆ្មារ');
  }
  if (scene.textures.exists('kla-kon-mountain')) {
    scene.textures.get('kla-kon-mountain').setFilter(Phaser.Textures.FilterMode.LINEAR);
    const mountain = scene.add.image(605, mountainBaseY, 'kla-kon-mountain').setOrigin(0.5, 1).setDepth(-15);
    mountain.setScale(165 / mountain.height);
  }
  addLandmarkLabel(scene, 605, mountainBaseY - 8, 'KLA KON MOUNTAIN', 'ភ្នំគូលែន');
}
