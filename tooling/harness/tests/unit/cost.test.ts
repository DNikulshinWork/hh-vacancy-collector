
import { describe, it, expect, vi } from 'vitest';
import {
  getLedgerTotalCost,
  calculateCost,
  checkBudgets,
} from '../../src/cost.js';

describe('cost functions', () => {
  describe('getLedgerTotalCost', () => {
    it('should correctly calculate the total cost from a ledger file', () => {
      const ledgerJsonl = `
        {"usage": {"cost_rub": 10}}
        {"usage": {"cost_rub": 5.5}}
        {"usage": {}}
        invalid json
      `;
      expect(getLedgerTotalCost(ledgerJsonl)).toBe(15.5);
    });
  });

  describe('calculateCost', () => {
    it('should correctly calculate the cost based on token usage', () => {
      const prices = { input: 0.5, output: 1.5 };
      expect(calculateCost(1000, 2000, prices)).toBe(3.5);
    });
  });

  describe('checkBudgets', () => {
    const config = {
      runBudgetRub: 100,
      totalBudgetRub: 1000,
      prices: { input: 0.5, output: 1.5 },
    };

    it('should not throw or warn if budgets are within limits', () => {
      const stderrWriteSpy = vi.spyOn(process.stderr, 'write');
      checkBudgets(50, 500, config);
      expect(stderrWriteSpy).not.toHaveBeenCalled();
    });

    it('should warn if the run budget is over 80%', () => {
      const stderrWriteSpy = vi.spyOn(process.stderr, 'write');
      checkBudgets(85, 500, config);
      expect(stderrWriteSpy).toHaveBeenCalledWith('Run budget is over 80% of 100 RUB.\n');
      stderrWriteSpy.mockRestore();
    });

    it('should warn if the total budget is over 80%', () => {
      const stderrWriteSpy = vi.spyOn(process.stderr, 'write');
      checkBudgets(50, 850, config);
      expect(stderrWriteSpy).toHaveBeenCalledWith(
        'Total budget is over 80% of 1000 RUB.\n',
      );
      stderrWriteSpy.mockRestore();
    });

    it('should throw if the run budget is exceeded', () => {
      expect(() => checkBudgets(110, 500, config)).toThrow(
        'Run budget of 100 RUB exceeded.',
      );
    });

    it('should throw if the total budget is exceeded', () => {
      expect(() => checkBudgets(50, 1100, config)).toThrow(
        'Total budget of 1000 RUB exceeded.',
      );
    });
  });
});
