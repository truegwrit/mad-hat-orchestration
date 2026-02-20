/**
 * Shared Anthropic client with automatic retry on overloaded (529) errors.
 *
 * The Anthropic API returns 529 when it's temporarily at capacity.
 * This wrapper retries with exponential backoff so the pipeline
 * recovers gracefully instead of failing immediately.
 */

import Anthropic from '@anthropic-ai/sdk';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 5000; // 5 seconds, then 10s, then 20s

export async function callClaude({ model, max_tokens, system, messages }) {
  const client = new Anthropic();

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const message = await client.messages.create({
        model,
        max_tokens,
        system,
        messages
      });
      return message.content[0].text;
    } catch (err) {
      const isOverloaded = err.status === 529 || (err.message && err.message.includes('Overloaded'));

      if (isOverloaded && attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(`    ⏳ API overloaded, retrying in ${delay / 1000}s (attempt ${attempt}/${MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw err;
      }
    }
  }
}
