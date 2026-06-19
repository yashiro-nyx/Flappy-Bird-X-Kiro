# Implementation Plan: Flappy Kiro

## Overview

Implement a retro, hand-drawn style Flappy Bird clone using HTML5 Canvas and vanilla JavaScript ES modules. The architecture uses a centralized config module, object pooling, circle-vs-rectangle collision, render batching, and a delta-time game loop with a finite state machine. No bundler or framework required — just ES modules served from a static file structure.

## Tasks

- [ ] 1. Project setup and configuration
  - [ ] 1.1 Create index.html with canvas element and module script tag
    - Create the HTML page with meta viewport, inline CSS for centering/dark background, canvas element with id `gameCanvas`, and a `<script type="module" src="js/main.js">`
    - _Requirements: 1.1, 9.1_

  - [ ] 1.2 Create js/config.js with all game constants
    - Implement the full CONFIG object with all category groups: canvas, ghost, physics, pipes, difficulty, clouds, particles, scoreBar, scorePopup, screenShake, invincibility, gameOver, menu, rotation, colors, handDrawn, audio, storage, pools, performance
    - _Requirements: 1.1, 2.1, 2.2, 3.1, 3.2, 3.3, 3.7, 12.1, 12.2_

- [ ] 2. Canvas setup and responsive scaling
  - [ ] 2.1 Create js/canvas.js with canvas initialization and responsive scaling
    - Implement `initCanvas()` to get the canvas element, set internal resolution to 900×600, compute display size maintaining 3:2 aspect ratio fitting viewport, enforce minimum 300×200 display size, and center the canvas
    - Attach a `resize` event listener on `window` to recompute display scaling
    - Export the canvas element and 2D context
    - _Requirements: 1.1, 9.1, 9.2, 9.3, 9.4_

  - [ ]* 2.2 Write property test for canvas scaling (Property 1)
    - **Property 1: Canvas scaling maintains aspect ratio and fits viewport**
    - **Validates: Requirements 1.1, 9.1, 9.4**

- [ ] 3. Object pool implementation
  - [ ] 3.1 Create js/entities.js with ObjectPool class and factory functions
    - Implement the `ObjectPool` class with `acquire()`, `release()`, `releaseAll()`, and `getActive()` methods
    - Implement factory functions: `createPipe()`, `createParticle()`, `createGhost()`, `createCloud()`, `createScorePopup()`
    - Pre-allocate pools using CONFIG.pools sizes
    - _Requirements: 13.2, 13.3, 13.5_

  - [ ]* 3.2 Write property test for object pool conservation (Property 14)
    - **Property 14: Object pool conservation**
    - **Validates: Requirements 13.2, 13.3, 13.5**

- [ ] 4. Game state machine
  - [ ] 4.1 Create js/state.js with game state management
    - Implement `gameState` object with `current` field (menu/playing/paused/gameOver), `score`, `highScore`, `speedMultiplier`, `frameCount`, `inputLockoutTimer`, `screenShake`, `scorePulse`, and `entities` container
    - Implement transition functions: `startGame()`, `pauseGame()`, `resumeGame()`, `triggerGameOver()`, `resetGame()`
    - Ensure `resetGame()` preserves highScore while resetting all other state
    - _Requirements: 1.2, 7.1, 7.4, 11.1, 11.4, 12.3_

- [ ] 5. Input handling
  - [ ] 5.1 Create js/input.js with keyboard, mouse, and touch event handling
    - Bind Space key, mouse click, and touch events for flap action
    - Bind Escape and P keys for pause/resume toggle
    - Implement `visibilitychange` listener for auto-pause on tab blur
    - Dispatch actions based on current game state (Menu: start, Playing: flap/pause, Paused: resume, GameOver: restart after lockout)
    - Ignore Space/Click while paused to prevent accidental flap on resume
    - Process at most one flap per frame
    - _Requirements: 1.7, 2.3, 7.4, 7.5, 11.1, 11.4, 11.5, 11.6_

- [ ] 6. Ghost physics
  - [ ] 6.1 Create js/physics.js with gravity, velocity, and position updates
    - Implement `updatePhysics(entities, dt)` that applies gravity to ghost velocity, caps at terminal velocity, integrates position with delta-time, updates ghost rotation based on velocity interpolation, scrolls pipes and clouds, updates particles and score popups
    - Clamp deltaTime to max 3× frame duration to prevent physics explosion after tab backgrounding
    - Skip all updates if game state is paused
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 3.4, 11.2_

  - [ ]* 6.2 Write property tests for ghost physics (Properties 2, 3, 4, 5, 6)
    - **Property 2: Ghost physics — gravity and terminal velocity**
    - **Property 3: Flap always resets velocity to impulse**
    - **Property 4: Delta-time position integration**
    - **Property 5: Ghost horizontal position invariant**
    - **Property 6: Ghost rotation clamped and interpolated**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7**

- [ ] 7. Pipe generation and scrolling
  - [ ] 7.1 Implement pipe generation logic in js/physics.js
    - Generate new pipe pairs when the last pipe has scrolled 280px from the right edge
    - Randomize gap center within valid bounds (min 50px visible top and bottom)
    - Acquire pipes from pool, set properties (x, topHeight, bottomY, width, capWidth, gapCenter, scored=false, active=true)
    - Release pipes back to pool when they scroll off-screen (right edge < 0)
    - Apply speed multiplier to pipe scroll rate with delta-time normalization
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 12.4_

  - [ ]* 7.2 Write property tests for pipe generation (Properties 7, 8, 13)
    - **Property 7: Pipe generation constraints**
    - **Property 8: Speed multiplier formula**
    - **Property 13: Pipe spacing invariant**
    - **Validates: Requirements 3.2, 3.3, 3.6, 12.1, 12.2, 12.4**

- [ ] 8. Collision detection
  - [ ] 8.1 Create js/collision.js with circle-vs-rectangle collision
    - Implement `getGhostHitbox(ghost)` returning circle (centerX, centerY, radius)
    - Implement `circleIntersectsRect(circle, rect)` using closest-point algorithm
    - Implement `checkCollisions(ghost, pipes)` that tests ghost circle against all active pipe AABBs (including cap extensions)
    - Implement boundary checks: floor (score bar top edge) and ceiling (y=0)
    - Skip collision checks during invincibility frames
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [ ]* 8.2 Write property tests for collision detection (Properties 9, 10)
    - **Property 9: Circle-vs-rectangle collision detection correctness**
    - **Property 10: Boundary collision detection (circular hitbox)**
    - **Validates: Requirements 4.2, 4.4, 4.5**

- [ ] 9. Checkpoint - Ensure core mechanics work
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Scoring and high score persistence
  - [ ] 10.1 Create js/scoring.js with score tracking and localStorage
    - Implement `updateScoring(gameState)` that checks if pipe right edge has crossed ghost x position, increments score, marks pipe as scored
    - Implement `loadHighScore()` reading from localStorage with fallback to 0
    - Implement `saveHighScore(score)` with try/catch for storage failures
    - Update speed multiplier using formula: min(1.0 + score × 0.02, 2.0)
    - Create score popup on score increment
    - Trigger score pulse animation on the score bar
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.1, 6.2, 6.3, 6.4_

  - [ ]* 10.2 Write property tests for scoring (Properties 11, 12)
    - **Property 11: Score increments exactly once per pipe**
    - **Property 12: High score is max of current and stored**
    - **Validates: Requirements 5.1, 5.4**

- [ ] 11. Audio system
  - [ ] 11.1 Create js/audio.js with Web Audio API integration
    - Implement `initAudio()` to create AudioContext (deferred to first user gesture)
    - Implement `resumeAudioContext()` called on first user interaction
    - Preload jump.wav and game_over.wav as AudioBuffer objects
    - Implement `playJump()` with restart-if-playing behavior
    - Implement `playGameOver()` for one-shot playback
    - Implement `playScoreTone()` using OscillatorNode frequency sweep (600→900Hz over 100ms)
    - Wrap all operations in try/catch; set `audioEnabled = false` on failure
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

- [ ] 12. Renderer with batching and visual effects
  - [ ] 12.1 Create js/renderer.js with layered rendering pipeline
    - Implement `render(gameState)` with layer ordering: background → clouds → pipes → particles → ghost → score popups → score bar → UI overlays
    - Apply screen shake offset via ctx.save()/translate()/restore() wrapping all draws
    - Batch similar draws: all clouds together, all pipe bodies then caps then strokes, all particles together
    - Implement hand-drawn stroke offset (1-3px random per edge per frame)
    - Render ghost sprite with rotation (or fallback white circle)
    - Render invincibility flash (opacity toggle at 100ms intervals)
    - Render score bar with current score and high score
    - Render score pulse animation (1.3x scale over 200ms)
    - Render score popups (floating +1 text fading out)
    - Render menu screen (title, high score, start prompt, bobbing ghost)
    - Render pause overlay (semi-transparent dark + "PAUSED" text)
    - Render game-over screen (final score, "Game Over", "New Best!" if applicable, restart prompt)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10, 1.3, 1.4, 1.5, 1.6, 1.8, 7.3, 7.6, 11.3_

- [ ] 13. Engine and game loop orchestration
  - [ ] 13.1 Create js/engine.js with game loop and state transition orchestration
    - Implement `tick(timestamp)` using requestAnimationFrame
    - Calculate delta time, normalize to frame time, clamp to max 3× frame duration
    - Call updatePhysics, checkCollisions, updateScoring based on current state
    - Handle collision response: trigger game over, screen shake, invincibility, play sound, start lockout timer
    - Decrement timers (inputLockout, screenShake, invincibility, scorePulse)
    - Call render every frame regardless of state
    - Implement performance monitoring (consecutive slow frame detection + console warning)
    - _Requirements: 4.6, 4.7, 4.8, 7.1, 7.2, 7.5, 13.1, 13.6_

  - [ ] 13.2 Create js/main.js as entry point
    - Import and initialize canvas module
    - Load ghost sprite image with fallback handling
    - Initialize audio system
    - Load high score from localStorage
    - Create initial game state with entity pools
    - Initialize input handlers
    - Generate initial clouds
    - Start the game loop via engine.js
    - _Requirements: 1.1, 1.2, 1.3, 1.8, 6.2, 10.1_

- [ ] 14. Checkpoint - Ensure full game loop is functional
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. Pause functionality integration
  - [ ] 15.1 Wire pause state into engine and renderer
    - Ensure physics.js skips all updates when state is paused
    - Ensure engine.js does not process collision or scoring while paused
    - Verify renderer draws pause overlay when state is paused
    - Verify auto-pause on tab blur works end-to-end
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

- [ ] 16. Progressive difficulty
  - [ ] 16.1 Wire speed multiplier into pipe generation and scrolling
    - Ensure speed multiplier is recalculated on each score increment
    - Verify pipe scroll speed = baseSpeed × speedMultiplier × dt/frameTime
    - Verify horizontal spacing remains 280px regardless of multiplier
    - Reset multiplier to 1.0 on game restart
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [ ] 17. Visual effects (particles, screen shake, score popups)
  - [ ] 17.1 Implement particle emission and lifecycle
    - Emit one particle every 3 frames from ghost center-rear position
    - Particles drift leftward, fade over 400ms lifetime
    - Acquire from particle pool, release when expired
    - _Requirements: 8.9, 13.3_

  - [ ] 17.2 Implement screen shake effect
    - Compute shake offset using decaying random displacement (max 5px)
    - Apply to canvas rendering via translate
    - Timer-based decay over 300ms
    - _Requirements: 4.8_

  - [ ] 17.3 Implement score popup animation
    - Create popup at ghost position on score
    - Float upward, fade out over 500ms
    - Remove when lifetime exceeded
    - _Requirements: 5.5_

- [ ] 18. Cloud parallax and repositioning
  - [ ] 18.1 Implement cloud scrolling and recycling
    - Generate 3-6 clouds at initialization with randomized properties
    - Scroll each cloud at individual speed (opacity correlates with speed for parallax)
    - Reposition clouds to right edge when they scroll off-screen left
    - _Requirements: 8.3, 8.8_

- [ ] 19. Final checkpoint - Full integration verification
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
    { "id": 7, "tasks": ["15.1", "16.1", "17.1", "17.2", "17.3", "18.1"] },
    { "id": 8, "tasks": ["11.2", "12.2"] }
  ]
}
```
