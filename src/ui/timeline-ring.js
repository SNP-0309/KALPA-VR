/**
 * KALPA - Holographic Timeline Ring
 * Circular mandala-style orbital ring with 12 clickable chapter nodes,
 * progress arc, and chapter tooltips.
 */

import { CHAPTER_METADATA } from '../config/settings.js';

export class TimelineRing {
  constructor(container, timeline) {
    this.container = container;
    this.timeline = timeline;
    this.chapters = CHAPTER_METADATA;
    this.currentIndex = 0;
    this.progress = 0;

    this.el = document.createElement('div');
    this.el.className = 'timeline-ring-container';
    this.container.appendChild(this.el);

    this.render();
    this.bindEvents();
  }

  render() {
    const size = 180;
    const center = size / 2;
    const radius = 68;

    let nodesHtml = '';
    this.chapters.forEach((ch, idx) => {
      const angle = (idx / this.chapters.length) * Math.PI * 2 - Math.PI / 2;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      nodesHtml += `
        <div class="ring-node ${idx === 0 ? 'active' : ''}" 
             data-index="${idx}" 
             style="left: ${x}px; top: ${y}px;"
             title="${ch.id}. ${ch.title} — ${ch.subtitle}">
          <span class="node-dot"></span>
        </div>
      `;
    });

    this.el.innerHTML = `
      <div class="ring-inner">
        <svg class="ring-svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
          <!-- Decorative mandala rings -->
          <circle cx="${center}" cy="${center}" r="${radius + 14}" class="mandala-outer-ring" stroke-dasharray="4 6"/>
          <circle cx="${center}" cy="${center}" r="${radius}" class="ring-track"/>
          <!-- Active chapter progress arc -->
          <circle id="ring-progress-arc" cx="${center}" cy="${center}" r="${radius}" class="ring-progress"
                  stroke-dasharray="427" stroke-dashoffset="427"/>
          <circle cx="${center}" cy="${center}" r="${radius - 16}" class="mandala-inner-ring" stroke-dasharray="2 4"/>
        </svg>
        <div class="ring-nodes-layer">
          ${nodesHtml}
        </div>
        <div class="ring-center-info">
          <div class="ring-chapter-num" id="ring-ch-num">00</div>
          <div class="ring-chapter-title" id="ring-ch-title">The Void</div>
        </div>
      </div>
      <div class="ring-tooltip" id="ring-tooltip"></div>
    `;

    this.progressArc = this.el.querySelector('#ring-progress-arc');
    this.chNumEl = this.el.querySelector('#ring-ch-num');
    this.chTitleEl = this.el.querySelector('#ring-ch-title');
    this.tooltipEl = this.el.querySelector('#ring-tooltip');
  }

  bindEvents() {
    const nodeEls = this.el.querySelectorAll('.ring-node');
    nodeEls.forEach(node => {
      const idx = parseInt(node.getAttribute('data-index'), 10);
      node.addEventListener('click', () => {
        this.timeline.skipToChapter(idx);
      });

      node.addEventListener('mouseenter', (e) => {
        const ch = this.chapters[idx];
        this.tooltipEl.textContent = `${ch.id}: ${ch.title}`;
        this.tooltipEl.classList.add('visible');
      });

      node.addEventListener('mouseleave', () => {
        this.tooltipEl.classList.remove('visible');
      });
    });

    this.timeline.on('chapterChange', ({ chapter, index }) => {
      this.currentIndex = index;
      nodeEls.forEach((n, i) => {
        n.classList.toggle('active', i === index);
        n.classList.toggle('passed', i < index);
      });
      if (this.chNumEl) {
        this.chNumEl.textContent = index < 10 ? `0${index}` : `${index}`;
      }
      if (this.chTitleEl) {
        this.chTitleEl.textContent = chapter.title;
      }
    });

    this.timeline.on('timeUpdate', ({ progress }) => {
      this.progress = progress;
      if (this.progressArc) {
        const circumference = 427;
        const offset = circumference * (1 - progress);
        this.progressArc.style.strokeDashoffset = offset;
      }
    });
  }
}
