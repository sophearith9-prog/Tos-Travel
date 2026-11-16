// Mechanics registry and manager.
//
// A mechanic is a small module:
//   export default {
//     type: 'myMechanic',
//     create(scene, config) {          // called once, after the player and enemies exist
//       ...build objects...
//       return {
//         update(time, delta) {},     // every frame, after player input and physics
//         destroy() {}                // on scene shutdown (or when removed)
//       };
//     }
//   };
// Register new ones with registerMechanic(); layouts then use { type: 'myMechanic', ... }.

import movingPlatform from './movingPlatform.js';
import sinkingPlatform from './sinkingPlatform.js';
import risingWater from './risingWater.js';
import autoScrollCamera from './autoScrollCamera.js';
import windZone from './windZone.js';
import checkpoint from './checkpoint.js';
import spikes from './spikes.js';
import miniBoss from './miniBoss.js';

const MECHANICS = new Map();

export function registerMechanic(definition) {
  if (!definition?.type || typeof definition.create !== 'function') {
    throw new Error('A mechanic needs a `type` and a `create(scene, config)` function.');
  }
  MECHANICS.set(definition.type, definition);
}

[movingPlatform, sinkingPlatform, risingWater, autoScrollCamera, windZone, checkpoint, spikes, miniBoss]
  .forEach(registerMechanic);

// Create every mechanic a stage asks for and drive them until the scene shuts down.
export function installMechanics(scene, specs) {
  const instances = specs.map(spec => {
    const definition = MECHANICS.get(spec.type);
    if (!definition) throw new Error(`Unknown mechanic type '${spec.type}'. Known: ${[...MECHANICS.keys()].join(', ')}`);
    const instance = definition.create(scene, spec) || {};
    instance.type = spec.type;
    return instance;
  });
  // postupdate runs after GameScene.update (player input) and the physics step, so
  // pushes and carries from mechanics are not overwritten by the movement code.
  const update = (time, delta) => {
    for (const instance of instances) instance.update?.(time, delta);
  };
  scene.events.on('postupdate', update);
  scene.events.once('shutdown', () => {
    scene.events.off('postupdate', update);
    instances.forEach(instance => instance.destroy?.());
  });
  return instances;
}
