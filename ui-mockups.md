# UI Mockups and Interface Designs

## Canvas Layout

Internal resolution: 900×600 pixels, 3:2 aspect ratio.  
All coordinates and sizes below are in internal resolution units.

---

## Screen 1: Main Menu

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                                                             │
│                     FLAPPY KIRO                             │
│                    (48px font, centered)                    │
│                                                             │
│                      Best: 42                               │
│                    (20px font, centered)                    │
│                                                             │
│                                                             │
│        👻                                                   │
│     (ghost sprite,                                          │
│      bobbing gently,                                        │
│      x=300, y≈300±5)                                       │
│                                                             │
│                                                             │
│              Click or Press Space to Start                   │
│                    (20px font, centered)                    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Score: 0                                    High: 42       │
│                    (Score Bar, 40px height)                  │
└─────────────────────────────────────────────────────────────┘
```

### Main Menu Elements

| Element | Position | Font | Color |
|---------|----------|------|-------|
| Title "FLAPPY KIRO" | Center X, upper 1/3 | 48px bold | White |
| High score "Best: X" | Center X, below title | 20px | White |
| Ghost sprite | x=300, y=300 (bobbing ±5px) | — | Sprite |
| Start prompt | Center X, lower 1/3 | 20px | White |
| Score Bar | Bottom, full width, 40px tall | 18px | White on #2d2d2d |

### Interactions

- **Space / Click / Touch** → Transition to Playing state
- Ghost bobs with sine wave (5px amplitude, 2s period)
- Background renders with clouds (parallax scrolling continues on menu)

---

## Screen 2: In-Game HUD

```
┌─────────────────────────────────────────────────────────────┐
│   ☁                          ☁              ☁               │
│                                                             │
│        ┃━━━┃                    ┃━━━┃                       │
│        ┃   ┃                    ┃   ┃                       │
│        ┃   ┃       +1           ┃   ┃        ┃━━━┃         │
│        ┃━━━┃     (popup)        ┃━━━┃        ┃   ┃         │
│                                              ┃   ┃         │
│              👻 · · ·                        ┃━━━┃         │
│            (ghost + particle trail)                          │
│        ┃━━━┃                    ┃━━━┃                       │
│        ┃   ┃                    ┃   ┃        ┃━━━┃         │
│        ┃   ┃                    ┃   ┃        ┃   ┃         │
│        ┃━━━┃                    ┃━━━┃        ┃━━━┃         │
│                          ☁                                  │
├─────────────────────────────────────────────────────────────┤
│  Score: 7                                    High: 42       │
│                    (Score Bar, 40px height)                  │
└─────────────────────────────────────────────────────────────┘
```

### In-Game HUD Elements

| Element | Position | Behavior |
|---------|----------|----------|
| Score Bar | Bottom, full width | Always visible during gameplay |
| Current score "Score: X" | Left side of Score Bar | Pulses to 1.3× scale for 200ms on increment |
| High score "High: X" | Right side of Score Bar | Updates in real-time if current > high |
| Score popup "+1" | At ghost position | Floats upward, fades over 500ms |
| Pipes (green) | Scrolling right-to-left | 60px wide, 150px gap, darker caps |
| Clouds (white) | Background layer | Semi-transparent, parallax speeds |
| Ghost | Fixed x=300 | Rotates based on velocity, particle trail |

### Score Bar Detail

```
┌─────────────────────────────────────────────────────────────┐
│  Score: 7                                    High: 42       │
└─────────────────────────────────────────────────────────────┘
     ↑                                              ↑
  18px white font                              18px white font
  left-aligned with padding                    right-aligned with padding
  
  Background: #2d2d2d (dark gray)
  Height: 40px
  Text vertically centered
```

---

## Screen 3: Pause Overlay

```
┌─────────────────────────────────────────────────────────────┐
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░░░░░ PAUSED ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░  Press Escape or P to Resume  ░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
├─────────────────────────────────────────────────────────────┤
│  Score: 7                                    High: 42       │
└─────────────────────────────────────────────────────────────┘
```

### Pause Overlay Elements

| Element | Style |
|---------|-------|
| Dark overlay | rgba(0, 0, 0, 0.5) covering entire canvas |
| "PAUSED" text | 36px bold, white, centered |
| Resume prompt | 20px, white, centered below "PAUSED" |
| Game underneath | Frozen (visible through semi-transparent overlay) |

### Interactions

- **Escape / P** → Resume gameplay
- **Space / Click** → Ignored (prevents accidental flap on resume)
- Auto-triggers when browser tab loses focus

---

## Screen 4: Game Over

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                                                             │
│                                                             │
│                      New Best!                              │
│                  (shown if new high score)                   │
│                                                             │
│                     Game Over                               │
│                    (32px bold)                               │
│                                                             │
│                        7                                    │
│                  (64px bold, final score)                    │
│                                                             │
│            Click or Press Space to Restart                   │
│                    (20px font)                               │
│                                                             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Score: 7                                    High: 42       │
└─────────────────────────────────────────────────────────────┘
```

### Game Over Elements

| Element | Position | Font | Condition |
|---------|----------|------|-----------|
| "New Best!" | Center, above "Game Over" | 24px, gold/yellow | Only if score ≥ high score |
| "Game Over" | Center | 32px bold, white | Always |
| Final score | Center, below "Game Over" | 64px bold, white | Always |
| Restart prompt | Center, lower area | 20px, white | Always |
| Score Bar | Bottom | 18px | Shows final score and high score |

### Interactions

- **500ms input lockout** after game over triggers (prevents accidental restart)
- After lockout: **Space / Click / Touch** → Reset all state, transition to Playing
- Screen shows the frozen final frame behind the overlay text (ghost at collision position, pipes frozen)

---

## Color Palette Summary

| Element | Color | Hex |
|---------|-------|-----|
| Background (sky) | Light blue | #87CEEB |
| Pipe body | Forest green | #228B22 |
| Pipe cap | Dark green | #165B16 |
| Pipe stroke | Darker green | #145214 |
| Cloud fill | White | #FFFFFF (40-80% opacity) |
| Score bar background | Dark gray | #2D2D2D |
| Score bar text | White | #FFFFFF |
| Page background (letterbox) | Dark navy | #1A1A2E |
| Ghost fallback | White | #FFFFFF |
| Pause overlay | Black | rgba(0,0,0,0.5) |
| "New Best!" text | Gold | #FFD700 |

---

## Typography

| Context | Font | Size | Weight |
|---------|------|------|--------|
| Game title (menu) | System sans-serif | 48px | Bold |
| High score (menu) | System sans-serif | 20px | Normal |
| Start/restart prompt | System sans-serif | 20px | Normal |
| Score bar | System monospace | 18px | Normal |
| "Game Over" | System sans-serif | 32px | Bold |
| Final score | System sans-serif | 64px | Bold |
| "PAUSED" | System sans-serif | 36px | Bold |
| Score popup "+1" | System sans-serif | 24px | Bold |
| "New Best!" | System sans-serif | 24px | Bold |
