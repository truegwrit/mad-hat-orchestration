/**
 * Step 4 — Strategy Summary
 *
 * PURPOSE:
 *   Synthesize everything from Steps 1–3 into a one-page campaign brief
 *   a strategist or creative director can hand to a client or a team.
 *
 *   Covers:
 *   - Positioning statement (who this is for, what it does, why it matters)
 *   - Recommended channel priority (where to spend attention first and why)
 *   - Tone guidance (voice, energy, what to avoid)
 *   - Optional: one "brave idea" — a creative angle worth exploring
 *
 * INPUT:
 *   - brief:      the original client brief (string)
 *   - analysis:   Step 1 output (string)
 *   - painPoints: Step 2 output (string)
 *   - copy:       Step 3 output (string)
 *
 * OUTPUT:
 *   A one-page strategy brief in clean, readable markdown.
 *   Opinionated but grounded — not a list of hedged suggestions.
 *
 * FINAL STEP:
 *   This output is the last section of the saved markdown file.
 */

import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `You are a strategist at Mad Hat Maven, a creative agency that believes AI gets you close but humans get you there. Your output is direct, human-centered, and free of corporate jargon. Write like a smart person talking to another smart person.`;

export async function buildStrategy(brief, analysis, painPoints, copy, brandGuidelines) {
  console.log('  → Synthesizing strategy from all inputs...');

  const guidelinesBlock = brandGuidelines
    ? `\n\n---\n\nBRAND GUIDELINES (the strategy must align with these — tone guidance should incorporate and build on these rules, not contradict them):\n${brandGuidelines}`
    : '';

  const client = new Anthropic();
  const message = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `You have the full picture: the client brief, the analysis, the consumer-voice pain points, and the ad copy.${brandGuidelines ? ' You also have the client\'s brand guidelines — your strategy must align with and build on these.' : ''} Now write a one-page campaign strategy brief.

This should read like it was written by a senior strategist — opinionated, grounded, and useful. Not a template. Not a list of hedged suggestions. Someone should be able to hand this to a creative director or a client and have them nod.

Include these sections:

### Positioning Statement
One crisp paragraph. Who this is for, what the offering does, and why it matters right now.

### Channel Priority
Where to focus first and why. Rank the channels (social, search, video) based on what the data and copy suggest. Include a brief rationale for the top pick.

### Tone Guidance
How the brand should sound across all channels. What energy to bring. What to avoid. Be specific — "authentic" is not a direction, "sounds like your smartest friend who happens to work in the industry" is.${brandGuidelines ? ' Incorporate the brand guidelines into this section — build on them, don\'t contradict them.' : ''}

### The Brave Idea (Optional)
If there's one creative angle worth exploring — something a bit unexpected, a campaign hook, a positioning move — put it here. One paragraph max. If nothing stands out, skip this section entirely.

---

ORIGINAL BRIEF:
${brief}

---

STEP 1 ANALYSIS:
${analysis}

---

STEP 2 PAIN POINTS (CONSUMER VOICE):
${painPoints}

---

STEP 3 AD COPY:
${copy}${guidelinesBlock}`
      }
    ]
  });

  const result = message.content[0].text;
  console.log('  ✓ Strategy complete.');
  return result;
}
