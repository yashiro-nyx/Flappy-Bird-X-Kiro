# Implementation Plan: Flappy Kiro

## Overview

Implement a retro, hand-drawn style Flappy Bird clone using HTML5 Canvas and vanilla JavaScript ES modules. The architecture uses a centralized config module, object pooling, circle-vs-rectangle collision, render batching, and a delta-time game loop with a finite state machine. No bundler or framework required — just ES modules served from a static file structure.

## Tasks

- [x] 1. Project setup and configuration
  - [x] 1.1 Create index.html with canvas element and module script tag
    - Create the HTML page with meta viewport, inline CSS for centering/dark background, canvas element with id `gameCanvas`, and a `<script type="module" src="js/main.js">`
    - _Requirements: 1.1, 9.1_

  - [x] 1.2 Create js/config.js with all game constants
    - Implement the full CONFIG object with all category groups: canvas, ghost, physics, pipes, difficulty, clouds, particles, scoreBar, scorePopup, screenShake, invincibility, gameOver, menu, rotation, colors, handDrawn, audio, storage, pools, performance
    - _Requirements: 1.1, 2.1, 2.2, 3.1, 3.2, 3.3, 3.7, 12.1, 12.2_

- [x] 2. Canvas setup and responsive scaling
  - [x] 2.1 Create js/canvas.js with canvas initialization and responsive scaling
    - Implement `initCanvas()` to get the canvas element, set internal resolution to 900×600, compute display size maintaining 3:2 aspect ratio fitting viewport, enforce minimum 300×200 display size, and center the canvas
    - Attach a `resize` event listener on `window` to recompute display scaling
    - Export the canvas element and 2D context
    - _Requirements: 1.1, 9.1, 9.2, 9.3, 9.4_

  - [x] 2.2 Write property test for canvas scaling (Property 1)
    - **Property 1: Canvas scaling maintains aspect ratio and fits viewport**
    - Generate random viewport widths [100–4000] × heights [100–3000], verify computed display size maintains 3:2 ratio, fits within viewport, and respects minimum 300×200
    - **Validates: Requirements 1.1, 9.1, 9.4**

- [x] 3. Object pool implementation
  - [x] 3.1 Create js/entities.js with ObjectPool class and factory functions
    - Implement the `ObjectPool` class with `acquire()`, `release()`, `releaseAll()`, and `getActive()` methods
    - Implement factory functions: `createPipe()`, `createParticle()`, `createGhost()`, `createCloud()`, `createScorePopup()`
    - Pre-allocate pools using CONFIG.pools sizes (20 pipes, 50 particles)
    - _Requirements: 13.2, 13.3, 13.5_

  - [x] 3.2 Write property test for object pool conservation (Property 14)
    - **Property 14: Object pool conservation — acquire/release round-trip preserves pool size**
    - Generate random sequences of acquire/release operations, verify total pool objects always ≥ initial size and releasing all returns pool to initial state
    - **Validates: Requirements 13.2, 13.3, 13.5**

- [x] 4. Game state machine
  - [x] 4.1 Create js/state.js with game state management
    - Implement `gameState` object with `current` field (menu/playing/paused/gameOver), `score`, `highScore`, `speedMultiplier`, `frameCount`, `inputLockoutTimer`, `screenShake`, `scorePulse`, and `entities` container
    - Implement transition functions: `startGame()`, `pauseGame()`, `resumeGame()`, `triggerGameOver()`, `resetGame()`
    - Ensure `resetGame()` preserves highScore while resetting score to 0, multiplier to 1.0, releasing all pools, repositioning ghost
    - _Requirements: 1.2, 7.1, 7.4, 11.1, 11.4, 12.3_

- [x] 5. Input handling
  - [x] 5.1 Create js/input.js with keyboard, mouse, and touch event handling
    - Bind Space key, mouse click, and touch events for flap action
    - Bind Escape and P keys for pause/resume toggle
    - Implement `visibilitychange` listener for auto-pause on tab blur
    - Dispatch actions based on current game state (Menu: start, Playing: flap/pause, Paused: resume, GameOver: restart after lockout)
    - Ignore Space/Click while paused to prevent accidental flap on resume
    - Process at most one flap per frame
    - _Requirements: 1.7, 2.3, 7.4, 7.5, 11.1, 11.4, 11.5, 11.6_

- [x] 6. Ghost physics
  - [x] 6.1 Create js/physics.js with gravity, velocity, and position updates
    - Implement `updatePhysics(entities, dt)` that applies gravity to ghost velocity, caps at terminal velocity, integrates position with delta-time, updates ghost rotation based on velocity interpolation, scrolls pipes and clouds, updates particles and score popups
    - Clamp deltaTime to max 3× frame duration to prevent physics explosion after tab backgrounding
    - Skip all updates if game state is paused
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 3.4, 11.2_

  - [x] 6.2 Write property tests for ghost physics (Properties 2, 3, 4, 5, 6)
    - **Property 2: Gravity increases velocity, capped at terminal velocity**
    - **Property 3: Flap always sets velocity to flapImpulse**
    - **Property 4: Position updates are proportional to delta time**
    - **Property 5: Ghost horizontal position is invariant**
    - **Property 6: Rotation linearly interpolates between bounds based on velocity**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7**

- [x] 7. Pipe generation and scrolling
  - [x] 7.1 Implement pipe generation logic in js/physics.js
    - Generate new pipe pairs when the last pipe has scrolled 280px from the right edge
    - Randomize gap center within valid bounds (min 50px visible top and bottom, above score bar)
    - Acquire pipes from pool, set properties (x, topHeight, bottomY, width, capWidth, capHeight, gapCenter, scored=false, active=true)
    - Release pipes back to pool when they scroll off-screen (right edge < 0)
    - Apply speed multiplier to pipe scroll rate with delta-time normalization
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 12.4_

  - [x] 7.2 Write property tests for pipe generation (Properties 7, 8, 9, 10, 11, 13)
    - **Property 7: Pipe generation produces valid gap positioning**
    - **Property 8: Pipe spacing is fixed at 280 pixels**
    - **Property 9: Pipe scroll displacement equals baseSpeed × multiplier × dt**
    - **Property 10: Off-screen pipes are removed**
    - **Property 11: Speed multiplier formula**
    - **Property 13: Pipe spacing invariant**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 12.1, 12.2, 12.4**

- [x] 8. Collision detection
  - [x] 8.1 Create js/collision.js with circle-vs-rectangle collision
    - Implement `getGhostHitbox(ghost)` returning circle (centerX, centerY, radius)
    - Implement `circleIntersectsRect(circle, rect)` using closest-point algorithm
    - Implement `checkCollisions(ghost, pipes)` that tests ghost circle against all active pipe AABBs (including cap extensions of 4px per side)
    - Implement boundary checks: floor (score bar top edge) and ceiling (y=0)
    - Skip collision checks during invincibility frames
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [x] 8.2 Write property tests for collision detection (Properties 12, 13, 14, 15, 24)
    - **Property 12: Ghost hitbox is a circle derived from sprite dimensions**
    - **Property 13: Circle-vs-rectangle collision detection is correct**
    - **Property 14: Boundary collisions detected at ceiling and floor using circle**
    - **Property 15: Screen shake displacement within bounds**
    - **Property 24: Circle-vs-rectangle collision agrees with geometric truth**
    - **Validates: Requirements 4.1, 4.2, 4.4, 4.5, 4.7**

- [x] 9. Checkpoint - Ensure core mechanics work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Scoring and high score persistence
  - [x] 10.1 Create js/scoring.js with score tracking and localStorage
    - Implement `updateScoring(gameState)` that checks if pipe right edge has crossed ghost x position, increments score, marks pipe as scored
    - Implement `loadHighScore()` reading from localStorage with fallback to 0 for unavailable/invalid values
    - Implement `saveHighScore(score)` with try/catch for storage failures
    - Update speed multiplier using formula: min(1.0 + score × 0.02, 2.0)
    - Create score popup on score increment
    - Trigger score pulse animation on the score bar
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.1, 6.2, 6.3, 6.4_

  - [x] 10.2 Write property tests for scoring (Properties 16, 17)
    - **Property 16: Score increments exactly once per pipe pass**
    - **Property 17: High score is always max of previous high and current score**
    - **Validates: Requirements 5.1, 5.4**

- [x] 11. Audio system
  - [x] 11.1 Create js/audio.js with Web Audio API integration
    - Implement `initAudio()` to create AudioContext (deferred to first user gesture)
    - Implement `resumeAudioContext()` called on first user interaction
    - Preload jump.wav and game_over.wav as AudioBuffer objects
    - Implement `playJump()` with restart-if-playing behavior (stop previous, start new)
    - Implement `playGameOver()` for one-shot playback
    - Implement `playScoreTone()` using OscillatorNode frequency sweep (600→900Hz over 100ms)
    - Wrap all operations in try/catch; set `audioEnabled = false` on failure
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

- [x] 12. Renderer with batching and visual effects
  - [x] 12.1 Create js/renderer.js with layered rendering pipeline
    - Implement `render(gameState)` with layer ordering: background → clouds → pipes → particles → ghost → score popups → score bar → UI overlays
    - Apply screen shake offset via ctx.save()/translate()/restore() wrapping all draws
    - Batch similar draws: all clouds together, all pipe bodies then caps then strokes, all particles together
    - Implement hand-drawn stroke offset (1-3px random per edge per frame)
    - Render ghost sprite with rotation (or fallback white circle if sprite failed to load)
    - Render invincibility flash (opacity toggle at 100ms intervals between 0.3 and 1.0)
    - Render score bar (40px height, dark background, "Score: X" left, "High: X" right)
    - Render score pulse animation (1.3x scale over 200ms)
    - Render score popups (floating "+1" text fading out over 500ms)
    - Render menu screen (title "Flappy Kiro", "Best: X", "Click or Press Space to Start", bobbing ghost)
    - Render pause overlay (semi-transparent dark overlay with "PAUSED" and resume prompt)
    - Render game-over screen (final score, "Game Over", "New Best!" if applicable, restart prompt)
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 1.8, 5.5, 5.6, 7.3, 7.6, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.9, 8.10, 11.3_

- [x] 13. Engine and game loop orchestration
  - [x] 13.1 Create js/engine.js with game loop and state transition orchestration
    - Implement `tick(timestamp)` using requestAnimationFrame
    - Calculate delta time, normalize to frame time, clamp to max 3× frame duration
    - Call updatePhysics, checkCollisions, updateScoring based on current state (only when Playing)
    - Handle collision response: trigger game over, screen shake, invincibility, play game-over sound, start 500ms input lockout timer
    - Decrement timers (inputLockout, screenShake, invincibility, scorePulse)
    - Call render every frame regardless of state
    - Implement performance monitoring (log console warning after 10+ consecutive frames > 20ms)
    - _Requirements: 4.6, 4.7, 4.8, 7.1, 7.2, 7.5, 13.1, 13.4, 13.6_

  - [x] 13.2 Create js/main.js as entry point
    - Import and initialize canvas module
    - Load ghost sprite image (ghosty.png) with onerror fallback handling
    - Initialize audio system
    - Load high score from localStorage
    - Create initial game state with entity pools (pipe pool size 20, particle pool size 50)
    - Initialize input handlers
    - Generate initial clouds (3-6 randomized)
    - Start the game loop via engine.js
    - _Requirements: 1.1, 1.2, 1.3, 1.8, 6.2, 10.1_

- [x] 14. Checkpoint - Ensure full game loop is functional
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Visual effects (particles, screen shake, score popups)
  - [x] 15.1 Implement particle emission and lifecycle
    - Emit one particle every 3 frames from ghost center-rear position (x = ghost.x, y = ghost.y + height/2)
    - Particles are white semi-transparent circles (radius 2-4px, initial opacity 0.6)
    - Particles drift leftward at -1.5 px/frame and fade out over 400ms lifetime
    - Acquire from particle pool, release when age exceeds lifetime
    - _Requirements: 8.9, 13.3_

  - [x] 15.2 Implement screen shake effect
    - Compute shake offset using decaying random displacement (max 5px in both axes)
    - Apply to canvas rendering via ctx.translate before all draws
    - Timer-based decay over 300ms duration
    - _Requirements: 4.8_

  - [x] 15.3 Implement score popup animation
    - Create popup at ghost position on score increment
    - Float upward at -2 px/frame, fade out over 500ms
    - Remove when lifetime exceeded
    - _Requirements: 5.5_

- [x] 16. Cloud parallax and repositioning
  - [x] 16.1 Implement cloud scrolling and recycling
    - Generate 3-6 clouds at initialization with randomized width (80-160px), height (30-60px), opacity (0.4-0.8), and speed (0.3-0.7 × pipe speed)
    - Higher opacity clouds move faster (parallax depth effect)
    - Scroll each cloud at its individual speed
    - Reposition clouds to random y off the right edge when they scroll off-screen left
    - _Requirements: 8.3, 8.8_

- [x] 17. Pause functionality integration
  - [x] 17.1 Wire pause state into engine and renderer
    - Ensure physics.js skips all updates when state is paused
    - Ensure engine.js does not process collision or scoring while paused
    - Verify renderer draws pause overlay when state is paused
    - Verify auto-pause on tab blur (visibilitychange event) works end-to-end
    - Verify Space/Click ignored during pause (only Escape/P resumes)
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

- [x] 18. Progressive difficulty wiring
  - [x] 18.1 Wire speed multiplier into pipe generation and scrolling
    - Ensure speed multiplier recalculates on each score increment: min(1.0 + score × 0.02, 2.0)
    - Verify pipe scroll speed = baseSpeed × speedMultiplier × dt/frameTime
    - Verify horizontal spacing remains 280px regardless of multiplier
    - Reset multiplier to 1.0 on game restart
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [x] 19. Final checkpoint - Full integration verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- All game constants live in config.js — no magic numbers in game logic modules
- The game uses fast-check for property-based testing (install via npm for test environment)
- Assets (ghosty.png, jump.wav, game_over.wav) already exist in the assets/ folder

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "3.1", "4.1"] },
    { "id": 2, "tasks": ["2.2", "3.2", "5.1", "6.1"] },
    { "id": 3, "tasks": ["6.2", "7.1", "8.1"] },
    { "id": 4, "tasks": ["7.2", "8.2", "10.1", "11.1"] },
    { "id": 5, "tasks": ["10.2", "12.1"] },
    { "id": 6, "tasks": ["13.1", "13.2"] },
    { "id": 7, "tasks": ["15.1", "15.2", "15.3", "16.1", "17.1", "18.1"] }
  ]
}
```
