// Property-based tests for object pool conservation (Property 14)
// Feature: flappy-kiro
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { ObjectPool } from '../js/entities.js';

const testConfig = { numRuns: 100 };

// Simple factory that creates identifiable objects
let counter = 0;
function createTestObject() {
  return { id: counter++, active: false };
}

function resetCounter() {
  counter = 0;
}

describe('Property 14: Object pool conservation', () => {
  // **Validates: Requirements 13.2, 13.3, 13.5**

  it('pool size never decreases after any sequence of acquire/release operations', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        fc.array(
          fc.oneof(
            fc.constant('acquire'),
            fc.constant('release'),
            fc.constant('releaseAll')
          ),
          { minLength: 1, maxLength: 50 }
        ),
        (initialSize, operations) => {
          resetCounter();
          const pool = new ObjectPool(createTestObject, initialSize);
          let previousSize = pool.pool.length;
          const acquired = [];

          for (const op of operations) {
            if (op === 'acquire') {
              acquired.push(pool.acquire());
            } else if (op === 'release' && acquired.length > 0) {
              const obj = acquired.pop();
              pool.release(obj);
            } else if (op === 'releaseAll') {
              acquired.length = 0;
              pool.releaseAll();
            }

            // Pool size never decreases — objects are reused, not destroyed
            expect(pool.pool.length).toBeGreaterThanOrEqual(previousSize);
            previousSize = pool.pool.length;
          }
        }
      ),
      testConfig
    );
  });

  it('active count matches number of acquired-but-not-released objects', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        fc.array(
          fc.oneof(
            fc.constant('acquire'),
            fc.constant('release'),
            fc.constant('releaseAll')
          ),
          { minLength: 1, maxLength: 50 }
        ),
        (initialSize, operations) => {
          resetCounter();
          const pool = new ObjectPool(createTestObject, initialSize);
          const acquired = [];

          for (const op of operations) {
            if (op === 'acquire') {
              acquired.push(pool.acquire());
            } else if (op === 'release' && acquired.length > 0) {
              const obj = acquired.pop();
              pool.release(obj);
            } else if (op === 'releaseAll') {
              acquired.length = 0;
              pool.releaseAll();
            }

            // Active count always matches logical acquired count
            expect(pool.getActive().length).toBe(acquired.length);
          }
        }
      ),
      testConfig
    );
  });

  it('released objects are reusable — acquire can return the same object', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        (initialSize) => {
          resetCounter();
          const pool = new ObjectPool(createTestObject, initialSize);

          // Acquire an object, note its identity, release it, then re-acquire
          const obj = pool.acquire();
          const objId = obj.id;
          pool.release(obj);

          // After release, pool should be able to hand back the same object
          const reacquired = pool.acquire();
          expect(reacquired.id).toBe(objId);
        }
      ),
      testConfig
    );
  });

  it('releaseAll resets all objects — getActive returns empty and all are reusable', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        fc.integer({ min: 1, max: 20 }),
        (initialSize, acquireCount) => {
          resetCounter();
          const pool = new ObjectPool(createTestObject, initialSize);

          // Acquire several objects
          const count = Math.min(acquireCount, initialSize + 5);
          for (let i = 0; i < count; i++) {
            pool.acquire();
          }

          // releaseAll should reset everything
          pool.releaseAll();

          expect(pool.getActive()).toEqual([]);
          expect(pool.getActive().length).toBe(0);

          // All objects should be available for re-acquisition
          for (let i = 0; i < pool.pool.length; i++) {
            expect(pool.pool[i].active).toBe(false);
          }
        }
      ),
      testConfig
    );
  });

  it('no new allocations when concurrent acquires stay within initial pool size', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 20 }),
        fc.array(
          fc.oneof(
            fc.constant('acquire'),
            fc.constant('release')
          ),
          { minLength: 1, maxLength: 50 }
        ),
        (initialSize, operations) => {
          resetCounter();
          const pool = new ObjectPool(createTestObject, initialSize);
          const originalLength = pool.pool.length;
          const acquired = [];

          for (const op of operations) {
            if (op === 'acquire' && acquired.length < initialSize) {
              // Only acquire when within capacity
              acquired.push(pool.acquire());
            } else if (op === 'release' && acquired.length > 0) {
              const obj = acquired.pop();
              pool.release(obj);
            }
          }

          // Pool array length should remain constant — no new allocations
          expect(pool.pool.length).toBe(originalLength);
        }
      ),
      testConfig
    );
  });
});
