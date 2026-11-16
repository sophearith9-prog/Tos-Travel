import { LEVEL8 } from './levels/level8Layout.js';
import { touchControls } from './mobileControls.js';
import { addLevel8KhmerShop } from './level8Shop.js';
import { bakeCentered, bakeGraphics } from './bakeGraphics.js';

function createSanctumTexture(scene) {
  if (!scene.textures.exists('level8-mekong-islet')) {
    const texture = scene.textures.createCanvas('level8-mekong-islet', 128, 32);
    const ctx = texture.context;
    // A continuous moss-and-silt cap over irregular river stones, matching
    // the rocky Mekong islets instead of the previous cut temple masonry.
    ctx.fillStyle = '#484b40'; ctx.fillRect(0, 8, 128, 24);
    ctx.fillStyle = '#596052'; ctx.fillRect(0, 10, 128, 17);
    ctx.fillStyle = '#69705a'; ctx.fillRect(0, 7, 128, 5);
    ctx.fillStyle = '#a18b62'; ctx.fillRect(0, 5, 128, 4);
    ctx.fillStyle = '#788455'; ctx.fillRect(0, 2, 128, 5);
    ctx.fillStyle = '#526b47'; ctx.fillRect(0, 1, 128, 3);
    ctx.fillStyle = '#c0a979'; ctx.fillRect(7, 5, 21, 1);
    ctx.fillRect(55, 6, 18, 1); ctx.fillRect(97, 4, 23, 1);
    // Weather-rounded stone facets with shadows; the pattern tiles cleanly.
    for (let x = 0; x < 128; x += 16) {
      const y = 12 + (Math.floor(x / 16) % 3) * 4;
      ctx.fillStyle = '#444b43'; ctx.fillRect(x, y + 5, 13, 8);
      ctx.fillStyle = x % 32 ? '#747360' : '#858069';
      ctx.fillRect(x + 1, y, 12, 7);
      ctx.fillStyle = '#a09776'; ctx.fillRect(x + 3, y, 6, 2);
      ctx.fillStyle = '#555e50'; ctx.fillRect(x + 5, y + 8, 7, 2);
    }
    // Moss clumps and small bank plants break up the flat top edge.
    for (const [x, h] of [[12, 3], [39, 2], [82, 3], [111, 2]]) {
      ctx.fillStyle = '#36583e'; ctx.fillRect(x, 1 - h, 3, h + 3);
      ctx.fillStyle = '#779455'; ctx.fillRect(x + 3, 1, 3, 3);
      ctx.fillStyle = '#a4ad67'; ctx.fillRect(x + 1, 0, 2, 1);
    }
    ctx.fillStyle = '#a5b19a'; ctx.fillRect(18, 15, 2, 1);
    ctx.fillRect(70, 23, 2, 1); ctx.fillRect(117, 18, 2, 1);
    texture.refresh();
    texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
  }
  if (!scene.textures.exists('level8-sanctum-relic')) {
    const texture = scene.textures.createCanvas('level8-sanctum-relic', 24, 28);
    const ctx = texture.context;
    ctx.fillStyle = '#513a21'; ctx.beginPath(); ctx.moveTo(12, 1);
    ctx.lineTo(22, 10); ctx.lineTo(18, 24); ctx.lineTo(12, 27);
    ctx.lineTo(6, 24); ctx.lineTo(2, 10); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e6b94d'; ctx.beginPath(); ctx.moveTo(12, 3);
    ctx.lineTo(19, 10); ctx.lineTo(16, 21); ctx.lineTo(12, 24);
    ctx.lineTo(8, 21); ctx.lineTo(5, 10); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff1a1'; ctx.fillRect(10, 6, 3, 11);
    texture.refresh();
    texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
  }
  if (!scene.textures.exists('level8-sanctum-dart')) {
    const texture = scene.textures.createCanvas('level8-sanctum-dart', 24, 8);
    const ctx = texture.context;
    ctx.fillStyle = '#3c302b'; ctx.fillRect(2, 2, 17, 4);
    ctx.fillStyle = '#b9c7ad'; ctx.fillRect(4, 1, 13, 2);
    ctx.fillStyle = '#e0b967'; ctx.beginPath(); ctx.moveTo(24, 4);
    ctx.lineTo(17, 0); ctx.lineTo(17, 8); ctx.closePath(); ctx.fill();
    texture.refresh();
    texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
  }
}

function addSwitch(scene, item, index, state) {
  const y = item.y - 14;
  // Draw around a local origin and bake both states once. The old Graphics was drawn in
  // world coordinates and scale-tweened, so it pulsed around the map origin (sliding
  // across the level) and was re-triangulated every frame.
  const drawPad = (graphics, fill, fillAlpha, edge, outer, inner, innerRadius) => graphics
    .fillStyle(fill, fillAlpha).fillRoundedRect(-17, -8, 34, 18, 4)
    .lineStyle(2, edge, 1).strokeRoundedRect(-17, -8, 34, 18, 4)
    .fillStyle(outer, 1).fillCircle(0, 0, 7)
    .fillStyle(inner, 1).fillCircle(0, 0, innerRadius);
  const art = bakeCentered(scene, drawPad(scene.add.graphics(), 0x262b27, 0.95, 0xb78742, 0x8c5b33, 0xf4c967, 4),
    'level8-switch-idle', 20).setPosition(item.x, y + 2).setDepth(4);
  const activeArt = bakeCentered(scene, drawPad(scene.add.graphics(), 0x294334, 1, 0x9de5a6, 0x8be0a0, 0xd4ffe0, 3),
    'level8-switch-active', 20).setPosition(item.x, y + 2).setDepth(4).setVisible(false);
  let activated = false;
  const sensor = scene.add.zone(item.x, y, 34, 30);
  scene.physics.add.existing(sensor, true);
  scene.physics.add.overlap(scene.player, sensor, () => {
    if (activated || scene.isLevelFinished) return;
    activated = true;
    state.switches[index] = true;
    art.setVisible(false);
    activeArt.setVisible(true);
    scene.showFloatingText(item.x, y - 18, `${item.label} SWITCH ${state.switches.filter(Boolean).length}/3`, '#b9f4c0');
    scene.cameras.main.flash(140, 70, 120, 92, false);
    updateObjective(scene, state);
    maybeOpenSanctum(scene, state);
  });
  scene.tweens.add({ targets: [art, activeArt], scale: 1.12, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
}

function updateObjective(scene, state) {
  state.objective?.setText(`SWITCHES ${state.switches.filter(Boolean).length}/3  ·  RELICS ${state.relicCount}/10`);
}

function maybeOpenSanctum(scene, state) {
  if (state.exitOpen || !state.bossDefeated || state.switches.some(active => !active)) return;
  state.exitOpen = true;
  state.exitBlocker.body.enable = false;
  scene.tweens.add({ targets: state.exitBlocker, alpha: 0, y: state.exitBlocker.y - 54,
    duration: 520, ease: 'Cubic.easeIn' });
  state.portal.clear();
  state.portal.lineStyle(5, 0xffd86b, 0.95).strokeEllipse(0, 0, 70, 105);
  state.portal.lineStyle(2, 0xfff1a9, 0.9).strokeEllipse(0, 0, 54, 88);
  state.portal.fillStyle(0x8fe7e5, 0.2).fillEllipse(0, 0, 48, 80);
  state.gateLabel.setText('PORTAL OPEN').setColor('#bdf6db');
  scene.showFloatingText(state.exitX, state.exitY - 62, 'THE SANCTUM GATE IS OPEN!', '#d8ffc6');
  scene.cameras.main.shake(180, 0.006);
}

export function addLevel8SanctumBackdrop(scene) {
  const key = 'level8-sanctum-sky';
  if (scene.textures.exists(key)) {
    const source = scene.textures.get(key).getSourceImage();
    const scale = Math.max(scene.map.widthInPixels / source.width,
      scene.map.heightInPixels / source.height);
    const sky = scene.add.image(scene.map.widthInPixels / 2, scene.map.heightInPixels / 2,
      key).setDisplaySize(source.width * scale, source.height * scale)
      .setScrollFactor(0.24, 0.34).setDepth(-30);
    sky.setTint(0xf1fbf4);
  }
  const title = scene.screenText(400, 126, 'FLOATING SANCTUARY  ·  KHMER MARKET RUINS', {
    fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '14px',
    fontStyle: 'bold', color: '#f3e3ae', stroke: '#172b2b', strokeThickness: 4
  }).setOrigin(0.5).setDepth(150);
  scene.tweens.add({ targets: title, alpha: 0, delay: 2200, duration: 550 });
}

export function installLevel8Sanctum(scene) {
  createSanctumTexture(scene);
  const terrain = scene.physics.add.staticGroup();
  const state = {
    terrain, moving: [], collapsers: [], vines: [], spikes: [], darts: [],
    switches: [false, false, false], relicCount: 0, bossDefeated: false,
    exitOpen: false, boss: null
  };

  for (const ledge of LEVEL8.ledges) {
    if (ledge.collapsing) {
      const image = scene.physics.add.image(ledge.x + ledge.width / 2, ledge.y + 16,
        'level8-mekong-islet').setDisplaySize(ledge.width, 32).setDepth(-2);
      image.body.setAllowGravity(false).setImmovable(true).setSize(128, 10).setOffset(0, 0);
      state.collapsers.push({ ledge, image, triggered: false });
      continue;
    }
    const image = scene.add.tileSprite(ledge.x, ledge.y, ledge.width, 32,
      'level8-mekong-islet').setOrigin(0, 0).setDepth(-2);
    const body = scene.add.rectangle(ledge.x + ledge.width / 2, ledge.y + 5,
      ledge.width, 10, 0xffffff, 0);
    terrain.add(body);
    body.body.checkCollision.down = false;
    body.body.checkCollision.left = false;
    body.body.checkCollision.right = false;
    body.level8Art = image;
  }

  for (const spec of LEVEL8.movingPlatforms) {
    const platform = scene.physics.add.image(spec.x, spec.y + 16, 'level8-mekong-islet')
      .setDisplaySize(spec.width, 32).setDepth(-1);
    platform.body.setAllowGravity(false).setImmovable(true).setSize(128, 10).setOffset(0, 0);
    platform.setData('level8Spec', spec);
    platform.body.setVelocityY(spec.speed);
    state.moving.push(platform);
  }

  for (const vine of LEVEL8.vines) {
    const art = scene.add.graphics().setDepth(1);
    art.lineStyle(4, 0x356a42, 0.95).beginPath().moveTo(vine.x, vine.y)
      .lineTo(vine.x + 2, vine.y + vine.height).strokePath();
    for (let y = vine.y + 14; y < vine.y + vine.height; y += 28) {
      art.lineStyle(2, 0x8aaa58, 0.9).beginPath().moveTo(vine.x, y)
        .lineTo(vine.x + (y % 2 ? 10 : -10), y + 10).strokePath();
    }
    const zone = scene.add.zone(vine.x, vine.y + vine.height / 2, 26, vine.height);
    scene.physics.add.existing(zone, true);
    state.vines.push({ vine, zone });
  }

  // The false wall has no physics body; walking through it reveals the relic alcove.
  const fakeWall = scene.add.graphics().setDepth(3);
  fakeWall.fillStyle(0x4b4a3b, 1).fillRect(362, 758, 20, 64);
  fakeWall.fillStyle(0x817652, 1).fillRect(365, 760, 14, 8);
  fakeWall.fillStyle(0x263d2f, 1).fillRect(366, 773, 4, 20).fillRect(374, 785, 4, 28);
  fakeWall.fillStyle(0xc5a354, 1).fillRect(368, 803, 3, 3);
  fakeWall.setAlpha(0.92);

  // Ten optional relics reward the false-wall alcove and careful exploration.
  state.relics = scene.physics.add.staticGroup();
  LEVEL8.treasures.forEach((treasure, index) => {
    const relic = state.relics.create(treasure.x, treasure.y, 'level8-sanctum-relic');
    relic.setDepth(7).setScale(0.8 + (index % 3) * 0.08);
    relic.setData('collected', false);
    scene.tweens.add({ targets: relic, y: relic.y - 5, duration: 620 + (index % 3) * 90,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: index * 60 });
  });

  for (const statue of LEVEL8.dartStatues) {
    const art = scene.add.graphics().setDepth(5);
    art.fillStyle(0x393932, 1).fillRect(statue.x - 15, statue.y - 30, 30, 38);
    art.fillStyle(0xa28a58, 1).fillRect(statue.x - 11, statue.y - 24, 22, 5);
    art.fillStyle(0x222c28, 1).fillRect(statue.x - 8, statue.y - 13, 16, 11);
    art.fillStyle(0x5b8754, 1).fillRect(statue.x - 17, statue.y - 4, 34, 6);
    state.darts.push(statue);
    scene.time.delayedCall(statue.phase, () => {
      scene.time.addEvent({ delay: statue.interval, loop: true, callback: () => fireDart(scene, statue) });
    });
  }

  for (const trap of LEVEL8.swingingSpikes) {
    const swing = scene.add.container(trap.x, trap.y).setDepth(6);
    const chain = scene.add.graphics();
    chain.lineStyle(3, 0x48443c, 1).beginPath().moveTo(0, 0).lineTo(0, 42).strokePath();
    const head = scene.add.graphics();
    head.fillStyle(0x71654f, 1).fillCircle(0, 48, 13);
    for (let point = -2; point <= 2; point++) {
      head.fillStyle(0xc2b48d, 1).fillTriangle(point * 5 - 3, 53, point * 5 + 3, 53, point * 5, 69);
    }
    // Bake the static chain + spiked head; the image keeps the container's swing pivot (0, 0).
    swing.add([
      ...bakeGraphics(scene, chain, 'level8-spike-chain', { x: -3, y: -2, width: 6, height: 46 }),
      ...bakeGraphics(scene, head, 'level8-spike-head', { x: -16, y: 33, width: 32, height: 38 })
    ]);
    scene.tweens.add({ targets: swing, angle: 36, duration: 720, yoyo: true,
      repeat: -1, ease: 'Sine.easeInOut' });
    // Keep damage aligned to the spiked head rather than the whole chain.
    const zone = scene.add.zone(trap.x, trap.y + 47, 96, 54);
    scene.physics.add.existing(zone, true);
    zone.body.enable = false;
    state.spikes.push({ trap, swing, zone, active: false });
  }

  state.objective = scene.add.text(400, 96, '', {
    fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '11px',
    fontStyle: 'bold', color: '#fff0bf', stroke: '#172820', strokeThickness: 3
  }).setScrollFactor(0).setOrigin(0.5).setDepth(220);
  updateObjective(scene, state);

  state.exitX = LEVEL8.finish.x;
  state.exitY = LEVEL8.finish.floorY - 50;
  state.portal = scene.add.graphics({ x: state.exitX, y: state.exitY }).setDepth(2);
  state.portal.lineStyle(4, 0x977949, 0.9).strokeEllipse(0, 0, 56, 84);
  state.portal.lineStyle(2, 0xa4cad0, 0.7).strokeEllipse(0, 0, 42, 68);
  const blocker = scene.add.rectangle(state.exitX - 38, state.exitY + 24, 12, 96, 0x65543c, 0.95).setDepth(5);
  scene.physics.add.existing(blocker, true);
  state.exitBlocker = blocker;
  state.exitLabel = scene.add.text(state.exitX, state.exitY - 56, 'SEALED', {
    fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '10px',
    fontStyle: 'bold', color: '#f4cb75', stroke: '#211c16', strokeThickness: 3
  }).setOrigin(0.5).setDepth(10);
  state.gateLabel = state.exitLabel;
  scene.level8Sanctum = state;
  // Reuse this collision list during enemy updates; rebuilding it every frame
  // creates needless garbage while the enemies patrol the floating ledges.
  state.supportPlatforms = [
    ...terrain.getChildren(),
    ...state.moving,
    ...state.collapsers.map(item => item.image)
  ];
  scene.recordLevel8BossDefeat = enemy => {
    if (scene.currentLevel !== 8 || !enemy.level8Boss || state.bossDefeated) return;
    state.bossDefeated = true;
    state.bossName?.setText('NAGA SHADE DEFEATED').setColor('#bff1c1');
    scene.showFloatingText(enemy.x, enemy.y - 40, 'SANCTUM GUARDIAN DEFEATED', '#ffe39a');
    maybeOpenSanctum(scene, state);
  };
  return terrain;
}

function fireDart(scene, statue) {
  if (scene.isLevelFinished || !scene.scene.isActive()) return;
  const dart = scene.physics.add.image(statue.x + statue.direction * 17, statue.y - 7,
    'level8-sanctum-dart').setDepth(7);
  dart.setFlipX(statue.direction < 0);
  dart.body.setAllowGravity(false).setVelocityX(statue.direction * 280);
  const overlap = scene.physics.add.overlap(scene.player, dart, (player, projectile) => {
    if (!projectile.active) return;
    projectile.destroy();
    scene.handlePlayerEnemyCollision(player, { x: player.x < statue.x ? player.x + 20 : player.x - 20 }, true);
  });
  // Each dart gets its own overlap; remove it with the dart or the world's
  // collider list grows for as long as the statues keep firing.
  dart.once('destroy', () => overlap.destroy());
  scene.time.delayedCall(2400, () => { if (dart.active) dart.destroy(); });
}

function startCollapse(scene, tile) {
  if (tile.triggered || scene.isLevelFinished) return;
  tile.triggered = true;
  scene.cameras.main.shake(90, 0.003);
  scene.tweens.add({ targets: tile.image, x: tile.image.x + 3, duration: 50,
    yoyo: true, repeat: 4, onComplete: () => {
      if (!tile.image.active) return;
      tile.image.body.checkCollision.none = true;
      tile.image.body.setImmovable(false).setAllowGravity(true).setVelocityY(180);
      scene.time.delayedCall(700, () => { if (tile.image.active) tile.image.destroy(); });
    }
  });
}

export function attachLevel8Sanctum(scene) {
  const state = scene.level8Sanctum;
  if (!state || scene.currentLevel !== 8) return;
  for (const tile of state.collapsers) {
    scene.physics.add.collider(scene.player, tile.image);
    scene.physics.add.overlap(scene.player, tile.image, (player) => {
      if (player.body.velocity.y >= 0 && player.body.bottom <= tile.image.body.top + 14) startCollapse(scene, tile);
    });
  }
  for (const platform of state.moving) scene.physics.add.collider(scene.player, platform);
  scene.physics.add.collider(scene.enemies, state.terrain);
  for (const platform of state.moving) scene.physics.add.collider(scene.enemies, platform);
  // Switch overlaps are connected after the player exists.
  LEVEL8.switches.forEach((item, index) => addSwitch(scene, item, index, state));
  scene.physics.add.overlap(scene.player, state.relics, (player, relic) => {
    if (relic.getData('collected')) return;
    relic.setData('collected', true);
    relic.disableBody(true, true);
    state.relicCount++;
    scene.coins += 1;
    scene.score += 300;
    scene.updateHUD();
    scene.showFloatingText(relic.x, relic.y - 18, `RELIC ${state.relicCount}/10  +300`, '#ffe58d');
    updateObjective(scene, state);
  });
  scene.physics.add.collider(scene.player, state.exitBlocker);
  let boss = scene.enemies.getChildren().find(enemy => enemy.level8Boss);
  if (!boss) {
    // Recover gracefully if a level config omitted the boss marker so the gate
    // can never demand a guardian that was not spawned.
    boss = scene.enemies.getChildren().find(enemy => enemy.enemyKind === 'stone-guardian');
    if (boss) boss.level8Boss = true;
  }
  if (!boss && scene.textures.exists('stone-guardian')) {
    const scale = 82 / 256;
    boss = scene.enemies.create(1820, 676, 'stone-guardian', 0)
      .setScale(scale).setOrigin(0.5, 1).setDepth(8).setCollideWorldBounds(true);
    boss.body.setSize(32 / scale, 27 / scale)
      .setOffset((boss.width - 32 / scale) / 2, boss.height - 27 / scale);
    boss.enemyKind = 'stone-guardian';
    boss.level8Boss = true;
    boss.guardianVariant = 2;
    boss.patrolDirection = -1;
    boss.attackUntil = 0;
    boss.nextAttack = scene.time.now + 1600;
    boss.nextFootstep = 0;
    boss.patrolOrigin = boss.x;
    boss.nextJump = scene.time.now + 1200;
    boss.airSpeed = 0;
    boss.setVelocityX(-scene.enemySpeed);
    boss.play('stone-guardian-idle');
    scene.physics.add.collider(boss, state.terrain);
  }
  if (boss) {
    state.boss = boss;
    boss.setActive(true).setVisible(true).setAlpha(1).setPosition(1820, 676);
    boss.body.enable = true;
    boss.body.reset(1820, 676);
    boss.hitPoints = boss.maxHitPoints = 8;
    boss.isLargeGuardian = true;
    state.bossName = scene.add.text(boss.x, boss.y - 92, 'NAGA SHADE  8/8', {
      fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '10px',
      fontStyle: 'bold', color: '#ffe1a0', stroke: '#20170f', strokeThickness: 3
    }).setOrigin(0.5).setDepth(18);
    state.bossBar = scene.add.graphics().setDepth(18);
    // Ellipse shapes triangulate once; a Graphics ellipse was re-triangulated every frame.
    state.bossAura = scene.add.container(boss.x, boss.y - 30).setDepth(7).add([
      scene.add.ellipse(0, 0, 72, 84, 0x55799a, 0.18),
      scene.add.ellipse(0, 0, 78, 90).setStrokeStyle(2, 0x9ce2dd, 0.42)
    ]);
    boss.once('destroy', () => {
      state.bossName?.destroy();
      state.bossBar?.destroy();
      state.bossAura?.destroy();
    });
  }
  scene.level8Shop = addLevel8KhmerShop(scene);
}

export function updateLevel8Sanctum(scene, delta) {
  const state = scene.level8Sanctum;
  if (!state || scene.currentLevel !== 8) return;
  for (const platform of state.moving) {
    const spec = platform.getData('level8Spec');
    if (platform.y >= spec.maxY) platform.body.setVelocityY(-spec.speed);
    else if (platform.y <= spec.minY) platform.body.setVelocityY(spec.speed);
  }

  const climb = Boolean(scene.cursors?.up.isDown || scene.wasd?.up.isDown || touchControls.jump);
  const vine = state.vines.find(item => Phaser.Geom.Intersects.RectangleToRectangle(
    scene.player.getBounds(), item.zone.getBounds()));
  if (vine) {
    scene.player.body.allowGravity = false;
    scene.player.setVelocityY(climb ? -138 : 0);
    scene.player.setVelocityX(0);
    scene.player.setFlipX(false);
    scene.player.play(climb ? 'player-jump' : 'player-idle', true);
    scene.player.setData('level8Climbing', true);
  } else if (scene.player.getData('level8Climbing')) {
    scene.player.body.allowGravity = true;
    scene.player.setData('level8Climbing', false);
  }

  const now = scene.time.now;
  for (const trap of state.spikes) {
    const phase = (now + trap.trap.phase) % trap.trap.interval;
    const active = phase < trap.trap.activeFor;
    if (active !== trap.active) {
      trap.active = active;
      trap.zone.body.enable = active;
      trap.swing.setAlpha(active ? 1 : 0.52);
    }
    if (active && Phaser.Geom.Intersects.RectangleToRectangle(scene.player.getBounds(), trap.zone.getBounds())) {
      if (!scene.isInvulnerable && now >= (trap.cooldownUntil || 0)) {
        trap.cooldownUntil = now + 750;
        scene.handlePlayerEnemyCollision(scene.player, { x: trap.trap.x }, true);
      }
    }
  }
  if (state.boss?.active) {
    state.bossAura?.setPosition(state.boss.x, state.boss.y - 30);
    state.bossName?.setPosition(state.boss.x, state.boss.y - 92)
      .setText(`NAGA SHADE  ${Math.max(0, state.boss.hitPoints)}/${state.boss.maxHitPoints}`);
    const ratio = Phaser.Math.Clamp(state.boss.hitPoints / state.boss.maxHitPoints, 0, 1);
    // Plain rects: a 3px-tall rounded rect with radius 2 is a degenerate shape that cost
    // ~2ms of triangulation every frame.
    state.bossBar?.clear().fillStyle(0x211817, 1).fillRect(state.boss.x - 34, state.boss.y - 80, 68, 7)
      .fillStyle(0xd84e58, 1).fillRect(state.boss.x - 32, state.boss.y - 78, 64 * ratio, 3);
  }
}
