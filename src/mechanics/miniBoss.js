import { playSound } from '../ui.js';
import { throwRock } from '../combat.js';
import { sfx } from '../audio/soundManager.js';

// Mini-boss base class. Spawns a stone guardian into scene.enemies, so the existing
// combat rules apply (sword hits, reflected rocks, stun, knock-back, death tween), but
// its behaviour is driven here instead of the generic enemy AI.
//
// Use directly from a layout:
//   { type: 'miniBoss', x, y /* feet */, name = 'GUARDIAN', hp = 6, size = 82,
//     speed = 55, aggroRange = 260, attackRange = 50, attackCooldown = 1700,
//     throwRocks = true, throwCooldown = 2600, lockGoal = true,
//     phases = [{ below: 0.5, speed: 1.4, attackCooldown: 0.7 }] }   // multipliers
// or extend it for a custom boss and pass the class:
//   class NagaShade extends MiniBoss { think(time) { ... super.think(time); } }
//   { type: 'miniBoss', bossClass: NagaShade, ... }
export class MiniBoss {
  constructor(scene, cfg) {
    this.scene = scene;
    this.cfg = {
      name: 'GUARDIAN', hp: 6, size: 82, speed: 55, aggroRange: 260, attackRange: 50,
      attackCooldown: 1700, throwRocks: true, throwCooldown: 2600, lockGoal: true, phases: [], ...cfg
    };
    const { x, y, size, hp } = this.cfg;
    const scale = size / 256;
    const sprite = scene.enemies.create(x, y, 'stone-guardian', 0).setScale(scale).setOrigin(0.5, 1).setDepth(8);
    const bodyW = size * 0.39, bodyH = size * 0.33;
    sprite.body.setSize(bodyW / scale, bodyH / scale).setOffset((sprite.width - bodyW / scale) / 2, sprite.height - bodyH / scale);
    sprite.setCollideWorldBounds(true);
    Object.assign(sprite, {
      enemyKind: 'stone-guardian', customAI: true, stompImmune: true, miniBoss: this,
      hitPoints: hp, maxHitPoints: hp, guardianVariant: 2, patrolDirection: -1,
      attackUntil: 0, nextAttack: scene.time.now + 1200, nextHealthRecoveryAt: 0,
      onHit: () => this.onHit(), onDefeat: () => this.handleDefeat()
    });
    sprite.play('stone-guardian-idle');
    this.sprite = sprite;
    this.defeated = false;
    this.nextThrow = scene.time.now + this.cfg.throwCooldown;
    this.label = scene.add.text(x, y - size - 14, '', {
      fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '10px', fontStyle: 'bold',
      color: '#ffe1a0', stroke: '#20170f', strokeThickness: 3
    }).setOrigin(0.5).setDepth(18);
    this.bar = scene.add.graphics().setDepth(18);
    if (this.cfg.lockGoal) {
      this.goalLock = () => (this.defeated ? null : `DEFEAT THE ${this.cfg.name}`);
      scene.goalLocks.push(this.goalLock);
    }
  }

  // Current tuning after phase multipliers (phases trigger as health drops).
  get tuning() {
    const ratio = this.sprite.hitPoints / this.sprite.maxHitPoints;
    const phase = [...this.cfg.phases].reverse().find(p => ratio <= p.below) || {};
    return {
      speed: this.cfg.speed * (phase.speed || 1),
      attackCooldown: this.cfg.attackCooldown * (phase.attackCooldown || 1),
      throwCooldown: this.cfg.throwCooldown * (phase.throwCooldown || 1)
    };
  }

  update(time, delta) {
    const s = this.sprite;
    if (this.defeated || !s.active || !s.body?.enable) return;
    const now = this.scene.time.now;
    if (now < (s.stunnedUntil || 0)) { s.setVelocityX(0); this.drawUI(); return; }
    if (s.stunnedUntil) { s.stunnedUntil = 0; s.anims?.resume(); }
    if (now < s.attackUntil) { s.setVelocityX(0); this.drawUI(); return; }
    if (!this.scene.isLevelFinished && this.scene.player.body?.enable) this.think(now, delta);
    this.drawUI();
  }

  // Default behaviour: approach, slam when close, throw rocks from mid range.
  // Override in a subclass for custom patterns (call the helpers below).
  think(now) {
    const s = this.sprite, player = this.scene.player;
    const dx = player.x - s.x, dy = Math.abs(player.body.center.y - s.body.center.y);
    const t = this.tuning;
    if (Math.abs(dx) > this.cfg.aggroRange) { this.walk(0); return; }
    this.facePlayer();
    if (Math.abs(dx) < this.cfg.attackRange && dy < 40 && now >= s.nextAttack) { this.slam(); return; }
    if (this.cfg.throwRocks && Math.abs(dx) > 90 && now >= this.nextThrow) { this.throw(); return; }
    this.walk(Math.sign(dx) * t.speed);
  }

  facePlayer() { this.sprite.setFlipX(this.scene.player.x > this.sprite.x); }

  walk(velocityX) {
    const s = this.sprite;
    s.setVelocityX(velocityX);
    s.play(Math.abs(velocityX) > 5 ? 'stone-guardian-walk' : 'stone-guardian-idle', true);
  }

  slam(damageRange = this.cfg.attackRange + 8) {
    const s = this.sprite, now = this.scene.time.now;
    s.setVelocityX(0);
    s.attackUntil = now + 720;
    s.nextAttack = now + this.tuning.attackCooldown;
    s.play('stone-guardian-slam', true);
    sfx(this.scene).play('bossWarn');   // priority warning before the slam lands
    this.scene.time.delayedCall(390, () => {
      const player = this.scene.player;
      if (!s.active || !s.body?.enable || this.defeated || this.scene.isLevelFinished) return;
      if (Math.abs(player.x - s.x) < damageRange && Math.abs(player.body.center.y - s.body.center.y) < 44) {
        this.scene.cameras.main.shake(120, 0.006);
        this.scene.handlePlayerEnemyCollision(player, s, true);
      }
    });
  }

  throw() {
    const s = this.sprite, now = this.scene.time.now;
    s.setVelocityX(0);
    s.attackUntil = now + 760;
    this.nextThrow = now + this.tuning.throwCooldown;
    s.play('stone-guardian-throw', true);
    sfx(this.scene).playAt(this.scene, 'guardianAttack', s.x, s.y);
    this.scene.time.delayedCall(420, () => { if (!this.defeated) throwRock(this.scene, s); });
  }

  drawUI() {
    const s = this.sprite;
    const top = s.y - s.displayHeight - 6;
    const ratio = Phaser.Math.Clamp(s.hitPoints / s.maxHitPoints, 0, 1);
    this.label.setPosition(s.x, top - 9).setText(`${this.cfg.name}  ${s.hitPoints}/${s.maxHitPoints}`);
    this.bar.clear().fillStyle(0x211817, 1).fillRect(s.x - 30, top, 60, 6)
      .fillStyle(0xd84e58, 1).fillRect(s.x - 29, top + 1, 58 * ratio, 4);
  }

  // Hooks for subclasses.
  onHit() {}
  onDefeat() {}

  handleDefeat() {
    if (this.defeated) return;
    this.defeated = true;
    this.label.destroy();
    this.bar.destroy();
    playSound(this.scene, 'win', { volume: 0.4 });
    this.scene.cameras.main.shake(200, 0.008);
    this.scene.showFloatingText(this.sprite.x, this.sprite.y - this.cfg.size, `${this.cfg.name} DEFEATED`, '#ffe5a5');
    this.onDefeat();
  }

  destroy() {
    const locks = this.scene.goalLocks;
    const i = locks ? locks.indexOf(this.goalLock) : -1;
    if (i >= 0) locks.splice(i, 1);
    this.label?.destroy();
    this.bar?.destroy();
  }
}

export default {
  type: 'miniBoss',
  create(scene, cfg) {
    const BossClass = cfg.bossClass || MiniBoss;
    return new BossClass(scene, cfg);
  }
};
