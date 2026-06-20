// renderer.js - All Canvas 2D drawing with layered rendering pipeline
import { CONFIG } from './config.js';
import { canvas, ctx } from './canvas.js';

/**
 * Returns a random offset for hand-drawn stroke effects.
 * Each edge gets a 1-3px random offset recalculated each frame.
 */
function handDrawnOffset() {
  const { min, max } = CONFIG.handDrawn.strokeOffset;
  return (Math.random() * (max - min) + min) * (Math.random() < 0.5 ? -1 : 1);
}

/**
 * Draws a rectangle with hand-drawn stroke effect.
 * Each edge gets random 1-3px offsets for a sketchy look.
 */
function strokeRectHandDrawn(x, y, w, h) {
  ctx.beginPath();
  // Top edge
  ctx.moveTo(x + handDrawnOffset(), y + handDrawnOffset());
  ctx.lineTo(x + w + handDrawnOffset(), y + handDrawnOffset());
  // Right edge
  ctx.lineTo(x + w + handDrawnOffset(), y + h + handDrawnOffset());
  // Bottom edge
  ctx.lineTo(x + handDrawnOffset(), y + h + handDrawnOffset());
  // Left edge
  ctx.closePath();
  ctx.stroke();
}

// --- Layer: Background ---

function renderBackground() {
  ctx.fillStyle = CONFIG.colors.background;
  ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
}

// --- Layer: Clouds ---

function renderClouds(clouds) {
  ctx.fillStyle = CONFIG.colors.cloudFill;
  for (let i = 0; i < clouds.length; i++) {
    const cloud = clouds[i];
    ctx.globalAlpha = cloud.opacity;
    ctx.beginPath();
    const radius = cloud.cornerRadius;
    const x = cloud.x;
    const y = cloud.y;
    const w = cloud.width;
    const h = cloud.height;
    // Rounded rectangle path
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.arcTo(x + w, y, x + w, y + radius, radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
    ctx.lineTo(x + radius, y + h);
    ctx.arcTo(x, y + h, x, y + h - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;
}

// --- Layer: Pipes (batched: bodies → caps → strokes) ---

function renderPipes(activePipes) {
  if (activePipes.length === 0) return;

  // Batch 1: All pipe bodies
  ctx.fillStyle = CONFIG.colors.pipeBody;
  for (let i = 0; i < activePipes.length; i++) {
    const pipe = activePipes[i];
    // Top pipe body
    ctx.fillRect(pipe.x, 0, pipe.width, pipe.topHeight);
    // Bottom pipe body
    ctx.fillRect(pipe.x, pipe.bottomY, pipe.width, CONFIG.canvas.height - pipe.bottomY);
  }

  // Batch 2: All pipe caps
  ctx.fillStyle = CONFIG.colors.pipeCap;
  for (let i = 0; i < activePipes.length; i++) {
    const pipe = activePipes[i];
    const capX = pipe.x - (pipe.capWidth - pipe.width) / 2;
    // Top pipe cap (at bottom of top pipe)
    ctx.fillRect(capX, pipe.topHeight - pipe.capHeight, pipe.capWidth, pipe.capHeight);
    // Bottom pipe cap (at top of bottom pipe)
    ctx.fillRect(capX, pipe.bottomY, pipe.capWidth, pipe.capHeight);
  }

  // Batch 3: All pipe strokes (hand-drawn effect)
  ctx.strokeStyle = CONFIG.colors.pipeStroke;
  ctx.lineWidth = 2;
  for (let i = 0; i < activePipes.length; i++) {
    const pipe = activePipes[i];
    const capX = pipe.x - (pipe.capWidth - pipe.width) / 2;
    // Top pipe body stroke
    strokeRectHandDrawn(pipe.x, 0, pipe.width, pipe.topHeight);
    // Bottom pipe body stroke
    strokeRectHandDrawn(pipe.x, pipe.bottomY, pipe.width, CONFIG.canvas.height - pipe.bottomY);
    // Top cap stroke
    strokeRectHandDrawn(capX, pipe.topHeight - pipe.capHeight, pipe.capWidth, pipe.capHeight);
    // Bottom cap stroke
    strokeRectHandDrawn(capX, pipe.bottomY, pipe.capWidth, pipe.capHeight);
  }
}

// --- Layer: Particles ---

function renderParticles(activeParticles) {
  for (let i = 0; i < activeParticles.length; i++) {
    const p = activeParticles[i];
    ctx.globalAlpha = p.opacity;
    ctx.fillStyle = CONFIG.colors.ghostFallback;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;
}

// --- Layer: Ghost ---

function renderGhost(ghost) {
  if (!ghost) return;

  // Invincibility flash: toggle opacity at intervals
  if (ghost.isInvincible) {
    const opacity = ghost.flashVisible
      ? CONFIG.invincibility.maxOpacity
      : CONFIG.invincibility.minOpacity;
    ctx.globalAlpha = opacity;
  }

  const centerX = ghost.x + ghost.width / 2;
  const centerY = ghost.y + ghost.height / 2;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(ghost.rotation);

  if (ghost.sprite && ghost.sprite.complete && ghost.sprite.naturalWidth > 0) {
    // Draw sprite centered
    ctx.drawImage(
      ghost.sprite,
      -ghost.width / 2,
      -ghost.height / 2,
      ghost.width,
      ghost.height
    );
  } else {
    // Fallback: white circle
    ctx.fillStyle = CONFIG.colors.ghostFallback;
    ctx.beginPath();
    ctx.arc(0, 0, CONFIG.ghost.fallbackRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
  ctx.globalAlpha = 1.0;
}

// --- Layer: Score Popups ---

function renderScorePopups(scorePopups) {
  ctx.font = `bold ${CONFIG.scorePopup.fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let i = 0; i < scorePopups.length; i++) {
    const popup = scorePopups[i];
    ctx.globalAlpha = popup.opacity;
    ctx.fillStyle = CONFIG.scorePopup.color;
    ctx.fillText(popup.text, popup.x, popup.y);
  }
  ctx.globalAlpha = 1.0;
}

// --- Layer: Score Bar ---

function renderScoreBar(state) {
  const barHeight = CONFIG.scoreBar.height;
  const barY = CONFIG.canvas.height - barHeight;

  // Background
  ctx.fillStyle = CONFIG.colors.scoreBarBg;
  ctx.fillRect(0, barY, CONFIG.canvas.width, barHeight);

  // Score text with pulse animation
  ctx.textBaseline = 'middle';
  const textY = barY + barHeight / 2;

  // Apply score pulse scaling
  if (state.scorePulse.active) {
    ctx.save();
    ctx.translate(CONFIG.canvas.width / 4, textY);
    ctx.scale(state.scorePulse.scale, state.scorePulse.scale);
    ctx.translate(-CONFIG.canvas.width / 4, -textY);
  }

  ctx.fillStyle = CONFIG.colors.scoreBarText;
  ctx.font = `bold ${CONFIG.scoreBar.fontSize}px sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${state.score}`, 20, textY);

  if (state.scorePulse.active) {
    ctx.restore();
  }

  // High score on the right
  ctx.textAlign = 'right';
  ctx.fillText(`High: ${state.highScore}`, CONFIG.canvas.width - 20, textY);
}

// --- UI Overlays ---

function renderMenuScreen(state) {
  const { width, height } = CONFIG.canvas;
  const ghost = state.entities.ghost;

  // Title
  ctx.fillStyle = CONFIG.colors.scoreBarText;
  ctx.font = `bold ${CONFIG.menu.titleFontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Flappy Kiro', width / 2, height / 3);

  // High score display
  ctx.font = `${CONFIG.scoreBar.fontSize}px sans-serif`;
  ctx.fillText(`Best: ${state.highScore}`, width / 2, height / 3 + 50);

  // Bobbing ghost in menu
  if (ghost) {
    const bobY = ghost.y + ghost.bobOffset;
    const centerX = ghost.x + ghost.width / 2;
    const centerY = bobY + ghost.height / 2;

    ctx.save();
    ctx.translate(centerX, centerY);

    if (ghost.sprite && ghost.sprite.complete && ghost.sprite.naturalWidth > 0) {
      ctx.drawImage(
        ghost.sprite,
        -ghost.width / 2,
        -ghost.height / 2,
        ghost.width,
        ghost.height
      );
    } else {
      ctx.fillStyle = CONFIG.colors.ghostFallback;
      ctx.beginPath();
      ctx.arc(0, 0, CONFIG.ghost.fallbackRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Start prompt
  ctx.fillStyle = CONFIG.colors.scoreBarText;
  ctx.font = `${CONFIG.menu.promptFontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('Click or Press Space to Start', width / 2, height * 2 / 3);
}

function renderPauseOverlay() {
  const { width, height } = CONFIG.canvas;

  // Semi-transparent dark overlay
  ctx.fillStyle = CONFIG.colors.pauseOverlay;
  ctx.fillRect(0, 0, width, height);

  // "PAUSED" text
  ctx.fillStyle = CONFIG.colors.scoreBarText;
  ctx.font = `bold ${CONFIG.menu.titleFontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PAUSED', width / 2, height / 2);

  // Resume instructions prompt
  ctx.font = `${CONFIG.menu.promptFontSize}px sans-serif`;
  ctx.fillText('Press Escape or P to Resume', width / 2, height / 2 + 50);
}

function renderGameOverScreen(state) {
  const { width, height } = CONFIG.canvas;
  const isNewBest = state.score >= state.highScore && state.score > 0;

  // Semi-transparent dark overlay
  ctx.fillStyle = CONFIG.colors.pauseOverlay;
  ctx.fillRect(0, 0, width, height);

  // "Game Over" title
  ctx.fillStyle = CONFIG.colors.scoreBarText;
  ctx.font = `bold ${CONFIG.menu.titleFontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Game Over', width / 2, height / 3);

  // Final score
  ctx.font = `bold ${CONFIG.scoreBar.fontSize + 4}px sans-serif`;
  ctx.fillText(`Score: ${state.score}`, width / 2, height / 2 - 20);

  // "New Best!" indicator
  if (isNewBest) {
    ctx.fillStyle = '#FFD700';
    ctx.font = `bold ${CONFIG.scoreBar.fontSize + 2}px sans-serif`;
    ctx.fillText('New Best!', width / 2, height / 2 + 20);
  }

  // Restart prompt
  ctx.fillStyle = CONFIG.colors.scoreBarText;
  ctx.font = `${CONFIG.menu.promptFontSize}px sans-serif`;
  ctx.fillText('Click or press Space to restart', width / 2, height * 2 / 3);
}

// --- Main Render Function ---

/**
 * Main render function. Draws all game layers in order:
 * background → clouds → pipes → particles → ghost → score popups → score bar → UI overlays
 * Applies screen shake offset wrapping all draws.
 * @param {object} gameState - The central game state object
 */
export function render(gameState) {
  const { entities, screenShake } = gameState;

  // Clear
  ctx.clearRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);

  // Apply screen shake offset
  ctx.save();
  if (screenShake.active) {
    ctx.translate(screenShake.offsetX, screenShake.offsetY);
  }

  // Layer 1: Background
  renderBackground();

  // Layer 2: Clouds
  if (entities.clouds && entities.clouds.length > 0) {
    renderClouds(entities.clouds);
  }

  // Layer 3: Pipes
  if (entities.pipePool) {
    const activePipes = entities.pipePool.getActive();
    renderPipes(activePipes);
  }

  // Layer 4: Particles
  if (entities.particlePool) {
    const activeParticles = entities.particlePool.getActive();
    renderParticles(activeParticles);
  }

  // Layer 5: Ghost
  if (gameState.current !== 'menu') {
    renderGhost(entities.ghost);
  }

  // Layer 6: Score Popups
  if (entities.scorePopups && entities.scorePopups.length > 0) {
    renderScorePopups(entities.scorePopups);
  }

  // Layer 7: Score Bar (only during gameplay and game over)
  if (gameState.current === 'playing' || gameState.current === 'paused' || gameState.current === 'gameOver') {
    renderScoreBar(gameState);
  }

  // Layer 8: UI Overlays (state-dependent)
  if (gameState.current === 'menu') {
    renderMenuScreen(gameState);
  } else if (gameState.current === 'paused') {
    renderPauseOverlay();
  } else if (gameState.current === 'gameOver') {
    renderGameOverScreen(gameState);
  }

  // Restore from screen shake
  ctx.restore();
}
