/**
 * KALPA - Cosmic Ocean Water Shader (Three.js Custom ShaderMaterial)
 * Multi-octave wave displacement, analytical normals, Fresnel reflection,
 * Blinn-Phong specular shimmer, and crest foam highlights.
 */

import * as THREE from 'three';

const WaterVertexShader = /* glsl */`
  uniform float uTime;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying float vWaveHeight;

  // Wave function with 3 octaves
  float calculateWave(vec2 pos, float time) {
    float wave = 0.0;
    // Primary swell
    wave += sin(pos.x * 0.05 + time * 0.6) * cos(pos.y * 0.05 + time * 0.45) * 0.55;
    // Secondary cross-chop
    wave += sin(pos.x * 0.12 - time * 0.9 + pos.y * 0.08) * 0.22;
    // High-frequency ripple
    wave += sin((pos.x + pos.y) * 0.25 + time * 1.5) * 0.08;
    return wave;
  }

  void main() {
    vUv = uv;
    vec3 transformed = position;

    // Displacement
    float h = calculateWave(transformed.xy, uTime);
    transformed.z += h;
    vWaveHeight = h;

    // Analytical normal calculation via finite differences
    float eps = 0.1;
    float hx = calculateWave(transformed.xy + vec2(eps, 0.0), uTime);
    float hy = calculateWave(transformed.xy + vec2(0.0, eps), uTime);
    vec3 calculatedNormal = normalize(vec3(-(hx - h) / eps, -(hy - h) / eps, 1.0));

    // World transform
    vec4 worldPos = modelMatrix * vec4(transformed, 1.0);
    vWorldPosition = worldPos.xyz;
    vNormal = normalize(mat3(modelMatrix) * calculatedNormal);

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const WaterFragmentShader = /* glsl */`
  uniform vec3 uWaterColor;
  uniform vec3 uWaterSpecular;
  uniform vec3 uWaterFoamColor;
  uniform vec3 uSunDir;
  uniform vec3 uCameraPos;
  uniform float uOpacity;
  uniform float uTime;

  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying float vWaveHeight;

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(uCameraPos - vWorldPosition);
    vec3 L = normalize(uSunDir);
    vec3 H = normalize(L + V);

    // Fresnel reflection term
    float NdotV = max(dot(N, V), 0.0);
    float fresnel = pow(1.0 - NdotV, 3.5);

    // Base deep cosmic blue blended with grazing specular sky tone
    vec3 baseColor = mix(uWaterColor, uWaterSpecular * 0.45, fresnel);

    // Specular highlight (Blinn-Phong)
    float NdotH = max(dot(N, H), 0.0);
    float spec = pow(NdotH, 180.0) * 1.8;
    vec3 specularColor = uWaterSpecular * spec;

    // Wave crest foam
    float foamFactor = smoothstep(0.42, 0.65, vWaveHeight);
    // Add micro-noise variation to foam
    float foamNoise = sin(vWorldPosition.x * 2.0 + uTime * 2.0) * cos(vWorldPosition.z * 2.0 - uTime * 1.5);
    foamFactor *= clamp(0.7 + 0.3 * foamNoise, 0.0, 1.0);

    vec3 finalColor = mix(baseColor + specularColor, uWaterFoamColor, foamFactor * 0.65);

    // Soft distance haze
    float dist = length(uCameraPos - vWorldPosition);
    float distFade = clamp(1.0 - (dist / 380.0), 0.0, 1.0);

    gl_FragColor = vec4(finalColor, uOpacity * (0.88 + fresnel * 0.12) * distFade);
  }
`;

export function createWaterMaterial(options = {}) {
  const uniforms = {
    uTime: { value: 0 },
    uWaterColor: { value: new THREE.Color(options.waterColor || '#03122a') },
    uWaterSpecular: { value: new THREE.Color(options.waterSpecular || '#6ab0ff') },
    uWaterFoamColor: { value: new THREE.Color(options.waterFoamColor || '#c8daf5') },
    uSunDir: { value: options.sunDir || new THREE.Vector3(5, 8, 4).normalize() },
    uCameraPos: { value: new THREE.Vector3(0, 4, 12) },
    uOpacity: { value: options.opacity ?? 1.0 }
  };

  const mat = new THREE.ShaderMaterial({
    vertexShader: WaterVertexShader,
    fragmentShader: WaterFragmentShader,
    uniforms: uniforms,
    transparent: true,
    depthWrite: true,
    side: THREE.DoubleSide
  });

  return mat;
}
