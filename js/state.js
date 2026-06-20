// state.js - Game state machine and transition functions
import { CONFIG } from './config.js';

/**
 * Central game state object.
 * The entities container is populated by main.js during initialization.
 */
export const gameState = {
  current: 'menu', // 'menu' | 'playing' | 'paused' | 'gameOver'
  score: 0,
  highScore: 0,
  speedMultiplier: CONFIG.difficulty.startingMultiplier,
  frameCount: 0,
  inputLockoutTimer: 0,
  screenShake: {
    active: false,
    timer: 0,
    offsetX: 0,
    offsetY: 0,
  },
  scorePulse: {
    active: false,
    timer: 0,
    scale: 1,
  },
  entities: {
    ghost: null,
    pipePool: null,
    clouds: [],
    particlePool: null,
    scorePopups: [],
  },
};

/**
 * Transition from Menu to Playing state.
 * Resets score/multiplier and positions ghost at start.
 */
export function startGame() {
  if (gameState.current !== 'menu') return;
  gameState.current = 'playing';
  gameState.score = 0;
  gameState.speedMultiplier = CONFIG.difficulty.startingMultiplier;
  gameState.frameCount = 0;
  gameState.inputLockoutTimer = 0;
  gameState.screenShake.active = false;
  gameState.screenShake.timer = 0;
  gameState.screenShake.offsetX = 0;
  gameState.screenShake.offsetY = 0;
  gameState.scorePulse.active = false;
  gameState.scorePulse.timer = 0;
  gameState.scorePulse.scale = 1;

  // Position ghost at starting position
  if (gameState.entities.ghost) {
    gameState.entities.ghost.y = CONFIG.ghost.startY;
    gameState.entities.ghost.velocity = 0;
    gameState.entities.ghost.rotation = 0;
    gameState.entities.ghost.isInvincible = false;
    gameState.entities.ghost.invincibleTimer = 0;
  }
}

/**
 * Transition from Playing to Paused state.
 * Halts all physics and scoring updates.
 */
export function pauseGame() {
  if (gameState.current !== 'playing') return;
  gameState.current = 'paused';
}

/**
 * Transition from Paused back to Playing state.
 * Resumes all gameplay updates from the paused state.
 */
export function resumeGame() {
  if (gameState.current !== 'paused') return;
  gameState.current = 'playing';
}

/**
 * Transition from Playing to GameOver state.
 * Stops physics and begins input lockout period.
 */
export function triggerGameOver() {
  if (gameState.current !== 'playing') return;
  gameState.current = 'gameOver';
  gameState.inputLockoutTimer = CONFIG.gameOver.inputLockout;
  gameState.screenShake.active = true;
  gameState.screenShake.timer = CONFIG.screenShake.duration;
}

/**
 * Transition from GameOver to Playing state (restart).
 * Resets score, speed, frame count, and entities but preserves highScore.
 */
export function resetGame() {
  if (gameState.current !== 'gameOver') return;
  gameState.current = 'playing';
  gameState.score = 0;
  gameState.speedMultiplier = CONFIG.difficulty.startingMultiplier;
  gameState.frameCount = 0;
  gameState.inputLockoutTimer = 0;
  gameState.screenShake.active = false;
  gameState.screenShake.timer = 0;
  gameState.screenShake.offsetX = 0;
  gameState.screenShake.offsetY = 0;
  gameState.scorePulse.active = false;
  gameState.scorePulse.timer = 0;
  gameState.scorePulse.scale = 1;

  // Reset entities - release pooled objects, clear popups
  if (gameState.entities.pipePool) {
    gameState.entities.pipePool.releaseAll();
  }
  if (gameState.entities.particlePool) {
    gameState.entities.particlePool.releaseAll();
  }
  gameState.entities.scorePopups = [];

  // Reset ghost to starting position if it exists
  if (gameState.entities.ghost) {
    gameState.entities.ghost.y = CONFIG.ghost.startY;
    gameState.entities.ghost.velocity = 0;
    gameState.entities.ghost.rotation = 0;
    gameState.entities.ghost.isInvincible = false;
    gameState.entities.ghost.invincibleTimer = 0;
  }
}
