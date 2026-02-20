/**
 * Shared Anthropic client with automatic retry on overloaded (529) errors.
 *
 * The SDK already retries 529/5xx errors twice by default. We extend this
 * with maxRetries: 4 (= 5 total attempts with longer backoff) and add
 * an additional application-level retry loop on top.
 *
 * If the API is still overloaded after all retries, we surface a clean
 * human-readable error instead of raw JSON.
 */

import Anthropic from '@anthropic-ai/sdk';

const APP_RETRIES = 2;
const RETRY_DELAY_MS = 10000; // 10 seconds between app-level retries

export async function callClaude({ model, max_tokens, system, messages }) {
  // SDK retries 529/5xx automatically up to maxRetries times with backoff
  const client = new Anthropic({ maxRetries: 4 });

  for (let attempt = 1; attempt <= APP_RETRIES; attempt++) {
    try {
      const message = await client.messages.create({
        model,
        max_tokens,
        system,
        messages
      });
      return message.content[0].text;
    } catch (err) {
      const isOverloaded = err.status === 529 ||
        (err.message && err.message.includes('Overloaded'));

      if (isOverloaded && attempt < APP_RETRIES) {
        console.log(`    ⏳ API overloaded after SDK retries, waiting ${RETRY_DELAY_MS / 1000}s before attempt ${attempt + 1}/${APP_RETRIES}...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      } else if (isOverloaded) {
        // All retries exhausted — throw a clean, user-friendly error
        throw new Error('The AI service is temporarily at capacity. Please wait a minute and try again.');
      } else {
        throw err;
      }
    }
  }
}
