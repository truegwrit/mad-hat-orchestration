/**
 * Step 1 — Brief Analysis
 *
 * PURPOSE:
 *   Read the raw client brief and extract structured intelligence:
 *   - Industry / market category
 *   - Target audience (who this is for)
 *   - Core pain points (3–5 problems the product/service solves)
 *   - Product/service differentiators (what makes it stand out)
 *
 * INPUT:  raw brief text (string)
 * OUTPUT: structured analysis (string — formatted markdown or clean prose)
 *
 * CONTEXT PASSED FORWARD:
 *   This output is included in every subsequent step as accumulated context.
 */

import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `You are a strategist at Mad Hat Maven, a creative agency that believes AI gets you close but humans get you there. Your output is direct, human-centered, and free of corporate jargon. Write like a smart person talking to another smart person.`;

export async function analyzeBrief(brief, brandGuidelines) {
  console.log('  → Sending brief to Claude for analysis...');

  const guidelinesBlock = brandGuidelines
    ? `\n\n---\n\nBRAND GUIDELINES (use these to inform your understanding of tone, audience, and positioning):\n${brandGuidelines}`
    : '';

  const client = new Anthropic();
  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Analyze the following client brief and extract structured intelligence. Be specific and grounded — only pull what's actually in the brief or can be directly inferred.${brandGuidelines ? ' Factor in the provided brand guidelines when assessing audience and positioning.' : ''}

Return your analysis in this format:

**Industry / Market Category:**
(one line)

**Target Audience:**
(who this is for — be specific about demographics, psychographics, or situation)

**Core Pain Points:**
(3–5 numbered problems the product/service addresses)

**Key Differentiators:**
(what makes this offering stand out from alternatives)

---

CLIENT BRIEF:
${brief}${guidelinesBlock}`
      }
    ]
  });

  const result = message.content[0].text;
  console.log('  ✓ Analysis complete.');
  return result;
}
