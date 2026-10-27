/**
 * KALPA - "Ask Naad" Guide Interaction Modal
 * Push-to-talk voice recognition or text inquiry with primordial sound guide Naad.
 */

export class GuideModal {
  constructor(container, narrationEngine) {
    this.container = container;
    this.narrationEngine = narrationEngine;
    this.isOpen = false;
    this.isListening = false;

    this.speechRecognition = null;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.speechRecognition = new SpeechRecognition();
      this.speechRecognition.continuous = false;
      this.speechRecognition.interimResults = false;
      this.speechRecognition.lang = 'en-US';
    }

    this.el = document.createElement('div');
    this.el.className = 'guide-modal-backdrop';
    this.el.innerHTML = `
      <div class="guide-modal-panel">
        <div class="guide-modal-header">
          <div class="guide-title">
            <span class="guide-icon">✧</span>
            <h3>Commune with NAAD</h3>
          </div>
          <button class="guide-close-btn" id="guide-close-btn">✕</button>
        </div>
        <div class="guide-modal-body">
          <p class="guide-prompt">"I am Naad, the first sound. Ask me of the cosmos, the oceans, the avatars, or the eternal Yugas."</p>
          <div class="guide-chat-log" id="guide-chat-log">
            <div class="chat-bubble naad">I listen to the vibrations of your inquiry. Speak or type below.</div>
          </div>
          <div class="guide-input-row">
            <input type="text" id="guide-text-input" placeholder="Ask about creation, science, or purana..." />
            <button id="guide-mic-btn" class="guide-mic-btn" title="Push to Talk">🎙</button>
            <button id="guide-send-btn" class="guide-send-btn">Ask</button>
          </div>
        </div>
      </div>
    `;
    this.container.appendChild(this.el);

    this.bindEvents();
  }

  open() {
    this.isOpen = true;
    this.el.classList.add('open');
  }

  close() {
    this.isOpen = false;
    this.el.classList.remove('open');
    if (this.isListening && this.speechRecognition) {
      this.speechRecognition.stop();
      this.isListening = false;
    }
  }

  bindEvents() {
    this.el.querySelector('#guide-close-btn').addEventListener('click', () => this.close());
    const input = this.el.querySelector('#guide-text-input');
    const sendBtn = this.el.querySelector('#guide-send-btn');
    const micBtn = this.el.querySelector('#guide-mic-btn');

    sendBtn.addEventListener('click', () => {
      const q = input.value.trim();
      if (q) {
        this.ask(q);
        input.value = '';
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const q = input.value.trim();
        if (q) {
          this.ask(q);
          input.value = '';
        }
      }
    });

    if (this.speechRecognition) {
      micBtn.addEventListener('click', () => {
        if (!this.isListening) {
          micBtn.classList.add('listening');
          this.speechRecognition.start();
          this.isListening = true;
        } else {
          this.speechRecognition.stop();
          micBtn.classList.remove('listening');
          this.isListening = false;
        }
      });

      this.speechRecognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        micBtn.classList.remove('listening');
        this.isListening = false;
        input.value = transcript;
        this.ask(transcript);
      };

      this.speechRecognition.onerror = () => {
        micBtn.classList.remove('listening');
        this.isListening = false;
      };
    } else {
      micBtn.style.display = 'none';
    }
  }

  appendMessage(sender, text) {
    const log = this.el.querySelector('#guide-chat-log');
    const msg = document.createElement('div');
    msg.className = `chat-bubble ${sender}`;
    msg.textContent = text;
    log.appendChild(msg);
    log.scrollTop = log.scrollHeight;
  }

  async ask(question) {
    this.appendMessage('user', question);

    // Call custom endpoint if configured in window.ENV or fallback to wisdom oracle
    const answer = await this.getNaadResponse(question);
    this.appendMessage('naad', answer);

    // Speak in character using NarrationEngine
    if (this.narrationEngine && this.narrationEngine.adapter) {
      this.narrationEngine.adapter.speak(answer);
    }
  }

  async getNaadResponse(query) {
    const q = query.toLowerCase();

    if (q.includes('vishnu') || q.includes('shesha') || q.includes('ocean')) {
      return "Upon the causal ocean of milk, Lord Vishnu rests in Yoga Nidra. Ananta Shesha, the serpent of infinity, shelters creation before time unfolds.";
    }
    if (q.includes('lotus') || q.includes('brahma')) {
      return "The lotus springing from Vishnu's navel represents the emergence of multi-dimensional space. Seated upon it, Brahma generates the cosmic architecture.";
    }
    if (q.includes('theia') || q.includes('moon')) {
      return "Four point five billion years ago, Theia collided with proto-Earth. The incandescent debris coalesced into our Moon, stabilizing Earth's axial tilt and life-giving tides.";
    }
    if (q.includes('avatar') || q.includes('matsya') || q.includes('kalki') || q.includes('evolution')) {
      return "The Dashavatara mirrors the ascent of living forms: from aquatic Matsya, to amphibian Kurma, terrestrial Varaha, and conscious humanity. It is an ancient poetic contemplation on the continuum of life.";
    }
    if (q.includes('yuga') || q.includes('kalpa') || q.includes('age')) {
      return "A kalpa is 4.32 billion solar years—the day of Brahma. Remarkably, modern astrophysics measures Earth's age at 4.54 billion years, an extraordinary resonance across deep time.";
    }
    return "All matter was forged in the hearts of dying stars; all consciousness resonates with the primordial vibration. Look closely into the void, and you will see yourself.";
  }
}
