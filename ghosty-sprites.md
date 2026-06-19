# Ghosty Sprite Specifications

## Character Overview

Ghosty is a small, cute white ghost character with simple dot eyes. The character has a rounded body shape suitable for circular hitbox collision detection.

## Sprite Dimensions

- **Sprite sheet cell size**: 32×32 pixels
- **Character visual bounds**: ~28×28 pixels (centered within the 32×32 cell with 2px padding)
- **Source file**: `assets/ghosty.png`

## Hitbox

- **Shape**: Circle
- **Radius**: 12 pixels (centered at sprite center)
- **Center offset**: (16, 16) relative to sprite top-left corner
- **Fairness note**: The 12px radius is smaller than the visual bounds (~14px from center to edge), giving players a forgiving collision margin

## Animation States

### Idle State (Menu Screen)

- **Frames**: 1 (static pose)
- **Behavior**: Gentle vertical bob (5px amplitude, 2-second cycle using sine wave)
- **Eyes**: Two small black dots, looking forward
- **Body**: Neutral rounded shape, no tilt

### Flap State (Gameplay - Ascending)

- **Frames**: 1 (sprite rotated dynamically)
- **Rotation**: Up to -30° (tilted upward)
- **Visual cue**: Sprite tilts upward when velocity is negative (ascending)
- **Transition**: Smooth interpolation from current angle to target angle based on velocity

### Fall State (Gameplay - Descending)

- **Frames**: 1 (sprite rotated dynamically)
- **Rotation**: Up to +90° (tilted downward)
- **Visual cue**: Sprite tilts progressively downward as velocity increases toward terminal velocity
- **Transition**: Linear interpolation based on current velocity between flap impulse and terminal velocity

### Death State (Game Over)

- **Frames**: 1 (frozen at final rotation)
- **Behavior**: Ghost freezes at its current rotation angle on collision
- **Flash effect**: Opacity toggles between 0.3 and 1.0 at 100ms intervals during invincibility frames (300ms)
- **No additional death animation** — the screen shake provides the collision impact feedback

## Particle Trail

- **Emission point**: Center-rear of ghost sprite (x=0, y=16 relative to sprite)
- **Emission rate**: 1 particle every 3 frames
- **Particle shape**: White semi-transparent circle
- **Particle radius**: 2–4 pixels (randomized)
- **Initial opacity**: 0.6
- **Lifetime**: 400ms (fade to 0)
- **Drift**: Leftward at -1.5 px/frame

## Fallback Rendering

If `ghosty.png` fails to load:
- Render a filled white circle with radius 18px
- Apply same rotation and position logic
- No particle trail color change needed (particles are already white)

## Color Palette

| Element | Color | Notes |
|---------|-------|-------|
| Body | White (#FFFFFF) | From sprite PNG |
| Eyes | Black (#000000) | Two small dots |
| Fallback circle | White (#FFFFFF) | Solid fill |
| Particle trail | White (#FFFFFF) | Semi-transparent (0.6 alpha) |
