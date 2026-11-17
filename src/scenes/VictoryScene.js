import { backdrop } from '../ui.js';
import { TOTAL_LEVELS, PROVINCE_ROUTE } from '../levels/provinceRoute.js';
import { sfx } from '../audio/soundManager.js';
import { fadeSceneIn, fadeToScene } from '../sceneTransitions.js';
import { journeyMapSvg } from '../finishMap.js';
import { journeyTotals, formatTime } from '../progress.js';
import { ORNAMENT, ROMDOUL, STAR, mountOverlay, createTimeline, countStep, bindMenuKeys, formatNumber, escapeHtml } from '../levelClear.js';

// Shown on the Victory screen. Add artwork and music sources here as `[role, credit]` pairs.
export const CREDITS = [
  ['Game engine', 'Phaser 3 (MIT licence)'],
  ['Sound effects', 'Synthesized in the browser with Web Audio'],
  ['Route', 'The 25 provinces of Cambodia']
];
const AUTHOR = 'Chiem Sopheaith';
const STEP_MS = 110, START_MS = 450;   // one province lights up every STEP_MS

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super('VictoryScene');
  }

  init(data) {
    this.finalScore = data.score || 0;
    this.finalCoins = data.coins || 0;
  }

  create() {
    fadeSceneIn(this, 400);
    backdrop(this);
    this.sound.stopByKey('bgm-level-2');
    this.sound.stopByKey('bgm-default');
    sfx(this).play('victory');

    // Confetti falls behind the HTML card and is cleaned up with the scene.
    const colors = [0xf0c978, 0xe7c891, 0x7fb7c9, 0xd88a6a];
    for (let i = 0; i < 40; i++) {
      const confetti = this.add.rectangle(Phaser.Math.Between(0, 800), Phaser.Math.Between(-450, 0), 4, 8, colors[i % colors.length]);
      this.tweens.add({ targets: confetti, y: 470, angle: 360, duration: Phaser.Math.Between(3000, 6000), delay: i * 60, repeat: -1 });
    }

    const totals = journeyTotals(TOTAL_LEVELS);
    const provinces = PROVINCE_ROUTE.length;
    const rows = [
      ['Stages', `<span data-stat="stages">0</span><small>/ ${TOTAL_LEVELS}</small>`],
      ['Stars', `<span class="finish-inline-star">${STAR}</span><span data-stat="stars">0</span><small>/ ${TOTAL_LEVELS * 3}</small>`],
      ['Coins', `<span data-stat="coins">0</span>${totals.coinTotal ? `<small>/ ${formatNumber(totals.coinTotal)}</small>` : ''}`],
      ['Secrets', `<span data-stat="secrets">0</span><small>/ ${totals.secretTotal}</small>`],
      ['Total time', `<span data-stat="time">0:00</span>`],
      ['Final score', `<span data-stat="score">0</span>`]
    ];

    const overlay = mountOverlay(this, 'is-victory', 'victory-title', `
      <div class="pause-panel finish-panel victory-panel">
        <div class="pause-head">${ORNAMENT}<h2 id="victory-title">JOURNEY COMPLETE</h2>${ORNAMENT}</div>
        <p class="pause-level">All ${TOTAL_LEVELS} stages · Cambodia explored</p>
        <div class="victory-body">
          <figure class="finish-map victory-map">
            ${journeyMapSvg(STEP_MS, START_MS)}
            <figcaption><span data-stat="provinces">0</span> / ${provinces} provinces</figcaption>
          </figure>
          <dl class="finish-stats victory-stats">
            ${rows.map(([dt, dd]) => `<div><dt>${dt}</dt><dd>${dd}</dd></div>`).join('')}
          </dl>
        </div>
        <section class="victory-credits" aria-label="Credits">
          <p class="victory-author">Built by <strong>${escapeHtml(AUTHOR)}</strong></p>
          <p class="victory-assets">${CREDITS.map(([role, credit]) => `<span><b>${escapeHtml(role)}</b> ${escapeHtml(credit)}</span>`).join('')}</p>
        </section>
        <nav class="finish-actions victory-actions" aria-label="Journey complete">
          <button type="button" class="pause-btn" data-action="stages">${ROMDOUL}<span>Replay stages</span>${ROMDOUL}</button>
          <button type="button" class="pause-btn is-primary" data-action="home">${ROMDOUL}<span>Home</span>${ROMDOUL}</button>
        </nav>
        <p class="pause-footer">Enter · Home &nbsp;·&nbsp; S · Replay stages &nbsp;·&nbsp; Tap to skip</p>
      </div>`);
    const $ = sel => overlay.querySelector(sel);

    /* ---------- provinces light up one by one, totals count up ---------- */
    const timeline = createTimeline(this);
    for (let i = 0; i < provinces; i++) {
      timeline.add(START_MS + i * STEP_MS, 0, () => {
        $('[data-stat="provinces"]').textContent = String(i + 1);
        if (!timeline.skipping) sfx(this).play('coin', { rate: 0.85 + i * 0.025, volume: 0.35 });
      });
    }
    const countFrom = START_MS + 300;
    timeline.add(countFrom, 1200, countStep($('[data-stat="stages"]'), totals.cleared));
    timeline.add(countFrom + 150, 1300, countStep($('[data-stat="stars"]'), totals.stars));
    timeline.add(countFrom + 300, 1400, countStep($('[data-stat="coins"]'), totals.coins));
    timeline.add(countFrom + 450, 1000, countStep($('[data-stat="secrets"]'), totals.secrets));
    timeline.add(countFrom + 600, 1500, countStep($('[data-stat="time"]'), totals.seconds, formatTime));
    timeline.add(countFrom + 750, 1600, countStep($('[data-stat="score"]'), this.finalScore));
    timeline.play();
    overlay.addEventListener('pointerdown', event => {
      if (timeline.finished || event.target.closest('button')) return;
      timeline.skipping = true;
      overlay.classList.add('is-skipped');
      timeline.skip();
    });

    /* ---------- actions ---------- */
    let leaving = false;
    const go = key => {
      if (leaving) return;
      leaving = true;
      overlay.classList.add('is-closing');
      sfx(this).play('uiTap');
      fadeToScene(this, key, undefined, { duration: 300 });
    };
    const actions = { home: () => go('MainMenuScene'), stages: () => go('LevelSelectScene') };
    overlay.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => actions[btn.dataset.action]());
      btn.addEventListener('pointerenter', () => sfx(this).play('menuMove'));
    });
    bindMenuKeys(this, overlay, { shortcuts: { s: actions.stages, h: actions.home }, onEnter: actions.home });
  }
}
