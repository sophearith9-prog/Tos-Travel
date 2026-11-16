import { playSound } from './ui.js';
import { LEVEL8 } from './levels/level8Layout.js';

const SHOP_X = LEVEL8.sections.snackShop.x;
const FLOOR_Y = LEVEL8.sections.snackShop.floorY;
const MAX_HEALTH = 150;
const SPEED_DURATION = 7000;

const MENU = [
  { name: 'នំអន្សម', romanized: 'NUM ANSOM', price: 5, heal: 50,
    detail: '+50 BLOOD' },
  { name: 'នំចាក់ចាន់', romanized: 'NUM CHAK CHAN', price: 3, heal: 25,
    detail: '+25 BLOOD  ·  SPEED +35% / 7 SEC' }
];

function makeStall(scene) {
  // Keep the stall and vendor behind the player so the character can stand
  // and walk visibly in front of the counter.
  const art = scene.add.graphics().setDepth(-1);
  // Palm-leaf roof with a Khmer gold border and timber supports.
  art.fillStyle(0x38271d, 1).fillTriangle(SHOP_X - 57, FLOOR_Y - 52,
    SHOP_X, FLOOR_Y - 83, SHOP_X + 57, FLOOR_Y - 52);
  art.fillStyle(0x8d6239, 1).fillTriangle(SHOP_X - 52, FLOOR_Y - 54,
    SHOP_X, FLOOR_Y - 78, SHOP_X + 52, FLOOR_Y - 54);
  art.fillStyle(0xb08b4d, 1).fillRect(SHOP_X - 56, FLOOR_Y - 54, 112, 5);
  art.fillStyle(0xe4c37a, 1).fillRect(SHOP_X - 52, FLOOR_Y - 52, 104, 2);
  for (let i = -3; i <= 3; i++) {
    art.fillStyle(i % 2 ? 0x4f6b43 : 0x647c49, 1)
      .fillRect(SHOP_X + i * 13 - 5, FLOOR_Y - 61 + Math.abs(i) * 2, 10, 2);
  }
  art.fillStyle(0x604329, 1)
    .fillRect(SHOP_X - 43, FLOOR_Y - 51, 5, 36)
    .fillRect(SHOP_X + 38, FLOOR_Y - 51, 5, 36);
  art.fillStyle(0x815a35, 1).fillRect(SHOP_X - 50, FLOOR_Y - 21, 100, 8);
  art.fillStyle(0xcca15b, 1).fillRect(SHOP_X - 50, FLOOR_Y - 23, 100, 3);
  art.fillStyle(0x473222, 1).fillRect(SHOP_X - 43, FLOOR_Y - 12, 5, 12)
    .fillRect(SHOP_X + 38, FLOOR_Y - 12, 5, 12);
  // Patterned front cloth and small food parcels on the counter.
  art.fillStyle(0x8c3e32, 1).fillRect(SHOP_X - 31, FLOOR_Y - 19, 62, 6);
  for (let x = -24; x <= 24; x += 12) {
    art.fillStyle(0xe1bd6e, 1).fillRect(SHOP_X + x, FLOOR_Y - 18, 4, 4);
    art.fillStyle(0x483322, 1).fillRect(SHOP_X + x + 4, FLOOR_Y - 17, 3, 2);
  }
  art.fillStyle(0xf1d99a, 1).fillTriangle(SHOP_X - 20, FLOOR_Y - 25,
    SHOP_X - 15, FLOOR_Y - 31, SHOP_X - 10, FLOOR_Y - 25);
  art.fillStyle(0xc9784a, 1).fillTriangle(SHOP_X + 8, FLOOR_Y - 25,
    SHOP_X + 15, FLOOR_Y - 33, SHOP_X + 22, FLOOR_Y - 25);

  // Friendly vendor: simple pixel-art face, krama, and green market shirt.
  const vendor = scene.add.graphics().setDepth(-0.5);
  vendor.fillStyle(0x38271d, 1).fillRect(SHOP_X - 9, FLOOR_Y - 46, 18, 20);
  vendor.fillStyle(0xc98957, 1).fillRect(SHOP_X - 7, FLOOR_Y - 45, 14, 14);
  vendor.fillStyle(0x2e2922, 1).fillRect(SHOP_X - 7, FLOOR_Y - 47, 14, 5);
  vendor.fillStyle(0x171713, 1).fillRect(SHOP_X - 4, FLOOR_Y - 39, 2, 2)
    .fillRect(SHOP_X + 2, FLOOR_Y - 39, 2, 2);
  vendor.fillStyle(0x38614a, 1).fillRect(SHOP_X - 10, FLOOR_Y - 31, 20, 11);
  vendor.fillStyle(0xb74337, 1).fillRect(SHOP_X - 9, FLOOR_Y - 30, 18, 3);
  vendor.fillStyle(0xe7c16a, 1).fillRect(SHOP_X - 8, FLOOR_Y - 27, 16, 1);

  const sign = scene.add.text(SHOP_X, FLOOR_Y - 97, 'តូបនំខ្មែរ', {
    fontFamily: 'Noto Sans Khmer, Khmer OS Battambang, Arial, sans-serif',
    fontSize: '15px', fontStyle: 'bold', color: '#ffe6a3',
    stroke: '#251c15', strokeThickness: 4,
    backgroundColor: '#342519dd', padding: { x: 7, y: 3 }
  }).setOrigin(0.5).setDepth(18);

  const prompt = scene.add.text(SHOP_X, FLOOR_Y - 116, '', {
    fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '10px',
    fontStyle: 'bold', color: '#fff7db', stroke: '#1b211b', strokeThickness: 4,
    backgroundColor: '#18231dcc', padding: { x: 5, y: 3 }
  }).setOrigin(0.5).setDepth(19).setVisible(false);
  const target = scene.add.zone(SHOP_X, FLOOR_Y - 28, 112, 70).setDepth(20)
    .setInteractive({ useHandCursor: true });
  return { prompt, target, sign };
}

function makeMenu(scene, buy, close) {
  const panel = scene.add.container(400, 225).setScrollFactor(0).setDepth(500).setVisible(false);
  const shade = scene.add.rectangle(0, 0, 800, 450, 0x10171c, 0.76).setInteractive();
  const frame = scene.add.graphics();
  frame.fillStyle(0x25231c, 0.99).fillRoundedRect(-286, -174, 572, 348, 14);
  frame.lineStyle(3, 0xd1ae62, 1).strokeRoundedRect(-286, -174, 572, 348, 14);
  frame.lineStyle(1, 0x67805b, 1).strokeRoundedRect(-278, -166, 556, 332, 10);
  const title = scene.add.text(0, -143, 'តូបនំខ្មែរ  ·  KHMER SNACK SHOP', {
    fontFamily: 'Noto Sans Khmer, Khmer OS Battambang, Arial, sans-serif',
    fontSize: '19px', fontStyle: 'bold', color: '#ffe2a1',
    stroke: '#1a1510', strokeThickness: 3
  }).setOrigin(0.5);
  const subtitle = scene.add.text(0, -116, 'REST CHECKPOINT  ·  CHOOSE A FRESH SNACK', {
    fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '10px',
    fontStyle: 'bold', color: '#c8d5bd'
  }).setOrigin(0.5);
  const rows = MENU.map((item, index) => {
    const y = -66 + index * 81;
    const card = scene.add.rectangle(0, y, 520, 66, 0x374333, 0.98)
      .setStrokeStyle(2, 0xa78a54, 1).setInteractive({ useHandCursor: true });
    card.on('pointerover', () => card.setFillStyle(0x4b5d43, 1));
    card.on('pointerout', () => card.setFillStyle(0x374333, 0.98));
    card.on('pointerdown', () => buy(index));
    const name = scene.add.text(-238, y - 16, `${index + 1}. ${item.name}  ·  ${item.romanized}`, {
      fontFamily: 'Noto Sans Khmer, Khmer OS Battambang, Trebuchet MS, Arial, sans-serif',
      fontSize: '13px', fontStyle: 'bold', color: '#fff0cd'
    }).setOrigin(0, 0.5);
    const detail = scene.add.text(-238, y + 12, `${item.detail}     PRICE: ${item.price} COINS`, {
      fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '11px',
      fontStyle: 'bold', color: '#c8e8bd'
    }).setOrigin(0, 0.5);
    return [card, name, detail];
  });
  const feedback = scene.add.text(0, 106, '', {
    fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '11px',
    fontStyle: 'bold', color: '#ffe5a8'
  }).setOrigin(0.5);
  const status = scene.add.text(0, 132, '', {
    fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '10px',
    color: '#fff7dc'
  }).setOrigin(0.5);
  const controls = scene.add.text(0, 153, 'CLICK A SNACK OR PRESS 1 / 2  ·  ESC TO CLOSE', {
    fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '9px',
    fontStyle: 'bold', color: '#cbd8c6'
  }).setOrigin(0.5);
  const closeButton = scene.add.text(264, -151, 'X', {
    fontSize: '17px', fontStyle: 'bold', color: '#ffe7b3',
    backgroundColor: '#603b30', padding: { x: 8, y: 3 }
  }).setOrigin(0.5).setInteractive({ useHandCursor: true });
  closeButton.on('pointerdown', close);
  shade.on('pointerdown', close);
  panel.add([shade, frame, title, subtitle, ...rows.flat(), feedback, status, controls, closeButton]);
  return { panel, feedback, status };
}

export function addLevel8KhmerShop(scene) {
  const { prompt, target } = makeStall(scene);
  const keys = scene.input.keyboard;
  const interactKey = keys?.addKey(Phaser.Input.Keyboard.KeyCodes.F);
  const closeKey = keys?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
  const firstItemKey = keys?.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
  const secondItemKey = keys?.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
  const state = { open: false, canInteract: false, wasInteractDown: false,
    wasFirstDown: false, wasSecondDown: false, feedbackUntil: 0 };

  const close = () => {
    state.open = false;
    menu.panel.setVisible(false);
    prompt.setVisible(state.canInteract);
  };
  const buy = index => {
    const item = MENU[index];
    if (!state.open || !item) return;
    if (scene.coins < item.price) {
      menu.feedback.setText(`NEED ${item.price} COINS`);
      playSound(scene, 'coin', { volume: 0.25, rate: 0.7 });
      return;
    }
    const canHeal = scene.health < scene.maxHealth;
    const canBoost = index === 1 && scene.time.now >= (scene.speedBoostUntil || 0);
    if (!canHeal && !canBoost) {
      menu.feedback.setText(index === 1
        ? 'HEALTH FULL - SPEED ACTIVE' : 'BLOOD IS FULL - TRY CHAK CHAN FOR SPEED');
      return;
    }

    scene.coins -= item.price;
    const healed = scene.restoreBlood(item.heal);
    if (index === 1) scene.speedBoostUntil = scene.time.now + SPEED_DURATION;
    scene.updateHUD();
    playSound(scene, 'coin', { volume: 0.65 });
    if (index === 1) playSound(scene, 'jump', { volume: 0.5, rate: 1.3 });
    const feedback = index === 1 ? `+${healed} ឈាម  ·  ល្បឿន +35%` : `+${healed} ឈាម`;
    scene.showFloatingText(scene.player.x, scene.player.y - 31, feedback, '#ffb5bd');
    const snack = scene.add.image(scene.player.x, scene.player.y - 16, 'extra-life-food')
      .setDisplaySize(18, 18).setDepth(30);
    scene.tweens.add({ targets: snack, y: snack.y - 22, alpha: 0, scale: 1.35,
      duration: 480, onComplete: () => snack.destroy() });
    menu.feedback.setText(index === 1 ? 'SERVED! SPEED BOOST ACTIVE' : 'SERVED! ENJOY YOUR NUM ANSOM');
    state.feedbackUntil = scene.time.now + 1150;
    updateStatus();
  };
  const menu = makeMenu(scene, buy, close);
  const updateStatus = () => menu.status.setText(
    `COINS ${scene.coins}     BLOOD ${Math.round(scene.health)}/${scene.maxHealth}`);

  target.on('pointerdown', () => {
    if (state.canInteract) open();
    else scene.showFloatingText(SHOP_X, FLOOR_Y - 91, 'COME CLOSER TO THE STALL', '#ffe7ae');
  });
  const open = () => {
    if (state.open) return;
    state.open = true;
    scene.level8Checkpoint = { x: SHOP_X, y: FLOOR_Y - 48 };
    menu.feedback.setText('');
    updateStatus();
    menu.panel.setVisible(true);
    prompt.setVisible(false);
    scene.player.setVelocityX(0);
    scene.showFloatingText(SHOP_X, FLOOR_Y - 105, 'MARKET CHECKPOINT REACHED', '#c9f1bd');
  };

  return {
    get busy() { return state.open; },
    update() {
      state.canInteract = Math.abs(scene.player.x - SHOP_X) < 96 &&
        Phaser.Math.Distance.Between(scene.player.x, scene.player.y, SHOP_X, FLOOR_Y - 25) < 126;
      if (!state.open) {
        prompt.setText(state.canInteract ? 'PRESS F / TAP STALL · SHOP' : '');
        prompt.setVisible(state.canInteract);
        const interactDown = Boolean(interactKey?.isDown);
        if (state.canInteract && interactDown && !state.wasInteractDown) open();
        state.wasInteractDown = interactDown;
        return false;
      }
      updateStatus();
      if (scene.time.now > state.feedbackUntil) menu.feedback.setText('');
      if (closeKey?.isDown) close();
      if (firstItemKey?.isDown && !state.wasFirstDown) buy(0);
      if (secondItemKey?.isDown && !state.wasSecondDown) buy(1);
      state.wasFirstDown = Boolean(firstItemKey?.isDown);
      state.wasSecondDown = Boolean(secondItemKey?.isDown);
      return state.open;
    }
  };
}
