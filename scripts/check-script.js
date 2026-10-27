#!/usr/bin/env node
/**
 * KALPA - Script Validator (npm run check:script)
 * Validates /src/narration/script.json for:
 *  - Missing languages per track
 *  - Overlapping cue time ranges within a chapter
 *  - Lines exceeding 38 characters per line (wrap limit)
 *  - Cues missing verify flag
 *  - Sanskrit cues missing transliteration
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = resolve(__dirname, '../src/narration/script.json');
const WRAP_LIMIT = 38;
const REQUIRED_LANGS = { science: ['en', 'hi'], purana: ['en', 'hi', 'sa', 'sa_translit'] };

let errors = 0;
let warnings = 0;

function error(msg) { console.error(`  ✗ ERROR: ${msg}`); errors++; }
function warn(msg)  { console.warn(`  ⚠ WARN:  ${msg}`); warnings++; }
function ok(msg)    { console.log(`  ✓ ${msg}`); }

function checkLineLength(text, cueId, track, lang) {
  if (!text) return;
  const lines = text.split(/\n/);
  lines.forEach((line, i) => {
    if (line.length > WRAP_LIMIT) {
      warn(`[${cueId}] ${track}/${lang} line ${i + 1} is ${line.length} chars (limit ${WRAP_LIMIT}): "${line.substring(0, 50)}…"`);
    }
  });
}

function checkOverlaps(cues, chapterId) {
  const sorted = [...cues].sort((a, b) => a.start - b.start);
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].end > sorted[i + 1].start) {
      error(`[Chapter ${chapterId}] Cues "${sorted[i].id}" and "${sorted[i+1].id}" overlap: ${sorted[i].end}s > ${sorted[i+1].start}s`);
    }
  }
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  KALPA Narration Script Validator');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

let script;
try {
  script = JSON.parse(readFileSync(SCRIPT_PATH, 'utf-8'));
  ok(`Loaded script v${script.version || '?'}`);
} catch (e) {
  console.error(`FATAL: Cannot read script.json — ${e.message}`);
  process.exit(1);
}

const chapters = script.chapters || {};
let totalCues = 0;

for (const [chapterId, chapter] of Object.entries(chapters)) {
  const cues = chapter.cues || [];
  console.log(`\n── Chapter ${chapterId} (${cues.length} cues) ──`);

  if (!cues.length) {
    warn(`Chapter ${chapterId} has no cues`);
    continue;
  }

  checkOverlaps(cues, chapterId);

  for (const cue of cues) {
    totalCues++;

    // Timing sanity
    if (typeof cue.start !== 'number' || typeof cue.end !== 'number') {
      error(`[${cue.id}] Missing start/end timing`);
    } else if (cue.end <= cue.start) {
      error(`[${cue.id}] end (${cue.end}) must be > start (${cue.start})`);
    }

    if (!cue.verify) {
      warn(`[${cue.id}] Missing verify:true flag`);
    }

    // Per-track per-language checks
    for (const [trackName, reqLangs] of Object.entries(REQUIRED_LANGS)) {
      const trackData = cue.tracks?.[trackName];
      if (!trackData) {
        warn(`[${cue.id}] Track "${trackName}" is missing entirely`);
        continue;
      }
      for (const lang of reqLangs) {
        const text = trackData[lang];
        if (!text) {
          warn(`[${cue.id}] Track "${trackName}" missing language "${lang}"`);
        } else {
          checkLineLength(text, cue.id, trackName, lang);
        }
      }
      // Sanskrit without transliteration
      if (trackName === 'purana' && trackData.sa && !trackData.sa_translit) {
        warn(`[${cue.id}] Purana has sa but no sa_translit`);
      }
    }
  }
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`  Total cues: ${totalCues}`);
console.log(`  Errors:     ${errors}`);
console.log(`  Warnings:   ${warnings}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (errors > 0) {
  console.error('Script validation FAILED. Fix errors above before building.\n');
  process.exit(1);
} else {
  console.log('Script validation PASSED.\n');
  process.exit(0);
}
