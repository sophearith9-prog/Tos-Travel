import { button, label } from './ui.js';
import { LEVEL_CONFIGS } from './levels/levelConfigs.js';
import { TOTAL_LEVELS } from './levels/provinceRoute.js';

export function showStageClear(scene) {
  // Read by src/fullscreen.js to hide the HTML fullscreen button over this card.
  scene.stageClearOpen = true;
  const zoom = scene.cameras.main.zoom;
  const root = scene.add.container(400 - 400 / zoom, 225 - 225 / zoom)
    .setScale(1 / zoom).setScrollFactor(0).setDepth(400);

  const shade = scene.add.rectangle(400, 225, 800, 450, 0x080d18, 0.78)
    .setInteractive().setAlpha(0);
  root.add(shade);
  scene.tweens.add({ targets: shade, alpha: 1, duration: 420 });

  const card = scene.add.graphics().setAlpha(0).setY(8);
  card.fillStyle(0x030814, 0.55).fillRoundedRect(131, 49, 538, 356, 20);
  card.fillStyle(0x14243b, 0.99).fillRoundedRect(128, 44, 538, 356, 18);
  card.lineStyle(2, 0xc19a5c, 0.95).strokeRoundedRect(128, 44, 538, 356, 18);
  card.lineStyle(1, 0x4b627d, 0.9).strokeRoundedRect(135, 51, 524, 342, 13);
  root.add(card);
  scene.tweens.add({ targets: card, alpha: 1, y: 0, duration: 520, ease: 'Back.Out', delay: 80 });

  root.add(scene.add.image(400, 84, 'nokor-adventure-logo')
    .setDisplaySize(170, 85));

  const isFinalStage = scene.currentLevel >= TOTAL_LEVELS;
  const heading = scene.add.text(400, 145, `STAGE ${scene.currentLevel} CLEARED`, {
    fontFamily: 'Georgia, Trebuchet MS, serif', fontSize: '27px',
    fontStyle: 'bold', color: '#f2ce83', letterSpacing: 1
  }).setOrigin(0.5).setAlpha(0).setScale(0.92);
  const nextName = isFinalStage
    ? 'You completed the entire Cambodia journey!'
    : LEVEL_CONFIGS[scene.currentLevel + 1]?.title || 'Your next Cambodia adventure awaits.';
  const subtitle = scene.add.text(400, 174, nextName, {
    fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '13px',
    color: '#b9c9d8', align: 'center', wordWrap: { width: 450 }
  }).setOrigin(0.5).setAlpha(0);
  root.add([heading, subtitle]);
  scene.tweens.add({ targets: [heading, subtitle], alpha: 1, scale: 1, duration: 400, delay: 180, ease: 'Sine.Out' });

  const stats = scene.add.graphics().setAlpha(0);
  stats.fillStyle(0x0b1829, 0.96).fillRoundedRect(188, 193, 204, 58, 9);
  stats.fillStyle(0x0b1829, 0.96).fillRoundedRect(408, 193, 204, 58, 9);
  stats.lineStyle(1, 0x50647a, 0.85).strokeRoundedRect(188, 193, 204, 58, 9);
  stats.strokeRoundedRect(408, 193, 204, 58, 9);
  root.add(stats);
  const scoreCaption = label(scene, 290, 207, 'TOTAL SCORE', 9, '#93a9bd');
  const scoreValue = label(scene, 290, 232, String(scene.score), 21, '#f3d48d');
  const coinCaption = label(scene, 510, 207, 'TREASURES FOUND', 9, '#93a9bd');
  const coinValue = label(scene, 510, 232, String(scene.coins), 21, '#efc777');
  root.add([scoreCaption, scoreValue, coinCaption, coinValue]);
  [stats, scoreCaption, scoreValue, coinCaption, coinValue].forEach(item => item.setAlpha(0));
  scene.tweens.add({ targets: [stats, scoreCaption, scoreValue, coinCaption, coinValue],
    alpha: 1, duration: 420, delay: 340, ease: 'Back.Out' });

  // Navigate once: a click plus a key press (or both keys) must not start two scenes.
  let leaving = false;
  const go = (key, data) => {
    if (leaving) return;
    leaving = true;
    scene.scene.start(key, data);
  };
  const continueAction = () => {
    if (leaving) return;
    if (!isFinalStage) {
      go('GameScene', {
        level: scene.currentLevel + 1, score: scene.score,
        coins: scene.coins, lives: scene.lives, health: scene.health, shields: scene.shields
      });
    } else {
      go('VictoryScene', {
        level: TOTAL_LEVELS, score: scene.score + 1000, coins: scene.coins
      });
    }
  };
  const continueButton = button(scene, 400, 295, 258,
    isFinalStage ? 'SEE YOUR VICTORY  >' : 'CONTINUE JOURNEY  >', continueAction, true);
  const levelsButton = button(scene, 310, 347, 166, 'LEVEL SELECT', () => go('LevelSelectScene'));
  const homeButton = button(scene, 490, 347, 166, 'BACK TO HOME', () => go('MainMenuScene'));
  root.add([continueButton, levelsButton, homeButton]);
  [continueButton, levelsButton, homeButton].forEach((item, i) => {
    item.setAlpha(0).setY(i === 0 ? 308 : 360).setScrollFactor(0);
    scene.tweens.add({ targets: item, alpha: 1, y: i === 0 ? 295 : 347,
      duration: 350, delay: 500 + i * 70, ease: 'Back.Out' });
  });
  const hint = label(scene, 400, 381, 'ENTER / SPACE  -  CONTINUE', 10, '#a9bacb').setAlpha(0);
  root.add(hint);
  scene.tweens.add({ targets: hint, alpha: 1, duration: 300, delay: 760 });

  if (scene.input.keyboard) {
    // SPACE is also jump: ignore auto-repeat from a key still held when the stage ended.
    const onKey = event => { if (!event.repeat) continueAction(); };
    scene.input.keyboard.on('keydown-ENTER', onKey);
    scene.input.keyboard.on('keydown-SPACE', onKey);
  }
}
