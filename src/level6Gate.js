import { LEVEL6 } from './levels/level6Layout.js';

export function addLevel6Gate(scene) {
  const { x, floorY } = LEVEL6.finish;
  // The level artwork already has the Khmer gateway. Add a closed wooden door
  // inside its opening instead of layering another temple illustration over it.
  const door = scene.add.graphics().setDepth(6);
  const left = x - 15;
  const top = floorY - 55;
  door.fillStyle(0x241a16).fillRect(left - 3, top - 3, 36, 58);
  door.fillStyle(0x9a6a35).fillRect(left, top, 30, 55);
  door.fillStyle(0x3c271c).fillRect(left + 3, top + 3, 24, 49);
  door.fillStyle(0x674329).fillRect(left + 5, top + 6, 9, 43)
    .fillRect(left + 16, top + 6, 9, 43);
  door.fillStyle(0x9c7040).fillRect(left + 14, top + 5, 2, 45);
  door.fillStyle(0xc39a55).fillRect(left + 3, top + 3, 24, 2)
    .fillRect(left + 3, top + 49, 24, 2);
  for (let y = top + 13; y < top + 44; y += 10) {
    door.fillStyle(0x38251b).fillRect(left + 5, y, 20, 2);
  }
  door.fillStyle(0xe0bd72).fillRect(left + 22, top + 27, 2, 4);

  const blocker = scene.add.rectangle(x, floorY - 27, 30, 54, 0x000000, 0);
  scene.physics.add.existing(blocker, true);
  const status = scene.add.text(x, floorY - 64, 'GATE CLOSED · 0/5', {
    fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '10px',
    fontStyle: 'bold', color: '#fff0bc', stroke: '#20170f', strokeThickness: 4
  }).setOrigin(0.5).setDepth(8);

  return {
    blocker,
    door,
    status,
    open() {
      if (!blocker.active) return;
      blocker.destroy();
      status.setText('GATE OPEN').setColor('#c8f0ad');
      scene.tweens.add({ targets: door, y: door.y - 52, alpha: 0,
        duration: 760, ease: 'Cubic.easeInOut', onComplete: () => door.setVisible(false) });
      scene.showFloatingText(x, floorY - 76, 'THE GATE IS OPEN!', '#ffe3a1');
    }
  };
}
