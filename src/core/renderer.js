/**
 * KALPA - WebGL & WebXR Renderer Setup
 * ACESFilmic tone mapping, sRGB output color space, physically correct lighting, PCF soft shadows.
 */

import * as THREE from 'three';
import { QUALITY_PRESETS } from '../config/settings.js';

export class AppRenderer {
  constructor(canvasContainer, qualityPresetKey = 'high') {
    this.container = canvasContainer;
    this.presetKey = qualityPresetKey;
    this.preset = QUALITY_PRESETS[qualityPresetKey] || QUALITY_PRESETS.high;

    // WebGLRenderer
    this.renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: this.preset.antialias,
      stencil: false,
      depth: true,
      alpha: false
    });

    // PBR & Color Science
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Soft Shadows
    if (this.preset.shadows) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    // WebXR configuration
    this.renderer.xr.enabled = true;

    // Sizing & DPR
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(this.preset.pixelRatio);

    this.container.appendChild(this.renderer.domElement);

    window.addEventListener('resize', this.onResize.bind(this));
  }

  setQuality(presetKey) {
    if (!QUALITY_PRESETS[presetKey]) return;
    this.presetKey = presetKey;
    this.preset = QUALITY_PRESETS[presetKey];
    this.renderer.setPixelRatio(this.preset.pixelRatio);
    this.renderer.shadowMap.enabled = this.preset.shadows;
    console.log(`[Renderer] Applied Quality Preset: ${presetKey}`);
  }

  onResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.renderer.setSize(this.width, this.height);
  }

  getDomElement() {
    return this.renderer.domElement;
  }
}
