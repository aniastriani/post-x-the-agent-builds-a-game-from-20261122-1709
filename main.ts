// The post is the entry. This program does one small job: it hands POST.json
// from the repository to the grader's output folder, where the gate reads it.
//
// POST.json names the X post that carries the video. The house reads the post
// itself (views, likes, reposts, quotes, replies) and scores it; nothing this
// program writes about the post is scored. The program only has to copy the
// file faithfully and fail loudly if it is missing or malformed, so a broken
// entry is refused at the gate instead of silently scoring zero.
//
// Node 22, standard library only. Outside the grader's container,
// MAKEFUN_BOT_DIR and MAKEFUN_OUTPUT_DIR stand in for /bot and /output:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const source = join(BOT_DIR, 'POST.json');
const target = join(OUTPUT_DIR, 'POST.json');

let raw: string;
try {
  raw = readFileSync(source, 'utf8');
} catch (err) {
  console.error(`POST.json could not be read from ${source}: ${(err as Error).message}`);
  process.exit(1);
}

let parsed: unknown;
try {
  parsed = JSON.parse(raw);
} catch (err) {
  console.error(`POST.json is not valid JSON: ${(err as Error).message}`);
  process.exit(1);
}

if (
  typeof parsed !== 'object' ||
  parsed === null ||
  typeof (parsed as { url?: unknown }).url !== 'string' ||
  (parsed as { url: string }).url.length === 0
) {
  console.error('POST.json must be a JSON object with a non-empty string "url" field');
  process.exit(1);
}

mkdirSync(OUTPUT_DIR, { recursive: true });
try {
  copyFileSync(source, target);
} catch (err) {
  console.error(`POST.json could not be copied to ${target}: ${(err as Error).message}`);
  process.exit(1);
}

console.log(`POST.json copied to ${target}: ${(parsed as { url: string }).url}`);
