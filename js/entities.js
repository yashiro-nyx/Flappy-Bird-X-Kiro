// entities.js - Object pools and factory functions for game entities
import { CONFIG } from './config.js';

/**
 * Generic object pool that pre-allocates objects and reuses them
 * to avoid garbage collection during gameplay.
 */
export class ObjectPool {
  constructor(factoryFn, initialSize) {
    this.factory = factoryFn;
    this.pool = [];
    for (let i = 0; i < initialSize; i++) {
      const obj = this.factory();
      obj.active = false;
      this.pool.push(obj);
    }
  }

  acquire() {
    for (let i = 0; i < this.pool.length; i++) {
      if (!this.pool[i].active) {
        this.pool[i].active = true;
        return this.pool[i];
      }
    }
    // Pool exhausted — grow by one
    const obj = this.factory();
    obj.active = true;
    this.pool.push(obj);
    return obj;
  }

  release(obj) {
    obj.active = false;
  }

  releaseAll() {
    for (let i = 0; i < this.pool.length; i++) {
      this.pool[i].active = false;
    }
  }

  getActive() {
    return this.pool.filter(obj => obj.active);
  }
}

/**
 * Factory function for Pipe objects.
 */
export function createPipe() {
  return {
    x: 0,
    topHeight: 0,
    bottomY: 0,
    width: CONFIG.pipes.width,
    capWidth: CONFIG.pipes.capWidth,
    capHeight: CONFIG.pipes.capHeight,
    gapCenter: 0,
    scored: false,
    active: false,
  };
}

/**
 * Factory function for Particle objects.
 */
export function createParticle() {
  return {
    x: 0,
    y: 0,
    radius: CONFIG.particles.radius.min,
    opacity: CONFIG.particles.initialOpacity,
    lifetime: CONFIG.particles.lifetime,
    age: 0,
    velocityX: CONFIG.particles.driftSpeed,
    velocityY: 0,
    active: false,
  };
}

/**
 * Factory function for the Ghost (player character).
 */
export function createGhost() {
  return {
    x: CONFIG.ghost.x,
    y: CONFIG.ghost.startY,
    velocity: 0,
    width: CONFIG.ghost.width,
    height: CONFIG.ghost.height,
    rotation: 0,
    sprite: null,
    isInvincible: false,
    invincibleTimer: 0,
    flashVisible: true,
    bobOffset: 0,
    bobTimer: 0,
    centerX: CONFIG.ghost.x + CONFIG.ghost.width / 2,
    centerY: CONFIG.ghost.startY + CONFIG.ghost.height / 2,
    radius: CONFIG.ghost.width / 2 - CONFIG.ghost.hitboxMargin,
  };
}

/**
 * Factory function for Cloud decorations.
 * Opacity correlates with speed: higher opacity = closer/faster,
 * lower opacity = farther/slower (parallax depth effect).
 */
export function createCloud() {
  const width = CONFIG.clouds.width.min + Math.random() * (CONFIG.clouds.width.max - CONFIG.clouds.width.min);
  const height = CONFIG.clouds.height.min + Math.random() * (CONFIG.clouds.height.max - CONFIG.clouds.height.min);

  // Generate a normalized value (0–1) that drives both opacity and speed
  const t = Math.random();

  // Map t linearly to opacity range [0.4, 0.8] and speedFactor range [0.3, 0.7]
  const opacity = CONFIG.clouds.opacity.min + t * (CONFIG.clouds.opacity.max - CONFIG.clouds.opacity.min);
  const speedFactor = CONFIG.clouds.speedFactor.min + t * (CONFIG.clouds.speedFactor.max - CONFIG.clouds.speedFactor.min);

  return {
    x: Math.random() * CONFIG.canvas.width,
    y: Math.random() * (CONFIG.canvas.height - CONFIG.scoreBar.height - height),
    width,
    height,
    speed: CONFIG.pipes.baseSpeed * speedFactor,
    opacity,
    cornerRadius: height / 2,
  };
}

/**
 * Factory function for ScorePopup objects.
 */
export function createScorePopup() {
  return {
    x: 0,
    y: 0,
    opacity: 1,
    lifetime: CONFIG.scorePopup.lifetime,
    age: 0,
    text: '+1',
  };
}

// Pre-allocate pools
export const pipePool = new ObjectPool(createPipe, CONFIG.pools.pipeSize);
export const particlePool = new ObjectPool(createParticle, CONFIG.pools.particleSize);
