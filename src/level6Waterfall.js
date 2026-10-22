import { audioSettings, onAudioSettingsChange } from './audioSettings.js';

const WATERFALLS = [
  { x: 300, top: 336, bottom: 620, width: 21, speed: 0.075 },
  { x: 399, top: 420, bottom: 704, width: 24, speed: 0.10 },
  { x: 458, top: 420, bottom: 692, width: 17, speed: 0.085 }
];

function addWaterfallAudio(scene) {
  const manager = scene.sound;
  const context = manager?.context;
  if (!context?.createBuffer || !context?.createBufferSource) return;

  // Soft, filtered brown noise gives the cascades a continuous water-rush bed.
  const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
  const samples = buffer.getChannelData(0);
  let brownNoise = 0;
  for (let i = 0; i < samples.length; i++) {
    brownNoise = (brownNoise + (Math.random() * 2 - 1) * 0.035) / 1.035;
    samples[i] = brownNoise * 3.2;
  }

  const source = context.createBufferSource();
  const highPass = context.createBiquadFilter();
  const lowPass = context.createBiquadFilter();
  const gain = context.createGain();
  const destination = manager.masterVolumeNode || context.destination;
  source.buffer = buffer;
  source.loop = true;
  highPass.type = 'highpass';
  highPass.frequency.value = 110;
  lowPass.type = 'lowpass';
  lowPass.frequency.value = 1050;
  gain.gain.value = 0.0001;
  source.connect(highPass);
  highPass.connect(lowPass);
  lowPass.connect(gain);
  gain.connect(destination);
  source.start();

  let paused = false;
  const syncVolume = () => {
    const volume = !paused && audioSettings.sound ? 0.11 : 0.0001;
    gain.gain.setTargetAtTime(volume, context.currentTime, paused ? 0.12 : 0.45);
  };
  const onPause = () => { paused = true; syncVolume(); };
  const onResume = () => { paused = false; syncVolume(); };
  const unsubscribeAudio = onAudioSettingsChange(syncVolume);
  scene.events.on('pause', onPause);
  scene.events.on('resume', onResume);
  scene.events.once('shutdown', () => {
    unsubscribeAudio();
    scene.events.off('pause', onPause);
    scene.events.off('resume', onResume);
    try { source.stop(); } catch { /* The scene may already have stopped the source. */ }
    source.disconnect();
    highPass.disconnect();
    lowPass.disconnect();
    gain.disconnect();
  });
  syncVolume();
}

function makeFlowTextures(scene) {
  if (!scene.textures.exists('level6-falling-water')) {
    const texture = scene.textures.createCanvas('level6-falling-water', 24, 64);
    const ctx = texture.context;
    ctx.clearRect(0, 0, 24, 64);
    // A translucent turquoise sheet lets the painted falls show through.
    ctx.fillStyle = 'rgba(39, 179, 215, 0.26)';
    ctx.fillRect(0, 0, 24, 64);
    for (let y = 0; y < 64; y += 8) {
      const offset = (y / 8) % 2 ? 3 : 0;
      ctx.fillStyle = 'rgba(121, 232, 248, 0.22)';
      ctx.fillRect(1 + offset, y, 7, 6);
      ctx.fillStyle = 'rgba(224, 253, 255, 0.55)';
      ctx.fillRect(10 + offset, y + 2, 3, 5);
      ctx.fillStyle = 'rgba(84, 198, 229, 0.34)';
      ctx.fillRect(18 - offset, y + 1, 6, 6);
    }
    texture.refresh();
    texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
  }

  if (!scene.textures.exists('level6-pool-water')) {
    const texture = scene.textures.createCanvas('level6-pool-water', 96, 24);
    const ctx = texture.context;
    ctx.clearRect(0, 0, 96, 24);
    for (let row = 0; row < 4; row++) {
      const y = row * 6 + 1;
      for (let x = (row % 2) * 13; x < 96; x += 32) {
        ctx.fillStyle = row % 2
          ? 'rgba(135, 229, 248, 0.38)'
          : 'rgba(225, 252, 255, 0.5)';
        ctx.fillRect(x, y, 18 + (row % 3) * 4, 2);
        ctx.fillStyle = 'rgba(61, 176, 214, 0.22)';
        ctx.fillRect(x + 7, y + 2, 12, 1);
      }
    }
    texture.refresh();
    texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
  }
}

export function addLevel6WaterfallEffects(scene) {
  makeFlowTextures(scene);
  addWaterfallAudio(scene);
  const flowingWater = [];

  // Scroll narrow, transparent pixel-water sheets downward over each cascade.
  for (const fall of WATERFALLS) {
    const flow = scene.add.tileSprite(fall.x, (fall.top + fall.bottom) / 2,
      fall.width, fall.bottom - fall.top, 'level6-falling-water')
      .setDepth(-17).setAlpha(0.9);
    flow.tileScaleX = fall.width / 24;
    flowingWater.push({ sprite: flow, direction: 'down', speed: fall.speed });

    const lipFoam = scene.add.graphics().setDepth(-16);
    lipFoam.fillStyle(0x9af1fb, 0.62);
    for (let i = 0; i < 5; i++) {
      lipFoam.fillCircle(fall.x - fall.width * 0.43 + i * fall.width * 0.215,
        fall.top + (i % 2) * 2, 2.2);
    }
    scene.tweens.add({ targets: lipFoam, y: 1.5, alpha: 0.72,
      duration: 460 + fall.width * 9, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const foam = scene.add.ellipse(fall.x, fall.bottom, fall.width * 2.1, 6,
      0xd8fbff, 0.42).setDepth(-16);
    scene.tweens.add({ targets: foam, scaleX: 1.3, alpha: 0.68,
      duration: 510 + fall.width * 8, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    for (let i = 0; i < 4; i++) {
      const bubble = scene.add.circle(fall.x, fall.bottom - 2, 2 + (i % 2),
        i % 2 ? 0xe9fdff : 0x8de9fa, 0.84).setDepth(-15);
      const burst = () => {
        if (!bubble.active) return;
        bubble.setPosition(fall.x + Phaser.Math.Between(-fall.width, fall.width), fall.bottom - 2)
          .setAlpha(0.84).setScale(0.75);
        scene.tweens.add({ targets: bubble,
          x: bubble.x + Phaser.Math.Between(-15, 15), y: fall.bottom - Phaser.Math.Between(9, 24),
          alpha: 0, scale: 1.45, duration: 380 + i * 55, delay: i * 130,
          ease: 'Cubic.easeOut', onComplete: burst });
      };
      burst();
    }
  }

  // The basin runs across the whole painted pool. Several staggered bands
  // make the surface read as flowing water instead of a single moving stripe.
  const pool = scene.add.tileSprite(414, 727, 260, 38, 'level6-pool-water')
    .setDepth(-16).setAlpha(0.28);
  flowingWater.push({ sprite: pool, direction: 'right', speed: 0.045 });

  // The reference shows the basin spilling over the front cliff as a broad
  // curtain. Keep the falling sheet inside the painted cascade at the bottom.
  const frontSpill = scene.add.tileSprite(414, 779, 194, 62, 'level6-falling-water')
    .setDepth(-16).setAlpha(0.58);
  frontSpill.tileScaleX = 2.4;
  flowingWater.push({ sprite: frontSpill, direction: 'down', speed: 0.095 });
  const spillLip = scene.add.graphics().setDepth(-15);
  spillLip.fillStyle(0xd8fbff, 0.78);
  for (let i = 0; i < 19; i++) {
    const x = 319 + i * 10.5;
    spillLip.fillRoundedRect(x, 748 + (i % 3) * 2, 7 + (i % 4), 3, 1);
  }
  scene.tweens.add({ targets: spillLip, alpha: 0.55, y: 1,
    duration: 520, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

  return {
    update(delta) {
      const frameDelta = Math.min(50, Math.max(0, Number(delta) || 0));
      for (const water of flowingWater) {
        const offset = frameDelta * water.speed;
        if (water.direction === 'down') water.sprite.tilePositionY -= offset;
        else water.sprite.tilePositionX += water.direction === 'left' ? offset : -offset;
      }
    }
  };
}
