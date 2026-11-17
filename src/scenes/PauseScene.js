import { TOTAL_LEVELS } from '../levels/provinceRoute.js';
import { audioSettings, onAudioSettingsChange, setAudioEnabled, setAudioLevel } from '../audioSettings.js';
import { fadeSceneIn, fadeToScene } from '../sceneTransitions.js';
import { sfx } from '../audio/soundManager.js';

// Pause menu as an HTML overlay over the game (styles in index.html, `.pause-*`).
// HTML gives real 44px+ touch targets on phones (where the canvas itself is tiny),
// native focus and screen-reader support, while keeping the gold-frame Khmer look.
// Over the game on desktop / landscape; full screen on portrait phones.

const ICONS = {
  music: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18.5a2.5 2.5 0 1 1-2-2.45V5.5l11-2.5v12.5a2.5 2.5 0 1 1-2-2.45V7.3L9 8.9z"/></svg>',
  effects: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  ambience: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c3 4 6 6.5 6 10a6 6 0 0 1-12 0c0-3.5 3-6 6-10z" opacity=".9"/><path d="M12 9v12" stroke="#0f1d2e" stroke-width="1.4"/></svg>',
  on: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9a4 4 0 0 1 0 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  off: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
};
// Three-petal romdoul flower, as on the in-game buttons.
const ROMDOUL = '<svg class="pause-flower" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 10L8 5.5 10 1l2 4.5zM10 10l4.9 1.2 3.2 3.7-4.8.3zM10 10l-3.3 3.6-4.8-.3 3.2-3.7z"/><circle cx="10" cy="10" r="1.6"/></svg>';
const ORNAMENT = '<span class="pause-ornament" aria-hidden="true"><i></i>' + ROMDOUL + '<i></i></span>';

const SOUND_ROWS = [
  { id: 'music', label: 'Music', level: 'musicVolume', toggle: 'music' },
  { id: 'effects', label: 'Effects', level: 'sfx', toggle: 'sound' },
  { id: 'ambience', label: 'Ambience', level: 'ambience', toggle: 'ambienceOn' }
];

const escapeHtml = text => String(text).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export class PauseScene extends Phaser.Scene {
  constructor() { super('PauseScene'); }

  create({ resumeMusic = false } = {}) {
    fadeSceneIn(this, 1);
    const game = this.scene.get('GameScene');
    const summary = game.pauseSummary?.() || { level: game.currentLevel, name: '', coins: 0, coinTotal: 0, score: game.score, time: '0:00' };
    const host = document.getElementById('game-container') || document.body;
    const overlay = document.createElement('div');
    overlay.className = 'pause-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'pause-title');
    overlay.innerHTML = `
      <div class="pause-panel">
        <div class="pause-head">
          ${ORNAMENT}<h2 id="pause-title">GAME PAUSED</h2>${ORNAMENT}
        </div>
        <p class="pause-level">Level ${summary.level} / ${TOTAL_LEVELS} · ${escapeHtml(summary.name)}</p>
        <dl class="pause-stats">
          <div><dt>Coins</dt><dd>${summary.coins} / ${summary.coinTotal}</dd></div>
          <div><dt>Score</dt><dd>${summary.score}</dd></div>
          <div><dt>Time</dt><dd>${summary.time}</dd></div>
        </dl>
        <div class="pause-body">
          <nav class="pause-actions" aria-label="Pause menu">
            <button type="button" class="pause-btn is-primary" data-action="resume">${ROMDOUL}<span>Resume</span>${ROMDOUL}</button>
            <button type="button" class="pause-btn" data-action="restart">${ROMDOUL}<span>Restart Level</span>${ROMDOUL}</button>
            <button type="button" class="pause-btn" data-action="levels">${ROMDOUL}<span>Level Select</span>${ROMDOUL}</button>
            <button type="button" class="pause-btn" data-action="home">${ROMDOUL}<span>Back to Home</span>${ROMDOUL}</button>
          </nav>
          <section class="pause-sound" aria-label="Sound">
            ${SOUND_ROWS.map(row => `
              <div class="pause-row" data-row="${row.id}">
                <span class="pause-row-icon">${ICONS[row.id]}</span>
                <label class="pause-row-label" for="pause-${row.id}">${row.label}</label>
                <input id="pause-${row.id}" class="pause-slider" type="range" min="0" max="100" step="1" data-level="${row.level}">
                <output class="pause-value" for="pause-${row.id}"></output>
                <button type="button" class="pause-mute" data-toggle="${row.toggle}" aria-label="Mute ${row.label}"></button>
              </div>`).join('')}
          </section>
        </div>
        <p class="pause-footer">ESC to resume · ↑↓ move · ←→ adjust · Enter select</p>
        <div class="pause-confirm" hidden role="alertdialog" aria-labelledby="pause-confirm-title" aria-describedby="pause-confirm-text">
          <div class="pause-confirm-card">
            <h3 id="pause-confirm-title"></h3>
            <p id="pause-confirm-text">Progress in this level will be lost.</p>
            <div class="pause-confirm-actions">
              <button type="button" class="pause-btn" data-confirm="cancel"><span>Cancel</span></button>
              <button type="button" class="pause-btn is-primary" data-confirm="ok"><span></span></button>
            </div>
          </div>
        </div>
      </div>`;
    host.appendChild(overlay);
    this.overlay = overlay;
    const $ = sel => overlay.querySelector(sel);
    const $$ = sel => [...overlay.querySelectorAll(sel)];

    /* ---------- sound rows ---------- */
    const syncSound = () => {
      for (const row of SOUND_ROWS) {
        const el = $(`[data-row="${row.id}"]`);
        const slider = el.querySelector('.pause-slider');
        const on = audioSettings[row.toggle];
        const pct = Math.round(audioSettings[row.level] * 100);
        if (document.activeElement !== slider) slider.value = pct;
        slider.style.setProperty('--fill', `${pct}%`);
        el.querySelector('.pause-value').textContent = `${pct}%`;
        el.classList.toggle('is-muted', !on);
        const mute = el.querySelector('.pause-mute');
        mute.innerHTML = on ? ICONS.on : ICONS.off;
        mute.setAttribute('aria-pressed', String(!on));
        mute.setAttribute('aria-label', `${on ? 'Mute' : 'Unmute'} ${row.label}`);
        slider.setAttribute('aria-valuetext', `${pct}%${on ? '' : ', muted'}`);
      }
    };
    syncSound();
    const unsubscribe = onAudioSettingsChange(syncSound);
    let nextPreview = 0;
    const setLevel = (slider, pct) => {
      const value = Phaser.Math.Clamp(pct, 0, 100);
      slider.value = value;
      setAudioLevel(slider.dataset.level, value / 100);   // saved + applied instantly
      if (slider.dataset.level === 'sfx' && performance.now() >= nextPreview) { nextPreview = performance.now() + 140; sfx(this).play('uiTap'); }
    };
    $$('.pause-slider').forEach(slider => slider.addEventListener('input', () => setLevel(slider, Number(slider.value))));
    $$('.pause-mute').forEach(button => button.addEventListener('click', () => {
      const key = button.dataset.toggle;
      setAudioEnabled(key, !audioSettings[key]);
      sfx(this).play('uiTap');
    }));

    /* ---------- actions ---------- */
    let closed = false;
    const close = () => { if (closed) return false; closed = true; unsubscribe(); overlay.classList.add('is-closing'); return true; };
    const resume = () => {
      if (!close()) return;
      game.input.keyboard?.resetKeys();
      if (resumeMusic) this.sound.get(game.musicKey)?.resume();
      this.scene.resume('GameScene');
      this.scene.stop();
    };
    const leave = (destination, data) => {
      if (!close()) return;
      game.input.keyboard?.resetKeys();
      this.sound.stopByKey(game.musicKey);
      fadeToScene(this, destination, data, { stop: ['GameScene'], duration: 260 });
    };
    const restart = () => leave('GameScene', {
      level: game.currentLevel, score: game.levelStartScore, coins: game.levelStartCoins, lives: 3
    });
    const confirmBox = $('.pause-confirm');
    let pendingAction = null, returnFocus = null;
    const ask = (title, okLabel, action, opener) => {
      pendingAction = action; returnFocus = opener;
      $('#pause-confirm-title').textContent = title;
      $('[data-confirm="ok"] span').textContent = okLabel;
      confirmBox.hidden = false;
      $('[data-confirm="cancel"]').focus();
    };
    const closeConfirm = () => { confirmBox.hidden = true; pendingAction = null; returnFocus?.focus(); };
    $('[data-confirm="cancel"]').addEventListener('click', () => { sfx(this).play('uiTap'); closeConfirm(); });
    $('[data-confirm="ok"]').addEventListener('click', () => { sfx(this).play('uiTap'); const action = pendingAction; closeConfirm(); action?.(); });
    const actions = {
      resume,
      restart: button => ask('Restart this level?', 'Restart', restart, button),
      levels: () => leave('LevelSelectScene'),
      home: button => ask('Back to the home screen?', 'Leave level', () => leave('MainMenuScene'), button)
    };
    $$('[data-action]').forEach(button => {
      button.addEventListener('click', () => { sfx(this).play('uiTap'); actions[button.dataset.action](button); });
      button.addEventListener('pointerenter', () => sfx(this).play('menuMove'));
    });

    /* ---------- keyboard: ↑↓ move, ←→ adjust, Enter select, Esc resume ---------- */
    const order = () => confirmBox.hidden
      ? [...$$('[data-action]'), ...$$('.pause-slider')]
      : $$('[data-confirm]');
    const onKey = event => {
      const items = order();
      const current = document.activeElement;
      const index = items.indexOf(current);
      if (event.key === 'Escape') {
        event.preventDefault(); event.stopPropagation();
        if (!confirmBox.hidden) closeConfirm(); else if (ready) resume();
        return;
      }
      if (event.key.startsWith('Arrow') || event.key === 'Tab') overlay.classList.add('is-kbd');   // show focus glow
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || (event.key === 'Tab' && !confirmBox.hidden)) {
        event.preventDefault();
        const step = event.key === 'ArrowUp' || (event.key === 'Tab' && event.shiftKey) ? -1 : 1;
        items[(index + step + items.length) % items.length]?.focus();
        sfx(this).play('menuMove');
        return;
      }
      if ((event.key === 'ArrowLeft' || event.key === 'ArrowRight') && current?.classList.contains('pause-slider')) {
        event.preventDefault();
        setLevel(current, Number(current.value) + (event.key === 'ArrowRight' ? 5 : -5));
        return;
      }
      if (event.key === 'Enter' || event.key === ' ') {
        if (current?.classList.contains('pause-slider')) {
          // Enter on a sound row toggles its mute.
          event.preventDefault();
          current.closest('.pause-row').querySelector('.pause-mute').click();
        } else if (current?.tagName === 'BUTTON' && overlay.contains(current)) {
          event.preventDefault();
          current.click();
        }
      }
    };
    // Ignore the Escape press that opened the menu and held-key repeats.
    let ready = false;
    this.time.delayedCall(200, () => { ready = true; });
    overlay.addEventListener('keydown', onKey);
    overlay.addEventListener('pointerdown', () => overlay.classList.remove('is-kbd'));
    // Keep keyboard focus inside the menu.
    const keepFocus = event => { if (!overlay.contains(event.target)) $('[data-action="resume"]').focus(); };
    document.addEventListener('focusin', keepFocus);
    requestAnimationFrame(() => $('[data-action="resume"]').focus({ preventScroll: true }));

    this.events.once('shutdown', () => {
      unsubscribe();
      document.removeEventListener('focusin', keepFocus);
      overlay.remove();
      this.overlay = null;
      game.game?.canvas?.focus?.();
    });
  }
}
