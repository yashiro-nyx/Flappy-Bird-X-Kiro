// engine.js - Game loop and state transition orchestration
import { CONFIG } from './config.js';
import { gameState, triggerGameOver } from './state.js';
import { updatePhysics, generatePipes, cleanupPipes, applyFlap } from './physics.js';
import { checkCollisions } from './collision.js';
import { updateScoring, saveHighScore } from './scoring.js';
import { render } from './renderer.js';
import { playGameOver } from './audio.js';
import { resetFrameInput } from './input.js';

let lastTimestamp = 0;
let animationFrameId = null;
let consecutiveSlowFrames = 0;

/**
 * Main game loop tick. Called every frame via requestAnimationFrame.
 * Calculates delta time, updates game systems based on current state,
 * decrements timers, and renders.
 *
 * @param {number} timestamp - DOMHighResTimeStamp from requestAnimationFrame
 */
function tick(timestamp) {
  // Schedule next frame immediately
  animationFrameId = requestAnimationFrame(tick);

  // Calculate delta time
  if (lastTimestamp === 0) {
    lastTimestamp = timestamp;
  }
  const rawDt = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  // Clamp dt to max 3× frame duration to prevent physics explosion
  const maxDt = CONFIG.physics.frameTime * 3;
  const dt = Math.min(rawDt, maxDt);

  // Performance monitoring: track consecutive slow frames
  if (rawDt > CONFIG.performance.slowFrameThreshold) {
    consecutiveSlowFrames++;
    if (consecutiveSlowFrames >= CONFIG.performance.slowFrameAlertCount) {
      console.warn(
        `Performance warning: ${consecutiveSlowFrames} consecutive slow frames detected (>${CONFIG.performance.slowFrameThreshold}ms)`
      );
      consecutiveSlowFrames = 0;
    }
  } else {
    consecutiveSlowFrames = 0;
  }

  // Reset per-frame input flags
  resetFrameInput();

  // Increment frame count
  gameState.frameCount++;

  // --- State-specific updates ---
  if (gameState.current === 'playing') {
    updatePlaying(dt);
  } else if (gameState.current === 'menu') {
    updateMenu(dt);
  }
  // Paused and gameOver: no physics/scoring updates

  // --- Decrement timers (every frame regardless of state) ---
  updateTimers(dt);

  // --- Render every frame regardless of state ---
  render(gameState);
}

/**
 * Update logic for the 'playing' state.
 * Runs physics, pipe generation/cleanup, collision detection, and scoring.
 */
function updatePlaying(dt) {
  const ghost = gameState.entities.ghost;

  // Update physics (gravity, scrolling, particles, popups)
  updatePhysics(gameState, dt);

  // Generate and cleanup pipes
  generatePipes(gameState);
  cleanupPipes(gameState);

  // Emit trail particles from ghost center-rear every N frames
  emitParticle();

  // Check collisions
  if (ghost) {
    const activePipes = gameState.entities.pipePool
      ? gameState.entities.pipePool.getActive()
      : [];
    const collided = checkCollisions(ghost, activePipes);

    if (collided) {
      handleCollision();
      return; // Skip scoring this frame
    }
  }

  // Update scoring
  updateScoring(gameState);
}

/**
 * Update logic for the 'menu' state.
 * Animates the ghost bobbing up and down.
 */
function updateMenu(dt) {
  const ghost = gameState.entities.ghost;
  if (!ghost) return;

  ghost.bobTimer += dt;
  ghost.bobOffset =
    Math.sin((ghost.bobTimer / CONFIG.menu.bobPeriod) * Math.PI * 2) *
    CONFIG.menu.bobAmplitude;
}

/**
 * Handle collision response:
 * 1. Trigger game over state (sets state, starts lockout and shake timers)
 * 2. Set invincibility on ghost
 * 3. Play game over sound
 * 4. Save high score if applicable
 */
function handleCollision() {
  const ghost = gameState.entities.ghost;

  // Trigger game over (sets state to 'gameOver', starts inputLockout and screenShake)
  triggerGameOver();

  // Set ghost invincibility
  if (ghost) {
    ghost.isInvincible = true;
    ghost.invincibleTimer = CONFIG.invincibility.duration;
  }

  // Play game over sound
  playGameOver();

  // Save high score if current score matches or exceeds it
  if (gameState.score >= gameState.highScore && gameState.score > 0) {
    saveHighScore(gameState.highScore);
  }
}

/**
 * Emit a trail particle from the ghost's center-rear every emitInterval frames.
 */
function emitParticle() {
  const ghost = gameState.entities.ghost;
  const pool = gameState.entities.particlePool;
  if (!ghost || !pool) return;

  if (gameState.frameCount % CONFIG.particles.emitInterval === 0) {
    const particle = pool.acquire();
    // Position at ghost's center-rear (left side center)
    particle.x = ghost.x;
    particle.y = ghost.y + ghost.height / 2;
    particle.radius =
      CONFIG.particles.radius.min +
      Math.random() * (CONFIG.particles.radius.max - CONFIG.particles.radius.min);
    particle.opacity = CONFIG.particles.initialOpacity;
    particle.age = 0;
    particle.velocityX = CONFIG.particles.driftSpeed;
    particle.velocityY = 0;
  }
}

/**
 * Decrement all active timers each frame regardless of game state.
 * Handles: inputLockout, screenShake, invincibility, scorePulse.
 */
function updateTimers(dt) {
  // Input lockout timer
  if (gameState.inputLockoutTimer > 0) {
    gameState.inputLockoutTimer -= dt;
    if (gameState.inputLockoutTimer < 0) {
      gameState.inputLockoutTimer = 0;
    }
  }

  // Screen shake timer and displacement calculation
  if (gameState.screenShake.active) {
    gameState.screenShake.timer -= dt;
    if (gameState.screenShake.timer <= 0) {
      gameState.screenShake.active = false;
      gameState.screenShake.timer = 0;
      gameState.screenShake.offsetX = 0;
      gameState.screenShake.offsetY = 0;
    } else {
      // Decaying sinusoidal displacement
      const progress = gameState.screenShake.timer / CONFIG.screenShake.duration;
      const decay = progress; // Linear decay from 1→0
      const displacement = CONFIG.screenShake.maxDisplacement * decay;
      gameState.screenShake.offsetX = (Math.random() * 2 - 1) * displacement;
      gameState.screenShake.offsetY = (Math.random() * 2 - 1) * displacement;
    }
  }

  // Ghost invincibility timer and flash toggle
  const ghost = gameState.entities.ghost;
  if (ghost && ghost.isInvincible) {
    ghost.invincibleTimer -= dt;
    if (ghost.invincibleTimer <= 0) {
      ghost.isInvincible = false;
      ghost.invincibleTimer = 0;
      ghost.flashVisible = true;
    } else {
      // Toggle flash visibility at flashInterval
      const elapsed = CONFIG.invincibility.duration - ghost.invincibleTimer;
      ghost.flashVisible =
        Math.floor(elapsed / CONFIG.invincibility.flashInterval) % 2 === 0;
    }
  }

  // Score pulse timer and scale interpolation
  if (gameState.scorePulse.active) {
    gameState.scorePulse.timer -= dt;
    if (gameState.scorePulse.timer <= 0) {
      gameState.scorePulse.active = false;
      gameState.scorePulse.timer = 0;
      gameState.scorePulse.scale = 1;
    } else {
      // Linear interpolation from pulseScale back to 1.0 over pulseDuration
      const progress = gameState.scorePulse.timer / CONFIG.scoreBar.pulseDuration;
      gameState.scorePulse.scale =
        1 + (CONFIG.scoreBar.pulseScale - 1) * progress;
    }
  }
}

/**
 * Start the game loop. Kicks off the requestAnimationFrame cycle.
 * Safe to call multiple times; resets timestamp tracking on each call.
 */
export function startLoop() {
  lastTimestamp = 0;
  consecutiveSlowFrames = 0;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  animationFrameId = requestAnimationFrame(tick);
}

/**
 * Stop the game loop. Cancels the pending animation frame.
 */
export function stopLoop() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}
