import { describe, it, expect } from 'vitest';
import { HarnessConfigSchema } from '../../src/config.js';

describe('HarnessConfigSchema', () => {
  it('should validate a correct config', () => {
    const config = {
      runBudgetRub: 100,
      totalBudgetRub: 1000,
      prices: {
        input: 0.5,
        output: 1.5,
      },
    };
    expect(() => HarnessConfigSchema.parse(config)).not.toThrow();
  });

  it('should throw on invalid config', () => {
    const config = {
      runBudgetRub: -100, // Invalid
      totalBudgetRub: 1000,
      prices: {
        input: 0.5,
        output: 1.5,
      },
    };
    expect(() => HarnessConfigSchema.parse(config)).toThrow();
  });
});
