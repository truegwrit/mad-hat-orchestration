/**
 * Step 2 — Pain Point Expansion
 *
 * PURPOSE:
 *   Take the pain points identified in Step 1 and rewrite each one
 *   in the consumer's own voice — the way a frustrated or skeptical
 *   real person would actually say it out loud or type it in a search bar.
 *
 *   This bridges the gap between "what we know hurts them" and
 *   "how they'd describe the hurt themselves."
 *
 * INPUT:
 *   - brief:    the original client brief (string)
 *   - analysis: the output from Step 1 (string)
 *
 * OUTPUT:
 *   Each pain point rewritten as a raw, honest consumer statement.
 *   Format: numbered list, one statement per pain point.
 *
 * CONTEXT PASSED FORWARD:
 *   Both the original analysis and these expanded statements are
 *   passed to Steps 3 and 4 to ground copy and strategy in real language.
 */

import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `You are a strategist at Mad Hat Maven, a creative agency that believes AI gets you close but humans get you there. Your output is direct, human-centered, and free of corporate jargon. Write like a smart person talking to another smart person.`;

export async function expandPainPoints(brief, analysis, brandGuidelines) {
  console.log('  → Rewriting pain points in consumer voice...');

  const guidelinesBlock = brandGuidelines
    ? `\n\n---\n\nBRAND GUIDELINES (use these to understand who the consumer is and how they speak):\n${brandGuidelines}`
    : '';

  const client = new Anthropic();
  const message = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `You've just completed a brief analysis (below). Now take each pain point and rewrite it the way the actual consumer would say it — out loud, in a search bar, or in a frustrated text to a friend.

Rules:
- No marketing language. No polish. Raw and real.
- Each rewrite should sound like a Reddit comment, a Google search, or something muttered at a laptop at 11pm.
- Match the emotional register: frustrated, skeptical, hopeful, overwhelmed — whatever fits.
- Keep it to one or two sentences per pain point.
- Number them to match the original pain points.${brandGuidelines ? '\n- Use the brand guidelines to inform who this consumer is and how they talk.' : ''}

---

ORIGINAL BRIEF:
${brief}

---

STEP 1 ANALYSIS:
${analysis}${guidelinesBlock}`
      }
    ]
  });

  const result = message.content[0].text;
  console.log('  ✓ Pain points expanded.');
  return result;
}
