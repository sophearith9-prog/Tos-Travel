// A small, code-drawn Angkor Wat-inspired silhouette with five lotus towers.
export function addFinishTemple(scene, map) {
  const center = (map.width - 7) * 18 + 9;
  const ground = 11 * 18;
  scene.groundLayer.forEachTile(tile => {
    if (tile.x >= map.width - 9 && tile.x <= map.width - 5 && tile.y >= 5 && tile.y <= 10) {
      tile.alpha = 0;
      tile.setCollision(false, false, false, false);
    }
  });
  // Level 2 finishes at the flag, without a temple or the original castle tiles.
  if (scene.currentLevel === 2) return;
  if (scene.currentLevel >= 3) {
    scene.textures.get('khmer-finish-house').setFilter(Phaser.Textures.FilterMode.NEAREST);
    scene.add.image(center, ground, 'khmer-finish-house')
      .setOrigin(0.5, 1).setDisplaySize(112, 80).setDepth(-1);
    return;
  }
  if (scene.currentLevel === 1 && scene.textures.exists('khmer-entrance-gate')) {
    scene.textures.get('khmer-entrance-gate').setFilter(Phaser.Textures.FilterMode.NEAREST);
    const temple = scene.add.image(center, ground + 5, 'khmer-entrance-gate')
      .setOrigin(0.5, 1).setDepth(-1);
    temple.setDisplaySize(216, 186);
    addAngkorPortal(scene, center, ground + 5);
    return;
  }
  const g = scene.add.graphics({ x: center, y: ground }).setDepth(-1);
  const stone = 0x9d8059, light = 0xc7a77a, shade = 0x665740, dark = 0x302d29;
  const rect = (x, y, w, h, color) => g.fillStyle(color).fillRect(x, y, w, h);
  const tower = (x, base, width, height) => {
    // Layered lotus-bud tiers narrow toward a pointed stone finial.
    rect(x - width / 2 - 2, base - 21, width + 4, 22, shade);
    rect(x - width / 2, base - 21, width, 21, stone);
    for (let tier = 0; tier < 6; tier++) {
      const w = width - tier * (width - 6) / 6;
      const step = (height - 27) / 6;
      const y = base - 21 - (tier + 1) * step;
      rect(x - w / 2 - 1, y, w + 2, step + 2, dark);
      rect(x - w / 2, y, w, step, stone);
      rect(x - w / 2, y, w, 2, light);
      rect(x + w / 2 - 3, y + 2, 3, step - 1, shade);
      rect(x - 1, y + 3, 2, Math.max(1, step - 4), shade);
    }
    rect(x - 3, base - height, 6, 7, light);
    rect(x - 1, base - height - 4, 2, 5, shade);
    rect(x - 3, base - 17, 6, 16, dark);
  };
  tower(-39, -42, 23, 69);
  tower(39, -42, 23, 69);
  // Long galleries and terraces connect the five sanctuary towers.
  rect(-93, -38, 186, 30, dark);
  rect(-90, -36, 180, 27, stone);
  rect(-95, -42, 190, 5, shade);
  rect(-90, -46, 180, 4, light);
  for (let x = -84; x <= 84; x += 12) {
    rect(x, -32, 5, 19, dark);
    rect(x - 2, -33, 2, 23, light);
  }
  tower(-73, -36, 22, 52);
  tower(73, -36, 22, 52);
  tower(0, -36, 34, 105);
  rect(-98, -10, 196, 5, shade);
  rect(-96, -10, 192, 2, light);
  rect(-101, -5, 202, 5, stone);
  // The doorway is centered on the existing victory walk destination.
  rect(-13, -35, 26, 35, shade);
  rect(-10, -31, 20, 31, light);
  rect(-7, -28, 14, 28, dark);
  rect(-15, -37, 30, 4, light);
  for (let i = 0; i < 3; i++) rect(-12 - i * 3, -6 + i * 2, 24 + i * 6, 1, light);
  scene.add.text(center, ground - 156, 'ANGKOR WAT', {
    fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '10px',
    fontStyle: 'bold', color: '#ffe1a3', stroke: '#302d29', strokeThickness: 3
  }).setOrigin(0.5).setDepth(-1);
}

function addAngkorPortal(scene, center, ground) {
  const key = 'angkor-portal-window';
  if (!scene.textures.exists(key) && scene.textures.exists('portal-destination')) {
    const texture = scene.textures.createCanvas(key, 64, 144);
    const ctx = texture.context;
    const source = scene.textures.get('portal-destination').getSourceImage();
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 144);
    ctx.lineTo(0, 39);
    ctx.quadraticCurveTo(32, 0, 64, 39);
    ctx.lineTo(64, 144);
    ctx.closePath();
    ctx.clip();
    const cropWidth = source.height * (64 / 144);
    ctx.drawImage(source, (source.width - cropWidth) / 2, 0, cropWidth, source.height,
      0, 0, 64, 144);
    const shimmer = ctx.createLinearGradient(0, 0, 64, 0);
    shimmer.addColorStop(0, 'rgba(255,177,61,0.5)');
    shimmer.addColorStop(0.5, 'rgba(255,231,153,0.18)');
    shimmer.addColorStop(1, 'rgba(255,177,61,0.46)');
    ctx.fillStyle = shimmer;
    ctx.fillRect(0, 0, 64, 144);
    ctx.restore();
    texture.refresh();
    texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
  }
  if (!scene.textures.exists(key)) return;

  const portal = scene.add.container(center, ground - 5).setDepth(0);
  const aura = scene.add.graphics();
  aura.fillStyle(0xffb83f, 0.26).fillEllipse(0, -42, 43, 84);
  aura.lineStyle(3, 0xffd36b, 0.94).strokeEllipse(0, -42, 34, 79);
  aura.lineStyle(1.5, 0xfff0b0, 0.95).strokeEllipse(0, -42, 27, 69);
  const view = scene.add.image(0, -32, key).setDisplaySize(23, 66).setAlpha(0.94);
  portal.add([aura, view]);
  scene.templePortal = portal;
  scene.tweens.add({ targets: portal, alpha: 0.76, scaleX: 0.91,
    duration: 760, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
}
