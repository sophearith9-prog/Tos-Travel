import { panel, label, button, playSound } from '../ui.js';
import { audioSettings } from '../audioSettings.js';
import { MAX_ARROW_AMMO } from '../arrowRules.js';
import { showStageClear } from '../levelClear.js';
import { extendAngkorCauseway, installLevelTwoTrial } from '../levelTwoTrial.js';
import { LEVEL_CONFIGS } from '../levels/levelConfigs.js';
import { prepareEnvironment, addEnvironment } from '../environment.js';
import { prepareCharacterSkin } from '../characterSkin.js';
import { prepareEnemySkin } from '../enemySkin.js';
import { addFinishTemple } from '../finishTemple.js';
import { addFinishFlag } from '../finishFlag.js';
import { addCambodiaJourney } from '../cambodiaJourney.js';
import { addAngkorWatBackdrop } from '../angkorWatBackdrop.js';
import { prepareAngkorGround } from '../angkorGround.js';
import { touchControls } from '../mobileControls.js';
import { installCombat, setupEnemy, updateCombat, updateBowPose, grantBoxArrows } from '../combat.js';
import { TOTAL_LEVELS } from '../levels/provinceRoute.js';
import { createProvinceMap } from '../levels/provinceLevels.js';
import { addProvinceScenery, prepareProvinceTerrain } from '../provinceScenery.js';
import { addScrollingBackdrop } from '../scrollingBackdrop.js';
import { installFinalBoss } from '../finalBoss.js';
import { addTempleEntrance } from '../templeEntrance.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    this.currentLevel = data.level || 1;
    this.score = data.score || 0;
    this.coins = data.coins || 0;
    this.levelStartScore = this.score;
    this.levelStartCoins = this.coins;
    this.lives = data.lives !== undefined ? data.lives : 3;
    this.comboCount = 0;
    this.comboExpiresAt = 0;
    this.isInvulnerable = false;
    this.isLevelFinished = false;
    this.isSlidingDownFlag = false;
    this.isEnteringCastle = false;
    this.arrows = Math.min(MAX_ARROW_AMMO, Math.max(0, Number(data.arrows) || 0));
    this.arrowText = null;
    this.shootKey = null;
    this.sprintKey = null;
    this.templeEntrance = null;
  }

  preload() {
    if (this.currentLevel <= 3) this.load.tilemapTiledJSON('level' + this.currentLevel, 'assets/level' + this.currentLevel + '.tmj');

    this.load.image('tiles', 'assets/tilemap_packed.png');
    this.load.image('environment-source', 'assets/enviroment.jpg');
    this.load.image('environment-palm', 'assets/sugar-palm-pixel.png');
    this.load.image('extra-life-food', 'assets/orn-sorm-jruk.png');
    if (this.currentLevel === 1) {
      //this.load.audio('rooster-morning', 'assets/audio/roostermorning_sound.mp3');
      //this.load.image('kla-kon-mountain', 'assets/kla-kon-mountain.png');
      //this.load.image('kla-kon-cliff', 'assets/kla-kon-cliff.png');
      this.load.image('banteay-temple-background', 'assets/banteay-chhmar-level1-panorama.png');
      this.load.image('angkor-wat-finish', 'assets/angkor-wat-finish.png');
    }
    const musicKey = this.currentLevel === 2 ? 'bgm-level-2' : 'bgm-default';
    const musicFile = this.currentLevel === 2 ? 'skothom.mp3' : 'bgm.mp3';
    this.load.audio(musicKey, `assets/audio/${musicFile}`);
    if (this.currentLevel === 2) {
      this.load.image('angkor-wat-level2', 'assets/angkor-wat-level2.png');
      this.load.image('temple-part-source', 'assets/templepart.png');
      this.load.image('temple-decoration-tiles', 'assets/templepart_.png');
      this.load.text('tiles-definition', 'assets/tiles.tsx');
      this.load.image('temple-items-tiles', 'assets/temple_items.png');
      this.load.text('temple_items-definition', 'assets/temple_items.tsx');
    }
    if (this.currentLevel >= 3) {
      this.load.image('khmer-finish-house', 'assets/khmer-finish-house.png');
    }
    if (this.currentLevel === 3) {
      this.load.image('angkor-sunset-level3', 'assets/angkor-sunset-level3-pixel.png');
      this.load.image('temple-part-source', 'assets/templepart.png');
    }
    if (LEVEL_CONFIGS[this.currentLevel]?.province?.id === 'banteay-meanchey') {
      this.load.image('banteay-countryside', 'assets/banteay-meanchey-countryside.jpg');
      this.load.image('banteay-temple-interior', 'assets/banteay-meanchey-forest-pixel.png');
      this.load.image('khmer-entrance-gate', 'assets/angkor-thom-finish-gate.png');
    }
    this.load.image('character-skin-source', 'assets/character-khmer.png');
    this.load.image('enemy-source', 'assets/khmer-guardian-animations.png');
    this.load.spritesheet('packed', 'assets/tilemap_packed.png', {
      frameWidth: 18,
      frameHeight: 18
    });
    if (this.currentLevel === 2) {
      this.load.audio('jump', 'assets/audio/jump.wav');
      this.load.audio('coin', 'assets/audio/coin.wav');
      this.load.audio('stomp', 'assets/audio/stomp.wav');
      this.load.audio('win', 'assets/audio/win.wav');
    }else{
      this.load.audio('jump', 'assets/audio/jump.wav');
      this.load.audio('coin', 'assets/audio/coin.wav');
      this.load.audio('stomp', 'assets/audio/stomp.wav');
      this.load.audio('win', 'assets/audio/win.wav');
    }
  }

  create() {
    prepareCharacterSkin(this);
    prepareEnemySkin(this);
    this.createAnimations();

    const config = LEVEL_CONFIGS[this.currentLevel] || LEVEL_CONFIGS[1];
    this.province = config.province;
    const mapKey = 'level' + this.currentLevel;
    if (config.province) {
      this.cache.tilemap.remove(mapKey);
      this.cache.tilemap.add(mapKey, { format: Phaser.Tilemaps.Formats.TILED_JSON, data: createProvinceMap(config) });
    }
    // Tiled may save this tileset externally after the map is edited.
    // Phaser needs its definition embedded before it parses tile IDs.
    if (this.currentLevel === 2) {
      const cachedMap = this.cache.tilemap.get(mapKey);
      cachedMap.data.tilesets = cachedMap.data.tilesets.map(tileset => {
        if (!tileset.source) return tileset;
        const name = tileset.source.replaceAll('\\', '/').split('/').pop().replace(/\.tsx$/, '');
        const xml = this.cache.text.get(name + '-definition');
        if (!xml) throw new Error(`Missing tileset definition: ${tileset.source}`);
        const doc = new DOMParser().parseFromString(xml, 'application/xml');
        const root = doc.querySelector('tileset');
        const image = root.querySelector('image');
        const embedded = { firstgid: tileset.firstgid, name: root.getAttribute('name'),
          image: image.getAttribute('source'), imagewidth: Number(image.getAttribute('width')),
          imageheight: Number(image.getAttribute('height')) };
        for (const key of ['tilewidth', 'tileheight', 'tilecount', 'columns', 'margin', 'spacing']) {
          embedded[key] = Number(root.getAttribute(key) || 0);
        }
        return embedded;
      });
      extendAngkorCauseway(cachedMap.data);
    }
    const map = this.make.tilemap({ key: mapKey });
    this.map = map;
    if (this.currentLevel === 1) addCambodiaJourney(this, map);
    if (this.currentLevel === 2) addAngkorWatBackdrop(this, map);

    const groundTiles = config.province ? prepareProvinceTerrain(this, config.province)
      : this.currentLevel === 2 || this.currentLevel === 3
      ? prepareAngkorGround(this)
      : prepareEnvironment(this);
    const tileImages = {
      tilemap_packed: groundTiles,
      tiles: 'temple-decoration-tiles',
      temple_items: 'temple-items-tiles'
    };
    const tilesets = map.tilesets.map(tileset => {
      const image = tileImages[tileset.name];
      if (!image) throw new Error(`Unknown tileset image: ${tileset.name}`);
      if (!this.textures.exists(image)) return null;
      // Tiled can reference the same named tileset at multiple firstgid values.
      // Attach to this instance; name lookup would always select the first one.
      return tileset.setImage(this.textures.get(image));
    });
    if (tilesets.some(tileset => !tileset)) {
      throw new Error('A level uses a tileset without a loaded image.');
    }

    this.groundLayer = map.createLayer('Platforms', tilesets, 0, 0);
    if (this.groundLayer) {
      this.groundLayer.setCollisionByExclusion([-1]);
      if (this.currentLevel === 3) this.groundLayer.setTint(0x82958b);
    }
    addEnvironment(this, map);
    addFinishTemple(this, map);
    this.finishFlag = addFinishFlag(this, map);

    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels + 80);

    // Spawn Player
    const customPlayer = this.textures.exists('player-character');
    this.player = customPlayer
      ? this.physics.add.sprite(50, 150, 'player-character', 0)
      : this.physics.add.sprite(50, 150, 'packed', 24);
    this.player.setCollideWorldBounds(true);
    this.player.setBounce(0);
    if (customPlayer) {
      // Keep the original collision size and foot position with larger artwork.
      const scale = 24 / Math.max(this.player.width, this.player.height);
      this.player.setScale(scale);
      this.player.setOrigin(0.5, 1 - 9 / (this.player.height * scale));
      this.player.body.setSize(14 / scale, 16 / scale).setOffset(
        (this.player.width - 14 / scale) / 2,
        this.player.height - 16 / scale
      );
    } else {
      this.player.body.setSize(14, 16).setOffset(2, 2);
    }
    this.physics.add.collider(this.player, this.groundLayer, this.hitCoinBlock, null, this);

    // Spawn Coins from level config
    this.coinsGroup = this.physics.add.staticGroup();
    const looseCoins = this.prepareCoinBlocks(config.coins || []);
    if (looseCoins.length) {
      looseCoins.forEach(pos => {
        const coin = this.coinsGroup.create(pos.x, pos.y, 'khmer-coin', 2);
        coin.play('coin-spin');
      });
    }
    this.physics.add.overlap(this.player, this.coinsGroup, this.collectCoin, null, this);
    this.lifeItems = this.physics.add.group();
    this.physics.add.collider(this.lifeItems, this.groundLayer);
    this.physics.add.overlap(this.player, this.lifeItems, this.collectLifeItem, null, this);

    // Spawn Enemies from level config
    this.enemies = this.physics.add.group();
    this.enemySpeed = config.enemySpeed || 40;
    if (config.enemies) {
      config.enemies.forEach((pos, index) => {
        const customEnemy = this.textures.exists('enemy-guardians');
        const enemy = customEnemy
          ? this.enemies.create(pos.x, pos.y, 'enemy-guardians', (index % 3) * 6)
          : this.enemies.create(pos.x, pos.y, 'packed', 22);
        enemy.setBounce(0);
        enemy.setCollideWorldBounds(true);
        enemy.setVelocityX(-this.enemySpeed);
        if (customEnemy) {
          const scale = 28 / 96;
          enemy.setScale(scale).setOrigin(0.5, 1 - 9 / 28);
          enemy.body.setSize(14 / scale, 14 / scale)
            .setOffset((96 - 14 / scale) / 2, 96 - 14 / scale);
        } else {
          enemy.body.setSize(14, 14).setOffset(2, 4);
        }
        setupEnemy(this, enemy, index, pos.variant);
      });
    }

    this.physics.add.collider(this.enemies, this.groundLayer, null, (enemy, tile) => {
      // The giant lands on platform tops without getting trapped under low ceilings.
      return !enemy.isBoss || (enemy.body.velocity.y >= 0 && enemy.body.bottom <= tile.pixelY + 12);
    });
    this.physics.add.collider(this.player, this.enemies, this.handlePlayerEnemyCollision, null, this);

    // Finish Section: Flagpole Trigger Zone (width - 15) and Castle Door (width - 7)
    const flagPixelX = (map.width - 15) * 18 + 9;
    this.flagX = flagPixelX;
    this.castleDoorX = (map.width - 7) * 18 + 9;

    // Extend in front of the solid pole so touching it always clears the level.
    this.goal = this.add.zone(flagPixelX, 99, 48, 198);
    this.physics.add.existing(this.goal, true);
    this.physics.add.overlap(this.player, this.goal, this.reachGoal, null, this);
    this.goalLabel = this.add.text(flagPixelX + 25, 145,
      this.currentLevel === 2 ? 'SEALED' : 'FINISH', {
      fontSize: '12px', color: '#ffd700', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(10);
    // Camera setup with level sky color
    this.cameras.main.setBackgroundColor(config.skyColor || '#5c94fc');
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    // Frame Level 2 wider so its panoramic temple backdrop is more visible.
    this.cameras.main.setZoom(this.currentLevel === 2 ? 1.6 : 2.2);
    if (this.currentLevel === 1) addScrollingBackdrop(this, 'banteay-temple-background', -19, 0.65, true);
    if (this.currentLevel === 2) installLevelTwoTrial(this);
    if (config.province) addProvinceScenery(this, config.province);
    if (config.province?.id === 'banteay-meanchey') this.templeEntrance = addTempleEntrance(this);
    if (this.currentLevel === 3) {
      const zoom = this.cameras.main.zoom;
      this.textures.get('angkor-sunset-level3').setFilter(Phaser.Textures.FilterMode.NEAREST);
      // Keep the full sunset composition visible as the level scrolls.
      this.add.image(400, 225, 'angkor-sunset-level3')
        .setDisplaySize(800 / zoom, 450 / zoom)
        .setScrollFactor(0).setDepth(-20);
    }

    // Controls
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.sprintKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
      this.wasd = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        right: Phaser.Input.Keyboard.KeyCodes.D,
        space: Phaser.Input.Keyboard.KeyCodes.SPACE
      });
      const pause = event => { if (!event.repeat) this.pauseGame(); };
      this.input.keyboard.on('keydown-ESC', pause);
      this.events.once('shutdown', () => this.input.keyboard.off('keydown-ESC', pause));
    }

    this.createHUD();
    this.showLevelIntroBanner(config.title);
    if (this.currentLevel === 1) this.time.delayedCall(450, () => playSound(this, 'rooster-morning', { volume: 0.7 }));
    installCombat(this);
    installFinalBoss(this);
    if (this.currentLevel === TOTAL_LEVELS && this.input.keyboard) {
      this.screenText(18, 110, 'HOLD SHIFT + MOVE: SPRINT', {
        fontSize: '12px', fontStyle: 'bold', color: '#87d7ca',
        stroke: '#17271f', strokeThickness: 3
      }).setDepth(210);
    }

    // Stop the previous level's track, then resume or start this level's music.
    this.musicKey = this.currentLevel === 2 ? 'bgm-level-2' : 'bgm-default';
    const otherMusicKey = this.musicKey === 'bgm-level-2' ? 'bgm-default' : 'bgm-level-2';
    this.sound.stopByKey(otherMusicKey);
    const music = this.sound.get(this.musicKey);
    if (!music) playSound(this, this.musicKey, { loop: true, volume: 0.25 });
    else {
      music.setVolume(audioSettings.music ? 0.25 : 0);
      if (!music.isPlaying) music.play();
    }
  }

  pauseGame() {
    if (!this.scene.isActive() || this.scene.isActive('PauseScene')) return;
    const music = this.sound.get(this.musicKey);
    const resumeMusic = !!music?.isPlaying;
    if (resumeMusic) music.pause();
    this.input.keyboard?.resetKeys();
    this.scene.launch('PauseScene', { resumeMusic });
    this.scene.pause();
  }

  showLevelIntroBanner(title) {
    const banner = this.screenText(400, 95, 'LEVEL ' + this.currentLevel + ': ' + title.toUpperCase(), {
      fontSize: '18px', color: '#ffd700', fontStyle: 'bold', stroke: '#000000',
      strokeThickness: 4, backgroundColor: 'rgba(0, 0, 0, 0.6)',
      padding: { left: 14, right: 14, top: 6, bottom: 6 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(300);
    this.tweens.add({ targets: banner, alpha: 0, y: banner.y - 12, delay: 1500,
      duration: 800, onComplete: () => banner.destroy() });
  }

  createAnimations() {
    if (!this.textures.exists('khmer-coin')) {
      const coinTexture = this.textures.createCanvas('khmer-coin', 18 * 6, 18);
      const ctx = coinTexture.context;
      ctx.imageSmoothingEnabled = false;
      const widths = [3, 5, 7, 9, 7, 5];
      widths.forEach((radius, frame) => {
        const x = frame * 18, cx = x + 9, cy = 9;
        ctx.fillStyle = '#9b3d08';
        ctx.beginPath(); ctx.ellipse(cx, cy, radius, 8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f28b0d';
        ctx.beginPath(); ctx.ellipse(cx, cy, Math.max(1, radius - 1), 7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffd52e';
        ctx.beginPath(); ctx.ellipse(cx, cy, Math.max(1, radius - 2), 6, 0, 0, Math.PI * 2); ctx.fill();
        if (radius >= 5) {
          ctx.save(); ctx.translate(cx, cy); ctx.scale((radius - 1) / 6, 1);
          ctx.strokeStyle = '#e87508'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.ellipse(0, 0, 5, 5, 0, 0, Math.PI * 2); ctx.stroke();
          // A bold, embossed center mark keeps the coin readable at small sizes.
          ctx.fillStyle = '#b64b08';
          ctx.fillRect(-2, -4, 5, 10); ctx.fillRect(-3, -4, 7, 2);
          ctx.fillStyle = '#fff16b';
          ctx.fillRect(-1, -3, 3, 8); ctx.fillRect(-2, -3, 5, 1);
          ctx.fillStyle = '#f59b0b';
          ctx.fillRect(1, -2, 1, 7);
          ctx.restore();
        }
        coinTexture.add(frame, 0, x, 0, 18, 18);
      });
      coinTexture.refresh();
      coinTexture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
    for (let variant = 0; variant < 3; variant++) {
      const start = variant * 6;
      for (const [action, frames, rate, repeat] of [
        ['walk', [start, start + 1, start + 2, start + 3], 10, -1],
        ['attack', [start + 4, start + 4, start + 5, start + 5], 6, 0]
      ]) {
        const key = `guardian-${action}-${variant}`;
        this.anims.remove(key);
        this.anims.create({ key, frames: this.anims.generateFrameNumbers('enemy-guardians', { frames }), frameRate: rate, repeat });
      }
    }
    const customPlayer = this.textures.exists('player-character');
    const playerFrames = (frames, fallback) => this.anims.generateFrameNumbers(
      customPlayer ? 'player-character' : 'packed', { frames: customPlayer ? frames : fallback });
    // Refresh these when restarting so a newly added image replaces the fallback.
    ['player-walk', 'player-idle', 'player-jump'].forEach(key => this.anims.remove(key));
    if (!this.anims.exists('player-walk')) {
      this.anims.create({
        key: 'player-walk',
        frames: playerFrames([5, 6, 7, 8, 9], [24, 25]),
        frameRate: 12,
        repeat: -1
      });
    }
    if (!this.anims.exists('player-idle')) {
      this.anims.create({
        key: 'player-idle',
        frames: playerFrames([0, 1, 2, 3, 4], [24]),
        frameRate: 6,
        repeat: -1
      });
    }
    if (!this.anims.exists('player-jump')) {
      this.anims.create({
        key: 'player-jump',
        frames: playerFrames([17], [25]),
        frameRate: 1
      });
    }
    if (!this.anims.exists('enemy-walk')) {
      this.anims.create({
        key: 'enemy-walk',
        frames: this.anims.generateFrameNumbers('packed', { frames: [22, 23] }),
        frameRate: 7,
        repeat: -1
      });
    }
    this.anims.remove('coin-spin');
    this.anims.create({
      key: 'coin-spin',
      frames: this.anims.generateFrameNumbers('khmer-coin', { frames: [0, 1, 2, 3, 4, 5] }),
      frameRate: 10,
      repeat: -1
    });
  }

  screenText(x, y, message, style) {
    const zoom = this.cameras.main.zoom;
    return this.add.text(400 + (x - 400) / zoom, 225 + (y - 225) / zoom, message, style)
      .setScale(1 / zoom).setScrollFactor(0);
  }

  createHUD() {
    const zoom = this.cameras.main.zoom;
    this.hudContainer = this.add.container(400 - 400 / zoom, 225 - 225 / zoom)
      .setScale(1 / zoom).setScrollFactor(0).setDepth(200).setAlpha(0);
    const textStyle = { fontFamily: 'Trebuchet MS, Arial, sans-serif', fontStyle: 'bold',
      stroke: '#101711', strokeThickness: 6 };
    const hudText = (x, y, value, size, color) => this.add.text(x, y, value, {
      ...textStyle, fontSize: `${size}px`, color
    }).setOrigin(0, 0.5);

    this.lifeHearts = this.add.container(14, 23);
    this.lifeHeartIcons = Array.from({ length: 3 }, (_, heart) => {
      const icon = this.add.text(heart * 27, 0, '❤️', {
        fontFamily: 'Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, sans-serif',
        fontSize: '20px', stroke: '#351519', strokeThickness: 2
      }).setOrigin(0, 0.5);
      this.lifeHearts.add(icon);
      return icon;
    });
    this.levelText = hudText(268, 23, `STAGE ${this.currentLevel}/${TOTAL_LEVELS}`, 13, '#f4f1df');
    this.scoreText = hudText(370, 23, String(this.score).padStart(5, '0'), 13, '#f4f1df');
    this.arrowText = hudText(570, 23, `➤ ${this.arrows}`, 14, '#f4f1df');
    this.coinsText = hudText(676, 23, String(this.coins).padStart(2, '0'), 15, '#fff4dc');
    this.coinIcon = this.add.image(658, 23, 'khmer-coin', 2).setDisplaySize(19, 19);
    this.hudContainer.add([this.lifeHearts, this.levelText, this.scoreText, this.arrowText,
      this.coinIcon, this.coinsText]);
    this.drawLifeHearts();
    this.extraLivesText = hudText(88, 23, '', 11, '#f4f1df');
    this.hudContainer.add(this.extraLivesText);
    const pauseIcon = this.add.container(773, 23);
    const pausePlate = this.add.graphics();
    pausePlate.fillStyle(0x20364e, 0.88).fillRoundedRect(-12, -12, 24, 24, 5);
    pausePlate.lineStyle(1, 0xd8d7c9, 0.72).strokeRoundedRect(-11.5, -11.5, 23, 23, 5);
    const pauseMark = this.add.text(0, 0, 'Ⅱ', {
      fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '13px',
      fontStyle: 'bold', color: '#f4f1df'
    }).setOrigin(0.5);
    pauseIcon.add([pausePlate, pauseMark]);
    pauseIcon.setSize(30, 30).setInteractive({ useHandCursor: true });
    pauseIcon.on('pointerover', () => pauseIcon.setScale(1.1));
    pauseIcon.on('pointerout', () => pauseIcon.setScale(1));
    pauseIcon.on('pointerdown', () => this.pauseGame());
    // Input checks the interactive child's scroll factor, not just its HUD parent.
    pauseIcon.setScrollFactor(0);
    this.hudContainer.add(pauseIcon);
    this.comboText = this.screenText(400, 77, '', {
      fontSize: '12px', fontStyle: 'bold', color: '#ffe19a',
      stroke: '#172338', strokeThickness: 3
    }).setOrigin(0.5).setDepth(220).setAlpha(0);
    this.tweens.add({ targets: this.hudContainer, alpha: 1,
      duration: 700, delay: 120, ease: 'Sine.easeOut' });
  }

  drawLifeHearts() {
    this.extraLivesText?.setText(this.lives > 3 ? '+' + (this.lives - 3) : '');
    this.lifeHeartIcons?.forEach((icon, heart) => {
      icon.setText(heart < this.lives ? '❤️' : '🤍');
      icon.setAlpha(heart < this.lives ? 1 : 0.55);
    });
  }

  prepareCoinBlocks(coins) {
    this.coinBlocks = new Map();
    if (this.currentLevel >= 4) {
      if (!this.textures.exists('bow-supply-box')) {
        const texture = this.textures.createCanvas('bow-supply-box', 18, 18);
        const ctx = texture.context;
        ctx.fillStyle = '#503416'; ctx.fillRect(0, 0, 18, 18);
        ctx.fillStyle = '#eab74f'; ctx.fillRect(1, 1, 16, 16);
        ctx.fillStyle = '#ffe6a0'; ctx.fillRect(2, 2, 14, 2);
        ctx.fillStyle = '#ac732f'; ctx.fillRect(2, 14, 14, 2);
        ctx.fillStyle = '#503416';
        ['111', '001', '011', '010', '000', '010'].forEach((row, y) =>
          [...row].forEach((pixel, x) => { if (pixel === '1') ctx.fillRect(6 + x * 2, 3 + y * 2, 2, 2); }));
        texture.refresh();
      }
      for (const target of [8, Math.floor(this.map.width * 0.3), Math.floor(this.map.width * 0.5), Math.floor(this.map.width * 0.68)]) {
        const columns = Array.from({ length: 13 }, (_, i) => target + i - 6)
          .filter(x => x >= 4 && x < this.map.width - 25)
          .sort((a, b) => Math.abs(a - target) - Math.abs(b - target));
        const x = columns.find(col => this.groundLayer.hasTileAt(col, 11) &&
          [8, 9, 10].every(row => !this.groundLayer.hasTileAt(col, row)));
        if (x !== undefined) {
          this.groundLayer.putTileAt(48, x, 8).setCollision(true, true, true, true);
        }
      }
    }
    this.groundLayer.forEachTile(tile => {
      if (tile.index === 48 && tile.x < this.map.width - 25) {
        this.coinBlocks.set(tile.y * this.map.width + tile.x, {
          tile, coins: 0, nextHit: 0, image: null
        });
      }
    });
    // Choose one reachable underside near the midpoint, away from the finish.
    const jumpHeight = 350 * 350 / (2 * this.physics.world.gravity.y);
    const candidates = [...this.coinBlocks.values()].filter(({ tile }) => {
      // Ceiling trim sits behind the HUD; keep the bonus on a visible platform.
      if (tile.y < 3) return false;
      if (this.groundLayer.hasTileAt(tile.x, tile.y + 1)) return false;
      // The player's head must be able to reach the box from a surface below it.
      for (let y = tile.y + 2; y < this.map.height; y++) {
        if (this.groundLayer.hasTileAt(tile.x, y)) {
          return y * this.map.tileHeight - (tile.pixelY + tile.height)
            <= jumpHeight + this.player.body.height;
        }
      }
      return false;
    });
    candidates.sort((a, b) => Math.abs(a.tile.x - this.map.width / 2)
      - Math.abs(b.tile.x - this.map.width / 2));
    if (!candidates.length) {
      const columns = Array.from({ length: this.map.width - 30 }, (_, i) => i + 3)
        .sort((a, b) => Math.abs(a - this.map.width / 2) - Math.abs(b - this.map.width / 2));
      const x = columns.find(col => this.groundLayer.hasTileAt(col, 11) &&
        [8, 9, 10].every(row => !this.groundLayer.hasTileAt(col, row)));
      if (x !== undefined) {
        const tile = this.groundLayer.putTileAt(48, x, 8);
        tile.setCollision(true, true, true, true);
        const block = { tile, coins: 0, nextHit: 0, image: null };
        this.coinBlocks.set(8 * this.map.width + x, block);
        candidates.push(block);
      }
    }
    if (candidates.length) candidates[0].extraLife = true;
    if (this.currentLevel >= 4) {
      const supplyCandidates = [...this.coinBlocks.values()]
        .filter(block => !block.extraLife)
        .sort((a, b) => a.tile.x - b.tile.x);
      const supplyCount = Math.min(2, supplyCandidates.length);
      for (let i = 0; i < supplyCount; i++) {
        const index = Math.floor((i + 0.5) * supplyCandidates.length / supplyCount);
        supplyCandidates[index].arrowReward = true;
      }
    }
    const loose = [];
    for (const coin of coins) {
      let nearest = null, distance = 54 * 54 + 1;
      for (const block of this.coinBlocks.values()) {
        const dx = coin.x - (block.tile.pixelX + 9);
        const dy = coin.y - (block.tile.pixelY + 9);
        const d = dx * dx + dy * dy;
        if (d < distance) { nearest = block; distance = d; }
      }
      if (nearest) nearest.coins++;
      else loose.push(coin);
    }
    if (!this.textures.exists('used-coin-block')) {
      const texture = this.textures.createCanvas('used-coin-block', 18, 18);
      const ctx = texture.context;
      ctx.fillStyle = '#302b2c'; ctx.fillRect(0, 0, 18, 18);
      ctx.fillStyle = '#987047'; ctx.fillRect(1, 1, 16, 16);
      ctx.fillStyle = '#bd9462'; ctx.fillRect(2, 2, 14, 2);
      ctx.fillStyle = '#684c36'; ctx.fillRect(2, 14, 14, 2);
      for (const x of [3, 13]) for (const y of [5, 11]) ctx.fillRect(x, y, 2, 2);
      texture.refresh();
    }
    for (const block of this.coinBlocks.values()) {
      block.tile.alpha = 0;
      const key = block.arrowReward ? 'bow-supply-box'
        : this.currentLevel === 2 || this.currentLevel === 3
        ? (block.coins || block.extraLife ? 'temple-coin-block' : 'temple-used-block')
        : (block.coins || block.extraLife || block.arrowReward) && this.textures.exists('environment-block')
        ? 'environment-block' : 'used-coin-block';
      block.image = this.add.image(block.tile.pixelX + 9, block.tile.pixelY + 9, key)
        .setDisplaySize(18, 18).setDepth(-1);
    }
    return loose;
  }

  hitCoinBlock(player, tile) {
    if (this.isLevelFinished || !player.body.blocked.up) return;
    if (Math.abs(player.body.top - (tile.pixelY + tile.height)) > 2) return;
    const block = this.coinBlocks?.get(tile.y * this.map.width + tile.x);
    if (!block || (!block.coins && !block.extraLife && (!block.arrowReward || block.arrowClaimed)) || this.time.now < block.nextHit) return;
    block.nextHit = this.time.now + 250;
    grantBoxArrows(this, block);
    if (!block.coins && !block.extraLife) {
      block.image.setTexture('used-coin-block');
      this.tweens.add({ targets: block.image, y: tile.pixelY + 5, duration: 90, yoyo: true });
      return;
    }
    if (block.extraLife) {
      block.extraLife = false;
      if (!block.coins) block.image.setTexture((this.currentLevel === 2 || this.currentLevel === 3) ? 'temple-used-block' : 'used-coin-block').setDisplaySize(18, 18);
      const food = this.lifeItems.create(tile.pixelX + 9, tile.pixelY + 9, 'extra-life-food')
        .setDisplaySize(25, 25).setDepth(10);
      const nameplate = this.add.container(food.x, food.y + 18).setDepth(11);
      const nameLabel = this.add.text(0, 0, 'Ansorm Jruk', {
        fontFamily: 'Arial, Trebuchet MS, sans-serif', fontSize: '8px', fontStyle: 'bold',
        color: '#fff2cf', stroke: 'none', strokeThickness: 1,
        align: 'center', padding: { x: 4, y: 2 }
      }).setOrigin(0.5).setResolution(4);
      nameplate.add(nameLabel);
      const followFood = () => nameplate.setPosition(food.x, food.y + food.displayHeight / 2 + 4);
      this.events.on('postupdate', followFood);
      food.once('destroy', () => {
        this.events.off('postupdate', followFood);
        nameplate.destroy();
      });
      food.body.enable = false;
      this.tweens.add({ targets: food, y: tile.pixelY - 12, duration: 300,
        onComplete: () => {
          if (!food.active) return;
          food.body.reset(food.x, food.y);
          food.body.enable = true;
          food.setVelocity(0, 0);
        } });
      return;
    }
    block.coins--;
    if (!block.coins) block.image.setTexture((this.currentLevel === 2 || this.currentLevel === 3) ? 'temple-used-block' : 'used-coin-block').setDisplaySize(18, 18);
    playSound(this, 'coin', { volume: 0.4 });
    this.awardComboPoints(100, tile.pixelX + 9, tile.pixelY - 12);
    this.coins++;
    this.updateHUD();
    const coin = this.add.sprite(tile.pixelX + 9, tile.pixelY - 4, 'khmer-coin', 2);
    coin.play('coin-spin');
    this.playCoinFeedback(coin.x, coin.y);
    this.tweens.add({ targets: coin, y: coin.y - 24, alpha: 0, duration: 450,
      onComplete: () => coin.destroy() });
    this.tweens.add({ targets: block.image, y: tile.pixelY + 5, duration: 90,
      yoyo: true });
  }

  collectLifeItem(player, food) {
    if (this.isLevelFinished || !food.active || !food.body.enable) return;
    food.disableBody(true, true);
    this.lives++;
    this.updateHUD();
    playSound(this, 'coin', { volume: 0.6 });
    this.showFloatingText(food.x, food.y - 12, '+1 LIFE', '#86efac');
    food.destroy();
  }

  collectCoin(player, coin) {
    coin.disableBody(true, true);
    playSound(this, 'coin', { volume: 0.4 });
    this.awardComboPoints(100, coin.x, coin.y - 8);
    this.coins += 1;
    this.updateHUD();
    this.playCoinFeedback(coin.x, coin.y);
  }

  playCoinFeedback(x, y) {
    // A quick gold burst makes every pickup feel rewarding without obscuring play.
    const ring = this.add.circle(x, y, 5, 0xffd52e, 0).setStrokeStyle(1.5, 0xffb31a, 1).setDepth(120);
    this.tweens.add({ targets: ring, scale: 2.6, alpha: 0, duration: 240,
      ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
    for (let i = 0; i < 7; i++) {
      const angle = Phaser.Math.DegToRad(i * (360 / 7));
      const sparkle = this.add.star(x, y, 4, 1.5, 3.5, 0xffe66b).setDepth(121);
      this.tweens.add({
        targets: sparkle,
        x: x + Math.cos(angle) * 15,
        y: y + Math.sin(angle) * 15,
        alpha: 0,
        angle: Phaser.Math.Between(-100, 100),
        scale: 0.25,
        duration: 260,
        ease: 'Cubic.easeOut',
        onComplete: () => sparkle.destroy()
      });
    }
    this.tweens.killTweensOf([this.coinIcon, this.coinsText]);
    this.coinIcon.setScale(1);
    this.coinsText.setScale(1);
    this.tweens.add({ targets: [this.coinIcon, this.coinsText], scale: 1.3,
      duration: 90, yoyo: true, ease: 'Back.easeOut' });
  }

  createLandingPuff() {
    const groundY = this.player.body.bottom - 2;
    for (const side of [-1, 1]) {
      const puff = this.add.ellipse(this.player.x + side * 5, groundY, 4, 2, 0xf4d69a, 0.75)
        .setDepth(12);
      this.tweens.add({
        targets: puff,
        x: puff.x + side * Phaser.Math.Between(5, 9),
        y: puff.y - Phaser.Math.Between(2, 5),
        scaleX: 1.6,
        alpha: 0,
        duration: 220,
        ease: 'Sine.easeOut',
        onComplete: () => puff.destroy()
      });
    }
  }

  awardComboPoints(basePoints, x, y) {
    const now = this.time.now;
    this.comboCount = now <= this.comboExpiresAt ? this.comboCount + 1 : 1;
    this.comboExpiresAt = now + 2400;
    const multiplier = Math.min(5, 1 + Math.floor((this.comboCount - 1) / 2));
    const points = basePoints * multiplier;
    this.score += points;
    if (this.comboCount > 1) {
      this.showFloatingText(x, y, `${this.comboCount} CHAIN  +${points}`, multiplier > 1 ? '#ffcf70' : '#ffe39a');
      this.comboText.setText(`COMBO ${this.comboCount}  Â·  x${multiplier}`).setAlpha(1);
      this.tweens.killTweensOf(this.comboText);
      this.tweens.add({ targets: this.comboText, alpha: 0.35, duration: 900, delay: 800 });
    } else {
      this.showFloatingText(x, y, `+${points}`, '#ffd700');
      this.comboText.setAlpha(0);
    }
    return points;
  }

  showFloatingText(x, y, message, color) {
    const text = this.add.text(x, y, message, {
      fontSize: '10px',
      color: color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    this.tweens.add({
      targets: text,
      y: y - 16,
      alpha: 0,
      duration: 600,
      onComplete: () => text.destroy()
    });
  }

  updateHUD() {
    this.levelText.setText(`STAGE ${this.currentLevel}/${TOTAL_LEVELS}`);
    this.scoreText.setText(String(this.score).padStart(5, '0'));
    this.coinsText.setText(String(this.coins).padStart(2, '0'));
    this.drawLifeHearts();
    this.arrowText?.setText(`➤ ${this.arrows}`);
  }

  handlePlayerEnemyCollision(player, enemy, forceDamage = false) {
    if (this.isLevelFinished) return;

    const isFalling = player.body.velocity.y > 0;
    const isAbove = (player.body.bottom - enemy.body.top) < 10;

    if (!forceDamage && isFalling && isAbove) {
      playSound(this, 'stomp', { volume: 0.5 });
      player.setVelocityY(-260);
      // The final guardian requires arrow hits; stomping only bounces the player.
      if (enemy.isBoss) return;
      this.awardComboPoints(200, enemy.x, enemy.y - 8);
      this.updateHUD();

      enemy.disableBody(true, false);
      enemy.setAlpha(0.6);
      enemy.setScale(enemy.scaleX, enemy.scaleY * 0.4);
      this.time.delayedCall(200, () => enemy.destroy());
    } else {
      if (this.isInvulnerable) return;

      if (this.comboCount > 1) {
        this.comboText?.setText('COMBO LOST').setAlpha(1);
        this.tweens.killTweensOf(this.comboText);
        this.tweens.add({ targets: this.comboText, alpha: 0, duration: 350, delay: 450 });
      }
      this.comboCount = 0;
      this.comboExpiresAt = 0;

      // Play an impact cue for every damaging enemy contact; invulnerable overlaps return above.
      playSound(this, 'stomp', { volume: 0.72, rate: 1.05 });

      this.lives -= 1;
      this.updateHUD();

      if (this.lives <= 0) {
        this.sound.stopByKey(this.musicKey);
        this.scene.start('GameOverScene', {
          level: this.currentLevel,
          score: this.score,
          coins: this.coins
        });
      } else {
        this.isInvulnerable = true;
        player.setVelocityY(-180);
        player.setVelocityX(player.x < enemy.x ? -120 : 120);

        this.tweens.add({
          targets: player,
          alpha: 0.2,
          duration: 100,
          yoyo: true,
          repeat: 6,
          onComplete: () => {
            player.setAlpha(1);
            this.isInvulnerable = false;
          }
        });
      }
    }
  }

  // Complete Finish Cutscene Sequence
  reachGoal(player, goal) {
    if (this.isLevelFinished) return;
    if (this.currentLevel === 2 && !this.templeSwitchActivated) {
      if (this.time.now >= this.nextGateHintAt) {
        this.showFloatingText(player.x, player.y - 24,
          'Step on the lotus switch to open the Angkor gate!', '#ffe3a1');
        this.nextGateHintAt = this.time.now + 1400;
      }
      return;
    }
    if (this.boss?.active && this.boss.health > 0) {
      if (this.time.now >= (this.nextBossWarning || 0)) {
        this.showFloatingText(player.x, player.y - 25, 'Defeat the guardian first!', '#ffb4a9');
        this.nextBossWarning = this.time.now + 1500;
      }
      return;
    }
    this.isLevelFinished = true;
    this.bow?.setVisible(false);
    this.arrowProjectiles?.clear(true, true);
    this.rockProjectiles?.clear(true, true);
    this.finishFlag.setVisible(true);
    this.tweens.add({
      targets: this.finishFlag,
      y: this.finishFlag.getData('raisedY'),
      duration: 900,
      ease: 'Sine.easeInOut'
    });

    // Stop music and play victory sound
    this.sound.stopByKey(this.musicKey);
    playSound(this, 'win', { volume: 0.55 });

    // Step 1: Slide down flagpole
    player.setVelocity(0, 0);
    player.body.allowGravity = false;
    // The celebration follows a scripted path through decorative castle tiles.
    player.body.enable = false;
    player.play('player-jump');
    this.isSlidingDownFlag = true;

    const targetY = 10 * 18 - 8; // Ground level near flagpole base

    this.tweens.add({
      targets: player,
      x: this.flagX,
      y: targetY,
      duration: 600,
      ease: 'Linear',
      onComplete: () => {
        if (this.currentLevel === 2) {
          this.isSlidingDownFlag = false;
          player.play('player-idle', true);
          this.triggerCastleFireworks();
          return;
        }
        // Step 2: Walk toward the victory castle
        this.isSlidingDownFlag = false;
        player.setFlipX(false);
        player.play('player-walk', true);
        this.isEnteringCastle = true;
        this.tweens.add({
          targets: player,
          x: this.currentLevel >= 3 ? this.castleDoorX - 20 : this.castleDoorX,
          y: 11 * 18 - 9,
          duration: (this.castleDoorX - this.flagX) / 65 * 1000,
          ease: 'Linear',
          onComplete: () => {
            if (this.currentLevel >= 3) {
              this.tweens.add({ targets: player, x: this.castleDoorX,
                y: 11 * 18 - 29, duration: 450, ease: 'Linear',
                onComplete: () => this.triggerCastleFireworks() });
            } else this.triggerCastleFireworks();
          }
        });
      }
    });

    this.score += 500;
    this.updateHUD();
  }

  triggerCastleFireworks() {
    this.isEnteringCastle = false;
    this.player.setVelocity(0, 0);
    if (this.currentLevel !== 2) this.player.setVisible(false);

    const castleCenter = this.currentLevel === 2 ? this.flagX : (this.map.width - 7) * 18 + 9;
    const colors = ['#ffd700', '#ff3366', '#33ccff', '#33ff66'];
    for (let f = 0; f < 4; f++) {
      this.time.delayedCall(f * 350, () => {
        const fx = castleCenter + (Math.random() * 40 - 20);
        const fy = 60 + Math.random() * 30;
        this.createFireworkSparkles(fx, fy, colors[f % colors.length]);
      });
    }
    this.time.delayedCall(520, () => showStageClear(this));
  }
  createFireworkSparkles(x, y, color) {
    // Spawn 12 expanding particle sparks
    for (let p = 0; p < 12; p++) {
      const angle = (p / 12) * Math.PI * 2;
      const spark = this.add.rectangle(x, y, 4, 4, Phaser.Display.Color.HexStringToColor(color).color);
      spark.setDepth(150);

      const targetX = x + Math.cos(angle) * 35;
      const targetY = y + Math.sin(angle) * 35;

      this.tweens.add({
        targets: spark,
        x: targetX,
        y: targetY,
        alpha: 0,
        scale: 0.2,
        duration: 500,
        ease: 'Cubic.easeOut',
        onComplete: () => spark.destroy()
      });
    }
  }

  update() {
    if (!this.player) return;

    if (this.comboCount && this.time.now > this.comboExpiresAt) {
      this.comboCount = 0;
      this.comboText?.setAlpha(0);
    }

    if (this.isLevelFinished) return;

    if (this.templeEntrance?.update()) return;

    if (!this.templeEntrance?.outside) updateCombat(this);

    // Player Movement controls
    const left = touchControls.left || (this.cursors && (this.cursors.left.isDown || (this.wasd && this.wasd.left.isDown)));
    const right = touchControls.right || (this.cursors && (this.cursors.right.isDown || (this.wasd && this.wasd.right.isDown)));
    const jump = touchControls.jump || (this.cursors && (this.cursors.up.isDown || (this.wasd && (this.wasd.up.isDown || this.wasd.space.isDown))));
    const moveSpeed = this.currentLevel === TOTAL_LEVELS && this.sprintKey?.isDown ? 230 : 150;

    let targetVelocityX = 0;
    if (left) {
      targetVelocityX = -moveSpeed;
      this.player.setFlipX(true);
      if (this.player.body.blocked.down) {
        this.player.play('player-walk', true);
      }
    } else if (right) {
      targetVelocityX = moveSpeed;
      this.player.setFlipX(false);
      if (this.player.body.blocked.down) {
        this.player.play('player-walk', true);
      }
    } else {
      if (this.player.body.blocked.down) {
        this.player.play('player-idle', true);
      }
    }
    this.player.setVelocityX(Phaser.Math.Linear(this.player.body.velocity.x, targetVelocityX, 0.32));

    if (jump && this.player.body.blocked.down) {
      this.player.setVelocityY(-350);
      this.player.play('player-jump', true);
      playSound(this, 'jump', { volume: 0.4 });
    }

    if (!this.player.body.blocked.down) {
      this.player.play('player-jump', true);
    }

    const grounded = this.player.body.blocked.down;
    if (this.wasPlayerAirborne && grounded) this.createLandingPuff();
    this.wasPlayerAirborne = !grounded;

    updateBowPose(this);

    // Pit fall detection
    if (this.player.y > 280) {
      this.sound.stopByKey(this.musicKey);
      this.scene.start('GameOverScene', {
        level: this.currentLevel,
        score: this.score,
        coins: this.coins
      });
    }
  }
}
