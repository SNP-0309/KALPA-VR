/**
 * KALPA - Chapter 1: Cosmic Ocean (Kshirasagara & Vishnu on Shesha)
 * Infinite reflective primordial ocean, volumetric sea mist, 3000 GPU starfield,
 * and divine floating Vishnu on Ananta Shesha canopy.
 */

import * as THREE from 'three';
import { SceneBase } from './scene-base.js';
import { createWaterMaterial } from '../shaders/water.js';
import { CHAPTER_LOOKS } from '../config/looks.js';

export class CosmicOceanScene extends SceneBase {
  constructor(context) {
    super('cosmic_ocean', context);
    this.look = CHAPTER_LOOKS[1];
    this.waterMesh = null;
    this.waterMat = null;
    this.stars = null;
    this.mistGroup = null;
    this.vishnuGroup = null;
    this.initialY = 0;
  }

  async init() {
    const { assetManager } = this.context;

    // 1. Lighting Setup
    const ambientLight = new THREE.AmbientLight(this.look.ambientColor, this.look.ambientIntensity);
    this.group.add(ambientLight);

    // Golden divine key light
    this.goldKeyLight = new THREE.DirectionalLight(this.look.keyColor, this.look.keyIntensity);
    this.goldKeyLight.position.set(5, 8, 4);
    this.goldKeyLight.castShadow = true;
    this.goldKeyLight.shadow.mapSize.width = 1024;
    this.goldKeyLight.shadow.mapSize.height = 1024;
    this.group.add(this.goldKeyLight);

    // Cyan-blue celestial rim light
    this.rimLight = new THREE.PointLight(this.look.rimColor, this.look.rimIntensity, 35);
    this.rimLight.position.set(-6, -2, -4);
    this.group.add(this.rimLight);

    // 2. Primordial Water Surface
    const waterGeom = new THREE.PlaneGeometry(450, 450, 128, 128);
    this.waterMat = createWaterMaterial({
      waterColor: this.look.waterColor,
      waterSpecular: this.look.waterSpecular,
      waterFoamColor: this.look.waterFoamColor,
      sunDir: new THREE.Vector3(5, 8, 4).normalize(),
      opacity: 1.0
    });
    this.waterMesh = new THREE.Mesh(waterGeom, this.waterMat);
    this.waterMesh.rotation.x = -Math.PI / 2;
    this.waterMesh.position.y = 0;
    this.waterMesh.receiveShadow = true;
    this.group.add(this.waterMesh);

    // 3. Cosmic Starfield (3000 points on sphere r=500)
    const starCount = 3000;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    const colorA = new THREE.Color('#fffde8');
    const colorB = new THREE.Color('#6ab0ff');
    const tempColor = new THREE.Color();

    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 480 + Math.random() * 40;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = Math.max(10, r * Math.sin(phi) * Math.sin(theta)); // Keep above horizon
      const z = r * Math.cos(phi);

      starPositions[i * 3] = x;
      starPositions[i * 3 + 1] = y;
      starPositions[i * 3 + 2] = z;

      tempColor.lerpColors(colorA, colorB, Math.random() * 0.4);
      const brightness = 0.7 + Math.random() * 0.5;
      starColors[i * 3] = tempColor.r * brightness;
      starColors[i * 3 + 1] = tempColor.g * brightness;
      starColors[i * 3 + 2] = tempColor.b * brightness;
    }

    const starGeom = new THREE.BufferGeometry();
    starGeom.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeom.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 1.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });
    this.stars = new THREE.Points(starGeom, starMat);
    this.group.add(this.stars);

    // 4. Volumetric Sea Mist (Layered horizontal planes hugging ocean surface)
    this.mistGroup = new THREE.Group();
    const mistPlaneGeom = new THREE.PlaneGeometry(350, 350);
    for (let i = 0; i < 7; i++) {
      const mistMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(this.look.fogColor),
        transparent: true,
        opacity: 0.12 - i * 0.015,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const mistMesh = new THREE.Mesh(mistPlaneGeom, mistMat);
      mistMesh.rotation.x = -Math.PI / 2;
      mistMesh.position.y = 0.2 + i * 0.45;
      this.mistGroup.add(mistMesh);
    }
    this.group.add(this.mistGroup);

    // 5. Vishnu on Ananta Shesha
    this.vishnuGroup = await assetManager.loadModel('/assets/models/vishnu_shesha.glb', 'vishnu_shesha');
    this.vishnuGroup.position.set(0, 0, -5);
    this.initialY = this.vishnuGroup.position.y;
    this.group.add(this.vishnuGroup);

    // Subtle breathing halo particles around Vishnu
    const auraCount = 450;
    const auraPos = new Float32Array(auraCount * 3);
    for (let i = 0; i < auraCount * 3; i += 3) {
      auraPos[i] = (Math.random() - 0.5) * 8.0;
      auraPos[i + 1] = Math.random() * 5.0;
      auraPos[i + 2] = -5.0 + (Math.random() - 0.5) * 6.0;
    }
    const auraGeom = new THREE.BufferGeometry();
    auraGeom.setAttribute('position', new THREE.BufferAttribute(auraPos, 3));
    const auraMat = new THREE.PointsMaterial({
      color: 0xffd580,
      size: 0.12,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });
    this.auraParticles = new THREE.Points(auraGeom, auraMat);
    this.group.add(this.auraParticles);

    await super.init();
  }

  enter() {
    super.enter();
    if (this.context.cameraRig) {
      // Start camera at floating height 3.5m looking slightly forward
      this.context.cameraRig.moveTo(
        new THREE.Vector3(0, 3.5, 14),
        new THREE.Vector3(0, 1.2, 0),
        0.012
      );
    }
  }

  update(time, delta) {
    // 1. Animate water shader time & camera position
    if (this.waterMat) {
      this.waterMat.uniforms.uTime.value = time;
      if (this.context.cameraRig?.camera) {
        this.waterMat.uniforms.uCameraPos.value.copy(this.context.cameraRig.camera.position);
      }
    }

    // 2. Slow breathing drift of sea mist
    if (this.mistGroup) {
      this.mistGroup.children.forEach((plane, idx) => {
        plane.rotation.z += delta * (0.002 * (idx % 2 === 0 ? 1 : -1));
        plane.position.y = 0.2 + idx * 0.45 + Math.sin(time * 0.4 + idx) * 0.05;
      });
    }

    // 3. Vishnu floating sinusoidal breath and micro-rotation
    if (this.vishnuGroup) {
      const floatOffset = Math.sin(time * 0.3) * 0.08;
      this.vishnuGroup.position.y = this.initialY + floatOffset;
      this.vishnuGroup.rotation.y += delta * 0.015;
    }

    // 4. Stardust stars gentle rotation
    if (this.stars) {
      this.stars.rotation.y += delta * 0.004;
    }

    // 5. Breathing aura particles
    if (this.auraParticles) {
      this.auraParticles.rotation.y += delta * 0.02;
    }
  }
}
