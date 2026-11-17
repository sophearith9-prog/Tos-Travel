import { canvasTexture } from '../biomes/biomeArt.js';
import { safeColliders } from './helpers.js';
import { sfx } from '../audio/soundManager.js';

// Irrawaddy dolphin that surfaces on a timed rhythm; its back is a temporary platform.
//   { type: 'dolphinPlatform', x /* centre */, waterY /* river surface */,
//     upMs = 1700, downMs = 1300, offset = 0 }
// Cycle: bubbles (500ms warning) -> rises -> rideable for upMs -> shivers (last 450ms,
// still rideable) -> dives (rider drops into the river) -> hidden for the rest of downMs.
// Give neighbouring dolphins increasing offsets to make a wave the player can follow.

const W = 44, H = 22;

function dolphinTexture(scene) {
  return canvasTexture(scene, 'mech-dolphin', W * 2, H, (p, texture) => {
    const ink = '#3e4448', grey = '#8a9498', light = '#c4ccce', blush = '#d8b4b0';
    for (let f = 0; f < 2; f++) {
      const o = f * W, tilt = f;          // frame 1: nose down for the dive
      // Rounded body (Irrawaddy dolphins have a blunt head and no beak).
      p.oval(o + 22, 13 + tilt, 19, 7, ink);
      p.oval(o + 22, 13 + tilt, 18, 6, grey);
      p.oval(o + 22, 16 + tilt, 14, 3, light);
      p.oval(o + 36, 12 + tilt * 2, 6, 5, grey);            // blunt melon head
      p.rect(o + 37, 15 + tilt * 2, 4, 1, blush);
      p.rect(o + 37, 10 + tilt * 2, 1, 1, '#1a1e20');        // eye
      p.rect(o + 21, 5 + tilt, 4, 3, ink); p.rect(o + 22, 6 + tilt, 2, 2, grey);   // small dorsal fin
      p.rect(o + 3, 12 - tilt, 4, 2, ink); p.rect(o + 1, 10 - tilt, 3, 2, ink); p.rect(o + 1, 14 - tilt, 3, 2, ink);  // tail flukes
      p.rect(o + 12, 9 + tilt, 18, 1, light);                // wet highlight
      texture.add(f, 0, o, 0, W, H);
    }
  });
}

export default {
  type: 'dolphinPlatform',
  create(scene, cfg) {
    const { x, waterY, upMs = 1700, downMs = 1300, offset = 0 } = cfg;
    const key = dolphinTexture(scene);
    // Sprite origin is its bottom-centre; surfaced, the back sits at the platform top (waterY - 9).
    const surfacedY = waterY + 6, hiddenY = waterY + 30;
    const sprite = scene.add.image(x, hiddenY, key, 0).setOrigin(0.5, 1).setDepth(3.5).setVisible(false);
    // Rideable back: one-way, sits just under the river bank height.
    const back = scene.add.rectangle(x, waterY - 6, 38, 6, 0xffffff, 0);
    scene.physics.add.existing(back, true);
    back.body.checkCollision.down = back.body.checkCollision.left = back.body.checkCollision.right = false;
    back.body.enable = false;
    back.setData('surface', 'water');
    let wasUp = false;
    const removeColliders = safeColliders(scene, [[scene.player, back]]);
    const bubbles = Array.from({ length: 5 }, (_, i) => scene.add.circle(x - 12 + i * 6, waterY, 1.5 + (i % 2), 0xe8fbff, 0.8).setDepth(4.2).setVisible(false));
    const cycle = upMs + downMs;
    const RISE = 220, DIVE = 260, WARN = 500, SHIVER = 450;

    let state = 'hidden';
    return {
      sprite, back,
      get state() { return state; },
      get rideable() { return back.body.enable; },
      update() {
        const t = ((scene.time.now + offset) % cycle + cycle) % cycle;
        // Timeline within the cycle: [0, upMs) surfaced, [upMs, cycle) under water.
        let y = hiddenY, visible = false, rideable = false, frame = 0, jitter = 0;
        if (t < RISE) { state = 'rising'; visible = true; y = hiddenY + (surfacedY - hiddenY) * (t / RISE); rideable = t > RISE * 0.6; }
        else if (t < upMs - SHIVER) { state = 'up'; visible = true; y = surfacedY + Math.sin(t * 0.006) * 1; rideable = true; }
        else if (t < upMs) { state = 'shiver'; visible = true; y = surfacedY; rideable = true; jitter = (Math.floor(t / 50) % 2) ? 1 : -1; }
        else if (t < upMs + DIVE) { state = 'diving'; visible = true; frame = 1; y = surfacedY + (hiddenY - surfacedY) * ((t - upMs) / DIVE); }
        else { state = t > cycle - WARN ? 'bubbles' : 'hidden'; }
        sprite.setVisible(visible).setFrame(frame).setPosition(x + jitter, y)
          .setAlpha(state === 'diving' ? 1 - (t - upMs) / DIVE : 1);
        if (rideable !== back.body.enable) back.body.enable = rideable;
        // A soft splash as it breaks the surface.
        if (state === 'rising' && !wasUp) sfx(scene).playAt(scene, 'splash', x, waterY, { volume: 0.35, rate: 1.3 });
        wasUp = state !== 'hidden' && state !== 'bubbles';
        const showBubbles = state === 'bubbles' || state === 'diving';
        bubbles.forEach((b, i) => b.setVisible(showBubbles)
          .setPosition(x - 12 + i * 6 + Math.sin(t * 0.01 + i) * 1.5, waterY - ((t * 0.03 + i * 5) % 9)));
      },
      destroy() { removeColliders(); sprite.destroy(); back.destroy(); bubbles.forEach(b => b.destroy()); }
    };
  }
};
