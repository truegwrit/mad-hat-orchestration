/**
 * Mad Hat Maven Orchestration Engine
 * Main entry point — runs a client brief through all 4 pipeline steps sequentially.
 *
 * Usage: node index.js
 */

import dotenv from 'dotenv';
dotenv.config({ override: true });
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { analyzeBrief } from './steps/step1-analyze.js';
import { expandPainPoints } from './steps/step2-painpoints.js';
import { generateCopy } from './steps/step3-copy.js';
import { buildStrategy } from './steps/step4-strategy.js';

// --- Helpers ---

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function toSlug(name) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function todayStamp() {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

function log(step, message) {
  console.log(`\n[${step}] ${message}`);
}

// --- Main ---

async function main() {
  console.log('\n========================================');
  console.log('  Mad Hat Maven Orchestration Engine');
  console.log('========================================\n');

  const clientName = await prompt('Client name: ');
  if (!clientName) {
    console.error('No client name provided. Exiting.');
    process.exit(1);
  }

  const slug = toSlug(clientName);
  const briefPath = path.join('briefs', `${slug}.txt`);

  if (!fs.existsSync(briefPath)) {
    console.error(`\nBrief not found: ${briefPath}`);
    console.error(`Drop a file named "${slug}.txt" into the briefs/ folder and try again.`);
    process.exit(1);
  }

  const brief = fs.readFileSync(briefPath, 'utf-8');
  console.log(`\nBrief loaded: ${briefPath} (${brief.length} chars)\n`);
  console.log('Starting pipeline...');

  // --- Step 1: Brief Analysis ---
  log('STEP 1', 'Analyzing brief...');
  const analysis = await analyzeBrief(brief);
  log('STEP 1', 'Done.');

  // --- Step 2: Pain Point Expansion ---
  log('STEP 2', 'Expanding pain points in consumer voice...');
  const painPoints = await expandPainPoints(brief, analysis);
  log('STEP 2', 'Done.');

  // --- Step 3: Copy Generation ---
  log('STEP 3', 'Generating ad copy variations...');
  const copy = await generateCopy(brief, analysis, painPoints);
  log('STEP 3', 'Done.');

  // --- Step 4: Strategy Summary ---
  log('STEP 4', 'Building strategy summary...');
  const strategy = await buildStrategy(brief, analysis, painPoints, copy);
  log('STEP 4', 'Done.');

  // --- Assemble final output ---
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

  console.log('\n========================================');
  console.log(`  Output saved: ${outputPath}`);
  console.log('========================================\n');
}

main().catch((err) => {
  console.error('\nPipeline failed:', err.message);
  process.exit(1);
});
