import { HarnessConfig } from './config.js';

type LedgerEntry = {
  usage: {
    cost_rub?: number;
    input_tokens?: number;
    output_tokens?: number;
  };
};

export const getLedgerTotalCost = (ledgerJsonl: string): number => {
  return ledgerJsonl
    .split('\n')
    .filter(Boolean)
    .reduce((total, line) => {
      try {
        const entry = JSON.parse(line) as LedgerEntry;
        return total + (entry.usage?.cost_rub ?? 0);
      } catch {
        return total;
      }
    }, 0);
};

export const calculateCost = (
  inputTokens: number,
  outputTokens: number,
  prices: HarnessConfig['prices'],
): number => {
  const inputCost = (inputTokens / 1000) * prices.input;
  const outputCost = (outputTokens / 1000) * prices.output;
  return inputCost + outputCost;
};

export const checkBudgets = (
  currentRunCost: number,
  totalCost: number,
  config: HarnessConfig,
): void => {
  if (currentRunCost > config.runBudgetRub) {
    throw new Error(`Run budget of ${config.runBudgetRub} RUB exceeded.`);
  }
  if (totalCost > config.totalBudgetRub) {
    throw new Error(`Total budget of ${config.totalBudgetRub} RUB exceeded.`);
  }
  if (currentRunCost > config.runBudgetRub * 0.8) {
    process.stderr.write(
      `Run budget is over 80% of ${config.runBudgetRub} RUB.\n`,
    );
  }
  if (totalCost > config.totalBudgetRub * 0.8) {
    process.stderr.write(
      `Total budget is over 80% of ${config.totalBudgetRub} RUB.\n`,
    );
  }
};
