import { resolveEnvironment } from './biomeConfig.js';
import { FAR, MID, NEAR, canvasTexture, skyTexture, farTexture, midTexture, nearTexture, ambientTextures, propTextures } from './biomeArt.js';
import { findFloorGaps } from '../pitMarkers.js';

// Biome backdrop for a stage: sky, three parallax layers, ground props, pooled ambient
// life, weather and a time-of-day light overlay. Purely visual: nothing here has a
// physics body, and no tiles, platforms, enemies, coins or flags are touched.

const ART = 2;            // screen pixels per art pixel (the pixel-art scale)
const HORIZON = 146;      // ground line in art pixels when the camera rests on the floor

const WATER_BIOMES = ['mekong-river', 'floating-village', 'coast', 'city'];
const FIREFLY_BIOMES = ['temple-jungle', 'rice-fields', 'highland-forest', 'mekong-river', 'floating-village'];

export function addBiomeScenery(scene, env) {
  const look = resolveEnvironment(env);
  look.timeKey = `${env.time}-${env.weather}`;
  const cam = scene.cameras.main, zoom = cam.zoom;
  const unit = ART / zoom;                       // world units per art pixel on screen-fixed layers
  const viewW = 800 / zoom + 6;
  const left = 400 - viewW / 2;
  const toWorldY = artY => 225 + (artY * ART - 225) / zoom;
  const maxScrollY = Math.max(0, scene.map.heightInPixels - 450 / zoom);
  cam.setBackgroundColor(look.time.skyBottom);

  /* Sky with a gently pulsing glow around the sun or moon. */
  scene.add.image(400, 225, skyTexture(scene, look)).setScale(unit).setScrollFactor(0).setDepth(-30);
  const orb = look.time.sun || look.time.moon;
  let glow = null;
  if (orb) {
    const glowKey = canvasTexture(scene, 'ambient-orb-glow', 48, 48, p => {
      for (let r = 24; r > 4; r -= 4) p.disc(24, 24, r, '#ffffff', 0.08);
    });
    glow = scene.add.image(400 + (orb.x * ART - 400) / zoom, toWorldY(orb.y), glowKey)
      .setScrollFactor(0).setDepth(-29).setBlendMode(Phaser.BlendModes.ADD)
      .setTint(Phaser.Display.Color.HexStringToColor(orb.glow).color).setScale(unit * orb.r / 9);
  }

  /* Parallax layers: screen-fixed tile sprites scrolled by the camera position. */
  const layer = (key, spec, bottomArtY, depth, parallax, lift) => {
    const height = spec.h * unit;
    const sprite = scene.add.tileSprite(400, toWorldY(bottomArtY) - height / 2, viewW, height, key)
      .setScrollFactor(0).setDepth(depth).setTileScale(unit, unit);
    return { sprite, baseY: sprite.y, parallax, lift };
  };
  const midBottom = HORIZON + (MID.h - MID.base);
  const layers = [
    // The far layer sits higher so its ridges and skyline rise above the midground horizon.
    layer(farTexture(scene, look), FAR, HORIZON - 22, -28, 0.08, 0.15),
    layer(midTexture(scene, look), MID, midBottom, -24, 0.22, 0.35),
    layer(nearTexture(scene, look), NEAR, HORIZON + 4 + (NEAR.h - NEAR.base), -20, 0.5, 0.6)
  ];
  const midLayer = layers[1];
  // Convert a point in the mid texture to its current on-screen world position.
  const midPoint = (texX, texY, scrollX, lift) => ({
    x: left + Phaser.Math.Wrap(texX * unit - scrollX * midLayer.parallax, 0, MID.w * unit),
    y: toWorldY(texY + (midBottom - MID.h)) + lift
  });

  const keys = ambientTextures(scene, look);
  const water = WATER_BIOMES.includes(look.biome);
  const extras = [];   // per-frame updaters for the pooled ambient objects

  /* Water shimmer over the midground river or sea. */
  if (water) {
    const band = look.biome === 'coast' ? 26 : look.biome === 'floating-village' ? 28 : 18;
    const shimmer = scene.add.tileSprite(400, toWorldY(HORIZON - band / 2 - 4), viewW, band * unit, keys.shimmer)
      .setScrollFactor(0).setDepth(-23.5).setTileScale(unit, unit).setAlpha(0.5);
    const baseY = shimmer.y;
    extras.push((t, sx, lift) => {
      shimmer.tilePositionX = sx * midLayer.parallax / unit + t * 0.004;
      shimmer.y = baseY + lift * midLayer.lift;
      shimmer.setAlpha(0.35 + Math.sin(t * 0.002) * 0.15);
    });
  }

  /* Swaying palms (or pines) in the near plane. */
  {
    const count = 3, period = viewW + 60;
    const palms = Array.from({ length: count }, (_, i) => ({
      sprite: scene.add.image(0, 0, keys.swayer).setOrigin(0.5, 1).setScrollFactor(0).setDepth(-19.5).setScale(unit),
      offset: (i * period) / count + 20, phase: i * 1.7
    }));
    const baseY = toWorldY(HORIZON + 3);
    extras.push((t, sx, lift) => {
      for (const palm of palms) {
        palm.sprite.x = left - 30 + Phaser.Math.Wrap(palm.offset - sx * 0.5, 0, period);
        palm.sprite.y = baseY + lift * 0.6;
        palm.sprite.angle = Math.sin(t * 0.0011 + palm.phase) * 2.6;
      }
    });
  }

  /* Birds by day: a small pooled flock crossing the sky. */
  if (!look.night && !look.rain) {
    const birds = Array.from({ length: 4 }, (_, i) => ({
      sprite: scene.add.image(0, 0, keys.bird, 0).setScrollFactor(0).setDepth(-25).setScale(unit),
      x: left + (i * viewW) / 4, y: toWorldY(30 + i * 13), speed: 0.012 + i * 0.003, phase: i
    }));
    extras.push((t, sx, lift, dt) => {
      for (const bird of birds) {
        bird.x += bird.speed * dt;
        if (bird.x > left + viewW + 10) { bird.x = left - 10; bird.y = toWorldY(24 + Math.random() * 60); }
        bird.sprite.setPosition(bird.x, bird.y + Math.sin(t * 0.002 + bird.phase) * 2);
        bird.sprite.setFrame(Math.floor(t / 180 + bird.phase) % 2);
      }
    });
  }

  /* Boats drifting across the water band. */
  if (water) {
    const boats = Array.from({ length: 2 }, (_, i) => ({
      sprite: scene.add.image(0, 0, keys.boat).setOrigin(0.5, 1).setScrollFactor(0).setDepth(-23).setScale(unit),
      offset: 120 + i * 330, speed: (i ? -1 : 1) * 0.004
    }));
    extras.push((t, sx, lift) => {
      for (const boat of boats) {
        const p = midPoint(boat.offset + t * boat.speed, MID.base - 10 - (boat.speed < 0 ? 4 : 0), sx, lift * midLayer.lift);
        boat.sprite.setPosition(p.x, p.y + Math.sin(t * 0.003 + boat.offset) * 0.6).setFlipX(boat.speed < 0);
      }
    });
  }

  /* Kratie's Irrawaddy dolphins surfacing in arcs. */
  if (look.landmark === 'kampi-dolphins') {
    const pods = Array.from({ length: 2 }, (_, i) => ({
      sprite: scene.add.image(0, 0, keys.dolphin).setScrollFactor(0).setDepth(-23).setScale(unit),
      texX: 180 + i * 300, cycle: 3600 + i * 900, shift: i * 1500
    }));
    extras.push((t, sx, lift) => {
      for (const pod of pods) {
        const phase = ((t + pod.shift) % pod.cycle) / 1000;
        const visible = phase < 1;
        pod.sprite.setVisible(visible);
        if (!visible) continue;
        const p = midPoint(pod.texX + phase * 22, MID.base - 14 - Math.sin(phase * Math.PI) * 9, sx, lift * midLayer.lift);
        pod.sprite.setPosition(p.x, p.y).setAngle(-35 + phase * 70);
      }
    });
  }

  /* Battambang's evening bat stream pouring out of Phnom Sampov's cave. */
  if (look.landmark === 'phnom-sampov') {
    const bats = Array.from({ length: 12 }, (_, i) => ({
      sprite: scene.add.image(0, 0, keys.bat, 0).setScrollFactor(0).setDepth(-23).setScale(unit), lag: i * 330
    }));
    extras.push((t, sx, lift) => {
      const cave = midPoint(360 + 28, MID.base - 64, sx, lift * midLayer.lift);
      for (const bat of bats) {
        const k = ((t + bat.lag) % 4000) / 4000;
        bat.sprite.setPosition(cave.x - k * 70 * unit * 3 + Math.sin(k * 14) * 6 * unit, cave.y - k * 50 * unit * 2)
          .setFrame(Math.floor(t / 120 + bat.lag) % 2).setAlpha(1 - k * 0.6);
      }
    });
  }

  /* Butterflies by day: world-space, recycled around the camera view. */
  if (!look.night && !look.rain && look.biome !== 'city') {
    const flies = Array.from({ length: 3 }, (_, i) => ({
      sprite: scene.add.image(0, 0, keys.butterfly, 0).setDepth(5), x: 0, y: 0, phase: i * 2.1, live: false
    }));
    extras.push((t, sx, lift, dt) => {
      const view = cam.worldView;
      for (const fly of flies) {
        if (!fly.live || fly.x < view.x - 30 || fly.x > view.right + 30) {
          fly.x = view.x + Math.random() * view.width; fly.y = 150 + Math.random() * 40; fly.live = true;
        }
        fly.x += Math.sin(t * 0.0009 + fly.phase) * 0.02 * dt;
        fly.sprite.setPosition(fly.x, fly.y + Math.sin(t * 0.004 + fly.phase) * 6)
          .setFrame(Math.floor(t / 90 + fly.phase) % 2);
      }
    });
  }

  /* Fireflies at night and dusk in green biomes (drawn above the light overlay). */
  if (look.night || (env.time === 'sunset' && FIREFLY_BIOMES.includes(look.biome))) {
    const flies = Array.from({ length: look.night ? 14 : 9 }, (_, i) => ({
      dot: scene.add.circle(0, 0, 1.1, 0xffe58a, 1).setDepth(151).setBlendMode(Phaser.BlendModes.ADD),
      x: 0, y: 0, phase: i * 0.9, live: false
    }));
    extras.push((t, sx, lift, dt) => {
      const view = cam.worldView;
      for (const fly of flies) {
        if (!fly.live || fly.x < view.x - 20 || fly.x > view.right + 20) {
          fly.x = view.x + Math.random() * view.width; fly.y = 110 + Math.random() * 85; fly.live = true;
        }
        fly.x += Math.cos(t * 0.0007 + fly.phase) * 0.008 * dt;
        fly.dot.setPosition(fly.x, fly.y + Math.sin(t * 0.0013 + fly.phase) * 5)
          .setAlpha(0.25 + 0.75 * Math.max(0, Math.sin(t * 0.0025 + fly.phase * 3)));
      }
    });
  }

  /* Drifting mist bands on misty mornings. */
  if (env.time === 'mist') {
    for (const [artY, depth, speed, alpha] of [[HORIZON - 30, -23.2, 0.004, 0.9], [HORIZON - 6, -19.2, 0.008, 0.75]]) {
      const band = scene.add.tileSprite(400, toWorldY(artY), viewW, 24 * unit, keys.mist)
        .setScrollFactor(0).setDepth(depth).setTileScale(unit, unit).setAlpha(alpha);
      const baseY = band.y;
      extras.push((t, sx, lift) => { band.tilePositionX = sx * 0.3 / unit + t * speed; band.y = baseY + lift * 0.4; });
    }
  }

  /* Light rain: a fixed-budget particle emitter in screen space. */
  if (look.rain) {
    scene.add.particles(0, 0, keys.drop, {
      x: { min: left, max: left + viewW + 40 }, y: toWorldY(-6),
      lifespan: 700, speedY: { min: 290, max: 340 }, speedX: { min: -42, max: -30 },
      scaleY: { min: 0.7, max: 1.1 }, alpha: { start: 0.75, end: 0.35 },
      quantity: 2, frequency: 30
    }).setScrollFactor(0).setDepth(152);
  }

  /* Time-of-day light over the world (below the HUD, which starts at depth 200). */
  if (look.overlay) {
    scene.add.rectangle(400, 225, viewW + 8, 450 / zoom + 8, look.overlay[0], look.overlay[1])
      .setScrollFactor(0).setDepth(150);
  }

  addGroundProps(scene, look);

  let elapsed = 0;
  const update = (time, delta) => {
    const dt = Math.min(50, delta || 16.7);
    elapsed += dt;
    const sx = cam.scrollX;
    // With zoom, scrollY is offset from the visible top edge; convert before comparing
    // against the lowest possible view top (camera resting on the floor).
    const viewTop = cam.scrollY + 225 - 225 / zoom;
    const lift = Math.max(0, maxScrollY - viewTop);
    for (const l of layers) {
      l.sprite.tilePositionX = (sx * l.parallax) / unit;
      l.sprite.y = l.baseY + lift * l.lift;
    }
    if (glow) glow.setAlpha(0.75 + Math.sin(elapsed * 0.0012) * 0.2);
    for (const step of extras) step(elapsed, sx, lift, dt);
  };
  scene.events.on('update', update);
  scene.events.once('shutdown', () => scene.events.off('update', update));
  update(0, 0);
  return look;
}

// Decorative props on solid ground only, clear of pits, raised platforms' supports,
// the finish area and the very start, so they never hide a hazard or route.
function addGroundProps(scene, look) {
  const layer = scene.groundLayer, map = scene.map;
  if (!layer || scene.collisionGround !== layer) return;
  const props = propTextures(scene, look);
  const gaps = findFloorGaps(scene);
  const nearGap = x => gaps.some(g => x >= g.from - 2 && x <= g.to + 2);
  const groundRow = 11;
  for (let x = 3; x < map.width - 28; x++) {
    if (nearGap(x) || !layer.getTileAt(x, groundRow)?.collides || layer.getTileAt(x, groundRow - 1)) continue;
    const h = Math.imul(x + scene.currentLevel * 97, 2654435761) >>> 0;
    if (h % 100 > 42) continue;
    const key = props[(h >>> 8) % props.length];
    scene.add.image(x * map.tileWidth + 3 + ((h >>> 4) % 12), groundRow * map.tileHeight + 1, key)
      .setOrigin(0.5, 1).setDepth(-1);
  }
}
