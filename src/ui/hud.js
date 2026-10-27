/**
 * KALPA - Holographic HUD & Navigation Interface
 * Title screen, loading screen, chapter controls, mode toggle (Science/Purana/Blended),
 * VR button, and real-time FPS telemetry.
 */

export class HUD {
  constructor(container, context) {
    this.container = container;
    this.context = context; // { timeline, narrationEngine, audioEngine, cameraRig, renderer, guideModal }
    this.fps = 60;
    this.frameCount = 0;
    this.lastTime = performance.now();

    this.initElements();
    this.bindEvents();
    this.checkWebXRSupport();
  }

  initElements() {
    this.container.innerHTML = `
      <!-- Loading Screen -->
      <div id="kalpa-loader" class="kalpa-loader">
        <div class="loader-mandala"></div>
        <div class="loader-title">KALPA</div>
        <div class="loader-status" id="loader-status-text">Preparing creation…</div>
        <div class="loader-progress-track">
          <div class="loader-progress-fill" id="loader-progress-fill"></div>
        </div>
      </div>

      <!-- Title / Entry Screen -->
      <div id="kalpa-title-screen" class="kalpa-title-screen hidden">
        <div class="title-mandala-halo"></div>
        <div class="title-content">
          <div class="title-eyebrow">A WebXR Journey of Deep Time & Sacred Cosmos</div>
          <h1 class="title-main">KALPA</h1>
          <p class="title-tagline">"Witness creation, from the first sound."</p>
          
          <div class="title-mode-select">
            <span class="mode-label">Perspective:</span>
            <div class="mode-buttons">
              <button class="mode-btn" data-mode="science">Science</button>
              <button class="mode-btn active" data-mode="blended">Blended</button>
              <button class="mode-btn" data-mode="purana">Purana</button>
            </div>
          </div>

          <button id="btn-begin-journey" class="btn-begin-journey">
            <span class="btn-glow"></span>
            <span class="btn-text">Begin Journey</span>
          </button>

          <div class="title-footnote">Audio & Gyroscope Recommended • WebXR Ready</div>
        </div>
      </div>

      <!-- In-Experience HUD -->
      <div id="kalpa-hud" class="kalpa-hud hidden">
        <!-- Top Bar -->
        <header class="hud-top-bar">
          <div class="hud-brand">
            <span class="brand-glyph">ॐ</span>
            <span class="brand-name">KALPA</span>
          </div>

          <div class="hud-chapter-indicator">
            <span class="indicator-prefix">CHAPTER <span id="hud-ch-num">00</span></span>
            <span class="indicator-sep">—</span>
            <span class="indicator-title" id="hud-ch-name">The Void</span>
          </div>

          <div class="hud-actions">
            <!-- Mode switch in HUD -->
            <div class="hud-mode-pill">
              <button class="pill-btn" data-mode="science">Sci</button>
              <button class="pill-btn active" data-mode="blended">Blend</button>
              <button class="pill-btn" data-mode="purana">Pur</button>
            </div>

            <!-- "Ask Naad" Button -->
            <button id="btn-ask-naad" class="btn-hud-action" title="Commune with primordial voice guide">
              <span class="action-icon">✧</span>
              <span>Ask Naad</span>
            </button>

            <!-- Quality Badge -->
            <div class="hud-badge quality-badge" id="hud-quality-badge">HIGH</div>

            <!-- FPS Telemetry -->
            <div class="hud-badge fps-badge" id="hud-fps">60 FPS</div>

            <!-- Enter VR (only shown if supported) -->
            <button id="btn-enter-vr" class="btn-hud-action vr-btn hidden" title="Enter Immersive WebXR">
              <span class="action-icon">🥽</span>
              <span>Enter VR</span>
            </button>
          </div>
        </header>

        <!-- Bottom Controls Bar -->
        <footer class="hud-bottom-bar">
          <div class="hud-playback-controls">
            <button id="btn-replay" class="hud-ctrl-btn" title="Replay Chapter">↺</button>
            <button id="btn-play-pause" class="hud-ctrl-btn play-pause-btn" title="Pause / Play">⏸</button>
            <button id="btn-skip" class="hud-ctrl-btn" title="Skip to Next Chapter">⏭</button>
          </div>

          <div class="hud-scrubber-container">
            <div class="hud-scrubber-track" id="hud-scrubber-track">
              <div class="hud-scrubber-fill" id="hud-scrubber-fill"></div>
            </div>
            <div class="hud-scrubber-time" id="hud-scrubber-time">00:00 / 00:15</div>
          </div>

          <div class="hud-right-options">
            <!-- Audio Toggle & Slider -->
            <div class="volume-control">
              <button id="btn-mute" class="hud-icon-btn" title="Mute Audio">🔊</button>
              <input type="range" id="volume-slider" min="0" max="1" step="0.05" value="0.85" />
            </div>
            <!-- Letterbox Bar Toggle -->
            <button id="btn-letterbox" class="hud-icon-btn" title="Toggle Cinematic Letterbox">⬚</button>
          </div>
        </footer>
      </div>
    `;

    this.loaderEl = this.container.querySelector('#kalpa-loader');
    this.progressFillEl = this.container.querySelector('#loader-progress-fill');
    this.statusTextEl = this.container.querySelector('#loader-status-text');
    this.titleScreenEl = this.container.querySelector('#kalpa-title-screen');
    this.hudEl = this.container.querySelector('#kalpa-hud');
    this.fpsEl = this.container.querySelector('#hud-fps');
    this.playPauseBtn = this.container.querySelector('#btn-play-pause');
    this.scrubberFillEl = this.container.querySelector('#hud-scrubber-fill');
    this.scrubberTimeEl = this.container.querySelector('#hud-scrubber-time');
    this.hudChNumEl = this.container.querySelector('#hud-ch-num');
    this.hudChNameEl = this.container.querySelector('#hud-ch-name');
    this.qualityBadgeEl = this.container.querySelector('#hud-quality-badge');
    this.vrBtn = this.container.querySelector('#btn-enter-vr');
  }

  updateProgress(ratio, itemUrl) {
    const pct = Math.round(ratio * 100);
    if (this.progressFillEl) this.progressFillEl.style.width = `${pct}%`;
    if (this.statusTextEl) {
      this.statusTextEl.textContent = ratio >= 1 ? 'Creation ready.' : `Preparing creation… (${pct}%)`;
    }
  }

  showTitleScreen() {
    if (this.loaderEl) {
      this.loaderEl.classList.add('fade-out');
      setTimeout(() => {
        this.loaderEl.style.display = 'none';
        this.titleScreenEl.classList.remove('hidden');
      }, 700);
    }
  }

  enterExperience() {
    this.titleScreenEl.classList.add('fade-out');
    setTimeout(() => {
      this.titleScreenEl.style.display = 'none';
      this.hudEl.classList.remove('hidden');
    }, 600);
  }

  bindEvents() {
    // Mode selector in Title Screen
    const titleModeBtns = this.titleScreenEl.querySelectorAll('.mode-btn');
    titleModeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        titleModeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.mode;
        this.context.narrationEngine.setMode(mode);
        this.syncHudModePill(mode);
      });
    });

    // Mode selector in HUD
    const hudPillBtns = this.hudEl.querySelectorAll('.pill-btn');
    hudPillBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        hudPillBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.mode;
        this.context.narrationEngine.setMode(mode);
      });
    });

    // Begin Journey button
    const beginBtn = this.titleScreenEl.querySelector('#btn-begin-journey');
    beginBtn.addEventListener('click', async () => {
      // Initialize audio & start generative drone
      await this.context.audioEngine.init();
      this.context.audioEngine.startOmDrone();
      this.enterExperience();
      this.context.timeline.start();
    });

    // Play / Pause
    this.playPauseBtn.addEventListener('click', () => {
      this.context.timeline.togglePlay();
    });

    // Replay
    this.hudEl.querySelector('#btn-replay').addEventListener('click', () => {
      this.context.timeline.replayChapter();
    });

    // Skip
    this.hudEl.querySelector('#btn-skip').addEventListener('click', () => {
      const nextIdx = this.context.timeline.currentChapterIndex + 1;
      this.context.timeline.skipToChapter(nextIdx);
    });

    // Ask Naad
    this.hudEl.querySelector('#btn-ask-naad').addEventListener('click', () => {
      if (this.context.guideModal) {
        this.context.guideModal.open();
      }
    });

    // Volume Slider
    const volumeSlider = this.hudEl.querySelector('#volume-slider');
    volumeSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.context.audioEngine.setMasterVolume(val);
    });

    // Letterbox Toggle
    let isLetterbox = false;
    this.hudEl.querySelector('#btn-letterbox').addEventListener('click', () => {
      isLetterbox = !isLetterbox;
      this.context.cameraRig.setLetterbox(isLetterbox);
    });

    // Timeline updates
    this.context.timeline.on('chapterChange', ({ chapter, index }) => {
      if (this.hudChNumEl) this.hudChNumEl.textContent = index < 10 ? `0${index}` : `${index}`;
      if (this.hudChNameEl) this.hudChNameEl.textContent = chapter.title;
    });

    this.context.timeline.on('playStateChange', ({ isPlaying }) => {
      if (this.playPauseBtn) {
        this.playPauseBtn.textContent = isPlaying ? '⏸' : '▶';
      }
    });

    this.context.timeline.on('timeUpdate', ({ time, duration, progress }) => {
      if (this.scrubberFillEl) {
        this.scrubberFillEl.style.width = `${progress * 100}%`;
      }
      if (this.scrubberTimeEl) {
        const curM = Math.floor(time / 60);
        const curS = Math.floor(time % 60);
        const durM = Math.floor(duration / 60);
        const durS = Math.floor(duration % 60);
        const fmt = (n) => (n < 10 ? `0${n}` : `${n}`);
        this.scrubberTimeEl.textContent = `${fmt(curM)}:${fmt(curS)} / ${fmt(durM)}:${fmt(durS)}`;
      }
    });
  }

  syncHudModePill(mode) {
    const btns = this.hudEl.querySelectorAll('.pill-btn');
    btns.forEach(b => {
      b.classList.toggle('active', b.dataset.mode === mode);
    });
  }

  setQuality(presetKey) {
    if (this.qualityBadgeEl) {
      this.qualityBadgeEl.textContent = presetKey.toUpperCase();
    }
  }

  checkWebXRSupport() {
    if ('xr' in navigator) {
      navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
        if (supported) {
          this.vrBtn.classList.remove('hidden');
          this.vrBtn.addEventListener('click', () => this.requestXRSession());
        }
      }).catch(() => {});
    }
  }

  async requestXRSession() {
    try {
      const session = await navigator.xr.requestSession('immersive-vr', {
        optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking']
      });
      await this.context.renderer.renderer.xr.setSession(session);
      console.log('[WebXR] Entered immersive VR session');
    } catch (e) {
      console.warn('[WebXR] Failed to launch session:', e);
    }
  }

  updateFPS() {
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastTime));
      this.frameCount = 0;
      this.lastTime = now;
      if (this.fpsEl) {
        this.fpsEl.textContent = `${this.fps} FPS`;
      }
    }
  }
}
