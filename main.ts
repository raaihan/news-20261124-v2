// news-image-20261124 v2 — "HUANG IS BACK", Tuesday 24 November 2026.
// Node 22, standard library only.
//
// The entry image lives beside this file as news-20261124-v2.png. This
// program hands it to the grader: it checks the file is really a PNG of
// exactly 1024 by 1024 pixels and at most 1 MiB (the competition gate),
// pins the source to the committed deterministic asset by its sha256,
// copies it to entry.png in the output directory, and then proves the
// copy byte-for-byte identical to the source before reporting success.
// No network, no clock, no randomness: any two runs write the same bytes.
//
//   MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const MAX_BYTES = 1_048_576;
const MAX_EDGE = 1024;
// sha256 of the committed news-20261124-v2.png; the run is deterministic,
// so the source, the copy, and this digest must all agree.
const EXPECTED_SHA256 =
  '0d069faea1aa03ea627fb1381fc2412ab874be0c7c9d03f6bda4475d605c3f1d';
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const sourcePath = new URL('./news-20261124-v2.png', import.meta.url);
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const outputPath = join(outputDir, 'entry.png');

function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function checkPng(bytes: Buffer): { width: number; height: number } {
  if (bytes.length < 33) {
    throw new Error(`image too small to be a PNG: ${bytes.length} bytes`);
  }
  if (!bytes.subarray(0, 8).equals(PNG_MAGIC)) {
    throw new Error('image does not start with the PNG signature');
  }
  if (bytes.toString('ascii', 12, 16) !== 'IHDR') {
    throw new Error('first PNG chunk is not IHDR');
  }
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  if (width !== MAX_EDGE || height !== MAX_EDGE) {
    throw new Error(
      `image is ${width}x${height}, expected exactly ${MAX_EDGE}x${MAX_EDGE}`,
    );
  }
  return { width, height };
}

const sourceBytes = readFileSync(sourcePath);
if (sourceBytes.length > MAX_BYTES) {
  throw new Error(`image is ${sourceBytes.length} bytes, over the 1 MiB limit`);
}
const { width, height } = checkPng(sourceBytes);
if (sha256(sourceBytes) !== EXPECTED_SHA256) {
  throw new Error('source image does not match the committed deterministic asset');
}

mkdirSync(outputDir, { recursive: true });
copyFileSync(sourcePath, outputPath);

const written = readFileSync(outputPath);
if (
  written.length !== sourceBytes.length ||
  sha256(written) !== sha256(sourceBytes) ||
  sha256(written) !== EXPECTED_SHA256
) {
  throw new Error('entry.png does not match the source image after copying');
}

console.log(
  `entry.png written: ${width}x${height}, ${written.length} bytes, sha256 ${sha256(written)}`,
);
