// Shared by every level: a slender pole and folded, striped orange-red banner.
export function addFinishFlag(scene, map) {
  const column = map.width - 15;
  scene.groundLayer.forEachTile(tile => {
    if ((tile.x === column && tile.y >= 2 && tile.y <= 10) ||
        (tile.x === column + 1 && (tile.y === 3 || tile.y === 4))) {
      tile.alpha = 0;
      tile.setCollision(false, false, false, false);
    }
  });
  if (!scene.textures.exists('finish-flag-art')) {
    const texture = scene.textures.createCanvas('finish-flag-art', 104, 192);
    const ctx = texture.context;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(25, 15); ctx.lineTo(50, 15);
    ctx.bezierCurveTo(61, 15, 60, 25, 75, 25);
    ctx.lineTo(102, 25); ctx.lineTo(92, 35); ctx.lineTo(102, 43);
    ctx.lineTo(92, 53); ctx.lineTo(102, 62); ctx.lineTo(92, 72);
    ctx.lineTo(102, 79); ctx.lineTo(73, 79);
    ctx.bezierCurveTo(57, 79, 64, 69, 47, 69);
    ctx.lineTo(25, 69); ctx.closePath(); ctx.clip();
    ctx.fillStyle = '#eb542e'; ctx.fillRect(25, 10, 79, 75);
    ctx.fillStyle = '#ff9a57';
    for (let x = -35; x < 145; x += 38) {
      ctx.beginPath(); ctx.moveTo(x, 85); ctx.lineTo(x + 19, 85);
      ctx.lineTo(x + 89, 10); ctx.lineTo(x + 70, 10); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#9b3826'; ctx.fillRect(25, 65, 25, 4);
    ctx.fillStyle = '#ae4028';
    ctx.beginPath(); ctx.moveTo(48, 65); ctx.bezierCurveTo(64, 65, 60, 75, 74, 75);
    ctx.lineTo(102, 75); ctx.lineTo(102, 80); ctx.lineTo(73, 80);
    ctx.bezierCurveTo(58, 80, 61, 69, 48, 69); ctx.closePath(); ctx.fill();
    ctx.restore();
    // Keep the cloth separate so it can travel along the stationary pole.
    const banner = scene.textures.createCanvas('finish-flag-banner', 80, 65);
    banner.context.drawImage(texture.getSourceImage(), 24, 15, 80, 65, 0, 0, 80, 65);
    banner.refresh();
    ctx.clearRect(0, 0, 104, 192);
    ctx.fillStyle = '#65747a'; ctx.fillRect(20, 10, 8, 170);
    ctx.fillStyle = '#a5b0b3'; ctx.fillRect(24, 10, 4, 170);
    // Khmer-inspired sandstone plinth: stepped terraces and a lotus-petal band.
    ctx.fillStyle = '#45372b'; ctx.fillRect(1, 185, 46, 5);
    ctx.fillStyle = '#a78351'; ctx.fillRect(2, 185, 44, 3);
    ctx.fillStyle = '#d9b779'; ctx.fillRect(4, 182, 40, 3);
    ctx.fillStyle = '#715437'; ctx.fillRect(7, 173, 34, 9);
    ctx.fillStyle = '#b58a53'; ctx.fillRect(8, 174, 32, 7);
    for (let x = 11; x <= 37; x += 6) {
      ctx.fillStyle = '#e5c587';
      ctx.beginPath(); ctx.moveTo(x, 173); ctx.lineTo(x + 2, 177);
      ctx.lineTo(x, 180); ctx.lineTo(x - 2, 177); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#715437'; ctx.fillRect(x, 177, 1, 3);
    }
    ctx.fillStyle = '#e5c587'; ctx.fillRect(6, 171, 36, 3);
    ctx.fillStyle = '#987246'; ctx.fillRect(10, 168, 28, 3);
    ctx.fillStyle = '#d9b779'; ctx.fillRect(12, 166, 24, 2);
    ctx.fillStyle = '#d95936';
    ctx.beginPath(); ctx.arc(24, 9, 4, Math.PI, 0); ctx.lineTo(28, 15);
    ctx.lineTo(20, 15); ctx.closePath(); ctx.fill();
    texture.refresh();
  }
  const poleX = column * 18 + 9;
  scene.add.image(poleX, 198, 'finish-flag-art')
    .setOrigin(24 / 104, 190 / 192).setScale(0.5).setDepth(-1);
  return scene.add.image(poleX + 2, 151, 'finish-flag-banner')
    .setOrigin(0, 0).setScale(0.35).setDepth(-1)
    .setData('raisedY', 198 - (190 - 15) * 0.5);
}
