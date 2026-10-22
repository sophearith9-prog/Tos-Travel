import { playSound } from './ui.js';

const ITEM_PRICE = 5;
const MAX_BLOOD = 3;

export function addLevel6Shop(scene) {
  const x = 122, floorY = 234;
  const stand = scene.add.graphics().setDepth(5);
  // A small timber stall sits on the starting ledge, clear of the climbing route.
  stand.fillStyle(0x241a16).fillRect(x - 25, floorY - 39, 50, 39);
  stand.fillStyle(0x704528).fillRect(x - 22, floorY - 36, 44, 35);
  stand.fillStyle(0xb9874b).fillRect(x - 27, floorY - 42, 54, 7);
  stand.fillStyle(0xe3bd70).fillRect(x - 24, floorY - 41, 48, 2);
  stand.fillStyle(0x3c271b).fillRect(x - 18, floorY - 29, 36, 18);
  stand.fillStyle(0x9c7040).fillRect(x - 18, floorY - 29, 36, 3)
    .fillRect(x - 18, floorY - 14, 36, 3);
  scene.add.image(x, floorY - 23, 'extra-life-food')
    .setDisplaySize(27, 22).setDepth(7);

  const sign = scene.add.container(x, floorY - 59).setDepth(12);
  const plate = scene.add.graphics();
  plate.fillStyle(0x211912, 0.96).fillRoundedRect(-67, -17, 134, 34, 5);
  plate.lineStyle(2, 0xd7ad5d, 1).strokeRoundedRect(-66, -16, 132, 32, 5);
  const title = scene.add.text(0, -7, 'ANSORM JRUK', {
    fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '11px',
    fontStyle: 'bold', color: '#ffe4a1', stroke: '#211912', strokeThickness: 2
  }).setOrigin(0.5);
  const offer = scene.add.text(0, 7, '1 BLOOD  ·  5 COINS', {
    fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '9px',
    fontStyle: 'bold', color: '#fff5dc', stroke: '#211912', strokeThickness: 2
  }).setOrigin(0.5);
  sign.add([plate, title, offer]);

  const prompt = scene.add.text(x, floorY - 87, '', {
    fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '10px',
    fontStyle: 'bold', color: '#ffffff', stroke: '#172016', strokeThickness: 4,
    backgroundColor: '#172016cc', padding: { x: 5, y: 3 }
  }).setOrigin(0.5).setDepth(20).setVisible(false);

  const hitTarget = scene.add.zone(x, floorY - 21, 54, 46).setDepth(13)
    .setInteractive({ useHandCursor: true });
  const key = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.F);
  let canUse = false;
  let lastPurchaseAt = -Infinity;
  let wasKeyDown = false;
  let phase = 'idle';
  let item = null;
  let itemSettled = false;

  const purchase = () => {
    if (!canUse || phase !== 'idle' || scene.time.now - lastPurchaseAt < 250) return;
    lastPurchaseAt = scene.time.now;
    if (scene.lives >= MAX_BLOOD) {
      scene.showFloatingText(x, floorY - 94, 'BLOOD IS FULL', '#ffdca0');
      return;
    }
    if (scene.coins < ITEM_PRICE) {
      scene.showFloatingText(x, floorY - 94, 'NEED 5 COINS', '#ffdca0');
      return;
    }
    scene.coins -= ITEM_PRICE;
    scene.updateHUD();
    playSound(scene, 'coin', { volume: 0.6 });
    canUse = false;
    prompt.setVisible(false);
    phase = 'pop';
    itemSettled = false;
    scene.player.setVelocityX(0);
    item = scene.add.image(x, floorY - 28, 'extra-life-food')
      .setDisplaySize(32, 32).setDepth(24);
    // setDisplaySize changes the item's base scale; animate that scale instead
    // of setting `scale` to 1, which would expand the full-size source image.
    const itemScaleX = item.scaleX, itemScaleY = item.scaleY;
    scene.tweens.add({ targets: item, y: floorY - 67,
      scaleX: itemScaleX * 1.3, scaleY: itemScaleY * 1.3,
      duration: 280, ease: 'Back.easeOut', onComplete: () => {
        if (!item?.active) return;
        phase = 'walk';
        scene.tweens.add({ targets: item, y: floorY - 24,
          scaleX: itemScaleX, scaleY: itemScaleY,
          duration: 250, ease: 'Cubic.easeInOut', onComplete: () => { itemSettled = true; } });
      } });
  };

  hitTarget.on('pointerdown', purchase);
  return {
    get busy() { return phase !== 'idle'; },
    update() {
      if (phase !== 'idle') {
        const player = scene.player;
        if (phase === 'walk' && player?.body?.enable) {
          const distance = x - player.x;
          if (Math.abs(distance) > 5) {
            player.setVelocityX(Math.sign(distance) * 92).setFlipX(distance < 0).play('player-walk', true);
          } else {
            player.setVelocityX(0).play('player-idle', true);
          }
          if (itemSettled && player.body.blocked.down && Math.abs(distance) < 18 &&
              Math.abs(player.body.bottom - floorY) < 18) {
            scene.lives = Math.min(MAX_BLOOD, scene.lives + 1);
            scene.updateHUD();
            playSound(scene, 'coin', { volume: 0.6 });
            scene.showFloatingText(x, floorY - 60, '+1 BLOOD', '#ff9aa7');
            item.destroy();
            item = null;
            phase = 'idle';
            player.setVelocityX(0).play('player-idle', true);
          }
        }
        return true;
      }
      canUse = Math.abs(scene.player.x - x) < 62 && Math.abs(scene.player.y - floorY) < 75;
      const full = scene.lives >= MAX_BLOOD;
      prompt.setText(full ? 'BLOOD FULL' : scene.coins >= ITEM_PRICE
        ? 'PRESS F / TAP · BUY' : 'NEED 5 COINS');
      prompt.setVisible(canUse);
      const keyDown = Boolean(key?.isDown);
      if (canUse && keyDown && !wasKeyDown) purchase();
      wasKeyDown = keyDown;
      return false;
    }
  };
}
