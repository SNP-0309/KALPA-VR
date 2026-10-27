/**
 * KALPA - Feedback System
 * Full form with star rating, chapter select, issue chips, VR comfort,
 * narration rating, science/purana respect rating, and auto-metadata.
 * Submits to FEEDBACK_URL (.env). Queues in localStorage on failure.
 * Includes adapters for Google Sheet, Formspree, and Netlify Forms.
 */

import { CHAPTER_METADATA } from '../config/settings.js';

const FEEDBACK_VERSION = '1.0.0';

// ─── Adapters ─────────────────────────────────────────────────────────────────

class GoogleSheetAdapter {
  async submit(payload) {
    const url = window.__KALPA_ENV?.FEEDBACK_URL || import.meta.env?.VITE_FEEDBACK_URL;
    if (!url) throw new Error('VITE_FEEDBACK_URL not set');
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.json();
  }
}

class FormspreeAdapter {
  async submit(payload) {
    const url = import.meta.env?.VITE_FORMSPREE_URL;
    if (!url) throw new Error('VITE_FORMSPREE_URL not set');
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!resp.ok) throw new Error(`Formspree HTTP ${resp.status}`);
    return true;
  }
}

class NetlifyFormsAdapter {
  async submit(payload) {
    const formData = new URLSearchParams();
    formData.append('form-name', 'kalpa-feedback');
    Object.entries(payload).forEach(([k, v]) => {
      formData.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
    });
    const resp = await fetch('/', { method: 'POST', body: formData });
    if (!resp.ok) throw new Error(`Netlify HTTP ${resp.status}`);
    return true;
  }
}

const ADAPTERS = {
  googlesheet: GoogleSheetAdapter,
  formspree: FormspreeAdapter,
  netlify: NetlifyFormsAdapter
};

// ─── LocalStorage Queue ────────────────────────────────────────────────────────

function queueFeedback(payload) {
  try {
    const queue = JSON.parse(localStorage.getItem('kalpa_feedback_queue') || '[]');
    queue.push({ payload, timestamp: Date.now() });
    localStorage.setItem('kalpa_feedback_queue', JSON.stringify(queue));
  } catch {}
}

async function drainQueue(adapter) {
  try {
    const queue = JSON.parse(localStorage.getItem('kalpa_feedback_queue') || '[]');
    if (!queue.length) return;
    const remaining = [];
    for (const item of queue) {
      try {
        await adapter.submit(item.payload);
      } catch {
        remaining.push(item);
      }
    }
    localStorage.setItem('kalpa_feedback_queue', JSON.stringify(remaining));
  } catch {}
}

// ─── Session rate limiter ─────────────────────────────────────────────────────

function canSubmit() {
  const key = 'kalpa_feedback_count';
  const count = parseInt(localStorage.getItem(key) || '0', 10);
  if (count >= 3) return false;
  localStorage.setItem(key, String(count + 1));
  return true;
}

// ─── Auto Metadata ────────────────────────────────────────────────────────────

function getAutoMetadata(appState) {
  const isMobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
  const isVR = /Quest|Oculus|Pico|Vive/i.test(navigator.userAgent);
  return {
    appVersion: FEEDBACK_VERSION,
    qualityLevel: appState?.qualityPreset || 'unknown',
    deviceType: isVR ? 'headset' : isMobile ? 'phone' : 'desktop',
    browser: navigator.userAgent.substring(0, 120),
    chapterReached: appState?.timeline?.currentChapterIndex || 0,
    avgFps: appState?.hud?.fps || 0,
    timestamp: new Date().toISOString()
  };
}

// ─── Main Feedback Panel ──────────────────────────────────────────────────────

export class FeedbackPanel {
  constructor(container, appState) {
    this.container = container;
    this.appState = appState;
    this.isOpen = false;
    this.adapterType = import.meta.env?.VITE_FEEDBACK_ADAPTER || 'googlesheet';
    this.adapter = new (ADAPTERS[this.adapterType] || GoogleSheetAdapter)();

    this._buildDOM();
    this._bindEvents();

    // Drain queued submissions on load
    drainQueue(this.adapter);
  }

  _buildDOM() {
    this.el = document.createElement('div');
    this.el.className = 'feedback-backdrop';
    this.el.innerHTML = `
      <div class="feedback-panel" role="dialog" aria-modal="true" aria-label="KALPA Feedback">

        <!-- Header -->
        <div class="feedback-header">
          <h2 class="feedback-title">Share Your Experience</h2>
          <button class="feedback-close" id="fb-close" aria-label="Close feedback">✕</button>
        </div>

        <!-- Honeypot (spam) -->
        <input type="text" name="website" class="fb-honeypot" tabindex="-1" autocomplete="off" />

        <!-- Body -->
        <div class="feedback-body">

          <!-- 1. Overall Rating -->
          <div class="fb-field">
            <label class="fb-label">How was your journey?</label>
            <div class="fb-stars" id="fb-stars" role="radiogroup" aria-label="Rating">
              ${[1,2,3,4,5].map(n => `<button class="fb-star" data-val="${n}" aria-label="${n} stars">★</button>`).join('')}
            </div>
          </div>

          <!-- 2. Favourite chapter -->
          <div class="fb-field">
            <label class="fb-label">Which chapter moved you most?</label>
            <select class="fb-select" id="fb-chapter">
              <option value="">— Choose —</option>
              ${CHAPTER_METADATA.map(c => `<option value="${c.id}">${c.id}: ${c.title}</option>`).join('')}
            </select>
          </div>

          <!-- 3. Issues multi-select -->
          <div class="fb-field">
            <label class="fb-label">Anything off? (select all that apply)</label>
            <div class="fb-chips" id="fb-issues">
              ${['Too slow','Too fast','Too dark','Too bright','Confusing narration',
                'Motion sick','Low frame-rate','Audio sync off','Subtitles unclear'].map(
                t => `<button class="fb-chip" data-val="${t}">${t}</button>`).join('')}
            </div>
            <input class="fb-input fb-freetext" id="fb-issue-text" placeholder="Anything else…" maxlength="200" />
          </div>

          <!-- 4. VR Comfort -->
          <div class="fb-field">
            <label class="fb-label">VR Comfort level</label>
            <div class="fb-seg" id="fb-comfort">
              <button data-val="none">No discomfort</button>
              <button data-val="mild">Mild</button>
              <button data-val="noticeable">Noticeable</button>
            </div>
          </div>

          <!-- 5. Narration quality -->
          <div class="fb-field">
            <label class="fb-label">Voice quality</label>
            <div class="fb-stars" id="fb-voice-stars" role="radiogroup" aria-label="Voice rating">
              ${[1,2,3,4,5].map(n => `<button class="fb-star" data-val="${n}" aria-label="${n} stars">★</button>`).join('')}
            </div>
            <div class="fb-seg" id="fb-subs-helpful" style="margin-top:8px">
              <span class="fb-seg-label">Were subtitles helpful?</span>
              <button data-val="yes">Yes</button>
              <button data-val="no">No</button>
            </div>
          </div>

          <!-- 6. Science/Purana framing respect -->
          <div class="fb-field">
            <label class="fb-label">Did the Science ↔ Purana framing feel respectful and clear?</label>
            <div class="fb-stars" id="fb-respect-stars" role="radiogroup" aria-label="Framing rating">
              ${[1,2,3,4,5].map(n => `<button class="fb-star" data-val="${n}" aria-label="${n} stars">★</button>`).join('')}
            </div>
            <input class="fb-input fb-freetext" id="fb-respect-text" placeholder="Optional comment…" maxlength="200" />
          </div>

          <!-- 7. Optional email -->
          <div class="fb-field">
            <input class="fb-input" id="fb-email" type="email" placeholder="Your email (optional)" maxlength="120" />
            <label class="fb-checkbox-row">
              <input type="checkbox" id="fb-contact-ok" />
              <span>You may contact me about this feedback</span>
            </label>
          </div>

          <!-- Privacy notice -->
          <p class="fb-privacy">
            By pressing Send, you share the responses above plus automatic info about your device,
            browser, quality setting, and average FPS — nothing else. No personal data is collected
            before you press Send.
          </p>

        </div>

        <!-- Footer -->
        <div class="feedback-footer">
          <div class="fb-status" id="fb-status"></div>
          <button class="fb-btn-send" id="fb-send">Send Feedback</button>
        </div>

      </div>
    `;
    this.container.appendChild(this.el);

    // Quick-reaction overlay (chapter transitions)
    this.reactionEl = document.createElement('div');
    this.reactionEl.className = 'fb-quick-reaction hidden';
    this.reactionEl.innerHTML = `
      <span class="fb-reaction-label" id="fb-reaction-ch">How was this chapter?</span>
      <button class="fb-reaction-btn" id="fb-react-up" title="Thumbs up">👍</button>
      <button class="fb-reaction-btn" id="fb-react-down" title="Thumbs down">👎</button>
      <input class="fb-reaction-input" id="fb-react-text" placeholder="Quick comment…" maxlength="80" />
      <button class="fb-reaction-close">✕</button>
    `;
    this.container.appendChild(this.reactionEl);
  }

  _bindEvents() {
    // Close
    this.el.querySelector('#fb-close').addEventListener('click', () => this.close());
    this.el.addEventListener('click', (e) => { if (e.target === this.el) this.close(); });

    // Star buttons
    ['fb-stars', 'fb-voice-stars', 'fb-respect-stars'].forEach(id => {
      this._bindStars(id);
    });

    // Segment buttons
    ['fb-comfort', 'fb-subs-helpful'].forEach(id => {
      this.el.querySelectorAll(`#${id} button`).forEach(b => {
        b.addEventListener('click', () => {
          this.el.querySelectorAll(`#${id} button`).forEach(x => x.classList.remove('active'));
          b.classList.add('active');
        });
      });
    });

    // Issue chips
    this.el.querySelectorAll('.fb-chip').forEach(chip => {
      chip.addEventListener('click', () => chip.classList.toggle('active'));
    });

    // Quick reaction
    this.reactionEl.querySelector('.fb-reaction-close').addEventListener('click', () => {
      this.reactionEl.classList.add('hidden');
    });
    this.reactionEl.querySelector('#fb-react-up').addEventListener('click', () => {
      this._submitReaction('up');
    });
    this.reactionEl.querySelector('#fb-react-down').addEventListener('click', () => {
      this._submitReaction('down');
    });

    // Send
    this.el.querySelector('#fb-send').addEventListener('click', () => this._submit());
  }

  _bindStars(groupId) {
    const stars = this.el.querySelectorAll(`#${groupId} .fb-star`);
    stars.forEach(star => {
      star.addEventListener('click', () => {
        const val = parseInt(star.dataset.val, 10);
        stars.forEach((s, i) => s.classList.toggle('active', i < val));
      });
      star.addEventListener('mouseenter', () => {
        const val = parseInt(star.dataset.val, 10);
        stars.forEach((s, i) => s.classList.toggle('hover', i < val));
      });
      star.addEventListener('mouseleave', () => {
        stars.forEach(s => s.classList.remove('hover'));
      });
    });
  }

  _getStarVal(groupId) {
    let val = 0;
    this.el.querySelectorAll(`#${groupId} .fb-star`).forEach(s => {
      if (s.classList.contains('active')) val = parseInt(s.dataset.val, 10);
    });
    return val;
  }

  _getSegVal(groupId) {
    const active = this.el.querySelector(`#${groupId} button.active`);
    return active ? active.dataset.val : null;
  }

  _getChips(groupId) {
    return [...this.el.querySelectorAll(`#${groupId} .fb-chip.active`)].map(c => c.dataset.val);
  }

  async _submit() {
    // Honeypot check
    const honeypot = this.el.querySelector('input[name="website"]');
    if (honeypot?.value) return;

    if (!canSubmit()) {
      this._setStatus('error', 'Rate limit: max 3 submissions per session.');
      return;
    }

    const payload = {
      rating: this._getStarVal('fb-stars'),
      favouriteChapter: this.el.querySelector('#fb-chapter').value,
      issues: this._getChips('fb-issues'),
      issueText: this.el.querySelector('#fb-issue-text').value,
      vrComfort: this._getSegVal('fb-comfort'),
      voiceRating: this._getStarVal('fb-voice-stars'),
      subtitlesHelpful: this._getSegVal('fb-subs-helpful'),
      framingRespect: this._getStarVal('fb-respect-stars'),
      framingComment: this.el.querySelector('#fb-respect-text').value,
      email: this.el.querySelector('#fb-email').value,
      contactOk: this.el.querySelector('#fb-contact-ok').checked,
      meta: getAutoMetadata(this.appState)
    };

    this._setStatus('loading', 'Sending…');
    const sendBtn = this.el.querySelector('#fb-send');
    sendBtn.disabled = true;

    try {
      await this.adapter.submit(payload);
      this._setStatus('success', 'Thanks — your feedback was sent! ✓');
      setTimeout(() => this.close(), 2500);
    } catch (err) {
      queueFeedback(payload);
      this._setStatus('error', 'Network error — queued locally. Retry when online.');
      sendBtn.textContent = 'Retry';
      sendBtn.disabled = false;
      sendBtn.onclick = () => this._retryQueued();
    }
  }

  async _retryQueued() {
    this._setStatus('loading', 'Retrying…');
    await drainQueue(this.adapter);
    this._setStatus('success', 'Queued feedback sent! ✓');
  }

  _setStatus(type, msg) {
    const el = this.el.querySelector('#fb-status');
    el.textContent = msg;
    el.className = `fb-status fb-status-${type}`;
  }

  async _submitReaction(direction) {
    const text = this.reactionEl.querySelector('#fb-react-text').value;
    const chapterId = this.appState?.timeline?.currentChapterIndex || 0;
    const payload = {
      type: 'quick-reaction',
      direction,
      comment: text,
      chapterId,
      meta: getAutoMetadata(this.appState)
    };
    try {
      await this.adapter.submit(payload);
    } catch {
      queueFeedback(payload);
    }
    this.reactionEl.classList.add('hidden');
  }

  open(autoPrompt = false) {
    this.isOpen = true;
    this.el.classList.add('open');
    if (autoPrompt) {
      this._setStatus('info', 'You\'ve completed the full journey — please share your thoughts!');
    }
  }

  close() {
    this.isOpen = false;
    this.el.classList.remove('open');
  }

  showQuickReaction(chapterId) {
    const meta = CHAPTER_METADATA[chapterId];
    if (!meta) return;
    this.reactionEl.querySelector('#fb-reaction-ch').textContent = `How was "${meta.title}"?`;
    this.reactionEl.classList.remove('hidden');
  }

  hideQuickReaction() {
    this.reactionEl.classList.add('hidden');
  }
}
