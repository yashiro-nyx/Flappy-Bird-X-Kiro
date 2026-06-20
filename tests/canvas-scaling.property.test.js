// Property-based tests for canvas scaling (Property 1)
// Feature: flappy-kiro
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { CONFIG } from '../js/config.js';
import { computeDisplaySize } from '../js/canvas.js';

const testConfig = { numRuns: 100 };

describe('Property 1: Canvas scaling maintains aspect ratio and fits viewport', () => {
  // **Validates: Requirements 1.1, 9.1, 9.4**

  it('display aspect ratio is always 3:2 for any viewport dimensions', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 1, max: 10000 }),
        (viewportWidth, viewportHeight) => {
          const { displayWidth, displayHeight } = computeDisplaySize(viewportWidth, viewportHeight);

          const aspectRatio = displayWidth / displayHeight;
          expect(aspectRatio).toBeCloseTo(CONFIG.canvas.aspectRatio, 5);
        }
      ),
      testConfig
    );
  });

  it('display size fits within viewport bounds (except when minimum size applies)', () => {
    fc.assert(
      fc.property(
        // Use viewport sizes large enough that minimum size constraints don't apply
        fc.integer({ min: CONFIG.canvas.minDisplayWidth, max: 10000 }),
        fc.integer({ min: CONFIG.canvas.minDisplayHeight, max: 10000 }),
        (viewportWidth, viewportHeight) => {
          const { displayWidth, displayHeight } = computeDisplaySize(viewportWidth, viewportHeight);

          // When viewport is large enough for minimum size, display must fit within viewport
          expect(displayWidth).toBeLessThanOrEqual(viewportWidth);
          expect(displayHeight).toBeLessThanOrEqual(viewportHeight);
        }
      ),
      testConfig
    );
  });

  it('display size is at least minimum 300x200 for any viewport dimensions', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 1, max: 10000 }),
        (viewportWidth, viewportHeight) => {
          const { displayWidth, displayHeight } = computeDisplaySize(viewportWidth, viewportHeight);

          expect(displayWidth).toBeGreaterThanOrEqual(CONFIG.canvas.minDisplayWidth);
          expect(displayHeight).toBeGreaterThanOrEqual(CONFIG.canvas.minDisplayHeight);
        }
      ),
      testConfig
    );
  });

  it('display size is maximized to fit viewport while maintaining aspect ratio', () => {
    fc.assert(
      fc.property(
        // Use viewport sizes large enough that minimum size constraints don't apply
        fc.integer({ min: CONFIG.canvas.minDisplayWidth + 1, max: 10000 }),
        fc.integer({ min: CONFIG.canvas.minDisplayHeight + 1, max: 10000 }),
        (viewportWidth, viewportHeight) => {
          const { displayWidth, displayHeight } = computeDisplaySize(viewportWidth, viewportHeight);

          // The display must touch at least one edge of the viewport (maximized fit)
          // Either displayWidth equals viewportWidth, or displayHeight equals viewportHeight
          const touchesWidth = Math.abs(displayWidth - viewportWidth) < 0.01;
          const touchesHeight = Math.abs(displayHeight - viewportHeight) < 0.01;
          expect(touchesWidth || touchesHeight).toBe(true);
        }
      ),
      testConfig
    );
  });
});
