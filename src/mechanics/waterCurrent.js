import { canvasTexture } from '../biomes/biomeArt.js';
import { bodyInRect } from './helpers.js';
import { sfx } from '../audio/soundManager.js';

// Waterfall currents.
//   { type: 'waterCurrent', x, y, width, height, dir = 'down' | 'up',
//     strength = 1100 (px/s²), maxSpeed = 360 (px/s), damping = 0.85,
//     pulse = null | { on: 1400, off: 1200, offset: 0 } }   // ms; off = only a trickle
// 'down' is a falling-water column: it drags the player down and damps upward speed each
// frame (0.85 = jumps reach about a third of their height: a short hop still works, a high
// jump or climbing out does not).
// 'up' is the spray at a fall's base: an updraft that lifts the player.
// Pulsing columns flicker for 400ms before they switch back on, so timing is readable.

function waterTextures(scene) {
  const fall = canvasTexture(scene, 'mech-water-column', 16, 48, p => {
    const tones = ['#4f9fb2', '#7cc4d0', '#b8e6ea', '#eefcfb'];
    for (let x = 0; x < 16; x++) {
      p.rect(x, 0, 1, 48, tones[(x * 5) % 3]);
      for (let y = (x * 11) % 48, n = 0; n < 3; n++, y = (y + 17) % 48) p.rect(x, y, 1, 6 + (x % 3) * 2, tones[3], 0.8);
    }
  });
  const spray = canvasTexture(scene, 'mech-spray-column', 16, 32, p => {
    for (let i = 0; i < 9; i++) p.rect((i * 7) % 16, (i * 13) % 32, 1, 5 + (i % 3) * 3, '#ffffff', 0.55);
  });
  return { fall, spray };
}

export default {
  type: 'waterCurrent',
  create(scene, cfg) {
    const { x, y, width, height, dir = 'down', strength = dir === 'up' ? 1500 : 1100,
      maxSpeed = dir === 'up' ? 300 : 360, pulse = null, damping = 0.85 } = cfg;
    const rect = { x, y, width, height };
    const tex = waterTextures(scene);
    const down = dir === 'down';
    const column = scene.add.tileSprite(x, y, width, height, down ? tex.fall : tex.spray)
      .setOrigin(0, 0).setDepth(down ? 1 : 0.9).setAlpha(down ? 0.78 : 0.32);
    // Foam and splash where a falling column lands; rising mist for updrafts.
    const foam = down ? [0, 1, 2].map(i => scene.add.ellipse(x + width / 2, y + height - 1, width * (1.3 + i * 0.35), 5, 0xf4fdfc, 0.55 - i * 0.12).setDepth(1.1)) : [];
    const mist = down ? [] : Array.from({ length: 10 }, (_, i) => ({
      dot: scene.add.circle(0, 0, 1.6 + (i % 3) * 0.6, 0xffffff, 0.5).setDepth(1),
      u: (i * 0.37) % 1, k: (i * 0.61) % 1
    }));
    const cycle = pulse ? pulse.on + pulse.off : 0;
    // Falling columns feed the waterfall ambience loop (louder as the player gets closer).
    const unregister = down ? sfx(scene).addWaterfall({ x: x + width / 2, halfWidth: width / 2, top: y, bottom: y + height }) : null;

    return {
      get active() {
        if (!pulse) return true;
        return ((scene.time.now + (pulse.offset || 0)) % cycle) < pulse.on;
      },
      update(time, delta) {
        const dt = delta / 1000, now = scene.time.now;
        const active = this.active;
        let alpha = down ? 0.78 : 0.32;
        if (pulse && !active) {
          const t = (now + (pulse.offset || 0)) % cycle;
          const warning = t > cycle - 400;      // about to switch on
          alpha = warning ? (Math.floor(now / 80) % 2 ? 0.55 : 0.2) : 0.12;
        }
        column.setAlpha(alpha);
        if (down) {
          column.tilePositionY -= 260 * dt;
          foam.forEach((f, i) => f.setScale(1 + Math.sin(now * 0.008 + i) * 0.12, 1).setVisible(active));
        } else {
          column.tilePositionY += 140 * dt;
          for (const m of mist) {
            m.u = (m.u + dt * 0.45) % 1;
            m.dot.setPosition(x + width * (0.15 + 0.7 * ((m.k + Math.sin(m.u * 6 + m.k * 9) * 0.1) % 1)), y + height * (1 - m.u))
              .setAlpha((active ? 0.55 : 0.15) * Math.sin(m.u * Math.PI));
          }
        }
        const player = scene.player;
        if (!active || scene.isLevelFinished || !player?.body?.enable || !bodyInRect(player.body, rect)) return;
        const body = player.body;
        if (down) {
          let vy = body.velocity.y;
          if (vy < 0) vy *= damping;             // falling water weakens a jump
          body.setVelocityY(Math.min(maxSpeed, vy + strength * dt));
        } else {
          body.setVelocityY(Math.max(-maxSpeed, body.velocity.y - strength * dt));
        }
      },
      destroy() {
        unregister?.();
        column.destroy(); foam.forEach(f => f.destroy()); mist.forEach(m => m.dot.destroy());
      }
    };
  }
};
