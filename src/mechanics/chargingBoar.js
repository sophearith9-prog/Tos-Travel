import { canvasTexture } from '../biomes/biomeArt.js';

// Wild boar: patrols, spots the player, paws the ground (telegraph), then charges in a
// straight line until it reaches a ledge, a wall or its charge distance, and rests.
// Jump over it - or hit it: it is a normal enemy for the sword and for stomping.
//   { type: 'chargingBoar', x, y /* feet */, range = 150, chargeSpeed = 220,
//     walkSpeed = 22, chargeDistance = 260, pawMs = 650, restMs = 900, hp = 2 }

const FW = 30, FH = 20;   // frames: 0-1 walk, 2-3 paw, 4-5 charge

function boarTexture(scene) {
  return canvasTexture(scene, 'mech-boar', FW * 6, FH, (p, texture) => {
    const ink = '#1e140e', hide = '#5a3c26', dark = '#3a2618', snout = '#a8705a';
    for (let f = 0; f < 6; f++) {
      const o = f * FW;
      const charge = f >= 4, paw = f === 2 || f === 3;
      const head = charge || paw ? 2 : 0;     // head lowered when pawing or charging
      // Legs.
      const legSets = charge
        ? [[4, -2], [8, 1], [17, 2], [21, -1]]
        : paw ? [[5, 0], [9, 0], [18, f === 2 ? -2 : 2], [22, 0]]
          : [[5, f ? 1 : -1], [9, f ? -1 : 1], [18, f ? -1 : 1], [22, f ? 1 : -1]];
      for (const [lx, dx] of legSets) {
        p.rect(o + lx + dx, 14, 3, 6, ink);
        p.rect(o + lx + dx, 14, 2, 5, dark);
      }
      // Body, bristled back ridge and belly.
      p.oval(o + 14, 11, 11, 6, ink);
      p.oval(o + 14, 11, 10, 5, hide);
      p.rect(o + 6, 14, 16, 1, dark);
      for (let b = 5; b < 22; b += 2) p.rect(o + b, 5 - ((b * 3) % 3 === 0 ? 1 : 0), 1, 2, ink);
      // Head with snout, tusk, eye and ear.
      p.rect(o + 22, 7 + head, 6, 6, ink);
      p.rect(o + 22, 8 + head, 5, 4, hide);
      p.rect(o + 27, 9 + head, 3, 3, snout);
      p.rect(o + 29, 10 + head, 1, 1, ink);
      p.rect(o + 26, 12 + head, 2, 1, '#f2ece0'); p.rect(o + 27, 11 + head, 1, 1, '#f2ece0');
      p.rect(o + 24, 8 + head, 1, 1, '#d83a2a');
      p.rect(o + 21, 5 + head, 2, 3, ink);
      // Tail tuft.
      p.rect(o + 2, 8, 2, 1, ink); p.rect(o + 1, 9, 1, 2, ink);
      texture.add(f, 0, o, 0, FW, FH);
    }
  });
}

export default {
  type: 'chargingBoar',
  create(scene, cfg) {
    const { x, y, range = 150, chargeSpeed = 220, walkSpeed = 22, chargeDistance = 260,
      pawMs = 650, restMs = 900, hp = 2 } = cfg;
    const sprite = scene.enemies.create(x, y, boarTexture(scene), 0).setOrigin(0.5, 1).setDepth(6);
    sprite.body.setSize(24, 13).setOffset(3, 7);
    sprite.setCollideWorldBounds(true);
    Object.assign(sprite, {
      enemyKind: 'boar', customAI: true, hitPoints: hp, maxHitPoints: hp,
      patrolDirection: -1, guardianVariant: 0, attackUntil: 0, nextAttack: 0
    });
    let state = 'patrol', since = scene.time.now, chargeFrom = 0, facing = -1, nextDust = 0;
    const set = next => { state = next; since = scene.time.now; };
    const support = (aheadX, bottom) => scene.patrolTerrain ? scene.patrolTerrain.hasSupport(aheadX, bottom) : true;
    const dust = () => {
      const puff = scene.add.ellipse(sprite.x - facing * 8, sprite.y - 2, 5, 3, 0xd8c8a0, 0.8).setDepth(5);
      scene.tweens.add({ targets: puff, x: puff.x - facing * 8, y: puff.y - 4, scaleX: 2, alpha: 0,
        duration: 380, onComplete: () => puff.destroy() });
    };

    return {
      sprite,
      update(time, delta) {
        if (!sprite.active || !sprite.body?.enable) return;
        const now = scene.time.now, body = sprite.body, player = scene.player;
        if (now < (sprite.stunnedUntil || 0)) { sprite.setVelocityX(0); return; }
        if (sprite.stunnedUntil) { sprite.stunnedUntil = 0; set('rest'); }
        const grounded = body.blocked.down || body.touching.down;
        const aheadX = body.center.x + facing * (body.width / 2 + 4);
        const ledgeAhead = grounded && !support(aheadX, body.bottom);
        const dx = player.x - sprite.x, dy = Math.abs(player.body.center.y - body.center.y);
        const seesPlayer = player.body.enable && !scene.isLevelFinished && Math.abs(dx) < range && dy < 28;
        // A player standing on its back gets bucked off (landing again counts as a stomp).
        if (body.touching.up && player.body.touching.down) {
          player.setVelocity(Math.sign(player.x - sprite.x || 1) * 90, -230);
        }

        if (state === 'patrol') {
          if (ledgeAhead || body.blocked.left || body.blocked.right) facing = -facing;
          sprite.setVelocityX(walkSpeed * facing).setFrame(Math.floor(now / 220) % 2);
          if (seesPlayer && grounded) { facing = Math.sign(dx) || facing; sprite.setVelocityX(0); set('paw'); }
        } else if (state === 'paw') {
          sprite.setVelocityX(0).setFrame(2 + (Math.floor(now / 110) % 2));
          if (now >= nextDust) { dust(); nextDust = now + 140; }
          if (now - since >= pawMs) { chargeFrom = sprite.x; set('charge'); }
        } else if (state === 'charge') {
          sprite.setVelocityX(chargeSpeed * facing).setFrame(4 + (Math.floor(now / 70) % 2));
          if (now >= nextDust) { dust(); nextDust = now + 90; }
          const blocked = facing > 0 ? body.blocked.right : body.blocked.left;
          const rammed = facing > 0 ? body.touching.right : body.touching.left;   // hit the player (or another body)
          if (ledgeAhead || blocked || rammed || Math.abs(sprite.x - chargeFrom) >= chargeDistance) {
            sprite.setVelocityX(0);
            set('rest');
          }
        } else if (state === 'rest') {
          sprite.setVelocityX(0).setFrame(0);
          if (now - since >= restMs) { facing = -facing; set('patrol'); }
        }
        sprite.setFlipX(facing < 0);
      },
      destroy() {}
    };
  }
};
