/**
 * KALPA - Chapter 2: The Lotus Blooms (Brahma & First Light)
 * Rises from the cosmic ocean: golden lotus stem, 24 sequenced opening petals,
 * seated Brahma with rotating halo aura, and a column of 3500 upward golden energy particles.
 */

import * as THREE from 'three';
import { SceneBase } from './scene-base.js';
import { createWaterMaterial } from '../shaders/water.js';
import { CHAPTER_LOOKS } from '../config/looks.js';

export class LotusScene extends SceneBase {
  constructor(context) {
    super('lotus_blooms', context);
    this.look = CHAPTER_LOOKS[2];
    this.elapsedInScene = 0;
    this.petals = [];
    this.brahmaGroup = null;
    this.particleStream = null;
    this.particlePositions = null;
    this.particleVelocities = null;
    this.waterMat = null;
  }

  async init() {
    const { assetManager } = this.context;

    // 1. Lighting Setup
    const ambientLight = new THREE.AmbientLight(this.look.ambientColor, this.look.ambientIntensity);
    this.group.add(ambientLight);

    // Bright sacred golden key light
    this.keyLight = new THREE.DirectionalLight(this.look.keyColor, this.look.keyIntensity);
    this.keyLight.position.set(4, 10, 5);
    this.keyLight.castShadow = true;
    this.group.add(this.keyLight);

    // Brahmic neon-cyan rim light
    this.rimLight = new THREE.PointLight(this.look.rimColor, this.look.rimIntensity, 40);
    this.rimLight.position.set(-5, 4, -6);
    this.group.add(this.rimLight);

    // 2. Cosmic Ocean Base (calm mirror beneath)
    const waterGeom = new THREE.PlaneGeometry(450, 450, 128, 128);
    this.waterMat = createWaterMaterial({
      waterColor: '#041026',
      waterSpecular: '#80c4ff',
      waterFoamColor: '#d0e0ff',
      sunDir: new THREE.Vector3(4, 10, 5).normalize(),
      opacity: 0.95
    });
    const waterMesh = new THREE.Mesh(waterGeom, this.waterMat);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.y = 0;
    this.group.add(waterMesh);

    // 3. Golden Lotus Structure
    this.lotusRoot = new THREE.Group();
    this.lotusRoot.position.set(0, 0, -4);
    this.group.add(this.lotusRoot);

    // 3a. Golden Stem
    const stemGeom = new THREE.CylinderGeometry(0.12, 0.18, 4.2, 16);
    const stemMat = new THREE.MeshStandardMaterial({
      color: 0x1f442b,
      roughness: 0.35,
      metalness: 0.7,
      emissive: 0xd4af37,
      emissiveIntensity: 0.3
    });
    this.stemMesh = new THREE.Mesh(stemGeom, stemMat);
    this.stemMesh.position.y = 2.1;
    this.lotusRoot.add(this.stemMesh);

    // 3b. Golden Pistil / Receptacle
    const pistilGeom = new THREE.CylinderGeometry(0.7, 0.45, 0.5, 24);
    const pistilMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      roughness: 0.2,
      metalness: 0.85,
      emissive: 0xffa000,
      emissiveIntensity: 0.65
    });
    this.pistilMesh = new THREE.Mesh(pistilGeom, pistilMat);
    this.pistilMesh.position.y = 4.2;
    this.lotusRoot.add(this.pistilMesh);

    // 3c. 24 Animated Petals grouped into 3 Tiers
    const petalGeom = new THREE.ConeGeometry(0.35, 1.4, 8);
    petalGeom.scale(1, 1, 0.18);
    const petalMat = new THREE.MeshStandardMaterial({
      color: 0xffb7c5,
      roughness: 0.25,
      metalness: 0.4,
      emissive: new THREE.Color(this.look.emissiveColor),
      emissiveIntensity: 0.55,
      side: THREE.DoubleSide
    });

    this.petals = [];
    const tierCounts = [8, 8, 8];
    const tierRadii = [0.75, 1.1, 1.45];
    const tierBaseY = [4.2, 4.05, 3.9];

    for (let t = 0; t < 3; t++) {
      const count = tierCounts[t];
      for (let p = 0; p < count; p++) {
        const angle = (p / count) * Math.PI * 2 + (t * 0.26);
        const petalMesh = new THREE.Mesh(petalGeom, petalMat);

        petalMesh.position.set(
          Math.cos(angle) * tierRadii[t],
          tierBaseY[t],
          Math.sin(angle) * tierRadii[t]
        );
        petalMesh.rotation.y = -angle;
        // Start closed (pointing almost straight up)
        petalMesh.rotation.x = 1.35;

        this.lotusRoot.add(petalMesh);
        this.petals.push({
          mesh: petalMesh,
          tier: t,
          angle: angle,
          targetRotX: 0.35 + t * 0.22,
          openStart: t * 4.0,
          openEnd: t * 4.0 + 4.5
        });
      }
    }

    // 4. Brahma Appearance & Halo Aura
    this.brahmaGroup = await assetManager.loadModel('/assets/models/brahma.glb', 'brahma');
    this.brahmaGroup.position.set(0, 4.45, -4);
    this.brahmaGroup.scale.set(1.1, 1.1, 1.1);

    // Initial transparency for progressive fade-in
    this.brahmaGroup.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material = child.material.clone();
        child.material.transparent = true;
        child.material.opacity = 0.0;
      }
    });

    // Spinning Aura Ring
    const auraRingGeom = new THREE.TorusGeometry(0.85, 0.035, 16, 48);
    const auraRingMat = new THREE.MeshBasicMaterial({
      color: 0xfff2a0,
      transparent: true,
      opacity: 0.8
    });
    this.auraRing = new THREE.Mesh(auraRingGeom, auraRingMat);
    this.auraRing.position.set(0, 6.2, -4);
    this.group.add(this.auraRing);
    this.group.add(this.brahmaGroup);

    // 5. Golden Upward Particle Stream (3500 GPU Particles)
    const particleCount = 3500;
    this.particlePositions = new Float32Array(particleCount * 3);
    this.particleVelocities = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const pColor1 = new THREE.Color('#ffd580');
    const pColor2 = new THREE.Color('#ffe082');
    const tempPColor = new THREE.Color();

    for (let i = 0; i < particleCount; i++) {
      this._resetParticle(i, true);

      tempPColor.lerpColors(pColor1, pColor2, Math.random());
      colors[i * 3] = tempPColor.r;
      colors[i * 3 + 1] = tempPColor.g;
      colors[i * 3 + 2] = tempPColor.b;
    }

    const particleGeom = new THREE.BufferGeometry();
    this.particlePosAttr = new THREE.BufferAttribute(this.particlePositions, 3);
    particleGeom.setAttribute('position', this.particlePosAttr);
    particleGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.09,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    this.particleStream = new THREE.Points(particleGeom, particleMat);
    this.group.add(this.particleStream);

    await super.init();
  }

  _resetParticle(i, randomizeY = false) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * 1.5;
    this.particlePositions[i * 3] = Math.cos(angle) * r;
    this.particlePositions[i * 3 + 1] = randomizeY ? 4.2 + Math.random() * 14.0 : 4.2;
    this.particlePositions[i * 3 + 2] = -4 + Math.sin(angle) * r;

    this.particleVelocities[i * 3] = (Math.random() - 0.5) * 0.12;
    this.particleVelocities[i * 3 + 1] = 0.5 + Math.random() * 0.85; // Upward stream
    this.particleVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.12;
  }

  enter() {
    super.enter();
    this.elapsedInScene = 0;
    if (this.context.cameraRig) {
      // Camera rises with the lotus
      this.context.cameraRig.moveTo(
        new THREE.Vector3(0, 3.8, 7.5),
        new THREE.Vector3(0, 4.5, -4),
        0.015
      );
    }
  }

  update(time, delta) {
    this.elapsedInScene += delta;

    // 1. Water update
    if (this.waterMat) {
      this.waterMat.uniforms.uTime.value = time;
    }

    // 2. Sequential Petal Opening Animation
    this.petals.forEach((p) => {
      if (this.elapsedInScene >= p.openStart) {
        const progress = Math.min(1.0, (this.elapsedInScene - p.openStart) / (p.openEnd - p.openStart));
        // Smooth sine ease
        const ease = 0.5 - 0.5 * Math.cos(progress * Math.PI);
        p.mesh.rotation.x = 1.35 - ease * (1.35 - p.targetRotX);
      }
    });

    // 3. Brahma Fade-in & Halo Rotation
    if (this.brahmaGroup) {
      // Starts fading in after Tier 2 opens (~8s)
      const brahmaProgress = Math.min(1.0, Math.max(0.0, (this.elapsedInScene - 8.0) / 4.0));
      this.brahmaGroup.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.opacity = brahmaProgress;
        }
      });
      // Soft divine levitation
      this.brahmaGroup.position.y = 4.45 + Math.sin(time * 0.5) * 0.05;
    }

    if (this.auraRing) {
      this.auraRing.rotation.z += delta * 0.4;
      this.auraRing.rotation.x = Math.sin(time * 0.6) * 0.1;
    }

    // 4. Upward Golden Energy Stream Update
    if (this.particlePositions && this.particleVelocities) {
      const count = this.particlePositions.length / 3;
      for (let i = 0; i < count; i++) {
        this.particlePositions[i * 3] += this.particleVelocities[i * 3] * delta;
        this.particlePositions[i * 3 + 1] += this.particleVelocities[i * 3 + 1] * delta;
        this.particlePositions[i * 3 + 2] += this.particleVelocities[i * 3 + 2] * delta;

        // Spiral outward gently as it ascends
        const angle = delta * 0.35;
        const x = this.particlePositions[i * 3];
        const z = this.particlePositions[i * 3 + 2] - (-4);
        this.particlePositions[i * 3] = x * Math.cos(angle) - z * Math.sin(angle);
        this.particlePositions[i * 3 + 2] = -4 + (x * Math.sin(angle) + z * Math.cos(angle));

        // Recycle if above height 22m
        if (this.particlePositions[i * 3 + 1] > 22.0) {
          this._resetParticle(i, false);
        }
      }
      this.particlePosAttr.needsUpdate = true;
    }
  }
}
