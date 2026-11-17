import { label, button, playSound } from '../ui.js';
import { audioSettings, onAudioSettingsChange, musicVolume, applyMusicVolume } from '../audioSettings.js';
import { bakeGraphics } from '../bakeGraphics.js';
import { addPitMarkers } from '../pitMarkers.js';
import { getLayout } from '../levels/layoutRegistry.js';
import { layoutLevelConfig } from '../levels/provinceLevels.js';
import { layoutMechanics } from '../levels/layoutFormat.js';
import { installLayoutTerrain } from '../levels/layoutTerrain.js';
import { installMechanics } from '../mechanics/index.js';
import { GameHUD } from '../hud.js';
import { sfx } from '../audio/soundManager.js';
import { SFX_FILES } from '../audio/sfxLibrary.js';
import { showStageClear } from '../levelClear.js';
import { extendAngkorCauseway, installLevelTwoTrial } from '../levelTwoTrial.js';
import { LEVEL_CONFIGS } from '../levels/levelConfigs.js';
import { prepareEnvironment, addEnvironment } from '../environment.js';
import { prepareCharacterSkin, PLAYER_CHARACTER_NAME } from '../characterSkin.js';
import { prepareEnemySkin } from '../enemySkin.js';
import { addFinishTemple } from '../finishTemple.js';
import { addFinishFlag } from '../finishFlag.js';
import { addCambodiaJourney } from '../cambodiaJourney.js';
import { addAngkorWatBackdrop } from '../angkorWatBackdrop.js';
import { prepareAngkorGround } from '../angkorGround.js';
import { touchControls } from '../mobileControls.js';
import { installCombat, setupEnemy, updateCombat, damageEnemy } from '../combat.js';
import { TOTAL_LEVELS } from '../levels/provinceRoute.js';
import { createProvinceMap } from '../levels/provinceLevels.js';
import { addProvinceScenery, prepareProvinceTerrain, prepareLevel4AtlasTiles, addLevel4PainterlyPlatforms } from '../provinceScenery.js';
import { addScrollingBackdrop } from '../scrollingBackdrop.js';
import { installFinalBoss } from '../finalBoss.js';
import { addTempleEntrance } from '../templeEntrance.js';
import { fadeSceneIn } from '../sceneTransitions.js';
import { LEVEL6, installLevel6Terrain } from '../levels/level6Layout.js';
import { addLevel6Gate } from '../level6Gate.js';
import { addLevel6Shop } from '../level6Shop.js';
import { addLevel6WaterfallEffects } from '../level6Waterfall.js';
import { LEVEL7, installLevel7Terrain } from '../levels/level7Layout.js';
import { LEVEL8 } from '../levels/level8Layout.js';
import { installLevel8Sanctum, attachLevel8Sanctum, updateLevel8Sanctum } from '../level8Sanctum.js';
import { LEVEL9 } from '../levels/level9Layout.js';
import { installLevel9Terrain, attachLevel9Highlands, updateLevel9Highlands } from '../level9Highlands.js';

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
    this.maxHealth = 150;
    this.health = data.health !== undefined
      ? Phaser.Math.Clamp(data.health, 0, this.maxHealth)
      : Math.min(this.maxHealth, this.lives * 50);
    if (this.lives <= 3) this.lives = Math.ceil(this.health / 50);
    this.shields = data.shields !== undefined ? data.shields : 3;
    this.nextShieldRecoveryAt = 0;
    this.level3GuardianDefeated = false;
    this.nextLevel3HintAt = 0;
    this.level6DropUntil = 0;
    this.dropInputDown = false;
    this.level6EnemiesDefeated = 0;
    this.comboCount = 0;
    this.comboExpiresAt = 0;
    this.isInvulnerable = false;
    this.isLevelFinished = false;
    this.isRunOver = false;
    this.isSlidingDownFlag = false;
    this.isEnteringCastle = false;
    this.sprintKey = null;
    this.templeEntrance = null;
    // Phaser reuses this scene object for every stage, so state that level modules
    // attach to it must be cleared here. Stale Level 8/9 state crashed Level 10, and a
    // stale shop could leave the player invulnerable on later stages.
    this.level6Shop = null;
    this.level8Sanctum = null;
    this.level8Shop = null;
    this.level8Checkpoint = null;
    this.level9Highlands = null;
    this.recordLevel8BossDefeat = null;
    this.recordLevel9BossDefeat = null;
    this.templeSwitchActivated = false;
    this.templeSwitch = null;
    this.templePortal = null;
    this.boss = null;
    this.nextBossWarning = 0;
    this.speedBoostUntil = 0;
    this.hitStopUntil = 0;
    this.meleeAnimationUntil = 0;
    this.meleeAnimationStartedAt = 0;
    // Leaving Level 1 during the boat intro would otherwise freeze the next stage.
    this.levelOneArrival = false;
    this.levelOneArrivalJump = false;
    this.wasPlayerAirborne = false;
    this.landingAnimationUntil = 0;
    this.nextRunGlintAt = 0;
    this.vitalBarsSignature = null;
    this.stageClearOpen = false;
    // Hand-made layout for stages 10-28 (null = generated stage or Levels 1-9).
    this.layout = this.currentLevel >= 10 ? getLayout(this.currentLevel) : null;
    this.mechanics = [];
    this.patrolTerrain = null;
    this.activeCheckpoint = null;
    this.goalLocks = [];          // functions returning a hint while the flag is locked
    this.safeGroundFilters = [];  // functions rejecting unsafe respawn spots
  }

  preload() {
    if (!this.textures.exists('nokor-adventure-logo')) {
      this.load.image('nokor-adventure-logo', 'assets/nokor-adventure-logo.png');
    }
    if (this.currentLevel <= 4) this.load.tilemapTiledJSON('level' + this.currentLevel, 'assets/level' + this.currentLevel + '.tmj');

    this.load.image('tiles', 'assets/tilemap_packed.png');
    this.load.image('environment-source', 'assets/enviroment.jpg');
    this.load.image('environment-palm', 'assets/sugar-palm-pixel.png');
    this.load.image('extra-life-food', 'assets/orn-sorm-jruk.png');
    if (this.currentLevel === 1) {
      //this.load.audio('rooster-morning', 'assets/audio/roostermorning_sound.mp3');
      //this.load.image('kla-kon-mountain', 'assets/kla-kon-mountain.png');
      //this.load.image('kla-kon-cliff', 'assets/kla-kon-cliff.png');
      this.load.image('banteay-temple-background', 'assets/banteay-chhmar-level1-panorama.png');
      this.load.image('portal-destination', 'assets/angkor-wat-level2.png');
      this.load.image('khmer-guardian-waypoint', 'assets/khmer-guardian-waypoint.png');
      this.load.image('khmer-entrance-gate', 'assets/angkor-thom-finish-gate.png');
      this.load.image('temple-part-source', 'assets/templepart.png');
    }
    const musicKey = this.currentLevel === 2 ? 'bgm-level-2' : 'bgm-default';
    const musicFile = this.currentLevel === 2 ? 'VdoGameMusic.mp3' : 'VdoGameMusic.mp3';
    this.load.audio(musicKey, `assets/audio/${musicFile}`);
    if (this.currentLevel === 2) {
      this.load.image('angkor-wat-level2', 'assets/angkor-wat-level2.png');
      this.load.image('temple-part-source', 'assets/templepart.png');
      this.load.image('temple-decoration-tiles', 'assets/templepart_.png');
      this.load.text('tiles-definition', 'assets/tiles.tsx');
      this.load.image('temple-items-tiles', 'assets/temple_items.png');
      this.load.text('temple_items-definition', 'assets/temple_items.tsx');
    }
    if (this.currentLevel === 4) {
      // Tiled exports these Level 4 tilesets as external TSX definitions.
      this.load.text('temple_items-definition', 'assets/temple_items.tsx');
      this.load.text('lv4-definition', 'assets/lv4.tsx');
      this.load.text('templetiless-definition', 'assets/templetiless.tsx');
      this.load.image('temple-items-tiles', 'assets/temple_items.png');
    }
    if (this.currentLevel >= 3) {
      this.load.image('khmer-finish-house', 'assets/khmer-finish-house.png');
    }
    if (this.currentLevel === 4) {
      this.load.image('temple-jungle-atlas', 'assets/temple-jungle-expanded.png');
      this.load.image('angkor-painterly-background-wide', 'assets/angkor-painterly-background-wide.png');
      this.load.image('level4-painterly-platforms', 'assets/level4-painterly-platforms.png');
    }
    if (this.currentLevel === 6) {
      this.load.image('level6-forest-platforms', 'assets/level6-forest-platforms.png');
      this.load.image('khmer-entrance-gate', 'assets/angkor-thom-finish-gate.png');
    }
    if (this.currentLevel === 7) {
      this.load.image('level7-preah-vihear-v2', 'assets/level7-preah-vihear-v2.png');
    }
    if (this.currentLevel === 8) {
      this.load.image('level8-sanctum-sky', 'assets/level8-sanctum-sky.png');
    }
    if (this.currentLevel === 9) {
      this.load.image('level9-ratanakiri-crater', 'assets/level9-ratanakiri-crater.png');
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
    // Sound-effect recordings listed in src/audio/sfxLibrary.js (SFX_FILES); anything not
    // listed there uses its synthesized placeholder.
    for (const [key, url] of Object.entries(SFX_FILES)) {
      if (!this.cache.audio.exists(key)) this.load.audio(key, url);
    }
    // Extra images a hand-made layout asks for.
    for (const { key, url } of this.layout?.assets || []) {
      if (!this.textures.exists(key)) this.load.image(key, url);
    }
    this.load.spritesheet('vireak-sword-actions', 'assets/vireak-sword-actions.png', {
      frameWidth: 384,
      frameHeight: 256
    });
    this.load.image('enemy-source', 'assets/khmer-guardian-animations.png');
    this.load.spritesheet('stone-guardian', 'assets/stone-guardian-actions.png', {
      frameWidth: 384,
      frameHeight: 256
    });
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
    this.game.sound.stopByKey('intro-menu-music');
    fadeSceneIn(this, 520);
    prepareCharacterSkin(this);
    prepareEnemySkin(this);
    this.createAnimations();

    const baseConfig = LEVEL_CONFIGS[this.currentLevel] || LEVEL_CONFIGS[1];
    const config = this.layout ? layoutLevelConfig(this.layout, baseConfig) : baseConfig;
    this.province = config.province;
    this.levelConfig = config;
    const mapKey = 'level' + this.currentLevel;
    if (config.province && this.currentLevel !== 4) {
      this.cache.tilemap.remove(mapKey);
      this.cache.tilemap.add(mapKey, { format: Phaser.Tilemaps.Formats.TILED_JSON, data: createProvinceMap(config) });
    }
    // Tiled may save this tileset externally after the map is edited.
    // Phaser needs its definition embedded before it parses tile IDs.
    if (this.currentLevel === 2 || this.currentLevel === 4) {
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
      if (this.currentLevel === 2) extendAngkorCauseway(cachedMap.data);
    }
    const map = this.make.tilemap({ key: mapKey });
    this.map = map;
    if (this.currentLevel === 1) addCambodiaJourney(this, map);
    if (this.currentLevel === 2) addAngkorWatBackdrop(this, map);

    const groundTiles = config.province ? prepareProvinceTerrain(this, config.province)
      : this.currentLevel === 1 || this.currentLevel === 2 || this.currentLevel === 3
      ? prepareAngkorGround(this)
      : prepareEnvironment(this);
    const tileImages = {
      tilemap_packed: groundTiles,
      level4_jungle: this.currentLevel === 4 ? prepareLevel4AtlasTiles(this) : null,
      lv4: 'angkor-painterly-background-wide',
      tiles: 'temple-decoration-tiles',
      temple_items: 'temple-items-tiles',
      templetiles: 'temple-jungle-atlas'
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

    if (this.currentLevel === 4 && map.getLayer('Water')) {
      map.createLayer('Water', tilesets, 0, 0).setDepth(-1);
    }
    this.groundLayer = map.createLayer('Platforms', tilesets, 0, 0);
    if (this.groundLayer) {
      this.groundLayer.setCollisionByExclusion([-1]);
      if (this.layout || this.currentLevel === 6 || this.currentLevel === 7 || this.currentLevel === 8 || this.currentLevel === 9) this.groundLayer.setAlpha(0);
      if (this.currentLevel === 4) addLevel4PainterlyPlatforms(this, map);
    }
    if (this.currentLevel === 1) this.replaceLevelOneDirectionSigns();
    this.level6Terrain = null;
    this.level7Terrain = null;
    this.level8Terrain = null;
    this.collisionGround = this.layout ? installLayoutTerrain(this, this.layout)
      : this.currentLevel === 6 ? installLevel6Terrain(this)
      : this.currentLevel === 7 ? installLevel7Terrain(this)
        : this.currentLevel === 8 ? installLevel8Sanctum(this)
          : this.currentLevel === 9 ? installLevel9Terrain(this) : this.groundLayer;
    if (this.currentLevel !== 1) addEnvironment(this, map);
    addFinishTemple(this, map);
    this.finishFlag = this.layout ? (this.layout.finish.flag ? addFinishFlag(this, map) : null)
      : this.currentLevel === 6 || this.currentLevel === 7 || this.currentLevel === 9
      ? null : addFinishFlag(this, map);
    this.level6Gate = this.currentLevel === 6 ? addLevel6Gate(this) : null;
    this.level6Shop = this.currentLevel === 6 ? addLevel6Shop(this) : null;

    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels + 80);

    // Spawn Player
    const customPlayer = this.textures.exists('player-character');
    const startY = this.layout ? this.layout.spawn.y : this.currentLevel === 6 ? LEVEL6.spawn.y : this.currentLevel === 7 ? LEVEL7.spawn.y
      : this.currentLevel === 8 ? LEVEL8.spawn.y : this.currentLevel === 9 ? LEVEL9.spawn.y : 150;
    const startX = this.layout ? this.layout.spawn.x : this.currentLevel === 6 ? LEVEL6.spawn.x : this.currentLevel === 7 ? LEVEL7.spawn.x
      : this.currentLevel === 8 ? LEVEL8.spawn.x : this.currentLevel === 9 ? LEVEL9.spawn.x : 50;
    this.player = customPlayer
      ? this.physics.add.sprite(startX, startY, 'player-character', 0)
      : this.physics.add.sprite(startX, startY, 'packed', 24);
    this.jumpsUsed = 0;
    this.jumpInputDown = false;
    // Pit-fall respawn falls back to the stage start until the player has stood somewhere safe.
    this.spawnPoint = { x: startX, y: startY };
    this.lastSafeGround = null;
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
    this.swordActionSprite = this.add.sprite(this.player.x, this.player.y, 'vireak-sword-actions', 0)
      .setOrigin(0.5, 0.625).setScale(24 / 256).setDepth(this.player.depth + 1).setVisible(false);
    this.physics.add.collider(this.player, this.collisionGround,
      this.layout || this.currentLevel === 6 || this.currentLevel === 7 || this.currentLevel === 8 || this.currentLevel === 9 ? null : this.hitCoinBlock,
      this.currentLevel === 6 ? () => this.time.now >= this.level6DropUntil : null, this);
    if (this.level6Gate) this.physics.add.collider(this.player, this.level6Gate.blocker);

    // Spawn Coins from level config
    this.coinsGroup = this.physics.add.staticGroup();
    const tiledCoins = this.currentLevel === 4
      ? map.getObjectLayer('Coins')?.objects?.map(({ x, y }) => ({ x, y }))
      : null;
    const coinPlacements = tiledCoins?.length ? tiledCoins : config.coins || [];
    const looseCoins = this.prepareCoinBlocks(coinPlacements);
    if (looseCoins.length) {
      looseCoins.forEach(pos => {
        const coin = this.coinsGroup.create(pos.x, pos.y, 'khmer-coin', 2);
        coin.play('coin-spin');
      });
    }
    this.physics.add.overlap(this.player, this.coinsGroup, this.collectCoin, null, this);
    // Totals for the pause-menu summary (loose coins + coins hidden in ? blocks).
    this.coinTotal = this.coinsGroup.getLength()
      + [...(this.coinBlocks?.values() || [])].reduce((sum, block) => sum + (block.coins || 0), 0);
    this.levelStartedAt = this.time.now;
    this.lifeItems = this.physics.add.group();
    this.physics.add.collider(this.lifeItems, this.collisionGround);
    this.physics.add.overlap(this.player, this.lifeItems, this.collectLifeItem, null, this);

    // Spawn Enemies from level config
    this.enemies = this.physics.add.group();
    this.enemySpeed = config.enemySpeed || 40;
    const tiledEnemies = this.currentLevel === 4
      ? map.getObjectLayer('Enemies')?.objects?.map(({ x, y, properties = [] }) => ({
        x, y, ...Object.fromEntries(properties.map(property => [property.name, property.value]))
      }))
      : null;
    const enemyPlacements = tiledEnemies?.length ? tiledEnemies : config.enemies;
    if (enemyPlacements) {
      enemyPlacements.forEach((pos, index) => {
        const customEnemy = this.textures.exists('enemy-guardians');
        const stoneGuardian = pos.kind === 'stone-guardian';
        const enemy = stoneGuardian
          ? this.enemies.create(pos.x, pos.y, 'stone-guardian', 0)
          : customEnemy
          ? this.enemies.create(pos.x, pos.y, 'enemy-guardians', (index % 3) * 6)
          : this.enemies.create(pos.x, pos.y, 'packed', 22);
        enemy.setBounce(0);
        enemy.setCollideWorldBounds(true);
        enemy.setVelocityX(-this.enemySpeed);
        enemy.level8Boss = Boolean(pos.level8Boss);
        enemy.level9Boss = Boolean(pos.level9Boss);
        enemy.hitPoints = enemy.level8Boss ? 8 : enemy.level9Boss ? 6 : stoneGuardian && this.currentLevel === 3 ? 5
          : stoneGuardian && this.currentLevel === 6 ? 6 : 3;
        enemy.maxHitPoints = enemy.hitPoints;
        enemy.nextHealthRecoveryAt = 0;
        if (stoneGuardian) {
          const isLevel6Guardian = this.currentLevel === 6;
          const isLevel8Boss = enemy.level8Boss;
          const isLevel9Boss = enemy.level9Boss;
          const scale = (isLevel6Guardian || isLevel8Boss || isLevel9Boss ? 82 : 58) / 256;
          enemy.setScale(scale).setOrigin(0.5, 1);
          const bodyWidth = isLevel6Guardian || isLevel8Boss || isLevel9Boss ? 32 : 24;
          const bodyHeight = isLevel6Guardian || isLevel8Boss || isLevel9Boss ? 27 : 19;
          enemy.body.setSize(bodyWidth / scale, bodyHeight / scale)
            .setOffset((enemy.width - bodyWidth / scale) / 2, enemy.height - bodyHeight / scale);
          enemy.enemyKind = 'stone-guardian';
          enemy.setDepth(8);
          if (isLevel6Guardian || isLevel8Boss || isLevel9Boss) enemy.isLargeGuardian = true;
          if (isLevel6Guardian) {
            enemy.guardianNameplate = this.add.text(enemy.x, enemy.y - 92, 'STONE GUARDIAN', {
              fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '8px',
              fontStyle: 'bold', color: '#ffe1a0', stroke: '#20170f', strokeThickness: 3
            }).setOrigin(0.5).setDepth(15);
            enemy.guardianHealthBar = this.add.graphics().setDepth(15);
            enemy.once('destroy', () => {
              enemy.guardianNameplate?.destroy();
              enemy.guardianHealthBar?.destroy();
            });
          }
        } else if (customEnemy) {
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

    if (this.currentLevel === 8) attachLevel8Sanctum(this);
    if (this.currentLevel === 9) attachLevel9Highlands(this);

    this.physics.add.collider(this.enemies, this.collisionGround, null, (enemy, tile) => {
      // The giant lands on platform tops without getting trapped under low ceilings.
      const platformTop = tile.body?.top ?? tile.pixelY ?? 0;
      if (enemy.flying) return false;   // flying mechanics (e.g. diving kites) ignore terrain
      return !enemy.isBoss || (enemy.body.velocity.y >= 0 && enemy.body.bottom <= platformTop + 12);
    });
    this.physics.add.collider(this.player, this.enemies, this.handlePlayerEnemyCollision, null, this);

    // Finish Section: Flagpole Trigger Zone (width - 15) and Castle Door (width - 7)
    const flagPixelX = this.layout ? this.layout.finish.x : this.currentLevel === 6 ? LEVEL6.finish.x : this.currentLevel === 7 ? LEVEL7.finish.x
      : this.currentLevel === 8 ? LEVEL8.finish.x : this.currentLevel === 9 ? LEVEL9.finish.x : this.currentLevel === 1
      ? (map.width - 7) * 18 + 9
      : (map.width - 15) * 18 + 9;
    this.flagX = flagPixelX;
    this.castleDoorX = this.layout ? this.layout.finish.doorX : this.currentLevel === 6 ? LEVEL6.finish.doorX : this.currentLevel === 7 ? LEVEL7.finish.doorX
      : this.currentLevel === 8 ? LEVEL8.finish.doorX : this.currentLevel === 9 ? LEVEL9.finish.doorX : (map.width - 7) * 18 + 9;

    // Extend in front of the solid pole so touching it always clears the level.
    this.goal = this.layout ? this.add.zone(flagPixelX, this.layout.finish.floorY - 22, 28, 44)
      : this.currentLevel === 6 || this.currentLevel === 7 || this.currentLevel === 8 || this.currentLevel === 9
      ? this.add.zone(flagPixelX,
        (this.currentLevel === 6 ? LEVEL6.finish.floorY : this.currentLevel === 7 ? LEVEL7.finish.floorY
          : this.currentLevel === 8 ? LEVEL8.finish.floorY : LEVEL9.finish.floorY) - 22, 28, 44)
      : this.add.zone(flagPixelX, 99, 48, 198);
    this.physics.add.existing(this.goal, true);
    this.physics.add.overlap(this.player, this.goal, this.reachGoal, null, this);
    this.goalLabel = this.currentLevel === 2 || this.currentLevel === 3
      ? this.add.text(flagPixelX + 25, 145, 'SEALED', {
      fontSize: '12px', color: '#ffd700', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(10) : null;
    // Camera setup with level sky color
    this.cameras.main.setBackgroundColor(config.skyColor || '#5c94fc');
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(this.player, false, 0.1,
      this.currentLevel === 4 ? 0 : 0.1);
    // Frame Level 2 wider so its panoramic temple backdrop is more visible.
    this.cameras.main.setZoom(this.layout ? this.layout.camera.zoom : this.currentLevel === 6 || this.currentLevel === 7 || this.currentLevel === 8 || this.currentLevel === 9 ? 1 : this.currentLevel === 2 ? 1.6 : 2.2);
    if (this.currentLevel === 1) addScrollingBackdrop(this, 'banteay-temple-background', -19, 0.65, true);
    if (this.currentLevel === 2) installLevelTwoTrial(this);
    if (config.province) addProvinceScenery(this, config.province, config.environment);
    // After the zoom is set so the baked pit art renders sharp.
    addPitMarkers(this);
    this.level6Water = this.currentLevel === 6 ? addLevel6WaterfallEffects(this) : null;
    if (config.province?.id === 'banteay-meanchey') this.templeEntrance = addTempleEntrance(this);
    if (this.currentLevel === 3) addScrollingBackdrop(this, 'angkor-sunset-level3', -20, 0.18, true);
    this.createAmbientMotes();

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
    if (this.currentLevel === 1) this.startLevelOneBoatArrival();
    if (this.currentLevel === 1) this.time.delayedCall(450, () => playSound(this, 'rooster-morning', { volume: 0.7 }));
    // Biome ambience, footstep surface and pause handling for sound effects.
    sfx(this).attach(this);
    installCombat(this);
    // The final guardian is tied to the generated stage's geometry; a hand-made Stage 28
    // opts in with `finalBoss: true` or uses a miniBoss mechanic instead.
    if (!this.layout || this.layout.finalBoss) installFinalBoss(this);
    else { this.boss = null; }
    if (this.layout) this.mechanics = installMechanics(this, layoutMechanics(this.layout));
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
    if (!music) playSound(this, this.musicKey, { loop: true, volume: musicVolume() });
    else {
      applyMusicVolume(music);
      if (!music.isPlaying) music.play();
    }
    console.info(`[music] level ${this.currentLevel}: ${this.musicKey} volume=${musicVolume().toFixed(2)}`
      + ` (setting ${Math.round(audioSettings.musicVolume * 100)}%, ${audioSettings.music ? 'on' : 'muted'}, audio ${this.sound.locked ? 'waiting for first tap/click' : 'unlocked'})`);

    // Apply music toggles (e.g. from the pause menu) to the track that is already loaded.
    const syncMusic = () => {
      if (this.isLevelFinished || this.isRunOver) return;
      const track = this.sound.get(this.musicKey);
      if (track) {
        applyMusicVolume(track);   // music slider applies instantly, even while paused
        if (audioSettings.music && !track.isPlaying && !track.isPaused && !this.scene.isPaused()) track.play();
      } else if (audioSettings.music && !this.scene.isPaused()) {
        playSound(this, this.musicKey, { loop: true, volume: musicVolume() });
      }
    };
    const unsubscribeMusic = onAudioSettingsChange(syncMusic);
    this.events.on('resume', syncMusic);
    this.events.once('shutdown', () => {
      unsubscribeMusic();
      this.events.off('resume', syncMusic);
    });
  }

  endRun() {
    if (this.isRunOver) return;
    this.isRunOver = true;
    sfx(this).play('death');
    this.sound.stopByKey(this.musicKey);
    this.scene.start('GameOverScene', {
      level: this.currentLevel,
      score: this.score,
      coins: this.coins,
      // Retrying restarts the stage, so it should not keep points earned during the failed attempt.
      retryScore: this.levelStartScore,
      retryCoins: this.levelStartCoins
    });
  }

  pauseGame() {
    if (!this.scene.isActive() || this.scene.isActive('PauseScene')) return;
    sfx(this).play('pause');
    const music = this.sound.get(this.musicKey);
    const resumeMusic = !!music?.isPlaying;
    if (resumeMusic) music.pause();
    this.input.keyboard?.resetKeys();
    this.hudContainer?.setVisible(false);
    this.comboText?.setVisible(false);
    this.events.once('resume', () => { this.hudContainer?.setVisible(true); this.comboText?.setVisible(true); });
    this.scene.launch('PauseScene', { resumeMusic });
    this.scene.pause();
  }

  // Numbers shown in the pause menu's level summary.
  pauseSummary() {
    const collected = Math.max(0, this.coins - (this.levelStartCoins || 0));
    const seconds = Math.max(0, Math.floor((this.time.now - (this.levelStartedAt || 0)) / 1000));
    return {
      level: this.currentLevel,
      name: this.levelConfig?.title || '',
      coins: collected,
      coinTotal: Math.max(collected, this.coinTotal || 0),
      score: this.score,
      time: `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
    };
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

  replaceLevelOneDirectionSigns() {
    if (!this.textures.exists('khmer-guardian-waypoint')) return;
    this.textures.get('khmer-guardian-waypoint').setFilter(Phaser.Textures.FilterMode.LINEAR);
    const layer = this.groundLayer;
    const tileWidth = this.map.tileWidth;
    const tileHeight = this.map.tileHeight;
    const signPosts = [];
    layer.forEachTile(tile => {
      if (tile.index !== 67 || layer.getTileAt(tile.x + 1, tile.y)?.index !== 68) return;
      const topRow = tile.y;
      const signX = tile.x;
      tile.alpha = 0;
      tile.setCollision(false, false, false, false);
      const topRight = layer.getTileAt(signX + 1, topRow);
      topRight.alpha = 0;
      topRight.setCollision(false, false, false, false);

      let row = topRow + 1;
      while (layer.getTileAt(signX, row)?.index === 87 &&
             layer.getTileAt(signX + 1, row)?.index === 88) {
        for (const part of [layer.getTileAt(signX, row), layer.getTileAt(signX + 1, row)]) {
          part.alpha = 0;
          part.setCollision(false, false, false, false);
        }
        row++;
      }
      let supportColumn = signX + 1;
      while (supportColumn < this.map.width - 1 && !layer.hasTileAt(supportColumn, row)) {
        supportColumn++;
      }
      signPosts.push({
        x: (supportColumn + 1) * tileWidth,
        y: row * tileHeight + 3
      });
    });

    for (const sign of signPosts) {
      this.add.image(sign.x, sign.y, 'khmer-guardian-waypoint')
        .setOrigin(0.5, 1)
        .setDisplaySize(54, 88)
        .setDepth(-1);
    }
  }

  startLevelOneBoatArrival() {
    this.levelOneArrival = true;
    this.levelOneArrivalJump = false;
    const player = this.player;
    const firstQuestionBlock = [...(this.coinBlocks?.values() || [])]
      .map(block => block.tile)
      .filter(tile => tile.index === 48)
      .sort((a, b) => a.pixelX - b.pixelX)[0];
    const targetBlockX = firstQuestionBlock?.pixelX ?? 39 * this.map.tileWidth;
    const arrivalX = Math.max(0, targetBlockX - 160);
    const boatY = (firstQuestionBlock?.pixelY ?? 8 * this.map.tileHeight) + 12;
    // Put the passenger near the bow so the jump lands on the block cluster.
    const riderX = targetBlockX - 30;
    const riderY = boatY + 2;
    player.body.enable = false;
    player.setPosition(-110, riderY).setVelocity(0, 0).setFlipX(false).play('player-idle');

    const boat = this.add.container(-190, boatY).setDepth(3);
    const art = this.add.graphics();
    art.fillStyle(0x170f19, 0.42).fillPoints([
      { x: 0, y: 5 }, { x: 164, y: 5 }, { x: 145, y: 17 },
      { x: 105, y: 22 }, { x: 54, y: 21 }, { x: 15, y: 14 }
    ], true);
    art.fillStyle(0x813f37, 1).fillPoints([
      { x: -5, y: -4 }, { x: 15, y: 1 }, { x: 54, y: 7 },
      { x: 105, y: 10 }, { x: 143, y: 5 }, { x: 166, y: -5 },
      { x: 156, y: 9 }, { x: 141, y: 17 }, { x: 105, y: 22 },
      { x: 54, y: 21 }, { x: 19, y: 15 }, { x: 3, y: 7 }
    ], true);
    art.lineStyle(2, 0xe3b66c, 1).strokePoints([
      { x: -5, y: -4 }, { x: 28, y: 3 }, { x: 68, y: 8 },
      { x: 112, y: 8 }, { x: 146, y: 2 }, { x: 166, y: -5 }
    ], false);
    boat.add(art);

    const rideIn = { duration: 600, ease: 'Cubic.easeIn' };
    this.tweens.add({ targets: boat, x: arrivalX, ...rideIn });
    this.tweens.add({
      targets: player,
      x: riderX,
      ...rideIn,
      onComplete: () => {
        this.playBoatCrashSound();
        const impactX = firstQuestionBlock
          ? firstQuestionBlock.pixelX + firstQuestionBlock.width / 2
          : boat.x + 164;
        const impactY = firstQuestionBlock
          ? firstQuestionBlock.pixelY + firstQuestionBlock.height / 2
          : boat.y + 7;
        this.createBoatCrashEffect(impactX, impactY);
        const hitFlash = this.add.rectangle(impactX, impactY,
          firstQuestionBlock?.width || 18, firstQuestionBlock?.height || 18,
          0xffe28b, 0.55).setDepth(14);
        this.tweens.add({ targets: hitFlash, alpha: 0, scale: 1.35,
          duration: 240, ease: 'Sine.easeOut', onComplete: () => hitFlash.destroy() });
        this.tweens.add({
          targets: boat,
          x: arrivalX - 7,
          angle: -5,
          duration: 110,
          ease: 'Sine.easeOut',
          onComplete: () => this.tweens.add({
            targets: boat,
            x: arrivalX + 2,
            angle: 2,
            duration: 190,
            ease: 'Sine.easeInOut',
            onComplete: () => {
              // A tiny dip gives the rider a readable beat before the jump.
              this.tweens.add({
                targets: player,
                y: 154,
                duration: 100,
                yoyo: true,
                ease: 'Sine.easeInOut',
                onComplete: () => {
                  player.body.enable = true;
                  player.body.reset(riderX, riderY);
                  player.setVelocity(60, -330).play('player-jump', true);
                  this.levelOneArrivalJump = true;
                }
              });
              // Keep the impact readable, then tip the wreck behind the ground.
              this.tweens.add({
                targets: boat,
                y: boat.y + 12,
                angle: -20,
                duration: 220,
                ease: 'Sine.easeIn',
                onComplete: () => {
                  boat.setDepth(-2);
                  this.tweens.add({ targets: boat, y: boat.y + 40, angle: -64,
                    alpha: 0, duration: 560, ease: 'Sine.easeIn',
                    onComplete: () => boat.destroy() });
                }
              });
            }
          })
        });
      }
    });
  }

  playBoatCrashSound() {
    // Pooled sound-manager voices (no per-call oscillators or noise buffers).
    sfx(this).play('impact', { volume: 1.2, rate: 0.85 });
    sfx(this).play('splash', { volume: 0.8 });
  }

  createBoatCrashEffect(x, y) {
    const colors = [0x62d4d1, 0xb5f1de, 0xe0a85c, 0x9b5738];
    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2;
      const distance = i % 3 === 0 ? 26 : 17;
      const particle = this.add.circle(x, y, i % 4 === 0 ? 3 : 2,
        colors[i % colors.length], 0.95).setDepth(12);
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance - (i % 2 ? 9 : 15),
        alpha: 0,
        scale: 0.25,
        duration: 420 + (i % 4) * 65,
        ease: 'Cubic.easeOut',
        onComplete: () => particle.destroy()
      });
    }

    const woodTones = [0x6e3828, 0x9b5738, 0xc17b42, 0xe0a85c];
    for (let i = 0; i < 9; i++) {
      const angle = -Math.PI + (i / 8) * Math.PI;
      const length = 7 + (i % 3) * 3;
      const splinter = this.add.rectangle(x, y, length, 2.5,
        woodTones[i % woodTones.length]).setDepth(13);
      splinter.setRotation(angle);
      this.tweens.add({
        targets: splinter,
        x: x + Math.cos(angle) * (25 + (i % 3) * 8),
        y: y + Math.sin(angle) * 24 - (i % 2 ? 11 : 18),
        angle: Phaser.Math.RadToDeg(angle) + (i % 2 ? 110 : -110),
        alpha: 0,
        duration: 450 + (i % 4) * 55,
        ease: 'Cubic.easeOut',
        onComplete: () => splinter.destroy()
      });
    }
  }

  createAnimations() {
    if (!this.textures.exists('khmer-coin')) {
      const coinTexture = this.textures.createCanvas('khmer-coin', 18 * 6, 18);
      const ctx = coinTexture.context;
      ctx.imageSmoothingEnabled = true;
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
      coinTexture.setFilter(Phaser.Textures.FilterMode.LINEAR);
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
    ['stone-guardian-idle', 'stone-guardian-walk', 'stone-guardian-slam', 'stone-guardian-throw']
      .forEach(key => this.anims.remove(key));
    for (const [key, start, end, frameRate, repeat] of [
      ['stone-guardian-idle', 0, 3, 5, -1],
      ['stone-guardian-walk', 4, 7, 7, -1],
      ['stone-guardian-slam', 8, 11, 6, 0],
      ['stone-guardian-throw', 12, 15, 6, 0]
    ]) {
      this.anims.create({
        key,
        frames: this.anims.generateFrameNumbers('stone-guardian', { start, end }),
        frameRate,
        repeat
      });
    }
    // Refresh these when restarting so a newly added image replaces the fallback.
    ['player-walk', 'player-run', 'player-idle', 'player-jump', 'player-crouch', 'player-land',
      'player-attack', 'player-sword-attack',
      ...Array.from({ length: 4 }, (_, index) => `player-sword-combo-${index}`)]
      .forEach(key => this.anims.remove(key));
    if (!this.anims.exists('player-walk')) {
      this.anims.create({
        key: 'player-walk',
        frames: playerFrames([5, 6, 7, 8, 9], [24, 25]),
        frameRate: 12,
        repeat: -1
      });
    }
    if (!this.anims.exists('player-run')) {
      this.anims.create({
        key: 'player-run',
        frames: playerFrames([10, 11, 12, 13, 14], [24, 25]),
        frameRate: 16,
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
    if (!this.anims.exists('player-crouch')) {
      this.anims.create({ key: 'player-crouch', frames: playerFrames([19], [24]), frameRate: 1 });
    }
    if (!this.anims.exists('player-land')) {
      this.anims.create({
        key: 'player-land', frames: playerFrames([18, 19], [25, 24]), frameRate: 10, repeat: 0
      });
    }
    for (let combo = 0; combo < 4; combo++) {
      this.anims.create({
        key: `player-sword-combo-${combo}`,
        frames: this.anims.generateFrameNumbers('vireak-sword-actions', {
          start: combo * 4, end: combo * 4 + 3
        }),
        frameRate: 12,
        repeat: 0
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

  // Screen-space hint/HUD text. Readability defaults keep it legible on every backdrop,
  // including pale skies (e.g. Level 28): a clean font, a thick dark outline and a
  // translucent dark panel. Styles passed in still win.
  screenText(x, y, message, style = {}) {
    const zoom = this.cameras.main.zoom;
    const readable = {
      fontFamily: 'Trebuchet MS, Arial, sans-serif',
      backgroundColor: 'rgba(8, 12, 20, 0.55)',
      padding: { left: 6, right: 6, top: 3, bottom: 3 },
      ...style,
      stroke: style.stroke || '#0b0f16',
      strokeThickness: Math.max(4, style.strokeThickness || 0)
    };
    return this.add.text(400 + (x - 400) / zoom, 225 + (y - 225) / zoom, message, readable)
      .setScale(1 / zoom).setScrollFactor(0);
  }

  // Compact HUD (src/hud.js): portrait, hearts and shield at top-left; score, coins,
  // stage and the pause/fullscreen buttons at top-right.
  createHUD() {
    this.hud = new GameHUD(this);
    this.hudContainer = this.hud.container;
    this.comboText = this.screenText(400, 77, '', {
      fontSize: '12px', fontStyle: 'bold', color: '#ffe19a',
      stroke: '#172338', strokeThickness: 3
    }).setOrigin(0.5).setDepth(220).setAlpha(0);
    if (this.currentLevel === 6) {
      this.level6ObjectiveText = this.add.text(8, 44, 'DEFEAT 5 ENEMIES: 0/5', {
        fontFamily: 'Arial, sans-serif', fontSize: '11px', fontStyle: 'bold', color: '#fff2cd',
        stroke: '#0b0f16', strokeThickness: 4, backgroundColor: 'rgba(8, 12, 20, 0.55)', padding: { left: 4, right: 4, top: 1, bottom: 1 }
      });
      const routeHint = this.add.text(8, 60, '↓ / S: descend    •    Jump to climb', {
        fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#fff2cd',
        stroke: '#0b0f16', strokeThickness: 4, backgroundColor: 'rgba(8, 12, 20, 0.55)', padding: { left: 4, right: 4, top: 1, bottom: 1 }
      });
      this.hudContainer.add([this.level6ObjectiveText, routeHint]);
    }
    if (this.currentLevel === 3) {
      this.level3ObjectiveCheck = this.add.graphics().setY(-14);   // checkbox sits under the compact HUD
      this.level3ObjectiveText = this.add.text(31, 54, 'Defeat Stone Guardian', {
        fontFamily: 'Trebuchet MS, Arial, sans-serif', fontSize: '11px',
        fontStyle: 'bold', color: '#fff0bc',
        stroke: '#100905', strokeThickness: 4, backgroundColor: 'rgba(8, 12, 20, 0.55)', padding: { left: 4, right: 4, top: 1, bottom: 1 }
      }).setOrigin(0, 0.5);
      this.hudContainer.add([this.level3ObjectiveCheck, this.level3ObjectiveText]);
      this.drawLevel3ObjectiveCheck();
    }
  }

  // Called every frame and after any health/shield change; the HUD only redraws what changed.
  drawVitalBars() {
    this.hud?.update();
  }

  updateLevel6GuardianDisplay() {
    const guardian = this.enemies?.getChildren().find(enemy => enemy.active && enemy.isLargeGuardian);
    if (!guardian) return;
    const barWidth = 48, barHeight = 5;
    const barY = guardian.y - guardian.displayHeight - 4;
    guardian.guardianNameplate?.setPosition(guardian.x, barY - 8);
    guardian.guardianHealthBar?.clear()
      .fillStyle(0x17120f, 0.95).fillRect(guardian.x - barWidth / 2, barY, barWidth, barHeight)
      .fillStyle(0x842735, 1).fillRect(guardian.x - barWidth / 2 + 1, barY + 1, barWidth - 2, barHeight - 2)
      .fillStyle(0xe64d5f, 1).fillRect(guardian.x - barWidth / 2 + 1, barY + 1,
        (barWidth - 2) * Phaser.Math.Clamp(guardian.hitPoints / guardian.maxHitPoints, 0, 1), barHeight - 2);
  }

  drawLevel3ObjectiveCheck(checked = this.level3GuardianDefeated) {
    if (!this.level3ObjectiveCheck) return;
    const g = this.level3ObjectiveCheck;
    g.clear();
    // A small transparent Khmer gold checkbox sits directly beneath the shield bar.
    g.lineStyle(1.5, 0xe4bd67, 0.95).strokeRect(14, 62, 12, 12);
    if (checked) {
      g.lineStyle(2.5, 0x9ee59b, 1)
        .beginPath().moveTo(16, 68).lineTo(19, 71).lineTo(24, 64).strokePath();
    }
  }

  recordLevel3GuardianDefeat(enemy) {
    if (this.currentLevel !== 3 || enemy.enemyKind !== 'stone-guardian' ||
        this.level3GuardianDefeated) return;
    this.level3GuardianDefeated = true;
    this.level3ObjectiveText?.setText('Stone Guardian defeated');
    this.drawLevel3ObjectiveCheck(true);
    this.goalLabel?.setText('OPEN');
    this.showFloatingText(enemy.x, enemy.y - 24, 'PATH OPEN!', '#ffe3a1');
  }

  recordLevel6EnemyDefeat(enemy) {
    if (this.currentLevel !== 6 || enemy.level6DefeatRecorded) return;
    enemy.level6DefeatRecorded = true;
    this.level6EnemiesDefeated = Math.min(5, this.level6EnemiesDefeated + 1);
    this.level6ObjectiveText?.setText(`DEFEAT 5 ENEMIES: ${this.level6EnemiesDefeated}/5`);
    this.level6Gate?.status.setText(`GATE CLOSED · ${this.level6EnemiesDefeated}/5`);
    if (this.level6EnemiesDefeated === 5) this.level6Gate?.open();
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
      const key = this.currentLevel === 1 || this.currentLevel === 2 || this.currentLevel === 3
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
      if (!block.coins) block.image.setTexture(this.currentLevel <= 3 ? 'temple-used-block' : 'used-coin-block').setDisplaySize(18, 18);
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
    if (!block.coins) block.image.setTexture(this.currentLevel <= 3 ? 'temple-used-block' : 'used-coin-block').setDisplaySize(18, 18);
    sfx(this).play('coin');
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
    const restoredHealth = this.health < this.maxHealth;
    if (restoredHealth) this.restoreBlood(50);
    else this.lives++;
    this.updateHUD();
    sfx(this).play('treasure');
    this.showFloatingText(food.x, food.y - 12,
      restoredHealth ? '+50 BLOOD' : '+1 LIFE', '#86efac');
    food.destroy();
  }

  collectCoin(player, coin) {
    coin.disableBody(true, true);
    sfx(this).play('coin');
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
    // The HUD coin counter pops on its own when the count increases.
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

  createAmbientMotes() {
    const zoom = this.cameras.main.zoom;
    for (let i = 0; i < 13; i++) {
      const screenX = 28 + (i * 137) % 744;
      const screenY = 45 + (i * 83) % 350;
      const x = 400 + (screenX - 400) / zoom;
      const y = 225 + (screenY - 225) / zoom;
      const drift = 8 + (i % 4) * 3;
      const glow = this.add.circle(x, y, 3.4, i % 3 === 0 ? 0xffd879 : 0x9fe8c3, 0.08)
        .setScrollFactor(0).setScale(1 / zoom).setDepth(-7).setBlendMode(Phaser.BlendModes.ADD);
      const mote = this.add.circle(x, y, i % 4 === 0 ? 1.5 : 1, i % 3 === 0 ? 0xffe7a0 : 0xc8ffdc, 0.55)
        .setScrollFactor(0).setScale(1 / zoom).setDepth(-6).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: [glow, mote],
        x: x + (i % 2 ? drift : -drift) / zoom,
        y: y - (9 + i % 5 * 2) / zoom,
        alpha: 0.12,
        duration: 2100 + i % 5 * 430,
        delay: i * 115,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }

  createRunGlint(direction) {
    const player = this.player;
    const glint = this.add.star(player.x - direction * 4, player.body.bottom - 2,
      4, 1.2, 2.6, 0xffe6a0, 0.72).setDepth(12);
    this.tweens.add({
      targets: glint,
      x: glint.x - direction * Phaser.Math.Between(7, 12),
      y: glint.y - Phaser.Math.Between(3, 7),
      alpha: 0,
      scale: 0.25,
      angle: Phaser.Math.Between(-45, 45),
      duration: 250,
      ease: 'Sine.easeOut',
      onComplete: () => glint.destroy()
    });
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
      this.comboText.setText(`COMBO ${this.comboCount}  ·  x${multiplier}`).setAlpha(1);
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
      fontFamily: 'Noto Sans Khmer, Khmer OS Battambang, Arial, sans-serif',
      fontSize: '10px',
      color: color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
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
    this.hud?.update();
  }

  restoreBlood(amount) {
    const previous = this.health;
    this.health = Math.min(this.maxHealth, this.health + amount);
    if (this.lives <= 3) this.lives = Math.ceil(this.health / 50);
    return this.health - previous;
  }

  // Hand-made stages: revive at the last activated checkpoint (src/mechanics/checkpoint.js)
  // with one unit of health instead of Game Over. Inactive on Levels 1-9.
  respawnAtCheckpoint() {
    const checkpoint = this.activeCheckpoint;
    if (!this.layout || !checkpoint || !this.player?.body?.enable) return false;
    this.lives = 1;
    this.health = 50;
    this.shields = Math.max(1, this.shields);
    this.player.body.reset(checkpoint.x, checkpoint.y);
    this.player.setVelocity(0, 0).body.setAllowGravity(true);
    this.lastSafeGround = { ...checkpoint };
    this.updateHUD();
    this.showFloatingText(checkpoint.x, checkpoint.y - 25, 'CHECKPOINT  ·  RESTORED', '#c9f1bd');
    this.startInvulnerabilityBlink();
    return true;
  }

  respawnAtLevel8Checkpoint() {
    const checkpoint = this.level8Checkpoint;
    if (this.currentLevel !== 8 || !checkpoint || !this.player?.body?.enable) return false;
    this.lives = 1;
    this.health = 50;
    this.shields = Math.max(1, this.shields);
    this.player.setPosition(checkpoint.x, checkpoint.y).setVelocity(0, 0).setAlpha(0.5);
    this.player.body.reset(checkpoint.x, checkpoint.y);
    this.player.body.setAllowGravity(true);
    this.isInvulnerable = true;
    this.time.delayedCall(1800, () => {
      if (!this.player?.active) return;
      this.isInvulnerable = false;
      this.player.setAlpha(1);
    });
    this.updateHUD();
    this.showFloatingText(checkpoint.x, checkpoint.y - 25,
      'MARKET CHECKPOINT  ·  RESTORED', '#c9f1bd');
    return true;
  }

  handlePlayerEnemyCollision(player, enemy, forceDamage = false) {
    if (this.isLevelFinished || this.isRunOver || this.level6Shop?.busy || this.level8Shop?.busy) return;

    const isFalling = player.body.velocity.y > 0;
    // Projectiles and timed hazards can call this handler without being Arcade
    // bodies. Use their y coordinate when no physics body is available.
    const enemyTop = enemy?.body?.top ?? enemy?.y ?? player.body.bottom;
    const isAbove = (player.body.bottom - enemyTop) < 10;

    if (!forceDamage && isFalling && isAbove) {
      sfx(this).play('stomp');
      player.setVelocityY(-260);
      // Stomping only bounces the player; bosses cannot be damaged this way.
      if (enemy.isBoss || enemy.enemyKind === 'stone-guardian' || enemy.stompImmune) return;
      damageEnemy(this, enemy);
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
      sfx(this).play('hurt');

      if (this.shields > 0) {
        this.shields--;
        this.nextShieldRecoveryAt = this.shields < 3 ? this.time.now + 8000 : 0;
      } else {
        this.loseHealthUnit();
        if (!this.nextShieldRecoveryAt) this.nextShieldRecoveryAt = this.time.now + 8000;
      }
      this.updateHUD();

      if (this.lives <= 0 || this.health <= 0) {
        if (this.respawnAtLevel8Checkpoint() || this.respawnAtCheckpoint()) return;
        this.endRun();
      } else {
        player.setVelocityY(-180);
        player.setVelocityX(player.x < enemy.x ? -120 : 120);
        this.startInvulnerabilityBlink();
      }
    }
  }

  // One "unit" of damage: a bonus life if the player has one, otherwise 50 health.
  loseHealthUnit() {
    if (this.lives > 3) this.lives--;
    else {
      this.health = Math.max(0, this.health - 50);
      this.lives = Math.ceil(this.health / 50);
    }
  }

  startInvulnerabilityBlink() {
    const player = this.player;
    this.isInvulnerable = true;
    this.tweens.killTweensOf(player);
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

  // True when both feet rest on real level ground (not a pit floor, moving/sinking
  // platform, trigger zone or the world's bottom edge), so it is safe to respawn here.
  isOnSafeGround() {
    const body = this.player.body;
    if (!body.blocked.down || body.bottom >= this.map.heightInPixels - 2) return false;
    // Mechanics such as rising water or auto-scroll can veto a spot.
    const spot = { x: this.player.x, y: this.player.y };
    if (this.safeGroundFilters.some(accept => !accept(spot))) return false;
    const y = body.bottom + 2;
    const feet = [body.left + 2, body.right - 2];
    if (this.collisionGround === this.groundLayer) {
      return feet.every(x => this.groundLayer.getTileAtWorldXY(x, y)?.collides);
    }
    return feet.every(x => this.physics.overlapRect(x, y, 1, 2, false, true)
      .some(hit => hit.gameObject && this.collisionGround.contains(hit.gameObject)));
  }

  // Falling into a pit costs one unit of health and returns the player to the last safe
  // ground they stood on; it only ends the run when that empties their health.
  handlePitFall() {
    if (this.isRunOver || this.isLevelFinished) return;
    sfx(this).play('hurt');
    this.comboCount = 0;
    this.comboExpiresAt = 0;
    this.loseHealthUnit();
    this.updateHUD();
    if (this.lives <= 0 || this.health <= 0) {
      if (!this.respawnAtLevel8Checkpoint() && !this.respawnAtCheckpoint()) this.endRun();
      return;
    }
    const spot = this.lastSafeGround || this.spawnPoint;
    const player = this.player;
    player.body.reset(spot.x, spot.y);
    player.setVelocity(0, 0).setFlipX(false);
    player.body.setAllowGravity(true);
    player.setData('level8Climbing', false);
    this.jumpsUsed = 0;
    this.wasPlayerAirborne = false;
    this.cameras.main.shake(140, 0.006);
    this.showFloatingText(spot.x, spot.y - 26, '-1 HEALTH', '#ff9aa5');
    this.startInvulnerabilityBlink();
  }

  // Complete Finish Cutscene Sequence
  reachGoal(player, goal) {
    if (this.isLevelFinished) return;
    // Mechanics (e.g. a mini-boss) can lock the flag on hand-made stages.
    const lock = this.goalLocks.map(check => check()).find(Boolean);
    if (lock) {
      if (this.time.now >= (this.nextGoalLockHintAt || 0)) {
        this.showFloatingText(player.x, player.y - 24, lock, '#ffe3a1');
        this.nextGoalLockHintAt = this.time.now + 1400;
      }
      return;
    }
    if (this.currentLevel === 8 && !this.level8Sanctum?.exitOpen) {
      const state = this.level8Sanctum;
      const switches = state?.switches.filter(Boolean).length || 0;
      const hint = state?.bossDefeated ? `ACTIVATE SANCTUM SWITCHES ${switches}/3` : 'DEFEAT THE NAGA SHADE';
      this.showFloatingText(player.x, player.y - 24, hint, '#ffe3a1');
      return;
    }
    if (this.currentLevel === 9 && !this.level9Highlands?.bossDefeated) {
      this.showFloatingText(player.x, player.y - 24, 'DEFEAT THE CRATER WARDEN', '#ffe3a1');
      return;
    }
    if (this.currentLevel === 6 && this.level6EnemiesDefeated < 5) {
      this.showFloatingText(player.x, player.y - 24,
        `DEFEAT GUARDIANS ${this.level6EnemiesDefeated}/5`, '#ffe3a1');
      return;
    }
    if (this.currentLevel === 6 && (!player.body.blocked.down ||
        Math.abs(player.body.bottom - LEVEL6.finish.floorY) > 5)) return;
    if (this.currentLevel === 2 && !this.templeSwitchActivated) {
      if (this.time.now >= this.nextGateHintAt) {
        this.showFloatingText(player.x, player.y - 24,
          'Step on the lotus switch to open the Angkor gate!', '#ffe3a1');
        this.nextGateHintAt = this.time.now + 1400;
      }
      return;
    }
    if (this.currentLevel === 3 && !this.level3GuardianDefeated) {
      if (this.time.now >= this.nextLevel3HintAt) {
        this.showFloatingText(player.x, player.y - 24,
          'Defeat the stone guardian first!', '#ffe3a1');
        this.nextLevel3HintAt = this.time.now + 1400;
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
    this.rockProjectiles?.clear(true, true);
    if (this.finishFlag) {
      this.finishFlag.setVisible(true);
      this.tweens.add({
        targets: this.finishFlag,
        y: this.finishFlag.getData('raisedY'),
        duration: 900,
        ease: 'Sine.easeInOut'
      });
    }

    // Stop music and play victory sound
    this.sound.stopByKey(this.musicKey);
    sfx(this).play('levelClear');

    // Step 1: Slide down flagpole
    player.setVelocity(0, 0);
    player.body.allowGravity = false;
    // The celebration follows a scripted path through decorative castle tiles.
    player.body.enable = false;
    player.play('player-jump');
    this.isSlidingDownFlag = true;

    const finishFloorY = this.layout ? this.layout.finish.floorY : this.currentLevel === 6 ? LEVEL6.finish.floorY : this.currentLevel === 7 ? LEVEL7.finish.floorY : this.currentLevel === 8 ? LEVEL8.finish.floorY : this.currentLevel === 9 ? LEVEL9.finish.floorY : 198;
    const targetY = finishFloorY - 26;

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
          x: this.currentLevel >= 3 && this.currentLevel !== 6 ? this.castleDoorX - 20 : this.castleDoorX,
          y: finishFloorY - 9,
          duration: (this.castleDoorX - this.flagX) / 65 * 1000,
          ease: 'Linear',
          onComplete: () => {
            if (this.currentLevel === 6) {
              this.triggerCastleFireworks();
              return;
            }
            if (this.currentLevel >= 3) {
              this.tweens.add({ targets: player, x: this.castleDoorX,
                y: finishFloorY - 29, duration: 450, ease: 'Linear',
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

    const castleCenter = this.currentLevel === 2 ? this.flagX : this.castleDoorX;
    const colors = ['#ffd700', '#ff3366', '#33ccff', '#33ff66'];
    for (let f = 0; f < 4; f++) {
      this.time.delayedCall(f * 350, () => {
        const fx = castleCenter + (Math.random() * 40 - 20);
        const fy = this.layout ? this.layout.finish.floorY - 120 + Math.random() * 30
          : this.currentLevel === 6
          ? LEVEL6.finish.floorY - 120 + Math.random() * 30
          : this.currentLevel === 7 ? LEVEL7.finish.floorY - 120 + Math.random() * 30
            : this.currentLevel === 8 ? LEVEL8.finish.floorY - 120 + Math.random() * 30
              : this.currentLevel === 9 ? LEVEL9.finish.floorY - 120 + Math.random() * 30
                : 60 + Math.random() * 30;
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

  update(time, delta) {
    if (!this.player || this.isRunOver) return;

    this.drawVitalBars();
    this.level6Water?.update(delta);
    updateLevel8Sanctum(this, delta);
    if (this.level6Shop?.update()) return;
    if (this.level8Shop?.update()) return;
    this.updateLevel6GuardianDisplay();

    if (!this.isLevelFinished && this.lives > 0 && this.shields < 3 &&
        this.nextShieldRecoveryAt && this.time.now >= this.nextShieldRecoveryAt) {
      this.shields = Math.min(3, this.shields + 1);
      this.nextShieldRecoveryAt = this.shields < 3 ? this.time.now + 8000 : 0;
      this.updateHUD();
      this.showFloatingText(this.player.x, this.player.y - 24, '+1 SHIELD', '#9fe8ff');
    }

    const frameDelta = Math.min(50, Math.max(1, Number(delta) || 16.67));
    const followLerp = 1 - Math.exp(-6.32 * frameDelta / 1000);
    this.cameras.main.setLerp(followLerp,
      this.currentLevel === 4 ? 0 : followLerp);

    if (this.comboCount && this.time.now > this.comboExpiresAt) {
      this.comboCount = 0;
      this.comboText?.setAlpha(0);
    }

    if (this.isLevelFinished) return;

    if (updateLevel9Highlands(this, delta)) return;

    if (this.templeEntrance?.update()) return;

    if (!this.levelOneArrival && !this.templeEntrance?.outside) updateCombat(this);

    if (this.levelOneArrival) {
      if (!this.levelOneArrivalJump) return;
      if (this.player.body.blocked.down) {
        this.levelOneArrival = false;
        this.levelOneArrivalJump = false;
        this.player.play('player-idle', true);
        return;
      }
      this.player.play('player-jump', true);
      return;
    }

    // Player Movement controls
    const left = touchControls.left || (this.cursors && (this.cursors.left.isDown || (this.wasd && this.wasd.left.isDown)));
    const right = touchControls.right || (this.cursors && (this.cursors.right.isDown || (this.wasd && this.wasd.right.isDown)));
    const down = this.cursors && (this.cursors.down.isDown || (this.wasd && this.wasd.down.isDown));
    const jump = touchControls.jump || (this.cursors && (this.cursors.up.isDown || (this.wasd && (this.wasd.up.isDown || this.wasd.space.isDown))));
    const jumpPressed = Boolean(jump && !this.jumpInputDown);
    this.jumpInputDown = Boolean(jump);
    const sprinting = Boolean(this.sprintKey?.isDown);
    const baseMoveSpeed = sprinting ? (this.currentLevel === TOTAL_LEVELS ? 230 : 200) : 150;
    const moveSpeed = baseMoveSpeed * (this.time.now < (this.speedBoostUntil || 0) ? 1.35 : 1);
    const attacking = this.time.now < (this.meleeAnimationUntil || 0);
    const actionLocked = attacking;
    const grounded = this.player.body.blocked.down || this.player.body.touching.down;
    const dropHeld = Boolean(touchControls.drop || down);
    const dropPressed = dropHeld && !this.dropInputDown;
    this.dropInputDown = dropHeld;
    const dropping = this.currentLevel === 6 && grounded && dropPressed;
    if (dropping) {
      this.level6DropUntil = this.time.now + 180;
      this.player.body.reset(this.player.x, this.player.y + 3);
      this.player.setVelocityY(60);
    }
    const landed = this.wasPlayerAirborne && grounded;
    if (grounded) this.jumpsUsed = 0;
    if (landed) {
      this.landingAnimationUntil = this.time.now + 150;
      this.player.play('player-land', true);
    }

    let targetVelocityX = 0;
    if (attacking) {
      targetVelocityX = 0;
    }
    if (grounded && down && this.currentLevel !== 6 && !actionLocked && this.time.now >= (this.landingAnimationUntil || 0)) {
      this.player.setVelocityX(0);
      this.player.play('player-crouch', true);
    } else if (left) {
      targetVelocityX = -moveSpeed;
      this.player.setFlipX(true);
      if (grounded && !actionLocked && this.time.now >= (this.landingAnimationUntil || 0)) {
        this.player.play(sprinting ? 'player-run' : 'player-walk', true);
      }
    } else if (right) {
      targetVelocityX = moveSpeed;
      this.player.setFlipX(false);
      if (grounded && !actionLocked && this.time.now >= (this.landingAnimationUntil || 0)) {
        this.player.play(sprinting ? 'player-run' : 'player-walk', true);
      }
    } else {
      if (grounded && !actionLocked && this.time.now >= (this.landingAnimationUntil || 0)) {
        this.player.play('player-idle', true);
      }
    }
    const movementRate = targetVelocityX === 0 ? 18 : 24;
    const movementBlend = 1 - Math.exp(-movementRate * frameDelta / 1000);
    this.player.setVelocityX(Phaser.Math.Linear(this.player.body.velocity.x, targetVelocityX, movementBlend));

    if (jumpPressed && this.jumpsUsed < 2 && !dropping) {
      const doubleJump = this.jumpsUsed === 1 && !grounded;
      this.jumpsUsed++;
      this.player.setVelocityY(doubleJump ? -320 : -350);
      if (doubleJump) this.createLandingPuff();
      if (!actionLocked) this.player.play('player-jump', true);
      sfx(this).play(doubleJump ? 'doubleJump' : 'jump');
    }

    if (!grounded) {
      if (!actionLocked) this.player.play('player-jump', true);
    }

    if (landed) {
      this.createLandingPuff();
      sfx(this).play('land', { volume: Math.min(1.3, 0.6 + (this.lastFallSpeed || 0) / 500) });
    }
    if (!grounded) this.lastFallSpeed = Math.max(0, this.player.body.velocity.y);
    // Footsteps: throttled by stride (faster when sprinting), surface-aware.
    if (grounded && !landed && Math.abs(this.player.body.velocity.x) > 45 && this.time.now >= (this.nextFootstepAt || 0)) {
      this.nextFootstepAt = this.time.now + (Math.abs(this.player.body.velocity.x) > 175 ? 230 : 300);
      sfx(this).footstep(this);
    }
    this.wasPlayerAirborne = !grounded;
    if (grounded && targetVelocityX !== 0 && this.time.now >= (this.nextRunGlintAt || 0)) {
      this.nextRunGlintAt = this.time.now + 135;
      this.createRunGlint(Math.sign(targetVelocityX));
    }

    const swordActionActive = this.time.now < (this.meleeAnimationUntil || 0);
    if (swordActionActive) {
      const progress = Phaser.Math.Clamp(
        (this.time.now - this.meleeAnimationStartedAt) /
          (this.meleeAnimationUntil - this.meleeAnimationStartedAt),
        0, 1
      );
      const blend = Phaser.Math.Clamp(Math.min(progress / 0.14, (1 - progress) / 0.18), 0, 1);
      this.swordActionSprite.setPosition(this.player.x, this.player.y)
        .setFlipX(this.player.flipX).setAlpha(blend).setVisible(true);
      this.player.setVisible(true).setAlpha(1 - blend);
    } else {
      this.swordActionSprite.setVisible(false).setAlpha(1);
      this.player.setVisible(true);
      // Leave alpha alone while invulnerable so the damage blink stays visible.
      if (!this.isInvulnerable) this.player.setAlpha(1);
    }

    // Remember the last solid footing so a pit fall can return the player there.
    if (grounded && this.isOnSafeGround()) {
      this.lastSafeGround = { x: this.player.x, y: this.player.y };
    }

    // Pit fall detection. Hand-built tall levels (6-9) fall off their own map height;
    // Level 9 spawns at y=1068, so the classic 280px limit ended the run instantly.
    const fallLimit = this.layout || (this.currentLevel >= 6 && this.currentLevel <= 9)
      ? this.map.heightInPixels + 30 : 280;
    if (this.player.y > fallLimit) this.handlePitFall();
  }
}
