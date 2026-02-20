/**
 * Mad Hat Maven Orchestration Engine — Web Server
 *
 * Serves the demo UI and exposes SSE endpoints that run the
 * 4-step pipeline with real-time progress updates.
 *
 * The pipeline pauses after Step 2 (pain point expansion) to let the user
 * review and edit pain points before generating copy and strategy.
 *
 * Usage: node server.js
 */

import dotenv from 'dotenv';
dotenv.config({ override: true });

import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { analyzeBrief } from './steps/step1-analyze.js';
import { expandPainPoints } from './steps/step2-painpoints.js';
import { generateCopy } from './steps/step3-copy.js';
import { buildStrategy } from './steps/step4-strategy.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function toSlug(name) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function todayStamp() {
  return new Date().toISOString().split('T')[0];
}

function sendEvent(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

/**
 * Phase 1: Run Steps 1-2 (analysis + pain point expansion), then pause.
 * Returns analysis output via SSE so the front-end can display it,
 * then sends a 'pipeline:paused' event with the pain points for user review.
 */
app.post('/api/run', async (req, res) => {
  const { clientName, brief, brandGuidelines } = req.body;

  if (!clientName || !brief) {
    return res.status(400).json({ error: 'clientName and brief are required.' });
  }

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const slug = toSlug(clientName);

  // Save brief to briefs/ folder
  fs.mkdirSync('briefs', { recursive: true });
  fs.writeFileSync(path.join('briefs', `${slug}.txt`), brief, 'utf-8');

  try {
    // --- Step 1 ---
    sendEvent(res, 'step:start', { step: 1, label: 'Analyzing brief...' });
    const analysis = await analyzeBrief(brief, brandGuidelines);
    sendEvent(res, 'step:done', { step: 1, label: 'Brief Analysis', output: analysis });

    // --- Step 2 ---
    sendEvent(res, 'step:start', { step: 2, label: 'Expanding pain points in consumer voice...' });
    const painPoints = await expandPainPoints(brief, analysis, brandGuidelines);
    sendEvent(res, 'step:done', { step: 2, label: 'Pain Points (Consumer Voice)', output: painPoints });

    // --- Pause: let user review pain points ---
    sendEvent(res, 'pipeline:paused', { analysis, painPoints });
  } catch (err) {
    sendEvent(res, 'pipeline:error', { error: err.message });
  }

  res.end();
});

/**
 * Phase 2: Resume with (possibly edited) pain points, run Steps 3-4.
 * Accepts the full context from Phase 1 plus user-edited pain points.
 */
app.post('/api/resume', async (req, res) => {
  const { clientName, brief, analysis, painPoints, brandGuidelines } = req.body;

  if (!clientName || !brief || !analysis || !painPoints) {
    return res.status(400).json({ error: 'Missing required context to resume pipeline.' });
  }

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const slug = toSlug(clientName);

  try {
    // --- Step 3 ---
    sendEvent(res, 'step:start', { step: 3, label: 'Generating ad copy variations...' });
    const copy = await generateCopy(brief, analysis, painPoints, brandGuidelines);
    sendEvent(res, 'step:done', { step: 3, label: 'Ad Copy Variations', output: copy });

    // --- Step 4 ---
    sendEvent(res, 'step:start', { step: 4, label: 'Building strategy summary...' });
    const strategy = await buildStrategy(brief, analysis, painPoints, copy, brandGuidelines);
    sendEvent(res, 'step:done', { step: 4, label: 'Strategy Summary', output: strategy });

    // --- Save output ---
    const outputPath = path.join('output', `${todayStamp()}-${slug}.md`);
    const finalOutput = `# Mad Hat Maven — Campaign Brief
**Client:** ${clientName}
**Date:** ${todayStamp()}

---

## Strategy Summary

${strategy}

---

## Brief Analysis

${analysis}

---

## Pain Points (Consumer Voice)

${painPoints}

---

## Ad Copy Variations

${copy}
`;

    fs.mkdirSync('output', { recursive: true });
    fs.writeFileSync(outputPath, finalOutput, 'utf-8');

    sendEvent(res, 'pipeline:done', { outputPath });
  } catch (err) {
    sendEvent(res, 'pipeline:error', { error: err.message });
  }

  res.end();
});

app.listen(PORT, () => {
  console.log(`\nMad Hat Maven Orchestration Engine`);
  console.log(`Server running at http://localhost:${PORT}\n`);
});
