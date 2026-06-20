// audio.js - Web Audio API sound loading and playback
import { CONFIG } from './config.js';

let audioContext = null;
let audioEnabled = true;
let jumpBuffer = null;
let gameOverBuffer = null;
let currentJumpSource = null;

/**
 * Initialize the audio system. Creates an AudioContext and preloads
 * sound buffers. Safe to call multiple times; subsequent calls are no-ops.
 */
export function initAudio() {
  try {
    if (audioContext) return;
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    preloadBuffers();
  } catch (e) {
    audioEnabled = false;
  }
}

/**
 * Resume the AudioContext on first user gesture to comply with
 * browser autoplay policies. Should be called from a click/keypress handler.
 */
export function resumeAudioContext() {
  try {
    if (!audioContext) {
      initAudio();
    }
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume();
    }
  } catch (e) {
    audioEnabled = false;
  }
}

/**
 * Play jump.wav. If a previous jump sound is still playing, stop it
 * first and restart from the beginning (no overlapping instances).
 */
export function playJump() {
  if (!audioEnabled || !audioContext || !jumpBuffer) return;
  try {
    // Stop any currently playing jump sound
    if (currentJumpSource) {
      currentJumpSource.stop();
      currentJumpSource = null;
    }

    const source = audioContext.createBufferSource();
    source.buffer = jumpBuffer;
    source.connect(audioContext.destination);
    source.onended = () => {
      if (currentJumpSource === source) {
        currentJumpSource = null;
      }
    };
    source.start(0);
    currentJumpSource = source;
  } catch (e) {
    audioEnabled = false;
  }
}

/**
 * Play game_over.wav as a one-shot sound. Does not track or stop
 * previous instances.
 */
export function playGameOver() {
  if (!audioEnabled || !audioContext || !gameOverBuffer) return;
  try {
    const source = audioContext.createBufferSource();
    source.buffer = gameOverBuffer;
    source.connect(audioContext.destination);
    source.start(0);
  } catch (e) {
    audioEnabled = false;
  }
}

/**
 * Play a short scoring tone using an OscillatorNode with a frequency
 * sweep from 600Hz to 900Hz over 100ms, then auto-stop.
 */
export function playScoreTone() {
  if (!audioEnabled || !audioContext) return;
  try {
    const { startFrequency, endFrequency, duration } = CONFIG.audio.scoreTone;
    const durationSec = duration / 1000;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(startFrequency, audioContext.currentTime);
    oscillator.frequency.linearRampToValueAtTime(
      endFrequency,
      audioContext.currentTime + durationSec
    );

    // Brief fade-out to avoid click at end
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + durationSec);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + durationSec);
  } catch (e) {
    audioEnabled = false;
  }
}

/**
 * Preload audio buffers from wav files. Fetches and decodes both
 * jump.wav and game_over.wav into AudioBuffer objects.
 */
async function preloadBuffers() {
  try {
    const [jumpResponse, gameOverResponse] = await Promise.all([
      fetch(CONFIG.audio.jumpFile),
      fetch(CONFIG.audio.gameOverFile),
    ]);

    if (!jumpResponse.ok || !gameOverResponse.ok) {
      audioEnabled = false;
      return;
    }

    const [jumpData, gameOverData] = await Promise.all([
      jumpResponse.arrayBuffer(),
      gameOverResponse.arrayBuffer(),
    ]);

    const [decodedJump, decodedGameOver] = await Promise.all([
      audioContext.decodeAudioData(jumpData),
      audioContext.decodeAudioData(gameOverData),
    ]);

    jumpBuffer = decodedJump;
    gameOverBuffer = decodedGameOver;
  } catch (e) {
    audioEnabled = false;
  }
}
