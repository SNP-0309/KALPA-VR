/**
 * KALPA - Cinematic Camera Rig
 * Smooth easing interpolation, keyframed paths, subtle handheld micro-motion,
 * OrbitControls interaction fallback, and VR comfort mode integration.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class CameraRig {
  constructor(domElement) {
    this.domElement = domElement;

    // Cinematic perspective camera
    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
    this.camera.position.set(0, 2, 10);

    // Camera Rig parent (for handheld micro-motion & XR origin)
    this.rigGroup = new THREE.Group();
    this.rigGroup.add(this.camera);

    // Controls fallback
    this.controls = new OrbitControls(this.camera, domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxDistance = 250;
    this.controls.minDistance = 0.5;
    this.controls.autoRotate = false;

    // Target tracking & interpolation
    this.targetPosition = new THREE.Vector3(0, 2, 10);
    this.targetLookAt = new THREE.Vector3(0, 0, 0);
    this.currentLookAt = new THREE.Vector3(0, 0, 0);
    this.lerpSpeed = 0.025; // Slow, massive easing

    // Cinematic handheld micro-motion parameters
    this.handheldEnabled = true;
    this.comfortMode = false; // VR comfort mode disables shake/wobble
    this.microMotionTime = 0;

    window.addEventListener('resize', this.onResize.bind(this));
  }

  setComfortMode(enabled) {
    this.comfortMode = enabled;
  }

  setLetterbox(enabled) {
    document.body.classList.toggle('cinematic-letterbox', enabled);
  }

  moveTo(pos, lookAt, speed = 0.02) {
    this.targetPosition.copy(pos);
    if (lookAt) {
      this.targetLookAt.copy(lookAt);
    }
    this.lerpSpeed = speed;
  }

  setPathKeyframe(chapterId) {
    // Default cinematic stances for each chapter
    const keyframes = {
      0: { pos: new THREE.Vector3(0, 1.5, 12), look: new THREE.Vector3(0, 0, 0) },
      1: { pos: new THREE.Vector3(0, 2.2, 8), look: new THREE.Vector3(0, 1, 0) },
      2: { pos: new THREE.Vector3(0, 3.5, 6.5), look: new THREE.Vector3(0, 2, 0) },
      3: { pos: new THREE.Vector3(0, 8, 16), look: new THREE.Vector3(0, 0, 0) },
      4: { pos: new THREE.Vector3(5, 4, 12), look: new THREE.Vector3(0, 0, 0) },
      5: { pos: new THREE.Vector3(0, 5, 14), look: new THREE.Vector3(0, 0, 0) },
      6: { pos: new THREE.Vector3(0, 2, 8), look: new THREE.Vector3(0, 0, 0) },
      7: { pos: new THREE.Vector3(0, 3, 9), look: new THREE.Vector3(0, 0, 0) },
      8: { pos: new THREE.Vector3(0, 0.5, 2.2), look: new THREE.Vector3(0, 0, 0) },
      9: { pos: new THREE.Vector3(0, 4, 13), look: new THREE.Vector3(0, 0, 0) },
      10: { pos: new THREE.Vector3(0, 10, 22), look: new THREE.Vector3(0, 0, 0) },
      11: { pos: new THREE.Vector3(0, 5, 18), look: new THREE.Vector3(0, 0, 0) }
    };

    const kf = keyframes[chapterId] || keyframes[0];
    this.moveTo(kf.pos, kf.look, 0.02);
  }

  update(deltaTime) {
    // If user is actively dragging OrbitControls, let controls manage camera
    if (this.controls.state !== -1) {
      this.controls.update();
      return;
    }

    // Smooth massive cinematic interpolation towards target position
    this.camera.position.lerp(this.targetPosition, this.lerpSpeed);
    this.currentLookAt.lerp(this.targetLookAt, this.lerpSpeed);
    this.controls.target.copy(this.currentLookAt);

    // Apply subtle handheld micro-motion if not in comfort mode
    if (this.handheldEnabled && !this.comfortMode) {
      this.microMotionTime += deltaTime * 0.45;
      const wobbleX = Math.sin(this.microMotionTime * 0.8) * 0.04 + Math.cos(this.microMotionTime * 1.5) * 0.02;
      const wobbleY = Math.cos(this.microMotionTime * 0.6) * 0.03 + Math.sin(this.microMotionTime * 1.1) * 0.02;
      this.camera.position.x += wobbleX * 0.05;
      this.camera.position.y += wobbleY * 0.05;
    }

    this.controls.update();
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }
}
