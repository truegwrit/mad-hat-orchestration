/**
 * Mad Hat Maven Orchestration Engine — Web Server
 *
 * Serves the demo UI and exposes an SSE endpoint that runs the
 * 4-step pipeline with real-time progress updates.
 *
 * Usage: node server.js
 */

import dotenv from 'dotenv';
dotenv.config({ override: true });

import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { analyzeBrief } from './steps/step1-analyze.js';
import { expandPainPoints } from './steps/step2-painpoints.js';
import { generateCopy } from './steps/step3-copy.js';
import { buildStrategy } from './steps/step4-strategy.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'madhat';

app.use(express.json());

// --- Auth: password gate ---
const sessions = new Set();

function requireAuth(req, res, next) {
  const token = req.headers['x-auth-token'];
  if (token && sessions.has(token)) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === DEMO_PASSWORD) {
    const token = crypto.randomUUID();
    sessions.add(token);
    return res.json({ token });
  }
  return res.status(401).json({ error: 'Wrong password.' });
});

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

app.post('/api/run', requireAuth, async (req, res) => {
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

## Step 1: Brief Analysis

${analysis}

---

## Step 2: Pain Points (Consumer Voice)

${painPoints}

---

## Step 3: Ad Copy Variations

${copy}

---

## Step 4: Strategy Summary

${strategy}
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
