import test from 'node:test';
import assert from 'node:assert/strict';

import { filterReleasedQuestions, isQuestionReleased } from '../src/utils/questionSchedule.js';

const now = new Date('2026-01-10T12:00:00Z');

const questions = [
  { id: 'q1', position: 0, available_at: '2026-01-10T00:00:00Z' },
  { id: 'q2', position: 1, available_at: '2026-01-11T00:00:00Z' },
  { id: 'q3', position: 2, available_at: '2026-01-12T00:00:00Z' },
  { id: 'q4', position: 3 },
];

test('released questions are visible only when available_at is reached', () => {
  assert.equal(isQuestionReleased(questions[0], now), true);
  assert.equal(isQuestionReleased(questions[1], now), false);
  assert.equal(isQuestionReleased(questions[3], now), true);
});

test('filterReleasedQuestions keeps only currently released items', () => {
  const visible = filterReleasedQuestions(questions, now);
  assert.deepEqual(visible.map((q) => q.id), ['q1', 'q4']);
});
