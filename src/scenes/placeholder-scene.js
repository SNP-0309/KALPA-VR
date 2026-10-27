/**
 * KALPA - Phase 1 Engine Verification Scene
 * Displays the glowing seed of Naad, a celestial rotating mandala ring,
 * and floating cosmic dust to verify PBR lighting, Bloom, and Camera motion.
 */

import * as THREE from 'three';
import { SceneBase } from './scene-base.js';

export class PlaceholderScene extends SceneBase {
  constructor(context) {
    super('placeholder_seed', context);
    this.particles = null;
    this.mandalaGroup = null;
  }

  async init() {
    // 1. Lighting setup (golden key, blue rim, gentle ambient)
    const ambientLight = new THREE.AmbientLight(0x0a0c1a, 1.2);
    this.group.add(ambientLight);

    const goldKeyLight = new THREE.DirectionalLight(0xffdf80, 2.8);
    goldKeyLight.position.set(5, 8, 4);
    goldKeyLight.castShadow = true;
    goldKeyLight.shadow.mapSize.width = 1024;
    goldKeyLight.shadow.mapSize.height = 1024;
    this.group.add(goldKeyLight);

    const blueRimLight = new THREE.PointLight(0x3a86ff, 4.5, 30);
    blueRimLight.position.set(-6, -2, -4);
    this.group.add(blueRimLight);

    // 2. Central Primordial Seed ("Naad")
    const seedGeom = new THREE.IcosahedronGeometry(1.2, 3);
    const seedMat = new THREE.MeshStandardMaterial({
      color: 0x0a1128,
      metalness: 0.85,
      roughness: 0.15,
      emissive: 0xd4af37,
      emissiveIntensity: 0.65
    });
    this.seedMesh = new THREE.Mesh(seedGeom, seedMat);
    this.seedMesh.castShadow = true;
    this.seedMesh.receiveShadow = true;
    this.group.add(this.seedMesh);

    // 3. Concentric Holographic Mandala Rings
    this.mandalaGroup = new THREE.Group();
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x4cc9f0,
      wireframe: true,
      transparent: true,
      opacity: 0.45
    });

    for (let r = 0; r < 4; r++) {
      const radius = 2.2 + r * 1.1;
      const ringGeom = new THREE.TorusGeometry(radius, 0.02, 8, 64);
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.rotation.x = Math.PI / 2 + r * 0.15;
      this.mandalaGroup.add(ringMesh);
    }
    this.group.add(this.mandalaGroup);

    // 4. Stardust Particles
    const particleCount = 1200;
    const posArray = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      posArray[i] = (Math.random() - 0.5) * 30;
      posArray[i + 1] = (Math.random() - 0.5) * 20;
      posArray[i + 2] = (Math.random() - 0.5) * 30;
    }
    const particleGeom = new THREE.BufferGeometry();
    particleGeom.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.08,
      color: 0xffe8a3,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });
    this.particles = new THREE.Points(particleGeom, particleMat);
    this.group.add(this.particles);

    await super.init();
  }

  update(time, delta) {
    if (this.seedMesh) {
      this.seedMesh.rotation.y += delta * 0.35;
      this.seedMesh.rotation.x += delta * 0.2;
      const pulse = 1.0 + Math.sin(time * 2.0) * 0.05;
      this.seedMesh.scale.set(pulse, pulse, pulse);
    }
    if (this.mandalaGroup) {
      this.mandalaGroup.children.forEach((ring, idx) => {
        ring.rotation.z += delta * (0.15 * (idx % 2 === 0 ? 1 : -1));
      });
    }
    if (this.particles) {
      this.particles.rotation.y += delta * 0.04;
    }
  }
}
