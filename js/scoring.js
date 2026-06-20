// scoring.js - Score tracking, high score persistence, and score feedback
import { CONFIG } from './config.js';
import { createScorePopup } from './entities.js';

/**
 * Load the high score from localStorage.
 * Returns 0 if localStorage is unavailable, empty, or contains an invalid value.
 */
export function loadHighScore() {
  try {
    const stored = localStorage.getItem(CONFIG.storage.highScoreKey);
    if (stored === null) return 0;
    const parsed = parseInt(stored, 10);
    if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
      return 0;
    }
    return parsed;
  } catch {
    return 0;
  }
}

/**
 * Save the high score to localStorage.
 * Fails silently if storage is unavailable (e.g., quota exceeded, private browsing).
 */
export function saveHighScore(score) {
  try {
    localStorage.setItem(CONFIG.storage.highScoreKey, String(score));
  } catch {
    // Fail silently per requirement 6.4
  }
}

/**
 * Update scoring each frame. Checks if any unscorable pipe pair has been passed
 * by the ghost, increments score, updates speed multiplier, creates popup, and
 * triggers the score pulse animation.
 *
 * Pipes come in pairs (top/bottom) sharing the same x position and gapCenter.
 * We only count score once per pair by marking all pipes at the same x as scored.
 */
export function updateScoring(gameState) {
  const ghost = gameState.entities.ghost;
  if (!ghost) return;

  const activePipes = gameState.entities.pipePool
    ? gameState.entities.pipePool.getActive()
    : [];

  for (let i = 0; i < activePipes.length; i++) {
    const pipe = activePipes[i];

    // Skip already scored pipes
    if (pipe.scored) continue;

    // Score condition: pipe right edge has crossed ghost x position
    const pipeRightEdge = pipe.x + pipe.width;
    if (pipeRightEdge < ghost.x) {
      // Mark this pipe as scored
      pipe.scored = true;

      // Also mark the paired pipe (same x position) to avoid double counting
      for (let j = 0; j < activePipes.length; j++) {
        if (j !== i && activePipes[j].x === pipe.x && !activePipes[j].scored) {
          activePipes[j].scored = true;
        }
      }

      // Increment score
      gameState.score++;

      // Update high score if current exceeds it
      if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
      }

      // Update speed multiplier: min(1.0 + score × 0.02, 2.0)
      gameState.speedMultiplier = Math.min(
        CONFIG.difficulty.startingMultiplier + gameState.score * CONFIG.difficulty.speedIncrementPerPoint,
        CONFIG.difficulty.maxSpeedMultiplier
      );

      // Create score popup at ghost position
      const popup = createScorePopup();
      popup.x = ghost.x;
      popup.y = ghost.y;
      gameState.entities.scorePopups.push(popup);

      // Trigger score pulse animation on the score bar
      gameState.scorePulse.active = true;
      gameState.scorePulse.timer = CONFIG.scoreBar.pulseDuration;
      gameState.scorePulse.scale = CONFIG.scoreBar.pulseScale;
    }
  }
}
