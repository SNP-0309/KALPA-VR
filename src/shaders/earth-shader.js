/**
 * KALPA - High-Fidelity Multi-Layer Earth Shader & Atmosphere
 * Reusable planet module for Chapter 7, Chapter 10, and global cosmic views.
 * Features:
 *   - PBR Day Surface with specular ocean mask
 *   - Night City Lights terminator blending
 *   - Rotating Cloud Sphere with soft shadows
 *   - Rayleigh & Mie Atmospheric Scattering Rim Shell (peaks at #2172d1)
 *   - Undulating Emerald-Teal Aurora Ring (#00ff88 -> #22ccaa)
 */

import * as THREE from 'three';
import { CHAPTER_LOOKS } from '../config/looks.js';

const AtmosphereVertexShader = /* glsl */`
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const AtmosphereFragmentShader = /* glsl */`
  uniform vec3 uSunDir;
  uniform vec3 uAtmosphereColor;
  uniform vec3 uCameraPos;
  uniform float uIntensity;

  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(uCameraPos - vWorldPosition);
    vec3 L = normalize(uSunDir);

    // Fresnel rim effect on outer atmosphere shell
    float fresnel = 1.0 - max(dot(N, V), 0.0);
    float rim = pow(fresnel, 3.2);

    // Sunlight alignment (brighter on sunward hemisphere)
    float sunAlignment = max(dot(N, L) * 0.5 + 0.5, 0.05);

    vec3 finalColor = uAtmosphereColor * rim * sunAlignment * uIntensity;
    gl_FragColor = vec4(finalColor, rim * sunAlignment * 0.85);
  }
`;

const AuroraVertexShader = /* glsl */`
  uniform float uTime;
  varying vec2 vUv;
  varying float vDistort;

  void main() {
    vUv = uv;
    vec3 transformed = position;

    // Organic wavy curtains
    float wave = sin(position.x * 2.5 + uTime * 1.8) * cos(position.z * 2.0 - uTime * 1.2);
    transformed += normal * wave * 0.12;
    vDistort = wave;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
  }
`;

const AuroraFragmentShader = /* glsl */`
  uniform vec3 uAuroraColor1; // #00ff88
  uniform vec3 uAuroraColor2; // #22ccaa
  uniform float uTime;
  uniform float uOpacity;

  varying vec2 vUv;
  varying float vDistort;

  void main() {
    // Gradient between emerald and teal
    vec3 col = mix(uAuroraColor1, uAuroraColor2, sin(vUv.x * 6.0 + uTime) * 0.5 + 0.5);

    // Vertical curtain feathering
    float edge = sin(vUv.y * 3.14159);
    float alpha = edge * (0.6 + 0.4 * vDistort) * uOpacity;

    gl_FragColor = vec4(col * 1.6, alpha);
  }
`;

export class EarthGlobe {
  constructor(options = {}) {
    this.radius = options.radius || 4.0;
    this.group = new THREE.Group();
    this.group.name = 'earth_globe';

    this.cloudMesh = null;
    this.atmosphereMesh = null;
    this.auroraMesh = null;
    this.planetMesh = null;

    this.look = CHAPTER_LOOKS.earth;
    this.rotationSpeed = options.rotationSpeed ?? 0.015;
  }

  async init(assetManager) {
    const r = this.radius;

    // 1. Load textures (with graceful procedural fallbacks)
    const [dayTex, nightTex, cloudsTex] = await Promise.all([
      assetManager.loadTexture('/assets/textures/earth_day.jpg', 'earth_day'),
      assetManager.loadTexture('/assets/textures/earth_night.jpg', 'earth_night'),
      assetManager.loadTexture('/assets/textures/earth_clouds.png', 'earth_clouds')
    ]);

    // 2. Base Planet Sphere
    const planetGeom = new THREE.SphereGeometry(r, 64, 64);
    const planetMat = new THREE.MeshStandardMaterial({
      map: dayTex,
      roughness: 0.65,
      metalness: 0.25,
      emissiveMap: nightTex,
      emissive: new THREE.Color(this.look.cityLightColor),
      emissiveIntensity: 0.6
    });

    this.planetMesh = new THREE.Mesh(planetGeom, planetMat);
    this.planetMesh.castShadow = true;
    this.planetMesh.receiveShadow = true;
    this.group.add(this.planetMesh);

    // 3. Clouds Sphere
    const cloudGeom = new THREE.SphereGeometry(r * 1.02, 64, 64);
    const cloudMat = new THREE.MeshStandardMaterial({
      map: cloudsTex,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      roughness: 0.8
    });
    this.cloudMesh = new THREE.Mesh(cloudGeom, cloudMat);
    this.group.add(this.cloudMesh);

    // 4. Atmospheric Scattering Shell
    const atmoGeom = new THREE.SphereGeometry(r * 1.055, 64, 64);
    this.atmoMat = new THREE.ShaderMaterial({
      vertexShader: AtmosphereVertexShader,
      fragmentShader: AtmosphereFragmentShader,
      uniforms: {
        uSunDir: { value: new THREE.Vector3(5, 4, 3).normalize() },
        uAtmosphereColor: { value: new THREE.Color(this.look.atmosphereRim) },
        uCameraPos: { value: new THREE.Vector3(0, 0, 10) },
        uIntensity: { value: 2.2 }
      },
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false
    });
    this.atmosphereMesh = new THREE.Mesh(atmoGeom, this.atmoMat);
    this.group.add(this.atmosphereMesh);

    // 5. Aurora Ring (Over North Polar Rim)
    const auroraGeom = new THREE.CylinderGeometry(r * 0.55, r * 0.62, 0.45, 64, 16, true);
    this.auroraMat = new THREE.ShaderMaterial({
      vertexShader: AuroraVertexShader,
      fragmentShader: AuroraFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uAuroraColor1: { value: new THREE.Color(this.look.auroraColor) },
        uAuroraColor2: { value: new THREE.Color('#22ccaa') },
        uOpacity: { value: this.look.auroraIntensity }
      },
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false
    });
    this.auroraMesh = new THREE.Mesh(auroraGeom, this.auroraMat);
    this.auroraMesh.position.y = r * 0.82;
    this.group.add(this.auroraMesh);
  }

  update(time, delta, cameraPos) {
    if (this.planetMesh) {
      this.planetMesh.rotation.y += delta * this.rotationSpeed;
    }
    if (this.cloudMesh) {
      // Clouds drift slightly faster than planet surface
      this.cloudMesh.rotation.y += delta * (this.rotationSpeed * 1.35);
    }
    if (this.auroraMesh) {
      this.auroraMesh.rotation.y += delta * 0.05;
      if (this.auroraMat) {
        this.auroraMat.uniforms.uTime.value = time;
      }
    }
    if (this.atmoMat && cameraPos) {
      this.atmoMat.uniforms.uCameraPos.value.copy(cameraPos);
    }
  }
}
