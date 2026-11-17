import { touchControls } from './mobileControls.js';
import { damageBoss, updateFinalBoss } from './finalBoss.js';
import { sfx } from './audio/soundManager.js';

// Enemy and sword sounds go through the sound manager (src/audio/soundManager.js):
// buffers are prepared once and voices are pooled, instead of building new oscillators,
// filters and noise buffers for every footstep and swing.
// Guardian cues are positional: they fade with distance from the camera and pan.
function playGuardianSound(scene, kind, enemy) {
  const big = enemy?.enemyKind === 'stone-guardian' || enemy?.isBoss;
  const name = { step: 'guardianStep', jump: 'guardianJump', impact: 'impact',
    attack: big ? 'bossWarn' : 'guardianAttack' }[kind];
  if (!name) return;
  // Big guardians' attack wind-up is a priority warning: always heard, not positional.
  if (name === 'bossWarn') { sfx(scene).play(name); return; }
  const x = enemy?.x ?? scene.player.x, y = enemy?.y ?? scene.player.y;
  sfx(scene).playAt(scene, name, x, y);
}

// kind 'swing': combo 0-2 rise in pitch, combo 3 is the heavy finisher.
// kind 'impact': stone or creature hit; kind 'deflect': rock parried back.
function playSwordSound(scene, kind, weight = 0, enemy = null) {
  if (kind === 'swing') {
    sfx(scene).play(['swing1', 'swing2', 'swing3', 'swingFinisher'][Math.min(3, weight)]);
  } else if (kind === 'deflect') {
    sfx(scene).play('deflect');
  } else {
    const stone = enemy?.enemyKind === 'stone-guardian' || enemy?.isBoss;
    sfx(scene).play(stone ? 'hitStone' : 'hitAnimal', { volume: weight > 0 ? 1.2 : 1, rate: weight > 0 ? 0.9 : 1 });
  }
}

function getEnemyHeadPoint(enemy) {
  const height = enemy.displayHeight || enemy.height || 28;
  const topFromAnchor = height * (enemy.originY ?? 0.5);
  return { x: enemy.x, y: enemy.y - topFromAnchor + Math.min(height * 0.25, 8) };
}

function showEnemyBlood(scene, enemy, x, y) {
  if (enemy.isBoss || enemy.enemyKind === 'stone-guardian') return;

  const splash = scene.add.graphics().setPosition(x, y).setDepth(enemy.depth + 4);
  splash.fillStyle(0x9f1728, 0.96);
  splash.fillRect(-3, -2, 7, 5);
  splash.fillRect(-7, -1, 3, 3);
  splash.fillRect(4, -5, 3, 3);
  splash.fillRect(1, 3, 3, 3);
  splash.fillStyle(0xd33b43, 0.95).fillRect(-1, -1, 3, 3);
  scene.tweens.add({
    targets: splash, y: y - 7, scaleX: 1.25, scaleY: 1.25, alpha: 0,
    duration: 300, ease: 'Cubic.easeOut', onComplete: () => splash.destroy()
  });

  for (const [dx, dy] of [[-8, -5], [7, -8], [3, 7]]) {
    const drop = scene.add.rectangle(x, y, 3, 4, 0xb51f31)
      .setDepth(enemy.depth + 4).setRotation(dx * 0.04);
    scene.tweens.add({
      targets: drop, x: x + dx, y: y + dy, alpha: 0,
      duration: 240, ease: 'Cubic.easeOut', onComplete: () => drop.destroy()
    });
  }
}

export function damageEnemy(scene, enemy, finisher = false, swordStrike = false) {
  // Two hits can land on the same frame (e.g. stomp + reflected rock); the second
  // must not touch an enemy whose body was already removed.
  if (!enemy?.active || !enemy.body?.enable) return;
  const killingBlow = enemy.hitPoints <= 1;
  const heavyImpact = finisher || (swordStrike && killingBlow);
  const highComboImpact = swordStrike && (scene.comboCount || 0) >= 5;
  if (swordStrike) playSwordSound(scene, 'impact', heavyImpact ? 1 : 0, enemy);
  const head = getEnemyHeadPoint(enemy);
  showEnemyBlood(scene, enemy, head.x, head.y);
  const burst = scene.add.graphics().setPosition(head.x, head.y + 5).setDepth(enemy.depth + 3);
  const burstColor = heavyImpact ? 0xffd36b : 0xffffff;
  burst.lineStyle(heavyImpact ? 3 : 2, burstColor, 1);
  for (let i = 0; i < 10; i++) {
    const angle = i * Math.PI / 5;
    burst.beginPath();
    burst.moveTo(Math.cos(angle) * 4, Math.sin(angle) * 4);
    burst.lineTo(Math.cos(angle) * (heavyImpact ? 24 : 17), Math.sin(angle) * (heavyImpact ? 24 : 17));
    burst.strokePath();
  }
  burst.fillStyle(0xffffff, 1).fillCircle(0, 0, heavyImpact ? 6 : 4);
  scene.tweens.add({ targets: burst, alpha: 0, scaleX: heavyImpact ? 2.2 : 1.8, scaleY: heavyImpact ? 2.2 : 1.8,
    duration: heavyImpact ? 270 : 210, ease: 'Cubic.easeOut', onComplete: () => burst.destroy() });
  const hitStopMs = heavyImpact || highComboImpact ? 100 : 65;
  scene.cameras.main.shake(heavyImpact || highComboImpact ? 130 : 90, heavyImpact || highComboImpact ? 0.014 : 0.007);
  scene.hitStopUntil = Math.max(scene.hitStopUntil || 0, scene.time.now + hitStopMs);
  // Arcade's timeScale is inverted: values above 1 slow physics down. The old 0.08 ran
  // ~12 physics steps per frame, so a "freeze" fast-forwarded bodies through floors.
  scene.physics.world.timeScale = 12.5;
  scene.time.delayedCall(hitStopMs, () => {
    const world = scene.physics?.world;
    if (!world || scene.hitStopUntil > scene.time.now) return;
    world.timeScale = 1;
    // Drop the time banked during the freeze so physics does not catch up in one burst.
    world._elapsed = 0;
  });
  if (finisher) scene.showFloatingText(enemy.x, enemy.y - 35, 'FINISHER!', '#ffd36b');
  if (enemy.hitPoints > 1) {
    enemy.hitPoints--;
    const now = scene.time.now;
    if (scene.currentLevel === 3 && enemy.enemyKind === 'stone-guardian') {
      enemy.nextHealthRecoveryAt = now + 7000;
    }
    enemy.stunnedUntil = now + (finisher ? 760 : 620);
    enemy.stunTintUntil = enemy.stunnedUntil;
    enemy.attackUntil = now;
    enemy.nextAttack = Math.max(enemy.nextAttack || 0, now + 900);
    const knockback = Math.sign(enemy.x - scene.player.x) || -enemy.patrolDirection || 1;
    const shove = swordStrike ? (finisher ? 250 : 175) : 105;
    enemy.setVelocity(knockback * shove, swordStrike ? (finisher ? -245 : -105) : -25);
    enemy.anims?.pause();
    enemy.setTint(0xffd36b);
    scene.time.delayedCall(enemy.stunnedUntil - now, () => {
      if (enemy.active && enemy.stunTintUntil <= scene.time.now) enemy.clearTint();
    });
    const stunMark = scene.add.text(head.x, head.y - 8, '✦', {
      fontFamily: 'sans-serif', fontSize: '16px', color: '#fff0a0',
      stroke: '#72451f', strokeThickness: 3
    }).setOrigin(0.5).setDepth(enemy.depth + 2);
    scene.tweens.add({ targets: stunMark, y: stunMark.y - 10, angle: 100, alpha: 0,
      duration: 420, ease: 'Cubic.easeOut', onComplete: () => stunMark.destroy() });
    const hitsLeft = enemy.hitPoints;
    scene.showFloatingText(head.x, head.y - 16, `${hitsLeft} HIT${hitsLeft === 1 ? '' : 'S'} LEFT`, '#ffe2a0');
    enemy.onHit?.(enemy);
    return;
  }
  scene.recordLevel3GuardianDefeat?.(enemy);
  scene.recordLevel6EnemyDefeat?.(enemy);
  scene.recordLevel8BossDefeat?.(enemy);
  scene.recordLevel9BossDefeat?.(enemy);
  enemy.onDefeat?.(enemy);
  if (swordStrike) {
    const knockback = Math.sign(enemy.x - scene.player.x) || -enemy.patrolDirection || 1;
    enemy.disableBody(true, false);
    enemy.setTint(heavyImpact ? 0xffd36b : 0xffffff);
    scene.tweens.add({
      targets: enemy,
      x: enemy.x + knockback * (heavyImpact ? 42 : 26),
      y: enemy.y - (heavyImpact ? 52 : 30),
      angle: knockback * (heavyImpact ? 24 : 12),
      alpha: 0,
      duration: heavyImpact ? 430 : 340,
      ease: 'Cubic.easeOut',
      onComplete: () => enemy.destroy()
    });
  } else {
    enemy.disableBody(true, true);
    enemy.destroy();
  }
  scene.awardComboPoints(200, enemy.x, enemy.y - 12);
  scene.updateHUD();
}

export function installCombat(scene) {
  scene.nextMeleeAttack = 0;
  scene.attackInputDown = false;
  scene.meleeAttackQueued = false;
  scene.swordComboStep = 0;
  scene.swordComboExpiresAt = 0;
  scene.rockProjectiles = scene.physics.add.group();
  if (!scene.textures.exists('guardian-rock')) {
    const texture = scene.textures.createCanvas('guardian-rock', 10, 10);
    const ctx = texture.context;
    ctx.fillStyle = '#343c39'; ctx.fillRect(2, 1, 6, 8); ctx.fillRect(1, 3, 8, 4);
    ctx.fillStyle = '#8e9787'; ctx.fillRect(2, 2, 5, 5); ctx.fillRect(4, 6, 4, 2);
    ctx.fillStyle = '#c3c5a5'; ctx.fillRect(3, 2, 3, 2);
    texture.refresh();
  }
  scene.physics.add.collider(scene.rockProjectiles, scene.collisionGround || scene.groundLayer,
    rock => retireRock(scene, rock), rock => !rock.reflected && projectileCanCollide(rock));
  scene.physics.add.overlap(scene.player, scene.rockProjectiles, (player, rock) => {
    if (!rock.active || rock.reflected || scene.isLevelFinished) return;
    scene.handlePlayerEnemyCollision(player, rock, true);
    retireRock(scene, rock);
  });
  scene.physics.add.overlap(scene.rockProjectiles, scene.enemies, (rock, enemy) => {
    if (!rock.active || !rock.reflected || !enemy.active || !enemy.body?.enable || scene.isLevelFinished) return;
    retireRock(scene, rock);
    if (enemy.isBoss) damageBoss(scene, enemy);
    else damageEnemy(scene, enemy);
  }, projectileCanCollide);
  if (scene.input.keyboard) {
    scene.meleeKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
  }
}

function meleeAttack(scene) {
  const now = scene.time.now;
  const attackDown = touchControls.attack || Boolean(scene.meleeKey?.isDown) ||
    Boolean(scene.input.activePointer?.leftButtonDown());
  const attackPressed = attackDown && !scene.attackInputDown;
  scene.attackInputDown = attackDown;
  if (attackPressed && !scene.meleeAttackQueued && !scene.isLevelFinished && scene.player.body?.enable) {
    if (now > scene.swordComboExpiresAt) scene.swordComboStep = 0;
    scene.queuedSwordComboStep = scene.swordComboStep;
    scene.swordComboStep = (scene.swordComboStep + 1) % 4;
    scene.meleeAttackQueued = true;
  }
  if (!scene.meleeAttackQueued || now < scene.nextMeleeAttack || scene.isLevelFinished || !scene.player.body?.enable) return;
  scene.meleeAttackQueued = false;
  scene.nextMeleeAttack = now + 340;
  scene.swordComboExpiresAt = now + 760;

  const player = scene.player;
  scene.meleeAnimationStartedAt = now;
  scene.meleeAnimationUntil = now + 340;
  const combo = scene.queuedSwordComboStep || 0;
  scene.swordActionSprite.setPosition(player.x, player.y).setFlipX(player.flipX)
    .setAlpha(0).setVisible(true).play(`player-sword-combo-${combo}`, true);
  const direction = player.flipX ? -1 : 1;
  const centerY = player.body.center.y;
  const reach = 48;
  const target = scene.enemies.getChildren()
    .filter(enemy => enemy.active && enemy.body?.enable &&
      (enemy.x - player.x) * direction >= -2 &&
      (enemy.x - player.x) * direction <= reach &&
      Math.abs(enemy.body.center.y - centerY) < 34)
    .sort((a, b) => Math.abs(a.x - player.x) - Math.abs(b.x - player.x))[0];
  const rockTarget = scene.rockProjectiles.getChildren()
    .filter(rock => rock.active && rock.body?.enable && !rock.reflected &&
      Math.abs(rock.x - player.x) <= 68 &&
      Math.abs(rock.body.center.y - centerY) < 46)
    .sort((a, b) => Math.abs(a.x - player.x) - Math.abs(b.x - player.x))[0];

  // Give each technique a distinct slash trail.
  const slash = scene.add.graphics().setPosition(player.x + direction * 5, centerY).setDepth(12);
  const trailColor = combo === 3 ? 0xffcf67 : 0xf4fbff;
  const drawArc = (width, alpha, start, end, radius = 34) => {
    slash.lineStyle(width, trailColor, alpha).beginPath();
    for (let i = 0; i <= 12; i++) {
      const angle = start + i / 12 * (end - start);
      const x = direction * Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) slash.moveTo(x, y); else slash.lineTo(x, y);
    }
    slash.strokePath();
  };
  if (combo === 0) {
    slash.lineStyle(8, trailColor, 0.9).beginPath()
      .moveTo(-direction * 17, -24).lineTo(direction * 23, 17).strokePath();
    drawArc(3, 1, -0.9, 0.55, 32);
  } else if (combo === 1) {
    drawArc(8, 0.9, -0.85, 0.65, 38);
    drawArc(3, 1, -0.85, 0.65, 38);
  } else if (combo === 2) {
    slash.lineStyle(8, trailColor, 0.9).beginPath()
      .moveTo(direction * 2, 0).lineTo(direction * 50, 0).strokePath();
    slash.lineStyle(3, 0xc7efff, 1).beginPath()
      .moveTo(direction * 7, -5).lineTo(direction * 43, -5).strokePath();
  } else {
    drawArc(9, 0.9, -0.1, 2.55, 42);
    drawArc(3, 1, -0.1, 2.55, 42);
  }
  scene.tweens.add({ targets: slash, alpha: 0, scaleX: 1.35, scaleY: 1.35,
    duration: 190, ease: 'Cubic.easeOut', onComplete: () => slash.destroy() });
  player.setTint(0xffefd0);
  scene.time.delayedCall(120, () => { if (player.active) player.clearTint(); });
  playSwordSound(scene, 'swing', combo);

  // Parry at the strike itself so a fast incoming rock cannot hit the player
  // during the sword's decorative follow-through delay.
  if (rockTarget) reflectRock(scene, rockTarget);
  if (!target && !rockTarget) return;
  // Resolve contacts during the visible blade follow-through.
  scene.time.delayedCall(130, () => {
    if (scene.isLevelFinished) return;
    if (target?.active && target.body?.enable) {
      if (target.isBoss) return;
      damageEnemy(scene, target, combo === 3, true);
    }
  });
}

function reflectRock(scene, rock) {
  const owner = rock.ownerEnemy;
  const target = owner?.active && owner.body?.enable ? owner : scene.enemies.getChildren()
    .filter(enemy => enemy.active && enemy.body?.enable)
    .sort((a, b) => Math.abs(a.x - rock.x) - Math.abs(b.x - rock.x))[0];
  if (!target) return;

  rock.reflected = true;
  rock.returnTarget = target;
  rock.setTint(0x8ee6ff).setDepth(13);
  rock.body.setAllowGravity(false);
  const dx = target.body.center.x - rock.body.center.x;
  const dy = target.body.center.y - rock.body.center.y;
  const distance = Math.max(1, Math.hypot(dx, dy));
  rock.setVelocity(dx / distance * 390, dy / distance * 390);
  scene.showFloatingText(rock.x, rock.y - 12, 'RETURN!', '#9fe8ff');
  playSwordSound(scene, 'deflect');
}

function patrolSurface(scene, column, row) {
  const tile = scene.groundLayer.getTileAt(column, row);
  return !!tile?.collides && !scene.groundLayer.getTileAt(column, row - 1)?.collides;
}

function patrolBounds(scene, column, row) {
  let first = column, last = column;
  while (first > 0 && patrolSurface(scene, first - 1, row)) first--;
  while (last < scene.map.width - 1 && patrolSurface(scene, last + 1, row)) last++;
  return { first, last };
}

export function setupEnemy(scene, enemy, index, variant = index % 3) {
  // Put each guardian on a nearby surface rather than letting a spawn over a pit fall.
  let surface = null, best = Infinity;
  if (!scene.level8Sanctum && !scene.level9Highlands && !scene.patrolTerrain) scene.groundLayer.forEachTile(tile => {
    if (tile.y < 3 || tile.y > 11 || !patrolSurface(scene, tile.x, tile.y)) return;
    const bounds = patrolBounds(scene, tile.x, tile.y);
    if (bounds.last - bounds.first < 2) return;
    const distance = Math.abs(tile.pixelX + 9 - enemy.x);
    if (distance > 72) return;
    const score = distance + Math.abs(tile.pixelY - (enemy.y + 9)) * 0.6;
    if (score < best) { surface = tile; best = score; }
  });
  if (surface) enemy.body.reset(surface.pixelX + 9, surface.pixelY - 9);
  enemy.guardianVariant = variant;
  enemy.patrolDirection = -1;
  enemy.attackUntil = 0;
  enemy.nextAttack = scene.time.now + 3000;
  enemy.nextFootstep = 0;
  enemy.patrolOrigin = enemy.x;
  enemy.nextJump = scene.time.now + 1000 + Math.random() * 2000;
  enemy.airSpeed = 0;
  if (enemy.enemyKind === 'stone-guardian') {
    enemy.play('stone-guardian-idle');
  } else {
    enemy.play(enemy.texture.key === 'enemy-guardians'
      ? `guardian-walk-${enemy.guardianVariant}` : 'enemy-walk');
  }
}

export function roamEnemy(scene, enemy, now, speed = scene.enemySpeed) {
  const body = enemy.body;
  if (body.top > scene.map.heightInPixels + 36) {
    enemy.destroy();
    return;
  }
  if (body.blocked.down) {
    enemy.airSpeed = 0;
    const width = scene.map.tileWidth, height = scene.map.tileHeight;
    const row = Math.floor((body.bottom + 2) / height);
    const aheadX = body.center.x + enemy.patrolDirection * (body.width / 2 + 6);
    const ahead = Math.floor(aheadX / width);
    const wall = body.blocked.left || body.blocked.right ||
      (!scene.level6Terrain && !scene.patrolTerrain && scene.groundLayer.getTileAt(ahead, row - 1)?.collides);
  const hasLevel8Support = () => {
    const state = scene.level8Sanctum;
    if (!state) return false;
    return state.supportPlatforms.some(platform => platform.active && platform.body?.enable &&
      aheadX >= platform.body.left - 3 && aheadX <= platform.body.right + 3 &&
      Math.abs(platform.body.top - body.bottom) <= 16);
  };
  const hasLevel9Support = () => {
    const state = scene.level9Highlands;
    if (!state) return false;
    const ledgeSupport = state.terrain.getChildren().some(platform => platform.active &&
      platform.body?.enable && aheadX >= platform.body.left - 3 &&
      aheadX <= platform.body.right + 3 && Math.abs(platform.body.top - body.bottom) <= 16);
    const logSupport = state.logs.some(log => log.image.active && log.image.body?.enable &&
      !log.sinking && aheadX >= log.image.body.left - 3 &&
      aheadX <= log.image.body.right + 3 && Math.abs(log.image.body.top - body.bottom) <= 16);
    return ledgeSupport || logSupport;
  };
  const gap = scene.level9Highlands ? !hasLevel9Support()
    : scene.level8Sanctum ? !hasLevel8Support()
      // Hand-made layouts (stages 10-28) expose the same probe as Level 6.
      : scene.patrolTerrain ? !scene.patrolTerrain.hasSupport(aheadX, body.bottom)
      : scene.level6Terrain ? !scene.level6Terrain.hasSupport(aheadX, body.bottom)
      : !scene.groundLayer.getTileAt(ahead, row)?.collides;
    if (body.left <= 2 || body.right >= scene.map.widthInPixels - 2) {
      enemy.patrolDirection = body.left <= 2 ? 1 : -1;
    } else if (scene.level6Terrain || scene.level8Sanctum || scene.level9Highlands || scene.patrolTerrain) {
      if (wall || gap) enemy.patrolDirection *= -1;
    } else if (now >= enemy.nextJump) {
      // Decide once per encounter; a skipped jump turns back instead of retrying every frame.
      if (wall || gap || Math.random() < 0.025) {
        enemy.nextJump = now + 900 + Math.random() * 1400;
        const choice = Math.random();
        if (choice < 0.2) {
          if (wall || gap) enemy.patrolDirection *= -1;
        } else {
          const strong = choice >= 0.4;
          enemy.airSpeed = strong ? 125 + Math.random() * 25 : 65 + Math.random() * 20;
          enemy.setVelocityY(strong ? -285 : -145);
          playGuardianSound(scene, 'jump', enemy);
        }
      }
    } else if (wall || gap) {
      enemy.patrolDirection *= -1;
    }
  } else if (body.blocked.left || body.blocked.right) {
    enemy.patrolDirection = body.blocked.left ? 1 : -1;
  }
  const targetSpeed = (enemy.airSpeed || speed) * enemy.patrolDirection;
  enemy.setVelocityX(Phaser.Math.Linear(body.velocity.x, targetSpeed, 0.28));
  if (body.blocked.down && Math.abs(targetSpeed) > 30 && now >= enemy.nextFootstep) {
    playGuardianSound(scene, 'step', enemy);
    enemy.nextFootstep = now + 430;
  }
  enemy.setFlipX(enemy.patrolDirection > 0);
  if (enemy.enemyKind === 'stone-guardian') {
    enemy.play(Math.abs(targetSpeed) > 20 ? 'stone-guardian-walk' : 'stone-guardian-idle', true);
  } else {
    enemy.play(enemy.texture.key === 'enemy-guardians'
      ? `guardian-walk-${enemy.guardianVariant}` : 'enemy-walk', true);
  }
}

export function throwRock(scene, enemy) {
  // Variant 1 is the black guardian; the other guardians only move and jump.
  if ((enemy.guardianVariant !== 1 && enemy.enemyKind !== 'stone-guardian') ||
      scene.currentLevel < 3 || scene.isLevelFinished || !enemy.active || !enemy.body?.enable) return null;
  const dx = scene.player.body.center.x - enemy.body.center.x;
  const direction = dx >= 0 ? 1 : -1;
  const rock = scene.rockProjectiles.create(enemy.body.center.x + direction * 15,
    enemy.body.center.y - 7, 'guardian-rock').setDepth(11);
  rock.ownerEnemy = enemy;
  const distance = scene.player.body.center.x - rock.x;
  const flightTime = Math.max(0.25, Math.min(1.1, Math.abs(distance) / 210));
  const level3Guardian = enemy.enemyKind === 'stone-guardian' && scene.currentLevel === 3;
  const lead = level3Guardian ? 0.72 : 0;
  const targetX = scene.player.body.center.x + scene.player.body.velocity.x * flightTime * lead;
  const targetY = scene.player.body.center.y + (level3Guardian
    ? scene.player.body.velocity.y * flightTime * 0.2 : 0);
  const gravity = scene.physics.world.gravity.y;
  rock.setVelocity((targetX - rock.x) / flightTime,
    (targetY - rock.y - 0.5 * gravity * flightTime * flightTime) / flightTime);
  rock.body.setSize(8, 8).setOffset(1, 1);
  scene.time.delayedCall(2500, () => retireRock(scene, rock));
  return rock;
}

export function projectileCanCollide(projectile) {
  return !!(projectile?.active && projectile.body?.enable);
}

// Keep the body intact until Phaser finishes every collision and body update.
// Tile collisions can continue iterating after the first contact callback.
export function retireRock(scene, rock) {
  if (!rock?.active) return;
  rock.setActive(false).setVisible(false);
  if (rock.body) {
    rock.body.stop();
    rock.body.enable = false;
  }
  scene.events.once('postupdate', () => {
    if (rock.scene && !rock.active) rock.destroy();
  });
}

export function updateCombat(scene) {
  const now = scene.time.now;
  meleeAttack(scene);
  scene.rockProjectiles?.getChildren().forEach(rock => {
    const target = rock.returnTarget;
    if (!rock.active || !rock.reflected || !rock.body?.enable || !target?.active || !target.body?.enable) return;
    const dx = target.body.center.x - rock.body.center.x;
    const dy = target.body.center.y - rock.body.center.y;
    const distance = Math.max(1, Math.hypot(dx, dy));
    rock.setVelocity(dx / distance * 390, dy / distance * 390);
  });
  scene.enemies.getChildren().forEach(enemy => {
    if (!enemy.active || !enemy.body?.enable) return;
    // Mini-bosses (src/mechanics/miniBoss.js) run their own behaviour.
    if (enemy.customAI) return;
    if (enemy.isBoss) { updateFinalBoss(scene, enemy, now); return; }
    if (enemy.body.top > scene.map.heightInPixels + 36) { enemy.destroy(); return; }
    if (scene.currentLevel === 3 && enemy.enemyKind === 'stone-guardian' &&
        enemy.hitPoints < enemy.maxHitPoints && enemy.nextHealthRecoveryAt &&
        now >= enemy.nextHealthRecoveryAt) {
      enemy.hitPoints++;
      enemy.nextHealthRecoveryAt = enemy.hitPoints < enemy.maxHitPoints ? now + 5500 : 0;
      scene.showFloatingText(enemy.x, enemy.y - 30,
        `RECOVERED ${enemy.hitPoints} / ${enemy.maxHitPoints}`, '#9fe8b1');
      enemy.setTint(0x9fe8b1);
      scene.time.delayedCall(420, () => {
        if (enemy.active && !enemy.stunnedUntil) enemy.clearTint();
      });
    }
    if (now < (enemy.stunnedUntil || 0)) {
      enemy.setVelocityX(0);
      return;
    }
    if (enemy.stunnedUntil) {
      enemy.stunnedUntil = 0;
      enemy.anims?.resume();
    }
    const dx = scene.player.x - enemy.x;
    const dy = Math.abs(scene.player.body.center.y - enemy.body.center.y);
    if (now < enemy.attackUntil) { enemy.setVelocityX(0); return; }
    if (enemy.enemyKind === 'stone-guardian') {
      if (Math.abs(dx) < 52 && dy < 34 && enemy.body.blocked.down && now >= enemy.nextAttack) {
        enemy.setVelocityX(0);
        enemy.setFlipX(dx > 0);
        enemy.attackUntil = now + 720;
        enemy.nextAttack = now + 1900;
        playGuardianSound(scene, 'attack', enemy);
        enemy.play('stone-guardian-slam', true);
        scene.time.delayedCall(390, () => {
          if (!enemy.active || !enemy.body?.enable || scene.isLevelFinished ||
              scene.time.now < (enemy.stunnedUntil || 0) || !scene.player.body?.enable) return;
          if (Math.abs(scene.player.x - enemy.x) < 58 &&
              Math.abs(scene.player.body.center.y - enemy.body.center.y) < 38) {
            playGuardianSound(scene, 'impact', enemy);
            scene.handlePlayerEnemyCollision(scene.player, enemy, true);
          }
        });
        return;
      }
      if (scene.currentLevel >= 3 && Math.abs(dx) >= 76 && Math.abs(dx) < 270 && dy < 130 &&
          enemy.body.blocked.down && now >= enemy.nextAttack) {
        enemy.setVelocityX(0);
        enemy.setFlipX(dx > 0);
        enemy.attackUntil = now + 760;
        enemy.nextAttack = now + 2200;
        enemy.play('stone-guardian-throw', true);
        playGuardianSound(scene, 'attack', enemy);
        scene.time.delayedCall(420, () => {
          if (!enemy.active || !enemy.body?.enable || scene.isLevelFinished ||
              scene.time.now < (enemy.stunnedUntil || 0)) return;
          const rock = throwRock(scene, enemy);
          if (rock) playGuardianSound(scene, 'impact', enemy);
        });
        return;
      }
      const pursuitRange = scene.currentLevel === 3 ? 420 : 220;
      const pursuing = Math.abs(dx) < pursuitRange;
      enemy.patrolDirection = pursuing ? (dx >= 0 ? 1 : -1) : enemy.patrolDirection;
      // Keep the giant guardian's jump timer active so it can pursue the player
      // across ledges instead of walking in place at a gap.
      const chaseMultiplier = scene.currentLevel === 3 ? 0.8 : 0.55;
      roamEnemy(scene, enemy, now, pursuing ? scene.enemySpeed * chaseMultiplier : scene.enemySpeed * 0.4);
      return;
    }
    const customEnemy = enemy.texture.key === 'enemy-guardians';
    const canFight = customEnemy;
    if (canFight && Math.abs(dx) < 28 && dy < 24 && enemy.body.blocked.down && now >= enemy.nextAttack) {
        enemy.setVelocityX(0);
        enemy.setFlipX(dx > 0);
        enemy.attackUntil = now + 650;
        enemy.nextAttack = now + 1200;
        playGuardianSound(scene, 'attack', enemy);
        enemy.play(`guardian-attack-${enemy.guardianVariant}`);
        scene.time.delayedCall(220, () => {
          if (!enemy.active || !enemy.body?.enable || scene.isLevelFinished || !scene.player.body?.enable) return;
          if (Math.abs(scene.player.x - enemy.x) < 32 &&
              Math.abs(scene.player.body.center.y - enemy.body.center.y) < 26) {
            playGuardianSound(scene, 'impact', enemy);
            scene.handlePlayerEnemyCollision(scene.player, enemy, true);
          }
        });
      return;
    }
    if (enemy.guardianVariant === 2 && scene.currentLevel >= 3 && Math.abs(dx) < 360 && dy < 120) {
      enemy.patrolDirection = dx >= 0 ? 1 : -1;
      roamEnemy(scene, enemy, now, scene.enemySpeed * 1.6);
      return;
    }
    if (customEnemy && enemy.guardianVariant === 1 && scene.currentLevel >= 3 && Math.abs(dx) < 240 && dy < 100 &&
        enemy.body.blocked.down && now >= enemy.nextAttack) {
      enemy.setFlipX(dx > 0);
      enemy.setVelocityX(0);
      enemy.attackUntil = now + 700;
      enemy.nextAttack = now + 3000;
      playGuardianSound(scene, 'attack', enemy);
      enemy.play(`guardian-attack-${enemy.guardianVariant}`);
      // The raised-arm and extended-arm frames now form the rock-throw animation.
      scene.time.delayedCall(350, () => {
        throwRock(scene, enemy);
      });
      return;
    }
    roamEnemy(scene, enemy, now);
  });
}
