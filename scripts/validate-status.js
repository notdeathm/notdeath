#!/usr/bin/env node
import fs from 'fs/promises';

function fail(message, code = 2) {
  console.error('VALIDATOR ERROR:', message);
  process.exit(code);
}

async function main() {
  let raw;
  try {
    raw = await fs.readFile('status.json', 'utf8');
  } catch (e) {
    fail('Could not read status.json: ' + e.message, 2);
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    fail('status.json is not valid JSON: ' + e.message, 2);
  }

  // Basic schema checks with clear messages
  if (!data || typeof data !== 'object') fail('status.json must be an object');
  if (!('status' in data)) fail("status.json missing required top-level field 'status'");
  if (typeof data.status !== 'string') fail("status.json 'status' must be a string");
  if (!('updated_at' in data)) fail("status.json missing required 'updated_at' field");
  if (isNaN(Date.parse(data.updated_at))) fail("status.json 'updated_at' is not a valid ISO date");

  if (!('components' in data)) fail("status.json missing 'components' field (should be an array)");
  if (!Array.isArray(data.components)) fail("status.json 'components' must be an array");

  for (const [i, c] of data.components.entries()) {
    if (!c.id) fail(`component at index ${i} missing 'id'`);
    if (!c.name) fail(`component '${c.id || i}' missing 'name'`);
    if (!c.status) fail(`component '${c.id}' missing 'status'`);
  }

  console.log('status.json looks valid');
}

// Run and catch any unhandled errors with stack traces for CI visibility
main().catch(err => {
  console.error('Unhandled validator error:', err && err.stack ? err.stack : String(err));
  process.exit(1);
});
