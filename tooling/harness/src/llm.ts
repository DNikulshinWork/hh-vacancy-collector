import { z } from 'zod';
import { calculateCost } from './cost.js';

// --- Type Definitions ---

type ModelPrices = { input: number; output: number };
type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };
type ChatParams = {
  model: string;
  messages: ChatMessage[];
  maxTokens: number;
  temperature: number;
  prices: ModelPrices;
};
type ChatUsage = { prompt_tokens: number; completion_tokens: number };
type ChatResult = { text: string; usage: ChatUsage; costRub: number };
type PolzaApiResponse = {
  choices: Array<{ message: { content: string } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number; cost_rub?: number };
};

// --- Environment and Constants ---

const POLZA_BASE_URL = process.env.POLZA_BASE_URL || 'https://polza.ai/api/v1';
const MAX_RETRIES = 3;

// --- Helper Functions ---

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Core Logic ---

export async function chat(params: ChatParams): Promise<ChatResult> {
  const { model, messages, maxTokens, temperature, prices } = params;
  const apiKey = process.env.POLZA_API_KEY;

  if (!apiKey) {
    throw new Error('POLZA_API_KEY environment variable is not set.');
  }

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    let response;
    try {
      response = await fetch(`${POLZA_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: maxTokens,
          temperature,
          stream: false,
        }),
      });
    } catch (error) {
      lastError = error as Error;
      if (attempt < MAX_RETRIES) {
        await delay(2 ** attempt * 1000);
        continue;
      }
      break; // Exhausted retries on network error, break to throw final error
    }

    if (response.ok) {
      const data = (await response.json()) as PolzaApiResponse;
      const text = data.choices[0]?.message?.content ?? '';
      const usage: ChatUsage = {
        prompt_tokens: data.usage?.prompt_tokens ?? 0,
        completion_tokens: data.usage?.completion_tokens ?? 0,
      };
      const costRub =
        data.usage?.cost_rub ?? calculateCost(usage.prompt_tokens, usage.completion_tokens, prices);
      return { text, usage, costRub };
    }

    // --- Handle non-OK responses ---
    const responseBody = await response.text();
    const status = response.status;
    lastError = new Error(`LLM API request failed with status ${status}: ${responseBody}`);

    const isRetryable = status === 429 || status >= 500;

    if (isRetryable) {
      if (attempt < MAX_RETRIES) {
        await delay(2 ** attempt * 1000);
        continue; // Go to the next attempt
      }
    } else {
      // For non-retryable client errors, throw immediately.
      throw lastError;
    }
  }

  throw new Error(`LLM call failed after ${MAX_RETRIES} attempts. Last error: ${lastError?.message ?? 'Unknown error'}`);
}

export function stripFences(text: string): string {
  const match = /^```(?:[a-zA-Z]*)?\n([\s\S]+?)\n```$/.exec(text.trim());
  return match?.[1] ?? text;
}

function tryParse<T extends z.ZodType>(
  text: string,
  schema: T,
): { ok: true; data: z.infer<T> } | { ok: false; error: string } {
  try {
    const parsedJson = JSON.parse(text);
    const data = schema.parse(parsedJson);
    return { ok: true, data };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown parsing error occurred.';
    return { ok: false, error: errorMessage };
  }
}

export async function chatJson<T extends z.ZodType>(
  schema: T,
  params: ChatParams,
): Promise<z.infer<T>> {
  let lastParseError: string | undefined;

  for (let i = 0; i < 2; i++) {
    const currentMessages = [...params.messages];
    if (lastParseError) {
      currentMessages.push({
        role: 'user',
        content: `The previous attempt failed with a JSON parsing error. Please correct your output and provide only valid JSON. Error: ${lastParseError}`,
      });
    }

    const { text } = await chat({ ...params, messages: currentMessages });
    const cleanedText = stripFences(text);
    const result = tryParse(cleanedText, schema);

    if (result.ok) {
      return result.data;
    }
    lastParseError = result.error;
  }

  throw new Error(`Failed to get a valid JSON response after retry. Last error: ${lastParseError}`);
}
