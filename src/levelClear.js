// Stage Clear card: an HTML overlay in the same style as the pause menu (styles in
// index.html, `.finish-*` on top of `.pause-*`). Stars pop in, stats count up, a small
// "Next stop" map shows the route ahead, and results are saved per stage (src/progress.js).
import { TOTAL_LEVELS } from './levels/provinceRoute.js';
import { sfx } from './audio/soundManager.js';
import { fadeToScene } from './sceneTransitions.js';
import { provinceForLevel, landmarkForLevel, nextStopMapSvg } from './finishMap.js';
import { saveLevelResult, starsFor, formatTime } from './progress.js';

// Three-petal romdoul flower and the line-flower-line ornament (as in the pause menu).
export const ROMDOUL = '<svg class="pause-flower" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 10L8 5.5 10 1l2 4.5zM10 10l4.9 1.2 3.2 3.7-4.8.3zM10 10l-3.3 3.6-4.8-.3 3.2-3.7z"/><circle cx="10" cy="10" r="1.6"/></svg>';
export const ORNAMENT = '<span class="pause-ornament" aria-hidden="true"><i></i>' + ROMDOUL + '<i></i></span>';
export const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.8l3 6.4 7 .8-5.2 4.8 1.4 6.9L12 17.2l-6.2 3.5 1.4-6.9L2 9l7-.8z"/></svg>';
export const escapeHtml = text => String(text).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const formatNumber = n => Math.round(n).toLocaleString('en-US');

// Mount an overlay in #game-container; it is removed when `scene` shuts down.
export function mountOverlay(scene, className, labelledBy, html) {
  const host = document.getElementById('game-container') || document.body;
  const overlay = document.createElement('div');
  overlay.className = `pause-overlay finish-overlay ${className}`;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', labelledBy);
  overlay.innerHTML = html;
  host.appendChild(overlay);
  const primary = () => overlay.querySelector('.pause-btn.is-primary');
  const keepFocus = event => { if (!overlay.contains(event.target)) primary()?.focus({ preventScroll: true }); };
  document.addEventListener('focusin', keepFocus);
  requestAnimationFrame(() => primary()?.focus({ preventScroll: true }));
  overlay.addEventListener('pointerdown', () => overlay.classList.remove('is-kbd'));
  scene.events.once('shutdown', () => {
    document.removeEventListener('focusin', keepFocus);
    overlay.remove();
    scene.game.canvas?.focus?.();
  });
  return overlay;
}

// A tiny animation timeline: steps run at `delay` ms with a 0..1 progress; skip() jumps
// every step to its end state (tap anywhere to skip the count-up).
export function createTimeline(scene) {
  const steps = [];
  let start = performance.now(), frame = 0, finished = false;
  const listeners = [];
  const tick = () => {
    const t = performance.now() - start;
    let pending = false;
    for (const step of steps) {
      if (step.done) continue;
      const p = step.duration ? Math.min(1, Math.max(0, (t - step.delay) / step.duration)) : (t >= step.delay ? 1 : 0);
      if (p > 0 || step.duration === 0) step.run(p);
      if (p >= 1) step.done = true; else pending = true;
    }
    if (pending) frame = requestAnimationFrame(tick);
    else if (!finished) { finished = true; listeners.forEach(fn => fn()); }
  };
  scene.events.once('shutdown', () => cancelAnimationFrame(frame));
  return {
    add(delay, duration, run) { steps.push({ delay, duration, run, done: false }); return this; },
    play() { start = performance.now(); frame = requestAnimationFrame(tick); return this; },
    skip() { start = -1e9; cancelAnimationFrame(frame); tick(); },
    onDone(fn) { listeners.push(fn); },
    get finished() { return finished; }
  };
}

// Count a number up inside `el`.
export function countStep(el, to, format = formatNumber) {
  const ease = p => 1 - Math.pow(1 - p, 3);
  return p => { el.textContent = format(to * ease(p)); };
}

// ←→↑↓ / Tab move between buttons, Enter or Space presses the focused one, letter shortcuts.
// Space is also jump: a press still held from gameplay (no keydown seen here) is ignored.
export function bindMenuKeys(scene, overlay, { shortcuts = {}, onEnter } = {}) {
  let armedSpace = false, ready = false;
  scene.time.delayedCall(250, () => { ready = true; });
  overlay.addEventListener('keydown', event => {
    const buttons = [...overlay.querySelectorAll('.pause-btn')];
    const index = buttons.indexOf(document.activeElement);
    if (event.key.startsWith('Arrow') || event.key === 'Tab') {
      event.preventDefault();
      overlay.classList.add('is-kbd');
      const step = event.key === 'ArrowLeft' || event.key === 'ArrowUp' || (event.key === 'Tab' && event.shiftKey) ? -1 : 1;
      buttons[(index + step + buttons.length) % buttons.length]?.focus();
      sfx(scene).play('menuMove');
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (event.repeat || !ready) return;
      if (event.key === ' ') { armedSpace = true; return; }
      (onEnter && index < 0 ? onEnter : () => buttons[index]?.click())();
      return;
    }
    const shortcut = shortcuts[event.key.toLowerCase()];
    if (shortcut && !event.repeat && ready) { event.preventDefault(); shortcut(); }
  });
  overlay.addEventListener('keyup', event => {
    if (event.key !== ' ') return;
    event.preventDefault();
    const focused = document.activeElement;
    if (armedSpace && overlay.contains(focused) && focused.classList.contains('pause-btn')) focused.click();
    armedSpace = false;
  });
}

export function showStageClear(scene) {
  // Blocks the pause menu while the card is open (GameScene.pauseGame).
  scene.stageClearOpen = true;
  scene.hudContainer?.setVisible(false);
  scene.comboText?.setVisible(false);

  const level = scene.currentLevel;
  const isFinalStage = level >= TOTAL_LEVELS;
  const nextLevel = isFinalStage ? null : level + 1;
  const result = scene.finishSummary();
  const stars = starsFor(result);
  const saved = saveLevelResult(level, { ...result, stars });
  const best = saved.previous;
  const province = provinceForLevel(level);
  const nextProvince = nextLevel ? provinceForLevel(nextLevel) : null;
  const coinRatio = result.coinTotal ? result.coins / result.coinTotal : 1;

  // What the next star needs, shown under the stars.
  const missingSecret = result.secrets < result.secretTotal;
  const hint = stars === 3 ? (result.secretTotal ? 'Perfect run: every coin and secret!' : 'Perfect run: every coin!')
    : stars === 2 ? (coinRatio < 1 && missingSecret ? 'Collect every coin and find the secret for 3 stars'
      : coinRatio < 1 ? 'Collect every coin for 3 stars' : 'Find the secret for 3 stars')
      : 'Collect 80% of the coins for 2 stars';
  const secretText = result.secretTotal === 0 ? 'None here'
    : result.secrets >= result.secretTotal ? (result.secretTotal > 1 ? `Found ${result.secrets}/${result.secretTotal}` : 'Found!')
      : result.secretTotal > 1 ? `Found ${result.secrets}/${result.secretTotal}` : 'Not found';
  const nextLabel = nextProvince
    ? `Level ${nextLevel} · ${escapeHtml(nextProvince.id === province.id ? landmarkForLevel(nextLevel) : nextProvince.name)}`
    : 'Journey’s end';

  const overlay = mountOverlay(scene, 'is-stage-clear', 'finish-title', `
    <div class="pause-panel finish-panel">
      <div class="pause-head">${ORNAMENT}<h2 id="finish-title">STAGE CLEAR!</h2>${ORNAMENT}</div>
      <p class="pause-level">Level ${level} · ${escapeHtml(province?.name || '')}</p>
      <p class="finish-landmark">${escapeHtml(landmarkForLevel(level))}</p>
      <div class="finish-stars" role="img" aria-label="${stars} of 3 stars">
        ${[1, 2, 3].map(n => `<span class="finish-star${n <= stars ? ' is-earned' : ''}">${STAR}</span>`).join('')}
      </div>
      <p class="finish-hint">${hint}</p>
      <div class="finish-body">
        <dl class="finish-stats">
          <div><dt>Coins</dt><dd><span data-stat="coins">0</span><small>/ ${result.coinTotal}</small></dd></div>
          <div><dt>Score</dt><dd><span data-stat="score">0</span>
            ${saved.newBestScore ? '<em class="finish-best">NEW BEST!</em>' : best ? `<small>best ${formatNumber(best.bestScore)}</small>` : ''}</dd></div>
          <div><dt>Time</dt><dd><span data-stat="time">0:00</span>
            ${saved.newBestTime ? '<em class="finish-best">NEW BEST!</em>' : best ? `<small>best ${formatTime(best.bestTime)}</small>` : ''}</dd></div>
          <div><dt>Secret</dt><dd><span data-stat="secret" class="${result.secretTotal && result.secrets >= result.secretTotal ? 'is-yes' : 'is-no'}">${secretText}</span></dd></div>
        </dl>
        <figure class="finish-map">
          <figcaption>${isFinalStage ? 'Final stop' : 'Next stop'}</figcaption>
          ${nextStopMapSvg(level, nextLevel)}
          <p class="finish-next">${nextLabel}</p>
        </figure>
      </div>
      <nav class="finish-actions" aria-label="Stage clear">
        <button type="button" class="pause-btn" data-action="replay">${ROMDOUL}<span>Replay</span>${ROMDOUL}</button>
        <button type="button" class="pause-btn" data-action="map">${ROMDOUL}<span>Map</span>${ROMDOUL}</button>
        <button type="button" class="pause-btn is-primary is-next" data-action="next">${ROMDOUL}<span>${isFinalStage ? 'FINISH' : 'NEXT'}</span>${ROMDOUL}</button>
      </nav>
      <p class="pause-footer">Enter · ${isFinalStage ? 'Finish' : 'Next'} &nbsp;·&nbsp; R · Replay &nbsp;·&nbsp; M · Map &nbsp;·&nbsp; Tap to skip</p>
    </div>`);
  const $ = sel => overlay.querySelector(sel);

  /* ---------- animation: stars pop one by one, stats count up ---------- */
  const timeline = createTimeline(scene);
  overlay.querySelectorAll('.finish-star').forEach((star, i) => {
    timeline.add(380 + i * 300, 0, () => {
      star.classList.add('is-in');
      if (star.classList.contains('is-earned') && !timeline.skipping) sfx(scene).play('coin', { rate: 1 + i * 0.18 });
    });
  });
  timeline.add(450, 900, countStep($('[data-stat="coins"]'), result.coins));
  timeline.add(600, 1000, countStep($('[data-stat="score"]'), result.score));
  timeline.add(750, 900, countStep($('[data-stat="time"]'), result.seconds, formatTime));
  timeline.add(1100, 0, () => overlay.classList.add('is-secret-in'));
  timeline.add(1500, 0, () => overlay.classList.add('is-done'));
  timeline.play();
  // Tap anywhere (except a button) skips the count-up.
  overlay.addEventListener('pointerdown', event => {
    if (timeline.finished || event.target.closest('button')) return;
    timeline.skipping = true;
    timeline.skip();
  });

  /* ---------- actions ---------- */
  let leaving = false;
  const go = (key, data) => {
    if (leaving) return;
    leaving = true;
    overlay.classList.add('is-closing');
    sfx(scene).play('uiTap');
    fadeToScene(scene, key, data, { duration: 260 });
  };
  const actions = {
    next: () => (isFinalStage
      ? go('VictoryScene', { level: TOTAL_LEVELS, score: scene.score + 1000, coins: scene.coins })
      : go('GameScene', {
        level: nextLevel, score: scene.score, coins: scene.coins,
        lives: scene.lives, health: scene.health, shields: scene.shields
      })),
    replay: () => go('GameScene', { level, score: scene.levelStartScore, coins: scene.levelStartCoins, lives: 3 }),
    map: () => go('LevelSelectScene')
  };
  overlay.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => actions[btn.dataset.action]());
    btn.addEventListener('pointerenter', () => sfx(scene).play('menuMove'));
  });
  bindMenuKeys(scene, overlay, {
    shortcuts: { r: actions.replay, m: actions.map, n: actions.next },
    onEnter: actions.next
  });
  // Enter = Next even when focus is elsewhere (e.g. the canvas still has it).
  const onWindowKey = event => {
    if (event.key === 'Enter' && !event.repeat && !overlay.contains(document.activeElement)) actions.next();
  };
  window.addEventListener('keydown', onWindowKey);
  scene.events.once('shutdown', () => window.removeEventListener('keydown', onWindowKey));
}
