# Requirements Document

## Introduction

Flappy Kiro is a retro, hand-drawn style endless side-scrolling browser game built with HTML5 Canvas and vanilla JavaScript. The player controls a small white ghost character ("Ghosty"), guiding it through gaps between green pipes by tapping or clicking to make the ghost "flap" upward. The game features progressive difficulty, particle effects, screen shake feedback, pause functionality, and persistent high score tracking across sessions.

## Glossary

- **Game_Canvas**: The HTML5 Canvas element that renders all game visuals at a fixed internal resolution of 900×600 pixels
- **Ghost**: The player-controlled character (a small white ghost sprite loaded from `assets/ghosty.png`), also called "Ghosty"
- **Pipe**: A green vertical obstacle extending from the top or bottom of the play area, with a darker green cap piece
- **Pipe_Pair**: A matched set of one top Pipe and one bottom Pipe with a gap between them for the Ghost to pass through
- **Gap**: The vertical opening between a top Pipe and a bottom Pipe in a Pipe_Pair
- **Cloud**: A white rounded rectangular decorative element that floats in the background
- **Score_Bar**: A dark horizontal bar at the bottom of the Game_Canvas displaying the current score and high score
- **Game_Engine**: The core game loop responsible for updating positions, detecting collisions, and rendering frames
- **Gravity**: A constant downward acceleration of 0.6 pixels per frame² applied to the Ghost each frame
- **Flap**: An upward velocity impulse of -10 pixels per frame applied to the Ghost when the player provides input
- **Terminal_Velocity**: The maximum downward velocity of 12 pixels per frame that the Ghost cannot exceed
- **High_Score**: The highest score achieved, persisted in browser localStorage
- **Game_State**: The current mode of the game, one of: Menu, Playing, Paused, or Game_Over
- **Hitbox**: The collision shape used for detection; for the Ghost this is a circle (center at sprite center, radius derived from half the sprite width minus a fairness margin), and for Pipes this is an axis-aligned bounding box (AABB) matching the pipe rectangular geometry
- **Particle**: A small visual element emitted from the Ghost during flight, creating a trail effect
- **Screen_Shake**: A brief oscillating offset applied to the Game_Canvas rendering position as collision feedback
- **Score_Popup**: A temporary floating text indicator that appears when the player earns a point
- **Background_Music**: Looping audio track played during the Playing state
- **Invincibility_Frames**: A brief period after collision triggers during which no additional collisions are registered (used during the game-over transition)
- **Base_Speed**: The initial horizontal scroll speed for Pipe_Pairs, set at 3 pixels per frame at 60 FPS
- **Speed_Multiplier**: A scaling factor applied to Base_Speed that increases over time to create progressive difficulty
- **Object_Pool**: A pre-allocated collection of reusable game objects (Pipes or Particles) that avoids repeated creation and garbage collection during gameplay

## Requirements

### Requirement 1: Game Initialization and Main Menu

**User Story:** As a player, I want the game to load and display a polished main menu with my high score, so that I know the game is ready and I can see my best performance before playing.

#### Acceptance Criteria

1. WHEN the page loads, THE Game_Canvas SHALL render at a fixed internal resolution of 900×600 pixels and scale its display to fit the browser viewport while maintaining a 3:2 aspect ratio with letterboxing if necessary
2. WHEN the page loads, THE Game_Engine SHALL set the Game_State to Menu
3. WHILE the Game_State is Menu, THE Game_Engine SHALL display the Ghost sprite at a vertically centered position on the left third of the Game_Canvas with a gentle idle bobbing animation (oscillating vertically by 5 pixels over a 2-second cycle)
4. WHILE the Game_State is Menu, THE Game_Engine SHALL display a "Flappy Kiro" title centered horizontally in the upper third of the Game_Canvas
5. WHILE the Game_State is Menu, THE Game_Engine SHALL display the High_Score in the format "Best: X" centered below the title
6. WHILE the Game_State is Menu, THE Game_Engine SHALL display a "Click or Press Space to Start" prompt centered in the lower third of the Game_Canvas
7. WHEN the player clicks or presses Space while the Game_State is Menu, THE Game_Engine SHALL transition the Game_State to Playing and begin the gameplay loop
8. IF the `assets/ghosty.png` sprite fails to load, THEN THE Game_Engine SHALL render a white circle as a fallback Ghost representation

### Requirement 2: Ghost Movement and Physics

**User Story:** As a player, I want the ghost to respond to my input with satisfying physics-based movement including momentum and smooth interpolation, so that I feel precise control of the character.

#### Acceptance Criteria

1. WHILE the Game_State is Playing, THE Game_Engine SHALL apply Gravity (0.6 pixels per frame²) to the Ghost each frame, increasing its downward velocity
2. WHILE the Game_State is Playing, THE Game_Engine SHALL cap the Ghost downward velocity at Terminal_Velocity (12 pixels per frame)
3. WHEN the player clicks or presses Space while the Game_State is Playing, THE Game_Engine SHALL set the Ghost vertical velocity to the Flap impulse value (-10 pixels per frame) regardless of the Ghost's current velocity
4. WHILE the Game_State is Playing, THE Game_Engine SHALL apply delta-time-based interpolation to the Ghost position updates to ensure smooth movement independent of frame rate variations
5. WHILE the Game_State is Playing, THE Ghost SHALL remain at a fixed horizontal position on the left third of the Game_Canvas (x at approximately 1/3 of canvas width) while the world scrolls from right to left
6. WHILE the Game_State is Playing, THE Game_Engine SHALL rotate the Ghost sprite between a maximum upward tilt of -30 degrees (when vertical velocity equals Flap impulse) and a maximum downward tilt of 90 degrees (when vertical velocity equals Terminal_Velocity), interpolating linearly between these angles based on current velocity
7. WHEN a Flap is applied, THE Game_Engine SHALL preserve the Ghost horizontal position without any horizontal displacement

### Requirement 3: Pipe Generation and Scrolling

**User Story:** As a player, I want pipes to appear at regular intervals with varied gap positions and increasing speed, so that the game presents an escalating challenge.

#### Acceptance Criteria

1. WHILE the Game_State is Playing, THE Game_Engine SHALL generate a new Pipe_Pair when the most recently generated Pipe_Pair has scrolled a fixed horizontal spacing distance of 280 pixels from the right edge of the Game_Canvas
2. THE Game_Engine SHALL randomize the vertical center of each Gap within a range that ensures at least 50 pixels of Pipe are visible on both the top and bottom of the play area (excluding the Score_Bar)
3. THE Game_Engine SHALL maintain a consistent Gap height of 150 pixels across all Pipe_Pairs
4. WHILE the Game_State is Playing, THE Game_Engine SHALL scroll all Pipe_Pairs from right to left at the current effective speed (Base_Speed multiplied by Speed_Multiplier)
5. WHEN a Pipe_Pair scrolls completely off the left edge of the Game_Canvas (the right edge of the pipe is at x < 0), THE Game_Engine SHALL remove that Pipe_Pair from the active pipes array
6. WHILE the Game_State is Playing, THE Game_Engine SHALL increase the Speed_Multiplier by 0.02 for every point scored, starting from 1.0, up to a maximum Speed_Multiplier of 2.0
7. THE Game_Engine SHALL set each Pipe width to 60 pixels and each Pipe cap width to 68 pixels (extending 4 pixels beyond the pipe on each side) with a cap height of 15 pixels

### Requirement 4: Collision Detection

**User Story:** As a player, I want the game to accurately detect when my ghost hits an obstacle with clear visual feedback, so that the game feels fair and responsive.

#### Acceptance Criteria

1. THE Game_Engine SHALL define the Ghost Hitbox as a circle centered at the Ghost sprite center (x + width/2, y + height/2) with a radius equal to half the sprite width minus a 4-pixel fairness margin (radius = width/2 - 4)
2. WHEN the Ghost circular Hitbox intersects any Pipe rectangular bounding box (including the cap regions), THE Game_Engine SHALL trigger a game-over event, using a circle-versus-rectangle intersection test (finding the closest point on the rectangle to the circle center and checking if the distance is less than the circle radius)
3. THE Game_Engine SHALL define each Pipe Hitbox as an axis-aligned bounding box (AABB) matching the pipe rectangular geometry including cap extensions
4. WHEN the lowest point of the Ghost circular Hitbox (center y + radius) moves below the top edge of the Score_Bar, THE Game_Engine SHALL trigger a game-over event
5. WHEN the highest point of the Ghost circular Hitbox (center y - radius) moves above y=0 of the Game_Canvas, THE Game_Engine SHALL trigger a game-over event
6. THE Game_Engine SHALL evaluate collision checks once per frame after updating positions and before rendering
7. WHEN a game-over event is triggered, THE Game_Engine SHALL enter Invincibility_Frames for 300 milliseconds during which no additional collision checks are processed (preventing duplicate triggers during the game-over transition animation)
8. WHEN a collision is detected with a Pipe, THE Game_Engine SHALL apply a Screen_Shake effect to the rendering offset for 300 milliseconds with a maximum displacement of 5 pixels in both axes using a decaying sinusoidal pattern

### Requirement 5: Scoring

**User Story:** As a player, I want to see my score increase with visual feedback as I pass through pipes, so that I have a satisfying measure of progress.

#### Acceptance Criteria

1. WHEN the right edge of a Pipe_Pair scrolls past the Ghost horizontal position, THE Game_Engine SHALL increment the current score by one and mark that Pipe_Pair as scored so that it is not counted again
2. THE Score_Bar SHALL display the current score in the format "Score: X" on the left side, where X starts at 0 at the beginning of each game
3. THE Score_Bar SHALL display the High_Score in the format "High: X" on the right side
4. WHEN the current score exceeds the stored High_Score, THE Game_Engine SHALL update the High_Score to match the current score and the Score_Bar SHALL immediately reflect the updated High_Score
5. WHEN the player scores a point, THE Game_Engine SHALL display a Score_Popup showing "+1" at the Ghost position that floats upward and fades out over 500 milliseconds
6. WHEN the player scores a point, THE Game_Engine SHALL briefly scale the score text in the Score_Bar to 1.3x size for 200 milliseconds before returning to normal size as a visual pulse

### Requirement 6: High Score Persistence

**User Story:** As a player, I want my high score to persist across browser sessions, so that I can track my improvement over time.

#### Acceptance Criteria

1. WHEN a game-over event occurs and the current score exceeds the stored High_Score, THE Game_Engine SHALL save the new High_Score to browser localStorage under the key "flappyKiroHighScore"
2. WHEN the page loads, THE Game_Engine SHALL retrieve the High_Score from browser localStorage using the key "flappyKiroHighScore"
3. IF localStorage is unavailable, contains no High_Score, or the stored value is not a valid non-negative integer, THEN THE Game_Engine SHALL set the High_Score to zero
4. IF writing to localStorage fails (e.g., storage quota exceeded or private browsing mode), THEN THE Game_Engine SHALL continue gameplay without persisting the High_Score

### Requirement 7: Game Over and Restart

**User Story:** As a player, I want a clear game-over state with visual impact and the option to restart, so that I can quickly play again.

#### Acceptance Criteria

1. WHEN a game-over event occurs, THE Game_Engine SHALL transition the Game_State to Game_Over and stop the gameplay loop, ceasing all movement and physics updates
2. WHEN a game-over event occurs, THE Game_Engine SHALL play the `game_over.wav` sound effect
3. WHEN a game-over event occurs, THE Game_Engine SHALL display the final score prominently centered on the Game_Canvas, along with a "Game Over" message above it and a "Click or Press Space to Restart" prompt below it
4. WHEN the player clicks or presses Space while the Game_State is Game_Over (after the input lockout period), THE Game_Engine SHALL reset the current score to zero, reset the Speed_Multiplier to 1.0, remove all Pipe_Pairs and Particles, return the Ghost to its starting position and velocity, and transition the Game_State to Playing while preserving the High_Score
5. WHEN a game-over event occurs, THE Game_Engine SHALL ignore player click and Space inputs for 500 milliseconds before accepting a restart input
6. WHEN a game-over event occurs and the current score equals or exceeds the High_Score, THE Game_Engine SHALL display a "New Best!" label above the final score on the game-over screen

### Requirement 8: Visual Rendering

**User Story:** As a player, I want the game to have a retro hand-drawn aesthetic with particle effects, so that it feels charming and visually polished.

#### Acceptance Criteria

1. THE Game_Canvas SHALL render a light blue background (approximately #87CEEB) each frame
2. THE Game_Engine SHALL render each Pipe as a green filled rectangle with a darker green cap rectangle at the opening end, where the cap extends beyond the pipe width by 4 pixels on each side and has a height of 15 pixels
3. THE Game_Engine SHALL render between 3 and 6 Cloud decorations as white semi-transparent rounded rectangles (opacity between 0.4 and 0.8) distributed across the background layer, where each Cloud scrolls from right to left at an individually assigned speed slower than the Pipe scroll speed, with farther (more transparent) Clouds moving slower and closer (more opaque) Clouds moving faster to create a parallax depth effect
4. THE Score_Bar SHALL render as a dark-colored filled rectangle at the bottom of the Game_Canvas with a fixed height of 40 pixels
5. THE Game_Engine SHALL render all visual elements with a random stroke offset between 1 and 3 pixels applied to edges to convey a hand-drawn aesthetic
6. THE Game_Engine SHALL render the Ghost using the `assets/ghosty.png` sprite image
7. THE Game_Engine SHALL render visual elements in the following layer order from back to front: background, Clouds, Pipes, Particles, Ghost, Score_Popups, Score_Bar, Screen_Shake offset (applied to entire canvas)
8. WHEN a Cloud scrolls completely off the left edge of the Game_Canvas, THE Game_Engine SHALL reposition that Cloud to a random vertical position off the right edge of the Game_Canvas
9. WHILE the Game_State is Playing, THE Game_Engine SHALL emit one Particle from the Ghost center-rear position every 3 frames, where each Particle is a white semi-transparent circle (radius 2-4 pixels, initial opacity 0.6) that drifts leftward and fades out over 400 milliseconds
10. WHEN the Ghost is within Invincibility_Frames after a collision, THE Game_Engine SHALL flash the Ghost sprite opacity between 0.3 and 1.0 at a rate of 100 milliseconds per toggle

### Requirement 9: Responsive Canvas Sizing

**User Story:** As a player, I want the game to adapt to my browser window size, so that I can play comfortably on different screen sizes.

#### Acceptance Criteria

1. WHEN the browser window is resized, THE Game_Canvas SHALL scale its display size to the largest dimensions that fit entirely within the viewport while preserving a 3:2 aspect ratio, centering the canvas within any remaining space
2. WHEN the page loads, THE Game_Canvas SHALL perform the same viewport-fitting and centering behavior described in criterion 1
3. THE Game_Engine SHALL use a fixed internal resolution of 900×600 pixels for all physics calculations and game logic regardless of the displayed canvas size
4. IF the viewport width is less than 300 pixels or the viewport height is less than 200 pixels, THEN THE Game_Canvas SHALL render at a minimum display size of 300×200 pixels

### Requirement 10: Audio Management

**User Story:** As a player, I want sound effects and background music to play at appropriate moments without blocking gameplay, so that the experience is immersive.

#### Acceptance Criteria

1. WHEN the page loads, THE Game_Engine SHALL preload `assets/jump.wav` and `assets/game_over.wav` using the Web Audio API or HTMLAudioElement
2. WHEN a sound effect is triggered, THE Game_Engine SHALL play the audio without blocking the game loop
3. IF audio playback fails for any reason (browser autoplay restrictions, missing files, or decoding errors), THEN THE Game_Engine SHALL continue gameplay without sound rather than halting
4. WHEN a Flap sound is triggered while a previous Flap sound is still playing, THE Game_Engine SHALL restart the sound from the beginning rather than overlapping multiple instances
5. WHEN the player triggers a Flap while the Game_State is Playing, THE Game_Engine SHALL play the `assets/jump.wav` sound effect
6. WHEN a game-over event occurs, THE Game_Engine SHALL play the `assets/game_over.wav` sound effect
7. WHEN the player scores a point, THE Game_Engine SHALL play a short scoring sound (a brief ascending tone generated via the Web Audio API oscillator, frequency sweep from 600Hz to 900Hz over 100 milliseconds)

### Requirement 11: Pause Functionality

**User Story:** As a player, I want to pause the game at any time during gameplay, so that I can take a break without losing my progress.

#### Acceptance Criteria

1. WHEN the player presses the Escape key or P key while the Game_State is Playing, THE Game_Engine SHALL transition the Game_State to Paused
2. WHILE the Game_State is Paused, THE Game_Engine SHALL halt all physics updates, Pipe scrolling, Particle updates, and score processing while continuing to render the frozen frame
3. WHILE the Game_State is Paused, THE Game_Engine SHALL display a semi-transparent dark overlay (opacity 0.5) over the Game_Canvas with a "PAUSED" message centered on screen and a "Press Escape or P to Resume" prompt below it
4. WHEN the player presses the Escape key or P key while the Game_State is Paused, THE Game_Engine SHALL transition the Game_State to Playing and resume all gameplay updates from the paused state
5. WHILE the Game_State is Paused, THE Game_Engine SHALL ignore Space and Click inputs to prevent accidental flapping on resume
6. WHEN the browser tab loses focus (visibilitychange event with document.hidden = true) while the Game_State is Playing, THE Game_Engine SHALL automatically transition the Game_State to Paused

### Requirement 12: Progressive Difficulty

**User Story:** As a player, I want the game to become progressively harder as I play longer, so that it remains challenging and rewarding.

#### Acceptance Criteria

1. WHILE the Game_State is Playing, THE Game_Engine SHALL apply the Speed_Multiplier to the Pipe scroll speed, starting at 1.0 and increasing by 0.02 for each point scored
2. THE Game_Engine SHALL cap the Speed_Multiplier at a maximum value of 2.0, preventing the effective speed from exceeding 6 pixels per frame (Base_Speed of 3 multiplied by maximum Speed_Multiplier of 2.0)
3. WHEN the Game_State transitions from Game_Over to Playing (restart), THE Game_Engine SHALL reset the Speed_Multiplier to 1.0
4. WHILE the Speed_Multiplier increases, THE Game_Engine SHALL maintain the same horizontal spacing of 280 pixels between Pipe_Pairs (spacing is measured in pixels, not time, so faster speed means pipes appear more frequently in real time)

### Requirement 13: Performance Optimization

**User Story:** As a player, I want the game to run smoothly at a consistent frame rate without stutters or memory buildup, so that gameplay remains responsive and enjoyable during extended sessions.

#### Acceptance Criteria

1. THE Game_Engine SHALL target a consistent 60 frames per second rendering rate throughout gameplay
2. THE Game_Engine SHALL use object pooling for Pipe instances, reusing deactivated Pipe objects from a pool instead of creating new objects and destroying old ones when Pipe_Pairs scroll off-screen
3. THE Game_Engine SHALL use object pooling for Particle instances, reusing expired Particle objects from a pool instead of creating new objects and destroying old ones when Particles complete their lifetime
4. THE Game_Engine SHALL batch similar rendering operations together (grouping pipe draws, particle draws, and cloud draws) to minimize Canvas 2D context state changes per frame
5. WHILE the Game_State is Playing, THE Game_Engine SHALL avoid allocating new objects in the per-frame update and render paths, instead reusing pre-allocated objects from pools
6. IF the measured frame time exceeds 20 milliseconds (below 50 FPS) for more than 10 consecutive frames, THEN THE Game_Engine SHALL log a performance warning to the browser console

