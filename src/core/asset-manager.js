/**
 * KALPA - Central Asset Manager
 * Handles DRACO, GLTF, KTX2, HDR, Textures, and Audio with caching,
 * auto-normalization, and graceful procedural fallbacks for missing assets.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { ASSET_PATHS, MODEL_TRANSFORMS } from '../config/assets.js';

export class AssetManager {
  constructor(renderer) {
    this.renderer = renderer;
    this.cache = new Map();
    this.loadingCount = 0;
    this.loadedCount = 0;
    this.onProgressCallbacks = [];
    this.onCompleteCallbacks = [];

    // Setup DRACO
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');

    // Setup KTX2
    this.ktx2Loader = new KTX2Loader();
    this.ktx2Loader.setTranscoderPath('https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/libs/basis/');
    if (renderer) {
      this.ktx2Loader.detectSupport(renderer);
    }

    // Setup GLTF
    this.gltfLoader = new GLTFLoader();
    this.gltfLoader.setDRACOLoader(this.dracoLoader);
    this.gltfLoader.setKTX2Loader(this.ktx2Loader);

    // Setup RGBE & Texture & Audio loaders
    this.rgbeLoader = new RGBELoader();
    this.textureLoader = new THREE.TextureLoader();
    this.audioLoader = new THREE.AudioLoader();
  }

  onProgress(cb) {
    this.onProgressCallbacks.push(cb);
  }

  onComplete(cb) {
    this.onCompleteCallbacks.push(cb);
  }

  _notifyProgress(itemUrl) {
    const progress = this.loadingCount > 0 ? (this.loadedCount / this.loadingCount) : 1;
    this.onProgressCallbacks.forEach(cb => cb(progress, itemUrl));
    if (this.loadedCount >= this.loadingCount && this.loadingCount > 0) {
      this.onCompleteCallbacks.forEach(cb => cb());
    }
  }

  /**
   * Load HDR environment or return procedural starry skybox
   */
  async loadHDR(url) {
    if (this.cache.has(url)) return this.cache.get(url);
    this.loadingCount++;

    return new Promise((resolve) => {
      this.rgbeLoader.load(
        url,
        (texture) => {
          texture.mapping = THREE.EquirectangularReflectionMapping;
          this.cache.set(url, texture);
          this.loadedCount++;
          this._notifyProgress(url);
          resolve(texture);
        },
        undefined,
        () => {
          // Fallback to procedural celestial HDRI
          console.warn(`[AssetManager] HDR not found at ${url}. Generating procedural cosmic skybox fallback.`);
          const fallbackTex = this.createProceduralCosmicEnv();
          this.cache.set(url, fallbackTex);
          this.loadedCount++;
          this._notifyProgress(url);
          resolve(fallbackTex);
        }
      );
    });
  }

  /**
   * Load Texture with procedural fallback
   */
  async loadTexture(url, fallbackType = 'generic') {
    if (this.cache.has(url)) return this.cache.get(url);
    this.loadingCount++;

    return new Promise((resolve) => {
      this.textureLoader.load(
        url,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          this.cache.set(url, texture);
          this.loadedCount++;
          this._notifyProgress(url);
          resolve(texture);
        },
        undefined,
        () => {
          console.warn(`[AssetManager] Texture not found at ${url}. Generating procedural fallback (${fallbackType}).`);
          const fallbackTex = this.createProceduralTexture(fallbackType);
          this.cache.set(url, fallbackTex);
          this.loadedCount++;
          this._notifyProgress(url);
          resolve(fallbackTex);
        }
      );
    });
  }

  /**
   * Load GLTF model, normalize pivot/scale, or return procedural stand-in
   */
  async loadModel(url, modelKey = 'generic') {
    if (this.cache.has(url)) {
      const cached = this.cache.get(url);
      return cached.clone(true);
    }
    this.loadingCount++;

    return new Promise((resolve) => {
      this.gltfLoader.load(
        url,
        (gltf) => {
          const model = gltf.scene || gltf.scenes[0];
          this.normalizeModel(model, modelKey);
          this.cache.set(url, model);
          this.loadedCount++;
          this._notifyProgress(url);
          resolve(model.clone(true));
        },
        undefined,
        () => {
          console.warn(`[AssetManager] Model not found at ${url}. Generating procedural stand-in for "${modelKey}".`);
          const fallbackModel = this.createProceduralModel(modelKey);
          this.normalizeModel(fallbackModel, modelKey);
          this.cache.set(url, fallbackModel);
          this.loadedCount++;
          this._notifyProgress(url);
          resolve(fallbackModel.clone(true));
        }
      );
    });
  }

  /**
   * Load Audio buffer with silence/fallback generator
   */
  async loadAudio(url) {
    if (this.cache.has(url)) return this.cache.get(url);
    this.loadingCount++;

    return new Promise((resolve) => {
      this.audioLoader.load(
        url,
        (buffer) => {
          this.cache.set(url, buffer);
          this.loadedCount++;
          this._notifyProgress(url);
          resolve(buffer);
        },
        undefined,
        () => {
          console.warn(`[AssetManager] Audio not found at ${url}. Procedural synthesizer will handle audio.`);
          this.cache.set(url, null);
          this.loadedCount++;
          this._notifyProgress(url);
          resolve(null);
        }
      );
    });
  }

  /**
   * Normalize model scale and pivot using MODEL_TRANSFORMS
   */
  normalizeModel(object, key) {
    let config = MODEL_TRANSFORMS[key];
    if (!config && key.startsWith('avatar_')) {
      const avatarName = key.replace('avatar_', '');
      config = MODEL_TRANSFORMS.avatars?.[avatarName];
    }
    config = config || { targetSize: 2.0, position: [0, 0, 0], scale: [1, 1, 1] };

    // Enable shadows on all child meshes
    object.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // Compute bounding box
    const box = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0.0001) {
      const targetSize = config.targetSize || 2.0;
      const autoScale = targetSize / maxDim;
      object.scale.set(
        autoScale * (config.scale?.[0] ?? 1),
        autoScale * (config.scale?.[1] ?? 1),
        autoScale * (config.scale?.[2] ?? 1)
      );

      if (config.centerPivot !== false) {
        // Re-center pivot
        object.position.x = -center.x * autoScale;
        object.position.y = -center.y * autoScale;
        object.position.z = -center.z * autoScale;

        // Wrap inside a parent container for absolute placement
        const wrapper = new THREE.Group();
        wrapper.add(object);
        wrapper.position.set(
          config.position?.[0] ?? 0,
          config.position?.[1] ?? 0,
          config.position?.[2] ?? 0
        );
        if (config.rotation) {
          wrapper.rotation.set(...config.rotation);
        }
        return wrapper;
      }
    }

    if (config.position) object.position.set(...config.position);
    if (config.rotation) object.rotation.set(...config.rotation);
    return object;
  }

  /**
   * PROCEDURAL FALLBACK GENERATORS
   */
  createProceduralCosmicEnv() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Deep cosmic space gradient
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#030209');
    grad.addColorStop(0.3, '#08061a');
    grad.addColorStop(0.5, '#0b0826');
    grad.addColorStop(0.8, '#060312');
    grad.addColorStop(1, '#020106');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Nebula dust wisps
    for (let i = 0; i < 8; i++) {
      const nx = Math.random() * canvas.width;
      const ny = Math.random() * canvas.height;
      const rad = 250 + Math.random() * 350;
      const radGrad = ctx.createRadialGradient(nx, ny, 10, nx, ny, rad);
      const hues = [
        'rgba(40, 20, 110, 0.28)',
        'rgba(212, 175, 55, 0.15)',
        'rgba(14, 95, 170, 0.22)',
        'rgba(120, 30, 80, 0.2)'
      ];
      radGrad.addColorStop(0, hues[i % hues.length]);
      radGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(nx, ny, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // Stars
    for (let i = 0; i < 1500; i++) {
      const sx = Math.random() * canvas.width;
      const sy = Math.random() * canvas.height;
      const r = Math.random() * 1.5;
      const alpha = 0.4 + Math.random() * 0.6;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.needsUpdate = true;
    return texture;
  }

  createProceduralTexture(type) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    if (type === 'earth_day') {
      ctx.fillStyle = '#081e3f'; // ocean
      ctx.fillRect(0, 0, 512, 512);
      // Continents
      ctx.fillStyle = '#2d6a4f';
      for (let i = 0; i < 16; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * 512, Math.random() * 512, 40 + Math.random() * 70, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (type === 'earth_night') {
      ctx.fillStyle = '#020308';
      ctx.fillRect(0, 0, 512, 512);
      ctx.fillStyle = 'rgba(255, 220, 120, 0.7)';
      for (let i = 0; i < 600; i++) {
        ctx.fillRect(Math.random() * 512, Math.random() * 512, 1 + Math.random(), 1 + Math.random());
      }
    } else if (type === 'earth_clouds') {
      ctx.fillStyle = 'rgba(0,0,0,0)';
      ctx.fillRect(0, 0, 512, 512);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      for (let i = 0; i < 40; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * 512, Math.random() * 512, 25 + Math.random() * 50, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (type === 'lava_albedo') {
      ctx.fillStyle = '#110c0b';
      ctx.fillRect(0, 0, 512, 512);
      // Glowing fissures
      ctx.strokeStyle = '#ff4500';
      ctx.lineWidth = 3;
      for (let i = 0; i < 30; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * 512, Math.random() * 512);
        ctx.lineTo(Math.random() * 512, Math.random() * 512);
        ctx.stroke();
      }
    } else if (type === 'water_normal') {
      // Normal map blue-purple
      ctx.fillStyle = 'rgb(128, 128, 255)';
      ctx.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 150; i++) {
        const val = 120 + Math.floor(Math.random() * 20);
        ctx.fillStyle = `rgb(${val}, ${val}, 255)`;
        ctx.beginPath();
        ctx.arc(Math.random() * 512, Math.random() * 512, 10 + Math.random() * 20, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = '#2a2a38';
      ctx.fillRect(0, 0, 512, 512);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  createProceduralModel(key) {
    const group = new THREE.Group();
    group.name = `procedural_${key}`;

    if (key === 'vishnu_shesha') {
      // Procedural Shesha: multi-headed golden serpent canopy and coils
      const serpentMat = new THREE.MeshStandardMaterial({
        color: 0x142036,
        roughness: 0.35,
        metalness: 0.7,
        emissive: 0x051025
      });
      const goldMat = new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        roughness: 0.25,
        metalness: 0.85,
        emissive: 0x3d2b07
      });

      // Coils
      for (let i = 0; i < 5; i++) {
        const coil = new THREE.Mesh(
          new THREE.TorusGeometry(2.5 - i * 0.35, 0.45, 16, 48),
          serpentMat
        );
        coil.rotation.x = Math.PI / 2;
        coil.position.y = i * 0.35;
        group.add(coil);
      }

      // Reclining Vishnu figure (stylized divine geometric silhouette)
      const vishnu = new THREE.Group();
      // Body
      const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 1.8, 16), goldMat);
      torso.rotation.z = Math.PI / 2.3;
      torso.position.set(0, 1.8, 0);
      vishnu.add(torso);
      // Halo / Crown
      const crown = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.9, 16), goldMat);
      crown.position.set(1.1, 2.3, 0);
      crown.rotation.z = -Math.PI / 6;
      vishnu.add(crown);
      group.add(vishnu);

      // Hooded canopy (7 serpent hoods)
      for (let h = -3; h <= 3; h++) {
        const hood = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16), goldMat);
        hood.scale.set(1, 1.8, 0.3);
        hood.position.set(1.6 + Math.abs(h) * 0.1, 2.8 + (3 - Math.abs(h)) * 0.25, h * 0.55);
        hood.rotation.y = h * 0.18;
        hood.rotation.z = -0.3;
        group.add(hood);
      }
    } else if (key === 'lotus') {
      const petalMat = new THREE.MeshStandardMaterial({
        color: 0xffb7c5,
        roughness: 0.3,
        emissive: 0x551122
      });
      const coreMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        roughness: 0.2,
        emissive: 0x665500
      });
      // Pistil
      group.add(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.3, 0.4, 16), coreMat));
      // Petals
      for (let tier = 0; tier < 3; tier++) {
        const count = 8 + tier * 4;
        for (let p = 0; p < count; p++) {
          const angle = (p / count) * Math.PI * 2 + tier * 0.3;
          const petal = new THREE.Mesh(new THREE.ConeGeometry(0.25, 1.0, 8), petalMat);
          petal.scale.set(1, 1, 0.2);
          petal.position.set(Math.cos(angle) * (0.6 + tier * 0.35), tier * 0.15, Math.sin(angle) * (0.6 + tier * 0.35));
          petal.rotation.y = -angle;
          petal.rotation.x = Math.PI / 4 + tier * 0.18;
          group.add(petal);
        }
      }
    } else if (key === 'brahma') {
      const brahmaMat = new THREE.MeshStandardMaterial({
        color: 0xffe0a0,
        roughness: 0.3,
        metalness: 0.5,
        emissive: 0x442200
      });
      // Seated form with 4 faces/crown
      const body = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.4, 12), brahmaMat);
      body.position.y = 0.7;
      group.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16), brahmaMat);
      head.position.y = 1.7;
      group.add(head);
      const aura = new THREE.Mesh(
        new THREE.TorusGeometry(0.7, 0.05, 16, 32),
        new THREE.MeshBasicMaterial({ color: 0xfff2a0 })
      );
      aura.position.y = 1.7;
      group.add(aura);
    } else {
      // Generic celestial totem for planet/avatar stand-ins
      const geom = new THREE.DodecahedronGeometry(1.0, 1);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x4cc9f0,
        metalness: 0.8,
        roughness: 0.2,
        emissive: 0x082b4a
      });
      group.add(new THREE.Mesh(geom, mat));
    }

    return group;
  }
}
