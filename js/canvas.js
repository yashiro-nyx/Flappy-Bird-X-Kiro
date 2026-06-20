// canvas.js - Canvas setup, responsive scaling, viewport fitting
import { CONFIG } from './config.js';

/** @type {HTMLCanvasElement} */
let canvas = null;

/** @type {CanvasRenderingContext2D} */
let ctx = null;

/**
 * Computes the display size that fits the viewport while maintaining
 * the 3:2 aspect ratio and respecting the minimum display size.
 * @param {number} [viewportWidth] - Viewport width (defaults to window.innerWidth)
 * @param {number} [viewportHeight] - Viewport height (defaults to window.innerHeight)
 */
export function computeDisplaySize(viewportWidth = window.innerWidth, viewportHeight = window.innerHeight) {

  // Scale to fit viewport while maintaining aspect ratio
  let displayWidth = viewportWidth;
  let displayHeight = displayWidth / CONFIG.canvas.aspectRatio;

  // If height exceeds viewport, scale by height instead
  if (displayHeight > viewportHeight) {
    displayHeight = viewportHeight;
    displayWidth = displayHeight * CONFIG.canvas.aspectRatio;
  }

  // Enforce minimum display size
  if (displayWidth < CONFIG.canvas.minDisplayWidth) {
    displayWidth = CONFIG.canvas.minDisplayWidth;
    displayHeight = displayWidth / CONFIG.canvas.aspectRatio;
  }
  if (displayHeight < CONFIG.canvas.minDisplayHeight) {
    displayHeight = CONFIG.canvas.minDisplayHeight;
    displayWidth = displayHeight * CONFIG.canvas.aspectRatio;
  }

  return { displayWidth, displayHeight };
}

/**
 * Applies the computed display size to the canvas element and centers it.
 */
function applyDisplaySize() {
  const { displayWidth, displayHeight } = computeDisplaySize();

  canvas.style.width = `${displayWidth}px`;
  canvas.style.height = `${displayHeight}px`;
}

/**
 * Initializes the canvas element with internal resolution and responsive scaling.
 * Gets the canvas element, sets internal resolution to 900×600,
 * computes display size maintaining 3:2 aspect ratio, and centers the canvas.
 */
export function initCanvas() {
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');

  // Set fixed internal resolution
  canvas.width = CONFIG.canvas.width;
  canvas.height = CONFIG.canvas.height;

  // Apply responsive display scaling
  applyDisplaySize();

  // Recompute display scaling on window resize
  window.addEventListener('resize', applyDisplaySize);

  return { canvas, ctx };
}

export { canvas, ctx };
