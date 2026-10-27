/**
 * KALPA - Chapter 0: The Void (Primordial Silence / Naad Seed)
 * The first vibration of sound (Om / Naad) in absolute cosmic stillness.
 * Golden pulsating icosahedron seed, concentric holographic mandala rings,
 * and delicate floating primordial stardust.
 */

import * as THREE from 'three';
import { SceneBase } from './scene-base.js';
import { CHAPTER_LOOKS } from '../config/looks.js';

export class VoidScene extends SceneBase {
  constructor(context) {
    super('void_seed', context);
    this.look = CHAPTER_LOOKS[0];
    this.seedMesh = null;
    this.mandalaGroup = null;
    this.particles = null;
  }

  async init() {
    // 1. Lighting setup (faint primordial gold, deep indigo rim)
    const ambientLight = new THREE.AmbientLight(this.look.ambientColor, this.look.ambientIntensity);
    this.group.add(ambientLight);

    const goldKeyLight = new THREE.DirectionalLight(this.look.keyColor, this.look.keyIntensity);
    goldKeyLight.position.set(5, 8, 4);
    this.group.add(goldKeyLight);

    const rimLight = new THREE.PointLight(this.look.rimColor, this.look.rimIntensity, 30);
    rimLight.position.set(-6, -2, -4);
    this.group.add(rimLight);

    // 2. Central Primordial Seed ("Naad")
    const seedGeom = new THREE.IcosahedronGeometry(1.2, 3);
    const seedMat = new THREE.MeshStandardMaterial({
      color: 0x0a1128,
      metalness: 0.85,
      roughness: 0.15,
      emissive: new THREE.Color(this.look.keyColor),
      emissiveIntensity: 0.75
    });
    this.seedMesh = new THREE.Mesh(seedGeom, seedMat);
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

    // 4. Primordial Stardust
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

  enter() {
    super.enter();
    if (this.context.cameraRig) {
      this.context.cameraRig.moveTo(
        new THREE.Vector3(0, 1.5, 12),
        new THREE.Vector3(0, 0, 0),
        0.008
      );
    }
  }

  update(time, delta) {
    if (this.seedMesh) {
      this.seedMesh.rotation.y += delta * 0.35;
      this.seedMesh.rotation.x += delta * 0.2;
      const pulse = 1.0 + Math.sin(time * 2.0) * 0.06;
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
