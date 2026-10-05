import { playSound } from './ui.js';

export function extendAngkorCauseway(mapData) {
  const originalWidth = mapData.width;
  const targetWidth = 160;
  if (originalWidth >= targetWidth) return;
  const layer = mapData.layers.find(item => item.type === 'tilelayer' && item.name === 'Platforms');
  if (!layer || layer.data.length !== originalWidth * mapData.height || originalWidth !== 100) return;

  const original = layer.data.slice();
  const extended = new Array(targetWidth * mapData.height).fill(0);
  for (let y = 0; y < mapData.height; y++) {
    const sourceRow = y * originalWidth;
    const targetRow = y * targetWidth;
    for (let x = 0; x < 85; x++) extended[targetRow + x] = original[sourceRow + x];
    // Carry the causeway's varied jump platforms forward into a longer middle route.
    for (let x = 85; x < 140; x++) {
      extended[targetRow + x] = original[sourceRow + 30 + x - 85];
    }
    // Repeat the broad landing terrace so the finish and switch have safe footing.
    for (let x = 140; x < targetWidth; x++) {
      extended[targetRow + x] = original[sourceRow + 85 + (x - 140) % 15];
    }
  }
  layer.data = extended;
  layer.width = targetWidth;
  mapData.width = targetWidth;
}

function preparePressurePlateTexture(scene) {
  const key = 'temple-pressure-plate';
  if (scene.textures.exists(key)) return;

  const texture = scene.textures.createCanvas(key, 18, 18);
  const ctx = texture.context;
  ctx.imageSmoothingEnabled = false;
  // Bronze lotus switch set into a dark stone block.
  ctx.fillStyle = '#292b2a'; ctx.fillRect(0, 7, 18, 11);
  ctx.fillStyle = '#726044'; ctx.fillRect(1, 5, 16, 10);
  ctx.fillStyle = '#d7b465'; ctx.fillRect(2, 4, 14, 8);
  ctx.fillStyle = '#ffebad'; ctx.fillRect(3, 5, 12, 2);
  ctx.fillStyle = '#8c6738'; ctx.fillRect(2, 11, 14, 2);
  ctx.fillStyle = '#27685f';
  ctx.fillRect(8, 7, 2, 4); ctx.fillRect(6, 8, 2, 2); ctx.fillRect(10, 8, 2, 2);
  ctx.fillStyle = '#fff0b4'; ctx.fillRect(8, 8, 2, 2);
  ctx.fillStyle = '#40382b'; ctx.fillRect(3, 14, 12, 2);
  texture.refresh();
  texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
}

export function installLevelTwoTrial(scene) {
  preparePressurePlateTexture(scene);
  scene.templeSwitchActivated = false;
  scene.nextGateHintAt = 0;

  scene.templeQuestText = scene.screenText(400, 120,
    'STEP ON THE LOTUS SWITCH TO OPEN THE ANGKOR GATE', {
      fontSize: '11px', fontStyle: 'bold', color: '#ffe3a1',
      stroke: '#172338', strokeThickness: 3,
      backgroundColor: 'rgba(16, 31, 48, 0.82)',
      padding: { left: 8, right: 8, top: 5, bottom: 5 }
    }).setOrigin(0.5).setDepth(220);

  // The plate sits on the broad finish terrace, just before the finish flag.
  const plate = scene.physics.add.staticImage(scene.flagX - 66, 189, 'temple-pressure-plate')
    .setDepth(9);
  plate.body.setSize(18, 16).setOffset(0, 2);
  scene.templeSwitch = plate;

  scene.physics.add.overlap(scene.player, plate, (player, switchPlate) => {
    if (scene.templeSwitchActivated || scene.isLevelFinished) return;
    if (player.body.velocity.y < 0 || player.body.bottom > switchPlate.body.top + 20) return;

    scene.templeSwitchActivated = true;
    scene.templeQuestText.setText('LOTUS SWITCH PRESSED  -  ANGKOR GATE OPEN')
      .setColor('#9ce3ba');
    scene.goalLabel?.setText('OPEN').setColor('#9ce3ba');
    scene.finishFlag?.setTint(0xb9f2c7);
    scene.score += 300;
    playSound(scene, 'stomp', { volume: 0.55 });
    scene.showFloatingText(switchPlate.x, switchPlate.y - 16, 'TEMPLE GATE OPEN!  +300', '#a9f2c0');
    scene.tweens.add({ targets: switchPlate, y: switchPlate.y + 4,
      duration: 110, yoyo: true, ease: 'Sine.easeOut' });
    scene.tweens.add({ targets: scene.templeQuestText, scale: 1.08,
      duration: 150, yoyo: true, ease: 'Sine.easeOut' });
    scene.updateHUD();
  });
}
