# Audio Assets Specifications

## Overview

Flappy Kiro uses the Web Audio API for sound playback with graceful degradation if audio is unavailable. All sounds are short, retro-styled effects designed to provide satisfying feedback without being distracting.

## Sound Effects

### Flap Sound

- **File**: `assets/jump.wav`
- **Description**: Short whoosh sound triggered on each spacebar press / click
- **Duration**: ~0.1 seconds
- **Character**: Quick upward swoosh, soft and airy to match the ghost theme
- **Playback behavior**: Restart from beginning if triggered while previous instance is still playing (no overlap)
- **Trigger**: Player input (Space key, mouse click, or touch) while Game_State is Playing

### Score Sound

- **File**: Generated via Web Audio API (no file needed)
- **Description**: Pleasant ascending chime when passing through a pipe gap
- **Duration**: ~0.2 seconds
- **Implementation**: OscillatorNode with frequency sweep from 600Hz to 900Hz over 100ms, sine wave, with gain envelope (quick attack, short decay)
- **Character**: Bright, cheerful ascending tone — satisfying without being jarring
- **Trigger**: When a Pipe_Pair's right edge scrolls past the Ghost's horizontal position

### Collision Sound

- **File**: `assets/game_over.wav`
- **Description**: Soft thud indicating the ghost has hit a pipe or boundary
- **Duration**: ~0.3 seconds
- **Character**: Low-frequency impact sound, muted and soft to avoid harsh feedback. Think "gentle bump" rather than "crash"
- **Playback behavior**: One-shot playback (no restart needed — only triggers once per game over)
- **Trigger**: When a collision is detected (game-over event)

## Audio System Design

### Initialization

1. Create `AudioContext` on first user interaction (click/keypress) to comply with browser autoplay policy
2. Fetch and decode `assets/jump.wav` → store as AudioBuffer
3. Fetch and decode `assets/game_over.wav` → store as AudioBuffer
4. If any step fails, set `audioEnabled = false` and continue silently

### Playback Pattern

```
User Input → Check audioEnabled → Create BufferSource → Connect to destination → Start
```

### Score Tone Generation

```
Score Event → Create OscillatorNode (sine wave)
            → Set frequency to 600Hz
            → Schedule linear ramp to 900Hz over 100ms
            → Create GainNode (attack: 0ms, decay: 100ms)
            → Connect oscillator → gain → destination
            → Start, auto-stop after 200ms
```

### Error Handling

| Scenario | Behavior |
|----------|----------|
| AudioContext creation fails | Set `audioEnabled = false`, game continues silently |
| WAV file fetch fails (404) | Set respective buffer to null, skip that sound |
| WAV decoding fails | Set respective buffer to null, skip that sound |
| Autoplay policy blocks | Attempt resume on next user gesture; if still blocked, disable audio |
| Oscillator creation fails | Catch error, skip score tone |

## Audio File Requirements

| File | Format | Sample Rate | Channels | Bit Depth |
|------|--------|-------------|----------|-----------|
| jump.wav | PCM WAV | 44100 Hz | Mono | 16-bit |
| game_over.wav | PCM WAV | 44100 Hz | Mono | 16-bit |

## Volume Levels

All sounds play at default gain (1.0). No volume control UI is implemented in v1. Future consideration: add a mute toggle button.
