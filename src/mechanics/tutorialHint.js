// One-time on-screen hint shown the first time the player reaches `x`.
//   { type: 'tutorialHint', x, text, holdMs = 4200, screenY = 160 }
// Uses GameScene.screenText, so it gets the readable font, dark outline and panel.
// Waits for the stage-intro banner to clear before showing.
export default {
  type: 'tutorialHint',
  create(scene, cfg) {
    const { x, text, holdMs = 4200, screenY = 160 } = cfg;
    const createdAt = scene.time.now;
    let shown = false, label = null;
    return {
      update() {
        if (shown || scene.player.x < x || scene.time.now - createdAt < 2600) return;
        shown = true;
        // A newer hint replaces one that is still on screen.
        scene.activeHint?.destroy();
        label = scene.activeHint = scene.screenText(400, screenY, text, {
          fontSize: '12px', fontStyle: 'bold', color: '#fff2c8', align: 'center'
        }).setOrigin(0.5).setDepth(230).setAlpha(0);
        scene.tweens.add({ targets: label, alpha: 1, duration: 250 });
        scene.tweens.add({ targets: label, alpha: 0, delay: holdMs, duration: 500, onComplete: () => label?.destroy() });
      },
      destroy() { label?.destroy(); }
    };
  }
};
