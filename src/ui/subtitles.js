/**
 * KALPA - Subtitle Display
 * Holographic caption banner with smooth fade transitions and glowing gold/neon typography.
 */

export class SubtitleDisplay {
  constructor(container) {
    this.el = document.createElement('div');
    this.el.className = 'kalpa-subtitles';
    this.el.innerHTML = `
      <div class="subtitle-text" id="subtitle-text"></div>
    `;
    container.appendChild(this.el);
    this.textEl = this.el.querySelector('#subtitle-text');
    this.visible = false;
  }

  show(text) {
    if (!text || text.trim() === '') {
      this.hide();
      return;
    }
    this.textEl.textContent = text;
    this.el.classList.add('visible');
    this.visible = true;
  }

  hide() {
    this.el.classList.remove('visible');
    this.visible = false;
  }
}
