/**
 * KALPA - Chapter Timeline Manager
 * Orchestrates chapter flow (0-11), auto-advance, playback controls (play/pause/skip/replay),
 * cross-dissolve scene transitions, camera choreographies, and narration triggers.
 */

import { CHAPTER_METADATA } from '../config/settings.js';

export class TimelineManager {
  constructor(context) {
    this.context = context; // { scenes, cameraRig, narrationEngine, audioEngine, postProcessing }
    this.chapters = CHAPTER_METADATA;
    this.currentChapterIndex = 0;
    this.isPlaying = false;
    this.chapterTime = 0;
    this.transitioning = false;
    this.transitionProgress = 0;
    this.transitionDuration = 1.8; // seconds

    this.fromScene = null;
    this.toScene = null;

    this.listeners = {
      chapterChange: [],
      timeUpdate: [],
      playStateChange: []
    };
  }

  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }

  getCurrentChapter() {
    return this.chapters[this.currentChapterIndex];
  }

  start() {
    this.isPlaying = true;
    this.chapterTime = 0;
    this.loadAndEnterChapter(0);
    this.emit('playStateChange', { isPlaying: true });
  }

  pause() {
    this.isPlaying = false;
    this.emit('playStateChange', { isPlaying: false });
  }

  resume() {
    this.isPlaying = true;
    this.emit('playStateChange', { isPlaying: true });
  }

  togglePlay() {
    if (this.isPlaying) this.pause();
    else this.resume();
  }

  skipToChapter(targetIndex) {
    if (targetIndex < 0 || targetIndex >= this.chapters.length) return;
    this.crossDissolveTo(targetIndex);
  }

  replayChapter() {
    this.chapterTime = 0;
    const current = this.currentChapterIndex;
    const scene = this.context.scenes[current] || this.context.scenes[0];
    if (scene) {
      scene.enter();
    }
    if (this.context.cameraRig) {
      this.context.cameraRig.setPathKeyframe(current);
    }
    if (this.context.narrationEngine) {
      this.context.narrationEngine.playChapter(current);
    }
    this.emit('chapterChange', { chapter: this.getCurrentChapter(), index: current });
  }

  crossDissolveTo(targetIndex) {
    if (this.transitioning || targetIndex === this.currentChapterIndex) return;

    this.transitioning = true;
    this.transitionProgress = 0;

    const currentScene = this.context.scenes[this.currentChapterIndex] || this.context.scenes[0];
    const targetScene = this.context.scenes[targetIndex] || this.context.scenes[0];

    this.fromScene = currentScene;
    this.toScene = targetScene;

    if (this.toScene) {
      this.toScene.enter();
      this.toScene.setFade(0.001);
    }

    this.currentChapterIndex = targetIndex;
    this.chapterTime = 0;

    // Direct camera and narration
    if (this.context.cameraRig) {
      this.context.cameraRig.setPathKeyframe(targetIndex);
    }
    if (this.context.narrationEngine) {
      this.context.narrationEngine.playChapter(targetIndex);
    }

    this.emit('chapterChange', { chapter: this.getCurrentChapter(), index: targetIndex });
  }

  loadAndEnterChapter(index) {
    this.currentChapterIndex = index;
    this.chapterTime = 0;

    const scene = this.context.scenes[index] || this.context.scenes[0];
    if (scene) {
      scene.enter();
      scene.setFade(1.0);
    }

    if (this.context.cameraRig) {
      this.context.cameraRig.setPathKeyframe(index);
    }
    if (this.context.narrationEngine) {
      this.context.narrationEngine.playChapter(index);
    }

    this.emit('chapterChange', { chapter: this.getCurrentChapter(), index });
  }

  update(deltaTime) {
    if (!this.isPlaying) return;

    // Handle cross-dissolve transition
    if (this.transitioning) {
      this.transitionProgress += deltaTime / this.transitionDuration;
      if (this.transitionProgress >= 1.0) {
        this.transitionProgress = 1.0;
        this.transitioning = false;
        if (this.fromScene && this.fromScene !== this.toScene) {
          this.fromScene.exit();
        }
        if (this.toScene) {
          this.toScene.setFade(1.0);
        }
      } else {
        // Smooth sine ease
        const ease = 0.5 - 0.5 * Math.cos(this.transitionProgress * Math.PI);
        if (this.fromScene && this.fromScene !== this.toScene) {
          this.fromScene.setFade(1.0 - ease);
        }
        if (this.toScene) {
          this.toScene.setFade(ease);
        }
      }
    }

    // Auto-advance progress
    this.chapterTime += deltaTime;
    const currentMeta = this.getCurrentChapter();
    const duration = currentMeta.duration || 60;

    this.emit('timeUpdate', {
      time: this.chapterTime,
      duration: duration,
      progress: Math.min(1.0, this.chapterTime / duration)
    });

    if (this.chapterTime >= duration && !this.transitioning) {
      // Auto-advance to next chapter if available
      if (this.currentChapterIndex < this.chapters.length - 1) {
        this.crossDissolveTo(this.currentChapterIndex + 1);
      } else {
        // Reached end of journey
        this.pause();
      }
    }
  }
}
