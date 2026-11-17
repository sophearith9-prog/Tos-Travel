import { platformSprite } from './platformArt.js';
import { isStandingOn, safeColliders } from './helpers.js';
import { sfx } from '../audio/soundManager.js';

// Platform that reacts to the player's weight.
//   { type: 'sinkingPlatform', x, y, width = 54, height = 12, style = 'wood',
//     mode = 'fall' | 'sink',
//     delay = 450 (ms of shaking before a fall), respawnMs = 2500,   // mode 'fall'
//     sinkSpeed = 35, maxSink = 80 (px), riseSpeed = 20 }            // mode 'sink'
// x, y is the top-left corner. 'fall' drops away and comes back; 'sink' slowly goes
// under while ridden (think floating logs) and floats back up when left alone.
export default {
  type: 'sinkingPlatform',
  create(scene, cfg) {
    const { x, y, width = 54, height = 12, style = 'wood', mode = 'fall', delay = 450, respawnMs = 2500,
      sinkSpeed = 35, maxSink = 80, riseSpeed = 20 } = cfg;
    const sprite = platformSprite(scene, x, y, width, height, style).setOrigin(0, 0);
    scene.physics.add.existing(sprite);
    sprite.body.setAllowGravity(false).setImmovable(true);
    sprite.setData('surface', style === 'stone' ? 'stone' : 'wood');
    const removeColliders = safeColliders(scene, [[scene.player, sprite], [scene.enemies, sprite]]);
    let state = 'idle', changedAt = 0;

    const reset = () => {
      sprite.body.enable = true;
      sprite.body.checkCollision.none = false;
      sprite.body.setAllowGravity(false).setVelocity(0, 0);
      sprite.body.reset(x, y);
      sprite.setVisible(true).setAlpha(0);
      scene.tweens.add({ targets: sprite, alpha: 1, duration: 300 });
      state = 'idle';
    };

    return {
      sprite,
      update(time) {
        const now = scene.time.now;
        const ridden = isStandingOn(scene.player, sprite.body);
        if (mode === 'sink') {
          const sunk = sprite.y - y;
          if (ridden && sunk < maxSink) {
            if (sunk < 2) sfx(scene).playAt(scene, 'logSink', sprite.x + width / 2, sprite.y);
            sprite.body.setVelocityY(sinkSpeed);
          }
          else if (!ridden && sunk > 0) sprite.body.setVelocityY(-riseSpeed);
          else { sprite.body.setVelocityY(0); if (!ridden && sunk < 0) sprite.body.reset(x, y); }
          return;
        }
        if (state === 'idle' && ridden) { state = 'shaking'; changedAt = now; sfx(scene).playAt(scene, 'logSink', sprite.x + width / 2, sprite.y, { rate: 1.3 }); }
        if (state === 'shaking') {
          sprite.x = x + ((Math.floor(now / 45) % 2) ? 1 : -1);
          if (now - changedAt >= delay) {
            state = 'falling'; changedAt = now;
            sprite.x = x;
            sprite.body.checkCollision.none = true;
            sprite.body.setAllowGravity(true).setVelocityY(40);
          }
        } else if (state === 'falling' && (sprite.y > scene.physics.world.bounds.bottom || now - changedAt > 3000)) {
          state = 'gone'; changedAt = now;
          sprite.body.enable = false;
          sprite.setVisible(false);
        } else if (state === 'gone' && now - changedAt >= respawnMs) {
          reset();
        }
      },
      destroy() { removeColliders(); sprite.destroy(); }
    };
  }
};
