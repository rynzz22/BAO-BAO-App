/**
 * Universal Test Runner for BAO BAO MVP
 * Provides Jest/Node compatibility and runs unit & e2e test suites.
 */

// Simple assertion helper providing Jest-like expect syntax
function expect(actual: any) {
  return {
    toBe(expected: any) {
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
      }
    },
    toEqual(expected: any) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected deep equality:\nExpected: ${JSON.stringify(expected)}\nReceived: ${JSON.stringify(actual)}`);
      }
    },
    toBeDefined() {
      if (actual === undefined) {
        throw new Error(`Expected value to be defined, but got undefined`);
      }
    },
    toBeUndefined() {
      if (actual !== undefined) {
        throw new Error(`Expected value to be undefined, but got ${JSON.stringify(actual)}`);
      }
    },
    toThrow(expectedError?: any) {
      if (typeof actual !== 'function') {
        throw new Error(`Expected a function, but got ${typeof actual}`);
      }
      let threw = false;
      let errorThrown: any = null;
      try {
        actual();
      } catch (err: any) {
        threw = true;
        errorThrown = err;
      }
      if (!threw) {
        throw new Error(`Expected function to throw, but it did not throw`);
      }
      if (expectedError) {
        if (typeof expectedError === 'function' && !(errorThrown instanceof expectedError)) {
          throw new Error(`Expected instance of ${expectedError.name}, but threw: ${errorThrown}`);
        }
      }
    },
    rejects: {
      async toThrow(expectedError?: any) {
        if (!actual || typeof actual.then !== 'function') {
          throw new Error(`Expected a Promise`);
        }
        let threw = false;
        let errorThrown: any = null;
        try {
          await actual;
        } catch (err: any) {
          threw = true;
          errorThrown = err;
        }
        if (!threw) {
          throw new Error(`Expected promise to reject, but it resolved`);
        }
        if (expectedError && typeof expectedError === 'function' && !(errorThrown instanceof expectedError)) {
          throw new Error(`Expected rejection with ${expectedError.name}, got ${errorThrown}`);
        }
      },
    },
  };
}

(global as any).expect = expect;

let currentSuite = '';
let passed = 0;
let failed = 0;
let beforeHooks: Array<() => void | Promise<void>> = [];

(global as any).describe = (name: string, fn: () => void) => {
  const previousSuite = currentSuite;
  currentSuite = previousSuite ? `${previousSuite} > ${name}` : name;
  const previousBeforeHooks = [...beforeHooks];
  try {
    fn();
  } finally {
    currentSuite = previousSuite;
    beforeHooks = previousBeforeHooks;
  }
};

(global as any).beforeEach = (fn: () => void | Promise<void>) => {
  beforeHooks.push(fn);
};

const testQueue: Array<{ name: string; suite: string; fn: () => void | Promise<void>; hooks: Array<() => void | Promise<void>> }> = [];

(global as any).it = (name: string, fn: () => void | Promise<void>) => {
  testQueue.push({
    name,
    suite: currentSuite,
    fn,
    hooks: [...beforeHooks],
  });
};

async function run() {
  console.log('====================================================');
  console.log('  BAO BAO — Running Test Suites (Unit & E2E)');
  console.log('====================================================\n');

  // Load test suites
  await import('../apps/api/src/modules/rides/ride-state-machine.spec');
  await import('../apps/api/src/modules/sms/sms-command-parser.spec');
  await import('../apps/api/src/modules/location/location-freshness.spec');
  await import('../apps/api/test/e2e-ride-dispatch.spec');

  for (const test of testQueue) {
    try {
      for (const hook of test.hooks) {
        await hook();
      }
      await test.fn();
      passed++;
      console.log(`  ✓ ${test.suite ? test.suite + ' > ' : ''}${test.name}`);
    } catch (err: any) {
      failed++;
      console.error(`  ✗ ${test.suite ? test.suite + ' > ' : ''}${test.name}`);
      console.error(`    Error: ${err.message || err}\n`);
    }
  }

  console.log('\n----------------------------------------------------');
  console.log(`  Tests Passed: ${passed}`);
  console.log(`  Tests Failed: ${failed}`);
  console.log(`  Total:        ${passed + failed}`);
  console.log('----------------------------------------------------');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
