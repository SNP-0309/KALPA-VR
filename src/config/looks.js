/**
 * KALPA – Per-Chapter Visual Look Configuration
 *
 * All values are derived directly from the Pixabay reference clips
 * captured on 2026-10-28 (see /public/reference/stills/).
 *
 * Colour notation: hex CSS values read from reference screenshots.
 * Bloom intensity: 0.0 (none) → 3.0 (maximum).
 * Exposure: ACESFilmic tone-map exposure multiplier (1.0 = neutral).
 * Fog density: 0.0 (vacuum) → 0.08 (heavy storm).
 * Camera easing: lerp speed per frame (0.008 = very slow cinematic, 0.05 = brisk).
 * Particle factor: fraction of the maximum particle budget (0.0 – 1.0).
 *
 * Reference image:
 *   ch1/2   ← pix_space_earth (blue-lit close orbit, swirl clouds)
 *   ch3     ← pix_milkyway (sun flare, dusty galactic plane)
 *   ch3/4   ← pix_earth_moon (milky-way dust lane, moon surface)
 *   ch5     ← pix_earth_moon + pix_milkyway (flash & glow timing)
 *   ch6     ← procedural (no exact ref; tuned from earth-crust anatomy)
 *   ch7     ← pix_ocean_storm (storm waves) + pix_aurora (day/night terminator)
 *   earth   ← pix_nasa_globe (NASA night-lights) + pix_aurora (rim glow)
 *   ch8     ← pix_earth_moon deep-space tones (microscopic mapping)
 *   ch9–11  ← pix_aurora + pix_nasa_globe (ring / yuga / pralaya)
 */

export const CHAPTER_LOOKS = {

  // ── 0 · VOID ──────────────────────────────────────────────────────────────
  0: {
    label: 'The Void',
    // Pure vacuum black; the procedural Om glow is the only light source
    skyColor:          '#030407',
    fogColor:          '#010203',
    fogDensity:        0.0,
    ambientColor:      '#06081a',
    ambientIntensity:  0.35,
    keyColor:          '#d4af37',   // faint gold — the first photon of Naad
    keyIntensity:      0.4,
    rimColor:          '#0a1aff',   // deep indigo rim
    rimIntensity:      0.6,
    bloomIntensity:    1.8,
    bloomThreshold:    0.72,
    exposure:          0.85,
    cameraEasing:      0.008,
    particleFactor:    0.25,
    dofEnabled:        false,
    vignetteOffset:    0.42,
    vignetteDarkness:  0.85,
  },

  // ── 1 · COSMIC OCEAN (Vishnu on Shesha) ───────────────────────────────────
  // Ref: pix_space_earth — deep-royal-blue ocean, crisp white clouds,
  // warm tan continents, very subtle cyan atmosphere rim, directional sunlight top-right.
  1: {
    label: 'Cosmic Ocean',
    skyColor:          '#050811',   // obsidian-indigo space
    fogColor:          '#08122a',   // deep blue mist above water
    fogDensity:        0.018,
    ambientColor:      '#071020',
    ambientIntensity:  0.5,
    keyColor:          '#ffd580',   // warm golden key (Vishnu's divine light)
    keyIntensity:      2.2,
    rimColor:          '#2172d1',   // cyan-blue rim — direct from pix_space_earth
    rimIntensity:      3.5,
    waterColor:        '#03122a',   // deep royal blue (#041a38 mid-tone)
    waterFoamColor:    '#c8daf5',
    waterSpecular:     '#6ab0ff',
    bloomIntensity:    1.4,
    bloomThreshold:    0.55,
    exposure:          1.05,
    cameraEasing:      0.012,
    particleFactor:    0.3,
    dofEnabled:        false,
    vignetteOffset:    0.35,
    vignetteDarkness:  0.7,
  },

  // ── 2 · LOTUS BLOOMS ──────────────────────────────────────────────────────
  // Same cosmic-ocean base; golden particles stream upward.
  2: {
    label: 'The Lotus',
    skyColor:          '#060a14',
    fogColor:          '#0a1530',
    fogDensity:        0.012,
    ambientColor:      '#0a0e26',
    ambientIntensity:  0.55,
    keyColor:          '#ffdf80',   // bright sacred gold
    keyIntensity:      3.0,
    rimColor:          '#4cc9f0',   // neon-cyan brahmic energy
    rimIntensity:      2.8,
    emissiveColor:     '#ffe082',   // lotus petal emissive
    bloomIntensity:    2.0,
    bloomThreshold:    0.48,
    exposure:          1.12,
    cameraEasing:      0.015,
    particleFactor:    0.55,
    dofEnabled:        false,
    vignetteOffset:    0.32,
    vignetteDarkness:  0.6,
  },

  // ── 3 · SOLAR NEBULA ──────────────────────────────────────────────────────
  // Ref: pix_milkyway — near-black cosmic void (#030508), warm amber/brown nebula
  // dust lanes (#4a3322 → #8a5530), intense sun lens-flare bottom-left (#ffcc66),
  // dense star field throughout, high bloom scatter on star core.
  // Ref: pix_earth_moon — violet-blue milky-way plane (#1a1030 → #403060) for depth.
  3: {
    label: 'Solar Nebula',
    skyColor:          '#030508',   // cosmic void
    fogColor:          '#1a0e08',   // dusty amber nebula haze
    fogDensity:        0.004,
    ambientColor:      '#120a04',
    ambientIntensity:  0.25,
    keyColor:          '#ffcc66',   // proto-sun warm amber — pix_milkyway exact
    keyIntensity:      5.0,
    rimColor:          '#ff8833',   // solar orange back-scatter
    rimIntensity:      2.0,
    nebulaColor1:      '#4a3322',   // dusty amber cloud #1
    nebulaColor2:      '#403060',   // violet-blue cloud #2 (milkyway lane)
    nebulaColor3:      '#2a1808',   // deep brown shadow cloud
    lensFlareColor:    '#fffbe0',
    bloomIntensity:    2.8,
    bloomThreshold:    0.35,
    exposure:          1.25,
    cameraEasing:      0.010,
    particleFactor:    1.0,         // max particles — one million GPU pts
    dofEnabled:        false,
    vignetteOffset:    0.38,
    vignetteDarkness:  0.72,
  },

  // ── 4 · ACCRETION ─────────────────────────────────────────────────────────
  // No direct ref; tuned as a hotter, more chaotic variant of Ch3.
  // Lava orange + molten white core; deep amber fog of ejected dust.
  4: {
    label: 'Accretion',
    skyColor:          '#040206',
    fogColor:          '#1a0800',
    fogDensity:        0.015,
    ambientColor:      '#200c00',
    ambientIntensity:  0.35,
    keyColor:          '#ff6600',   // molten orange impact glow
    keyIntensity:      4.5,
    rimColor:          '#ff2200',   // red-hot back rim
    rimIntensity:      3.0,
    emissiveColor:     '#ff9900',
    bloomIntensity:    2.5,
    bloomThreshold:    0.30,
    exposure:          0.95,
    cameraEasing:      0.018,       // slightly faster — more chaotic
    particleFactor:    0.85,
    dofEnabled:        false,
    vignetteOffset:    0.40,
    vignetteDarkness:  0.78,
  },

  // ── 5 · THEIA IMPACT ──────────────────────────────────────────────────────
  // Ref: pix_earth_moon — charcoal Moon surface (#889098), deep space (#000 → #1a1030),
  // crisp white flash onset, electric cyan atmosphere rim (#2090ff on Earth).
  // pix_milkyway lens-flare bloom for flash intensity reference.
  5: {
    label: 'Theia Impact',
    skyColor:          '#020004',
    fogColor:          '#100508',
    fogDensity:        0.008,
    ambientColor:      '#0a0408',
    ambientIntensity:  0.2,
    keyColor:          '#ffffff',   // pure white flash
    keyIntensity:      8.0,         // extreme — briefly blown out
    rimColor:          '#2090ff',   // post-flash atmospheric cyan from pix_earth_moon
    rimIntensity:      4.0,
    flashColor:        '#fffdf0',
    shockwaveColor:    '#ff8844',
    moonSurfaceTone:   '#889098',   // pix_earth_moon exact
    debrisColor:       '#cc4400',
    bloomIntensity:    3.0,         // maximum at moment of impact
    bloomThreshold:    0.18,
    exposure:          1.5,         // blown-out moment
    cameraEasing:      0.045,       // fastest — trauma
    particleFactor:    0.90,
    dofEnabled:        false,
    vignetteOffset:    0.15,        // reduced — wide shock view
    vignetteDarkness:  0.30,
  },

  // ── 6 · MAGMA OCEAN ───────────────────────────────────────────────────────
  // No Pixabay ref with actual lava footage; derived from physics.
  // Hadean surface: glowing orange crust cracks on near-black cooled basalt.
  6: {
    label: 'Magma Ocean',
    skyColor:          '#060202',
    fogColor:          '#200800',
    fogDensity:        0.025,
    ambientColor:      '#1a0500',
    ambientIntensity:  0.4,
    keyColor:          '#ff5500',   // magma glow key
    keyIntensity:      3.8,
    rimColor:          '#ff2200',
    rimIntensity:      2.5,
    lavaEmissive:      '#ff6600',
    crackEmissive:     '#ffcc00',   // bright yellow-white crack cores
    crustColor:        '#1a0c06',
    bloomIntensity:    2.2,
    bloomThreshold:    0.28,
    exposure:          0.88,
    cameraEasing:      0.010,
    particleFactor:    0.4,         // heat shimmer particles
    dofEnabled:        false,
    vignetteOffset:    0.44,
    vignetteDarkness:  0.80,
  },

  // ── 7 · OCEANS ARRIVE & SAMUDRA MANTHAN ──────────────────────────────────
  // Ref: pix_ocean_storm — deep navy-blue ocean #102030, dark slate-grey swells,
  // crisp bright white foam crests #ffffff, overcast low-key grey sky.
  // Ref: pix_aurora — day/night terminator, emerald-teal aurora (#00ff88),
  // blue atmosphere rim (#0044aa).
  7: {
    label: 'Oceans Arrive',
    skyColor:          '#060e16',
    fogColor:          '#0e1c28',   // ocean storm haze
    fogDensity:        0.032,
    ambientColor:      '#0a1520',
    ambientIntensity:  0.55,
    keyColor:          '#88aac8',   // diffuse overcast grey-blue — pix_ocean_storm
    keyIntensity:      1.8,
    rimColor:          '#0044aa',   // terminator blue rim — pix_aurora
    rimIntensity:      2.5,
    oceanColor:        '#102030',   // deep navy — pix_ocean_storm exact
    oceanFoamColor:    '#f4f8fa',
    stormSkyColor:     '#1a2530',
    lightningColor:    '#d0e8ff',
    auroraColor1:      '#00ff88',   // emerald aurora — pix_aurora exact
    auroraColor2:      '#22ccaa',   // teal aurora band
    bloomIntensity:    1.6,
    bloomThreshold:    0.52,
    exposure:          0.92,
    cameraEasing:      0.014,
    particleFactor:    0.7,         // rain + foam particles
    dofEnabled:        false,
    vignetteOffset:    0.40,
    vignetteDarkness:  0.75,
  },

  // ── EARTH SHADER (shared by Ch7 day-side + Ch10 global view) ─────────────
  // Ref: pix_nasa_globe — NASA Black Marble night view
  //   ocean: near-black #02050f, city lights: golden #ffcc44,
  //   atmosphere rim: crisp neon-blue #3388ff
  // Ref: pix_aurora — day-side
  //   continent base: #3b4a3a greens + #c8a060 desert
  //   ocean day: #1e5fa0 saturated blue, specular: #80c4ff
  //   cloud: bright white #f4f8ff
  //   atmosphere rim: 4-pixel-wide neon-blue #2172d1
  earth: {
    label: 'Earth Shader',
    // Day-side
    continentColor:    '#3b4a3a',
    desertColor:       '#c8a060',
    oceanDayColor:     '#1e5fa0',
    oceanSpecular:     '#80c4ff',
    cloudColor:        '#f4f8ff',
    atmosphereRim:     '#2172d1',   // pix_space_earth exact
    atmosphereWidth:   0.045,       // fraction of planet radius
    // Night-side (NASA Black Marble)
    oceanNightColor:   '#02050f',   // pix_nasa_globe exact
    cityLightColor:    '#ffcc44',   // pix_nasa_globe exact
    cityLightIntensity: 1.4,
    // Aurora overlay
    auroraColor:       '#00ff88',
    auroraIntensity:   0.7,
    // Atmosphere scattering params
    rayleighCoeff:     [0.0058, 0.0135, 0.0331],  // red/green/blue wavelengths
    mieCoeff:          0.0030,
    sunIntensity:      22.0,
  },

  // ── 8 · FIRST LIFE ────────────────────────────────────────────────────────
  // Extreme close-up microscopic: pix_earth_moon deep space tones remapped to
  // bioluminescent undersea. Teal/cyan microbe glow against near-black void.
  8: {
    label: 'First Life',
    skyColor:          '#010508',   // abyss black
    fogColor:          '#011520',
    fogDensity:        0.060,
    ambientColor:      '#021020',
    ambientIntensity:  0.3,
    keyColor:          '#00ccaa',   // bioluminescent teal
    keyIntensity:      2.8,
    rimColor:          '#0066ff',
    rimIntensity:      1.5,
    microbeGlow:       '#00ffcc',
    dnaColor:          '#4488ff',
    bloomIntensity:    2.4,
    bloomThreshold:    0.40,
    exposure:          0.80,
    cameraEasing:      0.008,       // extreme slow push-in
    particleFactor:    0.45,
    dofEnabled:        true,        // bokeh depth of field key feature
    dofFocalLength:    0.04,
    dofBokehScale:     3.5,
    vignetteOffset:    0.50,
    vignetteDarkness:  0.90,
  },

  // ── 9 · DASHAVATARA RING ──────────────────────────────────────────────────
  // Holographic ring set against deep space; avatar emissive gold + cyan.
  // Ref: pix_aurora for golden city-light glow mapped to avatar halos.
  9: {
    label: 'Dashavatara',
    skyColor:          '#040610',
    fogColor:          '#060a18',
    fogDensity:        0.005,
    ambientColor:      '#080c20',
    ambientIntensity:  0.45,
    keyColor:          '#ffd580',   // avatar golden key
    keyIntensity:      2.5,
    rimColor:          '#4cc9f0',   // holographic cyan ring glow
    rimIntensity:      3.0,
    avatarGoldEmissive: '#d4af37',
    avatarCyanEmissive: '#3a86ff',
    ringGlowColor:     '#00ccff',
    bloomIntensity:    1.8,
    bloomThreshold:    0.50,
    exposure:          1.10,
    cameraEasing:      0.018,
    particleFactor:    0.50,
    dofEnabled:        false,
    vignetteOffset:    0.35,
    vignetteDarkness:  0.65,
  },

  // ── 10 · YUGA WHEEL ───────────────────────────────────────────────────────
  // Pull-back wide; massive rotating ring against the Milky Way.
  // Ref: pix_milkyway amber/brown galactic plane for background depth.
  10: {
    label: 'Yuga Wheel',
    skyColor:          '#030508',
    fogColor:          '#0a0804',
    fogDensity:        0.002,
    ambientColor:      '#100a04',
    ambientIntensity:  0.20,
    keyColor:          '#ffcc66',   // milkyway amber — pix_milkyway exact
    keyIntensity:      1.8,
    rimColor:          '#ff9922',
    rimIntensity:      1.2,
    wheelEmissive:     '#d4af37',
    wheelRimGlow:      '#4cc9f0',
    galacticDust1:     '#4a3322',   // pix_milkyway nebula amber
    galacticDust2:     '#403060',   // pix_earth_moon violet-blue
    bloomIntensity:    1.5,
    bloomThreshold:    0.55,
    exposure:          1.00,
    cameraEasing:      0.008,       // slowest — cosmic scale
    particleFactor:    0.80,
    dofEnabled:        false,
    vignetteOffset:    0.38,
    vignetteDarkness:  0.68,
  },

  // ── 11 · PRALAYA & RENEWAL ────────────────────────────────────────────────
  // Everything dissolves into golden ocean light; reverse of Ch1.
  // Ref: pix_nasa_globe golden city lights remapped to divine dissolution glow.
  11: {
    label: 'Pralaya',
    skyColor:          '#060408',
    fogColor:          '#180c00',
    fogDensity:        0.020,
    ambientColor:      '#120800',
    ambientIntensity:  0.50,
    keyColor:          '#ffa040',   // warm dissolution gold
    keyIntensity:      3.5,
    rimColor:          '#ffcc66',   // ambient golden scatter
    rimIntensity:      2.0,
    dissolutionColor:  '#ffdf80',
    vishnuGlow:        '#d4af37',
    bloomIntensity:    2.8,
    bloomThreshold:    0.38,
    exposure:          1.20,
    cameraEasing:      0.010,
    particleFactor:    0.70,
    dofEnabled:        false,
    vignetteOffset:    0.30,
    vignetteDarkness:  0.55,
  },
};

/**
 * Helper — returns the look config for a chapter index.
 */
export function getLook(chapterIndex) {
  return CHAPTER_LOOKS[chapterIndex] ?? CHAPTER_LOOKS[0];
}
