import { panel, label, button, playSound } from '../ui.js';
import { LEVEL_CONFIGS } from '../levels/levelConfigs.js';
import { prepareEnvironment, addEnvironment } from '../environment.js';
import { prepareCharacterSkin } from '../characterSkin.js';
import { prepareEnemySkin } from '../enemySkin.js';
import { addFinishTemple } from '../finishTemple.js';
import { addFinishFlag } from '../finishFlag.js';
import { addCambodiaJourney } from '../cambodiaJourney.js';
import { addAngkorWatBackdrop } from '../angkorWatBackdrop.js';
import { prepareAngkorGround } from '../angkorGround.js';

function parseTilesetDefinition(xml) {
  const document = new DOMParser().parseFromString(xml, 'application/xml');
  const tileset = document.querySelector('tileset');
  const image = tileset?.querySelector('image');
  if (!tileset || !image || document.querySelector('parsererror')) {
    throw new Error('Invalid temple tileset definition.');
  }
  const result = {
    name: tileset.getAttribute('name'), image: image.getAttribute('source'),
    imagewidth: Number(image.getAttribute('width')), imageheight: Number(image.getAttribute('height'))
  };
  for (const attribute of ['tilewidth', 'tileheight', 'columns', 'tilecount', 'margin', 'spacing']) {
    result[attribute] = Number(tileset.getAttribute(attribute) || 0);
  }
  return result;
}

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
    this.isInvulnerable = false;
    this.isLevelFinished = false;
    this.isSlidingDownFlag = false;
    this.isEnteringCastle = false;
  }

  preload() {
    for (let i = 1; i <= 10; i++) {
      this.load.tilemapTiledJSON('level' + i, 'assets/level' + i + '.tmj');
    }

    this.load.image('tiles', 'assets/tilemap_packed.png');
    this.load.image('environment-source', 'assets/enviroment.jpg');
    this.load.image('environment-palm', 'assets/sugar-palm-pixel.png');
    this.load.image('extra-life-food', 'assets/orn-sorm-jruk.png');
    if (this.currentLevel === 1) {
      this.load.image('kla-kon-mountain', 'assets/kla-kon-mountain.png');
      this.load.image('kla-kon-cliff', 'assets/kla-kon-cliff.png');
      this.load.image('banteay-chhmar', 'assets/banteay-chhmar-cutout.png');
      this.load.image('angkor-wat-finish', 'assets/angkor-wat-finish.png');
    }
    if (this.currentLevel === 2) {
      this.load.image('angkor-wat-level2', 'assets/angkor-wat-level2.png');
      this.load.image('templatiles-source', 'assets/7e3e7565-7700-4020-8c51-42681a90e4d6.png');
      this.load.image('templetiles-source', 'assets/temple_items.png');
      this.load.image('temple-part-source', 'assets/templepart.png');
      this.load.image('temple-decoration-tiles', 'assets/templepart_.png');
      this.load.text('tiles-definition', 'assets/tiles.tsx');
      this.load.text('temple_part-definition', 'assets/temple_part.tsx');
      this.load.text('templetiles-definition', 'assets/templetiles.tsx');
      this.load.text('templatiles-definition', 'assets/templatiles.tsx');
    }
    this.load.image('character-skin-source', 'assets/character-khmer.png');
    this.load.image('enemy-source', 'assets/anemy.jpg');
    this.load.spritesheet('packed', 'assets/tilemap_packed.png', {
      frameWidth: 18,
      frameHeight: 18
    });

    this.load.audio('jump', 'assets/audio/jump.wav');
    this.load.audio('coin', 'assets/audio/coin.wav');
    this.load.audio('stomp', 'assets/audio/stomp.wav');
    this.load.audio('bgm', 'assets/audio/bgm.mp3');
    this.load.audio('win', 'assets/audio/win.wav');
  }

  create() {
    prepareCharacterSkin(this);
    prepareEnemySkin(this);
    this.createAnimations();

    const config = LEVEL_CONFIGS[this.currentLevel] || LEVEL_CONFIGS[1];
    const mapKey = 'level' + this.currentLevel;
    if (this.currentLevel === 2) {
      const cachedMap = this.cache.tilemap.get(mapKey);
      cachedMap.data.tilesets = cachedMap.data.tilesets.map(tileset => {
        if (!tileset.source) return tileset;
        const filename = tileset.source.replaceAll('\\', '/').split('/').pop();
        const name = filename.replace(/\.tsx$/, '');
        const definition = this.cache.text.get(name + '-definition');
        const local = definition ? parseTilesetDefinition(definition) : null;
        if (!local) throw new Error(`Unknown Level 2 tileset: ${tileset.source}`);
        return { firstgid: tileset.firstgid, ...local };
      });
    }
    const map = this.make.tilemap({ key: mapKey });
    this.map = map;
    if (this.currentLevel === 1) addCambodiaJourney(this, map);
    if (this.currentLevel === 2) addAngkorWatBackdrop(this, map);

    const groundTiles = this.currentLevel === 2
      ? prepareAngkorGround(this)
      : prepareEnvironment(this);
    const tileImages = {
      tilemap_packed: groundTiles,
      templatiles: 'templatiles-source',
      templetiles: 'templetiles-source',
      temple_part: 'temple-part-source',
      tiles: 'temple-decoration-tiles'
    };
    const tilesets = map.tilesets.map(tileset => {
      const image = tileImages[tileset.name];
      if (!image) throw new Error(`Unknown tileset image: ${tileset.name}`);
      return map.addTilesetImage(tileset.name, image, tileset.tileWidth, tileset.tileHeight);
    });
    if (tilesets.some(tileset => !tileset)) {
      throw new Error('A level uses a tileset without a loaded image.');
    }

    this.groundLayer = map.createLayer('Platforms', tilesets, 0, 0);
    if (this.groundLayer) {
      this.groundLayer.setCollisionByExclusion([-1]);
    }
    if (this.currentLevel === 2 && map.getLayer('Temple Decorations')) {
      map.createLayer('Temple Decorations', tilesets, 0, 0).setDepth(-2);
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
        const coin = this.coinsGroup.create(pos.x, pos.y, 'packed', 151);
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
        const customEnemy = this.textures.exists('enemy-crabs');
        const enemy = customEnemy
          ? this.enemies.create(pos.x, pos.y, 'enemy-crabs', index % 3)
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
          enemy.play('enemy-walk');
          enemy.body.setSize(14, 14).setOffset(2, 4);
        }
      });
    }

    this.physics.add.collider(this.enemies, this.groundLayer);
    this.physics.add.collider(this.player, this.enemies, this.handlePlayerEnemyCollision, null, this);

    // Finish Section: Flagpole Trigger Zone (width - 15) and Castle Door (width - 7)
    const flagPixelX = (map.width - 15) * 18 + 9;
    this.flagX = flagPixelX;
    this.castleDoorX = (map.width - 7) * 18 + 9;

    // Extend in front of the solid pole so touching it always clears the level.
    this.goal = this.add.zone(flagPixelX, 99, 48, 198);
    this.physics.add.existing(this.goal, true);
    this.physics.add.overlap(this.player, this.goal, this.reachGoal, null, this);
    this.add.text(flagPixelX + 25, 145, 'FINISH', {
      fontSize: '12px', color: '#ffd700', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(10);

    // Camera setup with level sky color
    this.cameras.main.setBackgroundColor(config.skyColor || '#5c94fc');
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    // Frame Level 2 wider so its panoramic temple backdrop is more visible.
    this.cameras.main.setZoom(this.currentLevel === 2 ? 1.6 : 2.2);

    // Controls
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
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

    // BGM
    if (!this.sound.get('bgm')) {
      playSound(this, 'bgm', { loop: true, volume: 0.25 });
    } else if (!this.sound.get('bgm').isPlaying) {
      this.sound.get('bgm').play();
    }
  }

  pauseGame() {
    if (!this.scene.isActive() || this.scene.isActive('PauseScene')) return;
    const music = this.sound.get('bgm');
    const resumeMusic = !!music?.isPlaying;
    if (resumeMusic) music.pause();
    this.input.keyboard?.resetKeys();
    this.scene.launch('PauseScene', { resumeMusic });
    this.scene.pause();
  }

  showLevelIntroBanner(title) {
    const banner = this.screenText(400, 95, 'LEVEL ' + this.currentLevel + ': ' + title.toUpperCase(), {
      fontSize: '18px',
      color: '#ffd700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      padding: { left: 14, right: 14, top: 6, bottom: 6 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(300);

    this.tweens.add({
      targets: banner,
      alpha: 0,
      y: banner.y - 12,
      delay: 1500,
      duration: 800,
      onComplete: () => banner.destroy()
    });
  }

  createAnimations() {
    const customPlayer = this.textures.exists('player-character');
    const playerFrames = (frames, fallback) => this.anims.generateFrameNumbers(
      customPlayer ? 'player-character' : 'packed', { frames: customPlayer ? frames : fallback });
    // Refresh these when restarting so a newly added image replaces the fallback.
    ['player-walk', 'player-idle', 'player-jump'].forEach(key => this.anims.remove(key));
    if (!this.anims.exists('player-walk')) {
      this.anims.create({
        key: 'player-walk',
        frames: playerFrames([5, 6, 7, 8, 9], [24, 25]),
        frameRate: 10,
        repeat: -1
      });
    }
    if (!this.anims.exists('player-idle')) {
      this.anims.create({
        key: 'player-idle',
        frames: playerFrames([0, 1, 2, 3, 4], [24]),
        frameRate: 5,
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
        frameRate: 4,
        repeat: -1
      });
    }
    if (!this.anims.exists('coin-spin')) {
      this.anims.create({
        key: 'coin-spin',
        frames: this.anims.generateFrameNumbers('packed', { frames: [151, 152] }),
        frameRate: 6,
        repeat: -1
      });
    }
  }

  screenText(x, y, message, style) {
    const zoom = this.cameras.main.zoom;
    return this.add.text(400 + (x - 400) / zoom, 225 + (y - 225) / zoom, message, style)
      .setScale(1 / zoom).setScrollFactor(0);
  }

  createHUD() {
    const zoom = this.cameras.main.zoom;
    this.hudContainer = this.add.container(400 - 400 / zoom, 225 - 225 / zoom)
      .setScale(1 / zoom).setScrollFactor(0).setDepth(200);
    const values = [
      ['STAGE', 'levelText', 'LVL ' + this.currentLevel + '/10', '#86d9ce'],
      ['YOUR SCORE', 'scoreText', 'SCORE: ' + String(this.score).padStart(5, '0'), '#ffffff'],
      ['COLLECTED', 'coinsText', 'COINS: ' + String(this.coins).padStart(2, '0'), '#ffcf70'],
      ['LIVES', 'lifeHearts', '', '#ffa99b']
    ];
    values.forEach(([title, key, value, color], i) => {
      const x = 16 + i * 194;
      const bg = panel(this, x, 12, 186, 51);
      const caption = label(this, x + 93, 25, title, 9, '#93a9c1');
      this[key] = key === 'lifeHearts'
        ? this.add.graphics({ x: x + 44, y: 34 })
        : label(this, x + 93, 45, value, 15, color);
      this.hudContainer.add([bg, caption, this[key]]);
    });
    this.drawLifeHearts();
    this.extraLivesText = label(this, 763, 45, '', 11, '#86d9ce');
    this.hudContainer.add(this.extraLivesText);
    this.drawLifeHearts();
    this.pauseButton = button(this, 729, 91, 112, 'II  Pause', () => this.pauseGame());
    // Input checks the interactive child's scroll factor, not just its HUD parent.
    this.pauseButton.setScrollFactor(0);
    this.hudContainer.add(this.pauseButton);
  }

  drawLifeHearts() {
    this.extraLivesText?.setText(this.lives > 3 ? '+' + (this.lives - 3) : '');
    // Each character is one pixel in the heart: outline, fill, or highlight.
    const pixels = [
      '.ooo..ooo.',
      'ohhhoohhho',
      'ohhhhhhhho',
      'offffffffo',
      '.offffffo.',
      '..offffo..',
      '...offo...',
      '....oo....'
    ];
    const graphics = this.lifeHearts;
    graphics.clear();
    for (let heart = 0; heart < 3; heart++) {
      const filled = heart < this.lives;
      pixels.forEach((row, y) => {
        [...row].forEach((pixel, x) => {
          if (pixel === '.' || (!filled && pixel !== 'o')) return;
          const color = !filled ? 0x607089
            : pixel === 'o' ? 0x8e3e32
            : pixel === 'h' ? 0xffa06d : 0xf16b45;
          graphics.fillStyle(color).fillRect(heart * 35 + x * 2.75, y * 2.75, 2.75, 2.75);
        });
      });
    }
  }

  prepareCoinBlocks(coins) {
    this.coinBlocks = new Map();
    this.groundLayer.forEachTile(tile => {
      if (tile.index === 48 && tile.x < this.map.width - 25) {
        this.coinBlocks.set(tile.y * this.map.width + tile.x, {
          tile, coins: 0, nextHit: 0, image: null
        });
      }
    });
    // Choose one reachable underside near the midpoint, away from the finish.
    const candidates = [...this.coinBlocks.values()].filter(block =>
      !this.groundLayer.hasTileAt(block.tile.x, block.tile.y + 1));
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
      const key = this.currentLevel === 2
        ? (block.coins || block.extraLife ? 'temple-coin-block' : 'temple-used-block')
        : (block.coins || block.extraLife) && this.textures.exists('environment-block')
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
    if (!block || (!block.coins && !block.extraLife) || this.time.now < block.nextHit) return;
    block.nextHit = this.time.now + 250;
    if (block.extraLife) {
      block.extraLife = false;
      if (!block.coins) block.image.setTexture(this.currentLevel === 2 ? 'temple-used-block' : 'used-coin-block').setDisplaySize(18, 18);
      const food = this.lifeItems.create(tile.pixelX + 9, tile.pixelY + 9, 'extra-life-food')
        .setDisplaySize(25, 25).setDepth(10);
      const nameplate = this.add.container(food.x, food.y + 18).setDepth(11);
      const plaque = this.add.graphics();
      plaque.fillStyle(0x17271f, 0.96).fillRoundedRect(-61, -10, 122, 20, 4);
      plaque.lineStyle(1, 0xe4bd69, 0.95).strokeRoundedRect(-61, -10, 122, 20, 4);
      const nameLabel = this.add.text(0, 0, 'Ansorm Jruk', {
        fontFamily: 'Arial, Trebuchet MS, sans-serif', fontSize: '8px', fontStyle: 'bold',
        color: '#fff2cf', stroke: '#17271f', strokeThickness: 1,
        align: 'center', padding: { x: 4, y: 2 }
      }).setOrigin(0.5).setResolution(4);
      nameplate.add([plaque, nameLabel]);
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
    if (!block.coins) block.image.setTexture(this.currentLevel === 2 ? 'temple-used-block' : 'used-coin-block').setDisplaySize(18, 18);
    playSound(this, 'coin', { volume: 0.4 });
    this.score += 100;
    this.coins++;
    this.updateHUD();
    const coin = this.add.sprite(tile.pixelX + 9, tile.pixelY - 4, 'packed', 151);
    coin.play('coin-spin');
    this.tweens.add({ targets: coin, y: coin.y - 24, alpha: 0, duration: 450,
      onComplete: () => coin.destroy() });
    this.tweens.add({ targets: block.image, y: tile.pixelY + 5, duration: 90,
      yoyo: true });
    this.showFloatingText(tile.pixelX + 9, tile.pixelY - 12, '+100', '#ffd700');
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
    this.score += 100;
    this.coins += 1;
    this.updateHUD();
    this.showFloatingText(coin.x, coin.y - 8, '+100', '#ffd700');
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
    this.levelText.setText('LVL ' + this.currentLevel + '/10');
    this.scoreText.setText('SCORE: ' + String(this.score).padStart(5, '0'));
    this.coinsText.setText('COINS: ' + String(this.coins).padStart(2, '0'));
    this.drawLifeHearts();
  }

  handlePlayerEnemyCollision(player, enemy) {
    if (this.isLevelFinished) return;

    const isFalling = player.body.velocity.y > 0;
    const isAbove = (player.body.bottom - enemy.body.top) < 10;

    if (isFalling && isAbove) {
      playSound(this, 'stomp', { volume: 0.5 });
      player.setVelocityY(-260);
      this.score += 200;
      this.updateHUD();
      this.showFloatingText(enemy.x, enemy.y - 8, '+200', '#4ade80');

      enemy.disableBody(true, false);
      enemy.setAlpha(0.6);
      enemy.setScale(enemy.scaleX, enemy.scaleY * 0.4);
      this.time.delayedCall(200, () => enemy.destroy());
    } else {
      if (this.isInvulnerable) return;

      this.lives -= 1;
      this.updateHUD();

      if (this.lives <= 0) {
        this.sound.stopByKey('bgm');
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
    this.isLevelFinished = true;
    this.finishFlag.setVisible(true);
    this.tweens.add({
      targets: this.finishFlag,
      y: this.finishFlag.getData('raisedY'),
      duration: 900,
      ease: 'Sine.easeInOut'
    });

    // Stop music and play victory sound
    this.sound.stopByKey('bgm');
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
        // Step 2: Walk toward the victory castle
        this.isSlidingDownFlag = false;
        player.setFlipX(false);
        player.play('player-walk', true);
        this.isEnteringCastle = true;
        this.tweens.add({
          targets: player,
          x: this.castleDoorX,
          y: 11 * 18 - 9,
          duration: (this.castleDoorX - this.flagX) / 65 * 1000,
          ease: 'Linear',
          onComplete: () => this.triggerCastleFireworks()
        });
      }
    });

    this.score += 500;
    this.updateHUD();
  }

  triggerCastleFireworks() {
    this.isEnteringCastle = false;
    this.player.setVelocity(0, 0);
    this.player.setVisible(false); // Player entered castle!

    // Spawn 4 celebration fireworks above the castle
    const castleCenter = (this.map.width - 7) * 18 + 9;
    const colors = ['#ffd700', '#ff3366', '#33ccff', '#33ff66'];

    for (let f = 0; f < 4; f++) {
      this.time.delayedCall(f * 350, () => {
        const fx = castleCenter + (Math.random() * 40 - 20);
        const fy = 60 + Math.random() * 30;
        this.createFireworkSparkles(fx, fy, colors[f % colors.length]);
      });
    }

    // Display Finish Clear Banner
    this.time.delayedCall(400, () => {
      const banner = this.screenText(400, 160, '★ LEVEL ' + this.currentLevel + ' COMPLETE! ★', {
        fontSize: '24px',
        color: '#ffd700',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 5,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        padding: { left: 20, right: 20, top: 10, bottom: 10 }
      }).setOrigin(0.5).setScrollFactor(0).setDepth(400);

      const bonusText = this.screenText(400, 210, 'CLEAR BONUS: +500 PTS', {
        fontSize: '18px',
        color: '#4ade80',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5).setScrollFactor(0).setDepth(400);

      this.tweens.add({
        targets: [banner, bonusText],
        scale: { from: 0.9 / this.cameras.main.zoom, to: 1 / this.cameras.main.zoom },
        duration: 400,
        yoyo: true,
        repeat: 2
      });
    });

    // Advance to next level or Victory Scene
    this.time.delayedCall(2600, () => {
      if (this.currentLevel < 10) {
        this.scene.start('GameScene', {
          level: this.currentLevel + 1,
          score: this.score,
          coins: this.coins,
          lives: this.lives
        });
      } else {
        this.scene.start('VictoryScene', {
          level: 10,
          score: this.score + 1000,
          coins: this.coins
        });
      }
    });
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

    if (this.isLevelFinished) return;

    // Enemy patrol AI
    this.enemies.children.iterate(enemy => {
      if (enemy && enemy.body) {
        if (enemy.body.blocked.left) {
          enemy.setVelocityX(this.enemySpeed);
          enemy.setFlipX(true);
        } else if (enemy.body.blocked.right) {
          enemy.setVelocityX(-this.enemySpeed);
          enemy.setFlipX(false);
        }
      }
    });

    // Player Movement controls
    const left = this.cursors && (this.cursors.left.isDown || (this.wasd && this.wasd.left.isDown));
    const right = this.cursors && (this.cursors.right.isDown || (this.wasd && this.wasd.right.isDown));
    const jump = this.cursors && (this.cursors.up.isDown || (this.wasd && (this.wasd.up.isDown || this.wasd.space.isDown)));

    if (left) {
      this.player.setVelocityX(-150);
      this.player.setFlipX(true);
      if (this.player.body.blocked.down) {
        this.player.play('player-walk', true);
      }
    } else if (right) {
      this.player.setVelocityX(150);
      this.player.setFlipX(false);
      if (this.player.body.blocked.down) {
        this.player.play('player-walk', true);
      }
    } else {
      this.player.setVelocityX(0);
      if (this.player.body.blocked.down) {
        this.player.play('player-idle', true);
      }
    }

    if (jump && this.player.body.blocked.down) {
      this.player.setVelocityY(-350);
      this.player.play('player-jump', true);
      playSound(this, 'jump', { volume: 0.4 });
    }

    if (!this.player.body.blocked.down) {
      this.player.play('player-jump', true);
    }

    // Pit fall detection
    if (this.player.y > 280) {
      this.sound.stopByKey('bgm');
      this.scene.start('GameOverScene', {
        level: this.currentLevel,
        score: this.score,
        coins: this.coins
      });
    }
  }
}
