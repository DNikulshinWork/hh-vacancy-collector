import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { chat, chatJson, stripFences } from '../../src/llm.js';
import * as costFns from '../../src/cost.js';
import { z } from 'zod';

const mockPrices = { input: 10, output: 20 };

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);
vi.spyOn(costFns, 'calculateCost');

describe('tooling/harness/src/llm', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.POLZA_API_KEY = 'test-key';
  });

  afterEach(() => {
    vi.clearAllMocks();
    process.env = originalEnv;
  });

  describe('chat()', () => {
    it('should return text, usage, and cost from API response when cost_rub is present', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Hello' } }],
          usage: { prompt_tokens: 10, completion_tokens: 5, cost_rub: 0.5 },
        }),
      });

      const result = await chat({
        model: 'test-model',
        messages: [],
        maxTokens: 100,
        temperature: 0,
        prices: mockPrices,
      });

      expect(result.text).toBe('Hello');
      expect(result.usage).toEqual({ prompt_tokens: 10, completion_tokens: 5 });
      expect(result.costRub).toBe(0.5);
      expect(costFns.calculateCost).not.toHaveBeenCalled();
    });

    it('should calculate cost as a fallback if not provided in the API response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Hello' } }],
          usage: { prompt_tokens: 10, completion_tokens: 5 }, // no cost_rub
        }),
      });

      vi.mocked(costFns.calculateCost).mockReturnValue(0.0003);

      const result = await chat({
        model: 'test-model',
        messages: [],
        maxTokens: 100,
        temperature: 0,
        prices: mockPrices,
      });

      expect(result.costRub).toBe(0.0003);
      expect(costFns.calculateCost).toHaveBeenCalledWith(10, 5, mockPrices);
    });

    it('should perform retries with exponential backoff on 429 status and then succeed', async () => {
      vi.useFakeTimers();
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          text: async () => 'Too Many Requests',
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Success' } }],
            usage: { prompt_tokens: 1, completion_tokens: 1, cost_rub: 0.1 },
          }),
        });

      const chatPromise = chat({
        model: 'test-model',
        messages: [],
        maxTokens: 100,
        temperature: 0,
        prices: mockPrices,
      });

      await vi.advanceTimersToNextTimerAsync();

      const result = await chatPromise;

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.text).toBe('Success');
      vi.useRealTimers();
    });

    it('should not retry on a 400 client error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Bad Request',
      });

      await expect(
        chat({
          model: 'test-model',
          messages: [],
          maxTokens: 100,
          temperature: 0,
          prices: mockPrices,
        }),
      ).rejects.toThrow('LLM API request failed with status 400: Bad Request');

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if the POLZA_API_KEY is not set', async () => {
      delete process.env.POLZA_API_KEY;
      await expect(
        chat({ model: 'm', messages: [], maxTokens: 1, temperature: 0, prices: mockPrices }),
      ).rejects.toThrow('POLZA_API_KEY environment variable is not set.');
    });
  });

  describe('stripFences()', () => {
    it('should remove markdown fences with a language identifier', () => {
      const text = '```json\n{"key": "value"}\n```';
      expect(stripFences(text)).toBe('{"key": "value"}');
    });

    it('should remove markdown fences without a language identifier', () => {
      const text = '```\n{"key": "value"}\n```';
      expect(stripFences(text)).toBe('{"key": "value"}');
    });

    it('should return the original text if no fences are present', () => {
      const text = '{"key": "value"}';
      expect(stripFences(text)).toBe(text);
    });
  });

  describe('chatJson()', () => {
    it('should retry on invalid JSON, add an error message, and then succeed', async () => {
      const TestSchema = z.object({ success: z.boolean() });

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: '```json\n{"success": tru...}\n```' } }], // Invalid
            usage: { prompt_tokens: 1, completion_tokens: 1, cost_rub: 0.1 },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: '```json\n{"success": true}\n```' } }], // Valid
            usage: { prompt_tokens: 2, completion_tokens: 2, cost_rub: 0.2 },
          }),
        });

      const params = {
        model: 'test-model',
        messages: [{ role: 'user', content: 'Give me JSON' } as const],
        maxTokens: 100,
        temperature: 0,
        prices: mockPrices,
      };

      const result = await chatJson(TestSchema, params);

      expect(result).toEqual({ success: true });
      expect(mockFetch).toHaveBeenCalledTimes(2);

      const secondCallBody = JSON.parse(mockFetch.mock.calls[1][1]?.body as string);
      const lastMessage = secondCallBody.messages[secondCallBody.messages.length - 1];

      expect(lastMessage.role).toBe('user');
      expect(lastMessage.content).toContain('The previous attempt failed with a JSON parsing error');
      expect(lastMessage.content).toContain('Unexpected token');
    });

    it('should throw an error after exhausting retries for invalid JSON', async () => {
      const TestSchema = z.object({ success: z.boolean() });

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'always invalid json' } }],
          usage: { prompt_tokens: 1, completion_tokens: 1, cost_rub: 0.1 },
        }),
      });

      await expect(
        chatJson(TestSchema, {
          model: 'm',
          messages: [],
          maxTokens: 1,
          temperature: 0,
          prices: mockPrices,
        }),
      ).rejects.toThrow('Failed to get a valid JSON response after retry');

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
