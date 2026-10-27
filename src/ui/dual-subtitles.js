/**
 * KALPA - Dual-Track Subtitle System v2.0
 * Left column: Science track | Right column: Purana track
 * - Multi-language: English / Hindi / Sanskrit (with transliteration)
 * - Responsive: side-by-side on desktop, stacked on mobile, curved VR panel
 * - Active spoken column highlighted (gold underline + brighter text)
 * - Settings: font size, background opacity, dyslexia-friendly font
 * - VR: curved panel, 1.5m ahead, soft follow-lag
 * - All settings persist in localStorage
 */

import * as THREE from 'three';

const LANG_LABELS = { en: 'English', hi: 'हिन्दी', sa: 'संस्कृत' };
const WRAP_CHARS = 38;

function wrapText(text, maxChars = WRAP_CHARS) {
  if (!text) return '';
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > maxChars) {
      lines.push(line.trim());
      line = w;
    } else {
      line = (line + ' ' + w).trim();
    }
  }
  if (line) lines.push(line.trim());
  return lines.slice(0, 2).join('\n');
}

export class DualSubtitleSystem {
  constructor(container, narrationEngine, renderer3d) {
    this.container = container;
    this.narrationEngine = narrationEngine;
    this.renderer3d = renderer3d; // Three.js renderer for VR mode

    // State
    this.mode = 'blended'; // 'science' | 'purana' | 'blended'
    this.speakingTrack = 'science'; // which column is actively spoken
    this.leftLang = 'en';
    this.rightLang = 'hi';
    this.layout = 'side-by-side'; // 'side-by-side' | 'stacked' | 'single' | 'off'
    this.fontSize = 'M';
    this.bgOpacity = 0.78;
    this.dyslexiaFont = false;
    this.enabled = true;

    this.currentCues = []; // active cues for this chapter
    this.activeTimeouts = [];
    this.chapterId = null;

    // Load saved settings
    this._loadSettings();

    // Build DOM
    this._buildDOM();
    this._bindResizeObserver();

    // VR panel (built lazily on first XR frame)
    this.vrPanel = null;
    this.vrPanelGroup = null;
  }

  // ─── Settings persistence ──────────────────────────────────────────────────

  _loadSettings() {
    try {
      const s = JSON.parse(localStorage.getItem('kalpa_subtitle_settings') || '{}');
      if (s.leftLang) this.leftLang = s.leftLang;
      if (s.rightLang) this.rightLang = s.rightLang;
      if (s.layout) this.layout = s.layout;
      if (s.fontSize) this.fontSize = s.fontSize;
      if (typeof s.bgOpacity === 'number') this.bgOpacity = s.bgOpacity;
      if (typeof s.dyslexiaFont === 'boolean') this.dyslexiaFont = s.dyslexiaFont;
    } catch {}
  }

  _saveSettings() {
    try {
      localStorage.setItem('kalpa_subtitle_settings', JSON.stringify({
        leftLang: this.leftLang, rightLang: this.rightLang,
        layout: this.layout, fontSize: this.fontSize,
        bgOpacity: this.bgOpacity, dyslexiaFont: this.dyslexiaFont
      }));
    } catch {}
  }

  // ─── DOM construction ──────────────────────────────────────────────────────

  _buildDOM() {
    this.el = document.createElement('div');
    this.el.className = `kalpa-dual-subs layout-${this.layout}`;
    this.el.setAttribute('aria-live', 'polite');
    this.el.setAttribute('role', 'status');

    this.el.innerHTML = `
      <div class="ds-bar">
        <div class="ds-col ds-left" id="ds-col-left">
          <div class="ds-track-label" id="ds-label-left">Science</div>
          <div class="ds-text" id="ds-text-left">—</div>
        </div>
        <div class="ds-divider"></div>
        <div class="ds-col ds-right" id="ds-col-right">
          <div class="ds-track-label" id="ds-label-right">Purana</div>
          <div class="ds-text" id="ds-text-right">—</div>
        </div>
      </div>
      <!-- Settings tray -->
      <div class="ds-settings-tray hidden" id="ds-settings-tray">
        <div class="ds-settings-row">
          <span class="ds-settings-label">Left language</span>
          <select id="ds-lang-left" class="ds-select">
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
            <option value="sa">Sanskrit</option>
          </select>
          <span class="ds-settings-label">Right language</span>
          <select id="ds-lang-right" class="ds-select">
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
            <option value="sa">Sanskrit</option>
          </select>
        </div>
        <div class="ds-settings-row">
          <span class="ds-settings-label">Layout</span>
          <div class="ds-seg" id="ds-layout-seg">
            <button data-layout="side-by-side">Side</button>
            <button data-layout="stacked">Stack</button>
            <button data-layout="single">Single</button>
            <button data-layout="off">Off</button>
          </div>
          <span class="ds-settings-label">Size</span>
          <div class="ds-seg" id="ds-size-seg">
            <button data-size="S">S</button>
            <button data-size="M">M</button>
            <button data-size="L">L</button>
            <button data-size="XL">XL</button>
          </div>
        </div>
        <div class="ds-settings-row">
          <span class="ds-settings-label">BG opacity</span>
          <input type="range" id="ds-opacity-slider" min="0" max="1" step="0.05" value="${this.bgOpacity}" />
          <span class="ds-settings-label">Dyslexia font</span>
          <label class="ds-toggle"><input type="checkbox" id="ds-dyslexia" /> <span></span></label>
        </div>
      </div>
      <button class="ds-settings-btn" id="ds-settings-btn" title="Subtitle settings">⚙</button>
    `;

    this.container.appendChild(this.el);

    // Refs
    this.leftColEl = this.el.querySelector('#ds-col-left');
    this.rightColEl = this.el.querySelector('#ds-col-right');
    this.leftTextEl = this.el.querySelector('#ds-text-left');
    this.rightTextEl = this.el.querySelector('#ds-text-right');
    this.leftLabelEl = this.el.querySelector('#ds-label-left');
    this.rightLabelEl = this.el.querySelector('#ds-label-right');
    this.settingsTray = this.el.querySelector('#ds-settings-tray');

    this._applySettings();
    this._bindSettingsEvents();
  }

  _bindSettingsEvents() {
    const btn = this.el.querySelector('#ds-settings-btn');
    btn.addEventListener('click', () => {
      this.settingsTray.classList.toggle('hidden');
    });

    // Language selectors
    const langLeft = this.el.querySelector('#ds-lang-left');
    const langRight = this.el.querySelector('#ds-lang-right');
    langLeft.value = this.leftLang;
    langRight.value = this.rightLang;
    langLeft.addEventListener('change', () => { this.leftLang = langLeft.value; this._saveSettings(); this._refreshDisplay(); });
    langRight.addEventListener('change', () => { this.rightLang = langRight.value; this._saveSettings(); this._refreshDisplay(); });

    // Layout buttons
    this.el.querySelectorAll('#ds-layout-seg button').forEach(b => {
      b.addEventListener('click', () => { this.setLayout(b.dataset.layout); });
    });

    // Font size buttons
    this.el.querySelectorAll('#ds-size-seg button').forEach(b => {
      b.addEventListener('click', () => { this.setFontSize(b.dataset.size); });
    });

    // Opacity slider
    const opacitySlider = this.el.querySelector('#ds-opacity-slider');
    opacitySlider.addEventListener('input', () => {
      this.bgOpacity = parseFloat(opacitySlider.value);
      this._applyCSSVars();
      this._saveSettings();
    });

    // Dyslexia font
    const dyslexiaCheck = this.el.querySelector('#ds-dyslexia');
    dyslexiaCheck.checked = this.dyslexiaFont;
    dyslexiaCheck.addEventListener('change', () => {
      this.dyslexiaFont = dyslexiaCheck.checked;
      this.el.classList.toggle('dyslexia-font', this.dyslexiaFont);
      this._saveSettings();
    });
  }

  _applySettings() {
    this._applyCSSVars();
    this.el.className = `kalpa-dual-subs layout-${this.layout}`;
    if (this.dyslexiaFont) this.el.classList.add('dyslexia-font');
    this.el.dataset.fontSize = this.fontSize;

    // Highlight active layout/size buttons
    this.el.querySelectorAll('#ds-layout-seg button').forEach(b => {
      b.classList.toggle('active', b.dataset.layout === this.layout);
    });
    this.el.querySelectorAll('#ds-size-seg button').forEach(b => {
      b.classList.toggle('active', b.dataset.size === this.fontSize);
    });

    // Update track labels
    this.leftLabelEl.textContent = 'Science';
    this.rightLabelEl.textContent = 'Purana';
  }

  _applyCSSVars() {
    this.el.style.setProperty('--ds-bg-opacity', this.bgOpacity);
  }

  _bindResizeObserver() {
    const observer = new ResizeObserver(() => {
      const isNarrow = window.innerWidth < 600;
      if (isNarrow && this.layout === 'side-by-side') {
        this.el.classList.add('force-stacked');
      } else {
        this.el.classList.remove('force-stacked');
      }
    });
    observer.observe(document.body);
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  setMode(mode) {
    this.mode = mode;
    this._refreshDisplay();
  }

  setLayout(layout) {
    this.layout = layout;
    this.el.className = `kalpa-dual-subs layout-${layout}`;
    if (this.dyslexiaFont) this.el.classList.add('dyslexia-font');
    this.el.dataset.fontSize = this.fontSize;
    this._saveSettings();
    this._applySettings();
  }

  setFontSize(size) {
    this.fontSize = size;
    this.el.dataset.fontSize = size;
    this._saveSettings();
  }

  /**
   * Play cues for a given chapter from script data
   */
  playChapter(chapterId, scriptData) {
    this.stopChapter();
    this.chapterId = chapterId;

    const chapterScript = scriptData?.chapters?.[String(chapterId)];
    if (!chapterScript) return;

    this.currentCues = chapterScript.cues || [];

    this.currentCues.forEach(cue => {
      const startMs = cue.start * 1000;
      const endMs = cue.end * 1000;

      const showTimer = setTimeout(() => {
        this._showCue(cue);
      }, startMs);

      const hideTimer = setTimeout(() => {
        this._hideCue();
      }, endMs);

      this.activeTimeouts.push(showTimer, hideTimer);
    });
  }

  stopChapter() {
    this.activeTimeouts.forEach(t => clearTimeout(t));
    this.activeTimeouts = [];
    this._hideCue();
  }

  _showCue(cue) {
    if (this.layout === 'off') return;

    const sciText = this._getTrackText(cue, 'science', this.leftLang);
    const purText = this._getTrackText(cue, 'purana', this.rightLang);

    this.leftTextEl.innerHTML = sciText
      ? wrapText(sciText).replace(/\n/g, '<br>')
      : '<span class="ds-empty">—</span>';

    this.rightTextEl.innerHTML = purText
      ? wrapText(purText).replace(/\n/g, '<br>')
      : '<span class="ds-empty">—</span>';

    // Determine which column is being spoken
    let spoken = 'both';
    if (this.mode === 'science') spoken = 'left';
    else if (this.mode === 'purana') spoken = 'right';

    this.leftColEl.classList.toggle('ds-spoken', spoken === 'left' || spoken === 'both');
    this.rightColEl.classList.toggle('ds-spoken', spoken === 'right' || spoken === 'both');

    this.el.classList.add('ds-visible');

    // Mirror to VR panel if active
    this._updateVRPanel(sciText, purText, spoken);
  }

  _hideCue() {
    this.leftTextEl.innerHTML = '<span class="ds-empty">—</span>';
    this.rightTextEl.innerHTML = '<span class="ds-empty">—</span>';
    this.leftColEl.classList.remove('ds-spoken');
    this.rightColEl.classList.remove('ds-spoken');
    this.el.classList.remove('ds-visible');
  }

  _getTrackText(cue, track, lang) {
    const trackData = cue?.tracks?.[track];
    if (!trackData) return null;
    // For Sanskrit, prefer sa_translit as fallback from sa
    if (lang === 'sa') return trackData.sa_translit || trackData.sa || trackData.en || null;
    return trackData[lang] || trackData.en || null;
  }

  _refreshDisplay() {
    // Instantly refresh visible cue if any
    const visibleCue = this.currentCues.find(c => {
      const now = (Date.now() % 99999999); // rough; in real use compare to chapter elapsed time
      return true; // just refresh all
    });
    // No-op; next cue show will use new settings
  }

  // ─── VR Panel (Three.js curved canvas texture) ────────────────────────────

  buildVRPanel(scene, camera) {
    if (this.vrPanelGroup) return;

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 200;
    this.vrCanvas = canvas;
    this.vrCtx = canvas.getContext('2d');

    const texture = new THREE.CanvasTexture(canvas);
    this.vrTexture = texture;

    // Gently curved panel geometry
    const geometry = new THREE.CylinderGeometry(2.4, 2.4, 0.45, 48, 1, true,
      -Math.PI * 0.22, Math.PI * 0.44);
    const mat = new THREE.MeshBasicMaterial({
      map: texture, transparent: true, side: THREE.FrontSide, depthWrite: false
    });

    const mesh = new THREE.Mesh(geometry, mat);
    mesh.rotation.x = Math.PI; // flip y
    this.vrPanelGroup = new THREE.Group();
    this.vrPanelGroup.add(mesh);
    this.vrPanelGroup.position.set(0, -0.35, -1.5); // 1.5 m ahead, below eye
    scene.add(this.vrPanelGroup);
    this.vrCamera = camera;
  }

  _updateVRPanel(sciText, purText, spoken) {
    if (!this.vrCanvas || !this.vrTexture) return;
    const ctx = this.vrCtx;
    ctx.clearRect(0, 0, 1024, 200);

    // Background
    ctx.fillStyle = `rgba(5, 10, 28, ${this.bgOpacity})`;
    ctx.roundRect(0, 0, 1024, 200, 24);
    ctx.fill();

    ctx.font = '32px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(76, 201, 240, 0.7)';
    ctx.fillText('SCIENCE', 256, 36);
    ctx.fillText('PURANA', 768, 36);

    // Divider
    ctx.strokeStyle = 'rgba(76, 201, 240, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(512, 20);
    ctx.lineTo(512, 180);
    ctx.stroke();

    // Text
    ctx.font = '26px Outfit, sans-serif';
    ctx.fillStyle = spoken === 'left' ? '#fff' : 'rgba(255,255,255,0.6)';
    ctx.fillText(sciText ? wrapText(sciText, 32) : '—', 256, 90);

    ctx.fillStyle = spoken === 'right' ? '#fff' : 'rgba(255,255,255,0.6)';
    ctx.fillText(purText ? wrapText(purText, 32) : '—', 768, 90);

    this.vrTexture.needsUpdate = true;
  }

  updateVRFollow(camera, deltaTime) {
    if (!this.vrPanelGroup) return;
    const targetPos = new THREE.Vector3(0, -0.35, -1.5).applyQuaternion(camera.quaternion).add(camera.position);
    this.vrPanelGroup.position.lerp(targetPos, deltaTime * 2.5); // gentle follow lag
    this.vrPanelGroup.quaternion.slerp(camera.quaternion, deltaTime * 2.5);
  }

  // Called from NarrationEngine when a cue is being spoken
  setSpokenTrack(track) {
    this.speakingTrack = track;
    this.leftColEl.classList.toggle('ds-spoken', track === 'science');
    this.rightColEl.classList.toggle('ds-spoken', track === 'purana');
  }
}
