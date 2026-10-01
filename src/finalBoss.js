import { TOTAL_LEVELS } from './levels/provinceRoute.js';

export function installFinalBoss(scene) {
  scene.boss = null;
  scene.nextBossWarning = 0;
  if (scene.currentLevel !== TOTAL_LEVELS) return;
  const boss = scene.enemies.create(scene.map.widthInPixels - 900, 100, 'enemy-guardians', 6);
  const size = scene.player.displayHeight * 5;
  boss.setDisplaySize(size, size).setOrigin(0.5, 1);
  boss.body.setSize(48, 78).setOffset(24, 18);
  boss.body.reset(scene.map.widthInPixels - 900, 198);
  boss.setCollideWorldBounds(true).setDepth(13);
  boss.isBoss = true;
  boss.guardianVariant = 1;
  boss.health = boss.maxHealth = 12;
  boss.nextShot = scene.time.now + 2000;
  boss.nextJump = 0;
  boss.awake = false;
  boss.play('guardian-walk-1');
  scene.boss = boss;
  scene.bossHealthText = scene.screenText(400, 150, 'FINAL GUARDIAN: 12 / 12', {
    fontSize: '13px', fontStyle: 'bold', color: '#ffb4a9',
    stroke: '#17271f', strokeThickness: 3
  }).setOrigin(0.5).setDepth(211);
  scene.bossHealthBar = scene.add.graphics().setScrollFactor(0).setDepth(211);
  drawBossHealth(scene);
  // Enough ammunition to fight even when entering the final stage directly.
  scene.arrows = Math.max(scene.arrows, 18);
  scene.updateHUD();
}

function drawBossHealth(scene) {
  const boss = scene.boss, zoom = scene.cameras.main.zoom;
  const g = scene.bossHealthBar;
  g.clear().fillStyle(0x192331).fillRect(400 - 130 / zoom, 225 - 65 / zoom, 260 / zoom, 8 / zoom);
  g.fillStyle(0xe65353).fillRect(400 - 128 / zoom, 225 - 63 / zoom, 256 * boss.health / boss.maxHealth / zoom, 4 / zoom);
  scene.bossHealthText.setText(`FINAL GUARDIAN: ${boss.health} / ${boss.maxHealth}`);
}

export function damageBoss(scene, boss) {
  if (!boss.active || boss.health <= 0) return;
  boss.health--;
  boss.awake = true;
  drawBossHealth(scene);
  if (boss.health === 0) {
    boss.disableBody(true, true);
    scene.rockProjectiles.clear(true, true);
    scene.score += 2000;
    scene.updateHUD();
    scene.bossHealthText.setText('GUARDIAN DEFEATED — REACH THE FLAG!');
    scene.showFloatingText(boss.x, boss.y - 40, '+2000', '#ffd700');
    boss.destroy();
  } else {
    boss.setTint(0xff7777);
    scene.time.delayedCall(100, () => { if (boss.active) boss.clearTint(); });
  }
}

export function updateFinalBoss(scene, boss, now) {
  const body = boss.body, player = scene.player;
  const dx = player.x - boss.x;
  if (Math.abs(dx) < 480) boss.awake = true;
  if (!boss.awake) { boss.setVelocityX(0); return; }
  const direction = dx >= 0 ? 1 : -1;
  boss.setFlipX(direction > 0);
  boss.setVelocityX(Math.abs(dx) > 35 ? direction * 140 : 0);
  if (body.top > scene.map.heightInPixels) {
    // The guardian recovers from pits instead of disappearing and locking the exit.
    let col = Math.max(3, Math.min(scene.map.width - 20, Math.floor(player.x / 18) + direction * 8));
    while (col > 1 && !scene.groundLayer.getTileAt(col, 11)?.collides) col--;
    body.reset(col * 18 + 9, 198);
    boss.setVelocityY(-400);
  }
  if (body.blocked.down && now >= boss.nextJump) {
    const ahead = Math.floor((body.center.x + direction * (body.width / 2 + 24)) / 18);
    const row = Math.floor((body.bottom + 2) / 18);
    const obstacle = scene.groundLayer.getTileAt(ahead, row - 1)?.collides;
    const gap = !scene.groundLayer.getTileAt(ahead, row)?.collides;
    if (gap || obstacle || body.blocked.left || body.blocked.right || player.body.bottom < body.bottom - 20) {
      boss.setVelocityY(-400);
      boss.nextJump = now + 700;
    }
  }
  if (now >= boss.nextShot) {
    boss.nextShot = now + 2000;
    boss.shootUntil = now + 450;
    boss.play('guardian-attack-1', true);
    const rock = scene.rockProjectiles.create(body.center.x + direction * (body.width / 2 + 12),
      body.center.y, 'guardian-rock').setDisplaySize(16, 16).setDepth(14);
    const flight = Math.max(0.35, Math.min(1.2, Math.abs(player.x - rock.x) / 260));
    rock.setVelocity((player.body.center.x + player.body.velocity.x * flight * 0.5 - rock.x) / flight,
      (player.body.center.y - rock.y - 0.5 * scene.physics.world.gravity.y * flight * flight) / flight);
    scene.time.delayedCall(2500, () => { if (rock.active) rock.destroy(); });
  } else if (now >= (boss.shootUntil || 0)) boss.play('guardian-walk-1', true);
}
