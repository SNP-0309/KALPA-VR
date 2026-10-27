/**
 * KALPA: The Journey of Creation
 * Main Application Orchestrator v2.0
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
import { VoidScene } from './scenes/ch00-void.js';
import { CosmicOceanScene } from './scenes/ch01-cosmic-ocean.js';
import { LotusScene } from './scenes/ch02-lotus.js';
import { PlaceholderScene } from './scenes/placeholder-scene.js';
import { HUD } from './ui/hud.js';
import { TimelineRing } from './ui/timeline-ring.js';
import { DualSubtitleSystem } from './ui/dual-subtitles.js';
import { FeedbackPanel } from './ui/feedback.js';
import { GuideModal } from './ui/guide-modal.js';
import { ASSET_PATHS } from './config/assets.js';
import { getLook } from './config/looks.js';
import scriptData from './narration/script.json';

class KalpaApp {
  constructor() {
    this.canvasContainer = document.getElementById('canvas-container');
    this.uiRoot = document.getElementById('ui-root');
    this.clock = new THREE.Clock();
    this.qualityPreset = 'high';
  }

  async init() {
    console.log('[KALPA] Initializing Engine v2.0 with Chapters 0, 1 & 2...');

    // 1. GPU Benchmark
    this.qualityPreset = await benchmarkGPU();
    console.log(`[KALPA] Quality Preset: ${this.qualityPreset}`);

    // 2. Scene & Renderer
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x04060e);

    this.appRenderer = new AppRenderer(this.canvasContainer, this.qualityPreset);
    this.renderer = this.appRenderer.renderer;

    // 3. Camera Rig
    this.cameraRig = new CameraRig(this.renderer.domElement);
    this.scene.add(this.cameraRig.rigGroup);

    // 4. Asset Manager & Post-Processing
    this.assetManager = new AssetManager(this.renderer);
    this.postProcessing = new PostProcessingManager(
      this.renderer, this.scene, this.cameraRig.camera, this.qualityPreset
    );

    // 5. Audio & Narration Engines
    this.audioEngine = new AudioEngine();
    this.narrationEngine = new NarrationEngine(this.audioEngine);

    // 6. Dual-Track Subtitle System
    this.dualSubtitles = new DualSubtitleSystem(
      this.uiRoot,
      this.narrationEngine,
      this.renderer
    );

    // 7. Guide Modal (Ask Naad)
    this.guideModal = new GuideModal(this.uiRoot, this.narrationEngine);

    // 8. Feedback Panel
    this.feedbackPanel = new FeedbackPanel(this.uiRoot, this);

    // 9. Instantiate Chapter Scenes
    const sceneContext = {
      renderer: this.renderer,
      assetManager: this.assetManager,
      audioEngine: this.audioEngine,
      cameraRig: this.cameraRig,
      postProcessing: this.postProcessing
    };

    const voidScene = new VoidScene(sceneContext);
    const cosmicOceanScene = new CosmicOceanScene(sceneContext);
    const lotusScene = new LotusScene(sceneContext);
    const fallbackScene = new PlaceholderScene(sceneContext);

    await Promise.all([
      voidScene.init(),
      cosmicOceanScene.init(),
      lotusScene.init(),
      fallbackScene.init()
    ]);

    this.scene.add(voidScene.group);
    this.scene.add(cosmicOceanScene.group);
    this.scene.add(lotusScene.group);
    this.scene.add(fallbackScene.group);

    // Map 12 chapters to scenes (0: Void, 1: Ocean, 2: Lotus, 3-11: Fallback/Upcoming)
    this.scenes = [
      voidScene,        // 0: The Void
      cosmicOceanScene, // 1: Cosmic Ocean
      lotusScene,       // 2: The Lotus Blooms
      fallbackScene,    // 3: Solar Nebula
      fallbackScene,    // 4: Planetary Accretion
      fallbackScene,    // 5: Theia Impact
      fallbackScene,    // 6: Magma Ocean
      fallbackScene,    // 7: Oceans Arrive & Manthan
      fallbackScene,    // 8: First Life
      fallbackScene,    // 9: Dashavatara
      fallbackScene,    // 10: Cycle of Yugas
      fallbackScene     // 11: Pralaya
    ];

    // Initial activation
    voidScene.enter();
    this.postProcessing.applyLook(getLook(0));

    // 10. Timeline
    this.timeline = new TimelineManager({
      scenes: this.scenes,
      cameraRig: this.cameraRig,
      narrationEngine: this.narrationEngine,
      audioEngine: this.audioEngine,
      postProcessing: this.postProcessing
    });

    // Chapter change: fire visual look + dual subtitles + quick reaction
    this.timeline.on('chapterChange', ({ chapter, index }) => {
      this.postProcessing.applyLook(getLook(index));
      this.dualSubtitles.setMode(this.narrationEngine.mode);
      this.dualSubtitles.playChapter(index, scriptData);
      if (index > 0) {
        this.feedbackPanel.showQuickReaction(index - 1);
      }
      // Auto-prompt feedback at Pralaya (chapter 11)
      if (index === 11) {
        setTimeout(() => this.feedbackPanel.open(true), 30000);
      }
    });

    // 11. HUD & Timeline Ring
    this.hud = new HUD(this.uiRoot, {
      timeline: this.timeline,
      narrationEngine: this.narrationEngine,
      audioEngine: this.audioEngine,
      cameraRig: this.cameraRig,
      renderer: this.appRenderer,
      guideModal: this.guideModal,
      feedbackPanel: this.feedbackPanel,
      dualSubtitles: this.dualSubtitles
    });
    this.hud.setQuality(this.qualityPreset);
    this.timelineRing = new TimelineRing(this.uiRoot, this.timeline);

    // 12. HDR Environment Preload
    this.assetManager.onProgress((ratio, itemUrl) => {
      this.hud.updateProgress(ratio, itemUrl);
    });

    await this.assetManager.loadHDR(ASSET_PATHS.hdri.deep_space).then((envMap) => {
      this.scene.environment = envMap;
      this.scene.background = envMap;
    });

    // 13. Propagate mode change to subtitle system
    const origSetMode = this.narrationEngine.setMode.bind(this.narrationEngine);
    this.narrationEngine.setMode = (mode) => {
      origSetMode(mode);
      this.dualSubtitles.setMode(mode);
    };

    setTimeout(() => {
      this.hud.updateProgress(1.0);
      this.hud.showTitleScreen();
    }, 600);

    // 14. Animation Loop
    this.renderer.setAnimationLoop(this.animate.bind(this));
    console.log('[KALPA] Engine v2.0 launched successfully with Phase 2 chapters.');
  }

  animate() {
    const delta = Math.min(this.clock.getDelta(), 0.1);
    const elapsedTime = this.clock.getElapsedTime();

    // Update all active scenes
    const activeScenes = new Set();
    for (let i = 0; i < this.scenes.length; i++) {
      const s = this.scenes[i];
      if (s && s.isActive && !activeScenes.has(s)) {
        activeScenes.add(s);
        s.update(elapsedTime, delta);
      }
    }

    this.cameraRig.update(delta);
    this.timeline.update(delta);

    // VR subtitle panel: soft follow-lag
    if (this.renderer.xr.isPresenting && this.dualSubtitles) {
      this.dualSubtitles.updateVRFollow(this.cameraRig.camera, delta);
    }

    this.postProcessing.render(delta);

    if (this.hud) this.hud.updateFPS();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const app = new KalpaApp();
  app.init().catch(err => console.error('[KALPA] Fatal Init Error:', err));
});
