import { touchControls } from './mobileControls.js';
import { damageBoss, updateFinalBoss } from './finalBoss.js';
import { addArrowAmmo, MAX_ARROW_AMMO } from './arrowRules.js';
import { TOTAL_LEVELS } from './levels/provinceRoute.js';

export function installCombat(scene) {
  scene.arrows = Math.min(MAX_ARROW_AMMO,
    Math.max(0, scene.currentLevel >= 4 ? (scene.arrows || 0) : 0));
  scene.nextShot = 0;
  scene.arrowProjectiles = scene.physics.add.group({ allowGravity: false });
  scene.rockProjectiles = scene.physics.add.group();
  if (!scene.textures.exists('guardian-rock')) {
    const texture = scene.textures.createCanvas('guardian-rock', 10, 10);
    const ctx = texture.context;
    ctx.fillStyle = '#343c39'; ctx.fillRect(2, 1, 6, 8); ctx.fillRect(1, 3, 8, 4);
    ctx.fillStyle = '#8e9787'; ctx.fillRect(2, 2, 5, 5); ctx.fillRect(4, 6, 4, 2);
    ctx.fillStyle = '#c3c5a5'; ctx.fillRect(3, 2, 3, 2);
    texture.refresh();
  }
  scene.physics.add.collider(scene.rockProjectiles, scene.groundLayer,
    rock => retireRock(scene, rock), projectileCanCollide);
  scene.physics.add.overlap(scene.player, scene.rockProjectiles, (player, rock) => {
    if (!rock.active || scene.isLevelFinished) return;
    scene.handlePlayerEnemyCollision(player, rock, true);
    retireRock(scene, rock);
  });
  if (!scene.textures.exists('bow-arrow')) {
    const texture = scene.textures.createCanvas('bow-arrow', 24, 8);
    const ctx = texture.context;
    ctx.fillStyle = '#b77d38'; ctx.fillRect(3, 3, 17, 2);
    ctx.fillStyle = '#ffe5a3'; ctx.fillRect(0, 1, 5, 2); ctx.fillRect(0, 5, 5, 2);
    ctx.fillStyle = '#c8e0dc'; ctx.fillRect(19, 2, 3, 4); ctx.fillRect(22, 3, 2, 2);
    texture.refresh();
  }
  scene.physics.add.collider(scene.arrowProjectiles, scene.groundLayer,
    arrow => retireRock(scene, arrow), projectileCanCollide);
  scene.physics.add.overlap(scene.arrowProjectiles, scene.enemies, (arrow, enemy) => {
    if (!arrow.active || !enemy.active || !enemy.body.enable || scene.isLevelFinished) return;
    retireRock(scene, arrow);
    if (enemy.isBoss) { damageBoss(scene, enemy); return; }
    enemy.disableBody(true, true);
    scene.awardComboPoints(200, enemy.x, enemy.y - 12);
    scene.updateHUD();
    enemy.destroy();
  });
  scene.bow = scene.add.graphics().setDepth(12).setVisible(false);
  if (scene.input.keyboard) {
    scene.shootKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    const toggleBow = event => {
      if (event.repeat || scene.currentLevel < 4 || scene.isLevelFinished || !scene.scene.isActive()) return;
      scene.bow.setVisible(!scene.bow.visible);
    };
    scene.input.keyboard.on('keydown-B', toggleBow);
    scene.events.once('shutdown', () => scene.input.keyboard.off('keydown-B', toggleBow));
  }
  if (scene.currentLevel >= 4) {
    scene.arrowText = scene.screenText(18, 90, `ARROWS: ${scene.arrows}  |  F: SHOOT  |  B: BOW`, {
      fontSize: '12px', fontStyle: 'bold', color: '#ffe1a3',
      stroke: '#17271f', strokeThickness: 3
    }).setDepth(210);
    scene.showFloatingText(scene.player.x + 50, scene.player.y - 25, 'Hit ? boxes for arrows', '#ffe1a3');
  }
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
  scene.groundLayer.forEachTile(tile => {
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
  enemy.patrolOrigin = enemy.x;
  enemy.nextJump = scene.time.now + 1000 + Math.random() * 2000;
  enemy.airSpeed = 0;
  enemy.play(enemy.texture.key === 'enemy-guardians'
    ? `guardian-walk-${enemy.guardianVariant}` : 'enemy-walk');
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
      scene.groundLayer.getTileAt(ahead, row - 1)?.collides;
    const gap = !scene.groundLayer.getTileAt(ahead, row)?.collides;
    if (body.left <= 2 || body.right >= scene.map.widthInPixels - 2) {
      enemy.patrolDirection = body.left <= 2 ? 1 : -1;
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
  enemy.setFlipX(enemy.patrolDirection > 0);
  enemy.play(enemy.texture.key === 'enemy-guardians'
    ? `guardian-walk-${enemy.guardianVariant}` : 'enemy-walk', true);
}

export function throwRock(scene, enemy) {
  // Variant 1 is the black guardian; the other guardians only move and jump.
  if (enemy.guardianVariant !== 1 || scene.currentLevel < 3 || scene.isLevelFinished || !enemy.active || !enemy.body?.enable) return null;
  const dx = scene.player.body.center.x - enemy.body.center.x;
  const direction = dx >= 0 ? 1 : -1;
  const rock = scene.rockProjectiles.create(enemy.body.center.x + direction * 15,
    enemy.body.center.y - 7, 'guardian-rock').setDepth(11);
  const distance = scene.player.body.center.x - rock.x;
  const flightTime = Math.max(0.25, Math.min(1.1, Math.abs(distance) / 210));
  const gravity = scene.physics.world.gravity.y;
  rock.setVelocity(distance / flightTime,
    (scene.player.body.center.y - rock.y - 0.5 * gravity * flightTime * flightTime) / flightTime);
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

export function grantBoxArrows(scene, block) {
  if (scene.currentLevel < 4 || block.arrowClaimed) return;
  block.arrowClaimed = true;
  const gained = addArrowAmmo(scene, 2);
  scene.updateHUD();
  scene.showFloatingText(block.tile.pixelX + 9, block.tile.pixelY - 25,
    gained ? `+${gained} ARROWS` : 'QUIVER FULL', '#87d7ca');
}

export function shootBow(scene) {
  if (scene.currentLevel < 4 || scene.isLevelFinished || scene.arrows <= 0 || scene.time.now < scene.nextShot) return false;
  scene.nextShot = scene.time.now + 400;
  scene.bowDrawUntil = scene.time.now + 180;
  scene.arrows--;
  const direction = scene.currentLevel === TOTAL_LEVELS && scene.boss?.active
    ? (scene.boss.x < scene.player.x ? -1 : 1)
    : (scene.player.flipX ? -1 : 1);
  const arrow = scene.arrowProjectiles.create(scene.player.x + direction * 17, scene.player.body.center.y, 'bow-arrow');
  arrow.setFlipX(direction < 0).setDepth(11).setVelocityX(direction * 340);
  arrow.body.setSize(20, 4).setOffset(2, 2);
  scene.time.delayedCall(1800, () => { if (arrow.active) arrow.destroy(); });
  scene.updateHUD();
  return true;
}

export function updateCombat(scene) {
  const now = scene.time.now;
  scene.enemies.getChildren().forEach(enemy => {
    if (!enemy.active || !enemy.body?.enable) return;
    if (enemy.isBoss) { updateFinalBoss(scene, enemy, now); return; }
    if (enemy.body.top > scene.map.heightInPixels + 36) { enemy.destroy(); return; }
    const dx = scene.player.x - enemy.x;
    const dy = Math.abs(scene.player.body.center.y - enemy.body.center.y);
    if (now < enemy.attackUntil) { enemy.setVelocityX(0); return; }
    const customEnemy = enemy.texture.key === 'enemy-guardians';
    const canFight = customEnemy && (scene.currentLevel <= 2 || enemy.guardianVariant === 2);
    if (canFight && Math.abs(dx) < 28 && dy < 24 && enemy.body.blocked.down && now >= enemy.nextAttack) {
        enemy.setVelocityX(0);
        enemy.setFlipX(dx > 0);
        enemy.attackUntil = now + 650;
        enemy.nextAttack = now + 1200;
        enemy.play(`guardian-attack-${enemy.guardianVariant}`);
        scene.time.delayedCall(220, () => {
          if (!enemy.active || !enemy.body?.enable || scene.isLevelFinished || !scene.player.body?.enable) return;
          if (Math.abs(scene.player.x - enemy.x) < 32 &&
              Math.abs(scene.player.body.center.y - enemy.body.center.y) < 26) {
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
      enemy.play(`guardian-attack-${enemy.guardianVariant}`);
      // The raised-arm and extended-arm frames now form the rock-throw animation.
      scene.time.delayedCall(350, () => {
        throwRock(scene, enemy);
      });
      return;
    }
    roamEnemy(scene, enemy, now);
  });
  if (scene.currentLevel < 4) return;
  if (touchControls.shoot || scene.shootKey?.isDown) shootBow(scene);
}

export function updateBowPose(scene) {
  if (scene.currentLevel < 4 || !scene.bow) return;
  const now = scene.time.now;
  const direction = scene.player.flipX ? -1 : 1;
  // Grip sits at chest height; the bow is smaller than the character's full height.
  const bounds = scene.player.getBounds();
  const x = scene.player.x + direction * 6, y = bounds.top + bounds.height * 0.60;
  const halfHeight = scene.player.displayHeight * 0.30;
  const draw = now < (scene.bowDrawUntil || 0) ? -direction * 3 : 0;
  const g = scene.bow;
  g.clear();
  if (!g.visible) return;
  // Sleeves and hands belong to the held pose and mirror with the character.
  const arm = (points, color, width) => {
    g.lineStyle(width, color); g.beginPath();
    points.forEach(([px, py], index) => index ? g.lineTo(px, py) : g.moveTo(px, py));
    g.strokePath();
  };
  const shoulder = scene.player.x - direction;
  arm([[shoulder, y - 2], [x - direction * 2, y], [x + direction * 3, y]], 0x583a2b, 4);
  arm([[shoulder, y - 2], [x - direction * 2, y]], 0xf4deb2, 3);
  arm([[x - direction * 2, y], [x + direction * 3, y]], 0xe3a879, 2);
  g.lineStyle(1.5, 0xb77935);
  g.beginPath(); g.moveTo(x, y - halfHeight); g.lineTo(x + direction * 2, y - halfHeight / 2);
  g.lineTo(x + direction * 3, y); g.lineTo(x + direction * 2, y + halfHeight / 2);
  g.lineTo(x, y + halfHeight); g.strokePath();
  g.lineStyle(0.7, 0xffe0a0); g.beginPath(); g.moveTo(x, y - halfHeight);
  g.lineTo(x + draw, y); g.lineTo(x, y + halfHeight); g.strokePath();
  g.fillStyle(0xe8bb56); g.fillRect(x - 0.5, y - halfHeight - 1, 1.5, 2);
  g.fillRect(x - 0.5, y + halfHeight - 1, 1.5, 2);
  // The other hand pulls the string toward the chest during a shot.
  arm([[shoulder - direction * 2, y + 1], [x + draw, y]], 0x583a2b, 3);
  arm([[shoulder - direction * 2, y + 1], [x + draw, y]], 0xf4deb2, 2);
  g.fillStyle(0xe3a879); g.fillRect(x + draw - 1, y - 1, 2, 2);
}
