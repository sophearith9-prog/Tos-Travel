import { canvasTexture } from '../biomes/biomeArt.js';
import { playSound } from '../ui.js';
import { sfx } from '../audio/soundManager.js';

// Brahminy kite: cruises high, spots the player below, hovers and screeches (telegraph),
// then dives straight at where the player stood and climbs back to its cruising height.
// Step aside to dodge, or hit it: sword, stomp and reflected rocks all work (1 hit).
//   { type: 'divingBird', x, y /* cruise height */, patrol = 90, cruiseSpeed = 38,
//     range = 70 (horizontal trigger), diveSpeed = 250, warnMs = 650, cooldownMs = 1400, hp = 1 }

const FW = 26, FH = 16;   // frames: 0 wings up, 1 wings down, 2 diving

function kiteTexture(scene) {
  return canvasTexture(scene, 'mech-kite', FW * 3, FH, (p, texture) => {
    const ink = '#241812', body = '#8a3a1e', wing = '#a24a26', tip = '#3a2418', head = '#f2ece0', beak = '#e8b23c';
    for (let f = 0; f < 3; f++) {
      const o = f * FW;
      if (f < 2) {
        const up = f === 0;
        // Wings: raised or lowered, with dark primaries.
        for (let i = 0; i < 9; i++) {
          const wy = up ? 7 - Math.round(i * 0.6) : 7 + Math.round(i * 0.35);
          p.rect(o + 12 - i, wy, 1, 3, i > 6 ? tip : wing); p.rect(o + 14 + i, wy, 1, 3, i > 6 ? tip : wing);
        }
        p.oval(o + 13, 9, 5, 3, ink); p.oval(o + 13, 9, 4, 2, body);
        p.rect(o + 6, 9, 3, 2, body); p.rect(o + 4, 10, 3, 2, tip);          // tail
        p.disc(o + 19, 8, 2, head); p.rect(o + 21, 8, 2, 1, beak); p.rect(o + 19, 7, 1, 1, ink);
      } else {
        // Diving: wings folded back, head forward and down.
        p.oval(o + 12, 8, 7, 3, ink); p.oval(o + 12, 8, 6, 2, body);
        p.rect(o + 4, 6, 8, 2, wing); p.rect(o + 2, 6, 3, 2, tip);
        p.disc(o + 19, 10, 2, head); p.rect(o + 21, 11, 2, 1, beak); p.rect(o + 19, 9, 1, 1, ink);
      }
      texture.add(f, 0, o, 0, FW, FH);
    }
  });
}

export default {
  type: 'divingBird',
  create(scene, cfg) {
    const { x, y, patrol = 90, cruiseSpeed = 38, range = 70, diveSpeed = 250,
      warnMs = 650, cooldownMs = 1400, hp = 1 } = cfg;
    const sprite = scene.enemies.create(x, y, kiteTexture(scene), 0).setDepth(9);
    sprite.body.setAllowGravity(false).setSize(16, 9).setOffset(5, 4);
    Object.assign(sprite, {
      enemyKind: 'kite', customAI: true, flying: true, hitPoints: hp, maxHitPoints: hp,
      patrolDirection: 1, guardianVariant: 0, attackUntil: 0, nextAttack: 0
    });
    const alert = scene.add.text(x, y - 14, '!', {
      fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '12px', fontStyle: 'bold',
      color: '#ffe27a', stroke: '#2a1a10', strokeThickness: 3
    }).setOrigin(0.5).setDepth(10).setVisible(false);
    let state = 'cruise', since = scene.time.now, dir = 1, target = null, readyAt = scene.time.now + 1200;
    const set = next => { state = next; since = scene.time.now; };

    return {
      sprite,
      get state() { return state; },
      update() {
        if (!sprite.active || !sprite.body?.enable) { alert.setVisible(false); return; }
        const now = scene.time.now, player = scene.player;
        if (now < (sprite.stunnedUntil || 0)) { sprite.setVelocity(0, 0); return; }
        const flap = Math.floor(now / 140) % 2;
        if (state === 'cruise') {
          if (sprite.x > x + patrol) dir = -1;
          if (sprite.x < x - patrol) dir = 1;
          sprite.setVelocity(cruiseSpeed * dir, (y + Math.sin(now * 0.003) * 4 - sprite.y) * 3).setFrame(flap);
          sprite.setFlipX(dir < 0);
          const dx = player.x - sprite.x;
          if (now >= readyAt && player.body?.enable && !scene.isLevelFinished && Math.abs(dx) < range && player.y > sprite.y + 30) {
            set('warn');
            sfx(scene).playAt(scene, 'kiteScreech', sprite.x, sprite.y);
          }
        } else if (state === 'warn') {
          sprite.setVelocity(0, 0).setFrame(Math.floor(now / 60) % 2).setFlipX(player.x < sprite.x);
          alert.setVisible(Math.floor(now / 120) % 2 === 0).setPosition(sprite.x, sprite.y - 14);
          if (now - since >= warnMs) {
            alert.setVisible(false);
            target = { x: player.x, y: player.body.center.y };
            const vx = target.x - sprite.x, vy = target.y - sprite.y, d = Math.max(1, Math.hypot(vx, vy));
            sprite.setVelocity((vx / d) * diveSpeed, (vy / d) * diveSpeed).setFrame(2).setFlipX(vx < 0);
            set('dive');
          }
        } else if (state === 'dive') {
          // Pull up once it reaches the target height (or after a short dive).
          if (sprite.y >= target.y - 2 || now - since > 1400) set('climb');
        } else if (state === 'climb') {
          const vy = Math.max(-140, (y - sprite.y) * 2.5);
          sprite.setVelocity(sprite.body.velocity.x * 0.96, vy).setFrame(flap);
          if (Math.abs(sprite.y - y) < 3) { readyAt = now + cooldownMs; set('cruise'); }
        }
      },
      destroy() { alert.destroy(); }
    };
  }
};
