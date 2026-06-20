// config.js - All game constants centralized here
export const CONFIG = {
  canvas: {
    width: 900,
    height: 600,
    aspectRatio: 3 / 2,
    minDisplayWidth: 300,
    minDisplayHeight: 200,
  },

  ghost: {
    x: 300,
    startY: 300,
    width: 40,
    height: 40,
    hitboxMargin: 4,
    fallbackRadius: 18,
  },

  physics: {
    gravity: 0.6,
    flapImpulse: -10,
    terminalVelocity: 12,
    targetFPS: 60,
    frameTime: 1000 / 60,
  },

  pipes: {
    width: 60,
    capWidth: 68,
    capHeight: 15,
    gapHeight: 150,
    spacing: 280,
    minTopHeight: 50,
    minBottomHeight: 50,
    baseSpeed: 3,
  },

  difficulty: {
    speedIncrementPerPoint: 0.02,
    maxSpeedMultiplier: 2.0,
    startingMultiplier: 1.0,
  },

  clouds: {
    count: { min: 3, max: 6 },
    width: { min: 80, max: 160 },
    height: { min: 30, max: 60 },
    opacity: { min: 0.4, max: 0.8 },
    speedFactor: { min: 0.3, max: 0.7 },
  },

  particles: {
    emitInterval: 3,
    radius: { min: 2, max: 4 },
    initialOpacity: 0.6,
    lifetime: 400,
    driftSpeed: -1.5,
  },

  scoreBar: {
    height: 40,
    backgroundColor: '#2d2d2d',
    textColor: '#ffffff',
    fontSize: 18,
    pulseScale: 1.3,
    pulseDuration: 200,
  },

  scorePopup: {
    lifetime: 500,
    floatSpeed: -2,
    fontSize: 24,
    color: '#ffffff',
  },

  screenShake: {
    duration: 300,
    maxDisplacement: 5,
  },

  invincibility: {
    duration: 300,
    flashInterval: 100,
    minOpacity: 0.3,
    maxOpacity: 1.0,
  },

  gameOver: {
    inputLockout: 500,
  },

  menu: {
    bobAmplitude: 5,
    bobPeriod: 2000,
    titleFontSize: 48,
    promptFontSize: 20,
  },

  rotation: {
    maxUp: -30 * (Math.PI / 180),
    maxDown: 90 * (Math.PI / 180),
  },

  colors: {
    background: '#87CEEB',
    pipeBody: '#228B22',
    pipeCap: '#165B16',
    pipeStroke: '#145214',
    cloudFill: '#ffffff',
    scoreBarBg: '#2d2d2d',
    scoreBarText: '#ffffff',
    ghostFallback: '#ffffff',
    pauseOverlay: 'rgba(0, 0, 0, 0.5)',
  },

  handDrawn: {
    strokeOffset: { min: 1, max: 3 },
  },

  audio: {
    jumpFile: 'assets/jump.wav',
    gameOverFile: 'assets/game_over.wav',
    scoreTone: {
      startFrequency: 600,
      endFrequency: 900,
      duration: 100,
    },
  },

  storage: {
    highScoreKey: 'flappyKiroHighScore',
  },

  pools: {
    pipeSize: 20,
    particleSize: 50,
  },

  performance: {
    targetFPS: 60,
    slowFrameThreshold: 20,
    slowFrameAlertCount: 10,
  },
};
