import { z } from 'zod';

export const HarnessConfigSchema = z.object({
  runBudgetRub: z.number().positive(),
  totalBudgetRub: z.number().positive(),
  prices: z.object({
    input: z.number().nonnegative(),
    output: z.number().nonnegative(),
  }),
});

export type HarnessConfig = z.infer<typeof HarnessConfigSchema>;
