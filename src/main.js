/**
 * KALPA: The Journey of Creation
 * Main Application Orchestrator
 */

import * as THREE from 'three';
import { benchmarkGPU } from './core/benchmark.js';
import { AppRenderer } from './core/renderer.js';
import { CameraRig } from './core/camera-rig.js';
import { AssetManager } from './core/asset-manager.js';
import { AudioEngine } from './core/audio-engine.js';
import { NarrationEngine } from './narration/narration-engine.js';
import { PostProcessingManager } from './core/postprocessing.js';
import { TimelineManager } from './core/timeline.js';
import { PlaceholderScene } from './scenes/placeholder-scene.js';
import { HUD } from './ui/hud.js';
import { TimelineRing } from './ui/timeline-ring.js';
import { SubtitleDisplay } from './ui/subtitles.js';
import { GuideModal } from './ui/guide-modal.js';
import { ASSET_PATHS } from './config/assets.js';

class KalpaApp {
  constructor() {
    this.canvasContainer = document.getElementById('canvas-container');
    this.uiRoot = document.getElementById('ui-root');
    this.clock = new THREE.Clock();
  }

  async init() {
    console.log('[KALPA] Initializing Engine...');

    // 1. Run Rapid GPU Benchmark for Quality Preset
    const qualityPreset = await benchmarkGPU();
    console.log(`[KALPA] Benchmark Selected LOD Preset: ${qualityPreset}`);

    // 2. Setup Three.js Scene & Renderer
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x04060e);

    this.appRenderer = new AppRenderer(this.canvasContainer, qualityPreset);
    this.renderer = this.appRenderer.renderer;

    // 3. Setup Camera Rig
    this.cameraRig = new CameraRig(this.renderer.domElement);
    this.scene.add(this.cameraRig.rigGroup);

    // 4. Setup Asset Manager & Post-Processing
    this.assetManager = new AssetManager(this.renderer);
    this.postProcessing = new PostProcessingManager(
      this.renderer,
      this.scene,
      this.cameraRig.camera,
      qualityPreset
    );

    // 5. Setup Audio & Narration Engines
    this.audioEngine = new AudioEngine();
    this.narrationEngine = new NarrationEngine(this.audioEngine);

    // 6. Setup UI Elements
    this.subtitleDisplay = new SubtitleDisplay(this.uiRoot);
    this.narrationEngine.setSubtitleCallback((text, visible) => {
      if (visible) this.subtitleDisplay.show(text);
      else this.subtitleDisplay.hide();
    });

    this.guideModal = new GuideModal(this.uiRoot, this.narrationEngine);

    // 7. Instantiate Phase 1 Verification Placeholder Scene
    this.placeholderScene = new PlaceholderScene({
      renderer: this.renderer,
      assetManager: this.assetManager,
      audioEngine: this.audioEngine,
      cameraRig: this.cameraRig,
      postProcessing: this.postProcessing
    });
    await this.placeholderScene.init();
    this.scene.add(this.placeholderScene.group);
    this.placeholderScene.enter();

    // Map scenes array for Timeline
    this.scenes = [this.placeholderScene];

    // 8. Setup Timeline Manager
    this.timeline = new TimelineManager({
      scenes: this.scenes,
      cameraRig: this.cameraRig,
      narrationEngine: this.narrationEngine,
      audioEngine: this.audioEngine,
      postProcessing: this.postProcessing
    });

    // 9. Build HUD & Timeline Ring
    this.hud = new HUD(this.uiRoot, {
      timeline: this.timeline,
      narrationEngine: this.narrationEngine,
      audioEngine: this.audioEngine,
      cameraRig: this.cameraRig,
      renderer: this.appRenderer,
      guideModal: this.guideModal
    });
    this.hud.setQuality(qualityPreset);

    this.timelineRing = new TimelineRing(this.uiRoot, this.timeline);

    // 10. Load Initial Environment / Preload Base Assets
    this.assetManager.onProgress((ratio, itemUrl) => {
      this.hud.updateProgress(ratio, itemUrl);
    });

    // Trigger preloading of HDR skybox (with procedural cosmic fallback if missing)
    await this.assetManager.loadHDR(ASSET_PATHS.hdri.deep_space).then((envMap) => {
      this.scene.environment = envMap;
      this.scene.background = envMap;
    });

    // Finish Loading Screen and reveal Title Screen
    setTimeout(() => {
      this.hud.updateProgress(1.0);
      this.hud.showTitleScreen();
    }, 600);

    // 11. Start WebGL / WebXR Animation Loop
    this.renderer.setAnimationLoop(this.animate.bind(this));
    console.log('[KALPA] Engine successfully launched.');
  }

  animate() {
    const delta = Math.min(this.clock.getDelta(), 0.1);
    const elapsedTime = this.clock.getElapsedTime();

    // Update active scene
    if (this.placeholderScene && this.placeholderScene.isActive) {
      this.placeholderScene.update(elapsedTime, delta);
    }

    // Update camera rig & timeline
    this.cameraRig.update(delta);
    this.timeline.update(delta);

    // Render with postprocessing (or direct WebXR pass)
    this.postProcessing.render(delta);

    // Update FPS telemetry
    if (this.hud) {
      this.hud.updateFPS();
    }
  }
}

// Launch KALPA on DOM ready
window.addEventListener('DOMContentLoaded', () => {
  const app = new KalpaApp();
  app.init().catch(err => console.error('[KALPA] Fatal Init Error:', err));
});
