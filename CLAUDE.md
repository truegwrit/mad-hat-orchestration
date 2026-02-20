# Mad Hat Maven Orchestration Engine

## What This Is

A Node.js CLI pipeline that takes a client brief and runs it through four sequential AI-powered steps to produce a complete campaign brief. Each step builds on the last — the output is a single markdown file ready for a strategist or creative director to act on.

## Architecture

```
mad-hat-orchestration/
├── index.js              # Entry point: prompts for client name, orchestrates the pipeline
├── steps/
│   ├── step1-analyze.js  # Brief Analysis
│   ├── step2-painpoints.js # Pain Point Expansion
│   ├── step3-copy.js     # Ad Copy Generation
│   └── step4-strategy.js # Strategy Summary
├── briefs/               # Drop client brief .txt files here (filename = client slug)
├── output/               # Final markdown files saved here (YYYY-MM-DD-client-slug.md)
├── .env                  # ANTHROPIC_API_KEY lives here
└── CLAUDE.md             # This file
```

## How to Run

```bash
# 1. Add your API key to .env
# 2. Drop a brief into briefs/ (e.g. briefs/acme-corp.txt)
# 3. Run:
node index.js
# When prompted, enter the client name (e.g. "Acme Corp")
```

## Pipeline Steps

Each step receives the original brief plus all prior step outputs as context. Steps are sequential — each one informs the next.

### Step 1 — Brief Analysis (`step1-analyze.js`)
**Input:** Raw client brief text
**Output:** Structured intelligence — industry, target audience, 3–5 pain points, key differentiators
**Purpose:** Ground truth extraction. Everything downstream builds from this.

### Step 2 — Pain Point Expansion (`step2-painpoints.js`)
**Input:** Brief + Step 1 analysis
**Output:** Each pain point rewritten in the consumer's authentic voice (frustrated, skeptical, real)
**Purpose:** Bridges strategic insight with human language. Copy written from this is more resonant.

### Step 3 — Copy Generation (`step3-copy.js`)
**Input:** Brief + Steps 1–2 outputs
**Output:** For each pain point: 3 copy variations — social, search, video script opener
**Purpose:** Produces ready-to-review executions across the three highest-leverage channels.

### Step 4 — Strategy Summary (`step4-strategy.js`)
**Input:** Brief + Steps 1–3 outputs
**Output:** One-page campaign brief — positioning, channel priority, tone guidance, optional brave idea
**Purpose:** The deliverable. Senior-strategist-level synthesis, not a template fill-in.

## Voice and Tone (All Claude Calls)

> "You are a strategist at Mad Hat Maven, a creative agency that believes AI gets you close but humans get you there. Your output is direct, human-centered, and free of corporate jargon. Write like a smart person talking to another smart person."

This system prompt is used as the base for every Claude API call. Steps may add specific instructions on top.

## Tech Stack

- **Runtime:** Node.js (ES modules — `"type": "module"` in package.json)
- **AI:** Anthropic SDK (`@anthropic-ai/sdk`)
- **Config:** `dotenv` for API key management
- **No framework** — clean scripts only

## Output Format

Final files are saved to `output/` as:
```
YYYY-MM-DD-client-name-slug.md
```

Each file contains all four step outputs under clearly labeled headings, preceded by client name and date.

## Brief File Naming

Brief files in `briefs/` must match the client name slug:
- Client name: `Acme Corp` → file: `briefs/acme-corp.txt`
- Client name: `Dr. Sleep Well` → file: `briefs/dr-sleep-well.txt`

Slugging rules: lowercase, spaces to hyphens, non-alphanumeric characters removed.
