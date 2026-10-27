/**
 * KALPA - Base Scene Class
 * Common lifecycle and cross-dissolve container for all chapters.
 */

import * as THREE from 'three';

export class SceneBase {
  constructor(name, context) {
    this.name = name;
    this.context = context; // { renderer, assetManager, audioEngine, cameraRig, postProcessing }
    this.group = new THREE.Group();
    this.group.name = `scene_${name}`;
    this.isLoaded = false;
    this.isActive = false;
    this.opacity = 1.0;
  }

  async init() {
    this.isLoaded = true;
  }

  enter() {
    this.isActive = true;
    this.group.visible = true;
  }

  update(time, delta) {
    // Override in chapter
  }

  exit() {
    this.isActive = false;
    this.group.visible = false;
  }

  setFade(opacity) {
    this.opacity = opacity;
    this.group.traverse((obj) => {
      if (obj.isMesh && obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => {
            m.transparent = true;
            m.opacity = opacity;
          });
        } else {
          obj.material.transparent = true;
          obj.material.opacity = opacity;
        }
      }
    });
  }

  destroy() {
    this.exit();
    this.group.traverse((child) => {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
          else child.material.dispose();
        }
      }
    });
  }
}
