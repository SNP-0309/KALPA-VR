/**
 * Genesis WebXR - Asset Configuration
 * Central registry for asset paths, model normalization rules, and transform overrides.
 * Visitors can tweak positions, scales, and rotations directly here.
 */

export const ASSET_PATHS = {
  hdri: {
    deep_space: '/assets/hdri/deep_space.hdr',
    nebula: '/assets/hdri/nebula.hdr'
  },
  textures: {
    earth_day: '/assets/textures/earth_day.jpg',
    earth_night: '/assets/textures/earth_night.jpg',
    earth_clouds: '/assets/textures/earth_clouds.png',
    earth_normal: '/assets/textures/earth_normal.jpg',
    earth_specular: '/assets/textures/earth_specular.jpg',
    moon: '/assets/textures/moon.jpg',
    sun: '/assets/textures/sun.jpg',
    lava_albedo: '/assets/textures/lava_albedo.jpg',
    lava_normal: '/assets/textures/lava_normal.jpg',
    lava_roughness: '/assets/textures/lava_roughness.jpg',
    water_normal: '/assets/textures/water_normal.jpg',
    nebula_dust: '/assets/textures/nebula_dust.png'
  },
  models: {
    vishnu_shesha: '/assets/models/vishnu_shesha.glb',
    lotus: '/assets/models/lotus.glb',
    brahma: '/assets/models/brahma.glb',
    planet_earth: '/assets/models/planet_earth.glb',
    theia_impactor: '/assets/models/theia_impactor.glb',
    avatars: {
      matsya: '/assets/models/avatars/matsya.glb',
      kurma: '/assets/models/avatars/kurma.glb',
      varaha: '/assets/models/avatars/varaha.glb',
      narasimha: '/assets/models/avatars/narasimha.glb',
      vamana: '/assets/models/avatars/vamana.glb',
      parashurama: '/assets/models/avatars/parashurama.glb',
      rama: '/assets/models/avatars/rama.glb',
      krishna: '/assets/models/avatars/krishna.glb',
      kalki: '/assets/models/avatars/kalki.glb'
    }
  },
  audio: {
    om_drone: '/assets/audio/om_drone.mp3',
    ambient_space: '/assets/audio/ambient_space.mp3',
    ocean: '/assets/audio/ocean.mp3',
    thunder: '/assets/audio/thunder.mp3',
    impact: '/assets/audio/impact.mp3',
    shankh: '/assets/audio/shankh.mp3'
  }
};

/**
 * Per-model transform overrides and bounding normalization rules.
 * targetSize: bounding sphere radius to normalize models to before applying user scale.
 */
export const MODEL_TRANSFORMS = {
  vishnu_shesha: {
    targetSize: 8.0,
    position: [0, 0, -5],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    centerPivot: true
  },
  lotus: {
    targetSize: 2.5,
    position: [0, 1.2, -5],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    centerPivot: true
  },
  brahma: {
    targetSize: 2.0,
    position: [0, 2.8, -5],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    centerPivot: true
  },
  planet_earth: {
    targetSize: 4.0,
    position: [0, 0, 0],
    rotation: [0, 0, 0.41], // 23.5 degrees axial tilt
    scale: [1, 1, 1],
    centerPivot: true
  },
  theia_impactor: {
    targetSize: 1.8,
    position: [-15, 8, -6],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    centerPivot: true
  },
  avatars: {
    matsya: { targetSize: 2.0, position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1], centerPivot: true },
    kurma: { targetSize: 2.0, position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1], centerPivot: true },
    varaha: { targetSize: 2.0, position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1], centerPivot: true },
    narasimha: { targetSize: 2.0, position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1], centerPivot: true },
    vamana: { targetSize: 2.0, position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1], centerPivot: true },
    parashurama: { targetSize: 2.0, position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1], centerPivot: true },
    rama: { targetSize: 2.0, position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1], centerPivot: true },
    krishna: { targetSize: 2.0, position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1], centerPivot: true },
    kalki: { targetSize: 2.2, position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1], centerPivot: true }
  }
};
