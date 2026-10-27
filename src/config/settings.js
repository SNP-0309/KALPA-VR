/**
 * KALPA: The Journey of Creation - Engine Settings & Presets
 */

export const QUALITY_PRESETS = {
  low: {
    name: 'Low',
    pixelRatio: 1.0,
    shadows: false,
    shadowMapSize: 512,
    postProcessing: false,
    bloom: false,
    dof: false,
    particlesFactor: 0.25,
    antialias: false
  },
  medium: {
    name: 'Medium',
    pixelRatio: Math.min(window.devicePixelRatio || 1, 1.5),
    shadows: true,
    shadowMapSize: 1024,
    postProcessing: true,
    bloom: true,
    dof: false,
    particlesFactor: 0.6,
    antialias: true
  },
  high: {
    name: 'High',
    pixelRatio: Math.min(window.devicePixelRatio || 1, 2.0),
    shadows: true,
    shadowMapSize: 2048,
    postProcessing: true,
    bloom: true,
    dof: true,
    particlesFactor: 1.0,
    antialias: true
  }
};

export const CHAPTER_METADATA = [
  { id: 0, key: 'entry', title: 'The Void', subtitle: 'Primordial Silence', duration: 15 },
  { id: 1, key: 'ocean', title: 'Cosmic Ocean', subtitle: 'Ananta Shesha & Vishnu', duration: 60 },
  { id: 2, key: 'lotus', title: 'The Lotus Blooms', subtitle: 'Brahma & First Light', duration: 55 },
  { id: 3, key: 'nebula', title: 'Solar Nebula', subtitle: 'Accretion Disk & Protostar', duration: 65 },
  { id: 4, key: 'accretion', title: 'Planetary Accretion', subtitle: 'Collisions & Proto-Earth', duration: 55 },
  { id: 5, key: 'theia', title: 'Theia Impact', subtitle: 'Moon-Forming Cataclysm', duration: 60 },
  { id: 6, key: 'magma', title: 'Magma Ocean', subtitle: 'Hadean Eon & Crust Formation', duration: 55 },
  { id: 7, key: 'churning', title: 'Oceans Arrive & Manthan', subtitle: 'Atmospheric Deluge & Samudra Manthan', duration: 75 },
  { id: 8, key: 'life', title: 'First Life', subtitle: 'Microbial Spark & Genesis Cell', duration: 55 },
  { id: 9, key: 'dashavatara', title: 'Dashavatara Timeline', subtitle: 'The 10 Avatars & Evolution', duration: 90 },
  { id: 10, key: 'yuga', title: 'Cycle of Yugas', subtitle: 'Kalpa & The Cosmic Clock', duration: 60 },
  { id: 11, key: 'pralaya', title: 'Pralaya & Renewal', subtitle: 'The Great Dissolution', duration: 50 }
];

export const AUDIO_CONFIG = {
  masterVolume: 0.85,
  narrationVolume: 1.0,
  ambientVolume: 0.5,
  sfxVolume: 0.7,
  duckingLevel: 0.22, // ambient ducked level during voice
  duckingAttack: 0.35,
  duckingRelease: 1.2
};
