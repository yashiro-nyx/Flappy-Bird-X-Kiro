// main.js - Application entry point
import { initCanvas } from './canvas.js';
import { CONFIG } from './config.js';
import { gameState } from './state.js';
import { createGhost, createCloud, pipePool, particlePool } from './entities.js';
import { loadHighScore } from './scoring.js';
import { initAudio, resumeAudioContext, playJump } from './audio.js';
import { initInput } from './input.js';
import { startLoop } from './engine.js';
import { applyFlap } from './physics.js';

// --- Initialize canvas ---
const { canvas } = initCanvas();

// --- Load ghost sprite with fallback ---
const ghost = createGhost();
const spriteImage = new Image();
spriteImage.src = 'assets/ghosty.png';
spriteImage.onload = () => {
  ghost.sprite = spriteImage;
};
spriteImage.onerror = () => {
  // Leave ghost.sprite as null — renderer draws a white circle fallback
};

// --- Initialize audio system ---
initAudio();

// --- Load high score from localStorage ---
gameState.highScore = loadHighScore();

// --- Create initial game state with entity pools ---
gameState.entities.ghost = ghost;
gameState.entities.pipePool = pipePool;
gameState.entities.particlePool = particlePool;

// --- Initialize input handlers ---
initInput({
  canvas,
  onFlap() {
    resumeAudioContext();
    applyFlap(gameState.entities.ghost);
    playJump();
  },
});

// --- Generate initial clouds ---
const cloudCount =
  CONFIG.clouds.count.min +
  Math.floor(Math.random() * (CONFIG.clouds.count.max - CONFIG.clouds.count.min + 1));

const clouds = [];
for (let i = 0; i < cloudCount; i++) {
  clouds.push(createCloud());
}
gameState.entities.clouds = clouds;

// --- Start the game loop ---
startLoop();
