// input.js - Keyboard, mouse, and touch event handling
import { gameState, startGame, pauseGame, resumeGame, resetGame } from './state.js';
import { CONFIG } from './config.js';

let flapRequestedThisFrame = false;
let callbacks = {};

/**
 * Initialize input event listeners.
 * @param {Object} cbs - Callback functions provided by the engine/main module.
 * @param {Function} cbs.onFlap - Called when a flap action is triggered.
 * @param {Function} [cbs.onRestart] - Called after resetGame on restart (for additional engine reset logic).
 * @param {HTMLElement} [cbs.canvas] - The canvas element to attach click/touch listeners to. Defaults to document.
 */
export function initInput(cbs) {
  callbacks = cbs || {};
  const target = callbacks.canvas || document;

  // Keyboard events
  document.addEventListener('keydown', handleKeyDown);

  // Mouse click
  target.addEventListener('click', handleClick);
  // Also listen on document if target is canvas, so clicks outside canvas still work
  // Actually, per game design, only canvas clicks should count — keep it on target.

  // Touch events (for mobile)
  target.addEventListener('touchstart', handleTouchStart, { passive: false });

  // Visibility change for auto-pause
  document.addEventListener('visibilitychange', handleVisibilityChange);
}

/**
 * Reset the per-frame flap flag.
 * Should be called once per frame by the engine before processing input.
 */
export function resetFrameInput() {
  flapRequestedThisFrame = false;
}

/**
 * Handle keydown events.
 */
function handleKeyDown(e) {
  const key = e.code || e.key;

  // Pause/Resume toggle: Escape or P key
  if (key === 'Escape' || key === 'KeyP' || key === 'p' || key === 'P') {
    e.preventDefault();
    handlePauseToggle();
    return;
  }

  // Space key — flap/start/restart action
  if (key === 'Space' || key === ' ') {
    e.preventDefault();
    handleAction();
    return;
  }
}

/**
 * Handle mouse click events.
 */
function handleClick(e) {
  e.preventDefault();
  handleAction();
}

/**
 * Handle touch start events.
 */
function handleTouchStart(e) {
  e.preventDefault();
  handleAction();
}

/**
 * Handle visibility change for auto-pause on tab blur.
 */
function handleVisibilityChange() {
  if (document.hidden && gameState.current === 'playing') {
    pauseGame();
  }
}

/**
 * Toggle pause/resume.
 * Only Escape/P can pause and resume. Space/Click cannot resume.
 */
function handlePauseToggle() {
  if (gameState.current === 'playing') {
    pauseGame();
  } else if (gameState.current === 'paused') {
    resumeGame();
  }
}

/**
 * Handle the primary action (Space/Click/Touch).
 * Dispatches based on current game state.
 * - Menu: start the game
 * - Playing: flap (max one per frame)
 * - Paused: IGNORED (only Escape/P can resume)
 * - GameOver: restart (after input lockout expires)
 */
function handleAction() {
  const state = gameState.current;

  if (state === 'menu') {
    startGame();
    // Also trigger a flap on start so ghost moves immediately
    if (!flapRequestedThisFrame && callbacks.onFlap) {
      flapRequestedThisFrame = true;
      callbacks.onFlap();
    }
    return;
  }

  if (state === 'playing') {
    // Process at most one flap per frame
    if (!flapRequestedThisFrame) {
      flapRequestedThisFrame = true;
      if (callbacks.onFlap) {
        callbacks.onFlap();
      }
    }
    return;
  }

  if (state === 'paused') {
    // Ignore Space/Click while paused to prevent accidental flap on resume
    return;
  }

  if (state === 'gameOver') {
    // Only allow restart after input lockout period has expired
    if (gameState.inputLockoutTimer <= 0) {
      resetGame();
      // Notify engine of restart for additional setup (e.g., reset ghost position)
      if (callbacks.onRestart) {
        callbacks.onRestart();
      }
    }
    return;
  }
}

/**
 * Clean up all event listeners.
 * Call this if the game needs to be fully torn down.
 */
export function destroyInput() {
  const target = callbacks.canvas || document;
  document.removeEventListener('keydown', handleKeyDown);
  target.removeEventListener('click', handleClick);
  target.removeEventListener('touchstart', handleTouchStart);
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  callbacks = {};
}
