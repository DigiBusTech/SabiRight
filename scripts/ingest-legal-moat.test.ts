import assert from 'node:assert/strict';
import test from 'node:test';
import { splitIntoChunks } from './ingest-legal-moat.js';

test('splits long legal text into bounded chunks with overlap', () => {
  const text = `${'Section 1 establishes the rule. '.repeat(8)}\n${'Section 2 sets out an exception. '.repeat(8)}`;
  const chunks = splitIntoChunks(text, 100, 20);

  assert.ok(chunks.length > 1);
  assert.ok(chunks.every(chunk => chunk.length <= 100));
  assert.ok(chunks.some(chunk => chunk.includes('Section 1')));
  assert.ok(chunks.some(chunk => chunk.includes('Section 2')));
  for (let index = 1; index < chunks.length; index++) {
    assert.ok(chunks[index - 1].slice(-20).split(' ').some(word => chunks[index].startsWith(word)));
  }
});

test('returns no chunks for blank pages', () => {
  assert.deepEqual(splitIntoChunks(' \r\n\t '), []);
});
