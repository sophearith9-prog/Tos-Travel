// A reusable seal sequence: mistakes reset the seals, never the level.
const LEVEL_RUNES = ['SUN', 'LOTUS', 'MOON', 'STAR'];
const LEVEL_RUNE_CLUE = {
  SUN: 'Follow the dawn', LOTUS: 'Find the flower', MOON: 'Wait for night', STAR: 'Seek the star'
};
const LEVEL_RUNE_ORDERS = [];
function buildRuneOrders(prefix, remaining) {
  if (!remaining.length) { LEVEL_RUNE_ORDERS.push(prefix); return; }
  remaining.forEach((rune, index) => buildRuneOrders(prefix.concat(rune), remaining.filter((_, i) => i !== index)));
}
buildRuneOrders([], LEVEL_RUNES);

export function createLevelPuzzle(level) {
  const sequence = LEVEL_RUNE_ORDERS[((level - 1) * 7 + 3) % LEVEL_RUNE_ORDERS.length];
  const offset = (level - 1) % LEVEL_RUNES.length;
  return {
    sequence,
    symbols: LEVEL_RUNES.slice(offset).concat(LEVEL_RUNES.slice(0, offset)),
    gateX: 680,
    title: `LEVEL ${level} · FOUR RUNE TRIAL`,
    clue: sequence.map(rune => LEVEL_RUNE_CLUE[rune]).join('. ') + '.',
    reward: 250 + 50 * (level % 4),
    barrierColor: level % 2 ? 0x4b4432 : 0x213b37,
    resetMessage: 'Runes reset. Read the clue and try again.',
    openMessage: 'The level gate opened'
  };
}

import { projectileCanCollide, retireRock } from './combat.js';

export function addTemplePuzzle(scene, options = {}) {
  const sequence = options.sequence || ['MOON', 'SUN', 'LOTUS'];
  const symbols = options.symbols || ['SUN', 'LOTUS', 'MOON'];
  const gateX = options.gateX || 510;
  const reward = options.reward || 500;
  const title = options.title || 'THE THREE SEALS';
  const clue = options.clue || 'Night rests. Dawn rises. The flower opens.';
  const barrierColor = options.barrierColor || 0x263329;
  let progress = 0, solved = false, wasPressed = false;
  const down = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
  const sKey = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.S);
  const art = scene.add.container(0, 0).setDepth(3).setVisible(false);
  const gate = scene.add.graphics({ x: gateX }).setDepth(2).setVisible(false);
  gate.fillStyle(barrierColor).fillRect(-14, 0, 28, 198);
  for (let y = 0; y < 198; y += 18) {
    gate.fillStyle(y % 36 ? 0x77795d : 0x626c51).fillRect(-13, y + 1, 26, 16);
    gate.fillStyle(0xa6a17a).fillRect(-13, y + 1, 26, 2);
  }
  for (const y of [139, 157, 175]) {
    gate.lineStyle(2, 0xddc77b).strokeCircle(0, y, 5);
  }
  const barrier = scene.add.zone(gateX, 99, 28, 198);
  scene.physics.add.existing(barrier, true);
  barrier.body.enable = false;
  scene.physics.add.collider(scene.player, barrier);
  scene.physics.add.collider(scene.enemies, barrier);
  // Phaser puts the single sprite/zone first when colliding it with a group.
  scene.physics.add.collider(scene.rockProjectiles, barrier,
    (wall, rock) => retireRock(scene, rock),
    (wall, rock) => projectileCanCollide(rock));
  const message = scene.screenText(400, 128, '', {
    fontFamily: 'Arial', fontSize: '18px', fontStyle: 'bold', color: '#fff5d6', align: 'center',
    backgroundColor: '#14231f', padding: { x: 18, y: 12 }, lineSpacing: 6,
    wordWrap: { width: 520 }
  }).setOrigin(0.5, 0).setResolution(3).setDepth(205).setVisible(false);
  let feedback = '', feedbackUntil = 0;
  const runeColors = { RIVER: 0x73dcdf, FLAME: 0xff9657, LEAF: 0x9be9a0, STAR: 0xffde78 };
  const sealStart = symbols.length > 3 ? 310 : 280;
  const sealGap = symbols.length > 3 ? 76 : 80;
  const seals = symbols.map((name, index) => {
    const x = sealStart + index * sealGap;
    const drawing = scene.add.graphics();
    art.add(drawing);
    art.add(scene.add.text(x, 178, name, {
      fontFamily: 'Arial', fontSize: '9px', fontStyle: 'bold', color: '#fff5d6',
      backgroundColor: '#14231f', padding: { x: 3, y: 2 }
    }).setOrigin(0.5).setResolution(3));
    const hit = scene.add.zone(x, 169, 38, 45).setInteractive();
    art.add(hit);
    const seal = { name, x, drawing, lit: false };
    hit.on('pointerdown', () => activate(seal));
    return seal;
  });
  function draw(seal) {
    const g = seal.drawing, x = seal.x;
    g.clear();
    g.fillStyle(0x363b2e).fillRect(x - 12, 148, 24, 39);
    g.fillStyle(0x68634b).fillRect(x - 10, 149, 20, 2);
    g.fillStyle(0x454837).fillRect(x - 10, 184, 20, 2);
    g.lineStyle(1, seal.lit ? 0x9be9a0 : 0x827a59).strokeRect(x - 11, 149, 22, 37);
    const color = runeColors[seal.name] || 0xf1ce7b;
    g.fillStyle(seal.lit ? 0x9be9a0 : color);
    if (seal.name === 'SUN') {
      g.fillCircle(x, 162, 4);
      g.lineStyle(1, seal.lit ? 0x9be9a0 : color);
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4;
        g.lineBetween(x + Math.cos(a) * 6, 162 + Math.sin(a) * 6, x + Math.cos(a) * 8, 162 + Math.sin(a) * 8);
      }
    } else if (seal.name === 'MOON') {
      g.fillCircle(x, 162, 7).fillStyle(0x363b2e).fillCircle(x + 4, 159, 6);
    } else if (seal.name === 'STAR') {
      g.fillPoints(Array.from({ length: 10 }, (_, i) => {
        const angle = -Math.PI / 2 + i * Math.PI / 5;
        const radius = i % 2 ? 4 : 9;
        return { x: x + Math.cos(angle) * radius * 0.8, y: 162 + Math.sin(angle) * radius * 0.8 };
      }), true);
    } else if (seal.name === 'RIVER') {
      g.lineStyle(3, seal.lit ? 0x9be9a0 : color);
      g.beginPath().moveTo(x - 6, 155).lineTo(x + 5, 159).lineTo(x - 5, 163).lineTo(x + 6, 168).strokePath();
    } else if (seal.name === 'FLAME') {
      g.fillPoints([{ x, y: 154 }, { x: x + 6, y: 161 }, { x: x + 4, y: 166 }, { x, y: 170 }, { x: x - 5, y: 166 }, { x: x - 4, y: 160 }], true);
      g.fillStyle(0xffde78).fillPoints([{ x, y: 159 }, { x: x + 2, y: 163 }, { x, y: 168 }, { x: x - 2, y: 163 }], true);
    } else {
      g.fillEllipse(x - 4, 164, 6, 9).fillEllipse(x + 4, 164, 6, 9).fillEllipse(x, 160, 6, 11);
    }
    g.fillStyle(seal.lit ? 0x9be9a0 : 0x69634b).fillRect(x - 8, 188, 16, 2);
  }
  function nearby(seal) {
    return Math.abs(scene.player.x - seal.x) < 29 && Math.abs(scene.player.body.bottom - 198) < 10;
  }
  function activate(seal) {
    if (solved || scene.templeEntrance?.outside || !scene.scene.isActive() || scene.isLevelFinished || !nearby(seal)) return;
    if (seal.name !== sequence[progress]) {
      progress = 0;
      seals.forEach(item => { item.lit = false; draw(item); });
      feedback = options.resetMessage || 'The seals reset. Read the tablet and try again.';
    } else {
      progress++;
      seal.lit = true;
      draw(seal);
      feedback = `${progress}/${sequence.length} runes awakened`;
      if (progress === sequence.length) {
        solved = true;
        barrier.body.enable = false;
        scene.tweens.add({ targets: gate, y: -205, alpha: 0, duration: 1100, ease: 'Sine.easeInOut' });
        scene.score += reward;
        scene.updateHUD();
        feedback = `${options.openMessage || 'Temple gate opened'}! +${reward}`;
      }
    }
    feedbackUntil = scene.time.now + 2500;
  }
  seals.forEach(draw);
  return {
    get solved() { return solved; },
    update() {
      const inside = !scene.templeEntrance?.outside;
      art.setVisible(inside);
      gate.setVisible(inside);
      barrier.body.enable = inside && !solved;
      const inArea = inside && scene.player.x > sealStart - 100 && scene.player.x < Math.max(gateX + 60, sealStart + (symbols.length - 1) * sealGap + 60);
      const pressed = !!(down?.isDown || sKey?.isDown);
      if (inArea && pressed && !wasPressed) {
        const seal = seals.find(nearby);
        if (seal) activate(seal);
      }
      wasPressed = pressed;
      message.setVisible(inArea && (!solved || scene.time.now < feedbackUntil));
      const status = scene.time.now < feedbackUntil ? feedback : `${progress}/${sequence.length} seals awakened`;
      message.setText(`${title}\n${clue}\n${status}\nStand beside a seal: press DOWN / S or tap it`);
    }
  };
}
