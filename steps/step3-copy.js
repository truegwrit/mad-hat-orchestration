/**
 * Step 3 — Ad Copy Generation
 *
 * PURPOSE:
 *   For each pain point (in consumer voice from Step 2), generate
 *   3 distinct ad copy variations targeting different channels:
 *
 *   A) Social — short, punchy, scroll-stopping (fits in a caption or card)
 *   B) Search — intent-driven, benefit-forward (fits a headline + description)
 *   C) Video script opener — hooks the viewer in the first 5 seconds
 *
 * INPUT:
 *   - brief:      the original client brief (string)
 *   - analysis:   Step 1 output — industry, audience, differentiators (string)
 *   - painPoints: Step 2 output — pain points in consumer voice (string)
 *
 * OUTPUT:
 *   For each pain point: a labeled set of 3 copy variations.
 *   Format: structured markdown — one section per pain point.
 *
 * CONTEXT PASSED FORWARD:
 *   The full copy block is included in Step 4 so the strategy
 *   summary can reference specific angles and executions.
 */

import { callClaude } from './claude-client.js';

const SYSTEM_PROMPT = `You are a strategist at Mad Hat Maven, a creative agency that believes AI gets you close but humans get you there. Your output is direct, human-centered, and free of corporate jargon. Write like a smart person talking to another smart person.`;

export async function generateCopy(brief, analysis, painPoints, brandGuidelines) {
  console.log('  → Generating copy for each pain point...');

  const guidelinesBlock = brandGuidelines
    ? `\n\n---\n\nBRAND GUIDELINES (all copy MUST comply with these — tone, voice, restrictions, and audience rules take priority):\n${brandGuidelines}`
    : '';

  const result = await callClaude({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Using the brief analysis and consumer-voice pain points below, generate ad copy variations for each pain point.${brandGuidelines ? ' IMPORTANT: All copy must be filtered through the provided brand guidelines — match the specified tone, voice, and audience rules exactly.' : ''}

For EACH pain point, write exactly 3 variations:

**A) Social** — Short, punchy, scroll-stopping. Fits a caption or card. Think: the thing that makes someone stop mid-scroll and screenshot it.

**B) Search** — Intent-driven, benefit-forward. Write a headline (max 30 chars) + description (max 90 chars). This is for someone actively looking for a solution.

**C) Video Script Opener** — The first 5 seconds of a video ad. Hook the viewer hard enough that they don't skip. Write it as a spoken line or scene direction.

Format as markdown with a ### heading per pain point, then A/B/C sub-sections.

---

ORIGINAL BRIEF:
${brief}

---

STEP 1 ANALYSIS:
${analysis}

---

STEP 2 PAIN POINTS (CONSUMER VOICE):
${painPoints}${guidelinesBlock}`
      }
    ]
  });

  console.log('  ✓ Copy generation complete.');
  return result;
}
