import { LEVEL9 } from './levels/level9Layout.js';
import { touchControls } from './mobileControls.js';
import { bakeGraphics } from './bakeGraphics.js';
import { sfx } from './audio/soundManager.js';

function makeLevel9Textures(scene) {
  if (!scene.textures.exists('level9-laterite')) {
    const texture = scene.textures.createCanvas('level9-laterite', 128, 36);
    const ctx = texture.context;
    ctx.fillStyle = '#543b31'; ctx.fillRect(0, 8, 128, 28);
    ctx.fillStyle = '#794638'; ctx.fillRect(0, 10, 128, 22);
    ctx.fillStyle = '#a64e32'; ctx.fillRect(0, 4, 128, 10);
    ctx.fillStyle = '#d16d3d'; ctx.fillRect(0, 4, 128, 3);
    ctx.fillStyle = '#66764c'; ctx.fillRect(0, 0, 128, 5);
    ctx.fillStyle = '#9aab68'; ctx.fillRect(0, 0, 128, 2);
    for (let x = 0; x < 128; x += 16) {
      const y = 15 + (Math.floor(x / 16) % 3) * 4;
      ctx.fillStyle = '#623b32'; ctx.fillRect(x, y + 4, 14, 9);
      ctx.fillStyle = x % 32 ? '#a9573a' : '#bd6540'; ctx.fillRect(x + 1, y, 13, 8);
      ctx.fillStyle = '#d0804e'; ctx.fillRect(x + 3, y, 6, 2);
      ctx.fillStyle = '#477049'; ctx.fillRect(x + 6, 1, 3, 6);
    }
    texture.refresh();
    texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
  }
  if (!scene.textures.exists('level9-floating-log')) {
    const texture = scene.textures.createCanvas('level9-floating-log', 128, 24);
    const ctx = texture.context;
    ctx.fillStyle = '#342a23'; ctx.fillRect(4, 7, 120, 13);
    ctx.fillStyle = '#795037'; ctx.fillRect(2, 4, 124, 12);
    ctx.fillStyle = '#9b6b40'; ctx.fillRect(7, 4, 112, 4);
    ctx.fillStyle = '#c09158'; ctx.fillRect(13, 5, 24, 2); ctx.fillRect(71, 5, 31, 2);
    ctx.fillStyle = '#42352a'; ctx.fillRect(23, 9, 2, 8); ctx.fillRect(88, 8, 2, 8);
    ctx.fillStyle = '#526c45'; ctx.fillRect(32, 2, 8, 3); ctx.fillRect(98, 1, 7, 4);
    ctx.fillStyle = '#b28a54'; ctx.beginPath(); ctx.ellipse(3, 10, 5, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(125, 10, 5, 6, 0, 0, Math.PI * 2); ctx.fill();
    texture.refresh();
    texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
  }
}

export function addLevel9CraterBackdrop(scene) {
  const key = 'level9-ratanakiri-crater';
  if (scene.textures.exists(key)) {
    const source = scene.textures.get(key).getSourceImage();
    const scale = Math.max(scene.map.widthInPixels / source.width,
      scene.map.heightInPixels / source.height);
    scene.add.image(scene.map.widthInPixels / 2, scene.map.heightInPixels / 2, key)
      .setDisplaySize(source.width * scale, source.height * scale)
      .setScrollFactor(0.18, 0.28).setDepth(-30);
  }

  // Three mist bands move at different rates to give the crater rim depth.
  const farMist = scene.add.graphics().setScrollFactor(0.11, 0.2).setDepth(-26);
  const lakeMist = scene.add.graphics().setScrollFactor(0.28, 0.4).setDepth(-24);
  for (let x = -80; x < scene.map.widthInPixels + 240; x += 390) {
    const y = 500 + ((x / 390) % 3) * 38;
    farMist.fillStyle(0xe3f0e7, 0.14).fillEllipse(x, y, 250, 22);
    farMist.fillStyle(0xf4f4dc, 0.1).fillEllipse(x + 55, y - 8, 135, 19);
  }
  for (let x = 60; x < scene.map.widthInPixels + 280; x += 470) {
    const y = 810 + ((x / 470) % 2) * 32;
    lakeMist.fillStyle(0xd9f2df, 0.12).fillEllipse(x, y, 300, 24);
    lakeMist.fillStyle(0xffffff, 0.09).fillEllipse(x + 45, y - 8, 160, 18);
  }
  // Static soft ellipses: bake them so they are not re-triangulated every frame.
  const mistWidth = scene.map.widthInPixels + 640;
  bakeGraphics(scene, farMist, 'level9-far-mist', { x: -220, y: 470, width: mistWidth, height: 160 });
  bakeGraphics(scene, lakeMist, 'level9-lake-mist', { x: -100, y: 785, width: mistWidth, height: 80 });
  const title = scene.screenText(400, 126, 'RATANAKIRI - YEAK LAOM CRATER LAKE', {
    fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '14px',
    fontStyle: 'bold', color: '#fff0c0', stroke: '#25352b', strokeThickness: 4
  }).setOrigin(0.5).setDepth(150);
  scene.tweens.add({ targets: title, alpha: 0, delay: 2400, duration: 600 });
}

function startLogSink(scene, logState) {
  if (logState.sinking || logState.cooling || scene.isLevelFinished) return;
  logState.sinking = true;
  scene.cameras.main.shake(80, 0.0025);
  scene.tweens.add({ targets: logState.image, x: logState.image.x + 2, duration: 45,
    yoyo: true, repeat: 3, onComplete: () => {
      if (!logState.image.active) return;
      logState.image.body.checkCollision.none = true;
      logState.image.body.setImmovable(false).setAllowGravity(true).setVelocityY(80);
      scene.time.delayedCall(650, () => {
        if (logState.image.active) logState.image.body.enable = false;
        logState.image.setVisible(false);
        logState.cooling = true;
        scene.time.delayedCall(2800, () => {
          const image = logState.image;
          if (!image.active) return;
          image.setPosition(logState.spec.x, logState.baseY).setVisible(true);
          image.body.reset(logState.spec.x, logState.baseY);
          image.body.enable = true;
          image.body.checkCollision.none = false;
          image.body.setAllowGravity(false).setImmovable(true);
          image.body.updateFromGameObject();
          logState.sinking = false;
          logState.cooling = false;
          logState.triggeredAt = 0;
        });
      });
    }
  });
}

function revealCave(scene, state) {
  if (state.secretRevealed) return;
  state.secretRevealed = true;
  state.waterfall.setAlpha(0.32);
  state.caveRelics.getChildren().forEach(relic => {
    relic.setVisible(true);
    relic.body.enable = true;
  });
  scene.showFloatingText(LEVEL9.waterfall.x, LEVEL9.waterfall.y - 22,
    'HIDDEN CAVE  ·  HIGH-REWARD TREASURE', '#ffe6a1');
  scene.cameras.main.flash(180, 80, 150, 132, false);
}

function recoverPlayerFromLake(scene, player, state) {
  const now = scene.time.now;
  if (state.waterRecoveryUntil > now || scene.isLevelFinished) return;
  state.waterRecoveryUntil = now + 1600;

  // Return to the start bank or the final shore before the log crossing.
  const checkpoint = player.x < LEVEL9.water.x
    ? LEVEL9.spawn
    : { x: 620, y: 613 };
  player.body.setAllowGravity(true);
  player.setPosition(checkpoint.x, checkpoint.y).setVelocity(0, 0).setAlpha(0.45);
  player.body.reset(checkpoint.x, checkpoint.y);
  scene.isInvulnerable = true;
  if (scene.shields > 0) scene.shields--;
  scene.updateHUD();
  scene.showFloatingText(checkpoint.x, checkpoint.y - 24,
    'LAKE CURRENT - BACK TO SHORE', '#c7f3ed');
  scene.time.delayedCall(1500, () => {
    if (!scene.player?.active) return;
    scene.isInvulnerable = false;
    scene.player.setAlpha(1);
    state.waterRecoveryUntil = 0;
  });
}

export function installLevel9Terrain(scene) {
  makeLevel9Textures(scene);
  const terrain = scene.physics.add.staticGroup();
  const state = {
    terrain, logs: [], vines: [], boss: null, bossDefeated: false,
    secretRevealed: false, grabbedVine: null, wasJumpDown: false,
    exitBlocker: null
  };

  for (const ledge of LEVEL9.ledges) {
    const image = scene.add.tileSprite(ledge.x, ledge.y, ledge.width, 36,
      'level9-laterite').setOrigin(0, 0).setDepth(-2);
    const body = scene.add.rectangle(ledge.x + ledge.width / 2, ledge.y + 5,
      ledge.width, 10, 0xffffff, 0);
    terrain.add(body);
    body.body.checkCollision.down = false;
    body.body.checkCollision.left = false;
    body.body.checkCollision.right = false;
    body.level9Art = image;
  }

  for (const spec of LEVEL9.floatingLogs) {
    const image = scene.physics.add.image(spec.x, spec.y, 'level9-floating-log')
      .setDisplaySize(spec.width, 24).setDepth(-1);
    image.body.setAllowGravity(false).setImmovable(true).setSize(120, 13).setOffset(4, 7);
    state.logs.push({ spec, image, baseY: spec.y, phase: spec.phase,
      sinking: false, cooling: false, triggeredAt: 0 });
  }

  // Deep teal water and its invisible fall hazard occupy the lake route.
  state.waterArt = scene.add.graphics().setDepth(-5);
  state.waterArt.fillStyle(0x123e4a, 0.42).fillRect(
    LEVEL9.water.x, LEVEL9.water.y, LEVEL9.water.width, LEVEL9.water.height);
  for (let x = LEVEL9.water.x + 12; x < LEVEL9.water.x + LEVEL9.water.width; x += 110) {
    state.waterArt.lineStyle(2, 0x93d4c5, 0.28).beginPath()
      .moveTo(x, LEVEL9.water.y + 16).lineTo(x + 48, LEVEL9.water.y + 16).strokePath();
  }
  const waterZone = scene.add.zone(LEVEL9.water.x + LEVEL9.water.width / 2,
    LEVEL9.water.y + LEVEL9.water.height / 2, LEVEL9.water.width, LEVEL9.water.height);
  scene.physics.add.existing(waterZone, true);
  state.waterZone = waterZone;

  // Swinging vine ropes use a pendulum endpoint and visible leafy ties.
  for (const spec of LEVEL9.swingingVines) {
    const art = scene.add.graphics().setDepth(2);
    // Leaf tufts as Ellipse shapes (triangulated once) that follow the swinging rope end.
    const leaf = scene.add.ellipse(spec.x, spec.y + spec.length, 13, 7, 0x7c9a51, 1).setDepth(2);
    const leafTip = scene.add.ellipse(spec.x, spec.y + spec.length, 7, 4, 0xb0be6d, 0.9).setDepth(2);
    state.vines.push({ spec, art, leaf, leafTip, angle: 0, endX: spec.x, endY: spec.y + spec.length });
  }

  // Waterfall wall is intentionally non-solid; the lower shelf is the hidden cave.
  const waterfall = scene.add.graphics().setDepth(3);
  const wf = LEVEL9.waterfall;
  waterfall.fillStyle(0x286f7c, 0.78).fillRect(wf.x, wf.y, wf.width, wf.height);
  waterfall.fillStyle(0x6fb9b6, 0.42).fillRect(wf.x + 8, wf.y, 9, wf.height);
  waterfall.fillStyle(0xb2e4d9, 0.33).fillRect(wf.x + 27, wf.y + 5, 5, wf.height - 7);
  waterfall.fillStyle(0x397f82, 0.38).fillRect(wf.x + 43, wf.y + 2, 8, wf.height - 2);
  for (let y = wf.y + 12; y < wf.y + wf.height; y += 24) {
    waterfall.fillStyle(0xd1eee0, 0.38).fillRect(wf.x + ((y / 24) % 3) * 11, y, 18, 2);
  }
  state.waterfall = waterfall;
  state.caveZone = scene.add.zone(wf.x + wf.width / 2, wf.y + wf.height / 2, 100, wf.height + 35);
  scene.physics.add.existing(state.caveZone, true);
  state.caveRelics = scene.physics.add.staticGroup();
  for (const item of LEVEL9.treasures) {
    const relic = state.caveRelics.create(item.x, item.y, 'khmer-coin', 2)
      .setScale(1.15).setDepth(10).setVisible(false);
    relic.body.enable = false;
    relic.setData('collected', false);
    scene.tweens.add({ targets: relic, y: relic.y - 6, duration: 600,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  state.bossName = scene.add.text(0, 0, '', {
    fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '10px',
    fontStyle: 'bold', color: '#ffe4a1', stroke: '#281d17', strokeThickness: 3
  }).setOrigin(0.5).setDepth(18).setVisible(false);
  state.bossBar = scene.add.graphics().setDepth(18);
  const gateX = LEVEL9.finish.x - 38;
  const gateY = LEVEL9.finish.floorY - 48;
  state.gateArt = scene.add.graphics().setDepth(4);
  state.gateArt.lineStyle(5, 0x794a35, 1).strokeRect(gateX - 20, gateY - 58, 40, 100);
  state.gateArt.lineStyle(2, 0xd58d4c, 1).strokeRect(gateX - 12, gateY - 50, 24, 84);
  state.gateArt.fillStyle(0x214f50, 0.7).fillRect(gateX - 9, gateY - 47, 18, 77);
  state.gateLabel = scene.add.text(gateX, gateY - 70, 'SEALED', {
    fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '9px',
    fontStyle: 'bold', color: '#ffe2a0', stroke: '#281d17', strokeThickness: 3
  }).setOrigin(0.5).setDepth(12);
  state.exitBlocker = scene.add.rectangle(gateX, gateY, 12, 100, 0xffffff, 0);
  scene.physics.add.existing(state.exitBlocker, true);
  scene.level9Highlands = state;
  scene.recordLevel9BossDefeat = enemy => {
    if (scene.currentLevel !== 9 || !enemy.level9Boss || state.bossDefeated) return;
    state.bossDefeated = true;
    state.gateLabel.setText('GATE OPEN').setColor('#c4f3cf');
    state.exitBlocker.body.enable = false;
    scene.tweens.add({ targets: state.gateArt, alpha: 0.4, duration: 500 });
    scene.showFloatingText(enemy.x, enemy.y - 42, 'CRATER WARDEN DEFEATED', '#ffe5a5');
    scene.cameras.main.shake(180, 0.006);
  };
  return terrain;
}

export function attachLevel9Highlands(scene) {
  const state = scene.level9Highlands;
  if (!state || scene.currentLevel !== 9) return;
  scene.physics.add.collider(scene.player, state.exitBlocker);
  for (const logState of state.logs) {
    scene.physics.add.collider(scene.player, logState.image, (player, log) => {
      if (player.body.velocity.y >= 0 && player.body.bottom <= log.body.top + 14) {
        if (!logState.triggeredAt) logState.triggeredAt = scene.time.now;
        if (scene.time.now - logState.triggeredAt > 1250) startLogSink(scene, logState);
      }
    });
    scene.physics.add.overlap(scene.player, logState.image, (player, log) => {
      if (player.body.bottom <= log.body.top + 16 && !logState.triggeredAt) {
        logState.triggeredAt = scene.time.now;
      }
      if (player.body.bottom > log.body.bottom + 12) logState.triggeredAt = scene.time.now;
    });
  }
  scene.physics.add.overlap(scene.player, state.waterZone, player => {
    recoverPlayerFromLake(scene, player, state);
  });
  const unregisterFall = sfx(scene).addWaterfall({ x: LEVEL9.waterfall.x + LEVEL9.waterfall.width / 2, halfWidth: LEVEL9.waterfall.width / 2,
    top: LEVEL9.waterfall.y, bottom: LEVEL9.waterfall.y + LEVEL9.waterfall.height });
  scene.events.once('shutdown', unregisterFall);
  scene.physics.add.overlap(scene.player, state.caveZone, player => {
    if (player.y > LEVEL9.waterfall.y - 5) revealCave(scene, state);
  });
  scene.physics.add.overlap(scene.player, state.caveRelics, (player, relic) => {
    if (!state.secretRevealed || relic.getData('collected')) return;
    relic.setData('collected', true).disableBody(true, true);
    scene.coins++;
    sfx(scene).play('treasure');
    scene.score += 350;
    scene.updateHUD();
    scene.playCoinFeedback(relic.x, relic.y);
    scene.showFloatingText(relic.x, relic.y - 18, 'CAVE TREASURE  +350', '#ffe69b');
  });
  state.boss = scene.enemies.getChildren().find(enemy => enemy.level9Boss)
    || scene.enemies.getChildren().find(enemy => enemy.enemyKind === 'stone-guardian');
  if (state.boss) {
    const boss = state.boss;
    boss.level9Boss = true;
    boss.setActive(true).setVisible(true).setAlpha(1).setPosition(1850, 676).setDepth(8);
    boss.body.enable = true;
    boss.body.reset(1850, 676);
    boss.hitPoints = boss.maxHitPoints = 6;
    boss.isLargeGuardian = true;
    state.bossName.setPosition(boss.x, boss.y - 92).setText('CRATER WARDEN  6/6').setVisible(true);
    boss.once('destroy', () => { state.bossName.destroy(); state.bossBar.destroy(); });
  }
}

function releaseVine(scene, vine, now) {
  const { spec, angle } = vine;
  const omega = spec.speed * spec.arc * Math.cos(now * spec.speed + spec.phase);
  const vx = spec.length * Math.cos(angle) * omega;
  const vy = -spec.length * Math.sin(angle) * omega;
  scene.player.body.setAllowGravity(true);
  scene.player.setVelocity(Phaser.Math.Clamp(vx * 1.25, -360, 360),
    Phaser.Math.Clamp(vy * 1.25 - 190, -390, 250));
  scene.player.setData('level9VineSwing', false);
  scene.player.setFlipX(vx < 0);
  scene.level9Highlands.grabbedVine = null;
}

export function updateLevel9Highlands(scene, delta) {
  const state = scene.level9Highlands;
  if (!state || scene.currentLevel !== 9) return false;
  const now = scene.time.now;
  // Match GameScene's jump keys; SPACE was missing, so space-jumpers could not grab or leave vines.
  const jumpDown = Boolean(touchControls.jump || scene.cursors?.up.isDown ||
    scene.wasd?.up.isDown || scene.wasd?.space.isDown);
  const jumpPressed = jumpDown && !state.wasJumpDown;
  state.wasJumpDown = jumpDown;

  for (const vine of state.vines) {
    vine.angle = Math.sin(now * vine.spec.speed + vine.spec.phase) * vine.spec.arc;
    vine.endX = vine.spec.x + Math.sin(vine.angle) * vine.spec.length;
    vine.endY = vine.spec.y + Math.cos(vine.angle) * vine.spec.length;
    vine.art.clear().lineStyle(4, 0x345d3d, 0.98).beginPath()
      .moveTo(vine.spec.x, vine.spec.y).lineTo(vine.endX, vine.endY).strokePath();
    vine.leaf.setPosition(vine.endX, vine.endY);
    vine.leafTip.setPosition(vine.endX - 5, vine.endY + 2);
  }

  if (state.grabbedVine) {
    const vine = state.grabbedVine;
    scene.player.body.setAllowGravity(false);
    scene.player.setVelocity(0, 0).setPosition(vine.endX, vine.endY + 7);
    scene.player.setFlipX(Math.cos(vine.angle) < 0);
    scene.player.play('player-jump', true);
    scene.player.setData('level9VineSwing', true);
    if (jumpPressed) {
      releaseVine(scene, vine, now);
      scene.jumpInputDown = true;
    }
  } else if (jumpPressed) {
    const playerCenterX = scene.player.body.center.x;
    const playerCenterY = scene.player.body.center.y;
    const reachable = state.vines.find(vine => Phaser.Math.Distance.Between(
      playerCenterX, playerCenterY, vine.endX, vine.endY) < 34);
    if (reachable) {
      state.grabbedVine = reachable;
      scene.player.body.setAllowGravity(false);
      scene.player.setVelocity(0, 0).setData('level9VineSwing', true);
      scene.jumpInputDown = true;
    }
  }

  for (const logState of state.logs) {
    const image = logState.image;
    if (logState.sinking || logState.cooling) continue;
    image.setY(logState.baseY + Math.sin(now * 0.002 + logState.phase) * 5);
    image.body.updateFromGameObject();
    if (logState.triggeredAt && now - logState.triggeredAt > 1250) startLogSink(scene, logState);
  }

  if (state.boss?.active && state.boss.body?.enable) {
    const ratio = Phaser.Math.Clamp(state.boss.hitPoints / state.boss.maxHitPoints, 0, 1);
    state.bossName.setPosition(state.boss.x, state.boss.y - 92)
      .setText(`CRATER WARDEN  ${state.boss.hitPoints}/${state.boss.maxHitPoints}`);
    // Plain rects: a 3px-tall rounded rect with radius 2 is a degenerate shape that cost
    // ~3.5ms of triangulation every frame.
    state.bossBar.clear().fillStyle(0x201b19, 1)
      .fillRect(state.boss.x - 38, state.boss.y - 79, 76, 7)
      .fillStyle(0xd24d41, 1).fillRect(state.boss.x - 36, state.boss.y - 77, 72 * ratio, 3);
  }
  state.waterfall.setAlpha(0.7 + Math.sin(now * 0.004) * 0.12);
  return Boolean(state.grabbedVine);
}
