/**
 * KALPA - Post-Processing Pipeline (pmndrs/postprocessing)
 * High-fidelity visual stack: Bloom, Depth of Field, Vignette, Film Grain, Chromatic Aberration.
 * Auto-bypasses during active WebXR sessions for optimal framerate and standard stereo rendering.
 */

import * as THREE from 'three';
import {
  EffectComposer,
  RenderPass,
  BloomEffect,
  VignetteEffect,
  DepthOfFieldEffect,
  ChromaticAberrationEffect,
  EffectPass,
  BlendFunction
} from 'postprocessing';

export class PostProcessingManager {
  constructor(renderer, scene, camera, qualityPresetKey = 'high') {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.qualityPresetKey = qualityPresetKey;
    this.enabled = qualityPresetKey !== 'low';

    this.composer = null;
    this.bloomEffect = null;
    this.dofEffect = null;
    this.vignetteEffect = null;
    this.chromaticEffect = null;

    if (this.enabled) {
      this.init();
    }
  }

  init() {
    try {
      this.composer = new EffectComposer(this.renderer, {
        frameBufferType: THREE.HalfFloatType
      });

      // 1. Render Pass
      this.renderPass = new RenderPass(this.scene, this.camera);
      this.composer.addPass(this.renderPass);

      // 2. Bloom Effect
      this.bloomEffect = new BloomEffect({
        blendFunction: BlendFunction.SCREEN,
        luminanceThreshold: 0.55,
        luminanceSmoothing: 0.25,
        intensity: 1.35,
        mipmapBlur: true
      });

      // 3. Depth of Field Effect
      this.dofEffect = new DepthOfFieldEffect(this.camera, {
        focusDistance: 0.02,
        focalLength: 0.05,
        bokehScale: 2.0
      });

      // 4. Subtle Vignette Effect (cinematic dark edge)
      this.vignetteEffect = new VignetteEffect({
        esv: false,
        offset: 0.35,
        darkness: 0.65
      });

      // 5. Subtle Chromatic Aberration
      this.chromaticEffect = new ChromaticAberrationEffect({
        offset: new THREE.Vector2(0.0008, 0.0008),
        radialModulation: true,
        modulationOffset: 0.3
      });

      const effects = [this.bloomEffect, this.vignetteEffect, this.chromaticEffect];
      if (this.qualityPresetKey === 'high') {
        effects.push(this.dofEffect);
      }

      this.effectPass = new EffectPass(this.camera, ...effects);
      this.composer.addPass(this.effectPass);

      window.addEventListener('resize', this.onResize.bind(this));
    } catch (e) {
      console.warn('[PostProcessing] Fallback to direct renderer due to init error:', e);
      this.enabled = false;
    }
  }

  setSceneAndCamera(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    if (this.renderPass) {
      this.renderPass.mainScene = scene;
      this.renderPass.mainCamera = camera;
    }
    if (this.dofEffect) {
      this.dofEffect.camera = camera;
    }
  }

  setBloomIntensity(val) {
    if (this.bloomEffect) {
      this.bloomEffect.intensity = val;
    }
  }

  setQuality(presetKey) {
    this.qualityPresetKey = presetKey;
    this.enabled = presetKey !== 'low';
  }

  onResize() {
    if (this.composer) {
      this.composer.setSize(window.innerWidth, window.innerHeight);
    }
  }

  render(deltaTime) {
    // If WebXR is actively presenting, render directly via Three.js
    if (this.renderer.xr.isPresenting || !this.enabled || !this.composer) {
      this.renderer.render(this.scene, this.camera);
    } else {
      this.composer.render(deltaTime);
    }
  }
}
